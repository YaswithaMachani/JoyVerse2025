const express = require('express');
const { body } = require('express-validator');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Import the controller and map function names correctly
const gameScoreControllerRaw = require('../controllers/gameScoreController');

// Map the actual function names to what the routes expect
const gameScoreController = {
  saveScore: gameScoreControllerRaw.saveGameScore,
  getScores: gameScoreControllerRaw.getUserGameScores,
  getBestScores: gameScoreControllerRaw.getBestScores,
  getStats: gameScoreControllerRaw.getGameStats,
  deleteScore: gameScoreControllerRaw.deleteGameScore
};

// Validation middleware
const scoreValidation = [
  body('gameType')
    .isIn(['pacman', 'missing-letter-pop', 'space-math'])
    .withMessage('Game type must be one of: pacman, missing-letter-pop, space-math'),
  body('score')
    .isNumeric()
    .isInt({ min: 0 })
    .withMessage('Score must be a non-negative integer'),
  body('maxScore')
    .optional()
    .isNumeric()
    .withMessage('Max score must be numeric'),
  body('timeTaken')
    .optional()
    .isNumeric()
    .withMessage('Time taken must be numeric'),
  body('level')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Level must be a positive integer'),
  body('gameData')
    .optional()
    .isObject()
    .withMessage('Game data must be an object')
];

// Routes
router.post('/', authenticateToken, scoreValidation, gameScoreController.saveScore);

router.get('/', authenticateToken, gameScoreController.getScores);

router.get('/best', authenticateToken, gameScoreController.getBestScores);

router.get('/stats', authenticateToken, gameScoreController.getStats);

router.delete('/:scoreId', authenticateToken, gameScoreController.deleteScore);

module.exports = router;