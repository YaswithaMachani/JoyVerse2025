require('dotenv').config();
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log("✅ Connected to:", mongoose.connection.name);
    console.log("📂 Collections:", Object.keys(mongoose.connection.collections));
    mongoose.disconnect();
  })
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err);
  });
