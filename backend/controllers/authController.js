// ── controllers/authController.js ────────────────────────────────
'use strict';

const crypto     = require('crypto');
const bcrypt     = require('bcrypt');
const db         = require('../db');
const parse      = require('../utils/parseBody');
const R          = require('../utils/sendResponse');

const SALT_ROUNDS = 12;

// ── Helpers ───────────────────────────────────────────────────────
function generateToken() {
  return crypto.randomBytes(48).toString('hex');   // 96-char hex string
}

/** Read session token from request headers */
function getTokenFromHeader(req) {
  return (req.headers['token'] || req.headers['authorization'] || '').trim();
}

/**
 * Resolve the user_id for a session token.
 * Returns the user row or null if the session is invalid/expired.
 */
async function getUserFromToken(token) {
  if (!token) return null;
  const [rows] = await db.query(
    `SELECT u.id, u.name, u.email, u.phone
       FROM sessions s
       JOIN users u ON u.id = s.user_id
      WHERE s.session_token = ?
      LIMIT 1`,
    [token]
  );
  return rows[0] || null;
}

// ── POST /api/register ────────────────────────────────────────────
async function register(req, res) {
  try {
    const { name, email, phone, password } = await parse(req);

    if (!name || !email || !password)
      return R.badReq(res, 'Name, email, and password are required');

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      return R.badReq(res, 'Invalid email format');

    if (password.length < 6)
      return R.badReq(res, 'Password must be at least 6 characters');

    // Check duplicate
    const [existing] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length) return R.conflict(res, 'Email already registered');

    const hashed = await bcrypt.hash(password, SALT_ROUNDS);
    const [result] = await db.query(
      'INSERT INTO users (name, email, phone, password) VALUES (?, ?, ?, ?)',
      [name.trim(), email.toLowerCase().trim(), phone || null, hashed]
    );

    // Auto-login: create session
    const token = generateToken();
    await db.query(
      'INSERT INTO sessions (user_id, session_token) VALUES (?, ?)',
      [result.insertId, token]
    );

    return R.created(res,
      { token, userId: result.insertId, name: name.trim() },
      'Registration successful'
    );
  } catch (err) {
    console.error('[register]', err);
    return R.error(res, 'Registration failed');
  }
}

// ── POST /api/login ───────────────────────────────────────────────
async function login(req, res) {
  try {
    const { email, password } = await parse(req);

    if (!email || !password) return R.badReq(res, 'Email and password are required');

    const [rows] = await db.query(
      'SELECT id, name, email, phone, password FROM users WHERE email = ?',
      [email.toLowerCase().trim()]
    );
    const user = rows[0];
    if (!user) return R.unauth(res, 'Invalid email or password');

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return R.unauth(res, 'Invalid email or password');

    // Create new session
    const token = generateToken();
    await db.query(
      'INSERT INTO sessions (user_id, session_token) VALUES (?, ?)',
      [user.id, token]
    );

    return R.ok(res,
      { token, userId: user.id, name: user.name, email: user.email },
      'Login successful'
    );
  } catch (err) {
    console.error('[login]', err);
    return R.error(res, 'Login failed');
  }
}

// ── POST /api/logout ──────────────────────────────────────────────
async function logout(req, res) {
  try {
    const token = getTokenFromHeader(req);
    if (token) {
      await db.query('DELETE FROM sessions WHERE session_token = ?', [token]);
    }
    return R.ok(res, {}, 'Logged out successfully');
  } catch (err) {
    console.error('[logout]', err);
    return R.error(res, 'Logout failed');
  }
}

module.exports = { register, login, logout, getUserFromToken, getTokenFromHeader };
