// ── controllers/vehicleController.js ─────────────────────────────
'use strict';

const db = require('../db');
const R  = require('../utils/sendResponse');

// ── GET /api/search?type=bus&from=Mumbai&to=Delhi ─────────────────
async function search(req, res) {
  try {
    const url    = new URL(req.url, `http://${req.headers.host}`);
    const type   = (url.searchParams.get('type')  || 'bus').toLowerCase();
    const from   = (url.searchParams.get('from')  || '').trim();
    const to     = (url.searchParams.get('to')    || '').trim();
    const sort   = (url.searchParams.get('sort')  || 'price').toLowerCase();  // price|rating|duration

    if (!from || !to) return R.badReq(res, 'from and to cities are required');

    // Allowed sort columns (whitelist to prevent SQL injection)
    const sortMap = { price: 'v.price', rating: 'v.rating DESC', duration: 'v.duration' };
    const orderBy = sortMap[sort] || 'v.price';

    const [rows] = await db.query(
      `SELECT id, type, name, icon, from_city, to_city,
              departure_time, arrival_time, duration,
              price, seats_available, rating, bus_type, amenities, tag_html
         FROM vehicles v
        WHERE v.type       = ?
          AND LOWER(v.from_city) LIKE ?
          AND LOWER(v.to_city)   LIKE ?
        ORDER BY ${orderBy}`,
      [type, `%${from.toLowerCase()}%`, `%${to.toLowerCase()}%`]
    );

    return R.ok(res, { count: rows.length, vehicles: rows }, 'Search results');
  } catch (err) {
    console.error('[search]', err);
    return R.error(res);
  }
}

// ── GET /api/vehicle?id=1 ─────────────────────────────────────────
async function getVehicle(req, res) {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const id  = parseInt(url.searchParams.get('id') || '0');
    if (!id) return R.badReq(res, 'Vehicle id is required');

    const [rows] = await db.query(
      `SELECT id, type, name, icon, from_city, to_city,
              departure_time, arrival_time, duration,
              price, seats_available, rating, bus_type, amenities, tag_html
         FROM vehicles
        WHERE id = ?`,
      [id]
    );

    if (!rows.length) return R.notFound(res, 'Vehicle not found');

    // Fetch already-booked seat numbers for this vehicle so frontend
    // can mark them as occupied in the seat map.
    const [seatRows] = await db.query(
      `SELECT seat_numbers FROM bookings
        WHERE vehicle_id = ? AND booking_status != 'cancelled'`,
      [id]
    );
    const bookedSeats = seatRows
      .flatMap(r => (r.seat_numbers || '').split(',').map(s => s.trim()))
      .filter(Boolean);

    return R.ok(res, { vehicle: rows[0], bookedSeats }, 'Vehicle details');
  } catch (err) {
    console.error('[getVehicle]', err);
    return R.error(res);
  }
}

module.exports = { search, getVehicle };
