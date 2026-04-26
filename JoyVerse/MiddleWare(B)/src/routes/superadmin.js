const express = require('express');
const { body } = require('express-validator');
const superadminController = require('../controllers/superadminController');
const { authenticateToken, authenticateSuperAdmin } = require('../middleware/auth');

const router = express.Router();

// Get all users (SuperAdmin only)
router.get('/users', 
  authenticateToken, 
  authenticateSuperAdmin, 
  superadminController.getAllUsers
);

// Get system statistics (SuperAdmin only)
router.get('/stats', 
  authenticateToken, 
  authenticateSuperAdmin, 
  superadminController.getSystemStats
);

// Get user details (SuperAdmin only)
router.get('/users/:userId', 
  authenticateToken, 
  authenticateSuperAdmin, 
  superadminController.getUserDetails
);

// Get game statistics (SuperAdmin only)
router.get('/games/stats', 
  authenticateToken, 
  authenticateSuperAdmin, 
  superadminController.getGameStats
);

// Get emotion analytics (SuperAdmin only)
router.get('/emotions/analytics', 
  authenticateToken, 
  authenticateSuperAdmin, 
  superadminController.getEmotionAnalytics
);

// Create therapist account (SuperAdmin only)
router.post('/create-therapist', [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('name').trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
  body('specialization').trim().isLength({ min: 1 }).withMessage('Specialization is required')
], 
  authenticateToken, 
  authenticateSuperAdmin, 
  superadminController.createTherapist
);

// Create child account (SuperAdmin only)
router.post('/create-child', [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('name').trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
  body('age').isInt({ min: 3, max: 18 }).withMessage('Age must be between 3 and 18'),
  body('parentEmail').isEmail().normalizeEmail().withMessage('Valid parent email is required')
], 
  authenticateToken, 
  authenticateSuperAdmin, 
  superadminController.createChild
);

// Update user role (SuperAdmin only)
router.put('/users/:userId/role', [
  body('role').isIn(['patient', 'therapist']).withMessage('Role must be either patient or therapist')
], 
  authenticateToken, 
  authenticateSuperAdmin, 
  superadminController.updateUserRole
);

// Verify therapist (SuperAdmin only)
router.put('/verify-therapist/:therapistId', 
  authenticateToken, 
  authenticateSuperAdmin, 
  superadminController.verifyTherapist
);

// Toggle user status (SuperAdmin only)
router.put('/users/:userId/toggle-status', 
  authenticateToken, 
  authenticateSuperAdmin, 
  superadminController.toggleUserStatus
);

// Delete user account (SuperAdmin only)
router.delete('/delete-user/:userId', 
  authenticateToken, 
  authenticateSuperAdmin, 
  superadminController.deleteUser
);

// Error handling middleware for this router
router.use((error, req, res, next) => {
  console.error('SuperAdmin router error:', error);
  res.status(500).json({
    success: false,
    message: 'Internal server error in superadmin routes',
    error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
  });
});

module.exports = router;