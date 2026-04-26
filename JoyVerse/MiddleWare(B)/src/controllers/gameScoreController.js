const mongoose = require('mongoose');
const { validationResult } = require('express-validator');
const GameScore = require('../models/GameScore');

const gameScoreController = {
  // Save Game Score
  saveGameScore: async (req, res) => {
    try {
      console.log('🎮 BACKEND: Received game score save request');
      console.log('🎮 User ID:', req.user.userId);
      console.log('🎮 Request body:', req.body);
      
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        console.log('❌ Validation errors:', errors.array());
        return res.status(400).json({ errors: errors.array() });
      }

      const { gameType, score, maxScore, timeTaken, level, gameData, emotion, confidence, landmarks, probs } = req.body;
      
      const gameScore = new GameScore({
        userId: req.user.userId,
        gameType,
        score,
        maxScore,
        timeTaken,
        level,
        gameData,
        emotion,
        confidence,
        landmarks,
        probs
      });

      console.log('💾 BACKEND: About to save game score:', gameScore);
      await gameScore.save();
      console.log('✅ BACKEND: Game score saved successfully with ID:', gameScore._id);

      res.status(201).json({
        message: 'Game score saved successfully',
        gameScore: {
          id: gameScore._id,
          gameType: gameScore.gameType,
          score: gameScore.score,
          maxScore: gameScore.maxScore,
          timeTaken: gameScore.timeTaken,
          level: gameScore.level,
          playedAt: gameScore.playedAt
        }
      });
    } catch (error) {
      console.error('💥 BACKEND: Save game score error:', error);
      res.status(500).json({ message: 'Failed to save game score' });
    }
  },

  // Get User's Game Scores
  getUserGameScores: async (req, res) => {
    try {
      const { gameType, limit = 10, page = 1 } = req.query;
      const skip = (page - 1) * limit;
      
      let query = { userId: req.user.userId };
      if (gameType) {
        query.gameType = gameType;
      }

      const scores = await GameScore.find(query)
        .sort({ playedAt: -1 })
        .limit(parseInt(limit))
        .skip(skip)
        .select('gameType score maxScore timeTaken level playedAt');

      const totalScores = await GameScore.countDocuments(query);

      res.json({
        scores,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalScores / limit),
          totalScores,
          hasMore: skip + scores.length < totalScores
        }
      });
    } catch (error) {
      console.error('Get game scores error:', error);
      res.status(500).json({ message: 'Failed to fetch game scores' });
    }
  },

  // Get User's Best Scores by Game
  getBestScores: async (req, res) => {
    try {
      const bestScores = await GameScore.aggregate([
        { $match: { userId: new mongoose.Types.ObjectId(req.user.userId) } },
        {
          $group: {
            _id: '$gameType',
            bestScore: { $max: '$score' },
            totalGames: { $sum: 1 },
            lastPlayed: { $max: '$playedAt' },
            averageScore: { $avg: '$score' }
          }
        },
        {
          $project: {
            gameType: '$_id',
            bestScore: 1,
            totalGames: 1,
            lastPlayed: 1,
            averageScore: { $round: ['$averageScore', 1] },
            _id: 0
          }
        }
      ]);

      res.json({ bestScores });
    } catch (error) {
      console.error('Get best scores error:', error);
      res.status(500).json({ message: 'Failed to fetch best scores' });
    }
  },

  // Get Game Statistics
  getGameStats: async (req, res) => {
    try {
      const { gameType } = req.query;
      let matchQuery = { userId: new mongoose.Types.ObjectId(req.user.userId) };
      
      if (gameType) {
        matchQuery.gameType = gameType;
      }

      const stats = await GameScore.aggregate([
        { $match: matchQuery },
        {
          $group: {
            _id: null,
            totalGames: { $sum: 1 },
            averageScore: { $avg: '$score' },
            bestScore: { $max: '$score' },
            totalTimePlayed: { $sum: '$timeTaken' },
            lastPlayed: { $max: '$playedAt' }
          }
        },
        {
          $project: {
            totalGames: 1,
            averageScore: { $round: ['$averageScore', 1] },
            bestScore: 1,
            totalTimePlayed: { $round: ['$totalTimePlayed', 0] },
            lastPlayed: 1,
            _id: 0
          }
        }
      ]);

      res.json({ 
        stats: stats.length > 0 ? stats[0] : {
          totalGames: 0,
          averageScore: 0,
          bestScore: 0,
          totalTimePlayed: 0,
          lastPlayed: null
        }
      });
    } catch (error) {
      console.error('Get game stats error:', error);
      res.status(500).json({ message: 'Failed to fetch game statistics' });
    }
  },

  // Delete Game Score
  deleteGameScore: async (req, res) => {
    try {
      const { scoreId } = req.params;
      
      const gameScore = await GameScore.findOneAndDelete({
        _id: scoreId,
        userId: req.user.userId
      });

      if (!gameScore) {
        return res.status(404).json({ message: 'Game score not found' });
      }

      res.json({ message: 'Game score deleted successfully' });
    } catch (error) {
      console.error('Delete game score error:', error);
      res.status(500).json({ message: 'Failed to delete game score' });
    }
  }
};

module.exports = gameScoreController;