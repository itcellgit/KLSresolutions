// db.js
const { Pool } = require("pg");
require("dotenv").config(); // Load environment variables

const pool = new Pool({
  user: process.env.PG_USER || postgres,
  host: process.env.PG_HOST || localhost,
  database: process.env.PG_DATABASE || resolutions,
  password: process.env.PG_PASSWORD || 'niraj2002@',
  port: process.env.PG_PORT || 5432,
});

// Optional: Test the connection when the app starts
pool.connect((err, client, done) => {
  if (err) {
    console.error("Database connection failed", err.stack);
  } else {
    console.log("Connected to the PostgreSQL database!");
  }
  if (client) {
    done();
  }
});

module.exports = {
  query: (text, params) => pool.query(text, params),
};
