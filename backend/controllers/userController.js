// ── controllers/userController.js ────────────────────────────────
'use strict';

const db    = require('../db');
const parse = require('../utils/parseBody');
const R     = require('../utils/sendResponse');
const { getUserFromToken, getTokenFromHeader } = require('./authController');

// ── GET /api/profile ──────────────────────────────────────────────
async function getProfile(req, res) {
  try {
    const token = getTokenFromHeader(req);
    const user  = await getUserFromToken(token);
    if (!user) return R.unauth(res, 'Please login to view your profile');

    const [rows] = await db.query(
      'SELECT id, name, email, phone, created_at FROM users WHERE id = ?',
      [user.id]
    );
    if (!rows.length) return R.notFound(res, 'User not found');

    return R.ok(res, rows[0], 'Profile fetched');
  } catch (err) {
    console.error('[getProfile]', err);
    return R.error(res);
  }
}

// ── PUT /api/profile ──────────────────────────────────────────────
async function updateProfile(req, res) {
  try {
    const token = getTokenFromHeader(req);
    const user  = await getUserFromToken(token);
    if (!user) return R.unauth(res, 'Please login');

    const { name, phone } = await parse(req);
    if (!name) return R.badReq(res, 'Name is required');

    await db.query(
      'UPDATE users SET name = ?, phone = ? WHERE id = ?',
      [name.trim(), phone || null, user.id]
    );

    return R.ok(res, { name: name.trim(), phone }, 'Profile updated');
  } catch (err) {
    console.error('[updateProfile]', err);
    return R.error(res);
  }
}

module.exports = { getProfile, updateProfile };
