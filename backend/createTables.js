require('dotenv').config();
const pool = require('./db');

async function init() {
  try {
    if (process.env.USE_POSTGIS === 'true') {
      await pool.query('CREATE EXTENSION IF NOT EXISTS postgis;');
      await pool.query(`
        CREATE TABLE IF NOT EXISTS points (
          id SERIAL PRIMARY KEY,
          geom geography(Point,4326) NOT NULL,
          intensity DOUBLE PRECISION DEFAULT 1,
          created_at TIMESTAMPTZ DEFAULT now()
        );
      `);
    } else {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS points (
          id SERIAL PRIMARY KEY,
          lat DOUBLE PRECISION NOT NULL,
          lng DOUBLE PRECISION NOT NULL,
          intensity DOUBLE PRECISION DEFAULT 1,
          created_at TIMESTAMPTZ DEFAULT now()
        );
      `);
    }
    console.log("Tables ready");
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}

init();
