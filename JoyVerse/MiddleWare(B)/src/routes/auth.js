const express = require('express');
const { body } = require('express-validator');
const authController = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Register User (Therapist)
router.post('/register/therapist', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('fullName').trim().isLength({ min: 2 }),
  body('phoneNumber').trim().isLength({ min: 10 }),
  body('licenseNumber').trim().isLength({ min: 1 })
], authController.registerTherapist);

// Register User (Child)
router.post('/register/child', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('childName').trim().isLength({ min: 2 }),
  body('age').isInt({ min: 3, max: 18 }),
  body('parentEmail').isEmail().normalizeEmail()
], authController.registerChild);

// Login User
router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').exists().isLength({ min: 6 })
], authController.login);

// SuperAdmin Login
router.post('/login/superadmin', [
  body('email').isEmail().normalizeEmail(),
  body('password').exists()
], authController.loginSuperAdmin);

// Verify Token
router.post('/verify-token', authenticateToken, authController.verifyToken);

// Check if email is registered
router.post('/check-registration', [
  body('email').isEmail().normalizeEmail()
], authController.checkRegistration);

module.exports = router;