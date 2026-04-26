const mongoose = require('mongoose');

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
  },
  isActive: {
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

module.exports = User;