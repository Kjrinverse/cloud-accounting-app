// Database connection setup
const knex = require('knex');
const config = require('../config/database');

// Get the environment from process.env.NODE_ENV or default to development
const environment = process.env.NODE_ENV || 'development';
const connectionConfig = config[environment];

// Initialize the database connection
const db = knex(connectionConfig);

module.exports = db;
