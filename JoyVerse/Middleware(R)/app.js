// app.js
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const { notFound, errorHandler } = require('./middlewares/errorHandler');

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Database Connection
connectDB();

// All API Routes are managed inside routes/index.js
const apiRoutes = require('./routes');
app.use('/api', apiRoutes);


// Error Handling
app.use(notFound);       // 404 handler
app.use(errorHandler);   // Generic error handler

module.exports = app;
