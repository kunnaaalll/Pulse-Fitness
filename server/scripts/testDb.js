const { Client } = require('pg');

async function testConnection(password) {
  const client = new Client({
    user: 'postgres',
    host: 'localhost',
    database: 'sparkyfitness',
    password: password,
    port: 5432,
  });
  try {
    await client.connect();
    console.log(`SUCCESS: Connected with password: '${password}'`);
    await client.end();
    return true;
  } catch (err) {
    console.log(`FAILED: Password '${password}' - ${err.message}`);
    // console.log(err); 
    return false;
  }
}

async function run() {
  const passwords = ['password', 'postgres', '', 'admin', '123456', 'root', 'sparkyfitness'];
  for (const p of passwords) {
    if (await testConnection(p)) {
      console.log(`FOUND WORKING PASSWORD: '${p}'`);
      process.exit(0);
    }
  }
  process.exit(1);
}

run();
