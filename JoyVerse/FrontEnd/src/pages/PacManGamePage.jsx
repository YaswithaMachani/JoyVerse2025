import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import PacManGame from '../components/games/PacManGame';
import emotionDetectionService from '../services/emotionAPI';

const PacManGamePage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleGameClose = () => {
    // Ensure emotion detection is stopped when leaving the game
    console.log('🚪 Leaving PacMan Game, stopping emotion detection');
    emotionDetectionService.stopEmotionDetection();
    navigate('/child-dashboard');
  };

  // Cleanup on component unmount (browser back button, etc.)
  useEffect(() => {
    return () => {
      console.log('🧹 PacManGamePage unmounting, stopping emotion detection');
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
      background: 'linear-gradient(-45deg, #2d1b69, #5b2c87, #8b5fbf, #330000)',
      backgroundSize: '400% 400%',
      animation: 'gradientShift 15s ease infinite',
      overflow: 'hidden',
      zIndex: 1000
    }}>
      <style>{`
        @keyframes gradientShift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
      `}</style>
      
      <PacManGame onClose={handleGameClose} user={user} />
    </div>
  );
};

export default PacManGamePage;
