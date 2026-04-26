const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://joyadmin:joy123@joyverse.wh2ssu9.mongodb.net/joyverse?retryWrites=true&w=majority&appName=JoyVerse');
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

connectDB();

// User Schema
const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  userType: {
    type: String,
    required: true,
    enum: ['therapist', 'child', 'superadmin']
  },
  // Therapist specific fields
  fullName: {
    type: String,
    required: function() { return this.userType === 'therapist'; }
  },
  phoneNumber: {
    type: String,
    required: function() { return this.userType === 'therapist'; }
  },
  licenseNumber: {
    type: String,
    required: function() { return this.userType === 'therapist'; }
  },
  // Child specific fields
  childName: {
    type: String,
    required: function() { return this.userType === 'child'; }
  },
  age: {
    type: Number,
    required: function() { return this.userType === 'child'; }
  },
  parentEmail: {
    type: String,
    required: function() { return this.userType === 'child'; }
  },  isActive: {
    type: Boolean,
    default: true
  },
  lastLoginAt: {
    type: Date
  },
  registeredAt: {
    type: Date,
    default: Date.now
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const User = mongoose.model('User', userSchema);

// Game Score Schema
const gameScoreSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  gameType: {
    type: String,
    required: true,
    enum: ['pacman', 'space-math', 'missing-letter-pop', 'kitten-match', 'super-kitten-match', 'art-studio', 'music-fun']
  },
  score: {
    type: Number,
    required: true
  },
  level: {
    type: Number,
    default: 1
  },
  maxScore: {
    type: Number
  },
  timeTaken: {
    type: Number
  },
  accuracy: {
    type: Number
  },
  emotionData: {
    type: Array
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const GameScore = mongoose.model('GameScore', gameScoreSchema);

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ message: 'Access denied. No token provided.' });
  }
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    console.error('Token verification error:', error);
    return res.status(403).json({ message: 'Invalid token.' });
  }
};

// Middleware to verify SuperAdmin access
const authenticateSuperAdmin = (req, res, next) => {
  if (req.user.userType !== 'superadmin' && req.user.role !== 'superadmin') {
    return res.status(403).json({ message: 'SuperAdmin access required' });
  }
  next();
};

// Routes

// Health check
app.get('/api/health', (req, res) => {
  res.json({ message: 'Joyverse API is running successfully!' });
});

// Database status check
app.get('/api/db-status', async (req, res) => {
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
        connection: process.env.MONGODB_URI || 'mongodb://localhost:27017/joyverse',
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
});

// Register User (Therapist)
app.post('/api/register/therapist', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('fullName').trim().isLength({ min: 2 }),
  body('phoneNumber').trim().isLength({ min: 10 }),
  body('licenseNumber').trim().isLength({ min: 1 })
], async (req, res) => {
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
});

// Register User (Child)
app.post('/api/register/child', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('childName').trim().isLength({ min: 2 }),
  body('age').isInt({ min: 3, max: 18 }),
  body('parentEmail').isEmail().normalizeEmail()
], async (req, res) => {
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
});

// Login User
app.post('/api/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').exists().isLength({ min: 6 })
], async (req, res) => {
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
});

// SuperAdmin Login
app.post('/api/login/superadmin', [
  body('email').isEmail().normalizeEmail(),
  body('password').exists()
], async (req, res) => {
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
});

// Get User Profile (Protected Route)
app.get('/api/profile', authenticateToken, async (req, res) => {
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
});

// Verify Token
app.post('/api/verify-token', authenticateToken, async (req, res) => {
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
});

// === SUPERADMIN ENDPOINTS ===

// Get all users (SuperAdmin only)
app.get('/api/superadmin/users', authenticateToken, authenticateSuperAdmin, async (req, res) => {
  try {
    // Exclude superadmin users from the results
    const users = await User.find({ userType: { $ne: 'superadmin' } })
      .select('-password')
      .sort({ createdAt: -1 });
    
    const userData = users.map(user => ({
      _id: user._id,
      email: user.email,
      userType: user.userType,
      name: user.userType === 'therapist' ? user.fullName : user.childName,
      age: user.userType === 'child' ? user.age : undefined,
      parentEmail: user.userType === 'child' ? user.parentEmail : undefined,
      specialization: user.userType === 'therapist' ? user.licenseNumber : undefined,
      phoneNumber: user.userType === 'therapist' ? user.phoneNumber : undefined,
      isVerified: user.userType === 'therapist' ? true : undefined, // Assuming all are verified for now
      createdAt: user.createdAt,
      isActive: user.isActive,
      lastLoginAt: user.lastLoginAt
    }));

    res.json({
      success: true,
      users: userData
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Create therapist account (SuperAdmin only)
app.post('/api/superadmin/create-therapist', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('name').trim().isLength({ min: 2 }),
  body('specialization').trim().isLength({ min: 1 })
], authenticateToken, authenticateSuperAdmin, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password, name, specialization } = req.body;

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
      fullName: name,
      phoneNumber: 'N/A', // Default for admin-created accounts
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
});

// Create child account (SuperAdmin only)
app.post('/api/superadmin/create-child', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('name').trim().isLength({ min: 2 }),
  body('age').isInt({ min: 3, max: 18 }),
  body('parentEmail').isEmail().normalizeEmail()
], authenticateToken, authenticateSuperAdmin, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password, name, age, parentEmail } = req.body;

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
});

