const bcrypt = require('bcryptjs');
const User = require('../models/User');
const GameScore = require('../models/GameScore');
const Emotion = require('../models/Emotion');

// Seed initial data
const seedData = async () => {
  try {
    console.log('🌱 Starting to seed database...');
    
    // Check if data already exists
    const existingUsers = await User.countDocuments();
    if (existingUsers > 0) {
      console.log('📊 Database already contains data, skipping seed...');
      return;
    }
    
    // Create Super Admin
    const superAdminPassword = await bcrypt.hash('superadmin123', 12);
    const superAdmin = new User({
      username: 'superadmin',
      email: 'admin@joyverse.com',
      password: superAdminPassword,
      role: 'superadmin',
      isActive: true
    });
    await superAdmin.save();
    console.log('✅ Super Admin created');
    
    // Create sample therapists
    const therapists = [
      {
        username: 'therapist1',
        email: 'therapist1@joyverse.com',
        password: await bcrypt.hash('therapist123', 12),
        role: 'therapist',
        isActive: true
      },
      {
        username: 'therapist2',
        email: 'therapist2@joyverse.com',
        password: await bcrypt.hash('therapist123', 12),
        role: 'therapist',
        isActive: true
      }
    ];
    
    const createdTherapists = await User.insertMany(therapists);
    console.log('✅ Sample therapists created');
    
    // Create sample patients
    const patients = [
      {
        username: 'patient1',
        email: 'patient1@example.com',
        password: await bcrypt.hash('patient123', 12),
        role: 'patient',
        isActive: true
      },
      {
        username: 'patient2',
        email: 'patient2@example.com',
        password: await bcrypt.hash('patient123', 12),
        role: 'patient',
        isActive: true
      },
      {
        username: 'patient3',
        email: 'patient3@example.com',
        password: await bcrypt.hash('patient123', 12),
        role: 'patient',
        isActive: true
      }
    ];
    
    const createdPatients = await User.insertMany(patients);
    console.log('✅ Sample patients created');
    
    // Create sample game scores
    const gameScores = [];
    const gameTypes = ['memory', 'attention', 'puzzle', 'reaction'];
    
    for (const patient of createdPatients) {
      for (let i = 0; i < 5; i++) {
        gameScores.push({
          userId: patient._id,
          gameType: gameTypes[Math.floor(Math.random() * gameTypes.length)],
          score: Math.floor(Math.random() * 1000) + 100,
          level: Math.floor(Math.random() * 10) + 1,
          duration: Math.floor(Math.random() * 300) + 60, // 60-360 seconds
          createdAt: new Date(Date.now() - Math.floor(Math.random() * 30 * 24 * 60 * 60 * 1000)) // Random date within last 30 days
        });
      }
    }
    
    await GameScore.insertMany(gameScores);
    console.log('✅ Sample game scores created');
    
    // Create sample emotions
    const emotions = [];
    const emotionTypes = ['happy', 'sad', 'angry', 'anxious', 'excited', 'calm', 'stressed', 'content'];
    
    for (const patient of createdPatients) {
      for (let i = 0; i < 8; i++) {
        emotions.push({
          userId: patient._id,
          emotionType: emotionTypes[Math.floor(Math.random() * emotionTypes.length)],
          intensity: Math.floor(Math.random() * 5) + 1, // 1-5 scale
          description: `Feeling ${emotionTypes[Math.floor(Math.random() * emotionTypes.length)]} today`,
          createdAt: new Date(Date.now() - Math.floor(Math.random() * 30 * 24 * 60 * 60 * 1000)) // Random date within last 30 days
        });
      }
    }
    
    await Emotion.insertMany(emotions);
    console.log('✅ Sample emotions created');
    
    console.log('🎉 Database seeding completed successfully!');
    console.log('📋 Default accounts created:');
    console.log('   Super Admin: admin@joyverse.com / superadmin123');
    console.log('   Therapist 1: therapist1@joyverse.com / therapist123');
    console.log('   Therapist 2: therapist2@joyverse.com / therapist123');
    console.log('   Patient 1: patient1@example.com / patient123');
    console.log('   Patient 2: patient2@example.com / patient123');
    console.log('   Patient 3: patient3@example.com / patient123');
    
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  }
};

// Clear all data (use with caution)
const clearData = async () => {
  try {
    console.log('🧹 Clearing all data...');
    
    await User.deleteMany({});
    await GameScore.deleteMany({});
    await Emotion.deleteMany({});
    
    console.log('✅ All data cleared successfully');
  } catch (error) {
    console.error('❌ Error clearing data:', error);
    throw error;
  }
};

// Generate random test data
const generateTestData = async (userCount = 10) => {
  try {
    console.log(`🎲 Generating ${userCount} test users with random data...`);
    
    const users = [];
    const gameScores = [];
    const emotions = [];
    
    // Generate test users
    for (let i = 0; i < userCount; i++) {
      const hashedPassword = await bcrypt.hash('testuser123', 12);
      const user = {
        username: `testuser${i + 1}`,
        email: `testuser${i + 1}@example.com`,
        password: hashedPassword,
        role: Math.random() > 0.7 ? 'therapist' : 'patient',
        isActive: Math.random() > 0.1 // 90% active users
      };
      users.push(user);
    }
    
    const createdUsers = await User.insertMany(users);
    
    // Generate random game scores for each user
    const gameTypes = ['memory', 'attention', 'puzzle', 'reaction', 'coordination'];
    
    for (const user of createdUsers) {
      if (user.role === 'patient') {
        const gameCount = Math.floor(Math.random() * 20) + 5; // 5-25 games per user
        
        for (let i = 0; i < gameCount; i++) {
          gameScores.push({
            userId: user._id,
            gameType: gameTypes[Math.floor(Math.random() * gameTypes.length)],
            score: Math.floor(Math.random() * 2000) + 100,
            level: Math.floor(Math.random() * 15) + 1,
            duration: Math.floor(Math.random() * 600) + 30,
            createdAt: new Date(Date.now() - Math.floor(Math.random() * 90 * 24 * 60 * 60 * 1000))
          });
        }
      }
    }
    
    await GameScore.insertMany(gameScores);
    
    // Generate random emotions
    const emotionTypes = ['happy', 'sad', 'angry', 'anxious', 'excited', 'calm', 'stressed', 'content', 'frustrated', 'motivated'];
    
    for (const user of createdUsers) {
      if (user.role === 'patient') {
        const emotionCount = Math.floor(Math.random() * 30) + 10; // 10-40 emotions per user
        
        for (let i = 0; i < emotionCount; i++) {
          emotions.push({
            userId: user._id,
            emotionType: emotionTypes[Math.floor(Math.random() * emotionTypes.length)],
            intensity: Math.floor(Math.random() * 5) + 1,
            description: `Random emotion entry ${i + 1}`,
            createdAt: new Date(Date.now() - Math.floor(Math.random() * 90 * 24 * 60 * 60 * 1000))
          });
        }
      }
    }
    
    await Emotion.insertMany(emotions);
    
    console.log(`✅ Generated ${userCount} test users with random data`);
    console.log(`📊 Created ${gameScores.length} game scores and ${emotions.length} emotion entries`);
    
  } catch (error) {
    console.error('❌ Error generating test data:', error);
    throw error;
  }
};

module.exports = {
  seedData,
  clearData,
  generateTestData
};