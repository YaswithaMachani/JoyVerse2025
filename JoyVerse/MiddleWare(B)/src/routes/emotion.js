// src/routes/emotion.js
const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');

// Import the emotion controller
const emotionController = require('../controllers/emotionController');

// Routes
router.post('/save', authenticateToken, emotionController.saveEmotion);

router.get('/user', authenticateToken, emotionController.getUserEmotions);

router.get('/stats', authenticateToken, emotionController.getEmotionStats);

module.exports = router;