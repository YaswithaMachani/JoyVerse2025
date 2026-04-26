import React, { useState, useEffect } from 'react';
import { Play, Palette, BookOpen, Star, Heart, Smile, Award, User, Clock, Gamepad2, Music, Zap, Sun, Gift } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import GameStats from '../components/GameStats';
import emotionDetectionService from '../services/emotionAPI';

const ChildDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  // Handle logout
  const handleLogout = () => {
    logout();
    navigate('/');
  };
  
  // Simple state for child dashboard
  const [currentTheme, setCurrentTheme] = useState(0);
  const [showWelcome, setShowWelcome] = useState(true);
  const [time, setTime] = useState(new Date());

  // Fun themes for kids
  const themes = [
    { name: '🌈 Rainbow Fun', colors: ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57'] },
    { name: '🦄 Unicorn Magic', colors: ['#ff9ff3', '#54a0ff', '#5f27cd', '#00d2d3', '#ff9ff3'] },
    { name: '🌟 Space Adventure', colors: ['#2c2c54', '#40407a', '#706fd3', '#f0932b', '#eb4d4b'] },
    { name: '🌸 Flower Garden', colors: ['#ff9ff3', '#54a0ff', '#5f27cd', '#00d2d3', '#ff9ff3'] }
  ];

  const currentThemeColors = themes[currentTheme].colors;
  // Fun activities for children
  const activities = [
    {
      id: 1,
      title: '🟡 PacMan Quest',
      description: 'Eat colorful dots and avoid the walls!',
      color: '#feca57',
      icon: Gamepad2,
      emoji: '🟡',
      onClick: () => navigate('/games/pacman')
    },
    {
      id: 2,
      title: '🔤 Missing Letter Pop',
      description: 'Pop the bubbles to find missing letters!',
      color: '#54a0ff',
      icon: Zap,
      emoji: '🔤',
      onClick: () => navigate('/games/missing-letter-pop')
    },
    {
      id: 3,
      title: '🚀 Space Math',
      description: 'Solve math problems and explore the galaxy!',
      color: '#e74c3c',
      icon: Zap,
      emoji: '🚀',
      onClick: () => navigate('/games/space-math')
    },
    {
      id: 4,
      title: '� Art & Drawing',
      description: 'Create beautiful artwork and drawings!',
      color: '#4ecdc4',
      icon: Palette,
      emoji: '�',
      onClick: () => navigate('/games/art-studio')
    },
    {
      id: 5,
      title: '🎵 Music Fun',
      description: 'Listen to songs and make music!',
      color: '#96ceb4',
      icon: Music,
      emoji: '🎵',
      onClick: () => navigate('/games/music-fun')
    }

  ];

  // Update time
  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Auto theme change
  useEffect(() => {
    const themeTimer = setInterval(() => {
      setCurrentTheme(prev => (prev + 1) % themes.length);
    }, 8000);
    return () => clearInterval(themeTimer);
  }, []);

  // Hide welcome after 3 seconds
  useEffect(() => {
    const welcomeTimer = setTimeout(() => {
      setShowWelcome(false);
    }, 3000);
    return () => clearTimeout(welcomeTimer);
  }, []);

  // Ensure camera is stopped when landing on dashboard
  useEffect(() => {
    console.log('🏠 Arrived at Child Dashboard, ensuring camera is stopped');
    emotionDetectionService.stopEmotionDetection();
  }, []);

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      minHeight: '100vh',
      background: `linear-gradient(-45deg, ${currentThemeColors[0]}, ${currentThemeColors[1]}, ${currentThemeColors[2]}, ${currentThemeColors[3]})`,
      backgroundSize: '400% 400%',
      animation: 'gradientShift 15s ease infinite',
      fontFamily: '"Comic Sans MS", "Trebuchet MS", cursive, sans-serif',
      position: 'fixed',
      top: 0,
      left: 0,
      overflow: 'auto',
      margin: 0,
      padding: 0
    }}>
      {/* Welcome Animation */}
      {showWelcome && (
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
          zIndex: 1000,
          animation: 'fadeOut 3s ease-in-out forwards'
        }}>
          <div style={{ textAlign: 'center', color: 'white' }}>
            <div style={{ fontSize: '4rem', marginBottom: '1rem', animation: 'bounce 2s ease infinite' }}>
              👶
            </div>            <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem', animation: 'textGlow 2s ease infinite' }}>
              Welcome Back, {user?.childName || user?.name || 'Friend'}! 🌟
            </h1>
            <p style={{ fontSize: '1.2rem' }}>Let's have some fun today! 🎉</p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '2rem' }}>
              <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: currentThemeColors[0], animation: 'loadingDot 1.5s ease infinite' }}></div>
              <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: currentThemeColors[1], animation: 'loadingDot 1.5s ease infinite 0.2s' }}></div>
              <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: currentThemeColors[2], animation: 'loadingDot 1.5s ease infinite 0.4s' }}></div>
            </div>
          </div>
        </div>
      )}

      {/* Floating Fun Elements */}
      <div style={{
        position: 'absolute',
        top: '10%',
        left: '5%',
        fontSize: '3rem',
        animation: 'float 6s ease-in-out infinite'
      }}>⭐</div>
      <div style={{
        position: 'absolute',
        top: '20%',
        right: '10%',
        fontSize: '2.5rem',
        animation: 'float 4s ease-in-out infinite 1s'
      }}>🦋</div>
      <div style={{
        position: 'absolute',
        bottom: '15%',
        left: '8%',
        fontSize: '3rem',
        animation: 'float 5s ease-in-out infinite 2s'
      }}>🌈</div>
      <div style={{
        position: 'absolute',
        bottom: '25%',
        right: '5%',
        fontSize: '2.5rem',
        animation: 'float 7s ease-in-out infinite 0.5s'
      }}>☁️</div>

      {/* Header */}
      <header style={{
        background: 'rgba(255, 255, 255, 0.2)',
        backdropFilter: 'blur(20px)',
        padding: '1rem 2rem',
        marginBottom: '2rem',
        borderRadius: '0 0 30px 30px',
        border: '3px solid rgba(255, 255, 255, 0.3)',
        animation: 'slideDown 1s ease-out'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>            <h1 style={{
              fontSize: '2.5rem',
              color: 'white',
              textShadow: '0 3px 15px rgba(0, 0, 0, 0.3)',
              margin: 0,
              animation: 'textBounce 3s ease-in-out infinite'
            }}>
              🌟 Hi {user?.childName || user?.name || 'Friend'}! 🌟
            </h1>
            <p style={{
              color: 'rgba(255, 255, 255, 0.9)',
              fontSize: '1.2rem',
              margin: '0.5rem 0',
              fontWeight: '600'
            }}>
              Ready for some fun today? 🎈
            </p>
            <div style={{
              background: 'rgba(255, 255, 255, 0.2)',
              padding: '0.5rem 1rem',
              borderRadius: '20px',
              display: 'inline-block',
              marginTop: '0.5rem'
            }}>
              <span style={{ color: 'white', fontWeight: '600' }}>
                Current Theme: {themes[currentTheme].name}
              </span>
            </div>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{
              background: 'rgba(255, 255, 255, 0.2)',
              padding: '1rem',
              borderRadius: '20px',
              textAlign: 'center',
              color: 'white'
            }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
                {time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
              </div>
              <div style={{ fontSize: '0.9rem', opacity: 0.8 }}>
                {time.toLocaleDateString('en-US', { weekday: 'long' })}
              </div>
            </div>
            <button
              onClick={handleLogout}
              style={{
                background: 'rgba(255, 107, 107, 0.3)',
                border: '2px solid rgba(255, 255, 255, 0.5)',
                borderRadius: '20px',
                color: 'white',
                padding: '1rem 1.5rem',
                fontSize: '1rem',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                fontFamily: 'inherit'
              }}
              onMouseEnter={(e) => {
                e.target.style.background = 'rgba(255, 107, 107, 0.5)';
                e.target.style.transform = 'scale(1.05)';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = 'rgba(255, 107, 107, 0.3)';
                e.target.style.transform = 'scale(1)';
              }}
            >
              👋 Bye Bye!
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main style={{ padding: '0 2rem 2rem', maxWidth: '1200px', margin: '0 auto' }}>
        {/* Welcome Card */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.9)',
          borderRadius: '25px',
          padding: '2rem',
          marginBottom: '2rem',
          border: '3px solid rgba(255, 255, 255, 0.5)',
          textAlign: 'center',
          animation: 'slideUp 1s ease-out 0.3s both'
        }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🎪</div>
          <h2 style={{
            fontSize: '2rem',
            color: currentThemeColors[0],
            marginBottom: '1rem',
            fontWeight: '700'
          }}>
            Welcome to Your Fun Zone!
          </h2>          <p style={{
            fontSize: '1.2rem',
            color: '#666',
            marginBottom: '1.5rem',
            lineHeight: '1.6'
          }}>
            Choose an activity below and let's have some amazing fun together! 🎉<br/>
            Play games, create art, make music, and learn new things!
          </p>
          <div style={{
            background: `linear-gradient(45deg, ${currentThemeColors[0]}, ${currentThemeColors[1]})`,
            color: 'white',
            padding: '0.8rem 2rem',
            borderRadius: '20px',
            display: 'inline-block',
            fontWeight: '600',
            fontSize: '1.1rem'
          }}>
            Age: {user?.age} years old 🎂
          </div>
        </div>

        {/* Activities Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '2rem',
          marginBottom: '2rem'
        }}>
          {activities.map((activity, index) => (
            <div
              key={activity.id}
              onClick={activity.onClick}
              style={{
                background: 'rgba(255, 255, 255, 0.95)',
                borderRadius: '25px',
                padding: '2rem',
                cursor: 'pointer',
                transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                animation: `slideUp 0.8s ease-out ${index * 0.1}s both`,
                border: `4px solid ${activity.color}`,
                position: 'relative',
                overflow: 'hidden',
                textAlign: 'center'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-10px) scale(1.02)';
                e.currentTarget.style.boxShadow = `0 20px 40px rgba(0, 0, 0, 0.2)`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0) scale(1)';
                e.currentTarget.style.boxShadow = '0 10px 30px rgba(0, 0, 0, 0.1)';
              }}
            >
              <div style={{
                fontSize: '4rem',
                marginBottom: '1rem',
                animation: `bounce 2s ease-in-out infinite ${index * 0.2}s`
              }}>
                {activity.emoji}
              </div>
              <h3 style={{
                fontSize: '1.5rem',
                color: activity.color,
                marginBottom: '1rem',
                fontWeight: '700'
              }}>
                {activity.title}
              </h3>
              <p style={{
                color: '#666',
                fontSize: '1.1rem',
                marginBottom: '1.5rem',
                lineHeight: '1.5'
              }}>
                {activity.description}
              </p>
              <div style={{
                background: `linear-gradient(45deg, ${activity.color}, ${activity.color}dd)`,
                color: 'white',
                padding: '1rem 2rem',
                borderRadius: '20px',
                fontWeight: '600',
                fontSize: '1.1rem',
                transition: 'all 0.3s ease'
              }}>
                Click to Play! 🎮
              </div>
              
              {/* Sparkle Effect */}
              <div style={{
                position: 'absolute',
                top: '1rem',
                right: '1rem',
                fontSize: '1.5rem',
                animation: 'sparkle 3s linear infinite'
              }}>
                ✨
              </div>            </div>
          ))}
        </div>

        {/* Game Statistics */}
        <GameStats user={user} />

        {/* Achievement Banner */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.9)',
          borderRadius: '25px',
          padding: '2rem',
          border: '3px solid #feca57',
          textAlign: 'center',
          animation: 'slideUp 1s ease-out 0.8s both'
        }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🏆</div>
          <h3 style={{
            fontSize: '1.8rem',
            color: '#feca57',
            marginBottom: '1rem',
            fontWeight: '700'
          }}>
            You're Doing Amazing! 🌟
          </h3>
          <p style={{
            fontSize: '1.1rem',
            color: '#666',
            marginBottom: '1.5rem'
          }}>
            Keep playing and learning to unlock more fun achievements!
          </p>
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '1rem',
            flexWrap: 'wrap'
          }}>
            {['🌟', '🎯', '🚀', '🎨', '📚'].map((emoji, index) => (
              <div
                key={index}
                style={{
                  background: currentThemeColors[index % currentThemeColors.length],
                  color: 'white',
                  width: '60px',
                  height: '60px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.5rem',
                  animation: `bounce 2s ease-in-out infinite ${index * 0.3}s`
                }}
              >
                {emoji}
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default ChildDashboard;
