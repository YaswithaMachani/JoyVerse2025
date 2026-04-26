const mongoose = require('mongoose');

// Emotion Schema and Model
const emotionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  emotion: {
    type: String,
    required: true
  },
  confidence: {
    type: Number,
    required: true
  },
  landmarks: {
    type: [Number],
    default: []
  },
  probs: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

const Emotion = mongoose.model('Emotion', emotionSchema);

module.exports = Emotion;