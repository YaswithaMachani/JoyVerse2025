import React, { useState, useEffect, useRef, useCallback } from 'react';
import './game.css';
import gameScoreService from '../../../services/gameScoreAPI';
import emotionDetectionService from '../../../services/emotionAPI';

const MissingLetterPop = ({ onClose, user }) => {
  // Game state
  const [score, setScore] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [currentTheme, setCurrentTheme] = useState(1);
  const [currentWord, setCurrentWord] = useState('');
  const [missingLetter, setMissingLetter] = useState('');
  const [missingPosition, setMissingPosition] = useState(0);
  const [gameActive, setGameActive] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60);
  const [bubbles, setBubbles] = useState([]);
  const [soundEnabled, setSoundEnabled] = useState(true);  
  const [showGameOver, setShowGameOver] = useState(false);
  const [completedWord, setCompletedWord] = useState('');
  const [feedback, setFeedback] = useState([]);
  const [gameStartTime, setGameStartTime] = useState(null);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(0);
  
  // Emotion detection state
  const [cameraActive, setCameraActive] = useState(false);
  const [currentEmotion, setCurrentEmotion] = useState(null);
  const [emotionConfidence, setEmotionConfidence] = useState(0);
  const [showEmotionDisplay, setShowEmotionDisplay] = useState(true);
  const [emotionCapturing, setEmotionCapturing] = useState(false);
  const [showCameraPreview, setShowCameraPreview] = useState(true);
  const emotionCaptureRef = useRef(null);

  // Refs
  const gameTimerRef = useRef(null);
  const bubbleIdRef = useRef(0);
  const gameAreaRef = useRef(null);

  // Constants
  const words = [
    'CAT', 'DOG', 'SUN', 'TREE', 'FISH', 'BIRD', 'CAKE', 
    'BOOK', 'BALL', 'HAND', 'FOOT', 'STAR', 'MOON', 'HAPPY',
    'FROG', 'JUMP', 'PLAY', 'SING', 'BLUE', 'PINK', 'DUCK',
    'BEAR', 'FIVE', 'FOUR', 'NINE', 'GOLD', 'SOFT', 'SNOW',
    'RAIN', 'WIND', 'CLOUD', 'FIRE', 'ROCK', 'SAND'
  ];

  const letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'J', 'K', 'L', 
                  'M', 'N', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y'];
                  
  // Map emotions to themes
  const emotionThemeMap = {
    "happy": 3, // Yellow/orange happy theme
    "sad": 1,   // Purple/blue sad theme
    "angry": 1, // Purple/blue to calm anger
    "fear": 4,  // Purple theme for comfort
    "neutral": 2, // Green neutral theme
    "surprise": 3, // Yellow/orange surprise theme
    "disgust": 2,  // Green theme for disgust
    // Default to theme 1 if emotion not found
    "default": 1
  };
  
  // Function to handle emotion detection results
  const handleEmotionDetected = useCallback((emotionData) => {
    const { emotion, confidence } = emotionData;
    
    // Set the current emotion and confidence
    setCurrentEmotion(emotion);
    setEmotionConfidence(confidence);
    
    // Update the game theme based on detected emotion
    const newTheme = emotionThemeMap[emotion] || emotionThemeMap.default;
    setCurrentTheme(newTheme);
  }, [emotionThemeMap]);
  
  // Start emotion detection on game start
  const startEmotionDetection = useCallback(async () => {
    if (cameraActive) return;
    
    try {
      const result = await emotionDetectionService.startEmotionDetection(
        handleEmotionDetected,
        showCameraPreview // show preview if enabled
      );
      
      setCameraActive(result);
      setEmotionCapturing(result);
      
      // Set up periodic capture every 5 seconds
      if (result) {
        // Clear any existing interval
        if (emotionCaptureRef.current) {
          clearInterval(emotionCaptureRef.current);
        }
        
        // Set new interval for every 5 seconds
        emotionCaptureRef.current = setInterval(() => {
          if (!emotionDetectionService.isCapturing) return;
          emotionDetectionService.manualCapture();
        }, 5000);
      }
    } catch (error) {
      console.error('Failed to start emotion detection:', error);
      setCameraActive(false);
      setEmotionCapturing(false);
    }
  }, [cameraActive, handleEmotionDetected, showCameraPreview]);
  
  // Stop emotion detection
  const stopEmotionDetection = useCallback(() => {
    if (emotionCaptureRef.current) {
      clearInterval(emotionCaptureRef.current);
      emotionCaptureRef.current = null;
    }
    
    emotionDetectionService.stopEmotionDetection();
    setCameraActive(false);
    setEmotionCapturing(false);
    setCurrentEmotion(null);
    setEmotionConfidence(0);
  }, []);

  // Sound effect function
  const playPopSound = useCallback((isCorrect) => {
    if (!soundEnabled) return;
    
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      
      oscillator.type = isCorrect ? 'sine' : 'square';
      oscillator.frequency.value = isCorrect ? (500 + Math.random() * 500) : (200 + Math.random() * 200);
      gainNode.gain.value = 0.3;
      
      oscillator.start();
      gainNode.gain.exponentialRampToValueAtTime(0.00001, audioCtx.currentTime + 0.3);
      
      setTimeout(() => {
        oscillator.stop();
      }, 300);
    } catch (e) {
      // Audio not available
    }
  }, [soundEnabled]);

  // Improved bubble positioning with strict boundaries
  const findNonOverlappingPosition = useCallback((size, existingBubbles) => {
    const maxAttempts = 100;
    const padding = 20;
    const gameArea = gameAreaRef.current;
    
    if (!gameArea) return { x: 50, y: 50 };
    
    // Get safe area dimensions accounting for bubble size and padding
    const containerWidth = gameArea.offsetWidth;
    const containerHeight = gameArea.offsetHeight;
    const maxX = containerWidth - size - padding;
    const maxY = containerHeight - size - padding;
    
    // If container is too small for bubbles, scale them down
    const adjustedSize = Math.min(size, Math.min(containerWidth, containerHeight) - padding * 2);
    const adjustedMaxX = containerWidth - adjustedSize - padding;
    const adjustedMaxY = containerHeight - adjustedSize - padding;
    
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const x = Math.floor(Math.random() * (adjustedMaxX - padding)) + padding;
      const y = Math.floor(Math.random() * (adjustedMaxY - padding)) + padding;
      
      let overlaps = false;
      for (const bubble of existingBubbles) {
        const minDistance = (adjustedSize + bubble.size) / 2 + padding;
        const dx = x - bubble.x;
        const dy = y - bubble.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < minDistance) {
          overlaps = true;
          break;
        }
      }
      
      if (!overlaps) {
        return { 
          x: Math.max(padding, Math.min(x, adjustedMaxX)), 
          y: Math.max(padding, Math.min(y, adjustedMaxY)),
          size: adjustedSize
        };
      }
    }
    
    // Fallback to random position within safe area
    return { 
      x: Math.max(padding, Math.random() * adjustedMaxX),
      y: Math.max(padding, Math.random() * adjustedMaxY),
      size: adjustedSize
    };
  }, []);

  // Start new round with properly contained bubbles
  const startRound = useCallback(() => {
    const word = words[Math.floor(Math.random() * words.length)];
    const position = Math.floor(Math.random() * (word.length - 2)) + 1;
    const letter = word[position];
    
    setCurrentWord(word);
    setMissingPosition(position);
    setMissingLetter(letter);
    setBubbles([]);
    setCompletedWord('');

    setTimeout(() => {
      const gameArea = gameAreaRef.current;
      if (!gameArea) return;
      
      const newBubbles = [];
      const existingPositions = [];

      // Create correct letter bubble (70-100px)
      const correctSize = Math.floor(Math.random() * 30) + 70;
      const correctPosition = findNonOverlappingPosition(correctSize, existingPositions);
      
      newBubbles.push({
        id: bubbleIdRef.current++,
        letter,
        isCorrect: true,
        size: correctPosition.size || correctSize,
        x: correctPosition.x,
        y: correctPosition.y,
        colorClass: `bubble-color-${Math.floor(Math.random() * 6) + 1}`,
        animationDelay: Math.random() * 2
      });
      
      existingPositions.push({ 
        x: correctPosition.x, 
        y: correctPosition.y, 
        size: correctPosition.size || correctSize 
      });

      // Create wrong letter bubbles (60-90px)
      const wrongLettersCount = 3;
      const usedLetters = new Set([letter]);
      
      for (let i = 0; i < wrongLettersCount; i++) {
        let randomLetter;
        do {
          randomLetter = letters[Math.floor(Math.random() * letters.length)];
        } while (usedLetters.has(randomLetter));
        
        usedLetters.add(randomLetter);
        
        const size = Math.floor(Math.random() * 30) + 60;
        const position = findNonOverlappingPosition(size, existingPositions);
        
        newBubbles.push({
          id: bubbleIdRef.current++,
          letter: randomLetter,
          isCorrect: false,
          size: position.size || size,
          x: position.x,
          y: position.y,
          colorClass: `bubble-color-${Math.floor(Math.random() * 6) + 1}`,
          animationDelay: Math.random() * 2
        });
        
        existingPositions.push({ 
          x: position.x, 
          y: position.y, 
          size: position.size || size 
        });
      }

      setBubbles(newBubbles);
    }, 100);
  }, [words, letters, findNonOverlappingPosition]);

  // Handle bubble click
  const handleBubbleClick = useCallback((bubbleId, letter, isCorrect, x, y) => {
    if (!gameActive) return;

    playPopSound(isCorrect);

    // Add feedback
    const newFeedback = {
      id: Date.now(),
      text: isCorrect ? '+10' : 'Try again!',
      isCorrect,
      x: x + 40,
      y: y + 40
    };

    setFeedback(prev => [...prev, newFeedback]);

    setTimeout(() => {
      setFeedback(prev => prev.filter(f => f.id !== newFeedback.id));
    }, 1000);

    setBubbles(prev => prev.filter(b => b.id !== bubbleId));    if (isCorrect) {
      setScore(prev => prev + 10);
      setCorrectAnswers(prev => prev + 1);
      setTotalQuestions(prev => prev + 1);
      const wordArray = currentWord.split('');
      wordArray[missingPosition] = `<span style="color:#fffa65">${wordArray[missingPosition]}</span>`;
      setCompletedWord(wordArray.join(''));
      
      setTimeout(() => {
        setCompletedWord('');
        startRound();
      }, 1500);
    } else {
      setTotalQuestions(prev => prev + 1);
      setMistakes(prev => {
        const newMistakes = prev + 1;
        return newMistakes;
      });
    }
  }, [gameActive, playPopSound, currentWord, missingPosition, startRound]);

  // Timer effect
  useEffect(() => {
    if (gameActive && timeLeft > 0) {
      gameTimerRef.current = setTimeout(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);    } else if (timeLeft === 0) {
      setGameActive(false);
      saveGameScore();
      setShowGameOver(true);
    }

    return () => {
      if (gameTimerRef.current) {
        clearTimeout(gameTimerRef.current);
      }
    };
  }, [gameActive, timeLeft]);

  // Start emotion detection when game becomes active
  useEffect(() => {
    if (gameActive) {
      startEmotionDetection();
    } else {
      stopEmotionDetection();
    }
  }, [gameActive, startEmotionDetection, stopEmotionDetection]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (gameActive && bubbles.length > 0) {
        startRound();
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [gameActive, bubbles.length, startRound]);
  // Start game
  const startGame = () => {
    if (gameActive) {
      setGameActive(false);
      stopEmotionDetection();
    } else {
      setGameActive(true);
      setShowGameOver(false);
      setScore(0);
      setMistakes(0);
      setTimeLeft(60);
      setCurrentTheme(1);
      setGameStartTime(Date.now());
      setCorrectAnswers(0);
      setTotalQuestions(0);
      startRound();
      startEmotionDetection();
    }
  };

  // Cleanup effect
  useEffect(() => {
    return () => {
      stopEmotionDetection();
      if (emotionCaptureRef.current) {
        clearInterval(emotionCaptureRef.current);
        emotionCaptureRef.current = null;
      }
    };
  }, [stopEmotionDetection]);

  // Save game score to database
  const saveGameScore = async () => {
    try {
      const timeTaken = gameStartTime ? Math.round((Date.now() - gameStartTime) / 1000) : 60;
      const accuracy = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0;
      
      const gameData = {
        score,
        maxScore: totalQuestions * 10, // 10 points per correct answer
        timeTaken,
        level: 1, // Missing Letter Pop is single level
        correctAnswers,
        totalQuestions,
        mistakes,
        wordsCompleted: correctAnswers,
        accuracy,
        emotion: currentEmotion || 'unknown',
        emotionUsed: cameraActive
      };
      
      const formattedData = gameScoreService.formatGameData('missing-letter-pop', gameData);
      await gameScoreService.saveGameScore(formattedData);
    } catch (error) {
      console.error('❌ MissingLetterPop: Failed to save game score:', error);
    }
  };

  // Reset game
  const resetGame = () => {
    setGameActive(false);
    setScore(0);
    setMistakes(0);
    setTimeLeft(60);
    setBubbles([]);
    setCompletedWord('');
    setShowGameOver(false);
    setFeedback([]);
    stopEmotionDetection();
    setCurrentTheme(1);
  };

  // Create word display with missing letter
  const createWordDisplay = () => {
    if (!currentWord) return '';
    
    return currentWord.split('').map((letter, index) => (
      <span key={index} className={index === missingPosition ? 'missing' : ''}>
        {index === missingPosition ? '_' : letter}
      </span>
    ));
  };

  // Start/stop emotion detection on game start/stop
  useEffect(() => {
    if (gameActive) {
      startEmotionDetection();
    } else {
      stopEmotionDetection();
    }
  }, [gameActive, startEmotionDetection, stopEmotionDetection]);

  // Test face detection
  const testFaceDetection = useCallback(async () => {
    if (!emotionDetectionService.stream || !emotionDetectionService.videoElement) {
      alert('Camera not initialized. Please restart the camera first.');
      return;
    }

    try {
      // Force camera preview to show
      setShowCameraPreview(true);
      if (!cameraActive) {
        await startEmotionDetection();
      } else {
        // If camera is already active, just show the preview
        emotionDetectionService.showPreview = true;
        emotionDetectionService.addPreviewToDOM();
      }

      // Force a manual capture
      const result = await emotionDetectionService.manualCapture();
      if (result) {
        alert(`Emotion detected: ${result.emotion} with confidence: ${Math.round(result.confidence * 100)}%`);
      } else {
        alert('No emotion detected. Try adjusting the camera position or lighting.');
      }
    } catch (error) {
      console.error('Failed to test face detection:', error);
      alert('Failed to test face detection. Check console for details.');
    }
  }, [cameraActive, startEmotionDetection]);

  // Function to test camera connectivity
  const testCameraStatus = useCallback(async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        alert('Camera API not supported in this browser');
        return;
      }
      
      // Check available devices
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      
      if (videoDevices.length === 0) {
        alert('No camera devices found on this device');
        return;
      }
      
      // Test camera access
      alert(`Found ${videoDevices.length} camera(s). Requesting access...`);
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user'
        }
      });
      
      // Success! We got camera access
      alert('Camera access granted successfully! Stopping test stream now.');
      
      // Clean up test stream
      stream.getTracks().forEach(track => track.stop());
      
      // Now restart the emotion detection
      setShowCameraPreview(true);
      await stopEmotionDetection();
      setTimeout(() => startEmotionDetection(), 500);
      
    } catch (error) {
      let errorMessage = 'Unknown camera error';
      
      if (error.name === 'NotAllowedError') {
        errorMessage = 'Camera permission denied. Please allow camera access in your browser settings.';
      } else if (error.name === 'NotFoundError') {
        errorMessage = 'No camera found on your device.';
      } else if (error.name === 'NotReadableError') {
        errorMessage = 'Camera is already in use by another application. Please close other apps using the camera.';
      } else if (error.name === 'OverconstrainedError') {
        errorMessage = 'Camera constraints not satisfied. Your camera may not support the required resolution.';
      }
      
      alert(`Camera error: ${errorMessage}\n\nFull error: ${error.message}`);
    }
  }, [stopEmotionDetection, startEmotionDetection]);

  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100vw',
        height: '100vh',
        background: `linear-gradient(-45deg, #ff6b6b40, #4ecdc440, #45b7d140, #96ceb440)`,
        backgroundSize: '400% 400%',
        animation: 'gradientShift 15s ease infinite',
        transition: 'background 0.8s ease-in-out',
        zIndex: 10000
      }}
    >
      <div className={`missing-letter-game theme-${currentTheme}`}>
      {/* Settings */}
      <div className="settings">
        <label>
          <input
            type="checkbox"
            checked={soundEnabled}
            onChange={(e) => setSoundEnabled(e.target.checked)}
          />
          <span>Sound Effects</span>
        </label>
        {gameActive && (
          <label style={{ marginTop: '8px', display: 'block' }}>
            <input
              type="checkbox"
              checked={showCameraPreview}
              onChange={(e) => {
                setShowCameraPreview(e.target.checked);
                // If camera is active, restart it with new preview setting
                if (cameraActive) {
                  stopEmotionDetection();
                  setTimeout(() => startEmotionDetection(), 500);
                }
              }}
            />
            <span>Show Camera Preview</span>
          </label>
        )}
      </div>

      {/* Game Container */}
      <div className="game-container">        {/* Header */}
        <div className="game-header">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
            <h1 className="game-title">Missing Letter Pop!</h1>
            {onClose && (
              <button
                onClick={onClose}
                style={{
                  background: '#ff6b6b',
                  color: 'white',
                  border: 'none',
                  borderRadius: '50%',
                  width: '40px',
                  height: '40px',
                  fontSize: '20px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 2px 10px rgba(0,0,0,0.2)'
                }}
                title="Close Game"
              >
                ×
              </button>
            )}
          </div>
          
          {/* Word Display and Stats in Header - Slightly Left of Center */}
          <div style={{ 
            display: 'flex',
            justifyContent: 'flex-start',
            alignItems: 'center',
            width: '100%',
            marginTop: '1rem',
            paddingLeft: '25%'
          }}>
            <div className="centered-game-info" style={{ 
              position: 'relative', 
              top: 'auto', 
              left: 'auto', 
              transform: 'none',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <div className="word-display-centered" style={{ 
                fontSize: '1.5rem', 
                padding: '0.5rem 1rem',
                minHeight: '2rem'
              }}>
                {createWordDisplay()}
              </div>
              <div className="stats-container-centered" style={{ 
                gap: '1rem',
                padding: '0.5rem'
              }}>
                <div className="stat-box" style={{ 
                  padding: '0.25rem 0.75rem',
                  fontSize: '0.9rem',
                  minWidth: '4rem'
                }}>Score: {score}</div>
                <div className="stat-box" style={{ 
                  padding: '0.25rem 0.75rem',
                  fontSize: '0.9rem',
                  minWidth: '4rem'
                }}>Time: {timeLeft}s</div>
              </div>
            </div>
          </div>
        </div>

        {/* Game Area with strict boundaries */}
        <div ref={gameAreaRef} className="game-area">
          {/* Bubbles with guaranteed containment */}
          {bubbles.map(bubble => {
            const gameArea = gameAreaRef.current;
            const maxX = gameArea ? gameArea.offsetWidth - bubble.size - 20 : 800;
            const maxY = gameArea ? gameArea.offsetHeight - bubble.size - 20 : 384;
            
            const safeX = Math.max(20, Math.min(bubble.x, maxX));
            const safeY = Math.max(20, Math.min(bubble.y, maxY));
            
            return (
              <div
                key={bubble.id}
                className={`bubble ${bubble.colorClass}`}
                style={{
                  width: `${bubble.size}px`,
                  height: `${bubble.size}px`,
                  left: `${safeX}px`,
                  top: `${safeY}px`,
                  animationDelay: `${bubble.animationDelay}s`,
                  fontSize: `${Math.min(bubble.size * 0.4, 36)}px`,
                  zIndex: 10
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  handleBubbleClick(bubble.id, bubble.letter, bubble.isCorrect, safeX, safeY);
                }}
              >
                {bubble.letter}
              </div>
            );
          })}

          {/* Completed Word Display */}
          {completedWord && (
            <div 
              className="completed-word"
              dangerouslySetInnerHTML={{ __html: completedWord }}
            />
          )}

          {/* Feedback */}
          {feedback.map(fb => (
            <div
              key={fb.id}
              className={`feedback ${fb.isCorrect ? 'feedback-correct' : 'feedback-incorrect'}`}
              style={{
                left: `${fb.x}px`,
                top: `${fb.y}px`,
              }}
            >
              {fb.text}
            </div>
          ))}
        </div>
        
        {/* Controls - Moved inside game container */}
        <div className="controls">
          <button
            onClick={startGame}
            className="btn btn-start"
            style={{ 
              position: 'relative', 
              zIndex: 3000000
            }}
          >
            {gameActive ? 'Pause Game' : 'Start Game'}
          </button>
          <button
            onClick={resetGame}
            className="btn btn-reset"
            style={{ 
              position: 'relative', 
              zIndex: 3000000
            }}
          >
            Reset Game
          </button>
        </div>
      </div>

      {/* Game Over Modal */}
      {showGameOver && (
        <div className="game-over-modal">
          <div className="modal-content">
            <h2 className="modal-title">Game Over!</h2>
            <p className="modal-score">Your final score: {score}</p>
            <button
              onClick={() => {
                setShowGameOver(false);
                resetGame();
              }}
              className="btn-play-again"
            >
              Play Again
            </button>
          </div>
        </div>
      )}

      {/* Simple Theme Status */}
      <div style={{
        position: 'absolute',
        bottom: '20px',
        left: '20px',
        background: 'rgba(255, 255, 255, 0.9)',
        color: '#333',
        padding: '8px 16px',
        borderRadius: '20px',
        fontSize: '14px',
        fontWeight: '600',
        zIndex: 1001,
        boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)',
        border: '2px solid rgba(255, 255, 255, 0.8)'
      }}>
        Theme {currentTheme}
      </div>
      
      {/* Emotion Status Display */}
      {gameActive && showEmotionDisplay && (
        <div style={{
          position: 'absolute',
          bottom: '20px',
          right: '20px',
          background: 'rgba(255, 255, 255, 0.9)',
          color: '#333',
          padding: '8px 16px',
          borderRadius: '20px',
          fontSize: '14px',
          fontWeight: '600',
          zIndex: 1001,
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)',
          border: '2px solid rgba(255, 255, 255, 0.8)',
          transition: 'all 0.3s ease'
        }}>
          <div style={{
            width: '12px',
            height: '12px',
            borderRadius: '50%',
            background: cameraActive ? '#22c55e' : '#ef4444',
            boxShadow: '0 0 10px rgba(0, 0, 0, 0.2)',
            animation: cameraActive ? 'pulse 2s infinite' : 'none'
          }}></div>
          {currentEmotion ? (
            <span>
              {currentEmotion.charAt(0).toUpperCase() + currentEmotion.slice(1)} 
              {emotionConfidence > 0 && ` (${Math.round(emotionConfidence * 100)}%)`}
            </span>
          ) : (
            <span>{cameraActive ? 'Detecting...' : 'Camera Off'}</span>
          )}
          <button 
            onClick={() => {
              stopEmotionDetection();
              setTimeout(() => startEmotionDetection(), 500);
            }}
            style={{
              marginLeft: '8px',
              background: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              padding: '4px 8px',
              fontSize: '12px',
              cursor: 'pointer'
            }}
          >
            Restart Camera
          </button>
        </div>
      )}

      {/* Camera Controls */}
      {gameActive && (
        <div style={{
          position: 'absolute',
          top: '20px',
          right: '20px',
          background: 'rgba(255, 255, 255, 0.95)',
          color: '#333',
          padding: '15px',
          borderRadius: '15px',
          fontSize: '14px',
          zIndex: 999999,
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)',
          minWidth: '200px'
        }}>
          <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#4a5568', marginBottom: '8px' }}>
            📹 Camera & Emotion
          </div>
          
          {/* Emotion Display */}
          {currentEmotion && (
            <div style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              padding: '8px 12px',
              borderRadius: '8px',
              textAlign: 'center',
              fontWeight: '600'
            }}>
              😊 {currentEmotion} ({Math.round(emotionConfidence * 100)}%)
            </div>
          )}
          
          {/* Camera Status */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '12px',
            color: '#666'
          }}>
            <div style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: cameraActive ? '#10b981' : '#ef4444'
            }}></div>
            Camera: {cameraActive ? 'Active' : 'Inactive'}
          </div>
          
          {/* Control Buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <button 
              onClick={() => {
                setShowCameraPreview(true);
                stopEmotionDetection();
                setTimeout(() => startEmotionDetection(), 500);
              }}
              style={{
                background: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                padding: '8px 12px',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: '600'
              }}
            >
              🔄 Restart Camera
            </button>
            
            <button 
              onClick={testFaceDetection}
              style={{
                background: '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                padding: '8px 12px',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: '600'
              }}
            >
              🧪 Test Detection
            </button>
          </div>
        </div>
      )}

      {/* CSS for gradient animation */}
      <style jsx>{`
        @keyframes gradientShift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        
        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.5; }
          100% { opacity: 1; }
        }
      `}</style>
      </div>
    </div>
  );
};

export default MissingLetterPop;