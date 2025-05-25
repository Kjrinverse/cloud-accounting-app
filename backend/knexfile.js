// Update it to include these additional settings
module.exports = {
  client: 'pg',
  connection: {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 5432,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl: process.env.DB_SSL === 'true' ? true : false,
    // Add connection timeout
    connectionTimeout: 60000
  },
  pool: {
    min: 0,  // Reduce minimum connections
    max: 7,  // Reduce maximum connections
    acquireTimeoutMillis: 60000,  // Increase timeout to 60 seconds
    createTimeoutMillis: 60000,
    idleTimeoutMillis: 60000,
    reapIntervalMillis: 1000,
    createRetryIntervalMillis: 100
  }
};
