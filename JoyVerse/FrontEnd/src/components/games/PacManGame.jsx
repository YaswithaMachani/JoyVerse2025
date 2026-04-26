import React, { useState, useEffect, useCallback, useRef } from 'react';
import { RotateCcw, Palette, Sparkles, Waves, Flame, Camera, CameraOff } from 'lucide-react';
import gameScoreService from '../../services/gameScoreAPI';
import emotionDetectionService from '../../services/emotionAPI';

const COLORS = ['#FF0000', '#00FF00', '#0000FF', '#FFFFFF']; // Red, Green, Blue, White
const COLOR_NAMES = ['RED', 'GREEN', 'BLUE', 'WHITE'];

const THEMES = {
  oceania: {
    name: 'Oceania',
    icon: Waves,
    background: 'linear-gradient(180deg, #001122, #003366, #0066aa)',
    wallColor: '#0099cc',
    borderColor: '#00ccff'
  },
  galaxia: {
    name: 'Galaxia',
    icon: Sparkles,
    background: 'linear-gradient(45deg, #2d1b69, #5b2c87, #8b5fbf)',
    wallColor: '#9966cc',
    borderColor: '#ffffff'
  },
  lazarus: {
    name: 'Lazarus',
    icon: Flame,
    background: 'linear-gradient(45deg, #330000, #660000, #990000)',
    wallColor: '#cc3333',
    borderColor: '#ff6666'
  }
};

