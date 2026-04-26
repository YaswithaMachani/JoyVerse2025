// Load environment variables
require('dotenv').config();

const mongoose = require('mongoose');
const app = require('./src/app');
const { seedData } = require('./src/utils/seedData');



const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://joyadmin:joy123@joyverse.wh2ssu9.mongodb.net/joyverse?retryWrites=true&w=majority&appName=JoyVerse';

// Connect to MongoDB
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('✅ MongoDB Connected succesfully');
    
    // Seed initial data if needed
    if (process.env.SEED_DATA === 'true') {
      await seedData();
    }
    
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    process.exit(1);
  }
};

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.error('❌ Unhandled Promise Rejection:', err.message);
  // Close server & exit process
  server.close(() => {
    process.exit(1);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err.message);
  process.exit(1);
});

// Graceful shutdown
const gracefulShutdown = (signal) => {
  console.log(`\n📡 Received ${signal}. Shutting down gracefully...`);
  
  server.close(() => {
    console.log('🔒 HTTP server closed');
    
    mongoose.connection.close(false, () => {
      console.log('🔌 MongoDB connection closed');
      process.exit(0);
    });
  });
  
  // Force close server after 10 seconds
  setTimeout(() => {
    console.error('⚠️  Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 10000);
};

// Listen for termination signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Start server
const startServer = async () => {
  try {
    // Connect to database
    await connectDB();
    
    // Start HTTP server
    const server = app.listen(PORT, () => {
      console.log(`🚀 Joyverse API Server running on port ${PORT}`);
      console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🌐 API URL: http://localhost:${PORT}`);
      console.log(`🔍 Health Check: http://localhost:${PORT}/health`);
      console.log(`📚 API Documentation: http://localhost:${PORT}/api/docs`);
      console.log('─'.repeat(50));
    });
    
    // Set server timeout
    server.timeout = 30000; // 30 seconds
    
    // Store server reference for graceful shutdown
    global.server = server;
    
    return server;
    
  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
  }
};

// Start the server
startServer();

module.exports = app;