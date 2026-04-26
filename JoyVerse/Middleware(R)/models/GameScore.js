const mongoose = require('mongoose');
const { GAME_TYPES } = require('../config/constants');

const gameScoreSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  gameType: {
    type: String,
    required: true,
    enum: GAME_TYPES
  },
  score: {
    type: Number,
    required: true
  },
  level: {
    type: Number,
    default: 1
  },
  maxScore: {
    type: Number
  },
  timeTaken: {
    type: Number
  },
  accuracy: {
    type: Number
  },
  emotionData: {
    type: Array
  },
  gameData: {
    type: mongoose.Schema.Types.Mixed
  }
}, { timestamps: true });

module.exports = mongoose.model('GameScore', gameScoreSchema);