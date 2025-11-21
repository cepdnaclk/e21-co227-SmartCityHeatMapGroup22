require('dotenv').config();
const express = require('express');
const cors = require('cors');
const pool = require('./db');

const app = express();
app.use(cors());
app.use(express.json());
// Zone info API handlers (use separate DB pool inside the module)
const zoneInfoAPI = require('./zoneInfoAPI');
// register explicit routes for GET and POST after express.json() middleware is applied
app.get('/api/zone-info/:zoneName', zoneInfoAPI.getHandler);
app.post('/api/zone-info/:zoneName', zoneInfoAPI.postHandler);
// Add single exhibit to a zone
app.post('/api/zone-info/:zoneName/exhibit', zoneInfoAPI.addHandler);
// Delete single exhibit from a zone
app.delete('/api/zone-info/:zoneName/exhibit/:id', zoneInfoAPI.deleteHandler);
// Gemini proxy (search) - routes: POST /api/search-zone
const geminiProxy = require('./geminiProxy');
app.use('/api', geminiProxy);

// simple test route
app.get('/', (req, res) => {
  res.send('Backend is running!');
});

// fetch all points
app.get('/api/points', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM points');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// add new point
app.post('/api/points', async (req, res) => {
  const { lat, lng, intensity } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO points (lat, lng, intensity) VALUES ($1, $2, $3) RETURNING *',
      [lat, lng, intensity || 1]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// =============================
// 🔹 NEW ZONES API
// =============================

// Get all zone visitor counts
app.get('/api/zones', async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT 
        zone AS zone_id, 
        visitors AS current_visitors 
      FROM zone_visitors
    `);
    res.json(rows);
  } catch (err) {
    console.error("❌ DB Error:", err);
    res.status(500).json({ error: 'Database error' });
  }
});


// Update a specific zone’s visitor count
app.post('/api/zones/:zoneId', async (req, res) => {
  const { zoneId } = req.params;
  const { visitors } = req.body;
  try {
    await pool.query(
      `UPDATE zone_visitors 
       SET visitors = $1 
       WHERE zone_id = $2`,
      [visitors, zoneId]
    );
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});


const port = process.env.PORT || 2000;

// Export app for testing. Only start listening when run directly.
if (require.main === module) {
  app.listen(port, () => console.log(`Backend running on port ${port}`));
}

module.exports = app;
