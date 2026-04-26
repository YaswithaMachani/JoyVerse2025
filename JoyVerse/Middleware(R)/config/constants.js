module.exports = {
  JWT_SECRET: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
  USER_TYPES: {
    THERAPIST: 'therapist',
    CHILD: 'child',
    SUPERADMIN: 'superadmin'
  },
  GAME_TYPES: [
    'pacman', 'space-math', 'missing-letter-pop', 
    'kitten-match', 'super-kitten-match', 'art-studio', 'music-fun'
  ]
};