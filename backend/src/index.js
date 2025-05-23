const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Import routes (to be created)
const authRoutes = require('./routes/auth.routes');
const organizationRoutes = require('./routes/organization.routes');
const accountRoutes = require('./routes/account.routes');
const journalEntryRoutes = require('./routes/journalEntry.routes');
const generalLedgerRoutes = require('./routes/generalLedger.routes');
const reportRoutes = require('./routes/report.routes');

// Create Express app
const app = express();

// Middleware
app.use(helmet()); // Security headers
app.use(cors({
  origin: [
    'https://kjjicorx.manus.space', 
    'http://localhost:3001',
    'https://cloud-accounting-app-frontend-hkauh.ondigitalocean.app'  // Add this line
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
} )); // Enable CORS with specific origins
app.use(express.json()); // Parse JSON bodies
app.use(morgan('dev')); // HTTP request logging

// API routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/organizations', organizationRoutes);
app.use('/api/v1/organizations/:orgId/accounts', accountRoutes);
app.use('/api/v1/organizations/:orgId/journal-entries', journalEntryRoutes);
app.use('/api/v1/organizations/:orgId/general-ledger', generalLedgerRoutes);
app.use('/api/v1/organizations/:orgId/reports', reportRoutes);

// Root route
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to the Cloud Accounting API',
    version: '1.0.0',
    documentation: '/api-docs'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  
  const statusCode = err.statusCode || 500;
  const errorResponse = {
    success: false,
    error: {
      code: err.code || 'INTERNAL_SERVER_ERROR',
      message: err.message || 'An unexpected error occurred',
      details: err.details || null
    }
  };
  
  res.status(statusCode).json(errorResponse);
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;
