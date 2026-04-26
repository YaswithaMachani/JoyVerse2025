const express = require('express');
const therapistController = require('../controllers/therapistController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get Children Data for Therapists
router.get('/children', authenticateToken, therapistController.getChildrenData);

module.exports = router;