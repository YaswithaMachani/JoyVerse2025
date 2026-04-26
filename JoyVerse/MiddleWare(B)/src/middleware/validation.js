const { body } = require('express-validator');

// Therapist registration validation
const validateTherapistRegistration = [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('fullName').trim().isLength({ min: 2 }),
  body('phoneNumber').trim().isLength({ min: 10 }),
  body('licenseNumber').trim().isLength({ min: 1 })
];

// Child registration validation
const validateChildRegistration = [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('childName').trim().isLength({ min: 2 }),
  body('age').isInt({ min: 3, max: 18 }),
  body('parentEmail').isEmail().normalizeEmail()
];

// Login validation
const validateLogin = [
  body('email').isEmail().normalizeEmail(),
  body('password').exists().isLength({ min: 6 })
];

// SuperAdmin login validation
const validateSuperAdminLogin = [
  body('email').isEmail().normalizeEmail(),
  body('password').exists()
];

// Check registration validation
const validateCheckRegistration = [
  body('email').isEmail().normalizeEmail()
];

// Game score validation
const validateGameScore = [
  body('gameType').isIn(['pacman', 'missing-letter-pop', 'space-math']),
  body('score').isNumeric().isInt({ min: 0 }),
  body('maxScore').optional().isNumeric(),
  body('timeTaken').optional().isNumeric(),
  body('level').optional().isInt({ min: 1 }),
  body('gameData').optional().isObject()
];

// Create therapist validation (SuperAdmin)
const validateCreateTherapist = [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('name').trim().isLength({ min: 2 }),
  body('specialization').trim().isLength({ min: 1 })
];

// Create child validation (SuperAdmin)
const validateCreateChild = [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('name').trim().isLength({ min: 2 }),
  body('age').isInt({ min: 3, max: 18 }),
  body('parentEmail').isEmail().normalizeEmail()
];

module.exports = {
  validateTherapistRegistration,
  validateChildRegistration,
  validateLogin,
  validateSuperAdminLogin,
  validateCheckRegistration,
  validateGameScore,
  validateCreateTherapist,
  validateCreateChild
};