const mongoose = require('mongoose');

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
  }
}, { timestamps: true });

module.exports = mongoose.model('Emotion', emotionSchema);