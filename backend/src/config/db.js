const { Pool } = require("pg");
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });

const pool = new Pool({
  host:                   process.env.DB_HOST     || 'localhost',
  port:                   parseInt(process.env.DB_PORT) || 5433,
  database:               process.env.DB_NAME,
  user:                   process.env.DB_USER,
  password:               process.env.DB_PASSWORD,
  max:                    10,
  idleTimeoutMillis:      30000,
  connectionTimeoutMillis: 2000,
});

// ✅ Check DB connection on startup
pool.connect((err, client, release) => {
  if (err) {
    console.error("❌ DB Connection Error:", err.message);
  } else {
    console.log("✅ PostgreSQL Connected");
    release();
  }
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle DB client', err);
});

module.exports = pool;
