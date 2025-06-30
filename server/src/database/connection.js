const { Pool } = require("pg");

let pool = null;

const createPool = () => {
  return new Pool({
    user: process.env.DB_USER || "postgres",
    host: process.env.DB_HOST || "localhost",
    database: process.env.DB_NAME || "asteroid_simulator",
    password: process.env.DB_PASSWORD || "password",
    port: process.env.DB_PORT || 5432,
    max: 20, // Maximum number of clients in the pool
    idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
    connectionTimeoutMillis: 2000, // Return an error after 2 seconds if connection could not be established
  });
};

const setupDatabase = async () => {
  try {
    pool = createPool();

    // Test the connection
    const client = await pool.connect();
    console.log("✅ PostgreSQL connection successful");

    // Test JSONB functionality
    const result = await client.query("SELECT version()");
    console.log(`📊 PostgreSQL version: ${result.rows[0].version}`);

    client.release();

    return pool;
  } catch (error) {
    console.error("❌ Database connection failed:", error.message);
    throw error;
  }
};

const getPool = () => {
  if (!pool) {
    throw new Error("Database not initialized. Call setupDatabase() first.");
  }
  return pool;
};

const query = async (text, params) => {
  const client = await getPool().connect();
  try {
    const result = await client.query(text, params);
    return result;
  } finally {
    client.release();
  }
};

const closePool = async () => {
  if (pool) {
    await pool.end();
    pool = null;
    console.log("🔌 Database pool closed");
  }
};

module.exports = {
  setupDatabase,
  getPool,
  query,
  closePool,
};
