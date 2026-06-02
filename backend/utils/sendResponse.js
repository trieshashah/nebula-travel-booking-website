// ── utils/sendResponse.js ─────────────────────────────────────────
// Standardised JSON response helpers used by all controllers.
'use strict';

/**
 * Send a JSON response.
 * @param {import('http').ServerResponse} res
 * @param {number}  statusCode
 * @param {object}  body
 */
function send(res, statusCode, body) {
  const payload = JSON.stringify(body);
  res.writeHead(statusCode, {
    'Content-Type':  'application/json',
    'Content-Length': Buffer.byteLength(payload)
  });
  res.end(payload);
}

const ok      = (res, data = {}, message = 'OK')          => send(res, 200, { success: true,  message, data });
const created = (res, data = {}, message = 'Created')      => send(res, 201, { success: true,  message, data });
const badReq  = (res, message = 'Bad Request')             => send(res, 400, { success: false, message });
const unauth  = (res, message = 'Unauthorised')            => send(res, 401, { success: false, message });
const notFound= (res, message = 'Not Found')               => send(res, 404, { success: false, message });
const conflict= (res, message = 'Conflict')                => send(res, 409, { success: false, message });
const error   = (res, message = 'Internal Server Error')   => send(res, 500, { success: false, message });

module.exports = { send, ok, created, badReq, unauth, notFound, conflict, error };
