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

module.exports = pool;
