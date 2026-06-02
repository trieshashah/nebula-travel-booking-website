# ✦ NEBULA TRAVEL 

# Travel Management System

A full-stack travel website developed as part of DBMS and Web Programming coursework. The project focuses on efficient database design and integration while providing a user-friendly web interface for travel-related services.

## Features
- User Registration and Login
- Destination Listings
- Travel Package Management
- Database Integration
- Booking and Reservation Management
- Responsive User Interface

## Technologies Used
- HTML
- CSS
- JavaScript
- Node.js
- SQL Database

## Project Objective
The main objective of this project was to design and implement a database-driven travel management system while integrating web development concepts to create a complete application.

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


  -d '{"pnr":"NEB123456"}'
```
