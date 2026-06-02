// ── router.js — Manual URL router ────────────────────────────────
'use strict';

const auth    = require('./controllers/authController');
const user    = require('./controllers/userController');
const vehicle = require('./controllers/vehicleController');
const booking = require('./controllers/bookingController');
const R       = require('./utils/sendResponse');

/**
 * Route map: { 'METHOD /api/path': handlerFunction }
 * Dynamic segments (e.g. query-string based) are handled inside controllers.
 */
const ROUTES = {
  // Auth
  'POST /api/register':     auth.register,
  'POST /api/login':        auth.login,
  'POST /api/logout':       auth.logout,

  // User / Profile
  'GET  /api/profile':      user.getProfile,
  'PUT  /api/profile':      user.updateProfile,

  // Vehicles / Search
  'GET  /api/search':       vehicle.search,
  'GET  /api/vehicle':      vehicle.getVehicle,

  // Bookings
  'POST /api/book':         booking.createBooking,
  'GET  /api/my-bookings':  booking.myBookings,
  'GET  /api/pnr':          booking.getPNR,
  'POST /api/cancel':       booking.cancelBooking,
};

/**
 * Strip query string from URL to get a clean path key.
 */
function getKey(method, rawUrl) {
  const path = rawUrl.split('?')[0];
  return `${method.toUpperCase().padEnd(4)} ${path}`;
}

/**
 * Main dispatch function — called by server.js for every request.
 */
async function dispatch(req, res) {
  const key     = getKey(req.method, req.url);
  const handler = ROUTES[key];

  if (handler) {
    try {
      await handler(req, res);
    } catch (err) {
      console.error(`[router] Unhandled error for ${key}:`, err);
      R.error(res, 'Unexpected server error');
    }
  } else {
    R.notFound(res, `Route not found: ${req.method} ${req.url.split('?')[0]}`);
  }
}

module.exports = dispatch;
