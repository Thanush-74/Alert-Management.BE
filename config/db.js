const { Pool } = require("pg");

// PostgreSQL connection setup
const pool = new Pool({
  user: "postgres",        // your postgres username
  host: "localhost",
  database: "alert_system", // your database name
  password: "123", // your postgres password
  port: 5432,
});

// test connection
pool.connect((err, client, release) => {
  if (err) {
    console.error("Database connection error:", err.stack);
  } else {
    console.log("PostgreSQL connected successfully");
    release();
  }
});

module.exports = pool;
