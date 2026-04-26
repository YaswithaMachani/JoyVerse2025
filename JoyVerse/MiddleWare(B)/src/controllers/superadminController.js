const User = require('../models/User');
const GameScore = require('../models/GameScore');
const Emotion = require('../models/Emotion');
const crypto = require('crypto');
const { validationResult } = require('express-validator');

// Get all users with their statistics
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find()
      .select('-password')
      .populate('gameScores')
      .populate('emotions');
    
    const userStats = await Promise.all(
      users.map(async (user) => {
        const totalGames = await GameScore.countDocuments({ userId: user._id });
        const averageScore = await GameScore.aggregate([
          { $match: { userId: user._id } },
          { $group: { _id: null, avgScore: { $avg: '$score' } } }
        ]);
        const emotionCount = await Emotion.countDocuments({ userId: user._id });
        
        return {
          ...user.toObject(),
          stats: {
            totalGames,
            averageScore: averageScore.length > 0 ? averageScore[0].avgScore : 0,
            emotionCount
          }
        };
      })
    );

    res.json({
      success: true,
      data: userStats,
      total: users.length
    });
  } catch (error) {
    console.error('Error in getAllUsers:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching users',
      error: error.message
    });
  }
};

// Create therapist account
const createTherapist = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { email, password, name, specialization } = req.body;
    
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }
    
    const bcrypt = require('bcryptjs');
const hashedPassword = await bcrypt.hash(password, 12);
    
    const therapist = new User({
      email,
      password: hashedPassword,
      username: name,
      role: 'therapist',
      specialization,
      isVerified: false,
      isActive: true
    });
    
    await therapist.save();
    
    res.status(201).json({
      success: true,
      message: 'Therapist account created successfully',
      data: {
        id: therapist._id,
        email: therapist.email,
        username: therapist.username,
        role: therapist.role,
        specialization: therapist.specialization,
        isVerified: therapist.isVerified
      }
    });
  } catch (error) {
    console.error('Error in createTherapist:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating therapist account',
      error: error.message
    });
  }
};

// Create child account
const createChild = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { email, password, name, age, parentEmail } = req.body;
    
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }
    
    const parent = await User.findOne({ email: parentEmail });
    if (!parent) {
      return res.status(400).json({
        success: false,
        message: 'Parent email not found'
      });
    }
    
    const bcrypt = require('bcryptjs');
const hashedPassword = await bcrypt.hash(password, 12);

    
    const child = new User({
      email,
      password: hashedPassword,
      username: name,
      role: 'patient',
      age,
      parentEmail,
      isChild: true,
      isActive: true
    });
    
    await child.save();
    
    res.status(201).json({
      success: true,
      message: 'Child account created successfully',
      data: {
        id: child._id,
        email: child.email,
        username: child.username,
        role: child.role,
        age: child.age,
        parentEmail: child.parentEmail
      }
    });
  } catch (error) {
    console.error('Error in createChild:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating child account',
      error: error.message
    });
  }
};

// Verify therapist
const verifyTherapist = async (req, res) => {
  try {
    const { therapistId } = req.params;
    
    const therapist = await User.findById(therapistId);
    if (!therapist) {
      return res.status(404).json({
        success: false,
        message: 'Therapist not found'
      });
    }
    
    if (therapist.role !== 'therapist') {
      return res.status(400).json({
        success: false,
        message: 'User is not a therapist'
      });
    }
    
    therapist.isVerified = true;
    await therapist.save();
    
    res.json({
      success: true,
      message: 'Therapist verified successfully',
      data: {
        id: therapist._id,
        email: therapist.email,
        username: therapist.username,
        isVerified: therapist.isVerified
      }
    });
  } catch (error) {
    console.error('Error in verifyTherapist:', error);
    res.status(500).json({
      success: false,
      message: 'Error verifying therapist',
      error: error.message
    });
  }
};

// Get system statistics
const getSystemStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalTherapists = await User.countDocuments({ role: 'therapist' });
    const totalPatients = await User.countDocuments({ role: 'patient' });
    const totalGames = await GameScore.countDocuments();
    const totalEmotions = await Emotion.countDocuments();
    
    const recentUsers = await User.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('-password');
    
    const topScores = await GameScore.find()
      .sort({ score: -1 })
      .limit(10)
      .populate('userId', 'username email');

    res.json({
      success: true,
      data: {
        overview: {
          totalUsers,
          totalTherapists,
          totalPatients,
          totalGames,
          totalEmotions
        },
        recentUsers,
        topScores
      }
    });
  } catch (error) {
    console.error('Error in getSystemStats:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching system statistics',
      error: error.message
    });
  }
};

