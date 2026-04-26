const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticateToken } = require('../middlewares/auth');

router.get('/', authenticateToken, userController.getAllUsers);

module.exports = router;