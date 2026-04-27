const { Pool } = require('pg');
require('dotenv').config({ path: './config/.env' });

const pool = new Pool({
  host:     process.env.DB_HOST     || 'localhost',
  port:     parseInt(process.env.DB_PORT) || 5433,
  database: process.env.DB_NAME,
  user:     process.env.DB_USER,
  password:process.env.DB_PASSWORD , // pg requires a string, never undefined/number
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

module.exports = pool;