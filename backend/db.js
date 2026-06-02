// ── db.js — MySQL connection pool ────────────────────────────────
'use strict';

const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host:            process.env.DB_HOST     || 'localhost',
  port:            parseInt(process.env.DB_PORT || '3306'),
  user:            process.env.DB_USER     || 'root',
  password:        process.env.DB_PASS     || 'denish@143',
  database:        process.env.DB_NAME     || 'nebula_travel',
  waitForConnections: true,
  connectionLimit:    10,
  queueLimit:          0,
  timezone:           '+05:30'           // IST
});

// Quick connectivity check on startup
pool.getConnection()
  .then(conn => {
    console.log('✦ MySQL connected — nebula_travel');
    conn.release();
  })
  .catch(err => {
    console.error('✗ MySQL connection failed:', err.message);
    process.exit(1);
  });

module.exports = pool;
