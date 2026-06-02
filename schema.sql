-- ============================================================
--  NEBULA TRAVEL — MySQL Schema + Sample Data
--  Run: mysql -u root -p < schema.sql
-- ============================================================

CREATE DATABASE IF NOT EXISTS nebula_travel CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE nebula_travel;

-- ── USERS ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  name          VARCHAR(100)  NOT NULL,
  email         VARCHAR(100)  NOT NULL UNIQUE,
  phone         VARCHAR(15),
  password      VARCHAR(255)  NOT NULL,
  created_at    TIMESTAMP     DEFAULT CURRENT_TIMESTAMP
);

-- ── SESSIONS ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sessions (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  user_id       INT           NOT NULL,
  session_token VARCHAR(255)  NOT NULL UNIQUE,
  created_at    TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ── VEHICLES ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS vehicles (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  type            ENUM('bus','train','flight') NOT NULL DEFAULT 'bus',
  name            VARCHAR(100) NOT NULL,
  icon            VARCHAR(10)  DEFAULT '🚌',
  from_city       VARCHAR(100) NOT NULL,
  to_city         VARCHAR(100) NOT NULL,
  departure_time  VARCHAR(20),
  arrival_time    VARCHAR(20),
  duration        VARCHAR(20),
  price           INT          NOT NULL,
  seats_available INT          NOT NULL DEFAULT 40,
  rating          FLOAT        DEFAULT 4.0,
  bus_type        VARCHAR(50)  DEFAULT 'AC Sleeper',
  amenities       VARCHAR(200) DEFAULT '',
  tag_html        TEXT,
  created_at      TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
);

-- ── BOOKINGS ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS bookings (
  id               INT AUTO_INCREMENT PRIMARY KEY,
  user_id          INT          NOT NULL,
  vehicle_id       INT          NOT NULL,
  pnr              VARCHAR(20)  NOT NULL UNIQUE,
  passenger_name   VARCHAR(100) NOT NULL,
  passenger_age    INT,
  passenger_gender VARCHAR(20),
  passenger_email  VARCHAR(100),
  passenger_phone  VARCHAR(15),
  seat_numbers     VARCHAR(100),
  boarding_point   VARCHAR(100),
  payment_method   VARCHAR(30),
  total_price      INT          NOT NULL,
  booking_status   VARCHAR(20)  DEFAULT 'confirmed',
  created_at       TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id)    REFERENCES users(id)    ON DELETE CASCADE,
  FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE
);

-- ── SAMPLE DATA — VEHICLES ────────────────────────────────────────
INSERT INTO vehicles (type, name, icon, from_city, to_city, departure_time, arrival_time, duration, price, seats_available, rating, bus_type, amenities, tag_html) VALUES

-- BUSES
('bus', 'Mumbai Supernova Express',  '🌟', 'Mumbai',    'Delhi',   '22:30', '07:00', '8h 30m',  850,  24, 4.8, 'AC Sleeper',     'wifi,charging,meals',              '<span class="tag tag-ac">❄️ AC</span><span class="tag tag-sleeper">🛏 Sleeper</span><span class="tag tag-volvo">⭐ Volvo</span>'),
('bus', 'Saturn Ring Travels',       '🪐', 'Mumbai',    'Delhi',   '20:00', '05:15', '9h 15m',  650,  18, 4.5, 'AC Sleeper',     'charging',                         '<span class="tag tag-ac">❄️ AC</span><span class="tag tag-sleeper">🛏 Sleeper</span>'),
('bus', 'Quasar Luxury Coaches',     '💫', 'Mumbai',    'Delhi',   '19:30', '03:30', '8h 00m', 1200,   7, 4.9, 'Volvo AC',       'wifi,meals,entertainment',         '<span class="tag tag-volvo">⭐ Premium</span><span class="tag tag-ac">❄️ AC</span><span class="tag tag-sleeper">📶 WiFi</span>'),
('bus', 'Pulsar Night Bus',          '⚡', 'Mumbai',    'Delhi',   '23:00', '09:00', '10h 00m', 550,  32, 4.2, 'Non-AC Sleeper', '',                                 '<span class="tag tag-sleeper">🛏 Sleeper</span>'),
('bus', 'Black Hole Bus Lines',      '🌙', 'Mumbai',    'Delhi',   '21:45', '06:30', '8h 45m',  975,  20, 4.7, 'Volvo AC',       'meals,charging',                   '<span class="tag tag-volvo">⭐ Volvo</span><span class="tag tag-ac">❄️ AC</span><span class="tag tag-sleeper">🍱 Meals</span>'),
('bus', 'Nebula Elite Class',        '🛸', 'Mumbai',    'Delhi',   '18:00', '01:30', '7h 30m', 1550,  12, 5.0, 'Volvo AC',       'wifi,meals,entertainment,charging','<span class="tag tag-volvo">💎 Elite</span><span class="tag tag-ac">❄️ AC</span><span class="tag tag-sleeper">📶 WiFi</span><span class="tag tag-sleeper">🍱 Meals</span>'),

