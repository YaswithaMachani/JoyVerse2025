const express = require('express');
const router = express.Router();
const therapistController = require('../controllers/therapistController');
const { authenticateToken, authenticateTherapist } = require('../middlewares/auth');

router.get('/children', authenticateToken, authenticateTherapist, therapistController.getChildrenData);

module.exports = router;