// Environment variable validation
const requiredVars = [
  'DB_HOST',
  'DB_NAME',
  'DB_USER',
  'DB_PASSWORD',
  'JWT_SECRET',
  // Add JWT_REFRESH_SECRET to required variables
  // or comment it out if you're using the fallback approach
  // 'JWT_REFRESH_SECRET'
];

// Add additional validation for related variables
function validateEnv() {
  const missing = [];
  
  for (const varName of requiredVars) {
    if (!process.env[varName]) {
      missing.push(varName);
    }
  }
  
  // Check for JWT_REFRESH_SECRET and warn if missing
  if (!process.env.JWT_REFRESH_SECRET && process.env.JWT_SECRET) {
    console.warn('WARNING: JWT_REFRESH_SECRET not set, using JWT_SECRET as fallback');
  }
  
  if (missing.length > 0) {
    console.error('ERROR: Missing required environment variables:', missing.join(', '));
    console.error('Application may not function correctly without these variables.');
    return false;
  }
  
  console.log('All required environment variables are set');
  return true;
}

function validateEnv() {
  const missing = [];
  
  for (const varName of requiredVars) {
    if (!process.env[varName]) {
      missing.push(varName);
    }
  }
  
  if (missing.length > 0) {
    console.error('ERROR: Missing required environment variables:', missing.join(', '));
    console.error('Application may not function correctly without these variables.');
    return false;
  }
  
  console.log('All required environment variables are set');
  return true;
}

module.exports = validateEnv;
