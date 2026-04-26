const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config/jwt');

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// Middleware to verify SuperAdmin access
const authenticateSuperAdmin = (req, res, next) => {
  if (req.user.userType !== 'superadmin' && req.user.role !== 'superadmin') {
    return res.status(403).json({ message: 'SuperAdmin access required' });
  }
  next();
};

module.exports = {
  authenticateToken,
  authenticateSuperAdmin
};