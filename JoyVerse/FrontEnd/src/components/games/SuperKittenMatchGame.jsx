import React, { useState, useEffect, useCallback, useRef } from 'react';
import { X, Camera, Play, Pause, RotateCcw, Star, Heart, Zap, Sparkles, Trophy, Timer, Target } from 'lucide-react';
import gameScoreService from '../../services/gameScoreAPI';

const SuperKittenMatchGame = ({ onClose, user }) => {
  // Game states
  const [gameState, setGameState] = useState('menu'); // menu, camera-setup, playing, paused, complete
  const [level, setLevel] = useState(1);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [cards, setCards] = useState([]);
  const [flippedCards, setFlippedCards] = useState([]);
  const [matchedCards, setMatchedCards] = useState([]);
  const [canFlip, setCanFlip] = useState(true);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [totalMatches, setTotalMatches] = useState(0);
  
  // Enhanced emotion detection
  const [emotion, setEmotion] = useState('neutral');
  const [emotionConfidence, setEmotionConfidence] = useState(0);
  const [emotionHistory, setEmotionHistory] = useState([]);
  const [currentBackground, setCurrentBackground] = useState('');
  const [emotionFeedback, setEmotionFeedback] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [emotionBonus, setEmotionBonus] = useState(0);
  
  // Camera state
  const [cameraActive, setCameraActive] = useState(false);
  const [stream, setStream] = useState(null);
  const [cameraError, setCameraError] = useState(null);
  const [captureInterval, setCaptureInterval] = useState(null);
  
  // Animation states
  const [cardAnimations, setCardAnimations] = useState({});
  const [showParticles, setShowParticles] = useState(false);
  const [comboText, setComboText] = useState('');
  
  // Refs
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const gameTimerRef = useRef(null);
  const emotionTimerRef = useRef(null);

  // Advanced game themes with emotion-responsive elements
  const gameThemes = {
    kitten: {
      name: '🐱 Magical Kittens',
      cards: ['🐱', '😸', '😺', '😻', '😽', '🙀', '😿', '😾', '🐈', '🐈‍⬛', '🦄', '✨'],
      backgrounds: {
        happiness: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 50%, #ffecd2 100%)',
        sadness: 'linear-gradient(135deg, #a1c4fd 0%, #c2e9fb 50%, #e0f6ff 100%)',
        anger: 'linear-gradient(135deg, #ff416c 0%, #ff4b2b 50%, #ff6b6b 100%)',
        fear: 'linear-gradient(135deg, #4b6cb7 0%, #182848 50%, #2c3e50 100%)',
        surprise: 'linear-gradient(135deg, #ffeaa7 0%, #fab1a0 50%, #fdcb6e 100%)',
        disgust: 'linear-gradient(135deg, #6c5ce7 0%, #a29bfe 50%, #fd79a8 100%)',
        neutral: 'linear-gradient(135deg, #74b9ff 0%, #0984e3 50%, #00b894 100%)'
      },
      particles: {
        happiness: ['🌟', '✨', '💫', '🎉', '🎊'],
        sadness: ['💧', '💙', '🌧️', '☔'],
        anger: ['🔥', '💢', '⚡', '💥'],
        fear: ['👻', '🌙', '⭐', '🌟'],
        surprise: ['🎪', '🎭', '🎨', '🌈'],
        disgust: ['🌀', '💜', '🔮', '✨'],
        neutral: ['💎', '🌟', '✨', '⭐']
      }
    }
  };

  // Emotion-based feedback messages
  const emotionMessages = {
    happiness: ['You look so happy! 🌟', 'Great smile! Keep it up! 😊', 'Your joy is contagious! ✨'],
    sadness: ['Take your time, you got this! 💙', 'Every step counts! 🌧️', 'You are doing great! 💧'],
    anger: ['Channel that energy! 🔥', 'You are strong! 💪', 'Keep pushing forward! ⚡'],
    fear: ['You are brave! 🌙', 'One step at a time! 👻', 'Courage is in you! ⭐'],
    surprise: ['What a wonderful surprise! 🎪', 'Amazing reaction! 🎭', 'You are full of wonder! 🌈'],
    disgust: ['Stay focused! 🌀', 'You can handle this! 💜', 'Keep going strong! 🔮'],
    neutral: ['You are doing great! 💎', 'Stay focused! 🌟', 'Keep it up! ✨']
  };

  // Initialize camera
  const initializeCamera = useCallback(async () => {
    console.log('🎥 Initializing camera...');
    try {
      const constraints = {
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user'
        }
      };
      
      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(mediaStream);
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.play();
      }
      
      setCameraActive(true);
      setCameraError(null);
      console.log('✅ Camera initialized successfully');
    } catch (error) {
      console.error('❌ Camera initialization error:', error);
      setCameraError('Unable to access camera. Please allow camera permissions.');
    }
  }, []);

  // Capture image from camera
  const captureImage = useCallback(async () => {
    console.log('📸 Attempting to capture image...');
    console.log('Video ref:', videoRef.current);
    console.log('Canvas ref:', canvasRef.current);
    
    if (!videoRef.current || !canvasRef.current) {
      console.log('❌ Missing video or canvas ref');
      return null;
    }
    
    const canvas = canvasRef.current;
    const video = videoRef.current;
    const ctx = canvas.getContext('2d');
    
    console.log('Video dimensions:', video.videoWidth, 'x', video.videoHeight);
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0);
    
    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        console.log('📷 Image captured, blob size:', blob?.size);
        resolve(blob);
      }, 'image/jpeg', 0.8);
    });
  }, []);

  // Analyze emotion using FastAPI
  const analyzeEmotion = useCallback(async () => {
    console.log('🔍 Starting emotion analysis...');
    console.log('Camera active:', cameraActive);
    
    if (!cameraActive) {
      console.log('❌ Camera not active, skipping emotion analysis');
      return;
    }
    
    try {
      setIsAnalyzing(true);
      console.log('📸 Capturing image...');
      const imageBlob = await captureImage();
      
      if (!imageBlob) {
        console.log('❌ No image captured');
        return;
      }
      
      console.log('📤 Sending image to API...');
      const formData = new FormData();
      formData.append('file', imageBlob, 'emotion_capture.jpg');
      
      const response = await fetch('http://localhost:8001/predict', {
        method: 'POST',
        body: formData,
      });
      
      console.log('📡 API Response status:', response.status);
      
      if (response.ok) {
        const result = await response.json();
        console.log('📊 API Response:', result);
        const { emotion: detectedEmotion, confidence } = result;
        
        // Update emotion state
        setEmotion(detectedEmotion);
        setEmotionConfidence(confidence);
        
        // Add to history
        setEmotionHistory(prev => [...prev.slice(-19), {
          emotion: detectedEmotion,
          confidence,
          timestamp: Date.now()
        }]);
        
        // Update background
        const theme = gameThemes.kitten;
        setCurrentBackground(theme.backgrounds[detectedEmotion] || theme.backgrounds.neutral);
        
        // Set feedback message
        const messages = emotionMessages[detectedEmotion] || emotionMessages.neutral;
        setEmotionFeedback(messages[Math.floor(Math.random() * messages.length)]);
        
        // Calculate emotion bonus
        const bonus = Math.floor(confidence * 50);
        setEmotionBonus(bonus);
        
        // Add bonus for positive emotions
        if (['happiness', 'surprise'].includes(detectedEmotion) && confidence > 0.6) {
          setScore(prev => prev + bonus);
          showParticleEffect();
        }
        
        console.log(`✅ Emotion detected: ${detectedEmotion}, Confidence: ${confidence.toFixed(2)}`);
      } else {
        console.error('❌ API request failed:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('❌ Emotion analysis error:', error);
    } finally {
      setIsAnalyzing(false);
    }
  }, [cameraActive, captureImage]);

  // Show particle effect
  const showParticleEffect = useCallback(() => {
    setShowParticles(true);
    setTimeout(() => setShowParticles(false), 2000);
  }, []);

  // Generate cards for current level
  const generateCards = useCallback(() => {
    const theme = gameThemes.kitten;
    const pairsNeeded = Math.min(4 + level, 8); // 4-8 pairs based on level
    const selectedEmojis = theme.cards.slice(0, pairsNeeded);
    
    const cardPairs = selectedEmojis.flatMap(emoji => [
      { id: `${emoji}-1`, emoji, matched: false },
      { id: `${emoji}-2`, emoji, matched: false }
    ]);
    
    // Shuffle cards
    const shuffled = cardPairs.sort(() => Math.random() - 0.5);
    setCards(shuffled);
    setMatchedCards([]);
    setFlippedCards([]);
  }, [level]);

  // Handle card flip
  const handleCardFlip = useCallback((cardId) => {
    if (!canFlip || flippedCards.includes(cardId) || matchedCards.includes(cardId)) return;
    
    const newFlipped = [...flippedCards, cardId];
    setFlippedCards(newFlipped);
    
    // Add flip animation
    setCardAnimations(prev => ({
      ...prev,
      [cardId]: 'flip'
    }));
    
    if (newFlipped.length === 2) {
      setCanFlip(false);
      
      const [firstId, secondId] = newFlipped;
      const firstCard = cards.find(c => c.id === firstId);
      const secondCard = cards.find(c => c.id === secondId);
      
      if (firstCard.emoji === secondCard.emoji) {
        // Match found!
        setTimeout(() => {
          setMatchedCards(prev => [...prev, firstId, secondId]);
          setFlippedCards([]);
          setCanFlip(true);
          
          // Update score and streak
          const matchScore = 100 + (streak * 10);
          setScore(prev => prev + matchScore);
          setStreak(prev => prev + 1);
          setBestStreak(prev => Math.max(prev, streak + 1));
          setTotalMatches(prev => prev + 1);
          
          // Show combo text
          if (streak >= 2) {
            setComboText(`${streak + 1}x COMBO! +${matchScore}`);
            setTimeout(() => setComboText(''), 2000);
          }
          
          // Add match animation
          setCardAnimations(prev => ({
            ...prev,
            [firstId]: 'match',
            [secondId]: 'match'
          }));
          
          showParticleEffect();
          
          // Check if level complete
          if (matchedCards.length + 2 === cards.length) {
            setTimeout(() => {
              setLevel(prev => prev + 1);
              setTimeLeft(60 + level * 10); // More time for higher levels
              generateCards();
            }, 1000);
          }
        }, 500);
      } else {
        // No match
        setTimeout(() => {
          setFlippedCards([]);
          setCanFlip(true);
          setStreak(0);
          
          // Add shake animation
          setCardAnimations(prev => ({
            ...prev,
            [firstId]: 'shake',
            [secondId]: 'shake'
          }));
        }, 1000);
      }
    }
  }, [canFlip, flippedCards, matchedCards, cards, streak, level, generateCards]);

  // Start game with camera
  const startGame = useCallback(() => {
    console.log('🎮 Starting game...');
    setGameState('playing');
    setScore(0);
    setLevel(1);
    setTimeLeft(60);
    setStreak(0);
    setBestStreak(0);
    setTotalMatches(0);
    generateCards();
    
    // Start game timer
    gameTimerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          setGameState('complete');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    // Camera will be initialized by useEffect when gameState changes to 'playing'
  }, [generateCards]);

  // Pause/Resume game
  const togglePause = useCallback(() => {
    if (gameState === 'playing') {
      setGameState('paused');
      clearInterval(gameTimerRef.current);
      clearInterval(emotionTimerRef.current);
    } else if (gameState === 'paused') {
      setGameState('playing');
      gameTimerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            setGameState('complete');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      
      // Emotion detection will restart via useEffect when gameState changes
    }
  }, [gameState]);

  // Reset game
  const resetGame = useCallback(() => {
    console.log('🔄 Resetting game...');
    setGameState('menu');
    clearInterval(gameTimerRef.current);
    clearInterval(emotionTimerRef.current);
    
    // Stop camera
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      console.log('📹 Camera stopped during reset');
    }
    setStream(null);
    setCameraActive(false);
    setCameraError(null);
    
    // Reset game state
    setScore(0);
    setLevel(1);
    setTimeLeft(60);
    setCards([]);
    setFlippedCards([]);
    setMatchedCards([]);
    setStreak(0);
    setBestStreak(0);
    setTotalMatches(0);
    setCardAnimations({});
    setComboText('');
    setShowParticles(false);
    
    // Reset emotion state
    setEmotion('neutral');
    setEmotionConfidence(0);
    setEmotionHistory([]);
    setCurrentBackground('');
    setEmotionFeedback('');
    setIsAnalyzing(false);
    setEmotionBonus(0);
  }, [stream]);

  // Save game score
  const saveScore = useCallback(async () => {
    if (!user) return;
    
    try {
      const gameData = {
        userId: user.id,
        gameType: 'SuperKittenMatch',
        score,
        level,
        totalMatches,
        bestStreak,
        emotionData: emotionHistory,
        duration: 60 - timeLeft
      };
      
      await gameScoreService.saveScore(gameData);
      console.log('Score saved successfully');
    } catch (error) {
      console.error('Error saving score:', error);
    }
  }, [user, score, level, totalMatches, bestStreak, emotionHistory, timeLeft]);

  // Cleanup camera when game closes
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
        console.log('📹 Camera stopped');
      }
    };
  }, [stream]);

  // Start emotion detection when camera becomes active
  useEffect(() => {
    if (cameraActive && gameState === 'playing') {
      console.log('🤖 Starting emotion detection...');
      emotionTimerRef.current = setInterval(analyzeEmotion, 3000);
    } else {
      if (emotionTimerRef.current) {
        clearInterval(emotionTimerRef.current);
        console.log('🤖 Emotion detection stopped');
      }
    }
    
    return () => {
      if (emotionTimerRef.current) {
        clearInterval(emotionTimerRef.current);
      }
    };
  }, [cameraActive, gameState, analyzeEmotion]);

  // Initialize camera automatically when game starts
  useEffect(() => {
    if (gameState === 'playing') {
      initializeCamera();
    }
  }, [gameState, initializeCamera]);

  // Cleanup all timers on unmount
  useEffect(() => {
    return () => {
      clearInterval(gameTimerRef.current);
      clearInterval(emotionTimerRef.current);
    };
  }, []);

  // Clear card animations
  useEffect(() => {
    const timeout = setTimeout(() => {
      setCardAnimations({});
    }, 1000);
    return () => clearTimeout(timeout);
  }, [cardAnimations]);

  // Save score when game completes
  useEffect(() => {
    if (gameState === 'complete') {
      saveScore();
    }
  }, [gameState, saveScore]);
  const renderMenu = () => (
    <div style={{
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div style={{
        background: 'rgba(255, 255, 255, 0.95)',
        borderRadius: '20px',
        padding: '40px',
        textAlign: 'center',
        maxWidth: '500px',
        backdropFilter: 'blur(10px)',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)'
      }}>
        <div style={{ fontSize: '4rem', marginBottom: '20px' }}>🐱✨</div>
        <h1 style={{ 
          fontSize: '2.5rem', 
          fontWeight: 'bold', 
          color: '#2c3e50',
          marginBottom: '20px'
        }}>
          Super Kitten Match
        </h1>
        <p style={{ 
          fontSize: '1.2rem', 
          color: '#666',
          marginBottom: '30px',
          lineHeight: '1.6'
        }}>
          🎮 Match adorable kitten cards while our AI analyzes your emotions!<br/>
          🌈 Your feelings change the game background<br/>
          😊 Positive emotions earn bonus points!
        </p>
        
        <div style={{ marginBottom: '30px' }}>
          <button
            onClick={startGame}
            style={{
              background: 'linear-gradient(45deg, #667eea, #764ba2)',
              color: 'white',
              border: 'none',
              borderRadius: '20px',
              padding: '20px 50px',
              fontSize: '1.4rem',
              fontWeight: 'bold',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '15px',
              margin: '0 auto',
              transition: 'all 0.3s ease',
              boxShadow: '0 15px 30px rgba(102, 126, 234, 0.4)',
              textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)'
            }}
            onMouseOver={(e) => {
              e.target.style.transform = 'scale(1.05)';
              e.target.style.boxShadow = '0 20px 40px rgba(102, 126, 234, 0.6)';
            }}
            onMouseOut={(e) => {
              e.target.style.transform = 'scale(1)';
              e.target.style.boxShadow = '0 15px 30px rgba(102, 126, 234, 0.4)';
            }}
          >
            <Sparkles size={28} />
            Let's Get Started!
            <Camera size={24} />
          </button>
          
          <p style={{ 
            fontSize: '1rem', 
            color: '#7f8c8d',
            marginTop: '15px',
            fontStyle: 'italic'
          }}>
            📷 Camera will automatically start for emotion detection
          </p>
        </div>
        
        <div style={{ 
          background: 'rgba(52, 73, 94, 0.05)',
          borderRadius: '15px',
          padding: '25px',
          marginTop: '20px'
        }}>
          <h3 style={{ 
            color: '#2c3e50', 
            marginBottom: '15px',
            fontSize: '1.3rem',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            <Star size={20} />
            How to Play:
          </h3>
          <ul style={{ 
            textAlign: 'left', 
            color: '#666',
            listStyle: 'none',
            padding: 0,
            lineHeight: '1.8'
          }}>
            <li style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <span style={{ fontSize: '1.2rem' }}>🎯</span>
              <span>Match pairs of adorable kitten cards</span>
            </li>
            <li style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <span style={{ fontSize: '1.2rem' }}>⏱️</span>
              <span>Beat the clock to advance to higher levels</span>
            </li>
            <li style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <span style={{ fontSize: '1.2rem' }}>🔥</span>
              <span>Build streaks for massive bonus points</span>
            </li>
            <li style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <span style={{ fontSize: '1.2rem' }}>📷</span>
              <span>Camera captures your emotions automatically</span>
            </li>
            <li style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <span style={{ fontSize: '1.2rem' }}>🌈</span>
              <span>Game backgrounds change with your mood</span>
            </li>
            <li style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '1.2rem' }}>😊</span>
              <span>Positive emotions earn extra bonus points!</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );

  // Render camera setup
  const renderCameraSetup = () => (
    <div style={{
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div style={{
        background: 'rgba(255, 255, 255, 0.95)',
        borderRadius: '20px',
        padding: '40px',
        textAlign: 'center',
        maxWidth: '600px',
        backdropFilter: 'blur(10px)',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)'
      }}>
        <h2 style={{ 
          fontSize: '2rem', 
          color: '#2c3e50',
          marginBottom: '20px'
        }}>
          📷 Camera Setup
        </h2>
        
        {cameraError ? (
          <div style={{
            background: 'rgba(255, 107, 107, 0.1)',
            color: '#e74c3c',
            padding: '15px',
            borderRadius: '10px',
            marginBottom: '20px'
          }}>
            ❌ {cameraError}
          </div>
        ) : (
          <div style={{ marginBottom: '20px' }}>
            <div style={{
              width: '320px',
              height: '240px',
              border: '3px solid #667eea',
              borderRadius: '15px',
              margin: '0 auto 20px',
              overflow: 'hidden',
              position: 'relative'
            }}>
              <video
                ref={videoRef}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover'
                }}
                autoPlay
                muted
                playsInline
              />
              <canvas
                ref={canvasRef}
                style={{ display: 'none' }}
              />
            </div>
            
            {isAnalyzing && (
              <div style={{
                color: '#667eea',
                fontSize: '1.1rem',
                fontWeight: 'bold'
              }}>
                🤖 Analyzing your emotion...
              </div>
            )}
            
            {emotion && (
              <div style={{
                background: 'rgba(102, 126, 234, 0.1)',
                color: '#667eea',
                padding: '10px',
                borderRadius: '10px',
                marginTop: '10px'
              }}>
                Current emotion: <strong>{emotion}</strong> ({(emotionConfidence * 100).toFixed(1)}%)
              </div>
            )}
            
            {cameraActive && (
              <div style={{ marginTop: '15px' }}>
                <button
                  onClick={analyzeEmotion}
                  disabled={isAnalyzing}
                  style={{
                    background: isAnalyzing ? '#bdc3c7' : 'linear-gradient(45deg, #ff6b6b, #ff8787)',
                    color: 'white',
                    border: 'none',
                    padding: '10px 20px',
                    borderRadius: '10px',
                    cursor: isAnalyzing ? 'not-allowed' : 'pointer',
                    fontSize: '1rem',
                    fontWeight: 'bold',
                    marginRight: '10px',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseOver={(e) => !isAnalyzing && (e.target.style.transform = 'scale(1.05)')}
                  onMouseOut={(e) => !isAnalyzing && (e.target.style.transform = 'scale(1)')}
                >
                  {isAnalyzing ? '🔄 Analyzing...' : '🧠 Test Emotion Detection'}
                </button>
                
                <button
                  onClick={async () => {
                    try {
                      const response = await fetch('http://localhost:8001/test');
                      const result = await response.json();
                      console.log('✅ API Test successful:', result);
                      alert('API Connection successful! ' + result.message);
                    } catch (error) {
                      console.error('❌ API Test failed:', error);
                      alert('API Connection failed: ' + error.message);
                    }
                  }}
                  style={{
                    background: 'linear-gradient(45deg, #00b894, #00cec9)',
                    color: 'white',
                    border: 'none',
                    padding: '10px 20px',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    fontSize: '1rem',
                    fontWeight: 'bold',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseOver={(e) => (e.target.style.transform = 'scale(1.05)')}
                  onMouseOut={(e) => (e.target.style.transform = 'scale(1)')}
                >
                  🔗 Test API Connection
                </button>
              </div>
            )}
          </div>
        )}
        
        <div style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
          <button
            onClick={startGame}
            disabled={!cameraActive && !cameraError}
            style={{
              background: cameraActive ? 'linear-gradient(45deg, #00b894, #00cec9)' : '#bdc3c7',
              color: 'white',
              border: 'none',
              borderRadius: '15px',
              padding: '15px 30px',
              fontSize: '1.1rem',
              fontWeight: 'bold',
              cursor: cameraActive ? 'pointer' : 'not-allowed',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              transition: 'transform 0.2s',
              boxShadow: cameraActive ? '0 10px 20px rgba(0, 184, 148, 0.3)' : 'none'
            }}
            onMouseOver={(e) => cameraActive && (e.target.style.transform = 'scale(1.05)')}
            onMouseOut={(e) => e.target.style.transform = 'scale(1)'}
          >
            <Play size={20} />
            Start Game
          </button>
          
          <button
            onClick={() => setGameState('menu')}
            style={{
              background: 'linear-gradient(45deg, #636e72, #2d3436)',
              color: 'white',
              border: 'none',
              borderRadius: '15px',
              padding: '15px 30px',
              fontSize: '1.1rem',
              fontWeight: 'bold',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              transition: 'transform 0.2s',
              boxShadow: '0 10px 20px rgba(99, 110, 114, 0.3)'
            }}
            onMouseOver={(e) => e.target.style.transform = 'scale(1.05)'}
            onMouseOut={(e) => e.target.style.transform = 'scale(1)'}
          >
            <X size={20} />
            Back
          </button>
        </div>
      </div>
    </div>
  );

  // Render game board
  const renderGame = () => (
    <div style={{
      background: currentBackground || gameThemes.kitten.backgrounds.neutral,
      minHeight: '100vh',
      padding: '20px',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Particles */}
      {showParticles && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          zIndex: 1000
        }}>
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                fontSize: '2rem',
                animation: `float ${2 + Math.random() * 3}s ease-in-out infinite`,
                animationDelay: `${Math.random() * 2}s`
              }}
            >
              {gameThemes.kitten.particles[emotion]?.[Math.floor(Math.random() * gameThemes.kitten.particles[emotion].length)] || '✨'}
            </div>
          ))}
        </div>
      )}
      
      {/* Game Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px',
        background: 'rgba(255, 255, 255, 0.9)',
        borderRadius: '15px',
        padding: '15px 20px',
        backdropFilter: 'blur(10px)',
        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(231, 76, 60, 0.1)',
              color: '#e74c3c',
              border: 'none',
              borderRadius: '50%',
              width: '40px',
              height: '40px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'transform 0.2s'
            }}
            onMouseOver={(e) => e.target.style.transform = 'scale(1.1)'}
            onMouseOut={(e) => e.target.style.transform = 'scale(1)'}
          >
            <X size={20} />
          </button>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <Trophy size={20} color="#f39c12" />
              <span style={{ fontWeight: 'bold', color: '#2c3e50' }}>
                {score.toLocaleString()}
              </span>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <Target size={20} color="#e74c3c" />
              <span style={{ fontWeight: 'bold', color: '#2c3e50' }}>
                Level {level}
              </span>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <Timer size={20} color="#3498db" />
              <span style={{ 
                fontWeight: 'bold', 
                color: timeLeft < 10 ? '#e74c3c' : '#2c3e50'
              }}>
                {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
              </span>
            </div>
          </div>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {streak > 1 && (
            <div style={{
              background: 'linear-gradient(45deg, #fd79a8, #fdcb6e)',
              color: 'white',
              padding: '5px 10px',
              borderRadius: '20px',
              fontSize: '0.9rem',
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              gap: '5px'
            }}>
              <Zap size={16} />
              {streak}x Streak
            </div>
          )}
          
          <button
            onClick={togglePause}
            style={{
              background: gameState === 'paused' ? 'rgba(46, 204, 113, 0.1)' : 'rgba(52, 152, 219, 0.1)',
              color: gameState === 'paused' ? '#2ecc71' : '#3498db',
              border: 'none',
              borderRadius: '50%',
              width: '40px',
              height: '40px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'transform 0.2s'
            }}
            onMouseOver={(e) => e.target.style.transform = 'scale(1.1)'}
            onMouseOut={(e) => e.target.style.transform = 'scale(1)'}
          >
            {gameState === 'paused' ? <Play size={20} /> : <Pause size={20} />}
          </button>
        </div>
      </div>
      
      {/* Emotion Display */}
      {cameraActive && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          background: 'rgba(255, 255, 255, 0.9)',
          borderRadius: '15px',
          padding: '15px',
          backdropFilter: 'blur(10px)',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)',
          zIndex: 100
        }}>
          <div style={{
            width: '150px',
            height: '100px',
            border: '2px solid #667eea',
            borderRadius: '10px',
            overflow: 'hidden',
            marginBottom: '10px'
          }}>
            <video
              ref={videoRef}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover'
              }}
              autoPlay
              muted
              playsInline
            />
          </div>
          
          {emotion && (
            <div style={{ textAlign: 'center', fontSize: '0.9rem' }}>
              <div style={{ fontWeight: 'bold', color: '#2c3e50' }}>
                {emotion.charAt(0).toUpperCase() + emotion.slice(1)}
              </div>
              <div style={{ color: '#666', fontSize: '0.8rem' }}>
                {(emotionConfidence * 100).toFixed(1)}%
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* Emotion Feedback */}
      {emotionFeedback && (
        <div style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          background: 'rgba(255, 255, 255, 0.95)',
          color: '#2c3e50',
          padding: '20px 30px',
          borderRadius: '15px',
          fontSize: '1.2rem',
          fontWeight: 'bold',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)',
          zIndex: 200,
          animation: 'fadeInOut 3s ease-in-out'
        }}>
          {emotionFeedback}
        </div>
      )}
      
      {/* Combo Text */}
      {comboText && (
        <div style={{
          position: 'fixed',
          top: '30%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          background: 'linear-gradient(45deg, #fd79a8, #fdcb6e)',
          color: 'white',
          padding: '15px 25px',
          borderRadius: '20px',
          fontSize: '1.5rem',
          fontWeight: 'bold',
          boxShadow: '0 15px 30px rgba(253, 121, 168, 0.3)',
          zIndex: 200,
          animation: 'bounce 2s ease-in-out'
        }}>
          {comboText}
        </div>
      )}
      
      {/* Game Board */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${Math.ceil(Math.sqrt(cards.length))}, 1fr)`,
        gap: '15px',
        maxWidth: '800px',
        margin: '0 auto',
        padding: '20px'
      }}>
        {cards.map((card) => (
          <div
            key={card.id}
            onClick={() => handleCardFlip(card.id)}
            style={{
              width: '100px',
              height: '100px',
              background: matchedCards.includes(card.id) 
                ? 'linear-gradient(45deg, #00b894, #00cec9)'
                : flippedCards.includes(card.id)
                ? 'linear-gradient(45deg, #74b9ff, #0984e3)'
                : 'linear-gradient(45deg, #ddd, #bbb)',
              borderRadius: '15px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: !matchedCards.includes(card.id) && !flippedCards.includes(card.id) ? 'pointer' : 'default',
              fontSize: '2.5rem',
              fontWeight: 'bold',
              transition: 'all 0.3s ease',
              transform: cardAnimations[card.id] === 'flip' ? 'rotateY(180deg)' : 
                        cardAnimations[card.id] === 'shake' ? 'translateX(-5px)' :
                        cardAnimations[card.id] === 'match' ? 'scale(1.1)' : 'scale(1)',
              boxShadow: '0 10px 20px rgba(0, 0, 0, 0.1)',
              backdropFilter: 'blur(10px)',
              animation: cardAnimations[card.id] === 'shake' ? 'shake 0.5s ease-in-out' : 'none'
            }}
            onMouseOver={(e) => {
              if (!matchedCards.includes(card.id) && !flippedCards.includes(card.id)) {
                e.target.style.transform = 'scale(1.05)';
              }
            }}
            onMouseOut={(e) => {
              if (!matchedCards.includes(card.id) && !flippedCards.includes(card.id)) {
                e.target.style.transform = 'scale(1)';
              }
            }}
          >
            {matchedCards.includes(card.id) || flippedCards.includes(card.id) ? card.emoji : '?'}
          </div>
        ))}
      </div>
      
      {/* Canvas for image capture */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </div>
  );

  // Render game complete screen
  const renderGameComplete = () => (
    <div style={{
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div style={{
        background: 'rgba(255, 255, 255, 0.95)',
        borderRadius: '20px',
        padding: '40px',
        textAlign: 'center',
        maxWidth: '600px',
        backdropFilter: 'blur(10px)',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)'
      }}>
        <div style={{ fontSize: '4rem', marginBottom: '20px' }}>🏆</div>
        <h2 style={{ 
          fontSize: '2.5rem', 
          fontWeight: 'bold', 
          color: '#2c3e50',
          marginBottom: '20px'
        }}>
          Game Complete!
        </h2>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '20px',
          marginBottom: '30px'
        }}>
          <div style={{
            background: 'rgba(52, 152, 219, 0.1)',
            padding: '20px',
            borderRadius: '15px'
          }}>
            <div style={{ fontSize: '2rem', color: '#3498db' }}>🎯</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#2c3e50' }}>
              {score.toLocaleString()}
            </div>
            <div style={{ color: '#666' }}>Final Score</div>
          </div>
          
          <div style={{
            background: 'rgba(46, 204, 113, 0.1)',
            padding: '20px',
            borderRadius: '15px'
          }}>
            <div style={{ fontSize: '2rem', color: '#2ecc71' }}>📊</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#2c3e50' }}>
              {level}
            </div>
            <div style={{ color: '#666' }}>Levels Completed</div>
          </div>
          
          <div style={{
            background: 'rgba(155, 89, 182, 0.1)',
            padding: '20px',
            borderRadius: '15px'
          }}>
            <div style={{ fontSize: '2rem', color: '#9b59b6' }}>🔥</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#2c3e50' }}>
              {bestStreak}
            </div>
            <div style={{ color: '#666' }}>Best Streak</div>
          </div>
          
          <div style={{
            background: 'rgba(231, 76, 60, 0.1)',
            padding: '20px',
            borderRadius: '15px'
          }}>
            <div style={{ fontSize: '2rem', color: '#e74c3c' }}>💝</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#2c3e50' }}>
              {totalMatches}
            </div>
            <div style={{ color: '#666' }}>Total Matches</div>
          </div>
        </div>
        
        {emotionHistory.length > 0 && (
          <div style={{
            background: 'rgba(52, 73, 94, 0.05)',
            borderRadius: '15px',
            padding: '20px',
            marginBottom: '30px'
          }}>
            <h3 style={{ color: '#2c3e50', marginBottom: '15px' }}>
              😊 Emotion Journey
            </h3>
            <div style={{ 
              display: 'flex', 
              flexWrap: 'wrap', 
              gap: '10px',
              justifyContent: 'center'
            }}>
              {emotionHistory.slice(-10).map((entry, index) => (
                <div
                  key={index}
                  style={{
                    background: gameThemes.kitten.backgrounds[entry.emotion],
                    color: 'white',
                    padding: '8px 12px',
                    borderRadius: '20px',
                    fontSize: '0.9rem',
                    fontWeight: 'bold',
                    textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)'
                  }}
                >
                  {entry.emotion} ({(entry.confidence * 100).toFixed(0)}%)
                </div>
              ))}
            </div>
          </div>
        )}
        
        <div style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
          <button
            onClick={resetGame}
            style={{
              background: 'linear-gradient(45deg, #00b894, #00cec9)',
              color: 'white',
              border: 'none',
              borderRadius: '15px',
              padding: '15px 30px',
              fontSize: '1.2rem',
              fontWeight: 'bold',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              transition: 'transform 0.2s',
              boxShadow: '0 10px 20px rgba(0, 184, 148, 0.3)'
            }}
            onMouseOver={(e) => e.target.style.transform = 'scale(1.05)'}
            onMouseOut={(e) => e.target.style.transform = 'scale(1)'}
          >
            <RotateCcw size={20} />
            Play Again
          </button>
          
          <button
            onClick={onClose}
            style={{
              background: 'linear-gradient(45deg, #636e72, #2d3436)',
              color: 'white',
              border: 'none',
              borderRadius: '15px',
              padding: '15px 30px',
              fontSize: '1.2rem',
              fontWeight: 'bold',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              transition: 'transform 0.2s',
              boxShadow: '0 10px 20px rgba(99, 110, 114, 0.3)'
            }}
            onMouseOver={(e) => e.target.style.transform = 'scale(1.05)'}
            onMouseOut={(e) => e.target.style.transform = 'scale(1)'}
          >
            <X size={20} />
            Exit Game
          </button>
        </div>
      </div>
    </div>
  );

  // Render paused screen
  const renderPaused = () => (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      background: 'rgba(0, 0, 0, 0.8)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        background: 'rgba(255, 255, 255, 0.95)',
        borderRadius: '20px',
        padding: '40px',
        textAlign: 'center',
        backdropFilter: 'blur(10px)',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)'
      }}>
        <div style={{ fontSize: '4rem', marginBottom: '20px' }}>⏸️</div>
        <h2 style={{ 
          fontSize: '2rem', 
          fontWeight: 'bold', 
          color: '#2c3e50',
          marginBottom: '20px'
        }}>
          Game Paused
        </h2>
        
        <div style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
          <button
            onClick={togglePause}
            style={{
              background: 'linear-gradient(45deg, #00b894, #00cec9)',
              color: 'white',
              border: 'none',
              borderRadius: '15px',
              padding: '15px 30px',
              fontSize: '1.2rem',
              fontWeight: 'bold',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              transition: 'transform 0.2s',
              boxShadow: '0 10px 20px rgba(0, 184, 148, 0.3)'
            }}
            onMouseOver={(e) => e.target.style.transform = 'scale(1.05)'}
            onMouseOut={(e) => e.target.style.transform = 'scale(1)'}
          >
            <Play size={20} />
            Resume
          </button>
          
          <button
            onClick={resetGame}
            style={{
              background: 'linear-gradient(45deg, #636e72, #2d3436)',
              color: 'white',
              border: 'none',
              borderRadius: '15px',
              padding: '15px 30px',
              fontSize: '1.2rem',
              fontWeight: 'bold',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              transition: 'transform 0.2s',
              boxShadow: '0 10px 20px rgba(99, 110, 114, 0.3)'
            }}
            onMouseOver={(e) => e.target.style.transform = 'scale(1.05)'}
            onMouseOut={(e) => e.target.style.transform = 'scale(1)'}
          >
            <RotateCcw size={20} />
            Restart
          </button>
        </div>
      </div>
    </div>
  );

  // Add CSS animations
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes float {
        0%, 100% { transform: translateY(0px) rotate(0deg); }
        50% { transform: translateY(-20px) rotate(180deg); }
      }
      
      @keyframes fadeInOut {
        0%, 100% { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
        50% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
      }
      
      @keyframes bounce {
        0%, 100% { transform: translate(-50%, -50%) scale(1); }
        50% { transform: translate(-50%, -50%) scale(1.1); }
      }
      
      @keyframes shake {
        0%, 100% { transform: translateX(0); }
        25% { transform: translateX(-5px); }
        75% { transform: translateX(5px); }
      }
      
      @keyframes sparkle {
        0%, 100% { opacity: 0; transform: scale(0.5); }
        50% { opacity: 1; transform: scale(1); }
      }
      
      @keyframes pulse {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.02); }
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  // Main render
  return (
    <div>
      {gameState === 'menu' && renderMenu()}
      {gameState === 'camera-setup' && renderCameraSetup()}
      {gameState === 'playing' && renderGame()}
      {gameState === 'complete' && renderGameComplete()}
      {gameState === 'paused' && renderPaused()}
    </div>
  );
};

export default SuperKittenMatchGame;
