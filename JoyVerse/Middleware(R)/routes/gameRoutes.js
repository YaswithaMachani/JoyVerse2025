const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const gameController = require('../controllers/gameController');
const { authenticateToken } = require('../middlewares/auth');

router.post('/', authenticateToken, [
  body('gameType').isIn(['pacman', 'space-math', 'missing-letter-pop', 'kitten-match', 'super-kitten-match', 'art-studio', 'music-fun']),
  body('score').isNumeric().isInt({ min: 0 }),
  body('maxScore').optional().isNumeric(),
  body('timeTaken').optional().isNumeric(),
  body('level').optional().isInt({ min: 1 }),
  body('gameData').optional().isObject()
], gameController.saveGameScore);

router.get('/', authenticateToken, gameController.getGameScores);
router.get('/best', authenticateToken, gameController.getBestScores);
router.get('/stats', authenticateToken, gameController.getGameStats);
router.post('/emotions', authenticateToken, gameController.saveEmotion);

module.exports = router;