-- BUSES — OTHER ROUTES
('bus', 'Comet Express',             '☄️', 'Mumbai',    'Pune',    '06:00', '09:00', '3h 00m',  299,  36, 4.3, 'AC Seater',      'charging',                         '<span class="tag tag-ac">❄️ AC</span><span class="tag tag-sleeper">💺 Seater</span>'),
('bus', 'Galaxy Shuttle',            '🌌', 'Mumbai',    'Pune',    '08:30', '11:30', '3h 00m',  349,  28, 4.6, 'Volvo AC',       'wifi,charging',                    '<span class="tag tag-volvo">⭐ Volvo</span><span class="tag tag-ac">❄️ AC</span>'),
('bus', 'Starlight Express',         '✨', 'Delhi',     'Agra',    '06:00', '08:30', '2h 30m',  220,  40, 4.4, 'AC Seater',      '',                                 '<span class="tag tag-ac">❄️ AC</span><span class="tag tag-sleeper">💺 Seater</span>'),
('bus', 'Warp Speed Coaches',        '🚀', 'Bangalore', 'Chennai', '21:00', '05:00', '8h 00m',  750,  22, 4.5, 'AC Sleeper',     'wifi,charging',                    '<span class="tag tag-ac">❄️ AC</span><span class="tag tag-sleeper">🛏 Sleeper</span>'),

-- TRAINS
('train', 'Rajdhani Express',        '🚂', 'Mumbai',    'Delhi',   '17:00', '08:00', '15h 00m', 1285, 60, 4.7, 'AC 2-Tier',    'meals,charging',                   '<span class="tag tag-ac">❄️ AC 2A</span><span class="tag tag-sleeper">🍱 Meals</span>'),
('train', 'Shatabdi Express',        '🚄', 'Delhi',     'Agra',    '06:15', '08:10', '1h 55m',  685,  80, 4.8, 'AC Chair Car', 'meals',                            '<span class="tag tag-ac">❄️ CC</span><span class="tag tag-sleeper">🍱 Meals</span>'),
('train', 'Tejas Express',           '🚅', 'Bangalore', 'Chennai', '05:30', '10:30', '5h 00m',  890,  45, 4.6, 'AC Chair Car', 'wifi,meals,entertainment',         '<span class="tag tag-volvo">💫 Premium</span><span class="tag tag-ac">❄️ AC</span>'),

-- FLIGHTS
('flight', 'IndiGo 6E-205',         '✈️', 'Bangalore', 'Chennai', '06:00', '07:10', '1h 10m', 2499,  60, 4.3, 'Economy',      '',                                 '<span class="tag tag-ac">✈️ Economy</span>'),
('flight', 'Air India AI-801',      '✈️', 'Mumbai',    'Delhi',   '07:00', '09:10', '2h 10m', 4200,  40, 4.5, 'Economy',      'meals',                            '<span class="tag tag-ac">✈️ Economy</span><span class="tag tag-sleeper">🍱 Meals</span>'),
('flight', 'Vistara UK-995',        '✈️', 'Mumbai',    'Delhi',   '10:30', '12:45', '2h 15m', 5800,  20, 4.8, 'Business',     'meals,entertainment,wifi',         '<span class="tag tag-volvo">💎 Business</span><span class="tag tag-sleeper">🍱 Meals</span>');

-- ── SAMPLE DATA — USERS (passwords are bcrypt of "password123") ──
-- NOTE: In production, passwords are hashed at runtime via register API.
-- These demo users use the literal string "password123" hashed with bcrypt (12 rounds).
INSERT INTO users (name, email, phone, password) VALUES
('Arjun Kumar',  'arjun@nebula.in',  '9876543210', '$2b$12$lhSKSqfWYnJEQ0TU8jzlZOhAWrLqjf0kNv1PpOo3ePD9P5EqjMCyi'),
('Priya Singh',  'priya@nebula.in',  '9876543211', '$2b$12$lhSKSqfWYnJEQ0TU8jzlZOhAWrLqjf0kNv1PpOo3ePD9P5EqjMCyi'),
('Rahul Mehta',  'rahul@nebula.in',  '9876543212', '$2b$12$lhSKSqfWYnJEQ0TU8jzlZOhAWrLqjf0kNv1PpOo3ePD9P5EqjMCyi');

-- ── SAMPLE DATA — BOOKINGS ───────────────────────────────────────
INSERT INTO bookings (user_id, vehicle_id, pnr, passenger_name, passenger_age, passenger_gender, passenger_email, passenger_phone, seat_numbers, boarding_point, payment_method, total_price, booking_status) VALUES
(1, 1, 'NEB123456', 'Arjun Kumar', 26, 'Male',   'arjun@nebula.in', '9876543210', 'B7,B8',  'Dadar Bus Depot',  'upi',  1785, 'confirmed'),
(1, 4, 'NEB789012', 'Arjun Kumar', 26, 'Male',   'arjun@nebula.in', '9876543210', 'D3',     'CST Mumbai',       'card', 578,  'completed'),
(2, 2, 'NEB345678', 'Priya Singh', 24, 'Female', 'priya@nebula.in', '9876543211', 'A1,A2',  'Andheri Bus Stop', 'upi',  1365, 'cancelled');
