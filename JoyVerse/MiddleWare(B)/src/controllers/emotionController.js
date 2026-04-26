const Emotion = require('../models/Emotion');

const emotionController = {
  // Save Emotion Data
  saveEmotion: async (req, res) => {
    try {
      const { emotion, confidence, landmarks, probs, timestamp } = req.body;

      const newEmotion = new Emotion({
        userId: req.user.userId, // Automatically associates the emotion with the logged-in child
        emotion,
        confidence,
        landmarks,
        probs,
        timestamp: timestamp || new Date()
      });

      await newEmotion.save();

      res.status(201).json({
        message: 'Emotion recorded successfully',
        emotionId: newEmotion._id
      });
    } catch (error) {
      console.error('Error saving emotion:', error);
      res.status(500).json({ message: 'Failed to save emotion' });
    }
  },

  // Get User's Emotions
  getUserEmotions: async (req, res) => {
    try {
      const { limit = 10, page = 1 } = req.query;
      const skip = (page - 1) * limit;

      const emotions = await Emotion.find({ userId: req.user.userId })
        .sort({ timestamp: -1 })
        .limit(parseInt(limit))
        .skip(skip)
        .select('emotion confidence timestamp');

      const totalEmotions = await Emotion.countDocuments({ userId: req.user.userId });

      res.json({
        emotions,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalEmotions / limit),
          totalEmotions,
          hasMore: skip + emotions.length < totalEmotions
        }
      });
    } catch (error) {
      console.error('Get emotions error:', error);
      res.status(500).json({ message: 'Failed to fetch emotions' });
    }
  },

  // Get Emotion Statistics
  getEmotionStats: async (req, res) => {
    try {
      const stats = await Emotion.aggregate([
        { $match: { userId: req.user.userId } },
        {
          $group: {
            _id: '$emotion',
            count: { $sum: 1 },
            averageConfidence: { $avg: '$confidence' },
            lastDetected: { $max: '$timestamp' }
          }
        },
        {
          $project: {
            emotion: '$_id',
            count: 1,
            averageConfidence: { $round: ['$averageConfidence', 2] },
            lastDetected: 1,
            _id: 0
          }
        },
        { $sort: { count: -1 } }
      ]);

      res.json({ stats });
    } catch (error) {
      console.error('Get emotion stats error:', error);
      res.status(500).json({ message: 'Failed to fetch emotion statistics' });
    }
  }
};

module.exports = emotionController;