// 5 levels with increasing wall density
const LEVELS = [
  // Level 1 - Minimal walls
  [
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,2,2,2,2,2,2,2,2,2,2,2,2,2,1],
    [1,2,1,2,2,2,1,2,1,2,2,2,1,2,1],
    [1,2,2,2,2,2,2,2,2,2,2,2,2,2,1],
    [1,2,2,2,1,2,2,2,2,2,1,2,2,2,1],
    [1,2,2,2,2,2,2,2,2,2,2,2,2,2,1],
    [1,2,1,2,2,2,2,2,2,2,2,2,1,2,1],
    [1,2,2,2,2,2,2,3,2,2,2,2,2,2,1],
    [1,2,1,2,2,2,2,2,2,2,2,2,1,2,1],
    [1,2,2,2,2,2,2,2,2,2,2,2,2,2,1],
    [1,2,2,2,1,2,2,2,2,2,1,2,2,2,1],
    [1,2,2,2,2,2,2,2,2,2,2,2,2,2,1],
    [1,2,1,2,2,2,1,2,1,2,2,2,1,2,1],
    [1,2,2,2,2,2,2,2,2,2,2,2,2,2,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
  ],
  // Level 2 - More walls
  [
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,2,2,2,1,2,2,2,2,2,1,2,2,2,1],
    [1,2,1,2,1,2,1,1,1,2,1,2,1,2,1],
    [1,2,2,2,2,2,2,2,2,2,2,2,2,2,1],
    [1,1,2,1,1,2,2,2,2,2,1,1,2,1,1],
    [1,2,2,2,2,2,1,2,1,2,2,2,2,2,1],
    [1,2,1,1,2,2,2,2,2,2,2,1,1,2,1],
    [1,2,2,2,2,2,2,3,2,2,2,2,2,2,1],
    [1,2,1,1,2,2,2,2,2,2,2,1,1,2,1],
    [1,2,2,2,2,2,1,2,1,2,2,2,2,2,1],
    [1,1,2,1,1,2,2,2,2,2,1,1,2,1,1],
    [1,2,2,2,2,2,2,2,2,2,2,2,2,2,1],
    [1,2,1,2,1,2,1,1,1,2,1,2,1,2,1],
    [1,2,2,2,1,2,2,2,2,2,1,2,2,2,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
  ],
  // Level 3 - Even more walls
  [
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,2,1,2,2,2,1,2,1,2,2,2,1,2,1],
    [1,2,1,2,1,2,1,2,1,2,1,2,1,2,1],
    [1,2,2,2,1,2,2,2,2,2,1,2,2,2,1],
    [1,1,1,2,1,1,2,2,2,1,1,2,1,1,1],
    [1,2,2,2,2,2,2,2,2,2,2,2,2,2,1],
    [1,2,1,1,1,2,1,2,1,2,1,1,1,2,1],
    [1,2,2,2,2,2,2,3,2,2,2,2,2,2,1],
    [1,2,1,1,1,2,1,2,1,2,1,1,1,2,1],
    [1,2,2,2,2,2,2,2,2,2,2,2,2,2,1],
    [1,1,1,2,1,1,2,2,2,1,1,2,1,1,1],
    [1,2,2,2,1,2,2,2,2,2,1,2,2,2,1],
    [1,2,1,2,1,2,1,2,1,2,1,2,1,2,1],
    [1,2,1,2,2,2,1,2,1,2,2,2,1,2,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
  ],
  // Level 4 - Dense walls
  [
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,2,1,2,1,2,1,2,1,2,1,2,1,2,1],
    [1,2,1,2,1,2,1,2,1,2,1,2,1,2,1],
    [1,2,2,2,2,2,2,2,2,2,2,2,2,2,1],
    [1,1,2,1,1,1,2,2,2,1,1,1,2,1,1],
    [1,2,2,2,2,2,2,2,2,2,2,2,2,2,1],
    [1,2,1,2,1,1,1,2,1,1,1,2,1,2,1],
    [1,2,2,2,2,2,2,3,2,2,2,2,2,2,1],
    [1,2,1,2,1,1,1,2,1,1,1,2,1,2,1],
    [1,2,2,2,2,2,2,2,2,2,2,2,2,2,1],
    [1,1,2,1,1,1,2,2,2,1,1,1,2,1,1],
    [1,2,2,2,2,2,2,2,2,2,2,2,2,2,1],
    [1,2,1,2,1,2,1,2,1,2,1,2,1,2,1],
    [1,2,1,2,1,2,1,2,1,2,1,2,1,2,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
  ],
  // Level 5 - Maximum walls
  [
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,2,1,2,1,2,1,2,1,2,1,2,1,2,1],
    [1,2,1,2,1,2,1,2,1,2,1,2,1,2,1],
    [1,2,2,2,2,2,2,2,2,2,2,2,2,2,1],
    [1,1,1,2,1,1,1,2,1,1,1,2,1,1,1],
    [1,2,2,2,2,2,2,2,2,2,2,2,2,2,1],
    [1,2,1,1,1,2,1,2,1,2,1,1,1,2,1],
    [1,2,2,2,2,2,2,3,2,2,2,2,2,2,1],
    [1,2,1,1,1,2,1,2,1,2,1,1,1,2,1],
    [1,2,2,2,2,2,2,2,2,2,2,2,2,2,1],
    [1,1,1,2,1,1,1,2,1,1,1,2,1,1,1],
    [1,2,2,2,2,2,2,2,2,2,2,2,2,2,1],
    [1,2,1,2,1,2,1,2,1,2,1,2,1,2,1],
    [1,2,1,2,1,2,1,2,1,2,1,2,1,2,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
  ]
];

