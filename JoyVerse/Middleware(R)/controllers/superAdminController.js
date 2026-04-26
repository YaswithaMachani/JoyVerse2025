const bcrypt = require('bcryptjs');
const { validationResult } = require('express-validator');
const User = require('../models/User');
const GameScore = require('../models/GameScore');
const { USER_TYPES } = require('../config/constants');

exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find({ userType: { $ne: USER_TYPES.SUPERADMIN } })
      .select('-password')
      .sort({ createdAt: -1 });
    
    const userData = users.map(user => ({
      _id: user._id,
      email: user.email,
      userType: user.userType,
      name: user.userType === USER_TYPES.THERAPIST ? user.fullName : user.childName,
      age: user.userType === USER_TYPES.CHILD ? user.age : undefined,
      parentEmail: user.userType === USER_TYPES.CHILD ? user.parentEmail : undefined,
      specialization: user.userType === USER_TYPES.THERAPIST ? user.licenseNumber : undefined,
      phoneNumber: user.userType === USER_TYPES.THERAPIST ? user.phoneNumber : undefined,
      isVerified: true,
      createdAt: user.createdAt,
      isActive: user.isActive,
      lastLoginAt: user.lastLoginAt
    }));

    res.json({ success: true, users: userData });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

exports.createTherapist = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const { email, password, name, specialization } = req.body;
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: 'User already exists with this email' });

    const hashedPassword = await bcrypt.hash(password, 12);
    const newUser = new User({
      email,
      password: hashedPassword,
      userType: USER_TYPES.THERAPIST,
      fullName: name,
      phoneNumber: 'N/A',
      licenseNumber: specialization
    });

    await newUser.save();

    res.status(201).json({
      message: 'Therapist account created successfully',
      user: {
        id: newUser._id,
        email: newUser.email,
        name: newUser.fullName,
        specialization: newUser.licenseNumber
      }
    });
  } catch (error) {
    console.error('Error creating therapist:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

exports.createChild = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const { email, password, name, age, parentEmail } = req.body;
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: 'User already exists with this email' });

    const hashedPassword = await bcrypt.hash(password, 12);
    const newUser = new User({
      email,
      password: hashedPassword,
      userType: USER_TYPES.CHILD,
      childName: name,
      age,
      parentEmail
    });

    await newUser.save();

    res.status(201).json({
      message: 'Child account created successfully',
      user: {
        id: newUser._id,
        email: newUser.email,
        name: newUser.childName,
        age: newUser.age,
        parentEmail: newUser.parentEmail
      }
    });
  } catch (error) {
    console.error('Error creating child:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

exports.verifyTherapist = async (req, res) => {
  try {
    const { therapistId } = req.params;
    const therapist = await User.findById(therapistId);
    
    if (!therapist || therapist.userType !== USER_TYPES.THERAPIST) {
      return res.status(404).json({ message: 'Therapist not found' });
    }

    res.json({
      message: 'Therapist verified successfully',
      user: {
        id: therapist._id,
        name: therapist.fullName,
        isVerified: true
      }
    });
  } catch (error) {
    console.error('Error verifying therapist:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    await Promise.all([
      User.findByIdAndDelete(userId),
      GameScore.deleteMany({ userId })
    ]);

    res.json({
      message: 'User account deleted successfully',
      deletedUser: {
        id: user._id,
        email: user.email,
        name: user.userType === USER_TYPES.THERAPIST ? user.fullName : user.childName
      }
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};