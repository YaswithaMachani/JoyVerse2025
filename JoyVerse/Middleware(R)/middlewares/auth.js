const jwt = require('jsonwebtoken');
const { JWT_SECRET, USER_TYPES } = require('../config/constants');

exports.authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) return res.status(401).json({ message: 'Access denied. No token provided.' });
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    console.error('Token verification error:', error);
    return res.status(403).json({ message: 'Invalid token.' });
  }
};

exports.authenticateSuperAdmin = (req, res, next) => {
  if (req.user.userType !== USER_TYPES.SUPERADMIN) {
    return res.status(403).json({ message: 'SuperAdmin access required' });
  }
  next();
};

exports.authenticateTherapist = (req, res, next) => {
  if (req.user.userType !== USER_TYPES.THERAPIST) {
    return res.status(403).json({ message: 'Therapist access required' });
  }
  next();
};