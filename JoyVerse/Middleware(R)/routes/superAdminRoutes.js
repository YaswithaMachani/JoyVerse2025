const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const superAdminController = require('../controllers/superAdminController');
const { authenticateToken, authenticateSuperAdmin } = require('../middlewares/auth');

router.get('/users', authenticateToken, authenticateSuperAdmin, superAdminController.getAllUsers);
router.post('/create-therapist', authenticateToken, authenticateSuperAdmin, [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('name').trim().isLength({ min: 2 }),
  body('specialization').trim().isLength({ min: 1 })
], superAdminController.createTherapist);

router.post('/create-child', authenticateToken, authenticateSuperAdmin, [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('name').trim().isLength({ min: 2 }),
  body('age').isInt({ min: 3, max: 18 }),
  body('parentEmail').isEmail().normalizeEmail()
], superAdminController.createChild);

router.put('/verify-therapist/:therapistId', authenticateToken, authenticateSuperAdmin, superAdminController.verifyTherapist);
router.delete('/delete-user/:userId', authenticateToken, authenticateSuperAdmin, superAdminController.deleteUser);

module.exports = router;