const { log } = require('../config/logging');

function runPreflightChecks() {
  const requiredEnvVars = [
    'PULSE_FITNESS_DB_HOST',
    'PULSE_FITNESS_DB_NAME',
    'PULSE_FITNESS_DB_USER',
    'PULSE_FITNESS_DB_PASSWORD',            
    'PULSE_FITNESS_APP_DB_USER',
    'PULSE_FITNESS_APP_DB_PASSWORD',
    'PULSE_FITNESS_FRONTEND_URL',
    'JWT_SECRET',
    'PULSE_FITNESS_API_ENCRYPTION_KEY'
  ];

  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

  if (missingVars.length > 0) {
    const errorMessage = `FATAL: Missing required environment variables: ${missingVars.join(', ')}. Please check your .env file.`;
    log('error', errorMessage);
    throw new Error(errorMessage);
  }

  log('info', 'Environment variable pre-flight checks passed successfully.');
}

module.exports = {
  runPreflightChecks,
};