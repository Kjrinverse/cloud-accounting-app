// Database connection setup
const knex = require('knex');
const config = require('../config/database');

// Get the environment from process.env.NODE_ENV or default to development
const environment = process.env.NODE_ENV || 'development';
const connectionConfig = config[environment];

// Initialize the database connection with error handling
let db;
try {
  console.log(`Initializing database connection for environment: ${environment}`);
  console.log(`Database host: ${connectionConfig.connection.host}`);
  console.log(`Database name: ${connectionConfig.connection.database}`);
  console.log(`Pool settings - min: ${connectionConfig.pool.min}, max: ${connectionConfig.pool.max}`);
  
  db = knex(connectionConfig);
  
  // Test the connection
  db.raw('SELECT 1')
    .then(() => {
      console.log('Database connection established successfully');
      
      // Set up connection pool monitoring
      setInterval(() => {
        const pool = db.client.pool;
        if (pool) {
          console.log('Connection pool status:', {
            min: pool.min,
            max: pool.max,
            numUsed: pool.numUsed ? pool.numUsed() : 'N/A',
            numFree: pool.numFree ? pool.numFree() : 'N/A',
            numPendingAcquires: pool.numPendingAcquires ? pool.numPendingAcquires() : 'N/A',
            numPendingCreates: pool.numPendingCreates ? pool.numPendingCreates() : 'N/A'
          });
        }
      }, 60000); // Log every minute
    })
    .catch(err => {
      console.error('Error testing database connection:', err);
    });
} catch (error) {
  console.error('Failed to initialize database connection:', error);
  // Initialize with a dummy connection that will log errors instead of crashing
  db = knex({
    client: 'postgresql',
    connection: () => {
      console.error('Attempted to use database with failed initialization');
      throw new Error('Database connection failed to initialize');
    }
  });
}

// Add event listeners for connection issues
db.on('query-error', (error, query) => {
  console.error('Database query error:', error, query);
});

// Add more event listeners for better monitoring
db.on('query', (query) => {
  if (process.env.NODE_ENV === 'development') {
    console.log('Query executed:', query.sql.substring(0, 100) + (query.sql.length > 100 ? '...' : ''));
  }
});

db.on('query-response', (response, query) => {
  if (process.env.NODE_ENV === 'development') {
    console.log('Query completed:', query.sql.substring(0, 50) + (query.sql.length > 50 ? '...' : ''));
  }
});

// Add connection error event listener
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Check if it's a database connection issue
  if (reason && (reason.code === 'ECONNREFUSED' || reason.message.includes('timeout') || reason.message.includes('pool'))) {
    console.error('Database connection issue detected in unhandled rejection');
  }
});

module.exports = db;

