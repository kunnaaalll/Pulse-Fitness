const { getSystemClient } = require('./poolManager');
const { log } = require('../config/logging');

async function grantPermissions() {
  const maxRetries = 3;
  let attempts = 0;
  
  while (attempts < maxRetries) {
    const client = await getSystemClient();
    const appUser = process.env.SPARKY_FITNESS_APP_DB_USER;
    
    try {
      log('info', `Ensuring permissions for role: ${appUser} (Attempt ${attempts + 1}/${maxRetries})`);

      // Grant usage on schemas
      await client.query(`GRANT USAGE ON SCHEMA public TO ${appUser}`);
      await client.query(`GRANT USAGE ON SCHEMA auth TO ${appUser}`);
      await client.query(`GRANT USAGE ON SCHEMA system TO ${appUser}`);


      // Grant permissions on all tables in the public schema
      await client.query(`GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO ${appUser}`);
      await client.query(`ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO ${appUser}`);

      // Grant permissions on all sequences in the public schema
      await client.query(`GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO ${appUser}`);
      await client.query(`ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO ${appUser}`);

      // Grant permissions on all tables in the auth schema
      await client.query(`GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA auth TO ${appUser}`);
      await client.query(`ALTER DEFAULT PRIVILEGES IN SCHEMA auth GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO ${appUser}`);
      
      // Grant select on schema_migrations to check applied migrations
      await client.query(`GRANT SELECT ON system.schema_migrations TO ${appUser}`);


      log('info', `Successfully ensured permissions for role: ${appUser}`);
      return; // Success, exit function
    } catch (error) {
      log('warn', `Error granting permissions (Attempt ${attempts + 1}): ${error.message}`);
      attempts++;
      if (attempts >= maxRetries) {
        log('error', 'Max retries reached. Exiting.');
        process.exit(1);
      }
      // Wait a bit before retrying
      await new Promise(resolve => setTimeout(resolve, 1000));
    } finally {
      client.release();
    }
  }
}

module.exports = {
  grantPermissions,
};