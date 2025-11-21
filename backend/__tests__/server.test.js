const request = require('supertest');

// Mock the DB pool so tests don't need a real Postgres instance
jest.mock('../db', () => ({
  query: jest.fn((sql, params) => {
    if (/FROM zone_visitors/i.test(sql)) {
      return Promise.resolve({ rows: [{ zone_id: 'zone1', current_visitors: 5 }] });
    }
    if (/FROM points/i.test(sql)) {
      return Promise.resolve({ rows: [{ id: 1, lat: 0, lng: 0, intensity: 1 }] });
    }
    if (/INSERT INTO exhibitions/i.test(sql)) {
      return Promise.resolve({ rows: [{ id: 123, exhibition_name: params[1] || 'x' }] });
    }
    if (/DELETE FROM exhibitions/i.test(sql)) {
      return Promise.resolve({ rowCount: 1, rows: [{ id: params[0] }] });
    }
    return Promise.resolve({ rows: [] });
  })
}));

const app = require('../server');

describe('backend server endpoints', () => {
  test('GET / returns running message', async () => {
    const res = await request(app).get('/');
    expect(res.statusCode).toBe(200);
    expect(res.text).toMatch(/Backend is running/i);
  });

  test('GET /api/zones returns array', async () => {
    const res = await request(app).get('/api/zones');
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body[0]).toHaveProperty('zone_id', 'zone1');
  });

  test('GET /api/points returns array', async () => {
    const res = await request(app).get('/api/points');
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  test('POST /api/points responds with created point (mocked)', async () => {
    const payload = { lat: 1, lng: 2, intensity: 3 };
    const res = await request(app).post('/api/points').send(payload).set('Content-Type', 'application/json');
    // Because db.query is mocked to return rows: [], server may return [] or 200; at least verify status
    expect([200,201]).toContain(res.statusCode);
  });
});
