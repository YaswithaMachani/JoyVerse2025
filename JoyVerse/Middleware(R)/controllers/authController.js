const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const User = require('../models/User');
const { JWT_SECRET, USER_TYPES } = require('../config/constants');

// Helper function to generate JWT token
const generateToken = (user) => {
  return jwt.sign(
    { userId: user._id, email: user.email, userType: user.userType },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
};

exports.registerTherapist = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const { email, password, fullName, phoneNumber, licenseNumber } = req.body;
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: 'User already exists with this email' });

    const hashedPassword = await bcrypt.hash(password, 12);
    const newUser = new User({
      email,
      password: hashedPassword,
      userType: USER_TYPES.THERAPIST,
      fullName,
      phoneNumber,
      licenseNumber
    });

    await newUser.save();
    const token = generateToken(newUser);

    res.status(201).json({
      message: 'Therapist registered successfully',
      token,
      user: {
        id: newUser._id,
        email: newUser.email,
        userType: newUser.userType,
        fullName: newUser.fullName
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

exports.registerChild = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const { email, password, childName, age, parentEmail } = req.body;
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: 'User already exists with this email' });

    const hashedPassword = await bcrypt.hash(password, 12);
    const newUser = new User({
      email,
      password: hashedPassword,
      userType: USER_TYPES.CHILD,
      childName,
      age,
      parentEmail
    });

    await newUser.save();
    const token = generateToken(newUser);

    res.status(201).json({
      message: 'Child registered successfully',
      token,
      user: {
        id: newUser._id,
        email: newUser.email,
        userType: newUser.userType,
        childName: newUser.childName,
        age: newUser.age
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

exports.login = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ message: 'Invalid input data', errors: errors.array() });

  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email, isActive: true });
    if (!user) return res.status(401).json({ message: 'Access denied. Please check your credentials or register first.' });

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) return res.status(401).json({ message: 'Access denied. Please check your credentials or register first.' });

    await User.findByIdAndUpdate(user._id, { lastLoginAt: new Date() });
    const token = generateToken(user);

    let userData = {
      id: user._id,
      email: user.email,
      userType: user.userType
    };

    if (user.userType === USER_TYPES.THERAPIST) {
      userData.fullName = user.fullName;
      userData.licenseNumber = user.licenseNumber;
    } else if (user.userType === USER_TYPES.CHILD) {
      userData.childName = user.childName;
      userData.age = user.age;
    }

    res.json({ message: 'Login successful', token, user: userData });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

exports.superAdminLogin = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ message: 'Invalid input data', errors: errors.array() });

  try {
    const { email, password } = req.body;
    if (!email.includes('@admin')) return res.status(401).json({ message: 'This is not a superadmin account' });

    const user = await User.findOne({ email, userType: USER_TYPES.SUPERADMIN });
    if (!user) return res.status(401).json({ message: 'Access denied. Invalid superadmin credentials.' });

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) return res.status(401).json({ message: 'Access denied. Invalid superadmin credentials.' });

    await User.findByIdAndUpdate(user._id, { lastLoginAt: new Date() });
    const token = generateToken(user);

    res.json({
      message: 'SuperAdmin login successful',
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.fullName || 'SuperAdmin',
        userType: USER_TYPES.SUPERADMIN
      }
    });
  } catch (error) {
    console.error('SuperAdmin login error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

exports.verifyToken = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password');
    if (!user || !user.isActive) return res.status(401).json({ message: 'User account not found or inactive' });

    let userData = {
      id: user._id,
      email: user.email,
      userType: user.userType,
      registeredAt: user.registeredAt
    };

    if (user.userType === USER_TYPES.THERAPIST) {
      userData.fullName = user.fullName;
      userData.licenseNumber = user.licenseNumber;
      userData.phoneNumber = user.phoneNumber;
    } else if (user.userType === USER_TYPES.CHILD) {
      userData.childName = user.childName;
      userData.age = user.age;
      userData.parentEmail = user.parentEmail;
    } else if (user.userType === USER_TYPES.SUPERADMIN) {
      userData.name = user.fullName || 'SuperAdmin';
    }

    res.json({ valid: true, user: userData });
  } catch (error) {
    console.error('Token verification error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

exports.checkRegistration = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
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
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ user });
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};