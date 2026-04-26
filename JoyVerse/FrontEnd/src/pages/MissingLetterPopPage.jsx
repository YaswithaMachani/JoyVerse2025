import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import MissingLetterPop from '../components/games/MissingLetterPop';

const MissingLetterPopPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleGameClose = () => {
    navigate('/child-dashboard');
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      background: 'black',
      overflow: 'hidden',
      zIndex: 1
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
          zIndex: 9999999,
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
        zIndex: 9999999,
        boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)'
      }}>
        🔤 Missing Letter Pop
      </div>

      {/* Full Screen Game */}
      <div style={{
        width: '100%',
        height: '100%',
        position: 'absolute',
        top: 0,
        left: 0,
        zIndex: 2,
        pointerEvents: 'auto'
      }}>
        <MissingLetterPop 
          onClose={handleGameClose}
          user={user}
        />
      </div>
    </div>
  );
};

export default MissingLetterPopPage;