// Delete user by ID
const deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    await GameScore.deleteMany({ userId });
    await Emotion.deleteMany({ userId });
    await User.findByIdAndDelete(userId);
    
    res.json({
      success: true,
      message: 'User and related data deleted successfully'
    });
  } catch (error) {
    console.error('Error in deleteUser:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting user',
      error: error.message
    });
  }
};

// Update user role
const updateUserRole = async (req, res) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;
    
    if (!['patient', 'therapist'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role. Must be either patient or therapist'
      });
    }
    
    const user = await User.findByIdAndUpdate(
      userId,
      { role },
      { new: true }
    ).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    res.json({
      success: true,
      message: 'User role updated successfully',
      data: user
    });
  } catch (error) {
    console.error('Error in updateUserRole:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating user role',
      error: error.message
    });
  }
};

// Get user details with full activity history
const getUserDetails = async (req, res) => {
  try {
    const { userId } = req.params;
    
    const user = await User.findById(userId).select('-password');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    const gameScores = await GameScore.find({ userId })
      .sort({ createdAt: -1 });
    
    const emotions = await Emotion.find({ userId })
      .sort({ createdAt: -1 });
    
    res.json({
      success: true,
      data: {
        user,
        gameScores,
        emotions
      }
    });
  } catch (error) {
    console.error('Error in getUserDetails:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user details',
      error: error.message
    });
  }
};

// Suspend/Unsuspend user
const toggleUserStatus = async (req, res) => {
  try {
    const { userId } = req.params;
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    user.isActive = !user.isActive;
    await user.save();
    
    res.json({
      success: true,
      message: `User ${user.isActive ? 'activated' : 'suspended'} successfully`,
      data: {
        userId: user._id,
        isActive: user.isActive
      }
    });
  } catch (error) {
    console.error('Error in toggleUserStatus:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating user status',
      error: error.message
    });
  }
};

// Get game statistics
const getGameStats = async (req, res) => {
  try {
    const totalGames = await GameScore.countDocuments();
    const averageScore = await GameScore.aggregate([
      { $group: { _id: null, avgScore: { $avg: '$score' } } }
    ]);
    
    const gamesByType = await GameScore.aggregate([
      { $group: { _id: '$gameType', count: { $sum: 1 } } }
    ]);
    
    const topPerformers = await GameScore.aggregate([
      { $group: { _id: '$userId', maxScore: { $max: '$score' }, totalGames: { $sum: 1 } } },
      { $sort: { maxScore: -1 } },
      { $limit: 10 },
      { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
      { $unwind: '$user' },
      { $project: { username: '$user.username', maxScore: 1, totalGames: 1 } }
    ]);
    
    res.json({
      success: true,
      data: {
        totalGames,
        averageScore: averageScore.length > 0 ? averageScore[0].avgScore : 0,
        gamesByType,
        topPerformers
      }
    });
  } catch (error) {
    console.error('Error in getGameStats:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching game statistics',
      error: error.message
    });
  }
};

// Get emotion analytics
const getEmotionAnalytics = async (req, res) => {
  try {
    const totalEmotions = await Emotion.countDocuments();
    
    const emotionsByType = await Emotion.aggregate([
      { $group: { _id: '$emotionType', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    const emotionsByIntensity = await Emotion.aggregate([
      { $group: { _id: '$intensity', count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);
    
    const recentEmotions = await Emotion.find()
      .sort({ createdAt: -1 })
      .limit(20)
      .populate('userId', 'username');
    
    res.json({
      success: true,
      data: {
        totalEmotions,
        emotionsByType,
        emotionsByIntensity,
        recentEmotions
      }
    });
  } catch (error) {
    console.error('Error in getEmotionAnalytics:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching emotion analytics',
      error: error.message
    });
  }
};

module.exports = {
  getAllUsers,
  createTherapist,
  createChild,
  verifyTherapist,
  getSystemStats,
  deleteUser,
  updateUserRole,
  getUserDetails,
  toggleUserStatus,
  getGameStats,
  getEmotionAnalytics
};