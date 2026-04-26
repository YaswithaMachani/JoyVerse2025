import React from 'react';
import SpaceMathGame from '../components/games/SpaceMathGame';

const SpaceMathGamePage = () => {
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      margin: 0,
      padding: 0,
      overflow: 'hidden',
      zIndex: 9999
    }}>
      <SpaceMathGame />
    </div>
  );
};

export default SpaceMathGamePage;