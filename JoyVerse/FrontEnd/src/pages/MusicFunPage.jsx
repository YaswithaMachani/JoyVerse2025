import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import MusicFun from '../components/games/MusicFun';
import emotionDetectionService from '../services/emotionAPI';

const MusicFunPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleGameClose = () => {
    // Ensure emotion detection is stopped when leaving the game
    console.log('🚪 Leaving Music Fun Game, stopping emotion detection');
    emotionDetectionService.stopEmotionDetection();
    navigate('/child-dashboard');
  };

  // Cleanup on component unmount (browser back button, etc.)
  useEffect(() => {
    return () => {
      console.log('🧹 MusicFunPage unmounting, stopping emotion detection');
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
      overflow: 'hidden',
      zIndex: 1000
    }}>
      <MusicFun 
        onClose={handleGameClose}
        user={user}
      />
    </div>
  );
};

export default MusicFunPage;
