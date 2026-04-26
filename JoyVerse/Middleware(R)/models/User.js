const mongoose = require('mongoose');
const { USER_TYPES } = require('../config/constants');

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
    enum: Object.values(USER_TYPES)
  },
  fullName: {
    type: String,
    required: function() { return this.userType === USER_TYPES.THERAPIST; }
  },
  phoneNumber: {
    type: String,
    required: function() { return this.userType === USER_TYPES.THERAPIST; }
  },
  licenseNumber: {
    type: String,
    required: function() { return this.userType === USER_TYPES.THERAPIST; }
  },
  childName: {
    type: String,
    required: function() { return this.userType === USER_TYPES.CHILD; }
  },
  age: {
    type: Number,
    required: function() { return this.userType === USER_TYPES.CHILD; }
  },
  parentEmail: {
    type: String,
    required: function() { return this.userType === USER_TYPES.CHILD; }
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
  }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);