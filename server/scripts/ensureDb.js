const { Client } = require('pg');

async function createDb() {
  const client = new Client({
    user: 'postgres',
    host: 'localhost',
    database: 'postgres',
    password: 'ROOT',
    port: 5432,
  });

  try {
    await client.connect();
    //Check if db exists
    const res = await client.query("SELECT 1 FROM pg_database WHERE datname = 'pulse_db'");
    if (res.rowCount === 0) {
        console.log("Database 'pulse_db' not found. Creating...");
        await client.query('CREATE DATABASE pulse_db');
        console.log("Database 'pulse_db' created successfully.");
    } else {
        console.log("Database 'pulse_db' already exists.");
    }
    await client.end();
  } catch (err) {
    console.error("Error ensuring database exists:", err);
    await client.end();
    process.exit(1);
  }
}

createDb();
