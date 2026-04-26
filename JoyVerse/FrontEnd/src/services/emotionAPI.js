// Emotion Detection API Service
class EmotionDetectionService {
  constructor() {
    this.vitApiUrl = 'http://localhost:8001'; // Updated to match new FastAPI server port
    this.isCapturing = false;
    this.captureInterval = null;
    this.videoElement = null;
    this.canvas = null;
    this.stream = null;
    this.onEmotionDetected = null;
    this.lastEmotion = null;
    this.emotionHistory = [];
    
    // Add beforeunload event listener to cleanup camera when page is closed
    window.addEventListener('beforeunload', () => {
      this.stopEmotionDetection();
    });
    
    // Add visibility change listener to pause/resume when tab is hidden/visible
    document.addEventListener('visibilitychange', () => {
      if (document.hidden && this.isCapturing) {
        console.log('📱 Tab hidden, pausing emotion detection');
        this.pauseCapturing();
      } else if (!document.hidden && this.stream && !this.isCapturing) {
        console.log('📱 Tab visible, resuming emotion detection');
        this.resumeCapturing();
      }
    });
  }

  // Initialize camera and start emotion detection
  async startEmotionDetection(onEmotionCallback, showPreview = false) {
    try {
      console.log('🎯 === EMOTION DETECTION START SEQUENCE ===');
      
      // Always stop any existing detection first
      this.stopEmotionDetection();
      
      // Store callback and settings for recovery if needed
      this.onEmotionDetected = onEmotionCallback;
      this._currentCallback = onEmotionCallback; // Store for potential restart
      this.showPreview = showPreview;
      
      console.log('📷 Requesting camera permission...');
      
      // Check if camera is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        console.error('❌ Camera not supported on this device');
        throw new Error('Camera not supported on this device');
      }
      
      console.log('🔍 Checking camera devices...');
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      console.log(`📹 Found ${videoDevices.length} video devices:`, videoDevices.map(d => d.label || 'Unknown'));
      
      // Request camera access with fresh permission request - explicitly request higher resolution
      console.log('🚀 Requesting camera stream with optimal settings...');
      
      // Try with HD resolution first
      try {
        this.stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1280, min: 640 },
            height: { ideal: 720, min: 480 },
            facingMode: 'user',
            frameRate: { ideal: 30, min: 15 }
          }
        });
        console.log('✅ HD camera stream acquired successfully');
      } catch (err) {
        console.warn('⚠️ Could not get HD stream, falling back to standard definition:', err);
        // Fallback to lower resolution
        this.stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 640, min: 320 },
            height: { ideal: 480, min: 240 },
            facingMode: 'user'
          }
        });
        console.log('✅ SD camera stream acquired as fallback');
      }

      console.log('✅ Camera permission granted, stream acquired');
      console.log('📊 Stream details:', {
        active: this.stream.active,
        id: this.stream.id,
        tracks: this.stream.getTracks().length
      });

      // Create video element
      console.log('🎥 Creating video element...');
      this.videoElement = document.createElement('video');
      this.videoElement.srcObject = this.stream;
      this.videoElement.autoplay = true;
      this.videoElement.muted = true;
      this.videoElement.playsInline = true;
      
      // Explicitly call play() to ensure autoplay works
      try {
        await this.videoElement.play();
        console.log('▶️ Video playback started explicitly');
      } catch (playError) {
        console.error('❌ Error starting video playback:', playError);
      }

      // Create canvas for capture with higher resolution
      console.log('🖼️ Creating canvas...');
      this.canvas = document.createElement('canvas');
      this.canvas.width = 1280;  // Start with larger canvas
      this.canvas.height = 720;

      // Wait for video to be ready with better error handling
      console.log('⏳ Waiting for video to load...');
      await new Promise((resolve, reject) => {
        // Use both onloadedmetadata and onloadeddata for better reliability
        let metadataLoaded = false;
        let dataLoaded = false;
        let proceedAnywayTimeout, timeoutId;
        
        const checkBothLoaded = () => {
          if (metadataLoaded && dataLoaded) {
            console.log('📹 Video fully loaded successfully');
            if (timeoutId) clearTimeout(timeoutId);
            if (proceedAnywayTimeout) clearTimeout(proceedAnywayTimeout);
            resolve();
          }
        };
        
        this.videoElement.onloadedmetadata = () => {
          console.log('📹 Video metadata loaded successfully');
          metadataLoaded = true;
          
          // Some browsers may succeed here but still fail to play video
          if (this.videoElement.readyState >= 2) {
            console.log('📊 Video dimensions:', {
              videoWidth: this.videoElement.videoWidth,
              videoHeight: this.videoElement.videoHeight,
              readyState: this.videoElement.readyState
            });
            checkBothLoaded();
          }
        };
        
        this.videoElement.onloadeddata = () => {
          console.log('📹 Video data loaded successfully');
          dataLoaded = true;
          checkBothLoaded();
        };
        
        // If we already have metadata/data loaded (from browser cache), resolve immediately
        if (this.videoElement.readyState >= 2) {
          console.log('📹 Video already loaded (readyState >= 2)');
          metadataLoaded = true;
          dataLoaded = true;
          checkBothLoaded();
        }
        
        this.videoElement.onerror = (error) => {
          console.error('❌ Video error:', error);
          reject(error);
        };
        
        // If video is still loading but taking too long, continue anyway
        // This helps when video is partially usable but stuck on loading
        proceedAnywayTimeout = setTimeout(() => {
          console.warn('⚠️ Video loading partially complete but continuing anyway');
          if (this.videoElement.readyState >= 1) {
            resolve();
          }
        }, 5000);
        
        // Final timeout after 15 seconds (increased from 10)
        timeoutId = setTimeout(() => {
          if (proceedAnywayTimeout) clearTimeout(proceedAnywayTimeout);
          
          // If we have partial video data, try to continue anyway
          if (this.videoElement.readyState >= 1) {
            console.warn('⚠️ Video load timeout but proceeding with partial data');
            resolve();
          } else {
            reject(new Error('Video loading timeout'));
          }
        }, 15000);
      });

      // Add preview to DOM if requested
      if (showPreview) {
        console.log('🖥️ Adding camera preview to DOM...');
        this.addPreviewToDOM();
      }

      console.log('🎥 Starting capture and analysis...');
      this.isCapturing = true;
      
      // First do an immediate test capture
      console.log('🧪 Doing immediate test capture...');
      try {
        const testResult = await this.captureAndAnalyze();
        if (testResult) {
          console.log('✅ Test capture successful:', testResult);
        } else {
          console.warn('⚠️ Test capture returned no results');
        }
      } catch (testError) {
        console.error('❌ Test capture failed:', testError);
      }
      
      // Wait 2 seconds before starting capture to let user get positioned
      console.log('⏱️ Waiting 2 seconds for user positioning...');
      setTimeout(() => {
        if (this.isCapturing) {
          console.log('📸 Beginning emotion detection capture sequence...');
          this.captureAndAnalyze();
          this.setCaptureInterval(2000); // Default 2 second intervals
          console.log('✅ Emotion detection fully started with 2-second intervals');
        } else {
          console.warn('⚠️ Emotion detection was stopped before capture could begin');
        }
      }, 2000);
      
      console.log('🎯 === EMOTION DETECTION INITIALIZATION COMPLETE ===');
      return true;
    } catch (error) {
      console.error('❌ Error starting emotion detection:', error);
      
      // More specific error messages
      if (error.name === 'NotAllowedError') {
        console.error('📷 Camera permission denied by user');
      } else if (error.name === 'NotFoundError') {
        console.error('📷 No camera found on device');
      } else if (error.name === 'NotReadableError') {
        console.error('📷 Camera is already in use by another application');
      } else if (error.message && error.message.includes('timeout')) {
        console.error('⏱️ Camera initialization timed out');
        
        if (this._currentCallback) {
          const savedCallback = this._currentCallback;
          const savedShowPreview = this.showPreview || false;
          
          // Attempt recovery after timeout by restarting
          console.log('🔄 Attempting recovery by restarting camera...');
          
          // Release any existing resources
          this.stopEmotionDetection();
          
          // Wait a moment before retry
          setTimeout(() => {
            console.log('🔄 Retrying emotion detection after timeout...');
            this.startEmotionDetection(savedCallback, savedShowPreview)
              .then(success => {
                if (success) {
                  console.log('✅ Successfully restarted emotion detection after timeout');
                } else {
                  console.error('❌ Failed to restart emotion detection after timeout');
                }
              })
              .catch(retryError => {
                console.error('❌ Error during emotion detection retry:', retryError);
              });
          }, 2000);
        } else {
          console.log('⚠️ No callback stored, skipping auto-recovery');
        }
      } else if (error.name === 'OverconstrainedError') {
        console.error('📷 Camera constraints not satisfied');
      }
      
      this.stopEmotionDetection();
      return false;
    }
  }

  // Add preview to DOM
  addPreviewToDOM() {
    if (this.videoElement && this.showPreview) {
      // Remove any existing preview
      this.removePreviewFromDOM();
      
      // Create preview container
      this.previewContainer = document.createElement('div');
      this.previewContainer.id = 'emotion-camera-preview';
      this.previewContainer.style.cssText = `
        position: fixed;
        top: 80px;
        right: 20px;
        width: 320px;
        height: 240px;
        border: 5px solid #4CAF50;
        border-radius: 15px;
        overflow: hidden;
        z-index: 10000;
        background: #000;
        box-shadow: 0 4px 20px rgba(0,0,0,0.5);
      `;
      
      // Add instruction text
      const instruction = document.createElement('div');
      instruction.style.cssText = `
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        background: rgba(0,0,0,0.7);
        color: white;
        padding: 10px;
        font-size: 14px;
        text-align: center;
        font-family: Arial, sans-serif;
        font-weight: bold;
        z-index: 10002;
      `;
      instruction.innerHTML = `
        <div>📹 Position Your Face in Center</div>
        <div style="font-size: 12px; margin-top: 5px; opacity: 0.8;">
          Good lighting and face clearly visible
        </div>
      `;
      
      // Add status indicator
      this.statusIndicator = document.createElement('div');
      this.statusIndicator.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        background: rgba(244, 67, 54, 0.9);
        color: white;
        padding: 8px;
        font-size: 14px;
        text-align: center;
        font-family: Arial, sans-serif;
        font-weight: bold;
        z-index: 10001;
      `;
      this.statusIndicator.textContent = '🔍 Looking for face...';
      
      // Clone video element for preview
      this.previewVideo = this.videoElement.cloneNode();
      this.previewVideo.style.cssText = `
        width: 100%;
        height: 100%;
        object-fit: cover;
        transform: scaleX(-1);
      `;
      this.previewVideo.srcObject = this.stream;
      this.previewVideo.autoplay = true;
      this.previewVideo.muted = true;
      this.previewVideo.playsInline = true;
      
      // Add close button
      const closeButton = document.createElement('button');
      closeButton.style.cssText = `
        position: absolute;
        top: 5px;
        right: 5px;
        background: rgba(0, 0, 0, 0.5);
        color: white;
        width: 24px;
        height: 24px;
        border-radius: 50%;
        border: none;
        font-size: 14px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        z-index: 10003;
      `;
      closeButton.innerHTML = '×';
      closeButton.onclick = () => this.removePreviewFromDOM();
      
      this.previewContainer.appendChild(this.previewVideo);
      this.previewContainer.appendChild(this.statusIndicator);
      this.previewContainer.appendChild(instruction);
      this.previewContainer.appendChild(closeButton);
      document.body.appendChild(this.previewContainer);
      
      // Auto-hide preview after 3 minutes
      this.previewTimeout = setTimeout(() => {
        this.removePreviewFromDOM();
      }, 180000);
      
      console.log('📹 Enhanced camera preview added to DOM');
    }
  }

  // Remove preview from DOM
  removePreviewFromDOM() {
    if (this.previewTimeout) {
      clearTimeout(this.previewTimeout);
      this.previewTimeout = null;
    }
    
    if (this.previewContainer && this.previewContainer.parentNode) {
      this.previewContainer.parentNode.removeChild(this.previewContainer);
      this.previewContainer = null;
      this.previewVideo = null;
      this.statusIndicator = null;
      console.log('📹 Camera preview removed from DOM');
    }
  }

  // Update preview status
  updatePreviewStatus(message, isGood = false) {
    if (this.statusIndicator) {
      this.statusIndicator.style.background = isGood ? 'rgba(76, 175, 80, 0.9)' : 'rgba(244, 67, 54, 0.9)';
      this.statusIndicator.textContent = message;
    }
  }

  // Start capturing images every 5 seconds
  startCapturing() {
    if (this.captureInterval) {
      clearInterval(this.captureInterval);
    }

    // Capture immediately
    this.captureAndAnalyze();

    // Then capture every 2 seconds for more responsive feedback
    this.captureInterval = setInterval(() => {
      this.captureAndAnalyze();
    }, 2000);
  }

  // Capture image from video and send to ViT model
  async captureAndAnalyze() {
    if (!this.isCapturing || !this.videoElement || !this.canvas) {
      console.warn('⚠️ Cannot capture: missing components', {
        isCapturing: this.isCapturing,
        hasVideo: !!this.videoElement,
        hasCanvas: !!this.canvas,
        videoReadyState: this.videoElement?.readyState,
        streamActive: this.stream?.active
      });
      return;
    }

    try {
      console.log('📸 Starting image capture...');
      const ctx = this.canvas.getContext('2d');
      
      // Check video readiness
      if (this.videoElement.readyState < 2) {
        console.warn('⚠️ Video not ready for capture, readyState:', this.videoElement.readyState);
        return;
      }
      
      // Ensure proper canvas dimensions match video dimensions
      this.canvas.width = this.videoElement.videoWidth || 640;
      this.canvas.height = this.videoElement.videoHeight || 480;
      
      // Log dimensions for debugging
      console.log('📐 Canvas dimensions:', this.canvas.width, 'x', this.canvas.height);
      console.log('📐 Video dimensions:', this.videoElement.videoWidth, 'x', this.videoElement.videoHeight);
      
      // Clear canvas before drawing
      ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      
      // Draw the video frame to canvas with proper dimensions
      ctx.drawImage(
        this.videoElement,
        0, 0, this.videoElement.videoWidth, this.videoElement.videoHeight,
        0, 0, this.canvas.width, this.canvas.height
      );
      console.log('🖼️ Image drawn to canvas');
      
      // Debugging: draw a red border to show capture area
      ctx.strokeStyle = 'red';
      ctx.lineWidth = 5;
      ctx.strokeRect(0, 0, this.canvas.width, this.canvas.height);
      
      // Force a high quality capture
      const blob = await new Promise(resolve => {
        this.canvas.toBlob(resolve, 'image/jpeg', 0.95);
      });

      if (blob) {
        console.log('✅ Image blob created, size:', blob.size, 'bytes');
        
        // For debugging - save blob to a variable to inspect
        this.lastCapturedBlob = blob;
        
        // Create temporary URL for debugging
        if (this.showPreview) {
          const imageUrl = URL.createObjectURL(blob);
          this.updateDebugImage(imageUrl);
        }
        
        const emotion = await this.sendImageToAPI(blob);
        if (emotion) {
          console.log('🎭 Emotion result received:', emotion);
          this.processEmotionResult(emotion);
          return emotion;
        } else {
          console.warn('⚠️ No emotion result from API');
          return null;
        }
      } else {
        console.error('❌ Failed to create image blob');
        return null;
      }
    } catch (error) {
      console.error('❌ Error capturing and analyzing image:', error);
      return null;
    }
  }

  // Add debug image to preview
  updateDebugImage(imageUrl) {
    // Only add if preview is visible
    if (!this.previewContainer) return;
    
    // Remove any existing debug image
    if (this.debugImage && this.debugImage.parentNode) {
      this.debugImage.parentNode.removeChild(this.debugImage);
    }
    
    // Create a new debug image
    this.debugImage = document.createElement('div');
    this.debugImage.style.cssText = `
      position: absolute;
      bottom: 10px;
      right: 10px;
      width: 120px;
      height: 90px;
      border: 2px solid yellow;
      background-color: black;
      background-image: url(${imageUrl});
      background-size: cover;
      background-position: center;
      z-index: 10002;
      opacity: 0.8;
      border-radius: 5px;
      box-shadow: 0 2px 5px rgba(0,0,0,0.5);
    `;
    
    this.debugImage.title = "Last captured image";
    
    // Add a label
    const label = document.createElement('div');
    label.style.cssText = `
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      background: rgba(0,0,0,0.7);
      color: white;
      padding: 2px;
      font-size: 9px;
      text-align: center;
    `;
    label.textContent = "Captured Image";
    this.debugImage.appendChild(label);
    
    // Add to preview container
    this.previewContainer.appendChild(this.debugImage);
    
    // Clean up URL after a delay
    setTimeout(() => {
      URL.revokeObjectURL(imageUrl);
    }, 5000);
  }

  // Send image to ViT model API
  async sendImageToAPI(imageBlob) {
    try {
      console.log('📤 Sending image to API...', {
        size: imageBlob.size,
        type: imageBlob.type,
        url: `${this.vitApiUrl}/predict/`
      });

      const formData = new FormData();
      formData.append('file', imageBlob, `capture_${Date.now()}.jpg`);
      // Add debug flag to help with troubleshooting
      formData.append('debug', 'true');

      // Increase timeout to 10 seconds to allow for longer API processing
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(`${this.vitApiUrl}/predict/`, {
        method: 'POST',
        body: formData,
        signal: controller.signal,
        headers: {
          'X-Client-Timestamp': Date.now().toString(),
          'X-Client-Id': 'joyverse-webapp'
        }
      });

      clearTimeout(timeoutId);
      console.log('📥 API Response status:', response.status);

      if (response.ok) {
        // Try to parse the JSON response
        try {
          const result = await response.json();
          // Transform_Model API returns: {prediction, confidence, probabilities, landmarks}
          // Convert to expected format: {emotion, confidence, probs}
          const transformedResult = {
            emotion: result.prediction,
            confidence: result.confidence / 100, // Convert from 0-100 to 0-1 scale
            probs: result.probabilities ? Object.fromEntries(
              Object.entries(result.probabilities).map(([key, value]) => [key, value / 100])
            ) : {},
            landmarks: result.landmarks, // Keep landmarks for future use
            note: result.note // Keep any notes
          };
          
          console.log('🎯 Emotion detected (transformed):', transformedResult);
          
          // Update preview status based on result
          if (transformedResult.note && transformedResult.note.includes('no face detected')) {
            this.updatePreviewStatus('❌ No face detected - please adjust position', false);
          } else if (transformedResult.confidence < 0.3) {
            this.updatePreviewStatus('⚠️ Low confidence - improve lighting/position', false);
          } else {
            this.updatePreviewStatus(`✅ ${transformedResult.emotion} detected (${Math.round(transformedResult.confidence * 100)}%)`, true);
          }
          
          return transformedResult;
        } catch (jsonError) {
          console.error('❌ Error parsing API response JSON:', jsonError);
          this.updatePreviewStatus('❌ API response format error', false);
          return null;
        }
      } else {
        let errorData = '';
        try {
          errorData = await response.text();
        } catch (textError) {
          errorData = 'Could not read error response';
        }
        
        console.warn('⚠️ API Error:', {
          status: response.status,
          statusText: response.statusText,
          error: errorData
        });
        
        this.updatePreviewStatus('❌ API Error - check server', false);
        
        // If it's a "No face detected" error, try again after a short delay
        if (response.status === 400 && errorData.includes('No face detected')) {
          console.log('👤 No face detected, will try again in next capture...');
        }
        
        return null;
      }
    } catch (error) {
      console.error('❌ Error sending image to API:', error);
      
      if (error.name === 'AbortError') {
        this.updatePreviewStatus('❌ API request timed out', false);
      } else {
        this.updatePreviewStatus('❌ Network error - check connection', false);
      }
      
      return null;
    }
  }

  // Process emotion result and trigger theme change
  processEmotionResult(emotionData) {
    if (!emotionData || !emotionData.emotion) {
      return;
    }

    const { emotion, confidence, probs } = emotionData;
    
    // Add to emotion history
    this.emotionHistory.push({
      emotion,
      confidence,
      timestamp: Date.now()
    });

    // Keep only last 10 emotions
    if (this.emotionHistory.length > 10) {
      this.emotionHistory.shift();
    }

    // More responsive emotion changes - very low threshold for testing
    const confidenceThreshold = 0.05; // Very low threshold to catch even default emotions
    const shouldChange = emotion !== this.lastEmotion && confidence > confidenceThreshold;
    const forceChange = confidence > 0.3; // Force change for moderate confidence
    
    if (shouldChange || forceChange) {
      this.lastEmotion = emotion;
      
      if (this.onEmotionDetected) {
        this.onEmotionDetected({
          emotion,
          confidence,
          probs,
          history: this.emotionHistory
        });
      }
    } else {
      console.log(`🎭 Emotion ${emotion} (${Math.round(confidence * 100)}%) - threshold not met or same as last`);
    }
  }

  // Set capture interval dynamically
  setCaptureInterval(intervalMs) {
    if (this.captureInterval) {
      clearInterval(this.captureInterval);
    }
    
    if (this.isCapturing) {
      this.captureInterval = setInterval(() => {
        this.captureAndAnalyze();
      }, intervalMs);
    }
  }

  // Enable fast mode (1 second intervals)
  enableFastMode() {
    console.log('⚡ Fast mode enabled - 1 second intervals');
    this.setCaptureInterval(1000);
  }

  // Enable normal mode (2 second intervals)
  enableNormalMode() {
    console.log('🐌 Normal mode enabled - 2 second intervals');
    this.setCaptureInterval(2000);
  }

  // Get the most frequent emotion from recent history
  getDominantEmotion() {
    if (this.emotionHistory.length === 0) {
      return null;
    }

    const recentEmotions = this.emotionHistory.slice(-5); // Last 5 emotions
    const emotionCounts = {};
    
    recentEmotions.forEach(item => {
      emotionCounts[item.emotion] = (emotionCounts[item.emotion] || 0) + 1;
    });

    let dominantEmotion = null;
    let maxCount = 0;
    
    for (const [emotion, count] of Object.entries(emotionCounts)) {
      if (count > maxCount) {
        maxCount = count;
        dominantEmotion = emotion;
      }
    }

    return dominantEmotion;
  }

  // Stop emotion detection and cleanup
  stopEmotionDetection() {
    this.isCapturing = false;

    if (this.captureInterval) {
      clearInterval(this.captureInterval);
      this.captureInterval = null;
    }

    if (this.stream) {
      this.stream.getTracks().forEach(track => {
        track.stop();
        console.log('📷 Camera track stopped:', track.kind);
      });
      this.stream = null;
    }

    if (this.videoElement && this.videoElement.parentNode) {
      this.videoElement.srcObject = null;
      document.body.removeChild(this.videoElement);
      this.videoElement = null;
    }
    
    // Note: We're NOT clearing this._currentCallback
    // so that it can be used for recovery if needed

    if (this.canvas && this.canvas.parentNode) {
      document.body.removeChild(this.canvas);
      this.canvas = null;
    }

    this.onEmotionDetected = null;
    this.lastEmotion = null;
    this.emotionHistory = [];
    
    console.log('🛑 Emotion detection stopped and camera released');
  }

  // Pause capturing (when tab is hidden)
  pauseCapturing() {
    this.isCapturing = false;
    if (this.captureInterval) {
      clearInterval(this.captureInterval);
      this.captureInterval = null;
    }
  }

  // Resume capturing (when tab becomes visible)
  resumeCapturing() {
    if (this.stream && this.videoElement && !this.isCapturing) {
      this.isCapturing = true;
      this.startCapturing();
    }
  }

  // Get current emotion status
  getEmotionStatus() {
    return {
      isCapturing: this.isCapturing,
      lastEmotion: this.lastEmotion,
      emotionHistory: this.emotionHistory,
      dominantEmotion: this.getDominantEmotion(),
      hasVideo: !!this.videoElement,
      hasStream: !!this.stream,
      streamActive: this.stream?.active || false,
      videoReadyState: this.videoElement?.readyState || 'unknown'
    };
  }

  // Public method to manually trigger capture (for testing)
  async manualCapture() {
    return await this.captureAndAnalyze();
  }

  // Test API connection
  async testAPIConnection() {
    try {
      console.log('🔌 Testing API connection...');
      const response = await fetch(`${this.vitApiUrl}/test`);
      if (response.ok) {
        const result = await response.json();
        console.log('✅ API Connection successful:', result);
        return { success: true, message: result.message };
      } else {
        console.error('❌ API connection failed:', response.status);
        return { success: false, message: `API connection failed: ${response.status}` };
      }
    } catch (error) {
      console.error('❌ API connection error:', error);
      return { success: false, message: `Cannot connect to API: ${error.message}` };
    }
  }
}

// Create singleton instance
const emotionDetectionService = new EmotionDetectionService();

export default emotionDetectionService;
