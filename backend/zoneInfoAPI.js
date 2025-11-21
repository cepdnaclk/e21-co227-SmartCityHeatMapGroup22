require('dotenv').config();
const { Pool } = require('pg');

// Use a separate DB connection string (LOCAL_DB_URL) for the zone info feature
const connectionString = process.env.LOCAL_DB_URL || process.env.DATABASE_URL;

const pool = new Pool({ connectionString });

pool.on('error', (err) => {
  console.error('Unexpected error on zoneInfo pool', err);
});

// Handler: GET /api/zone-info/:zoneName
// Returns { zone, exhibitions: [] }
async function getZoneInfoHandler(req, res) {
  const { zoneName } = req.params;
  if (!zoneName) return res.status(400).json({ error: 'Zone name is required' });

  try {
    // Return id and exhibition_name so the frontend can support deletion by id
    const exResult = await pool.query('SELECT id, exhibition_name FROM exhibitions WHERE zone = $1 ORDER BY id', [zoneName]);
    const exhibitions = exResult.rows.map((r) => ({ id: r.id, exhibition_name: r.exhibition_name }));

    // Always return zone + exhibitions array (may be empty)
    return res.json({ zone: zoneName, exhibitions });
  } catch (err) {
    console.error('Error in getZoneInfoHandler for', zoneName, err);
    return res.status(500).json({ error: 'Database connection or query failed' });
  }
}

// Handler: POST /api/zone-info/:zoneName
// Body should contain { exhibitions: [<string>] }
async function postZoneInfoHandler(req, res) {
  const { zoneName } = req.params;
  const { exhibitions } = req.body || {};

  if (!zoneName) return res.status(400).json({ error: 'Zone name is required' });
  if (!Array.isArray(exhibitions)) {
    return res.status(400).json({ error: 'exhibitions array must be provided' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Replace exhibitions for the zone
    await client.query('DELETE FROM exhibitions WHERE zone = $1', [zoneName]);
    if (exhibitions.length > 0) {
      const insertText = 'INSERT INTO exhibitions(zone, exhibition_name) VALUES ' +
        exhibitions.map((_, i) => `($1, $${i + 2})`).join(', ');
      const params = [zoneName, ...exhibitions];
      await client.query(insertText, params);
    }

    await client.query('COMMIT');

  const exResult = await pool.query('SELECT id, exhibition_name FROM exhibitions WHERE zone = $1 ORDER BY id', [zoneName]);
  const exhibitionsVal = exResult.rows.map((r) => ({ id: r.id, exhibition_name: r.exhibition_name }));

    return res.json({ zone: zoneName, exhibitions: exhibitionsVal });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error in postZoneInfoHandler for', zoneName, err);
    return res.status(500).json({ error: 'Database connection or transaction failed' });
  } finally {
    client.release();
  }
}


// Handler: POST /api/zone-info/:zoneName/exhibit
// Body: { exhibitName: string }
async function addExhibitHandler(req, res) {
  const { zoneName } = req.params;
  const { exhibitName } = req.body || {};

  if (!zoneName) return res.status(400).json({ error: 'Zone name is required' });
  if (!exhibitName || typeof exhibitName !== 'string' || exhibitName.trim() === '') {
    return res.status(400).json({ error: 'exhibitName is required' });
  }

  try {
    console.log(`addExhibitHandler: inserting exhibit for zone=${zoneName} name=${exhibitName}`);
    const insert = await pool.query(
      'INSERT INTO exhibitions(zone, exhibition_name) VALUES ($1, $2) RETURNING id, exhibition_name',
      [zoneName, exhibitName.trim()]
    );
    console.log('addExhibitHandler: insert result', insert.rows[0]);

    return res.json({ success: true, exhibition: insert.rows[0] });
  } catch (err) {
    console.error('Error in addExhibitHandler for', zoneName, err);
    return res.status(500).json({ error: 'Database insert failed' });
  }
}


// Handler: DELETE /api/zone-info/:zoneName/exhibit/:id
// Deletes the exhibition by id (and ensures it belongs to the given zone)
async function deleteExhibitHandler(req, res) {
  const { zoneName, id } = req.params;
  if (!zoneName) return res.status(400).json({ error: 'Zone name is required' });
  if (!id) return res.status(400).json({ error: 'Exhibit id is required' });

  try {
    // Ensure the record belongs to the zone, then delete
    console.log(`deleteExhibitHandler: deleting exhibit id=${id} for zone=${zoneName}`);
    const del = await pool.query('DELETE FROM exhibitions WHERE id = $1 AND zone = $2 RETURNING id', [id, zoneName]);
    console.log('deleteExhibitHandler: delete result rowCount=', del.rowCount);
    if (del.rowCount === 0) {
      return res.status(404).json({ error: 'Exhibit not found for this zone' });
    }
    return res.json({ success: true, deletedId: del.rows[0].id });
  } catch (err) {
    console.error('Error deleting exhibit', err);
    return res.status(500).json({ error: 'Database delete failed' });
  }
}

// re-export including delete handler
module.exports = {
  getHandler: getZoneInfoHandler,
  postHandler: postZoneInfoHandler,
  addHandler: addExhibitHandler,
  deleteHandler: deleteExhibitHandler
};

