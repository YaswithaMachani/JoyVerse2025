// Emotion-based theme configurations for games
export const emotionThemes = {
  happiness: {
    name: "Happy Sunshine",
    colors: {
      primary: '#fbbf24',
      secondary: '#f59e0b',
      accent: '#fcd34d',
      text: '#451a03',
      background: 'linear-gradient(135deg, #fef3c7 0%, #fbbf24 100%)'
    },
    particles: '✨',
    mood: 'energetic',
    description: "Bright and cheerful themes that match your happy mood!"
  },
  happy: {
    name: "Happy Sunshine",
    colors: {
      primary: '#fbbf24',
      secondary: '#f59e0b',
      accent: '#fcd34d',
      text: '#451a03',
      background: 'linear-gradient(135deg, #fef3c7 0%, #fbbf24 100%)'
    },
    particles: '✨',
    mood: 'energetic',
    description: "Bright and cheerful themes that match your happy mood!"
  },
  sadness: {
    name: "Gentle Comfort",
    colors: {
      primary: '#60a5fa',
      secondary: '#3b82f6',
      accent: '#93c5fd',
      text: '#1e3a8a',
      background: 'linear-gradient(135deg, #dbeafe 0%, #60a5fa 100%)'
    },
    particles: '💙',
    mood: 'calm',
    description: "Soft, comforting colors to help you feel better."
  },
  sad: {
    name: "Gentle Comfort",
    colors: {
      primary: '#60a5fa',
      secondary: '#3b82f6',
      accent: '#93c5fd',
      text: '#1e3a8a',
      background: 'linear-gradient(135deg, #dbeafe 0%, #60a5fa 100%)'
    },
    particles: '💙',
    mood: 'calm',
    description: "Soft, comforting colors to help you feel better."
  },
  anger: {
    name: "Cool Down",
    colors: {
      primary: '#34d399',
      secondary: '#10b981',
      accent: '#6ee7b7',
      text: '#064e3b',
      background: 'linear-gradient(135deg, #d1fae5 0%, #34d399 100%)'
    },
    particles: '🌿',
    mood: 'cooling',
    description: "Calming green themes to help you relax and cool down."
  },
  angry: {
    name: "Cool Down",
    colors: {
      primary: '#34d399',
      secondary: '#10b981',
      accent: '#6ee7b7',
      text: '#064e3b',
      background: 'linear-gradient(135deg, #d1fae5 0%, #34d399 100%)'
    },
    particles: '🌿',
    mood: 'cooling',
    description: "Calming green themes to help you relax and cool down."
  },
  fear: {
    name: "Safe Space",
    colors: {
      primary: '#a78bfa',
      secondary: '#8b5cf6',
      accent: '#c4b5fd',
      text: '#4c1d95',
      background: 'linear-gradient(135deg, #ede9fe 0%, #a78bfa 100%)'
    },
    particles: '🌟',
    mood: 'reassuring',
    description: "Gentle purple themes to make you feel safe and protected."
  },
  surprise: {
    name: "Exciting Adventure",
    colors: {
      primary: '#f472b6',
      secondary: '#ec4899',
      accent: '#f9a8d4',
      text: '#831843',
      background: 'linear-gradient(135deg, #fce7f3 0%, #f472b6 100%)'
    },
    particles: '🎉',
    mood: 'exciting',
    description: "Vibrant and surprising themes for your adventurous spirit!"
  },
  neutral: {
    name: "Balanced Focus",
    colors: {
      primary: '#6b7280',
      secondary: '#4b5563',
      accent: '#9ca3af',
      text: '#111827',
      background: 'linear-gradient(135deg, #f3f4f6 0%, #6b7280 100%)'
    },
    particles: '⚡',
    mood: 'focused',
    description: "Neutral colors to help you stay focused and balanced."
  }
};

// Get theme based on emotion
export const getThemeForEmotion = (emotion) => {
  const normalizedEmotion = emotion?.toLowerCase() || 'neutral';
  return emotionThemes[normalizedEmotion] || emotionThemes.neutral;
};

// Get contrasting themes for better visibility
export const getContrastColor = (backgroundColor) => {
  // Simple contrast calculation
  const hex = backgroundColor.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness > 128 ? '#000000' : '#ffffff';
};

// Smooth theme transition animations
export const themeTransitionStyles = `
  .emotion-theme-transition {
    transition: all 0.8s cubic-bezier(0.4, 0, 0.2, 1);
  }
  
  .emotion-particle {
    animation: emotionFloat 3s ease-in-out infinite;
  }
  
  @keyframes emotionFloat {
    0%, 100% { transform: translateY(0px) rotate(0deg); }
    50% { transform: translateY(-20px) rotate(180deg); }
  }
  
  .emotion-glow {
    box-shadow: 0 0 20px rgba(255, 255, 255, 0.3);
    animation: emotionGlow 2s ease-in-out infinite alternate;
  }
  
  @keyframes emotionGlow {
    from { box-shadow: 0 0 20px rgba(255, 255, 255, 0.3); }
    to { box-shadow: 0 0 30px rgba(255, 255, 255, 0.6); }
  }
`;

export default {
  emotionThemes,
  getThemeForEmotion,
  getContrastColor,
  themeTransitionStyles
};
