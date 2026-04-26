const { validationResult } = require('express-validator');
const GameScore = require('../models/GameScore');
const Emotion = require('../models/Emotion');
const { GAME_TYPES } = require('../config/constants');

exports.saveGameScore = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const { gameType, score, maxScore, timeTaken, level, gameData } = req.body;
    const gameScore = new GameScore({
      userId: req.user.userId,
      gameType,
      score,
      maxScore,
      timeTaken,
      level,
      gameData
    });

    await gameScore.save();

    res.status(201).json({
      message: 'Game score saved successfully',
      gameScore: {
        id: gameScore._id,
        gameType: gameScore.gameType,
        score: gameScore.score,
        maxScore: gameScore.maxScore,
        timeTaken: gameScore.timeTaken,
        level: gameScore.level,
        createdAt: gameScore.createdAt
      }
    });
  } catch (error) {
    console.error('Save game score error:', error);
    res.status(500).json({ message: 'Failed to save game score' });
  }
};

exports.getGameScores = async (req, res) => {
  try {
    const { gameType, limit = 10, page = 1 } = req.query;
    const skip = (page - 1) * limit;
    
    const query = { userId: req.user.userId };
    if (gameType) query.gameType = gameType;
    
    const scores = await GameScore.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip);
    
    const total = await GameScore.countDocuments(query);
    
    res.json({
      scores,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching game scores:', error);
    res.status(500).json({ message: 'Failed to fetch game scores', error: error.message });
  }
};

exports.getBestScores = async (req, res) => {
  try {
    const bestScores = await Promise.all(GAME_TYPES.map(async (gameType) => {
      const bestScore = await GameScore.findOne({
        userId: req.user.userId,
        gameType: gameType
      })
      .sort({ score: -1 })
      .limit(1)
      .lean();
      
      return bestScore ? {
        gameType,
        score: bestScore.score,
        maxScore: bestScore.maxScore,
        level: bestScore.level,
        timeTaken: bestScore.timeTaken,
        playedAt: bestScore.createdAt
      } : null;
    }));

    res.json({
      bestScores: bestScores.filter(score => score !== null)
    });
  } catch (error) {
    console.error('Error fetching best scores:', error);
    res.status(500).json({ message: 'Failed to fetch best scores', error: error.message });
  }
};

exports.getGameStats = async (req, res) => {
  try {
    const { gameType } = req.query;
    const query = { userId: req.user.userId };
    if (gameType) query.gameType = gameType;
    
    const allScores = await GameScore.find(query).sort({ createdAt: -1 }).lean();
    
    if (allScores.length === 0) {
      return res.json({
        stats: {
          totalGames: 0,
          averageScore: 0,
          bestScore: 0,
          totalTimePlayed: 0,
          averageTime: 0,
          gamesThisWeek: 0,
          improvementRate: 0
        }
      });
    }
    
    const scores = allScores.map(s => s.score);
    const times = allScores.map(s => s.timeTaken).filter(t => t != null);
    
    const totalGames = allScores.length;
    const averageScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
    const bestScore = Math.max(...scores);
    const totalTimePlayed = times.reduce((a, b) => a + b, 0);
    const averageTime = times.length > 0 ? Math.round(totalTimePlayed / times.length) : 0;
    
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const gamesThisWeek = allScores.filter(score => score.createdAt >= oneWeekAgo).length;
    
    let improvementRate = 0;
    if (totalGames >= 6) {
      const recentGames = allScores.slice(0, 3);
      const olderGames = allScores.slice(-3);
      
      const recentAvg = recentGames.reduce((sum, game) => sum + game.score, 0) / recentGames.length;
      const olderAvg = olderGames.reduce((sum, game) => sum + game.score, 0) / olderGames.length;
      
      if (olderAvg > 0) {
        improvementRate = Math.round(((recentAvg - olderAvg) / olderAvg) * 100);
        improvementRate = Math.max(-100, Math.min(100, improvementRate));
      }
    }
    
    res.json({
      stats: {
        totalGames,
        averageScore,
        bestScore,
        totalTimePlayed,
        averageTime,
        gamesThisWeek,
        improvementRate
      }
    });
  } catch (error) {
    console.error('Error fetching game statistics:', error);
    res.status(500).json({ message: 'Failed to fetch game statistics', error: error.message });
  }
};

exports.saveEmotion = async (req, res) => {
  try {
    const { emotion, confidence, landmarks, probs, timestamp } = req.body;

    const newEmotion = new Emotion({
      userId: req.user.userId,
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
};