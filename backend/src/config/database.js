// Database Configuration
module.exports = {
  development: {
    client: 'postgresql',
    connection: {
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      database: process.env.DB_NAME || 'defaultdb',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres'
    },
    pool: {
      min: 2,
      max: 10
    },
    migrations: {
      tableName: 'knex_migrations',
      directory: '../migrations'
    },
    seeds: {
      directory: '../seeds'
    }
  },
  
  test: {
    client: 'postgresql',
    connection: {
      host: process.env.TEST_DB_HOST || 'localhost',
      port: process.env.TEST_DB_PORT || 5432,
      database: process.env.TEST_DB_NAME || 'cloud_accounting_test',
      user: process.env.TEST_DB_USER || 'postgres',
      password: process.env.TEST_DB_PASSWORD || 'postgres'
    },
    pool: {
      min: 2,
      max: 10
    },
    migrations: {
      tableName: 'knex_migrations',
      directory: '../migrations'
    },
    seeds: {
      directory: '../seeds'
    }
  },
  
production: {
  client: 'postgresql',
  connection: {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
    connectionTimeout: 60000,
    statement_timeout: 30000,
    acquireConnectionTimeout: 120000 // 2 minutes
  },
  pool: {
    min: 0,
    max: 3, // Reduced from 5
    acquireTimeoutMillis: 60000,
    createTimeoutMillis: 60000,
    idleTimeoutMillis: 30000,
    reapIntervalMillis: 1000,
    createRetryIntervalMillis: 100,
    propagateCreateError: false,
    // Add afterCreate hook for connection validation
    afterCreate: function(conn, done) {
      // In this example we use pg driver's connection API
      conn.query('SELECT 1', function(err) {
        if (err) {
          // Connection is bad, remove it from the pool
          console.error('Error during connection validation:', err);
          done(err, conn);
        } else {
          // Connection is good, make it available
          console.log('New database connection validated successfully');
          done(null, conn);
        }
      });
    }
  },
  migrations: {
    tableName: 'knex_migrations',
    directory: '../migrations'
  },
  debug: process.env.NODE_ENV === 'development'
}
