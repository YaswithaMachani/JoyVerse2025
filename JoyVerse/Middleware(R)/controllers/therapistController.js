const User = require('../models/User');
const GameScore = require('../models/GameScore');
const Emotion = require('../models/Emotion');
const { USER_TYPES } = require('../config/constants');

exports.getChildrenData = async (req, res) => {
  try {
    const children = await User.find({ userType: USER_TYPES.CHILD, isActive: true })
      .select('_id childName age email parentEmail createdAt')
      .lean();

    const childrenWithData = await Promise.all(children.map(async (child) => {
      try {
        const [gameScores, emotions] = await Promise.all([
          GameScore.find({ userId: child._id }).sort({ createdAt: -1 }).lean(),
          Emotion.find({ userId: child._id }).sort({ timestamp: -1 }).limit(10).lean()
        ]);

        const gameAnalytics = {};
        const gameTypes = ['pacman', 'missing-letter-pop', 'art-studio', 'space-math'];
        
        gameTypes.forEach(gameType => {
          const typeScores = gameScores.filter(score => score.gameType === gameType);
          
          if (typeScores.length > 0) {
            const scores = typeScores.map(s => s.score);
            const times = typeScores.map(s => s.timeTaken).filter(t => t != null);
            const levels = typeScores.map(s => s.level).filter(l => l != null);
            
            let improvement = 0;
            if (typeScores.length >= 4) {
              const recentScores = scores.slice(0, 3);
              const oldScores = scores.slice(-3);
              const recentAvg = recentScores.reduce((a, b) => a + b, 0) / recentScores.length;
              const oldAvg = oldScores.reduce((a, b) => a + b, 0) / oldScores.length;
              improvement = Math.round(((recentAvg - oldAvg) / oldAvg) * 100);
            }

            gameAnalytics[gameType] = {
              score: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
              bestScore: Math.max(...scores),
              latestScore: scores[0],
              time: times.length > 0 ? Math.round(times.reduce((a, b) => a + b, 0) / times.length) : 0,
              attempts: Math.round(levels.reduce((a, b) => a + b, 0) / levels.length) || 1,
              improvement: Math.max(-50, Math.min(50, improvement)),
              totalPlayed: typeScores.length,
              lastPlayed: typeScores[0].createdAt
            };
          } else {
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

        const allScores = gameScores.map(s => s.score);
        const overallProgress = allScores.length > 0 ? 
          Math.round(allScores.reduce((a, b) => a + b, 0) / allScores.length) : 0;

        const now = new Date();
        const progressData = [];
        for (let i = 3; i >= 0; i--) {
          const weekStart = new Date(now.getTime() - (i * 7 * 24 * 60 * 60 * 1000));
          const weekEnd = new Date(weekStart.getTime() + (7 * 24 * 60 * 60 * 1000));
          
          const weekScores = gameScores.filter(score => 
            score.createdAt >= weekStart && score.createdAt < weekEnd
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
          emotions,
          overallProgress: Math.min(100, Math.max(0, overallProgress)),
          strengths,
          challenges,
          progressData,
          totalGamesPlayed: gameScores.length,
          lastActivity: gameScores.length > 0 ? gameScores[0].createdAt : child.createdAt
        };
      } catch (error) {
        console.error(`Error processing child ${child.childName}:`, error);
        return {
          id: child._id,
          name: child.childName,
          age: child.age,
          email: child.email,
          parentEmail: child.parentEmail,
          registeredAt: child.createdAt,
          games: {
            'pacman': { score: 0, bestScore: 0, time: 0, attempts: 0, improvement: 0, totalPlayed: 0 },
            'missing-letter-pop': { score: 0, bestScore: 0, time: 0, attempts: 0, improvement: 0, totalPlayed: 0 },
            'art-studio': { score: 0, bestScore: 0, time: 0, attempts: 0, improvement: 0, totalPlayed: 0 },
            'space-math': { score: 0, bestScore: 0, time: 0, attempts: 0, improvement: 0, totalPlayed: 0 }
          },
          emotions: [],
          overallProgress: 0,
          strengths: ['Developing Skills'],
          challenges: ['Getting Started'],
          progressData: [
            { week: 'Week 1', score: 0 },
            { week: 'Week 2', score: 0 },
            { week: 'Week 3', score: 0 },
            { week: 'Week 4', score: 0 }
          ],
          totalGamesPlayed: 0,
          lastActivity: child.createdAt
        };
      }
    }));

    res.json({
      children: childrenWithData,
      summary: {
        totalChildren: childrenWithData.length,
        averageProgress: Math.round(
          childrenWithData.reduce((sum, child) => sum + child.overallProgress, 0) / 
          (childrenWithData.length || 1)
        ),
        totalGamesPlayed: childrenWithData.reduce((sum, child) => sum + child.totalGamesPlayed, 0),
        activeChildren: childrenWithData.filter(child => child.totalGamesPlayed > 0).length
      }
    });
  } catch (error) {
    console.error('Get children data error:', error);
    res.status(500).json({ message: 'Failed to fetch children data' });
  }
};