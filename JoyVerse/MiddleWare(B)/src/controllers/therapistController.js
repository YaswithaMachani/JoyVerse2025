const mongoose = require('mongoose');
const User = require('../models/User');
const GameScore = require('../models/GameScore');
const Emotion = require('../models/Emotion');

const therapistController = {
  // Get Children Data for Therapists
  getChildrenData: async (req, res) => {
    try {
      console.log('🩺 BACKEND: Therapist requesting children data');
      
      // Check if user is a therapist
      if (req.user.userType !== 'therapist') {
        return res.status(403).json({ message: 'Access denied. Therapist access required.' });
      }

      // Get all child users
      const children = await User.find({ userType: 'child', isActive: true })
        .select('_id childName age email parentEmail createdAt')
        .lean();

      console.log(`🩺 BACKEND: Found ${children.length} children`);

      // For each child, get their game scores and calculate analytics
      const childrenWithData = await Promise.all(children.map(async (child) => {
        try {
          // Get all game scores for this child
          const gameScores = await GameScore.find({ userId: child._id })
            .sort({ playedAt: -1 })
            .lean();

          console.log(`🎮 Child ${child.childName}: ${gameScores.length} game scores found`);

          // Group scores by game type and calculate analytics
          const gameAnalytics = {};
          const gameTypes = ['pacman', 'missing-letter-pop', 'art-studio', 'space-math'];
          
          gameTypes.forEach(gameType => {
            const typeScores = gameScores.filter(score => score.gameType === gameType);
            
            if (typeScores.length > 0) {
              // Calculate average, best, and latest scores
              const scores = typeScores.map(s => s.score);
              const times = typeScores.map(s => s.timeTaken).filter(t => t != null);
              const levels = typeScores.map(s => s.level).filter(l => l != null);
              
              // Calculate improvement (compare first vs last 3 games)
              let improvement = 0;
              if (typeScores.length >= 4) {
                const recentScores = scores.slice(0, 3);
                const oldScores = scores.slice(-3);
                const recentAvg = recentScores.reduce((a, b) => a + b, 0) / recentScores.length;
                const oldAvg = oldScores.reduce((a, b) => a + b, 0) / oldScores.length;
                improvement = Math.round(((recentAvg - oldAvg) / oldAvg) * 100);
              }

              gameAnalytics[gameType] = {
                score: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length), // Average score
                bestScore: Math.max(...scores),
                latestScore: scores[0],
                time: times.length > 0 ? Math.round(times.reduce((a, b) => a + b, 0) / times.length) : 0,
                attempts: Math.round(levels.reduce((a, b) => a + b, 0) / levels.length) || 1,
                improvement: Math.max(-50, Math.min(50, improvement)), // Cap improvement between -50% and +50%
                totalPlayed: typeScores.length,
                lastPlayed: typeScores[0].playedAt
              };
            } else {
              // No scores for this game type
              gameAnalytics[gameType] = {
                score: 0,
                bestScore: 0,
                latestScore: 0,
                time: 0,
                attempts: 0,
                improvement: 0,
                totalPlayed: 0,
                lastPlayed: null
              };
            }
          });

          // Get emotions for this child
          const emotions = await Emotion.find({ userId: child._id }).sort({ timestamp: -1 }).limit(10).lean();
          child.emotions = emotions;

          // Calculate overall progress and trends
          const allScores = gameScores.map(s => s.score);
          const overallProgress = allScores.length > 0 ? 
            Math.round(allScores.reduce((a, b) => a + b, 0) / allScores.length) : 0;

          // Generate weekly progress data (last 4 weeks)
          const now = new Date();
          const progressData = [];
          for (let i = 3; i >= 0; i--) {
            const weekStart = new Date(now.getTime() - (i * 7 * 24 * 60 * 60 * 1000));
            const weekEnd = new Date(weekStart.getTime() + (7 * 24 * 60 * 60 * 1000));
            
            const weekScores = gameScores.filter(score => 
              score.playedAt >= weekStart && score.playedAt < weekEnd
            );
            
            const weekAvg = weekScores.length > 0 ? 
              Math.round(weekScores.reduce((sum, score) => sum + score.score, 0) / weekScores.length) : 
              (progressData.length > 0 ? progressData[progressData.length - 1].score : 0);
              
            progressData.push({
              week: `Week ${4 - i}`,
              score: weekAvg,
              gamesPlayed: weekScores.length
            });
          }

          // Determine strengths and challenges based on game performance
          const strengths = [];
          const challenges = [];
          
          if (gameAnalytics['pacman'].score > 80) strengths.push('Hand-Eye Coordination');
          else if (gameAnalytics['pacman'].score < 60) challenges.push('Motor Skills');
          
          if (gameAnalytics['missing-letter-pop'].score > 80) strengths.push('Language Skills');
          else if (gameAnalytics['missing-letter-pop'].score < 60) challenges.push('Phonemic Awareness');
          
          if (gameAnalytics['art-studio'].score > 80) strengths.push('Creative Expression');
          else if (gameAnalytics['art-studio'].score < 60) challenges.push('Fine Motor Skills');
          
          if (gameAnalytics['space-math'].score > 80) strengths.push('Mathematical Reasoning');
          else if (gameAnalytics['space-math'].score < 60) challenges.push('Numeracy Skills');
          
          // Default strengths/challenges if none identified
          if (strengths.length === 0) strengths.push('Developing Skills', 'Consistent Effort');
          if (challenges.length === 0) challenges.push('Time Management', 'Focus Enhancement');

          return {
            id: child._id,
            name: child.childName,
            age: child.age,
            email: child.email,
            parentEmail: child.parentEmail,
            registeredAt: child.createdAt,
            games: gameAnalytics,
            overallProgress: Math.min(100, Math.max(0, overallProgress)),
            strengths,
            challenges,
            progressData,
            totalGamesPlayed: gameScores.length,
            lastActivity: gameScores.length > 0 ? gameScores[0].playedAt : child.createdAt
          }; // ← This closing brace was missing!

        } catch (error) {
          console.error(`❌ Error processing child ${child.childName}:`, error);
          return {
            id: child._id,
            name: child.childName,
            age: child.age,
            email: child.email,
            parentEmail: child.parentEmail,
            registeredAt: child.createdAt,
            games: {},
            overallProgress: 0,
            strengths: ['Developing Skills'],
            challenges: ['Need More Data'],
            progressData: [],
            totalGamesPlayed: 0,
            lastActivity: child.createdAt,
            error: 'Failed to load complete data'
          };
        }
      }));

      console.log(`🩺 BACKEND: Processed ${childrenWithData.length} children with analytics`);

      res.json({
        success: true,
        data: childrenWithData,
        message: `Found ${childrenWithData.length} children`
      });

    } catch (error) {
      console.error('❌ Error in getChildrenData:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Internal server error while fetching children data',
        error: error.message 
      });
    }
  },

  // Get Individual Child Data
  getChildData: async (req, res) => {
    try {
      const { childId } = req.params;
      
      // Check if user is a therapist
      if (req.user.userType !== 'therapist') {
        return res.status(403).json({ message: 'Access denied. Therapist access required.' });
      }

      // Validate childId
      if (!mongoose.Types.ObjectId.isValid(childId)) {
        return res.status(400).json({ message: 'Invalid child ID format' });
      }

      // Get child user
      const child = await User.findOne({ _id: childId, userType: 'child', isActive: true })
        .select('_id childName age email parentEmail createdAt')
        .lean();

      if (!child) {
        return res.status(404).json({ message: 'Child not found' });
      }

      // Get detailed game scores
      const gameScores = await GameScore.find({ userId: childId })
        .sort({ playedAt: -1 })
        .lean();

      // Get emotions
      const emotions = await Emotion.find({ userId: childId })
        .sort({ timestamp: -1 })
        .lean();

      res.json({
        success: true,
        data: {
          child,
          gameScores,
          emotions,
          totalGamesPlayed: gameScores.length,
          totalEmotions: emotions.length
        }
      });

    } catch (error) {
      console.error('❌ Error in getChildData:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Internal server error while fetching child data',
        error: error.message 
      });
    }
  }
};

module.exports = therapistController;