// Verify therapist (SuperAdmin only)
app.put('/api/superadmin/verify-therapist/:therapistId', authenticateToken, authenticateSuperAdmin, async (req, res) => {
  try {
    const { therapistId } = req.params;

    const therapist = await User.findById(therapistId);
    if (!therapist || therapist.userType !== 'therapist') {
      return res.status(404).json({ message: 'Therapist not found' });
    }

    // Update verification status (for now just acknowledge the request)
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
});

// Delete user account (SuperAdmin only)
app.delete('/api/superadmin/delete-user/:userId', authenticateToken, authenticateSuperAdmin, async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Delete the user
    await User.findByIdAndDelete(userId);

    // Also delete their game scores
    await GameScore.deleteMany({ userId });

    res.json({
      message: 'User account deleted successfully',
      deletedUser: {
        id: user._id,
        email: user.email,
        name: user.userType === 'therapist' ? user.fullName : user.childName
      }
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Check if email is registered
app.post('/api/check-registration', [
  body('email').isEmail().normalizeEmail()
], async (req, res) => {
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
});

// Get All Users (Admin/Therapist only)
app.get('/api/users', authenticateToken, async (req, res) => {
  try {
    if (req.user.userType !== 'therapist') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const users = await User.find({ isActive: true }).select('-password');
    res.json({ users });
  } catch (error) {
    console.error('Users fetch error:', error);
    res.status(500).json({ message: 'Internal server error' });  }
});

// ======================
// GAME SCORE ROUTES
// ======================

// Save Game Score (Fixed - Single Route)
app.post('/api/game-scores', authenticateToken, [
  body('gameType').isIn(['pacman', 'space-math', 'missing-letter-pop', 'kitten-match', 'super-kitten-match', 'art-studio', 'music-fun']),
  body('score').isNumeric().isInt({ min: 0 }),
  body('maxScore').optional().isNumeric(),
  body('timeTaken').optional().isNumeric(),
  body('level').optional().isInt({ min: 1 }),
  body('gameData').optional().isObject()
], async (req, res) => {
  try {
    console.log('🎮 BACKEND: Received game score save request');
    console.log('🎮 User ID:', req.user.userId);
    console.log('🎮 Request body:', req.body);
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('❌ Validation errors:', errors.array());
      return res.status(400).json({ errors: errors.array() });
    }

    const { gameType, score, maxScore, timeTaken, level, gameData } = req.body;
    
    const gameScore = new GameScore({
      userId: req.user.userId,
      gameType,
      score,
      maxScore,
      timeTaken,
      level,
      gameData
    });

    console.log('💾 BACKEND: About to save game score:', gameScore);
    await gameScore.save();
    console.log('✅ BACKEND: Game score saved successfully with ID:', gameScore._id);

    res.status(201).json({
      message: 'Game score saved successfully',
      gameScore: {
        id: gameScore._id,
        gameType: gameScore.gameType,
        score: gameScore.score,
        maxScore: gameScore.maxScore,
        timeTaken: gameScore.timeTaken,
        level: gameScore.level,
        playedAt: gameScore.playedAt
      }
    });
  } catch (error) {
    console.error('💥 BACKEND: Save game score error:', error);
    res.status(500).json({ message: 'Failed to save game score' });
  }
});

app.get('/api/game-scores', authenticateToken, async (req, res) => {
  try {
    const { gameType, limit = 10, page = 1 } = req.query;
    const skip = (page - 1) * limit;
    
    // Build query
    const query = { userId: req.user.userId };
    if (gameType) {
      query.gameType = gameType;
    }
    
    // Get scores with pagination
    const scores = await GameScore.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip);
    
    // Get total count
    const total = await GameScore.countDocuments(query);
    
    res.json({
      scores,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching game scores:', error);
    res.status(500).json({ message: 'Failed to fetch game scores', error: error.message });
  }
});

// Get user's best scores by game type
app.get('/api/game-scores/best', authenticateToken, async (req, res) => {
  try {
    console.log('🏆 BACKEND: Fetching best scores for user:', req.user.userId);
    
    // Get the best score for each game type
    const gameTypes = ['pacman', 'space-math', 'missing-letter-pop', 'kitten-match', 'super-kitten-match', 'art-studio', 'music-fun'];
    const bestScores = [];
    
    for (const gameType of gameTypes) {
      const bestScore = await GameScore.findOne({
        userId: req.user.userId,
        gameType: gameType
      })
      .sort({ score: -1 })
      .limit(1)
      .lean();
      
      if (bestScore) {
        bestScores.push({
          gameType: gameType,
          score: bestScore.score,
          maxScore: bestScore.maxScore,
          level: bestScore.level,
          timeTaken: bestScore.timeTaken,
          playedAt: bestScore.createdAt
        });
      }
    }
    
    console.log(`🏆 BACKEND: Found ${bestScores.length} best scores`);
    res.json({
      bestScores: bestScores
    });
  } catch (error) {
    console.error('💥 BACKEND: Error fetching best scores:', error);
    res.status(500).json({ message: 'Failed to fetch best scores', error: error.message });
  }
});

// Get game statistics for user
app.get('/api/game-scores/stats', authenticateToken, async (req, res) => {
  try {
    console.log('📊 BACKEND: Fetching game statistics for user:', req.user.userId);
    
    const { gameType } = req.query;
    
    // Build query
    const query = { userId: req.user.userId };
    if (gameType) {
      query.gameType = gameType;
    }
    
    // Get all scores for analysis
    const allScores = await GameScore.find(query)
      .sort({ createdAt: -1 })
      .lean();
    
    if (allScores.length === 0) {
      return res.json({
        stats: {
          totalGames: 0,
          averageScore: 0,
          bestScore: 0,
          totalTimePlayed: 0,
          averageTime: 0,
          gamesThisWeek: 0,
          improvementRate: 0
        }
      });
    }
    
    // Calculate statistics
    const scores = allScores.map(s => s.score);
    const times = allScores.map(s => s.timeTaken).filter(t => t != null);
    
    const totalGames = allScores.length;
    const averageScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
    const bestScore = Math.max(...scores);
    const totalTimePlayed = times.reduce((a, b) => a + b, 0);
    const averageTime = times.length > 0 ? Math.round(totalTimePlayed / times.length) : 0;
    
    // Games played this week
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const gamesThisWeek = allScores.filter(score => score.createdAt >= oneWeekAgo).length;
    
    // Calculate improvement rate (compare recent vs older games)
    let improvementRate = 0;
    if (totalGames >= 6) {
      const recentGames = allScores.slice(0, 3);
      const olderGames = allScores.slice(-3);
      
      const recentAvg = recentGames.reduce((sum, game) => sum + game.score, 0) / recentGames.length;
      const olderAvg = olderGames.reduce((sum, game) => sum + game.score, 0) / olderGames.length;
      
      if (olderAvg > 0) {
        improvementRate = Math.round(((recentAvg - olderAvg) / olderAvg) * 100);
        improvementRate = Math.max(-100, Math.min(100, improvementRate)); // Cap between -100% and +100%
      }
    }
    
    const stats = {
      totalGames,
      averageScore,
      bestScore,
      totalTimePlayed,
      averageTime,
      gamesThisWeek,
      improvementRate
    };
    
    console.log('📊 BACKEND: Calculated stats:', stats);
    res.json({ stats });
    
  } catch (error) {
    console.error('💥 BACKEND: Error fetching game statistics:', error);
    res.status(500).json({ message: 'Failed to fetch game statistics', error: error.message });
  }
});

// Emotion Schema and Model
const emotionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  emotion: {
    type: String,
    required: true
  },
  confidence: {
    type: Number,
    required: true
  },
  landmarks: {
    type: [Number],
    default: []
  },
  probs: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});
const Emotion = mongoose.model('Emotion', emotionSchema);
app.post('/api/emotions', authenticateToken, async (req, res) => {
  try {
    const { emotion, confidence, landmarks, probs, timestamp } = req.body;

    const newEmotion = new Emotion({
      userId: req.user.userId, // Automatically associates the emotion with the logged-in child
      emotion,
      confidence,
      landmarks,
      probs,
      timestamp: timestamp || new Date()
    });

    await newEmotion.save();

    res.status(201).json({
      message: 'Emotion recorded successfully',
      emotionId: newEmotion._id
    });
  } catch (error) {
    console.error('Error saving emotion:', error);
    res.status(500).json({ message: 'Failed to save emotion' });
  }
});


// Get Children Data for Therapists
app.get('/api/therapist/children', authenticateToken, async (req, res) => {
  try {
    console.log('🩺 BACKEND: Therapist requesting children data');
    
    // Check if user is a therapist
    if (req.user.userType !== 'therapist') {
      return res.status(403).json({ message: 'Access denied. Therapist access required.' });
    }

    // Get all child users
    const children = await User.find({ userType: 'child', isActive: true })
      .select('_id childName age email parentEmail createdAt')
      .lean();

    console.log(`🩺 BACKEND: Found ${children.length} children`);

    // For each child, get their game scores and calculate analytics
    const childrenWithData = await Promise.all(children.map(async (child) => {
      try {
        // Get all game scores for this child
        const gameScores = await GameScore.find({ userId: child._id })
          .sort({ playedAt: -1 })
          .lean();

        console.log(`🎮 Child ${child.childName}: ${gameScores.length} game scores found`);

        // Group scores by game type and calculate analytics
        const gameAnalytics = {};
        const gameTypes = ['pacman', 'missing-letter-pop', 'art-studio', 'space-math'];
        
        gameTypes.forEach(gameType => {
          const typeScores = gameScores.filter(score => score.gameType === gameType);
          
          if (typeScores.length > 0) {
            // Calculate average, best, and latest scores
            const scores = typeScores.map(s => s.score);
            const times = typeScores.map(s => s.timeTaken).filter(t => t != null);
            const levels = typeScores.map(s => s.level).filter(l => l != null);
            
            // Calculate improvement (compare first vs last 3 games)
            let improvement = 0;
            if (typeScores.length >= 4) {
              const recentScores = scores.slice(0, 3);
              const oldScores = scores.slice(-3);
              const recentAvg = recentScores.reduce((a, b) => a + b, 0) / recentScores.length;
              const oldAvg = oldScores.reduce((a, b) => a + b, 0) / oldScores.length;
              improvement = Math.round(((recentAvg - oldAvg) / oldAvg) * 100);
            }

            gameAnalytics[gameType] = {
              score: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length), // Average score
              bestScore: Math.max(...scores),
              latestScore: scores[0],
              time: times.length > 0 ? Math.round(times.reduce((a, b) => a + b, 0) / times.length) : 0,
              attempts: Math.round(levels.reduce((a, b) => a + b, 0) / levels.length) || 1,
              improvement: Math.max(-50, Math.min(50, improvement)), // Cap improvement between -50% and +50%
              totalPlayed: typeScores.length,
              lastPlayed: typeScores[0].playedAt
            };
          } else {
            // No scores for this game type
            gameAnalytics[gameType] = {
              score: 0,
              bestScore: 0,
              latestScore: 0,
              time: 0,
              attempts: 0,
              improvement: 0,
              totalPlayed: 0,
              lastPlayed: null
            };
          }
        });
        const emotions = await Emotion.find({ userId: child._id }).sort({ timestamp: -1 }).limit(10).lean();
child.emotions = emotions;


        // Calculate overall progress and trends
        const allScores = gameScores.map(s => s.score);
        const overallProgress = allScores.length > 0 ? 
          Math.round(allScores.reduce((a, b) => a + b, 0) / allScores.length) : 0;

        // Generate weekly progress data (last 4 weeks)
        const now = new Date();
        const progressData = [];
        for (let i = 3; i >= 0; i--) {
          const weekStart = new Date(now.getTime() - (i * 7 * 24 * 60 * 60 * 1000));
          const weekEnd = new Date(weekStart.getTime() + (7 * 24 * 60 * 60 * 1000));
          
          const weekScores = gameScores.filter(score => 
            score.playedAt >= weekStart && score.playedAt < weekEnd
          );
          
          const weekAvg = weekScores.length > 0 ? 
            Math.round(weekScores.reduce((sum, score) => sum + score.score, 0) / weekScores.length) : 
            (progressData.length > 0 ? progressData[progressData.length - 1].score : 0);
            
          progressData.push({
            week: `Week ${4 - i}`,
            score: weekAvg,
            gamesPlayed: weekScores.length
          });
        }

        // Determine strengths and challenges based on game performance
        const strengths = [];
        const challenges = [];
        
        if (gameAnalytics['pacman'].score > 80) strengths.push('Hand-Eye Coordination');
        else if (gameAnalytics['pacman'].score < 60) challenges.push('Motor Skills');
        
        if (gameAnalytics['missing-letter-pop'].score > 80) strengths.push('Language Skills');
        else if (gameAnalytics['missing-letter-pop'].score < 60) challenges.push('Phonemic Awareness');
        
        if (gameAnalytics['art-studio'].score > 80) strengths.push('Creative Expression');
        else if (gameAnalytics['art-studio'].score < 60) challenges.push('Fine Motor Skills');
        
        if (gameAnalytics['space-math'].score > 80) strengths.push('Mathematical Reasoning');
        else if (gameAnalytics['space-math'].score < 60) challenges.push('Numeracy Skills');
        
        // Default strengths/challenges if none identified
        if (strengths.length === 0) strengths.push('Developing Skills', 'Consistent Effort');
        if (challenges.length === 0) challenges.push('Time Management', 'Focus Enhancement');

        return {
          id: child._id,
          name: child.childName,
          age: child.age,
          email: child.email,
          parentEmail: child.parentEmail,
          registeredAt: child.createdAt,
          games: gameAnalytics,
          overallProgress: Math.min(100, Math.max(0, overallProgress)),
          strengths,
          challenges,
          progressData,
          totalGamesPlayed: gameScores.length,
          lastActivity: gameScores.length > 0 ? gameScores[0].playedAt : child.createdAt
        };
      } catch (error) {
        console.error(`Error processing child ${child.childName}:`, error);
        // Return basic data if processing fails
        return {
          id: child._id,
          name: child.childName,
          age: child.age,
          email: child.email,
          parentEmail: child.parentEmail,
          registeredAt: child.createdAt,
          games: {
            'pacman': { score: 0, bestScore: 0, time: 0, attempts: 0, improvement: 0, totalPlayed: 0 },
            'missing-letter-pop': { score: 0, bestScore: 0, time: 0, attempts: 0, improvement: 0, totalPlayed: 0 },
            'art-studio': { score: 0, bestScore: 0, time: 0, attempts: 0, improvement: 0, totalPlayed: 0 },
            'space-math': { score: 0, bestScore: 0, time: 0, attempts: 0, improvement: 0, totalPlayed: 0 }
          },
          overallProgress: 0,
          strengths: ['Developing Skills'],
          challenges: ['Getting Started'],
          progressData: [
            { week: 'Week 1', score: 0 },
            { week: 'Week 2', score: 0 },
            { week: 'Week 3', score: 0 },
            { week: 'Week 4', score: 0 }
          ],
          totalGamesPlayed: 0,
          lastActivity: child.createdAt
        };
      }
    }));

    console.log('✅ BACKEND: Children data processed successfully');
    res.json({
      children: childrenWithData,
      summary: {
        totalChildren: childrenWithData.length,
        averageProgress: Math.round(
          childrenWithData.reduce((sum, child) => sum + child.overallProgress, 0) / 
          (childrenWithData.length || 1)
        ),
        totalGamesPlayed: childrenWithData.reduce((sum, child) => sum + child.totalGamesPlayed, 0),
        activeChildren: childrenWithData.filter(child => child.totalGamesPlayed > 0).length
      }
    });

  } catch (error) {
    console.error('💥 BACKEND: Get children data error:', error);
    res.status(500).json({ message: 'Failed to fetch children data' });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ message: 'API endpoint not found' });
});

// Seed SuperAdmin user
const seedSuperAdmin = async () => {
  try {
    const superAdminEmail = 'admin@joyverse.com';
    const existingSuperAdmin = await User.findOne({ email: superAdminEmail });
    
    if (!existingSuperAdmin) {
      const hashedPassword = await bcrypt.hash('superadmin123', 12);
      
      const superAdmin = new User({
        email: superAdminEmail,
        password: hashedPassword,
        userType: 'superadmin',
        fullName: 'Super Administrator',
        phoneNumber: 'N/A',
        licenseNumber: 'SUPERADMIN'
      });
      
      await superAdmin.save();
      console.log('✅ SuperAdmin account created:');
      console.log('   Email: admin@joyverse.com');
      console.log('   Password: superadmin123');
    } else {
      console.log('✅ SuperAdmin account already exists');
    }
  } catch (error) {
    console.error('❌ Error creating SuperAdmin account:', error);
  }
};

// Initialize server
const startServer = async () => {
  try {
    await seedSuperAdmin();
    
    app.listen(PORT, () => {
      console.log(`🚀 Joyverse API server running on port ${PORT}`);
      console.log(`📝 API Documentation: http://localhost:${PORT}/api/health`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();