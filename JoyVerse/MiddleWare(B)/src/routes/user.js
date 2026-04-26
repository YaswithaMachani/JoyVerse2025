const express = require('express');
const userController = require('../controllers/userController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get User Profile (Protected Route)
router.get('/profile', authenticateToken, userController.getUserProfile);

// Get All Users (Admin/Therapist only)
router.get('/', authenticateToken, userController.getAllUsers);

// Health check - create a simple one or remove if not needed
router.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'User routes are working' });
});

// Database status check
router.get('/db-status', userController.getDbStatus);

module.exports = router;