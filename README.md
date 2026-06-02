# ✦ NEBULA TRAVEL — Backend System

> Node.js (http module only) + MySQL · No Express · No JWT · No localStorage

---

## 📁 Project Structure

```
nebula-travel/
├── server.js                    ← HTTP server entry point
├── schema.sql                   ← MySQL schema + sample data
├── package.json
├── .env.example
│
├── backend/
│   ├── db.js                    ← MySQL connection pool (mysql2)
│   ├── router.js                ← Manual URL dispatcher
│   ├── controllers/
│   │   ├── authController.js    ← Register, Login, Logout
│   │   ├── userController.js    ← Profile GET/PUT
│   │   ├── vehicleController.js ← Search, Vehicle details
│   │   └── bookingController.js ← Book, My-Bookings, PNR, Cancel
│   └── utils/
│       ├── parseBody.js         ← Manual JSON body parser
│       └── sendResponse.js      ← Standardised JSON responses
│
└── frontend/
    ├── index.html
    ├── search-results.html
    ├── vehicle-details.html
    ├── booking.html
    ├── my-bookings.html
    ├── profile.html
    ├── admin.html
    ├── css/
    │   └── nebula.css
    └── js/
        └── cosmic.js            ← All localStorage removed; fetch() API calls
```

---

## 🚀 Quick Start

### 1. Install MySQL & create the database

```bash
# Install mysql2 + bcrypt
npm install

# Create DB + tables + sample data
mysql -u root -p < schema.sql
```

### 2. Configure environment

```bash
cp .env.example .env
# Edit .env — fill in DB_PASS with your MySQL password
```

### 3. Place your frontend files

Copy your HTML/CSS files into the `frontend/` folder.  
Copy the new `cosmic.js` from `frontend/js/cosmic.js`.

```
frontend/
├── index.html
├── search-results.html
├── vehicle-details.html
├── booking.html
├── my-bookings.html
├── profile.html
├── admin.html
├── css/nebula.css
└── js/cosmic.js       ← use the new backend-ready version
```

### 4. Run the server

```bash
# Production
node server.js

# Development (auto-restart on file change — Node 18+)
npm run dev
```

Open **http://localhost:3000** — the server serves both the API and the frontend.

---

## 🌐 API Reference

All API endpoints are at `/api/...`  
Protected routes require the header: `token: <session_token>`

### Auth

| Method | Endpoint | Body | Auth Required |
|--------|----------|------|---------------|
| POST | `/api/register` | `{ name, email, phone, password }` | ✗ |
| POST | `/api/login`    | `{ email, password }` | ✗ |
| POST | `/api/logout`   | — | ✓ |

**Login response example:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "a3f9b2c1...",
    "userId": 1,
    "name": "Arjun Kumar",
    "email": "arjun@nebula.in"
  }
}
```

> ⚠️ Store the `token` **in memory only** (a JS variable). Never in localStorage.

---

### User / Profile

| Method | Endpoint | Auth |
|--------|----------|------|
| GET | `/api/profile` | ✓ |
| PUT | `/api/profile` | ✓ Body: `{ name, phone }` |

---

### Vehicles / Search

| Method | Endpoint | Auth |
|--------|----------|------|
| GET | `/api/search?type=bus&from=Mumbai&to=Delhi&sort=price` | ✗ |
| GET | `/api/vehicle?id=1` | ✗ |

**Search response includes** real-time `seats_available` and already-booked seat list.

---

### Bookings

| Method | Endpoint | Auth |
|--------|----------|------|
| POST | `/api/book` | ✓ |
| GET  | `/api/my-bookings` | ✓ |
| GET  | `/api/pnr?pnr=NEB123456` | ✗ |
| POST | `/api/cancel` | ✓ Body: `{ pnr }` |

**Book body:**
```json
{
  "vehicle_id": 1,
  "passenger_name": "Arjun Kumar",
  "passenger_age": 26,
  "passenger_gender": "Male",
  "passenger_email": "arjun@nebula.in",
  "passenger_phone": "9876543210",
  "seat_numbers": "A1,A2",
  "boarding_point": "Dadar Bus Depot",
  "payment_method": "upi"
}
```

**Booking safety features:**
- Database transaction with row-level `FOR UPDATE` lock
- Prevents double-booking same seat
- Validates `seats_available > 0` before inserting
- Atomically decrements `seats_available` after confirmed insert
- Cancel restores seats

---

## 🔐 Session System

```
Register / Login
      │
      ▼
Generate crypto.randomBytes(48) token
      │
      ▼
INSERT INTO sessions (user_id, session_token)
      │
      ▼
Return token to frontend (in memory)
      │
      ▼
Frontend: headers: { token: "..." }
      │
      ▼
Backend: SELECT user from sessions JOIN users WHERE token = ?
```

No JWT. No cookies. Token lives in a JS variable — cleared on page refresh (by design).  
Logout deletes the session row from the database.

---

## 🗄️ Database Schema

```sql
users       — id, name, email, phone, password (bcrypt), created_at
sessions    — id, user_id, session_token (96-char hex), created_at
vehicles    — id, type, name, icon, from_city, to_city, times,
              price, seats_available, rating, bus_type, amenities, tag_html
bookings    — id, user_id, vehicle_id, pnr, passenger details,
              seat_numbers, boarding_point, payment_method,
              total_price, booking_status, created_at
```

---

## 🔄 What Changed in cosmic.js

| Before (localStorage) | After (API) |
|-----------------------|-------------|
| `DB.get('myBookings')` | `await API.get('/my-bookings')` |
| `DB.set('pendingBooking', {...})` | Data passed in URL params / in-memory object |
| `MOCK_BUSES` array | `await API.get('/search?...')` |
| `DB.set('userProfile', ...)` | `await API.put('/profile', {...})` |
| `DB.get('themeIdx')` | JS variable `_themeIdx` |
| `localStorage.setItem(...)` | **Removed entirely** |

---

## 💡 Demo Credentials

```
Email:    arjun@nebula.in
Password: password123

Email:    priya@nebula.in
Password: password123
```

---

## 📡 Example API Requests (curl)

```bash
# Register
curl -X POST http://localhost:3000/api/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@nebula.in","password":"test1234"}'

# Login
curl -X POST http://localhost:3000/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"arjun@nebula.in","password":"password123"}'

# Search buses
curl "http://localhost:3000/api/search?type=bus&from=Mumbai&to=Delhi"

# Get vehicle details
curl "http://localhost:3000/api/vehicle?id=1"

# Book (replace TOKEN with value from login)
curl -X POST http://localhost:3000/api/book \
  -H "Content-Type: application/json" \
  -H "token: TOKEN" \
  -d '{"vehicle_id":1,"passenger_name":"Arjun Kumar","passenger_age":26,"seat_numbers":"C1,C2","boarding_point":"Dadar","payment_method":"upi"}'

# My Bookings
curl http://localhost:3000/api/my-bookings -H "token: TOKEN"

# PNR Lookup
curl "http://localhost:3000/api/pnr?pnr=NEB123456"

# Cancel
curl -X POST http://localhost:3000/api/cancel \
  -H "Content-Type: application/json" \
  -H "token: TOKEN" \
  -d '{"pnr":"NEB123456"}'
```
