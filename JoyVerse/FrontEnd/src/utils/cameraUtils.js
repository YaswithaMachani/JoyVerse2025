// Camera and Image Processing Utilities

export class CameraHandler {
  constructor() {
    this.stream = null;
    this.video = null;
  }

  async initializeCamera(videoElement, options = {}) {
    try {
      const constraints = {
        video: {
          width: { ideal: options.width || 640 },
          height: { ideal: options.height || 480 },
          facingMode: options.facingMode || 'user'
        }
      };

      this.stream = await navigator.mediaDevices.getUserMedia(constraints);
      this.video = videoElement;
      
      if (this.video) {
        this.video.srcObject = this.stream;
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error accessing camera:', error);
      throw new Error(`Camera access failed: ${error.message}`);
    }
  }

  captureImage(canvas, format = 'image/jpeg', quality = 0.8) {
    if (!this.video || !canvas) {
      throw new Error('Video or canvas element not available');
    }

    const context = canvas.getContext('2d');
    canvas.width = this.video.videoWidth;
    canvas.height = this.video.videoHeight;
    
    context.drawImage(this.video, 0, 0);
    
    return canvas.toDataURL(format, quality);
  }

  stopCamera() {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    if (this.video) {
      this.video.srcObject = null;
      this.video = null;
    }
  }

  async switchCamera() {
    if (this.stream) {
      const videoTrack = this.stream.getVideoTracks()[0];
      const settings = videoTrack.getSettings();
      const newFacingMode = settings.facingMode === 'user' ? 'environment' : 'user';
      
      this.stopCamera();
      await this.initializeCamera(this.video, { facingMode: newFacingMode });
    }
  }
}

export class ImageProcessor {
  static async compressImage(imageData, maxWidth = 800, quality = 0.8) {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        const ratio = Math.min(maxWidth / img.width, maxWidth / img.height);
        canvas.width = img.width * ratio;
        canvas.height = img.height * ratio;
        
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      
      img.src = imageData;
    });
  }

  static async sendToModel(imageData, modelEndpoint, additionalData = {}) {
    try {
      // Convert base64 to blob
      const response = await fetch(imageData);
      const blob = await response.blob();
      
      // Create FormData
      const formData = new FormData();
      formData.append('image', blob, 'captured_image.jpg');
      
      // Add additional data
      Object.keys(additionalData).forEach(key => {
        formData.append(key, additionalData[key]);
      });

      // Send to model
      const modelResponse = await fetch(modelEndpoint, {
        method: 'POST',
        body: formData,
        headers: {
          // Don't set Content-Type header, let browser set it with boundary
        }
      });

      if (!modelResponse.ok) {
        throw new Error(`HTTP error! status: ${modelResponse.status}`);
      }

      return await modelResponse.json();
    } catch (error) {
      console.error('Error sending image to model:', error);
      throw error;
    }
  }

  static createThumbnail(imageData, width = 150, height = 150) {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        canvas.width = width;
        canvas.height = height;
        
        // Calculate crop dimensions to maintain aspect ratio
        const scale = Math.max(width / img.width, height / img.height);
        const x = (width / 2) - (img.width / 2) * scale;
        const y = (height / 2) - (img.height / 2) * scale;
        
        ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
        resolve(canvas.toDataURL('image/jpeg', 0.8));
      };
      
      img.src = imageData;
    });
  }
}

export const CAMERA_PERMISSIONS = {
  async checkPermissions() {
    try {
      const result = await navigator.permissions.query({ name: 'camera' });
      return result.state; // 'granted', 'denied', or 'prompt'
    } catch (error) {
      console.error('Error checking camera permissions:', error);
      return 'unknown';
    }
  },

  async requestPermissions() {
    try {
      await navigator.mediaDevices.getUserMedia({ video: true });
      return true;
    } catch (error) {
      console.error('Camera permission denied:', error);
      return false;
    }
  }
};

export const MODEL_ENDPOINTS = {
  development: 'http://localhost:5001/api/model/analyze-image',
  staging: 'http://localhost:5001/api/model/analyze-image',
  production: 'https://your-production-domain.com/api/model/analyze-image'
};

export function getModelEndpoint() {
  const env = process.env.NODE_ENV || 'development';
  return MODEL_ENDPOINTS[env] || MODEL_ENDPOINTS.development;
}
