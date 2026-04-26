const { validationResult } = require('express-validator');
const User = require('../models/User');
const mongoose = require('mongoose');

// Get User Profile (Protected Route)
const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ user });
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Check if email is registered
const checkRegistration = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email } = req.body;
    const user = await User.findOne({ email, isActive: true }).select('email userType registeredAt');
    
    if (user) {
      res.json({
        isRegistered: true,
        userType: user.userType,
        registeredAt: user.registeredAt
      });
    } else {
      res.json({
        isRegistered: false,
        message: 'Email not found. Please register first to access the system.'
      });
    }
  } catch (error) {
    console.error('Registration check error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get All Users (Admin/Therapist only)
const getAllUsers = async (req, res) => {
  try {
    if (req.user.userType !== 'therapist') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const users = await User.find({ isActive: true }).select('-password');
    res.json({ users });
  } catch (error) {
    console.error('Users fetch error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Database status check
const getDbStatus = async (req, res) => {
  try {
    const dbState = mongoose.connection.readyState;
    const states = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting'
    };
    
    const userCount = await User.countDocuments();
    const therapistCount = await User.countDocuments({ userType: 'therapist' });
    const childCount = await User.countDocuments({ userType: 'child' });
    
    res.json({
      database: {
        status: states[dbState],
        connection: process.env.MONGODB_URI || 'MONGO_URI=mongodb+srv://joyadmin:joy123@joyverse.wh2ssu9.mongodb.net/joyverse?retryWrites=true&w=majority&appName=JoyVerse',
        name: 'joyverse'
      },
      statistics: {
        totalUsers: userCount,
        therapists: therapistCount,
        children: childCount
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      database: {
        status: 'error',
        error: error.message
      }
    });
  }
};

module.exports = {
  getUserProfile,
  checkRegistration,
  getAllUsers,
  getDbStatus
};