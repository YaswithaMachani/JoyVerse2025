import React, { useState, useEffect, useCallback, useRef } from 'react';
import { X, Gamepad2, Zap, Camera, Heart, Star, Sparkles } from 'lucide-react';
import gameScoreService from '../../services/gameScoreAPI';

const EnhancedKittenMatchGame = ({ onClose, user }) => {
  // Game state
  const [gameState, setGameState] = useState('menu'); // menu, camera, preview, playing, complete
  const [level, setLevel] = useState(1);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [cards, setCards] = useState([]);
  const [flippedCards, setFlippedCards] = useState([]);
  const [matchedCards, setMatchedCards] = useState([]);
  const [canFlip, setCanFlip] = useState(true);
  const [previewTime, setPreviewTime] = useState(3);  
  const [showingPreview, setShowingPreview] = useState(false);
  const [currentTheme, setCurrentTheme] = useState(0);
  const [gameStartTime, setGameStartTime] = useState(null);
  const [gameEndTime, setGameEndTime] = useState(null);
  const [encouragingMessage, setEncouragingMessage] = useState('');
  const [showEncouragement, setShowEncouragement] = useState(false);
  
  // Enhanced emotion detection state
  const [emotion, setEmotion] = useState('neutral');
  const [emotionConfidence, setEmotionConfidence] = useState(0);
  const [emotionHistory, setEmotionHistory] = useState([]);
  const [currentBackground, setCurrentBackground] = useState(null);
  const [emotionFeedback, setEmotionFeedback] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [captureCount, setCaptureCount] = useState(0);
  const [emotionScore, setEmotionScore] = useState(0);
  
  // Camera state
  const [showWebcam, setShowWebcam] = useState(false);
  const [stream, setStream] = useState(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [webcamReady, setWebcamReady] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  
  // Refs
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const captureIntervalRef = useRef(null);

  // Enhanced game themes with emotion-responsive backgrounds
  const themes = [
    {
      name: '🐱 Cute Kittens',
      emojis: ['🐱', '😸', '😺', '😻', '😽', '🙀', '😿', '😾'],
      colors: {
        primary: '#ff6b6b',
        secondary: '#ff8e8e',
        front: '#74b9ff',
        frontSecondary: '#0984e3'
      },
      backgrounds: {
        happiness: 'linear-gradient(-45deg, #ff9a9e, #fecfef, #fad0c4, #ffd1ff)',
        sadness: 'linear-gradient(-45deg, #a1c4fd, #c2e9fb, #6a85b6, #bac8e0)',
        anger: 'linear-gradient(-45deg, #ff416c, #ff4b2b, #f78ca0, #fe9a8b)',
        fear: 'linear-gradient(-45deg, #4b6cb7, #182848, #2c3e50, #4b6cb7)',
        surprise: 'linear-gradient(-45deg, #faaca8, #ddd6f3, #f3e7e9, #e3eeff)',
        neutral: 'linear-gradient(-45deg, #ff9a9e, #fecfef, #fecfef, #ffecd2)'
      }
    },
    {
      name: '🌊 Ocean Friends',
      emojis: ['🐟', '🐠', '🐡', '🦈', '🐙', '🦑', '🐚', '🦀'],
      colors: {
        primary: '#00b894',
        secondary: '#00cec9',
        front: '#0984e3',
        frontSecondary: '#74b9ff'
      },
      backgrounds: {
        happiness: 'linear-gradient(-45deg, #a8edea, #fed6e3, #d3e0dc, #a8e6cf)',
        sadness: 'linear-gradient(-45deg, #667eea, #764ba2, #4b6cb7, #182848)',
        anger: 'linear-gradient(-45deg, #ff416c, #ff4b2b, #d63031, #e17055)',
        fear: 'linear-gradient(-45deg, #2c3e50, #3498db, #2c3e50, #34495e)',
        surprise: 'linear-gradient(-45deg, #00cec9, #55a3ff, #6c5ce7, #a29bfe)',
        neutral: 'linear-gradient(-45deg, #a8edea, #fed6e3, #d3e0dc, #a8e6cf)'
      }
    },
    {
      name: '🚀 Space Adventure',
      emojis: ['🚀', '🛸', '👽', '🌟', '🌙', '⭐', '🌍', '🛰️'],
      colors: {
        primary: '#6c5ce7',
        secondary: '#a29bfe',
        front: '#fd79a8',
        frontSecondary: '#fdcb6e'
      },
      backgrounds: {
        happiness: 'linear-gradient(-45deg, #667eea, #764ba2, #f093fb, #f5576c)',
        sadness: 'linear-gradient(-45deg, #2c3e50, #3498db, #2c3e50, #34495e)',
        anger: 'linear-gradient(-45deg, #ff416c, #ff4b2b, #d63031, #e17055)',
        fear: 'linear-gradient(-45deg, #4b6cb7, #182848, #2c3e50, #4b6cb7)',
        surprise: 'linear-gradient(-45deg, #667eea, #764ba2, #f093fb, #f5576c)',
        neutral: 'linear-gradient(-45deg, #667eea, #764ba2, #f093fb, #f5576c)'
      }
    },
    {
      name: '🦄 Magical World',
      emojis: ['🦄', '🌈', '✨', '⭐', '🎀', '🎪', '🎭', '🎨'],
      colors: {
        primary: '#fd79a8',
        secondary: '#fdcb6e',
        front: '#6c5ce7',
        frontSecondary: '#00cec9'
      },
      backgrounds: {
        happiness: 'linear-gradient(-45deg, #ff9a9e, #fecfef, #ffecd2, #fcb69f)',
        sadness: 'linear-gradient(-45deg, #a1c4fd, #c2e9fb, #6a85b6, #bac8e0)',
        anger: 'linear-gradient(-45deg, #ff416c, #ff4b2b, #f78ca0, #fe9a8b)',
        fear: 'linear-gradient(-45deg, #4b6cb7, #182848, #2c3e50, #4b6cb7)',
        surprise: 'linear-gradient(-45deg, #faaca8, #ddd6f3, #f3e7e9, #e3eeff)',
        neutral: 'linear-gradient(-45deg, #ff9a9e, #fecfef, #ffecd2, #fcb69f)'
      }
    }
  ];

  // Emotion-based feedback messages
  const emotionFeedbacks = {
    happiness: [
      "🎉 Your smile is making the game more colorful!",
      "😊 Your joy is contagious! Keep matching!",
      "🌟 What a wonderful expression! You're doing great!",
      "✨ Your happiness is lighting up the screen!"
    ],
    sadness: [
      "🤗 Don't worry, you're doing amazing!",
      "💙 Take your time, every match counts!",
      "🌈 Let's turn that frown upside down!",
      "💫 You're braver than you believe!"
    ],
    anger: [
      "🌸 Take a deep breath, you've got this!",
      "🕊️ Stay calm and keep matching!",
      "🌺 Your patience will pay off!",
      "🎯 Focus on the positive matches!"
    ],
    fear: [
      "💪 You're braver than you know!",
      "🛡️ Every match makes you stronger!",
      "🌟 Believe in yourself!",
      "🦋 You can do this!"
    ],
    surprise: [
      "🎊 What an amazing expression!",
      "🎈 Your enthusiasm is wonderful!",
      "🎪 Love your energy!",
      "🎭 You're full of surprises!"
    ],
    neutral: [
      "🎮 Great focus and concentration!",
      "🧠 You're thinking strategically!",
      "⚡ Steady as you go!",
      "🎯 Perfect game face!"
    ]
  };

  const currentThemeData = themes[currentTheme];
  const kittenTypes = currentThemeData.emojis;

  // Camera Functions
  const startCamera = useCallback(async () => {
    try {
      setCameraError(null);
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { 
          width: { ideal: 640 }, 
          height: { ideal: 480 },
          facingMode: 'user' 
        }
      });
      
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.onloadedmetadata = () => {
          setWebcamReady(true);
          setShowWebcam(true);
          setGameState('camera');
        };
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      setCameraError('Camera access denied. You can still play without emotion detection!');
      setGameState('menu');
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setShowWebcam(false);
    setWebcamReady(false);
    setIsCapturing(false);
    
    if (captureIntervalRef.current) {
      clearInterval(captureIntervalRef.current);
      captureIntervalRef.current = null;
    }
  }, [stream]);

  const captureImage = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current || !webcamReady) return;

    const canvas = canvasRef.current;
    const video = videoRef.current;
    const context = canvas.getContext('2d');
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0);
    
    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        resolve(blob);
      }, 'image/jpeg', 0.8);
    });
  }, [webcamReady]);

  const analyzeEmotion = useCallback(async (imageBlob) => {
    if (!imageBlob) return;
    
    setIsAnalyzing(true);
    try {
      const formData = new FormData();
      formData.append('file', imageBlob, 'captured_image.jpg');
      
      const response = await fetch('http://localhost:8001/predict', {
        method: 'POST',
        body: formData,
      });
      
      if (response.ok) {
        const result = await response.json();
        const { emotion: detectedEmotion, confidence, probs } = result;
        
        // Update emotion state
        setEmotion(detectedEmotion);
        setEmotionConfidence(confidence);
        
        // Add to emotion history
        setEmotionHistory(prev => [
          ...prev.slice(-9), // Keep last 9 entries
          { emotion: detectedEmotion, confidence, timestamp: Date.now() }
        ]);
        
        // Update background based on emotion
        const newBackground = currentThemeData.backgrounds[detectedEmotion] || 
                            currentThemeData.backgrounds.neutral;
        setCurrentBackground(newBackground);
        
        // Set emotion feedback
        const feedbacks = emotionFeedbacks[detectedEmotion] || emotionFeedbacks.neutral;
        const randomFeedback = feedbacks[Math.floor(Math.random() * feedbacks.length)];
        setEmotionFeedback(randomFeedback);
        
        // Calculate emotion bonus score
        const emotionBonus = Math.round(confidence * 100);
        setEmotionScore(prev => prev + emotionBonus);
        
        // Add bonus to main score for positive emotions
        if (['happiness', 'surprise'].includes(detectedEmotion) && confidence > 0.7) {
          setScore(prev => prev + emotionBonus);
        }
        
        setCaptureCount(prev => prev + 1);
        
        console.log('Emotion detected:', detectedEmotion, 'Confidence:', confidence);
      } else {
        console.error('Failed to analyze emotion');
      }
    } catch (error) {
      console.error('Error analyzing emotion:', error);
    } finally {
      setIsAnalyzing(false);
    }
  }, [currentThemeData, emotionFeedbacks]);

  const startEmotionCapture = useCallback(() => {
    if (captureIntervalRef.current) {
      clearInterval(captureIntervalRef.current);
    }
    
    setIsCapturing(true);
    
    // Capture immediately
    captureImage().then(analyzeEmotion);
    
    // Then capture every 8 seconds
    captureIntervalRef.current = setInterval(async () => {
      if (gameState === 'playing' && webcamReady) {
        const imageBlob = await captureImage();
        if (imageBlob) {
          analyzeEmotion(imageBlob);
        }
      }
    }, 8000);
  }, [gameState, webcamReady, captureImage, analyzeEmotion]);

  const stopEmotionCapture = useCallback(() => {
    if (captureIntervalRef.current) {
      clearInterval(captureIntervalRef.current);
      captureIntervalRef.current = null;
    }
    setIsCapturing(false);
  }, []);

  // Game Functions
  const generateCards = useCallback((gameLevel) => {
    let id = 0;
    const pairsToUse = Math.min(3 + gameLevel, 8);
    const selectedEmojis = kittenTypes.slice(0, pairsToUse);
    const newCards = [...selectedEmojis, ...selectedEmojis]
      .sort(() => Math.random() - 0.5)
      .map(emoji => ({
        id: id++,
        emoji,
        flipped: false,
        matched: false
      }));
    
    setCards(newCards);
    setFlippedCards([]);
    setMatchedCards([]);
    setCanFlip(true);
    setGameStartTime(Date.now());
  }, [kittenTypes]);

  const handleCardClick = useCallback((card) => {
    if (!canFlip || card.flipped || card.matched || flippedCards.length >= 2) return;

    const newFlippedCards = [...flippedCards, card];
    setFlippedCards(newFlippedCards);
    
    const newCards = cards.map(c => 
      c.id === card.id ? { ...c, flipped: true } : c
    );
    setCards(newCards);

    if (newFlippedCards.length === 2) {
      setCanFlip(false);
      
      if (newFlippedCards[0].emoji === newFlippedCards[1].emoji) {
        // Match found!
        setTimeout(() => {
          const matchedIds = newFlippedCards.map(c => c.id);
          setMatchedCards(prev => {
            const newMatched = [...prev, ...matchedIds];
            if (newMatched.length === cards.length) {
              // Game completed!
              const endTime = Date.now();
              setGameEndTime(endTime);
              
              const timeTaken = gameStartTime ? Math.round((endTime - gameStartTime) / 1000) : 0;
              const gameData = {
                score: score + 100 + (combo * 10) + emotionScore,
                maxScore: (cards.length / 2) * 100 + (cards.length / 2 * 10),
                timeTaken,
                level,
                matchesFound: newMatched.length / 2,
                totalPairs: cards.length / 2,
                difficulty: currentThemeData.name,
                emotionScore,
                captureCount,
                dominantEmotion: getMostFrequentEmotion()
              };
              
              saveGameScore(gameData);
              setTimeout(() => setGameState('complete'), 500);
            }
            return newMatched;
          });
          
          setCards(prev => prev.map(c => 
            matchedIds.includes(c.id) ? { ...c, matched: true } : c
          ));
          setScore(prev => prev + 100 + (combo * 10));
          setCombo(prev => prev + 1);
          setFlippedCards([]);
          setCanFlip(true);
          
          // Show encouraging message
          const encouragingWords = [
            "🎉 Great match!",
            "🌟 Awesome!",
            "💫 Fantastic!",
            "🎊 Well done!",
            "✨ Perfect!",
            "🏆 Excellent!",
            "🎈 Amazing!",
            "🌈 Wonderful!"
          ];
          const randomMessage = encouragingWords[Math.floor(Math.random() * encouragingWords.length)];
          setEncouragingMessage(randomMessage);
          setShowEncouragement(true);
          setTimeout(() => setShowEncouragement(false), 2000);
        }, 1000);
      } else {
        // No match
        setTimeout(() => {
          setCards(prev => prev.map(c => 
            newFlippedCards.some(fc => fc.id === c.id) ? { ...c, flipped: false } : c
          ));
          setFlippedCards([]);
          setCanFlip(true);
          setCombo(0);
        }, 1500);
      }
    }
  }, [canFlip, flippedCards, cards, score, combo, emotionScore, gameStartTime, level, currentThemeData, captureCount]);

  const getMostFrequentEmotion = useCallback(() => {
    if (emotionHistory.length === 0) return 'neutral';
    
    const emotionCounts = {};
    emotionHistory.forEach(entry => {
      emotionCounts[entry.emotion] = (emotionCounts[entry.emotion] || 0) + 1;
    });
    
    return Object.keys(emotionCounts).reduce((a, b) => 
      emotionCounts[a] > emotionCounts[b] ? a : b
    );
  }, [emotionHistory]);

  const saveGameScore = async (gameData) => {
    try {
      const formattedData = gameScoreService.formatGameData('kitten-match', gameData);
      await gameScoreService.saveGameScore(formattedData);
      console.log('Game score saved successfully');
    } catch (error) {
      console.error('Failed to save game score:', error);
    }
  };

  const startGame = useCallback(() => {
    setScore(0);
    setCombo(0);
    setLevel(1);
    setEmotionScore(0);
    setCaptureCount(0);
    setEmotionHistory([]);
    setGameState('preview');
    setShowingPreview(true);
    setPreviewTime(3);
    generateCards(1);
    
    // Start emotion capture if camera is available
    if (webcamReady) {
      startEmotionCapture();
    }
    
    const previewTimer = setInterval(() => {
      setPreviewTime(prev => {
        if (prev <= 1) {
          clearInterval(previewTimer);
          setShowingPreview(false);
          setGameState('playing');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [generateCards, webcamReady, startEmotionCapture]);

  const handleNextLevel = useCallback(() => {
    const newLevel = level + 1;
    setLevel(newLevel);
    setGameState('preview');
    setShowingPreview(true);
    setPreviewTime(3);
    generateCards(newLevel);
    
    // Rotate theme every 3 levels
    if (newLevel % 3 === 0) {
      setCurrentTheme(prev => (prev + 1) % themes.length);
    }
    
    const previewTimer = setInterval(() => {
      setPreviewTime(prev => {
        if (prev <= 1) {
          clearInterval(previewTimer);
          setShowingPreview(false);
          setGameState('playing');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [level, generateCards, themes.length]);

  const handleCloseGame = useCallback(() => {
    stopCamera();
    stopEmotionCapture();
    onClose();
  }, [stopCamera, stopEmotionCapture, onClose]);

  // Effects
  useEffect(() => {
    return () => {
      stopCamera();
      stopEmotionCapture();
    };
  }, [stopCamera, stopEmotionCapture]);

  // Set initial background
  useEffect(() => {
    if (!currentBackground) {
      setCurrentBackground(currentThemeData.backgrounds.neutral);
    }
  }, [currentThemeData, currentBackground]);

  return (
    <div 
      className="game-modal"
      style={{ 
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        background: currentBackground || currentThemeData.backgrounds.neutral,
        backdropFilter: 'blur(10px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        fontFamily: '"Comic Sans MS", "Trebuchet MS", cursive, sans-serif',
        transition: 'background 0.5s ease'
      }}
    >
      <div 
        className="game-container"
        style={{
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(15px)',
          borderRadius: '25px',
          padding: '2rem',
          margin: '2rem',
          maxWidth: '800px',
          width: '90%',
          maxHeight: '90vh',
          overflowY: 'auto',
          border: `3px solid ${currentThemeData.colors.primary}`,
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
        }}
      >
        {/* Game Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1.5rem',
          color: currentThemeData.colors.primary
        }}>
          <h2 style={{
            fontSize: '1.5rem',
            margin: 0,
            fontWeight: 700
          }}>
            🐱 Enhanced Kitten Match - Level {level}
          </h2>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1rem'
          }}>
            <div style={{
              display: 'flex',
              gap: '1rem',
              fontSize: '1rem',
              color: '#333',
              fontWeight: 600
            }}>
              <span>Score: {score}</span>
              <span>Combo: {combo}</span>
              <span>Emotion: {emotionScore}</span>
              <span>Theme: {currentThemeData.name}</span>
            </div>
            <button 
              onClick={handleCloseGame}
              style={{
                background: 'rgba(255, 107, 107, 0.2)',
                border: '2px solid #ff6b6b',
                borderRadius: '50%',
                width: '40px',
                height: '40px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ff6b6b',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Emotion Status Bar */}
        {showWebcam && (
          <div style={{
            background: 'rgba(255, 255, 255, 0.9)',
            borderRadius: '15px',
            padding: '1rem',
            marginBottom: '1rem',
            border: `2px solid ${currentThemeData.colors.primary}`
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              marginBottom: '0.5rem'
            }}>
              <span style={{ fontWeight: 600, color: '#333' }}>Current Emotion:</span>
              <span style={{
                fontSize: '1.1rem',
                fontWeight: 700,
                color: currentThemeData.colors.primary,
                textTransform: 'capitalize'
              }}>
                {emotion}
              </span>
              <span style={{ fontSize: '0.9rem', color: '#666' }}>
                ({Math.round(emotionConfidence * 100)}%)
              </span>
            </div>
            {emotionFeedback && (
              <div style={{
                fontStyle: 'italic',
                color: currentThemeData.colors.primary,
                marginBottom: '0.5rem'
              }}>
                {emotionFeedback}
              </div>
            )}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              fontSize: '0.9rem',
              color: '#666'
            }}>
              <span>Captures: {captureCount}</span>
              {isAnalyzing && (
                <span style={{
                  color: currentThemeData.colors.primary,
                  fontWeight: 600
                }}>
                  🔍 Analyzing...
                </span>
              )}
            </div>
          </div>
        )}

        {/* Game Menu */}
        {gameState === 'menu' && (
          <div style={{ textAlign: 'center', padding: '2rem 0' }}>
            <div>
              <div>
                <h1 style={{
                  fontSize: '2.5rem',
                  color: currentThemeData.colors.primary,
                  marginBottom: '0.5rem',
                  textShadow: '2px 2px 4px rgba(0, 0, 0, 0.1)'
                }}>
                  🐱 Enhanced Kitten Match
                </h1>
                <p style={{
                  fontSize: '1.2rem',
                  color: '#666',
                  marginBottom: '2rem'
                }}>
                  Memory game with AI emotion detection!
                </p>
              </div>
              
              {cameraError && (
                <div style={{
                  background: 'rgba(255, 107, 107, 0.1)',
                  border: '2px solid #ff6b6b',
                  borderRadius: '10px',
                  padding: '1rem',
                  marginBottom: '1rem',
                  color: '#d63031'
                }}>
                  <p>⚠️ {cameraError}</p>
                </div>
              )}
              
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
                marginBottom: '2rem',
                alignItems: 'center'
              }}>
                <button 
                  onClick={startGame}
                  style={{
                    padding: '1.2rem 2rem',
                    fontSize: '1.1rem',
                    width: '300px',
                    justifyContent: 'center',
                    border: 'none',
                    borderRadius: '15px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    fontFamily: 'inherit',
                    background: `linear-gradient(45deg, ${currentThemeData.colors.primary}, ${currentThemeData.colors.secondary})`,
                    color: 'white'
                  }}
                >
                  <Gamepad2 size={24} />
                  Start Game (No Camera)
                </button>
                <button 
                  onClick={startCamera}
                  style={{
                    padding: '1.2rem 2rem',
                    fontSize: '1.1rem',
                    width: '300px',
                    justifyContent: 'center',
                    border: `2px solid ${currentThemeData.colors.primary}`,
                    borderRadius: '15px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    fontFamily: 'inherit',
                    background: 'rgba(255, 255, 255, 0.9)',
                    color: currentThemeData.colors.primary
                  }}
                >
                  <Camera size={24} />
                  Start with Emotion Detection
                </button>
              </div>
              
              <div style={{
                background: `rgba(${currentThemeData.colors.primary.replace('#', '')}, 0.1)`,
                borderRadius: '15px',
                padding: '1.5rem',
                textAlign: 'left'
              }}>
                <h3 style={{
                  color: currentThemeData.colors.primary,
                  marginBottom: '1rem'
                }}>
                  ✨ Enhanced Features:
                </h3>
                <ul style={{
                  listStyle: 'none',
                  padding: 0
                }}>
                  <li style={{ padding: '0.5rem 0', color: '#555', fontWeight: 600 }}>
                    🎮 Progressive difficulty levels
                  </li>
                  <li style={{ padding: '0.5rem 0', color: '#555', fontWeight: 600 }}>
                    🎨 4 beautiful themes
                  </li>
                  <li style={{ padding: '0.5rem 0', color: '#555', fontWeight: 600 }}>
                    📸 Real-time emotion detection
                  </li>
                  <li style={{ padding: '0.5rem 0', color: '#555', fontWeight: 600 }}>
                    🌈 Dynamic backgrounds that respond to emotions
                  </li>
                  <li style={{ padding: '0.5rem 0', color: '#555', fontWeight: 600 }}>
                    🏆 Emotion-based scoring system
                  </li>
                  <li style={{ padding: '0.5rem 0', color: '#555', fontWeight: 600 }}>
                    💬 Personalized encouragement
                  </li>
                  <li style={{ padding: '0.5rem 0', color: '#555', fontWeight: 600 }}>
                    ♿ Dyslexia-friendly design
                  </li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Camera Setup */}
        {gameState === 'camera' && (
          <div style={{ textAlign: 'center', padding: '1rem' }}>
            <h3 style={{
              color: currentThemeData.colors.primary,
              marginBottom: '0.5rem'
            }}>
              📸 Camera Setup
            </h3>
            <p style={{
              color: '#666',
              marginBottom: '1.5rem'
            }}>
              The camera will capture your emotions during the game to change backgrounds and give you personalized feedback!
            </p>
            
            <div style={{
              margin: '1.5rem 0',
              borderRadius: '15px',
              overflow: 'hidden',
              boxShadow: '0 10px 30px rgba(0, 0, 0, 0.2)'
            }}>
              <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                muted
                style={{
                  width: '100%',
                  maxWidth: '400px',
                  height: 'auto',
                  borderRadius: '15px'
                }}
              />
              <canvas ref={canvasRef} style={{ display: 'none' }} />
            </div>
            
            <div style={{
              display: 'flex',
              gap: '1rem',
              justifyContent: 'center',
              marginTop: '1.5rem'
            }}>
              <button 
                onClick={startGame}
                style={{
                  padding: '0.8rem 1.5rem',
                  border: 'none',
                  borderRadius: '15px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontFamily: 'inherit',
                  fontSize: '1rem',
                  background: `linear-gradient(45deg, ${currentThemeData.colors.primary}, ${currentThemeData.colors.secondary})`,
                  color: 'white'
                }}
              >
                <Gamepad2 size={16} />
                Start Game
              </button>
              <button 
                onClick={() => {
                  stopCamera();
                  setGameState('menu');
                }}
                style={{
                  padding: '0.8rem 1.5rem',
                  border: `2px solid ${currentThemeData.colors.primary}`,
                  borderRadius: '15px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontFamily: 'inherit',
                  fontSize: '1rem',
                  background: 'rgba(255, 255, 255, 0.9)',
                  color: currentThemeData.colors.primary
                }}
              >
                Back to Menu
              </button>
            </div>
          </div>
        )}

        {/* Game Preview */}
        {gameState === 'preview' && showingPreview && (
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: 'rgba(0, 0, 0, 0.9)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '25px'
          }}>
            <div style={{
              textAlign: 'center',
              color: 'white'
            }}>
              <h3 style={{
                fontSize: '1.8rem',
                marginBottom: '1rem'
              }}>
                Memorize the {currentThemeData.name.split(' ')[1]}!
              </h3>
              <div style={{
                display: 'flex',
                justifyContent: 'center',
                gap: '1rem',
                margin: '1.5rem 0',
                flexWrap: 'wrap'
              }}>
                {kittenTypes.slice(0, Math.min(3 + level, 8)).map((animal, index) => (
                  <div key={index} style={{
                    fontSize: '3rem',
                    animation: 'bounceIn 1s ease-out'
                  }}>
                    {animal}
                  </div>
                ))}
              </div>
              <p>Get ready! Starting in {previewTime} seconds...</p>
            </div>
          </div>
        )}

        {/* Game Board */}
        {gameState === 'playing' && (
          <>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(80px, 1fr))',
              gap: '1rem',
              marginBottom: '1.5rem',
              maxWidth: '500px',
              marginLeft: 'auto',
              marginRight: 'auto'
            }}>
              {cards.map(card => (
                <div 
                  key={card.id} 
                  onClick={() => handleCardClick(card)}
                  style={{ 
                    aspectRatio: '1',
                    borderRadius: '15px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '2.5rem',
                    color: 'white',
                    fontWeight: 'bold',
                    transition: 'all 0.3s ease',
                    boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)',
                    border: '3px solid rgba(255, 255, 255, 0.3)',
                    backgroundColor: card.flipped || card.matched ? 
                      currentThemeData.colors.front : currentThemeData.colors.secondary,
                    opacity: card.matched ? 0.8 : 1,
                    transform: card.matched ? 'scale(0.95)' : 'scale(1)'
                  }}
                >
                  <div style={{ fontSize: '2.5rem' }}>
                    {card.flipped || card.matched ? card.emoji : '?'}
                  </div>
                </div>
              ))}
            </div>
            
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '1rem',
              marginTop: '1rem'
            }}>
              <button 
                onClick={handleCloseGame}
                style={{
                  padding: '0.8rem 1.5rem',
                  border: `2px solid ${currentThemeData.colors.primary}`,
                  borderRadius: '15px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontFamily: 'inherit',
                  fontSize: '1rem',
                  background: 'rgba(255, 255, 255, 0.9)',
                  color: currentThemeData.colors.primary
                }}
              >
                <X size={16} />
                Give Up
              </button>
              {showWebcam && (
                <button 
                  onClick={() => {
                    captureImage().then(analyzeEmotion);
                  }}
                  style={{
                    padding: '0.8rem 1.5rem',
                    border: 'none',
                    borderRadius: '15px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    fontFamily: 'inherit',
                    fontSize: '1rem',
                    background: `linear-gradient(45deg, ${currentThemeData.colors.primary}, ${currentThemeData.colors.secondary})`,
                    color: 'white'
                  }}
                >
                  <Camera size={16} />
                  Capture Now
                </button>
              )}
            </div>
          </>
        )}

        {/* Game Complete */}
        {gameState === 'complete' && (
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <h3 style={{
              fontSize: '2rem',
              color: currentThemeData.colors.primary,
              marginBottom: '1rem',
              animation: 'celebrateText 1s ease-out'
            }}>
              🎉 Level {level} Complete!
            </h3>
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '2rem',
              margin: '2rem 0',
              flexWrap: 'wrap'
            }}>
              <div style={{
                background: `rgba(${currentThemeData.colors.primary.replace('#', '')}, 0.1)`,
                borderRadius: '15px',
                padding: '1rem',
                minWidth: '150px'
              }}>
                <h4 style={{
                  color: currentThemeData.colors.primary,
                  marginBottom: '0.5rem'
                }}>
                  Game Stats
                </h4>
                <p style={{ margin: '0.5rem 0', fontWeight: 600, color: '#333' }}>
                  Score: {score}
                </p>
                <p style={{ margin: '0.5rem 0', fontWeight: 600, color: '#333' }}>
                  Combo: {combo}
                </p>
                <p style={{ margin: '0.5rem 0', fontWeight: 600, color: '#333' }}>
                  Theme: {currentThemeData.name}
                </p>
              </div>
              {showWebcam && (
                <div style={{
                  background: `rgba(${currentThemeData.colors.primary.replace('#', '')}, 0.1)`,
                  borderRadius: '15px',
                  padding: '1rem',
                  minWidth: '150px'
                }}>
                  <h4 style={{
                    color: currentThemeData.colors.primary,
                    marginBottom: '0.5rem'
                  }}>
                    Emotion Stats
                  </h4>
                  <p style={{ margin: '0.5rem 0', fontWeight: 600, color: '#333' }}>
                    Emotion Score: {emotionScore}
                  </p>
                  <p style={{ margin: '0.5rem 0', fontWeight: 600, color: '#333' }}>
                    Captures: {captureCount}
                  </p>
                  <p style={{ margin: '0.5rem 0', fontWeight: 600, color: '#333' }}>
                    Dominant Emotion: {getMostFrequentEmotion()}
                  </p>
                </div>
              )}
            </div>
            
            <div style={{
              display: 'flex',
              gap: '1rem',
              justifyContent: 'center',
              flexWrap: 'wrap',
              marginTop: '2rem'
            }}>
              <button 
                onClick={handleNextLevel}
                style={{
                  padding: '0.8rem 1.5rem',
                  border: 'none',
                  borderRadius: '15px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontFamily: 'inherit',
                  fontSize: '1rem',
                  background: `linear-gradient(45deg, ${currentThemeData.colors.primary}, ${currentThemeData.colors.secondary})`,
                  color: 'white'
                }}
              >
                <Zap size={16} />
                Next Level
              </button>
              <button 
                onClick={() => setGameState('menu')}
                style={{
                  padding: '0.8rem 1.5rem',
                  border: `2px solid ${currentThemeData.colors.primary}`,
                  borderRadius: '15px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontFamily: 'inherit',
                  fontSize: '1rem',
                  background: 'rgba(255, 255, 255, 0.9)',
                  color: currentThemeData.colors.primary
                }}
              >
                Main Menu
              </button>
              <button 
                onClick={handleCloseGame}
                style={{
                  padding: '0.8rem 1.5rem',
                  border: `2px solid ${currentThemeData.colors.primary}`,
                  borderRadius: '15px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontFamily: 'inherit',
                  fontSize: '1rem',
                  background: 'rgba(255, 255, 255, 0.9)',
                  color: currentThemeData.colors.primary
                }}
              >
                Exit Game
              </button>
            </div>
          </div>
        )}

        {/* Webcam Feed (Hidden) */}
        {showWebcam && gameState === 'playing' && (
          <div style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            width: '150px',
            height: '112px',
            borderRadius: '10px',
            overflow: 'hidden',
            boxShadow: '0 4px 15px rgba(0, 0, 0, 0.3)',
            border: `2px solid ${currentThemeData.colors.primary}`,
            zIndex: 1001
          }}>
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              muted
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover'
              }}
            />
            <canvas ref={canvasRef} style={{ display: 'none' }} />
          </div>
        )}

        {/* Encouraging Message */}
        {showEncouragement && (
          <div style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            background: 'rgba(255, 255, 255, 0.95)',
            borderRadius: '20px',
            padding: '2rem',
            textAlign: 'center',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
            border: `3px solid ${currentThemeData.colors.primary}`,
            zIndex: 1002,
            animation: 'popIn 0.5s ease-out'
          }}>
            <div style={{ color: currentThemeData.colors.primary }}>
              <Star size={32} style={{
                marginBottom: '1rem',
                animation: 'spin 2s linear infinite'
              }} />
              <p style={{
                fontSize: '1.2rem',
                fontWeight: 600,
                margin: 0
              }}>
                {encouragingMessage}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EnhancedKittenMatchGame;
