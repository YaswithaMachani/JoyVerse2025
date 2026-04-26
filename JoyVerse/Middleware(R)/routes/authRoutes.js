const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const authController = require('../controllers/authController');
const { authenticateToken } = require('../middlewares/auth');

// Public routes
router.post('/register/therapist', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('fullName').trim().isLength({ min: 2 }),
  body('phoneNumber').trim().isLength({ min: 10 }),
  body('licenseNumber').trim().isLength({ min: 1 })
], authController.registerTherapist);

router.post('/register/child', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('childName').trim().isLength({ min: 2 }),
  body('age').isInt({ min: 3, max: 18 }),
  body('parentEmail').isEmail().normalizeEmail()
], authController.registerChild);

router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').exists().isLength({ min: 6 })
], authController.login);

router.post('/login/superadmin', [
  body('email').isEmail().normalizeEmail(),
  body('password').exists()
], authController.superAdminLogin);

router.post('/check-registration', [
  body('email').isEmail().normalizeEmail()
], authController.checkRegistration);

// Protected routes
router.get('/profile', authenticateToken, authController.getProfile);
router.post('/verify-token', authenticateToken, authController.verifyToken);

module.exports = router;