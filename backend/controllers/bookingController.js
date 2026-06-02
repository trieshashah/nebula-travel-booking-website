// ── controllers/bookingController.js ─────────────────────────────
'use strict';

const crypto = require('crypto');
const db     = require('../db');
const parse  = require('../utils/parseBody');
const R      = require('../utils/sendResponse');
const { getUserFromToken, getTokenFromHeader } = require('./authController');

// ── Generate PNR ──────────────────────────────────────────────────
function generatePNR() {
  return 'NEB' + crypto.randomBytes(4).toString('hex').toUpperCase(); // e.g. NEB3A7F2C1E
}

// ── POST /api/book ────────────────────────────────────────────────
async function createBooking(req, res) {
  const conn = await db.getConnection();
  try {
    const token = getTokenFromHeader(req);
    const user  = await getUserFromToken(token);
    if (!user) return R.unauth(res, 'Please login to book');

    const body = await parse(req);
    const {
      vehicle_id,
      passenger_name,
      passenger_age,
      passenger_gender,
      passenger_email,
      passenger_phone,
      seat_numbers,          // "A1,A2"
      boarding_point,
      payment_method
    } = body;

    // ── Validation ────────────────────────────────────────────────
    if (!vehicle_id)      return R.badReq(res, 'vehicle_id is required');
    if (!passenger_name)  return R.badReq(res, 'passenger_name is required');
    if (!seat_numbers)    return R.badReq(res, 'seat_numbers is required');

    const seatList = seat_numbers.split(',').map(s => s.trim()).filter(Boolean);
    if (!seatList.length || seatList.length > 6)
      return R.badReq(res, 'Select between 1 and 6 seats');

    await conn.beginTransaction();

    // ── Lock the vehicle row ──────────────────────────────────────
    const [[vehicle]] = await conn.query(
      'SELECT id, price, seats_available FROM vehicles WHERE id = ? FOR UPDATE',
      [vehicle_id]
    );
    if (!vehicle) { await conn.rollback(); return R.notFound(res, 'Vehicle not found'); }
    if (vehicle.seats_available < seatList.length) {
      await conn.rollback();
      return R.badReq(res, `Only ${vehicle.seats_available} seats available`);
    }

    // ── Check if any requested seat is already booked ─────────────
    const [takenRows] = await conn.query(
      `SELECT seat_numbers FROM bookings
        WHERE vehicle_id = ? AND booking_status != 'cancelled'`,
      [vehicle_id]
    );
    const takenSeats = takenRows
      .flatMap(r => (r.seat_numbers || '').split(',').map(s => s.trim()))
      .filter(Boolean);
    const conflict = seatList.filter(s => takenSeats.includes(s));
    if (conflict.length) {
      await conn.rollback();
      return R.conflict(res, `Seat(s) already booked: ${conflict.join(', ')}`);
    }

    // ── Calculate price ───────────────────────────────────────────
    const subtotal    = vehicle.price * seatList.length;
    const gst         = Math.round(subtotal * 0.05);
    const total_price = subtotal + gst;

    // ── Insert booking ────────────────────────────────────────────
    const pnr = generatePNR();
    await conn.query(
      `INSERT INTO bookings
         (user_id, vehicle_id, pnr, passenger_name, passenger_age,
          passenger_gender, passenger_email, passenger_phone,
          seat_numbers, boarding_point, payment_method, total_price, booking_status)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        user.id, vehicle_id, pnr,
        passenger_name, passenger_age || null, passenger_gender || null,
        passenger_email || null, passenger_phone || null,
        seatList.join(','), boarding_point || null,
        payment_method || 'upi', total_price, 'confirmed'
      ]
    );

    // ── Decrement available seats ─────────────────────────────────
    await conn.query(
      'UPDATE vehicles SET seats_available = seats_available - ? WHERE id = ?',
      [seatList.length, vehicle_id]
    );

    await conn.commit();

    return R.created(res,
      { pnr, total_price, seat_numbers: seatList.join(',') },
      'Booking confirmed!'
    );
  } catch (err) {
    await conn.rollback();
    console.error('[createBooking]', err);
    return R.error(res, 'Booking failed. Please try again.');
  } finally {
    conn.release();
  }
}

// ── GET /api/my-bookings ──────────────────────────────────────────
async function myBookings(req, res) {
  try {
    const token = getTokenFromHeader(req);
    const user  = await getUserFromToken(token);
    if (!user) return R.unauth(res, 'Please login to view bookings');

    const [rows] = await db.query(
      `SELECT b.id, b.pnr, b.passenger_name, b.passenger_age, b.passenger_gender,
              b.seat_numbers, b.boarding_point, b.payment_method,
              b.total_price, b.booking_status, b.created_at,
              v.name   AS vehicle_name,  v.type  AS vehicle_type,
              v.icon   AS vehicle_icon,
              v.from_city, v.to_city,
              v.departure_time, v.arrival_time, v.duration
         FROM bookings b
         JOIN vehicles v ON v.id = b.vehicle_id
        WHERE b.user_id = ?
        ORDER BY b.created_at DESC`,
      [user.id]
    );

    return R.ok(res, { count: rows.length, bookings: rows }, 'My bookings');
  } catch (err) {
    console.error('[myBookings]', err);
    return R.error(res);
  }
}

// ── GET /api/pnr?pnr=NEB123456 ───────────────────────────────────
async function getPNR(req, res) {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const pnr = (url.searchParams.get('pnr') || '').trim().toUpperCase();
    if (!pnr) return R.badReq(res, 'PNR is required');

    const [rows] = await db.query(
      `SELECT b.pnr, b.passenger_name, b.seat_numbers,
              b.boarding_point, b.total_price, b.booking_status, b.created_at,
              v.name AS vehicle_name, v.type AS vehicle_type, v.icon,
              v.from_city, v.to_city, v.departure_time, v.arrival_time, v.duration
         FROM bookings b
         JOIN vehicles v ON v.id = b.vehicle_id
        WHERE b.pnr = ?
        LIMIT 1`,
      [pnr]
    );
    if (!rows.length) return R.notFound(res, `No booking found for PNR: ${pnr}`);

    return R.ok(res, rows[0], 'PNR found');
  } catch (err) {
    console.error('[getPNR]', err);
    return R.error(res);
  }
}

// ── POST /api/cancel ─────────────────────────────────────────────
async function cancelBooking(req, res) {
  const conn = await db.getConnection();
  try {
    const token = getTokenFromHeader(req);
    const user  = await getUserFromToken(token);
    if (!user) return R.unauth(res, 'Please login');

    const { pnr } = await parse(req);
    if (!pnr) return R.badReq(res, 'PNR is required');

    await conn.beginTransaction();

    const [rows] = await conn.query(
      'SELECT id, vehicle_id, seat_numbers, booking_status FROM bookings WHERE pnr = ? AND user_id = ? FOR UPDATE',
      [pnr.toUpperCase(), user.id]
    );
    const booking = rows[0];
    if (!booking)           { await conn.rollback(); return R.notFound(res, 'Booking not found'); }
    if (booking.booking_status === 'cancelled') {
      await conn.rollback(); return R.conflict(res, 'Booking already cancelled');
    }

    const seatCount = (booking.seat_numbers || '').split(',').filter(Boolean).length;

    // Update booking status
    await conn.query(
      "UPDATE bookings SET booking_status = 'cancelled' WHERE id = ?",
      [booking.id]
    );

    // Restore seats
    await conn.query(
      'UPDATE vehicles SET seats_available = seats_available + ? WHERE id = ?',
      [seatCount, booking.vehicle_id]
    );

    await conn.commit();
    return R.ok(res, { pnr }, 'Booking cancelled successfully');
  } catch (err) {
    await conn.rollback();
    console.error('[cancelBooking]', err);
    return R.error(res, 'Cancellation failed');
  } finally {
    conn.release();
  }
}

module.exports = { createBooking, myBookings, getPNR, cancelBooking };
