import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ArtStudio from '../components/games/ArtStudio';
import emotionDetectionService from '../services/emotionAPI';

const ArtStudioPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleGameClose = () => {
    // Ensure emotion detection is stopped when leaving the game
    console.log('🚪 Leaving Art Studio Game, stopping emotion detection');
    emotionDetectionService.stopEmotionDetection();
    navigate('/child-dashboard');
  };

  // Cleanup on component unmount (browser back button, etc.)
  useEffect(() => {
    return () => {
      console.log('🧹 ArtStudioPage unmounting, stopping emotion detection');
      emotionDetectionService.stopEmotionDetection();
    };
  }, []);

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      background: 'linear-gradient(-45deg, #4ecdc4, #96ceb4, #feca57, #ff9ff3)',
      backgroundSize: '400% 400%',
      animation: 'gradientShift 15s ease infinite',
      overflow: 'hidden',
      zIndex: 1000
    }}>
      {/* Floating Back Button */}
      <button
        onClick={handleGameClose}
        style={{
          position: 'absolute',
          top: '20px',
          left: '20px',
          background: 'rgba(255, 255, 255, 0.9)',
          border: 'none',
          borderRadius: '50px',
          padding: '12px 20px',
          fontSize: '16px',
          fontWeight: '600',
          color: '#333',
          cursor: 'pointer',
          zIndex: 1001,
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)',
          transition: 'all 0.3s ease'
        }}
        onMouseEnter={(e) => {
          e.target.style.background = 'rgba(255, 255, 255, 1)';
          e.target.style.transform = 'scale(1.05)';
        }}
        onMouseLeave={(e) => {
          e.target.style.background = 'rgba(255, 255, 255, 0.9)';
          e.target.style.transform = 'scale(1)';
        }}
      >
        ← Back to Dashboard
      </button>

      {/* Game Title */}
      <div style={{
        position: 'absolute',
        top: '20px',
        right: '20px',
        background: 'rgba(255, 255, 255, 0.9)',
        borderRadius: '25px',
        padding: '10px 20px',
        fontSize: '18px',
        fontWeight: '700',
        color: '#333',
        zIndex: 1001,
        boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)'
      }}>
        🎨 Art Studio
      </div>

      {/* Full Screen Game */}
      <div style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <ArtStudio 
          onClose={handleGameClose}
          user={user}
        />
      </div>
    </div>
  );
};

export default ArtStudioPage;
