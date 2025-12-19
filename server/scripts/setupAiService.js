require('dotenv').config({ path: '../.env' });
const { Pool } = require('pg');
const { log } = require('../config/logging');

// Manually defining db config since we are running as a script
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'pulse_db',
  password: 'ROOT',
  port: 5432,
});

const PERPLEXITY_KEY = process.env.PERPLEXITY_KEY || 'your_perplexity_key_here';
const ADMIN_EMAIL = 'admin@example.com';
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcrypt'); // Using bcrypt as per package.json

// Set env vars for encryption module
process.env.SPARKY_FITNESS_API_ENCRYPTION_KEY = process.env.SPARKY_FITNESS_API_ENCRYPTION_KEY || 'your_encryption_key_here';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_here';

const { encrypt, ENCRYPTION_KEY } = require('../security/encryption');

async function seedAiService() {
  const client = await pool.connect();
  try {
    console.log(`Searching for user: ${ADMIN_EMAIL}`);
    const userRes = await client.query('SELECT id FROM auth.users WHERE email = $1', [ADMIN_EMAIL]);
    
    let userId;

    if (userRes.rows.length === 0) {
        // ... (existing user creation code) ...
        // Replicating creation logic here because previous replacement might have cutoff context if I don't include it
        // actually I will just assume the user exists now because the previous run created it.
        // But to be safe in this "replacement", I should preserve the user finding logic logic.
        // The user WAS created in the previous run (fbff97ba...).
        // So I will just focus on the Service insertion part.
       console.log('Admin user not found. Creating new admin user...');
       userId = uuidv4();
       const passwordHash = await bcrypt.hash('password', 10);
       await client.query('BEGIN');
       await client.query('INSERT INTO auth.users (id, email, password_hash, role, created_at, updated_at) VALUES ($1, $2, $3, $4, now(), now())', [userId, ADMIN_EMAIL, passwordHash, 'admin']);
       await client.query('INSERT INTO profiles (id, full_name, created_at, updated_at) VALUES ($1, $2, now(), now())', [userId, 'Admin User']);
       await client.query('INSERT INTO user_goals (user_id, created_at, updated_at) VALUES ($1, now(), now())', [userId]);
       await client.query('COMMIT');
       console.log(`Created new user with ID: ${userId} and password "password"`);
    } else {
        userId = userRes.rows[0].id;
        console.log(`Found Existing User ID: ${userId}`);
    }

    // Encrypt the key using the app's encryption module
    console.log('Encrypting API Key...');
    const { encryptedText, iv, tag } = await encrypt(PERPLEXITY_KEY, ENCRYPTION_KEY);
    
    const serviceData = {
      user_id: userId,
      service_name: 'Perplexity AI (Default)',
      service_type: 'perplexity',
      custom_url: '',
      encrypted_api_key: encryptedText,
      api_key_iv: iv,
      api_key_tag: tag,
      is_active: true,
      model_name: 'sonar-pro',
      system_prompt: 'You are Pulse, an AI fitness companion. You are helpful, motivating, and concise.',
      created_at: new Date(),
      updated_at: new Date()
    };

    // Check for existing service
    const existingServiceRes = await client.query(
        'SELECT id FROM ai_service_settings WHERE user_id = $1 AND service_name = $2',
        [userId, serviceData.service_name]
    );

    let res;
    if (existingServiceRes.rows.length > 0) {
        // Update existing
        const existingId = existingServiceRes.rows[0].id;
        console.log(`Updating existing service with ID: ${existingId}`);
        const updateQuery = `
            UPDATE ai_service_settings SET
            service_type = $1, custom_url = $2, encrypted_api_key = $3, api_key_iv = $4, api_key_tag = $5,
            is_active = $6, model_name = $7, system_prompt = $8, updated_at = NOW()
            WHERE id = $9
            RETURNING id;
        `;
        res = await client.query(updateQuery, [
            serviceData.service_type, serviceData.custom_url, serviceData.encrypted_api_key,
            serviceData.api_key_iv, serviceData.api_key_tag, serviceData.is_active,
            serviceData.model_name, serviceData.system_prompt, existingId
        ]);
    } else {
        // Insert new
        const insertQuery = `
          INSERT INTO ai_service_settings 
          (user_id, service_name, service_type, custom_url, encrypted_api_key, api_key_iv, api_key_tag, is_active, model_name, system_prompt, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
          RETURNING id;
        `;
        res = await client.query(insertQuery, [
          serviceData.user_id,
          serviceData.service_name,
          serviceData.service_type,
          serviceData.custom_url,
          serviceData.encrypted_api_key,
          serviceData.api_key_iv,
          serviceData.api_key_tag,
          serviceData.is_active,
          serviceData.model_name,
          serviceData.system_prompt,
          serviceData.created_at,
          serviceData.updated_at
        ]);
    }

    console.log(`Successfully configured AI Service. ID: ${res.rows[0].id}`);

  } catch (err) {
    if (client) await client.query('ROLLBACK');
    console.error('Error seeding AI service:', err);
  } finally {
    client.release();
    pool.end();
  }
}

seedAiService();
