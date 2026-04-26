import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Sparkles, ArrowRight, Zap, Star, Rocket, Camera, CameraOff } from 'lucide-react';
import './SpaceMathGame.css';
import emotionDetectionService from '../../services/emotionAPI';
import gameScoreService from '../../services/gameScoreAPI';

const SpaceMathGame = () => {
  const [currentPlanet, setCurrentPlanet] = useState(0);
  const [level, setLevel] = useState(1);
  const [score, setScore] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const [currentProblem, setCurrentProblem] = useState(null);
  const [userAnswer, setUserAnswer] = useState('');
  const [feedback, setFeedback] = useState('');
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [stars, setStars] = useState([]);
  const gameContainerRef = useRef(null);

  // Camera and emotion detection states
  const [cameraActive, setCameraActive] = useState(false);
  const [currentEmotion, setCurrentEmotion] = useState(null);
  const [emotionConfidence, setEmotionConfidence] = useState(0);
  const [showEmotionDisplay, setShowEmotionDisplay] = useState(true);
  const [showCameraPreview, setShowCameraPreview] = useState(true);
  const [emotionDetectionFailed, setEmotionDetectionFailed] = useState(false);
  const emotionCaptureRef = useRef(null);
  
  // Game tracking for analytics
  const [gameStartTime, setGameStartTime] = useState(null);
  const [emotionsDetected, setEmotionsDetected] = useState([]);
  const [planetsVisited, setPlanetsVisited] = useState([]);
  const [problemsSolved, setProblemsSolved] = useState(0);
  const [totalProblems, setTotalProblems] = useState(0);
  
  // Emotion-to-planet mapping
  const emotionPlanetMap = {
    "happy": 2,        // Earth - bright and lively
    "sad": 7,          // Neptune - calming blue
    "angry": 3,        // Mars - red planet for intensity
    "fear": 0,         // Mercury - close to sun, intense
    "neutral": 2,      // Earth - default planet
    "surprise": 4,     // Jupiter - largest, impressive
    "disgust": 5,      // Saturn - rings for complexity
    "default": 2       // Earth as default
  };

  // Planet data
  const planets = [
    {
      name: 'Mercury',
      emoji: '☿️',
      bgClass: 'mercury-bg',
      accentClass: 'mercury-accent',
      textClass: 'mercury-text',
      facts: [
        'Mercury is the closest planet to the Sun!',
        'A day on Mercury is longer than its year!',
        'Mercury has no atmosphere to trap heat.',
        'Mercury is the smallest planet in our solar system!'
      ]
    },
    {
      name: 'Venus',
      emoji: '♀️',
      bgClass: 'venus-bg',
      accentClass: 'venus-accent',
      textClass: 'venus-text',
      facts: [
        'Venus is the hottest planet in our solar system!',
        'Venus rotates backwards compared to Earth!',
        'A day on Venus is longer than its year!',
        'Venus is often called Earth\'s twin!'
      ]
    },
    {
      name: 'Earth',
      emoji: '🌍',
      bgClass: 'earth-bg',
      accentClass: 'earth-accent',
      textClass: 'earth-text',
      facts: [
        'Earth is the only known planet with life!',
        'Earth has one natural satellite - the Moon!',
        '71% of Earth\'s surface is covered by water!',
        'Earth has the perfect distance from the Sun for life!'
      ]
    },
    {
      name: 'Mars',
      emoji: '♂️',
      bgClass: 'mars-bg',
      accentClass: 'mars-accent',
      textClass: 'mars-text',
      facts: [
        'Mars is known as the Red Planet!',
        'Mars has two small moons: Phobos and Deimos!',
        'A day on Mars is almost the same as Earth!',
        'Mars has the largest volcano in the solar system!'
      ]
    },
    {
      name: 'Jupiter',
      emoji: '♃',
      bgClass: 'jupiter-bg',
      accentClass: 'jupiter-accent',
      textClass: 'jupiter-text',
      facts: [
        'Jupiter is the largest planet in our solar system!',
        'Jupiter has over 80 moons!',
        'Jupiter\'s Great Red Spot is a giant storm!',
        'Jupiter acts like a cosmic vacuum cleaner!'
      ]
    },
    {
      name: 'Saturn',
      emoji: '♄',
      bgClass: 'saturn-bg',
      accentClass: 'saturn-accent',
      textClass: 'saturn-text',
      facts: [
        'Saturn is famous for its beautiful rings!',
        'Saturn could float in water if there was a big enough ocean!',
        'Saturn has 146 confirmed moons!',
        'Saturn\'s rings are made of ice and rock particles!'
      ]
    },
    {
      name: 'Uranus',
      emoji: '♅',
      bgClass: 'uranus-bg',
      accentClass: 'uranus-accent',
      textClass: 'uranus-text',
      facts: [
        'Uranus rotates on its side!',
        'Uranus is the coldest planet in our solar system!',
        'Uranus has faint rings around it!',
        'A year on Uranus equals 84 Earth years!'
      ]
    },
    {
      name: 'Neptune',
      emoji: '♆',
      bgClass: 'neptune-bg',
      accentClass: 'neptune-accent',
      textClass: 'neptune-text',
      facts: [
        'Neptune is the windiest planet in our solar system!',
        'Neptune was discovered using mathematics!',
        'Neptune has 16 known moons!',
        'A year on Neptune equals 165 Earth years!'
      ]
    }
  ];

  const currentPlanetData = planets[currentPlanet];

  // Force full-screen on mount
  useEffect(() => {
    const forceFullScreen = () => {
      if (gameContainerRef.current) {
        const element = gameContainerRef.current;
        
        // Apply inline styles directly to the DOM element
        element.style.position = 'fixed';
        element.style.top = '0';
        element.style.left = '0';
        element.style.right = '0';
        element.style.bottom = '0';
        element.style.width = '100vw';
        element.style.height = '100vh';
        element.style.zIndex = '9999';
        element.style.margin = '0';
        element.style.padding = '0';
        element.style.overflow = 'hidden';
        element.style.boxSizing = 'border-box';
        
        // Force parent body to hide overflow
        document.body.style.overflow = 'hidden';
        document.documentElement.style.overflow = 'hidden';
        
        // Remove any constraining parent styles
        let parent = element.parentElement;
        while (parent && parent !== document.body) {
          parent.style.overflow = 'visible';
          parent.style.position = 'static';
          parent = parent.parentElement;
        }
      }
    };

    // Apply immediately and on resize
    forceFullScreen();
    window.addEventListener('resize', forceFullScreen);

    // Cleanup on unmount
    return () => {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
      window.removeEventListener('resize', forceFullScreen);
    };
  }, []);

  // Function to handle emotion detection results
  const handleEmotionDetected = useCallback((emotionData) => {
    const { emotion, confidence } = emotionData;
    
    // Set the current emotion and confidence
    setCurrentEmotion(emotion);
    setEmotionConfidence(confidence);
    
    // Track emotion for analytics
    setEmotionsDetected(prev => [
      ...prev,
      {
        emotion,
        confidence,
        timestamp: Date.now(),
        level: level,
        score: score
      }
    ]);
    
    // Update the game planet based on detected emotion
    const newPlanet = emotionPlanetMap[emotion] || emotionPlanetMap.default;
    if (newPlanet !== currentPlanet) {
      setCurrentPlanet(newPlanet);
      
      // Track planet visit
      setPlanetsVisited(prev => {
        const planetName = planets[newPlanet]?.name || 'Unknown';
        const lastVisit = prev[prev.length - 1];
        
        // Only add if it's a different planet than the last visit
        if (!lastVisit || lastVisit.planetName !== planetName) {
          return [
            ...prev,
            {
              planetIndex: newPlanet,
              planetName,
              emotion,
              confidence,
              timestamp: Date.now(),
              level: level,
              score: score
            }
          ];
        }
        return prev;
      });
    }
    
    console.log(`🎮 SpaceMath: Emotion detected: ${emotion} (${confidence}%) -> Planet: ${planets[newPlanet]?.name}`);
  }, [currentPlanet, level, score, planets]);  // Added planets dependency
  
  // Stop emotion detection
  const stopEmotionDetection = useCallback(() => {
    console.log('🛑 SpaceMath: stopEmotionDetection called');
    console.log('🛑 Current state - cameraActive:', cameraActive, 'gameStarted:', gameStarted);
    
    if (emotionCaptureRef.current) {
      clearInterval(emotionCaptureRef.current);
      emotionCaptureRef.current = null;
      console.log('🛑 SpaceMath: Cleared emotion capture interval');
    }
    
    emotionDetectionService.stopEmotionDetection();
    setCameraActive(false);
    setCurrentEmotion(null);
    setEmotionConfidence(0);
    console.log('🛑 SpaceMath: Emotion detection stopped');
  }, [cameraActive, gameStarted]);
  
  // Start emotion detection on game start
  const startEmotionDetection = useCallback(async () => {
    console.log('🎯 SpaceMath: startEmotionDetection called');
    console.log('🎯 Current state - cameraActive:', cameraActive, 'gameStarted:', gameStarted);
    
    // Always check if we need to stop existing detection first
    if (cameraActive) {
      console.log('🎯 SpaceMath: Camera already active, restarting...');
      stopEmotionDetection();
      // Small delay to ensure cleanup is complete
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    try {
      console.log('🎯 SpaceMath: Starting emotion detection...');
      
      // Add a small delay to ensure the game UI is fully loaded
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log('🎯 SpaceMath: About to call emotionDetectionService.startEmotionDetection');
      
      const result = await emotionDetectionService.startEmotionDetection(
        handleEmotionDetected,
        showCameraPreview // show preview if enabled
      );
      
      console.log('🎯 SpaceMath: Emotion detection result:', result);
      setCameraActive(result);
      
      // Set up periodic capture every 5 seconds
      if (result) {
        // Clear any existing interval
        if (emotionCaptureRef.current) {
          clearInterval(emotionCaptureRef.current);
        }
        
        // Add delay before starting periodic capture
        setTimeout(() => {
          if (gameStarted && emotionDetectionService.isCapturing) {
            emotionCaptureRef.current = setInterval(() => {
              if (!emotionDetectionService.isCapturing) return;
              emotionDetectionService.manualCapture();
            }, 5000);
            console.log('✅ SpaceMath: Periodic capture interval started');
          } else {
            console.warn('⚠️ SpaceMath: Game no longer active, skipping periodic capture setup');
          }
        }, 2000); // Wait 2 seconds before starting periodic capture
      }
    } catch (error) {
      console.error('❌ SpaceMath: Error starting emotion detection:', error);
      setCameraActive(false);
      setEmotionDetectionFailed(true);
    }
  }, [handleEmotionDetected, showCameraPreview, cameraActive, stopEmotionDetection, gameStarted]);

  // Forced emotion detection start (bypasses gameStarted check for initial startup)
  const startEmotionDetectionForced = useCallback(async () => {
    console.log('🎯 SpaceMath: startEmotionDetectionForced called');
    console.log('🎯 Current state - cameraActive:', cameraActive);
    
    // Always check if we need to stop existing detection first
    if (cameraActive) {
      console.log('🎯 SpaceMath: Camera already active, restarting...');
      stopEmotionDetection();
      // Small delay to ensure cleanup is complete
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    try {
      console.log('🎯 SpaceMath: Starting emotion detection (forced)...');
      
      // Add a small delay to ensure the game UI is fully loaded
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log('🎯 SpaceMath: About to call emotionDetectionService.startEmotionDetection');
      
      const result = await emotionDetectionService.startEmotionDetection(
        handleEmotionDetected,
        showCameraPreview // show preview if enabled
      );
      
      console.log('🎯 SpaceMath: Emotion detection result:', result);
      setCameraActive(result);
      
      // Set up periodic capture every 5 seconds
      if (result) {
        // Clear any existing interval
        if (emotionCaptureRef.current) {
          clearInterval(emotionCaptureRef.current);
        }
        
        // Add delay before starting periodic capture
        setTimeout(() => {
          if (emotionDetectionService.isCapturing) {
            emotionCaptureRef.current = setInterval(() => {
              if (!emotionDetectionService.isCapturing) return;
              emotionDetectionService.manualCapture();
            }, 5000);
            console.log('✅ SpaceMath: Periodic capture interval started');
          } else {
            console.warn('⚠️ SpaceMath: Emotion detection service no longer capturing, skipping periodic capture setup');
          }
        }, 2000); // Wait 2 seconds before starting periodic capture
      }
    } catch (error) {
      console.error('❌ SpaceMath: Error starting emotion detection:', error);
      setCameraActive(false);
      setEmotionDetectionFailed(true);
    }
  }, [handleEmotionDetected, showCameraPreview, cameraActive, stopEmotionDetection]);
  
  // Toggle camera on/off
  const toggleCamera = useCallback(() => {
    if (cameraActive) {
      stopEmotionDetection();
    } else {
      startEmotionDetection();
    }
  }, [cameraActive, startEmotionDetection, stopEmotionDetection]);

  // Generate stars background
  useEffect(() => {
    const generateStars = () => {
      const newStars = [];
      for (let i = 0; i < 100; i++) {
        newStars.push({
          id: i,
          left: Math.random() * 100,
          top: Math.random() * 100,
          size: Math.random() * 4 + 2,
          duration: Math.random() * 3 + 2,
          delay: Math.random() * 2
        });
      }
      setStars(newStars);
    };
    generateStars();
  }, []);

  // Generate math problem based on level
  const generateProblem = () => {
    let num1, num2, operation, answer;

    if (level <= 2) {
      // Addition (easy)
      num1 = Math.floor(Math.random() * 10) + 1;
      num2 = Math.floor(Math.random() * 10) + 1;
      operation = '+';
      answer = num1 + num2;
    } else if (level <= 4) {
      // Subtraction (medium)
      num1 = Math.floor(Math.random() * 20) + 10;
      num2 = Math.floor(Math.random() * num1) + 1;
      operation = '-';
      answer = num1 - num2;
    } else if (level <= 6) {
      // Multiplication (hard)
      num1 = Math.floor(Math.random() * 12) + 1;
      num2 = Math.floor(Math.random() * 12) + 1;
      operation = '×';
      answer = num1 * num2;
    } else {
      // Mixed operations (expert)
      const operations = ['+', '-', '×'];
      operation = operations[Math.floor(Math.random() * operations.length)];
      
      if (operation === '+') {
        num1 = Math.floor(Math.random() * 50) + 1;
        num2 = Math.floor(Math.random() * 50) + 1;
        answer = num1 + num2;
      } else if (operation === '-') {
        num1 = Math.floor(Math.random() * 100) + 20;
        num2 = Math.floor(Math.random() * num1) + 1;
        answer = num1 - num2;
      } else {
        num1 = Math.floor(Math.random() * 15) + 1;
        num2 = Math.floor(Math.random() * 15) + 1;
        answer = num1 * num2;
      }
    }

    setCurrentProblem({ num1, num2, operation, answer });
    setTotalProblems(prev => prev + 1);
  };

  // Start game
  const startGame = async () => {
    console.log('🎮 SpaceMath: Starting game...');
    setGameStarted(true);
    setGameStartTime(Date.now());
    // Initialize tracking arrays
    setEmotionsDetected([]);
    setPlanetsVisited([{
      planetIndex: currentPlanet,
      planetName: planets[currentPlanet]?.name || 'Unknown',
      emotion: currentEmotion || 'initial',
      confidence: emotionConfidence,
      timestamp: Date.now(),
      level: 1,
      score: 0
    }]);
    setProblemsSolved(0);
    setTotalProblems(0);
    generateProblem();
    
    // Automatically start emotion detection when game starts (with delay)
    setTimeout(async () => {
      try {
        console.log('🎯 SpaceMath: Auto-starting emotion detection...');
        // Call startEmotionDetection directly without checking gameStarted since we know it's true
        await startEmotionDetectionForced();
      } catch (error) {
        console.warn('⚠️ SpaceMath: Could not auto-start emotion detection:', error.message);
        // Game continues even if emotion detection fails
      }
    }, 1000); // Increased delay to ensure all state updates are complete
  };

  // Restart game
  const restartGame = useCallback(async () => {
    console.log('🔄 SpaceMath: Restarting game...');
    
    // Stop emotion detection first
    stopEmotionDetection();
    
    // Reset all game state
    setGameStarted(false);
    setGameStartTime(null);
    setScore(0);
    setLevel(1);
    setCurrentPlanet(0); // Reset to Mercury
    setCurrentEmotion(null);
    setEmotionConfidence(0);
    setCurrentProblem({ num1: 0, num2: 0, operation: '+', answer: 0 });
    setUserAnswer('');
    setFeedback('');
    setEmotionsDetected([]);
    setPlanetsVisited([]);
    setProblemsSolved(0);
    setTotalProblems(0);
    setShowLevelUp(false);
    setEmotionDetectionFailed(false);
    
    // Small delay to ensure state is reset
    await new Promise(resolve => setTimeout(resolve, 300));
    
    console.log('✅ SpaceMath: Game restarted, ready to start again');
  }, [stopEmotionDetection]);

  // Handle answer submission
  const handleAnswerSubmit = () => {
    if (userAnswer === '') return;

    const userNum = parseInt(userAnswer);
    
    if (userNum === currentProblem.answer) {
      setScore(score + level * 10);
      setProblemsSolved(prev => prev + 1);
      setFeedback('🎉 Correct! Great job, space explorer!');
      
      // Check for level up (every 3 correct answers)
      if ((score + level * 10) >= level * 30) {
        setLevel(level + 1);
        setShowLevelUp(true);
        
        // Change planet every 2 levels (if emotion detection is not active)
        if (!cameraActive && level % 2 === 0 && currentPlanet < planets.length - 1) {
          const newPlanet = currentPlanet + 1;
          setCurrentPlanet(newPlanet);
          
          // Track manual planet change
          setPlanetsVisited(prev => [
            ...prev,
            {
              planetIndex: newPlanet,
              planetName: planets[newPlanet]?.name || 'Unknown',
              emotion: 'level_progression',
              confidence: 100,
              timestamp: Date.now(),
              level: level + 1,
              score: score + level * 10
            }
          ]);
        }
        
        setTimeout(() => setShowLevelUp(false), 3000);
      }
      
      setTimeout(() => {
        setFeedback('');
        setUserAnswer('');
        generateProblem();
      }, 1500);
    } else {
      setFeedback(`❌ Not quite! The answer is ${currentProblem.answer}. Try the next one!`);
      setTimeout(() => {
        setFeedback('');
        setUserAnswer('');
        generateProblem();
      }, 2500);
    }
  };

  // Save game score when game ends or significant milestone reached
  const saveGameProgress = useCallback(async () => {
    if (!gameStartTime) return;
    
    try {
      // Check if user is authenticated before attempting to save
      const token = localStorage.getItem('joyverse_token');
      if (!token) {
        console.log('ℹ️ SpaceMath: No auth token found, skipping game save');
        return;
      }
      
      const gameEndTime = Date.now();
      const timeTaken = Math.round((gameEndTime - gameStartTime) / 1000); // in seconds
      const accuracy = totalProblems > 0 ? Math.round((problemsSolved / totalProblems) * 100) : 0;
      
      const gameData = {
        score,
        maxScore: score, // Current score as max for this session
        timeTaken,
        level,
        problemsSolved,
        totalProblems,
        accuracy,
        currentPlanet: planets[currentPlanet]?.name || 'Unknown',
        mathOperations: ['addition', 'subtraction', 'multiplication'], // Based on levels
        emotionsDetected,
        planetsVisited
      };
      
      const formattedData = gameScoreService.formatGameData('space-math', gameData);
      await gameScoreService.saveGameScore(formattedData);
      
      console.log('✅ SpaceMath: Game progress saved successfully');
    } catch (error) {
      console.warn('⚠️ SpaceMath: Could not save game progress (continuing without save):', error.message);
      // Don't throw error - game should continue even if saving fails
    }
  }, [gameStartTime, score, level, problemsSolved, totalProblems, currentPlanet, emotionsDetected, planetsVisited, planets]);

  // Auto-save progress every 30 seconds during gameplay
  useEffect(() => {
    if (!gameStarted) return;
    
    const autoSaveInterval = setInterval(() => {
      saveGameProgress();
    }, 30000); // 30 seconds
    
    return () => clearInterval(autoSaveInterval);
  }, [gameStarted, saveGameProgress]);

  // Cleanup emotion detection when game ends
  useEffect(() => {
    // Only stop emotion detection if the game has actually ended (was started and then stopped)
    if (!gameStarted && cameraActive && gameStartTime) {
      console.log('🛑 SpaceMath: Game ended, stopping emotion detection');
      stopEmotionDetection();
    }
  }, [gameStarted, gameStartTime, cameraActive, stopEmotionDetection]);

  // Cleanup emotion detection on unmount
  useEffect(() => {
    return () => {
      stopEmotionDetection();
      // Save final game state if game was started
      if (gameStarted && gameStartTime) {
        // Use a non-async function to avoid cleanup issues
        saveGameProgress().catch(error => {
          console.warn('⚠️ SpaceMath: Could not save final game state:', error.message);
        });
      }
    };
  }, [stopEmotionDetection, gameStarted, gameStartTime, saveGameProgress]);

  // Show hint
  const showHintHandler = () => {
    setShowHint(true);
    setTimeout(() => setShowHint(false), 3000);
  };

  // Switch to next planet (manual override, works even with emotion detection)
  const switchPlanet = () => {
    const newPlanet = (currentPlanet + 1) % planets.length;
    setCurrentPlanet(newPlanet);
    
    // Track manual planet change
    setPlanetsVisited(prev => [
      ...prev,
      {
        planetIndex: newPlanet,
        planetName: planets[newPlanet]?.name || 'Unknown',
        emotion: 'manual_switch',
        confidence: 100,
        timestamp: Date.now(),
        level: level,
        score: score
      }
    ]);
  };

  // Handle Enter key
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleAnswerSubmit();
    }
  };

  if (!gameStarted) {
    return (
      <div 
        ref={gameContainerRef}
        className={`space-math-game-container game-container ${currentPlanetData.bgClass} ${currentPlanetData.textClass}`}
      >
        {/* Stars Background */}
        {stars.map(star => (
          <div
            key={star.id}
            className="star-container"
            style={{ left: `${star.left}%`, top: `${star.top}%` }}
          >
            <div
              className="star twinkling"
              style={{
                width: `${star.size}px`,
                height: `${star.size}px`,
                animationDuration: `${star.duration}s`,
                animationDelay: `${star.delay}s`
              }}
            />
          </div>
        ))}

        {/* Welcome Screen */}
        <div className="welcome-screen-centered">
          <div className="welcome-content-centered">
            <Rocket className="rocket-icon-centered" />
            <h1 className="game-title-centered">Space Math Adventure</h1>
            <p className="game-subtitle-centered">
              Explore the galaxy while solving math problems!
            </p>
            <p className="emotion-subtitle-centered">
              Your emotions will automatically guide you to different planets! 🌟
            </p>
            <button 
              className={`start-button-centered ${currentPlanetData.accentClass}`}
              onClick={startGame}
            >
              <Rocket size={20} />
              Start Mission
            </button>
          </div>
          
          <div className="planet-selector-centered">
            <button 
              className="planet-button-centered"
              onClick={switchPlanet}
            >
              <span style={{ fontSize: '1.5rem' }}>{currentPlanetData.emoji}</span>
              Explore {currentPlanetData.name}
            </button>
            
            {(currentEmotion || cameraActive) && (
              <div className="current-emotion-display">
                {currentEmotion ? (
                  <span>Current Emotion: {currentEmotion} ({Math.round(emotionConfidence)}%)</span>
                ) : (
                  <span>🔍 Emotion Detection Ready</span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={gameContainerRef}
      className={`space-math-game-container game-container ${currentPlanetData.bgClass} ${currentPlanetData.textClass}`}
    >
      {/* Stars Background */}
      {stars.map(star => (
        <div
          key={star.id}
          className="star-container"
          style={{ left: `${star.left}%`, top: `${star.top}%` }}
        >
          <div
            className="star twinkling"
            style={{
              width: `${star.size}px`,
              height: `${star.size}px`,
              animationDuration: `${star.duration}s`,
              animationDelay: `${star.delay}s`
            }}
          />
        </div>
      ))}

      {/* Level Up Overlay */}
      {showLevelUp && (
        <div className="level-up-overlay">
          <div className={`level-up-popup ${currentPlanetData.accentClass}`}>
            <div className="level-up-emoji">🚀</div>
            <div className="level-up-title">Level Up!</div>
            <div className="level-up-text">You reached Level {level}!</div>
            <div className="level-up-next">
              <span>Next destination:</span>
              <ArrowRight className="arrow-icon" />
              <span>{currentPlanetData.name}</span>
            </div>
          </div>
        </div>
      )}

      {/* Emotion Detection Display */}
      {showEmotionDisplay && (
        <div className="emotion-display-overlay">
          <div className="emotion-info">
            {cameraActive && currentEmotion ? (
              <>
                <div className="emotion-status">
                  <span className="emotion-icon">😊</span>
                  <div className="emotion-details">
                    <div className="emotion-name">{currentEmotion}</div>
                    <div className="emotion-confidence">{Math.round(emotionConfidence)}% confident</div>
                    <div className="emotion-planet">Planet: {currentPlanetData.name}</div>
                  </div>
                </div>
              </>
            ) : cameraActive ? (
              <div className="emotion-loading">
                <span>🔍 Detecting emotion...</span>
              </div>
            ) : (
              <div className="emotion-loading">
                <span>📷 Starting camera...</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Hint Popup */}
      {showHint && (
        <div className="hint-container">
          <div className="hint-popup">
            💡 Hint: Try breaking down the problem into smaller parts!
          </div>
        </div>
      )}

      {/* Game Content */}
      <div className="game-content">
        {/* Header */}
        <div className="game-header">
          <div className="planet-info">
            <div className={`planet-icon ${currentPlanetData.accentClass}`}>
              {currentPlanetData.emoji}
            </div>
            <div className="planet-details">
              <h1>Mission: {currentPlanetData.name}</h1>
              <p>Space Math Adventure</p>
            </div>
          </div>
          
          <div className="score-container">
            <div className="score-item">
              <Star className="score-icon" />
              <span>Level {level}</span>
            </div>
            <div className="score-item">
              <Zap className="score-icon" />
              <span>{score} pts</span>
            </div>
            
            {/* Emotion Detection Status Indicator */}
            <div className={`emotion-status-indicator ${cameraActive ? 'active' : 'inactive'}`}>
              {cameraActive ? (
                <>
                  <Camera size={16} />
                  <span>Emotion Active</span>
                </>
              ) : (
                <>
                  <CameraOff size={16} />
                  <span>Emotion Inactive</span>
                </>
              )}
            </div>
            
            {/* Restart Button */}
            <button 
              className="restart-button"
              onClick={restartGame}
              title="Restart game and reset camera"
            >
              <span>🔄</span>
            </button>
          </div>
        </div>

        {/* Game Area */}
        <div className="game-area">
          {/* Math Problem Card */}
          <div className="game-card">
            <div className="problem-container">
              {currentProblem && (
                <>
                  <div className="problem-header">
                    <Sparkles className="sparkles-icon" />
                    <div className="problem-question">
                      {currentProblem.num1} {currentProblem.operation} {currentProblem.num2} = ?
                    </div>
                    <Sparkles className="sparkles-icon" />
                  </div>
                  
                  <div className="answer-container">
                    <input
                      type="number"
                      value={userAnswer}
                      onChange={(e) => setUserAnswer(e.target.value)}
                      onKeyPress={handleKeyPress}
                      className="answer-input"
                      placeholder="?"
                      autoFocus
                    />
                  </div>
                  
                  <button 
                    onClick={handleAnswerSubmit}
                    className={`submit-button ${currentPlanetData.accentClass}`}
                  >
                    Launch Answer
                  </button>

                  {feedback && (
                    <div className={`feedback ${feedback.includes('Correct') ? 'feedback-success' : 'feedback-info'}`}>
                      <p className="feedback-text">{feedback}</p>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Planet Info Section */}
          <div className="planet-info-section">
            <button 
              className="planet-switch-button"
              onClick={switchPlanet}
            >
              <span style={{ fontSize: '1.2rem' }}>{currentPlanetData.emoji}</span>
              Manual Planet Override
            </button>
            
            <div className="emotion-mode-info">
              <p className="emotion-mode-text">
                {cameraActive ? (
                  <>🎭 Emotion Detection Active: Planets change automatically based on your emotions!</>
                ) : emotionDetectionFailed ? (
                  <>❌ Emotion Detection Failed: Playing with manual planet switching only.</>
                ) : (
                  <>📷 Emotion Detection Starting... You can still play while it loads!</>
                )}
              </p>
            </div>
            
            <div className="planet-fact">
              <p className="fact-text">
                {currentPlanetData.facts[Math.floor(Math.random() * currentPlanetData.facts.length)]}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SpaceMathGame;