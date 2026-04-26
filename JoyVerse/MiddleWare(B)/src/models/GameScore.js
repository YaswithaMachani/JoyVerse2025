const mongoose = require('mongoose');

// Game Score Schema
const gameScoreSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  gameType: {
    type: String,
    required: true,
    enum: ['pacman', 'missing-letter-pop', 'space-math']
  },
  score: {
    type: Number,
    required: true,
    min: 0
  },
  maxScore: {
    type: Number,
    default: null
  },
  timeTaken: {
    type: Number, // in seconds
    default: null
  },
  level: {
    type: Number,
    default: 1
  },
  gameData: {
    type: mongoose.Schema.Types.Mixed, // Store additional game-specific data
    default: {}
  },
  playedAt: {
    type: Date,
    default: Date.now
  },
  emotion : {
    type: String,
    required: true
  },
  confidence: {
    type: Number,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  landmarks: {
    type: [Number], // assuming it's an array of floats
    default: []
  },
  probs: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
});

// Create compound index for efficient queries
gameScoreSchema.index({ userId: 1, gameType: 1, playedAt: -1 });

const GameScore = mongoose.model('GameScore', gameScoreSchema);

module.exports = GameScore;