const PacManGame = ({ onClose, user }) => {
  const [theme, setTheme] = useState('oceania');
  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [pacManPos, setPacManPos] = useState({ x: 7, y: 7 });
  const [currentColor, setCurrentColor] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [showColorPopup, setShowColorPopup] = useState(false);
  const [showDeathAnimation, setShowDeathAnimation] = useState(false);
  const [dots, setDots] = useState([]);
  const [dotsInitialized, setDotsInitialized] = useState(false);
  const [levelCompleted, setLevelCompleted] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);

  // Camera and emotion detection states
  const [cameraActive, setCameraActive] = useState(false);
  const [currentEmotion, setCurrentEmotion] = useState(null);
  const [emotionConfidence, setEmotionConfidence] = useState(0);
  const [showEmotionDisplay, setShowEmotionDisplay] = useState(true);
  const [showCameraPreview, setShowCameraPreview] = useState(true);
  const emotionCaptureRef = useRef(null);
  
  // Emotion-theme mapping
  const emotionThemeMap = {
    "happy": "galaxia",    // Bright and colorful theme
    "sad": "oceania",      // Calming blue theme
    "angry": "oceania",    // Calming blue to help with anger
    "fear": "lazarus",     // Intense theme for fear
    "neutral": "oceania",  // Default oceania theme
    "surprise": "galaxia", // Bright theme for surprise
    "disgust": "lazarus",  // Intense theme for disgust
    "default": "oceania"   // Default theme
  };
  
  // Function to handle emotion detection results
  const handleEmotionDetected = useCallback((emotionData) => {
    const { emotion, confidence } = emotionData;
    
    // Set the current emotion and confidence
    setCurrentEmotion(emotion);
    setEmotionConfidence(confidence);
    
    // Update the game theme based on detected emotion
    const newTheme = emotionThemeMap[emotion] || emotionThemeMap.default;
    setTheme(newTheme);
  }, []);
  
  // Start emotion detection on game start
  const startEmotionDetection = useCallback(async () => {
    if (cameraActive) return;
    
    try {
      const result = await emotionDetectionService.startEmotionDetection(
        handleEmotionDetected,
        showCameraPreview // show preview if enabled
      );
      
      setCameraActive(result);
      
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
      console.error('Error starting emotion detection:', error);
      setCameraActive(false);
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
    setCurrentEmotion(null);
    setEmotionConfidence(0);
  }, []);
  
  // Toggle camera on/off
  const toggleCamera = useCallback(() => {
    if (cameraActive) {
      stopEmotionDetection();
    } else {
      startEmotionDetection();
    }
  }, [cameraActive, startEmotionDetection, stopEmotionDetection]);

  // Load best score from localStorage
  useEffect(() => {
    const savedBestScore = parseInt(localStorage.getItem('pacManBestScore') || '0');
    setBestScore(savedBestScore);
  }, []);

  // Save best score
  useEffect(() => {
    if (score > bestScore) {
      setBestScore(score);
      localStorage.setItem('pacManBestScore', score.toString());
    }
  }, [score, bestScore]);

  // Initialize dots for current level
  const initializeDots = useCallback((levelIndex) => {
    const maze = LEVELS[levelIndex - 1];
    const newDots = [];
    let whiteCount = 0;
    const maxWhites = Math.max(2, Math.floor(maze.flat().filter(cell => cell === 2).length * 0.1));

    for (let y = 0; y < maze.length; y++) {
      for (let x = 0; x < maze[y].length; x++) {
        if (maze[y][x] === 2) {
          let color;
          if (whiteCount < maxWhites && Math.random() < 0.15) {
            color = 3; // White
            whiteCount++;
          } else {
            color = Math.floor(Math.random() * 3); // RGB only
          }
          
          newDots.push({
            x,
            y,
            color,
            id: `${x}-${y}`
          });
        }
      }
    }
    return newDots;
  }, []);

  // Initialize game
  useEffect(() => {
    if (!gameStarted) return;
    
    setDotsInitialized(false);
    const newDots = initializeDots(level);
    setDots(newDots);
    const maze = LEVELS[level - 1];
    // Find center position (where 3 is placed)
    for (let y = 0; y < maze.length; y++) {
      for (let x = 0; x < maze[y].length; x++) {
        if (maze[y][x] === 3) {
          setPacManPos({ x, y });
          break;
        }
      }
    } 
    setLevelCompleted(false);
    setDotsInitialized(true);
  }, [level, initializeDots, gameStarted]);

  // Ensure emotion detection stays active while game is running
  useEffect(() => {
    if (gameStarted) {
      startEmotionDetection();
    } else {
      stopEmotionDetection();
    }
  }, [gameStarted, startEmotionDetection, stopEmotionDetection]);

  // Color cycling with popup
  useEffect(() => {
    if (!gameStarted) return;
    
    const interval = setInterval(() => {
      setCurrentColor(prev => {
        const newColor = Math.floor(Math.random() * 4);
        setShowColorPopup(true);
        setTimeout(() => setShowColorPopup(false), 1000);
        return newColor;
      });
    }, Math.random() * 5000 + 5000); // 5-10 seconds

    return () => clearInterval(interval);
  }, [gameStarted]);

  // Keyboard controls - single step movement
  useEffect(() => {
    if (!gameStarted) return;
    
    const handleKeyPress = (e) => {
      if (gameOver || showDeathAnimation) return;
      
      const maze = LEVELS[level - 1];
      let newX = pacManPos.x;
      let newY = pacManPos.y;

      switch (e.key) {
        case 'ArrowUp':
          newY = Math.max(0, pacManPos.y - 1);
          break;
        case 'ArrowDown':
          newY = Math.min(maze.length - 1, pacManPos.y + 1);
          break;
        case 'ArrowLeft':
          newX = Math.max(0, pacManPos.x - 1);
          break;
        case 'ArrowRight':
          newX = Math.min(maze[0].length - 1, pacManPos.x + 1);
          break;
        default:
          return;
      }

      // Check wall collision - death
      if (maze[newY][newX] === 1) {
        setShowDeathAnimation(true);
        setTimeout(() => {
          setShowDeathAnimation(false);
          endGame();
        }, 1500);
        return;
      }

      // Check dot collision
      const dotIndex = dots.findIndex(dot => dot.x === newX && dot.y === newY);
      if (dotIndex !== -1) {
        const dot = dots[dotIndex];
        let points = 0;
        
        if (dot.color === currentColor) {
          points = dot.color === 3 ? 20 : 10; // White = 20, others = 10
        } else {
          points = -5; // Wrong color penalty
        }

        setScore(prevScore => Math.max(0, prevScore + points));
        setDots(prevDots => prevDots.filter((_, index) => index !== dotIndex));
      }

      setPacManPos({ x: newX, y: newY });
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [pacManPos, currentColor, dots, gameOver, showDeathAnimation, level, gameStarted]);

  // Check level completion
  useEffect(() => {
    // Only check completion if dots have been initialized and the game has started
    if (dots.length === 0 && !gameOver && !levelCompleted && level <= 5 && gameStarted && dotsInitialized) {
      setLevelCompleted(true);
      
      if (level < 5) {
        setTimeout(() => {
          setLevel(prev => prev + 1);
        }, 1000);
      } else {
        endGame();
      }
    }
  }, [dots, gameOver, level, levelCompleted, gameStarted, dotsInitialized]);

  const startGame = () => {
    setGameStarted(true);
    setGameOver(false);
    setShowDeathAnimation(false);
    setLevel(1);
    setScore(0);
    setCurrentColor(0);
    setLevelCompleted(false);
    setDotsInitialized(false);
    
    // Start emotion detection if enabled
    startEmotionDetection();
  };

  const resetLevel = () => {
    setGameOver(false);
    setShowDeathAnimation(false);
    setDotsInitialized(false);
    const newDots = initializeDots(level);
    setDots(newDots);
    const maze = LEVELS[level - 1];
    for (let y = 0; y < maze.length; y++) {
      for (let x = 0; x < maze[y].length; x++) {
        if (maze[y][x] === 3) {
          setPacManPos({ x, y });
          break;
        }
      }
    }
    setLevelCompleted(false);
    setDotsInitialized(true);
  };

  const resetGame = () => {
    setLevel(1);
    setScore(0);
    setGameOver(false);
    setShowDeathAnimation(false);
    setCurrentColor(0);
    setLevelCompleted(false);
    setGameStarted(false);
    setDotsInitialized(false);
  };

  const cycleTheme = () => {
    const themeKeys = Object.keys(THEMES);
    const currentIndex = themeKeys.indexOf(theme);
    const nextIndex = (currentIndex + 1) % themeKeys.length;
    setTheme(themeKeys[nextIndex]);
  };

  // Save game score to database
  const saveGameScore = async () => {
    try {
      console.log('🟡 PacMan: saveGameScore function called!');
      console.log('🟡 PacMan: Saving game score with data:', { score, level });
      
      const totalDots = LEVELS[level - 1].flat().filter(cell => cell === 2).length;
      const dotsEaten = totalDots - dots.length;
      const gameData = {
        score,
        maxScore: totalDots * 20, // Max possible score (20 points per white dot)
        timeTaken: 0, // PacMan doesn't track time currently
        level,
        dotsEaten,
        totalDots,
        accuracy: totalDots > 0 ? Math.round((dotsEaten / totalDots) * 100) : 0
      };
      
      const formattedData = gameScoreService.formatGameData('pacman', gameData);
      
      // Add retry logic for API calls
      let retries = 3;
      let success = false;
      let lastError = null;
      
      while (retries > 0 && !success) {
        try {
          await gameScoreService.saveGameScore(formattedData);
          console.log('✅ PacMan: Game score saved successfully');
          success = true;
          break;
        } catch (apiError) {
          lastError = apiError;
          console.warn(`⚠️ PacMan: Game score save attempt failed (${retries} retries left):`, apiError);
          retries--;
          
          if (retries > 0) {
            // Wait before retrying (500ms, 1000ms, etc.)
            await new Promise(resolve => setTimeout(resolve, (3 - retries) * 500));
          }
        }
      }
      
      // If all retries failed, throw the last error
      if (!success && lastError) {
        throw lastError;
      }
    } catch (error) {
      console.error('❌ PacMan: Failed to save game score:', error);
      // Continue game flow even if score saving fails
    }
  };

  // End game and save score
  const endGame = async () => {
    setGameOver(true);
    
    // Stop emotion detection
    stopEmotionDetection();
    
    // Save score to API if user exists
    if (user) {
      await saveGameScore();
    }
  };



  const currentTheme = THEMES[theme];
  const currentMaze = gameStarted ? LEVELS[level - 1] : LEVELS[0];

  // Welcome Screen
  if (!gameStarted) {
    return (
      <div 
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: currentTheme.background,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: "'Press Start 2P', monospace",
          color: 'white',
          zIndex: 9999
        }}
      >
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');
          
          @keyframes pac-bounce {
            0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
            40% { transform: translateY(-10px); }
            60% { transform: translateY(-5px); }
          }
          
          .pac-title {
            font-size: 48px;
            color: #ffff00;
            text-shadow: 0 0 20px #ffff00;
            animation: pac-bounce 2s infinite;
            margin-bottom: 30px;
          }
          
          .start-btn {
            background: rgba(255, 255, 255, 0.1);
            border: 3px solid ${currentTheme.borderColor};
            border-radius: 15px;
            padding: 20px 40px;
            color: white;
            cursor: pointer;
            font-family: 'Press Start 2P', monospace;
            font-size: 16px;
            transition: all 0.3s ease;
            margin: 20px;
          }
          
          .start-btn:hover {
            background: rgba(255, 255, 255, 0.2);
            box-shadow: 0 0 25px ${currentTheme.borderColor};
            transform: scale(1.05);
          }
          
          .back-btn {
            position: absolute;
            top: 20px;
            left: 20px;
            background: rgba(0, 0, 0, 0.7);
            border: 2px solid ${currentTheme.borderColor};
            border-radius: 10px;
            padding: 10px 20px;
            color: white;
            cursor: pointer;
            font-family: 'Press Start 2P', monospace;
            font-size: 10px;
          }
          
          .instructions {
            max-width: 600px;
            text-align: center;
            font-size: 12px;
            line-height: 1.6;
            margin: 20px;
            opacity: 0.9;
          }
        `}</style>
        
        <button className="back-btn" onClick={onClose}>
          ← Back to Dashboard
        </button>
        
        <div className="pac-title">🟡 PAC-MAN</div>
        <div style={{ fontSize: '24px', marginBottom: '20px' }}>COLOR QUEST</div>
        
        <button className="start-btn" onClick={startGame}>
          🎮 START GAME
        </button>
        
        <div className="instructions">
          <p>🕹️ Use ARROW KEYS to move one step at a time</p>
          <p>🎯 Eat dots that match the current color!</p>
          <p>🔴🟢🔵 RGB dots = 10 points • ⚪ White dots = 20 points</p>
          <p>❌ Wrong color = -5 points • 💀 Hit walls = GAME OVER</p>
          <p>🏆 Clear all dots to advance through 5 levels!</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        background: currentTheme.background,
        padding: '20px',
        fontFamily: "'Press Start 2P', monospace",
        color: 'white',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        zIndex: 9999,
        overflow: 'hidden'
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');
        
        .emotion-display {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 5px;
          padding: 10px 20px;
          margin-bottom: 15px;
          background: rgba(0, 0, 0, 0.7);
          border: 2px solid ${currentTheme.borderColor};
          border-radius: 10px;
          max-width: 200px;
        }
        
        .emotion-label {
          font-size: 10px;
          text-transform: uppercase;
          color: white;
          letter-spacing: 1px;
        }
        
        .emotion-confidence-bar {
          width: 100%;
          height: 8px;
          background: rgba(255, 255, 255, 0.2);
          border-radius: 4px;
          overflow: hidden;
        }
        
        .emotion-confidence-fill {
          height: 100%;
          border-radius: 4px;
          transition: width 0.5s ease, background-color 0.5s ease;
        }
        
        .info-container {
          display: flex;
          justify-content: space-between;
          align-items: center;
          width: 90%;
          max-width: 800px;
          min-height: 80px;
          background: rgba(0, 0, 0, 0.8);
          padding: 20px 30px;
          border-radius: 15px;
          border: 3px solid ${currentTheme.borderColor};
          margin-bottom: 25px;
          font-size: 11px;
          box-shadow: 0 0 20px rgba(0, 0, 0, 0.5), 0 0 40px ${currentTheme.borderColor}50;
          backdrop-filter: blur(10px);
        }

        .score-item {
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          padding: 10px 15px;
          border-radius: 10px;
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(5px);
          min-width: 80px;
        }

        .score-number {
          font-size: 18px;
          color: #00ff00;
          text-shadow: 0 0 15px #00ff00;
          margin-top: 5px;
          font-weight: bold;
        }

        .score-label {
          font-size: 10px;
          color: #cccccc;
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        .devour-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          padding: 10px 20px;
          border-radius: 10px;
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(5px);
          min-width: 120px;
        }

        .devour-header {
          font-size: 10px;
          color: #cccccc;
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        .devour-content {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .color-circle {
          width: 25px;
          height: 25px;
          border-radius: 50%;
          border: 3px solid white;
          box-shadow: 0 0 15px currentColor;
          animation: color-pulse 2s ease-in-out infinite;
        }

        @keyframes color-pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }

        .color-name {
          font-size: 12px;
          font-weight: bold;
          text-shadow: 0 0 10px currentColor;
        }

        .level-display {
          font-size: 14px;
          color: #ffff00;
          text-shadow: 0 0 15px #ffff00;
          font-weight: bold;
          text-align: center;
          padding: 10px 15px;
          border-radius: 10px;
          background: rgba(255, 255, 0, 0.1);
          backdrop-filter: blur(5px);
          min-width: 80px;
        }

        .stats-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 5px;
          padding: 10px 15px;
          border-radius: 10px;
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(5px);
          min-width: 100px;
        }

        .stats-label {
          font-size: 9px;
          color: #cccccc;
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        .stats-value {
          font-size: 14px;
          color: #ff6b6b;
          text-shadow: 0 0 10px #ff6b6b;
          font-weight: bold;
        }

        .controls {
          display: flex;
          gap: 10px;
          margin-bottom: 20px;
        }

        .control-btn {
          background: rgba(255, 255, 255, 0.1);
          border: 2px solid ${currentTheme.borderColor};
          border-radius: 8px;
          padding: 8px 12px;
          color: white;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          gap: 5px;
          font-size: 8px;
          font-family: 'Press Start 2P', monospace;
        }

        .control-btn:hover {
          background: rgba(255, 255, 255, 0.2);
          box-shadow: 0 0 15px ${currentTheme.borderColor};
        }

        .game-board {
          position: relative;
          background: rgba(0, 0, 0, 0.8);
          border: 4px solid ${currentTheme.borderColor};
          border-radius: 10px;
          box-shadow: 0 0 30px ${currentTheme.borderColor};
          padding: 10px;
        }

        .maze-grid {
          display: grid;
          grid-template-columns: repeat(15, 30px);
          grid-template-rows: repeat(15, 30px);
          gap: 1px;
          position: relative;
        }

        .maze-cell {
          width: 30px;
          height: 30px;
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .wall {
          background: ${currentTheme.wallColor};
          box-shadow: inset 0 0 10px rgba(255, 255, 255, 0.3);
          border-radius: 2px;
        }

        .wall.death-glow {
          background: #ff0000 !important;
          box-shadow: 0 0 20px #ff0000 !important;
          animation: death-pulse 0.5s infinite;
        }

        @keyframes death-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }

        .path {
          background: transparent;
        }

        .dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 0.8; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.2); }
        }

        .pacman {
          width: 24px;
          height: 24px;
          background: #ffff00;
          border-radius: 50%;
          border: 3px solid #ffffff;
          box-shadow: 0 0 15px #ffff00;
          z-index: 10;
          animation: pac-glow 1s infinite alternate;
        }

        @keyframes pac-glow {
          from { box-shadow: 0 0 15px #ffff00; }
          to { box-shadow: 0 0 25px #ffff00, 0 0 35px #ffff00; }
        }

        .color-popup {
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          background: rgba(0, 0, 0, 0.9);
          padding: 20px 30px;
          border-radius: 15px;
          border: 3px solid ${currentTheme.borderColor};
          font-size: 16px;
          text-align: center;
          z-index: 100;
          animation: popup-bounce 1s ease-out;
        }

        @keyframes popup-bounce {
          0% { transform: translate(-50%, -50%) scale(0.5); }
          60% { transform: translate(-50%, -50%) scale(1.2); }
          100% { transform: translate(-50%, -50%) scale(1); }
        }

        .game-over-screen {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0.9);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 200;
        }

        .game-over-content {
          background: rgba(0, 0, 0, 0.95);
          padding: 30px;
          border-radius: 15px;
          border: 3px solid ${currentTheme.borderColor};
          text-align: center;
          box-shadow: 0 0 30px ${currentTheme.borderColor};
        }

        .back-btn-game {
          position: absolute;
          top: 20px;
          left: 20px;
          background: rgba(0, 0, 0, 0.7);
          border: 2px solid ${currentTheme.borderColor};
          border-radius: 10px;
          padding: 10px 15px;
          color: white;
          cursor: pointer;
          font-family: 'Press Start 2P', monospace;
          font-size: 8px;
          z-index: 50;
        }

        @media (max-width: 768px) {
          .info-container {
            width: 95%;
            flex-wrap: wrap;
            gap: 15px;
            padding: 15px 20px;
            justify-content: center;
          }

          .score-item, .devour-container, .level-display, .stats-container {
            min-width: 70px;
            padding: 8px 12px;
          }

          .score-number {
            font-size: 16px;
          }

          .color-circle {
            width: 20px;
            height: 20px;
          }

          .color-name {
            font-size: 10px;
          }

          .level-display {
            font-size: 12px;
          }

          .stats-value {
            font-size: 12px;
          }
          
          .maze-grid {
            grid-template-columns: repeat(15, 20px);
            grid-template-rows: repeat(15, 20px);
          }
          
          .maze-cell {
            width: 20px;
            height: 20px;
          }
          
          .pacman {
            width: 16px;
            height: 16px;
          }
          
          .dot {
            width: 6px;
            height: 6px;
          }
        }
      `}</style>

      {/* Back button */}
      <button className="back-btn-game" onClick={onClose}>
        ← Dashboard
      </button>

      {/* Info Container */}
      <div className="info-container">
        <div className="score-item">
          <div className="score-label">SCORE</div>
          <div className="score-number">{score}</div>
        </div>

        <div className="score-item">
          <div className="score-label">BEST</div>
          <div className="score-number">{bestScore}</div>
        </div>

        <div className="devour-container">
          <div className="devour-header">TARGET COLOR</div>
          <div className="devour-content">
            <div 
              className="color-circle"
              style={{ 
                backgroundColor: COLORS[currentColor],
                color: COLORS[currentColor]
              }}
            />
            <div 
              className="color-name"
              style={{ color: COLORS[currentColor] }}
            >
              {COLOR_NAMES[currentColor]}
            </div>
          </div>
        </div>

        <div className="level-display">
          <div>LEVEL {level}</div>
        </div>

        <div className="stats-container">
          <div className="stats-label">DOTS LEFT</div>
          <div className="stats-value">{dots.length}</div>
        </div>
      </div>

      {/* Controls */}
      <div className="controls">
        <button className="control-btn" onClick={resetGame}>
          <RotateCcw size={12} />
          RESTART
        </button>
        <button className="control-btn" onClick={cycleTheme}>
          {React.createElement(currentTheme.icon, { size: 12 })}
          {currentTheme.name.toUpperCase()}
        </button>
        <button className="control-btn" onClick={toggleCamera}>
          {cameraActive ? <CameraOff size={12} /> : <Camera size={12} />}
          {cameraActive ? "CAMERA OFF" : "CAMERA ON"}
        </button>
      </div>
      
      {/* Emotion Display */}
      {cameraActive && currentEmotion && showEmotionDisplay && (
        <div className="emotion-display">
          <div className="emotion-label">MOOD: {currentEmotion.toUpperCase()}</div>
          <div className="emotion-confidence-bar">
            <div 
              className="emotion-confidence-fill"
              style={{ 
                width: `${Math.min(100, emotionConfidence * 100)}%`,
                backgroundColor: emotionConfidence > 0.7 ? '#00ff00' : 
                                emotionConfidence > 0.4 ? '#ffff00' : '#ff6b6b'
              }}
            />
          </div>
        </div>
      )}

      {/* Game Board */}
      <div className="game-board">
        <div className="maze-grid">
          {currentMaze.map((row, y) =>
            row.map((cell, x) => (
              <div
                key={`${x}-${y}`}
                className={`maze-cell ${cell === 1 ? 'wall' : 'path'} ${
                  showDeathAnimation && cell === 1 ? 'death-glow' : ''
                }`}
              >
                {/* Render dots */}
                {dots.find(dot => dot.x === x && dot.y === y) && (
                  <div
                    className="dot"
                    style={{
                      backgroundColor: COLORS[dots.find(dot => dot.x === x && dot.y === y).color],
                      boxShadow: `0 0 8px ${COLORS[dots.find(dot => dot.x === x && dot.y === y).color]}`
                    }}
                  />
                )}
                
                {/* Render Pac-Man */}
                {pacManPos.x === x && pacManPos.y === y && (
                  <div className="pacman" />
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Color Change Popup */}
      {showColorPopup && (
        <div className="color-popup">
          <div>DEVOUR: {COLOR_NAMES[currentColor]}</div>
          <div 
            className="color-circle"
            style={{ 
              backgroundColor: COLORS[currentColor],
              margin: '10px auto',
              width: '30px',
              height: '30px'
            }}
          />
        </div>
      )}

      {/* Game Over Screen */}
      {gameOver && (
        <div className="game-over-screen">
          <div className="game-over-content">
            <h2>{level === 5 && dots.length === 0 ? 'VICTORY!' : 'GAME OVER'}</h2>
            <p>Level: {level}</p>
            <p>Final Score: {score}</p>
            {score === bestScore && <p>🏆 NEW BEST SCORE! 🏆</p>}
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginTop: '20px' }}>
              <button 
                className="control-btn" 
                onClick={level === 5 && dots.length === 0 ? resetGame : resetLevel}
                style={{ fontSize: '10px' }}
              >
                <RotateCcw size={12} />
                {level === 5 && dots.length === 0 ? 'PLAY AGAIN' : 'RESTART LEVEL'}
              </button>
              <button 
                className="control-btn" 
                onClick={onClose}
                style={{ fontSize: '10px' }}
              >
                DASHBOARD
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Camera is handled by the emotionDetectionService */}
      {/* The service will automatically create and position the camera feed */}
    </div>
  );
};

export default PacManGame;
