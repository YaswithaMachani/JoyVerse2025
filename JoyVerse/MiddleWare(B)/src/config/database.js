require('dotenv').config(); // Load .env BEFORE anything else
const mongoose = require('mongoose');



// MongoDB Connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb+srv://joyadmin:joy123@joyverse.wh2ssu9.mongodb.net/joyverse?retryWrites=true&w=majority&appName=JoyVerse');
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

module.exports = connectDB;