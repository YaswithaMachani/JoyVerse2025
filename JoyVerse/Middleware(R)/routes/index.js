const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const User = require('../models/User');

// Health check route
router.get('/health', (req, res) => {
  res.json({ message: 'Joyverse API is running successfully!' });
});

// DB status route
router.get('/db-status', async (req, res) => {
  try {
    const dbState = mongoose.connection.readyState;
    const states = ['disconnected', 'connected', 'connecting', 'disconnecting'];

    const userCount = await User.countDocuments();
    const therapistCount = await User.countDocuments({ userType: 'therapist' });
    const childCount = await User.countDocuments({ userType: 'child' });

    res.json({
      database: {
        status: states[dbState],
        connection: process.env.MONGODB_URI,
        name: 'joyverse'
      },
      statistics: {
        totalUsers: userCount,
        therapists: therapistCount,
        children: childCount
      },
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    res.status(500).json({ message: 'Database error', error: err.message });
  }
});

// Mount sub-routers (make sure these files exist and export a router)
router.use('/auth', require('./authRoutes'));
router.use('/users', require('./userRoutes'));
router.use('/game-scores', require('./gameRoutes'));
router.use('/therapist', require('./therapistRoutes'));
router.use('/superadmin', require('./superAdminRoutes'));


module.exports = router;
