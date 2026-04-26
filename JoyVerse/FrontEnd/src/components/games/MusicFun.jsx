import React, { useState, useEffect, useRef } from 'react';
import { X } from 'lucide-react';

const MusicFun = ({ onClose, user }) => {
  const [isDayTheme, setIsDayTheme] = useState(true);
  const [activeInstrument, setActiveInstrument] = useState(null);
  const audioContextRef = useRef(null);

  // Initialize audio context
  useEffect(() => {
    audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  // Piano notes frequencies
  const pianoNotes = [
    261.63, // C4
    293.66, // D4
    329.63, // E4
    349.23, // F4
    392.00, // G4
    440.00, // A4
    493.88, // B4
    523.25, // C5
    587.33, // D5
    659.25, // E5
  ];

  // Generate sound using Web Audio API
  const playSound = (frequency, waveType = 'sine', duration = 0.5) => {
    if (!audioContextRef.current) return;
    
    const oscillator = audioContextRef.current.createOscillator();
    const gainNode = audioContextRef.current.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContextRef.current.destination);
    
    oscillator.frequency.setValueAtTime(frequency, audioContextRef.current.currentTime);
    oscillator.type = waveType;
    
    gainNode.gain.setValueAtTime(0.3, audioContextRef.current.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContextRef.current.currentTime + duration);
    
    oscillator.start(audioContextRef.current.currentTime);
    oscillator.stop(audioContextRef.current.currentTime + duration);
  };

  // Random piano sound for keyboard
  const playRandomPiano = () => {
    const randomNote = pianoNotes[Math.floor(Math.random() * pianoNotes.length)];
    playSound(randomNote, 'sine', 0.8);
  };

  // Handle keyboard events
  useEffect(() => {
    const handleKeyPress = (event) => {
      playRandomPiano();
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  // Instrument configurations
  const instruments = [
    { 
      name: 'Piano', 
      icon: '🎹', 
      frequency: 440, 
      waveType: 'sine', 
      gradientClass: 'gradient-pink-purple' 
    },
    { 
      name: 'Guitar', 
      icon: '🎸', 
      frequency: 330, 
      waveType: 'sawtooth', 
      gradientClass: 'gradient-orange-red' 
    },
    { 
      name: 'Violin', 
      icon: '🎻', 
      frequency: 659, 
      waveType: 'triangle', 
      gradientClass: 'gradient-yellow-orange' 
    },
    { 
      name: 'Trumpet', 
      icon: '🎺', 
      frequency: 466, 
      waveType: 'square', 
      gradientClass: 'gradient-blue-indigo' 
    },
    { 
      name: 'Drums', 
      icon: '🥁', 
      frequency: 80, 
      waveType: 'square', 
      gradientClass: 'gradient-red-pink' 
    },
    { 
      name: 'Flute', 
      icon: '🪈', 
      frequency: 523, 
      waveType: 'sine', 
      gradientClass: 'gradient-green-teal' 
    },
    { 
      name: 'Saxophone', 
      icon: '🎷', 
      frequency: 370, 
      waveType: 'sawtooth', 
      gradientClass: 'gradient-purple-pink' 
    },
    { 
      name: 'Harp', 
      icon: '🪕', 
      frequency: 294, 
      waveType: 'triangle', 
      gradientClass: 'gradient-cyan-blue' 
    },
  ];

  const playInstrument = (instrument) => {
    setActiveInstrument(instrument.name);
    playSound(instrument.frequency, instrument.waveType, 1.0);
    
    setTimeout(() => {
      setActiveInstrument(null);
    }, 1000);
  };

  // Theme toggle handler
  const handleThemeToggle = () => {
    setIsDayTheme((prev) => !prev);
  };

  const getThemeClasses = () => ({
    app: `music-app ${isDayTheme ? 'day-theme' : 'night-theme'}`,
    card: `card ${isDayTheme ? 'card-day' : 'card-night'}`,
    text: isDayTheme ? 'text-day' : 'text-night',
    themeBadge: `theme-badge ${isDayTheme ? 'theme-badge-day' : 'theme-badge-night'}`,
    soundWave: isDayTheme ? 'sound-wave-day' : 'sound-wave-night'
  });

  const themeClasses = getThemeClasses();

  return (
    <div className="music-fun-container">
      {/* Floating Back Button */}
      <button
        onClick={onClose}
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

      <div className={themeClasses.app}>
        {/* Header */}
        <div className={`header ${themeClasses.card}`}>
          <h1 className="header-title">
            🎵 Music & Sounds 🎵
          </h1>
          <p className={`header-subtitle ${themeClasses.text}`}>
            Touch any instrument or press any key for piano sounds!
          </p>
          <div className={`theme-indicator ${themeClasses.text}`}>
            <span className={themeClasses.themeBadge} style={{ cursor: 'pointer' }} onClick={handleThemeToggle}>
              {isDayTheme ? '☀️ Day Mode (Click for Night)' : '🌙 Night Mode (Click for Day)'}
            </span>
          </div>
        </div>

        {/* Keyboard Instruction */}
        <div className={`keyboard-instruction ${themeClasses.card}`}>
          <p className={`keyboard-text ${themeClasses.text}`}>
            ⌨️ Press any key on your keyboard for random piano sounds! ⌨️
          </p>
        </div>

        {/* Instruments Grid */}
        <div className="instruments-grid">
          {instruments.map((instrument, index) => (
            <div
              key={instrument.name}
              className={`instrument-card ${themeClasses.card} ${
                activeInstrument === instrument.name ? 'active' : ''
              }`}
              onClick={() => playInstrument(instrument)}
              style={{
                animationDelay: `${index * 0.1}s`
              }}
            >
              <div className={`instrument-icon-container ${instrument.gradientClass}`}>
                <div className="instrument-icon">
                  {instrument.icon}
                </div>
              </div>
              <h3 className={`instrument-name ${themeClasses.text}`}>
                {instrument.name}
              </h3>
              <div className={`instrument-bar ${instrument.gradientClass}`}></div>
            </div>
          ))}
        </div>

        {/* Floating Musical Notes Animation */}
        <div className="floating-notes">
          {[1, 2, 3, 4, 5].map((note) => (
            <div
              key={note}
              className={`floating-note ${themeClasses.text}`}
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${note * 0.5}s`,
              }}
            >
              {['🎵', '🎶', '♪', '♫', '♬'][note - 1]}
            </div>
          ))}
        </div>

        {/* Sound Waves Animation */}
        {activeInstrument && (
          <div className="sound-waves">
            <div style={{ position: 'relative' }}>
              {[1, 2, 3].map((wave) => (
                <div
                  key={wave}
                  className={`sound-wave ${themeClasses.soundWave}`}
                  style={{
                    width: `${wave * 100}px`,
                    height: `${wave * 100}px`,
                    left: `${-wave * 50}px`,
                    top: `${-wave * 50}px`,
                    animationDelay: `${wave * 0.2}s`
                  }}
                ></div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className={`footer ${themeClasses.card}`}>
          <p className={`footer-text ${themeClasses.text}`}>
            🌈 Made with love for amazing kids! 🌈
          </p>
        </div>
      </div>

      {/* CSS Styles */}
      <style jsx>{`
        .music-fun-container {
          width: 100vw;
          height: 100vh;
          overflow-y: auto;
        }

        /* Base styles */
        .music-app {
          min-height: 100vh;
          width: 100vw;
          max-width: 100vw;
          padding: 1rem;
          transition: all 1s ease;
        }

        /* Theme backgrounds */
        .day-theme {
          background: linear-gradient(135deg, #fef3c7, #fce7f3, #dbeafe);
        }

        .night-theme {
          background: linear-gradient(135deg, #581c87, #1e3a8a, #312e81);
        }

        /* Card styles */
        .card {
          backdrop-filter: blur(12px);
          border-radius: 1.5rem;
          transition: all 0.3s ease;
        }

        .card-day {
          background: rgba(255, 255, 255, 0.8);
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
        }

        .card-night {
          background: rgba(31, 41, 55, 0.8);
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
        }

        /* Text colors */
        .text-day {
          color: #1f2937;
        }

        .text-night {
          color: #ffffff;
        }

        /* Header styles */
        .header {
          text-align: center;
          margin-bottom: 2rem;
          padding: 1.5rem;
          max-width: 42rem;
          margin-left: auto;
          margin-right: auto;
          transform: translateY(0);
          transition: transform 0.3s ease;
        }

        .header:hover {
          transform: scale(1.05);
        }

        .header-title {
          font-size: 2.25rem;
          font-weight: 700;
          margin-bottom: 0.5rem;
          background: linear-gradient(to right, #9333ea, #ec4899);
          background-clip: text;
          -webkit-background-clip: text;
          color: transparent;
        }

        .header-subtitle {
          font-size: 1.125rem;
          opacity: 0.8;
        }

        .theme-indicator {
          margin-top: 1rem;
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 1rem;
        }

        .theme-badge {
          padding: 0.25rem 0.75rem;
          border-radius: 9999px;
          font-size: 0.875rem;
        }

        .theme-badge-day {
          background-color: #fbbf24;
        }

        .theme-badge-night {
          background-color: #7c3aed;
        }

        /* Keyboard instruction */
        .keyboard-instruction {
          text-align: center;
          margin-bottom: 1.5rem;
          border-radius: 1rem;
          padding: 1rem;
          max-width: 36rem;
          margin-left: auto;
          margin-right: auto;
        }

        .keyboard-text {
          font-size: 1.125rem;
          font-weight: 600;
          animation: pulse 2s infinite;
        }

        /* Instruments grid */
        .instruments-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1.5rem;
          max-width: 72rem;
          margin: 0 auto;
        }

        @media (min-width: 768px) {
          .instruments-grid {
            grid-template-columns: repeat(4, 1fr);
          }
        }

        /* Instrument card */
        .instrument-card {
          border-radius: 1.5rem;
          padding: 1.5rem;
          cursor: pointer;
          transform: translateY(0) rotate(0deg);
          transition: all 0.3s ease;
        }

        .instrument-card:hover {
          transform: scale(1.1) rotate(2deg);
        }

        .instrument-card:active {
          transform: scale(0.95);
        }

        .instrument-card.active {
          animation: bounce 1s infinite;
          transform: scale(1.1);
        }

        .instrument-icon-container {
          border-radius: 1rem;
          padding: 1rem;
          margin-bottom: 1rem;
          transition: all 0.3s ease;
        }

        .instrument-icon-container:hover {
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
        }

        .instrument-icon {
          font-size: 2.25rem;
          text-align: center;
          animation: pulse 2s infinite;
        }

        .instrument-name {
          font-size: 1.25rem;
          font-weight: 700;
          text-align: center;
          margin-bottom: 0.5rem;
        }

        .instrument-bar {
          width: 100%;
          height: 0.5rem;
          border-radius: 9999px;
          opacity: 0.6;
          animation: pulse 2s infinite;
        }

        /* Gradient colors for instruments */
        .gradient-pink-purple {
          background: linear-gradient(135deg, #f472b6, #9333ea);
        }

        .gradient-orange-red {
          background: linear-gradient(135deg, #fb923c, #dc2626);
        }

        .gradient-yellow-orange {
          background: linear-gradient(135deg, #facc15, #ea580c);
        }

        .gradient-blue-indigo {
          background: linear-gradient(135deg, #60a5fa, #4f46e5);
        }

        .gradient-red-pink {
          background: linear-gradient(135deg, #f87171, #ec4899);
        }

        .gradient-green-teal {
          background: linear-gradient(135deg, #4ade80, #0d9488);
        }

        .gradient-purple-pink {
          background: linear-gradient(135deg, #a855f7, #ec4899);
        }

        .gradient-cyan-blue {
          background: linear-gradient(135deg, #22d3ee, #3b82f6);
        }

        /* Floating notes animation */
        .floating-notes {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          pointer-events: none;
          overflow: hidden;
        }

        .floating-note {
          position: absolute;
          font-size: 2.25rem;
          opacity: 0.3;
          animation: bounce 3s infinite;
        }

        /* Sound waves animation */
        .sound-waves {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          pointer-events: none;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .sound-wave {
          position: absolute;
          border-radius: 50%;
          border-width: 4px;
          opacity: 0.3;
          animation: ping 1s infinite;
        }

        .sound-wave-day {
          border-color: #a855f7;
        }

        .sound-wave-night {
          border-color: #22d3ee;
        }

        /* Footer */
        .footer {
          text-align: center;
          margin-top: 3rem;
          border-radius: 1rem;
          padding: 1rem;
          max-width: 28rem;
          margin-left: auto;
          margin-right: auto;
        }

        .footer-text {
          font-size: 0.875rem;
          opacity: 0.7;
        }

        /* Animations */
        @keyframes bounce {
          0%, 20%, 53%, 80%, 100% {
            transform: translate3d(0, 0, 0);
          }
          40%, 43% {
            transform: translate3d(0, -30px, 0);
          }
          70% {
            transform: translate3d(0, -15px, 0);
          }
          90% {
            transform: translate3d(0, -4px, 0);
          }
        }

        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }

        @keyframes ping {
          75%, 100% {
            transform: scale(2);
            opacity: 0;
          }
        }

        /* Responsive design */
        @media (max-width: 768px) {
          .header-title {
            font-size: 1.875rem;
          }
          
          .instrument-card {
            padding: 1rem;
          }
          
          .instrument-icon {
            font-size: 2rem;
          }
          
          .instrument-name {
            font-size: 1rem;
          }
        }

        /* Accessibility */
        @media (prefers-reduced-motion: reduce) {
          .instrument-card,
          .header,
          .music-app,
          .floating-note {
            animation: none;
            transition: none;
          }
        }
      `}</style>
    </div>
  );
};

export default MusicFun;
