const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const User = require('../models/User');
const { JWT_SECRET } = require('../config/jwt');

// Register User (Therapist)
const registerTherapist = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password, fullName, phoneNumber, licenseNumber } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create new therapist user
    const newUser = new User({
      email,
      password: hashedPassword,
      userType: 'therapist',
      fullName,
      phoneNumber,
      licenseNumber
    });

    await newUser.save();

    // Generate JWT token
    const token = jwt.sign(
      { userId: newUser._id, email: newUser.email, userType: newUser.userType },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

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

// Register User (Child)
const registerChild = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password, childName, age, parentEmail } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create new child user
    const newUser = new User({
      email,
      password: hashedPassword,
      userType: 'child',
      childName,
      age,
      parentEmail
    });

    await newUser.save();

    // Generate JWT token
    const token = jwt.sign(
      { userId: newUser._id, email: newUser.email, userType: newUser.userType },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

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

// Login User
const login = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Invalid input data',
        errors: errors.array() 
      });
    }

    const { email, password } = req.body;

    // Find user by email and ensure account is active
    const user = await User.findOne({ email, isActive: true });
    if (!user) {
      return res.status(401).json({ 
        message: 'Access denied. Please check your credentials or register first.' 
      });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ 
        message: 'Access denied. Please check your credentials or register first.' 
      });
    }

    // Update last login time
    await User.findByIdAndUpdate(user._id, { 
      lastLoginAt: new Date() 
    });

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, email: user.email, userType: user.userType },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Prepare user data based on user type
    let userData = {
      id: user._id,
      email: user.email,
      userType: user.userType
    };

    if (user.userType === 'therapist') {
      userData.fullName = user.fullName;
      userData.licenseNumber = user.licenseNumber;
    } else if (user.userType === 'child') {
      userData.childName = user.childName;
      userData.age = user.age;
    }

    res.json({
      message: 'Login successful',
      token,
      user: userData
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// SuperAdmin Login
const loginSuperAdmin = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Invalid input data',
        errors: errors.array() 
      });
    }

    const { email, password } = req.body;
    
    // Verify this is a superadmin email (simple check)
    if (!email.includes('@admin')) {
      return res.status(401).json({ 
        message: 'This is not a superadmin account' 
      });
    }

    // Find superadmin user by email
    const user = await User.findOne({ email, userType: 'superadmin' });
    
    if (!user) {
      return res.status(401).json({ 
        message: 'Access denied. Invalid superadmin credentials.' 
      });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ 
        message: 'Access denied. Invalid superadmin credentials.' 
      });
    }

    // Update last login time
    await User.findByIdAndUpdate(user._id, { 
      lastLoginAt: new Date() 
    });

    // Generate JWT token with superadmin role
    const token = jwt.sign(
      { userId: user._id, email: user.email, userType: 'superadmin' },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      message: 'SuperAdmin login successful',
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.fullName || 'SuperAdmin',
        userType: 'superadmin'
      }
    });

  } catch (error) {
    console.error('SuperAdmin login error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Verify Token
const verifyToken = async (req, res) => {
  try {
    // Find user in database to ensure they still exist and are active
    const user = await User.findById(req.user.userId).select('-password');
    if (!user || !user.isActive) {
      return res.status(401).json({ message: 'User account not found or inactive' });
    }

    // Prepare user data based on user type
    let userData = {
      id: user._id,
      email: user.email,
      userType: user.userType,
      registeredAt: user.registeredAt
    };

    if (user.userType === 'therapist') {
      userData.fullName = user.fullName;
      userData.licenseNumber = user.licenseNumber;
      userData.phoneNumber = user.phoneNumber;
    } else if (user.userType === 'child') {
      userData.childName = user.childName;
      userData.age = user.age;
      userData.parentEmail = user.parentEmail;
    } else if (user.userType === 'superadmin') {
      userData.name = user.fullName || 'SuperAdmin';
    }

    res.json({
      valid: true,
      user: userData
    });
  } catch (error) {
    console.error('Token verification error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
// ... your existing verifyToken function ...

// Check if email is registered
const checkRegistration = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ email });
    
    if (existingUser) {
      return res.json({
        registered: true,
        userType: existingUser.userType,
        message: 'Email is already registered'
      });
    } else {
      return res.json({
        registered: false,
        message: 'Email is not registered'
      });
    }

  } catch (error) {
    console.error('Check registration error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = {
  registerTherapist,
  registerChild,
  login,
  loginSuperAdmin,
  verifyToken,
  checkRegistration  // ← MAKE SURE THIS LINE IS HERE
};

