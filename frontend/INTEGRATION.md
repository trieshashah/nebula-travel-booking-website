## NEBULA TRAVEL — Auth System Integration Guide

### What's included

```
js/auth.js      ← Drop-in auth system (modal + session + nav)
profile.html    ← Auth-aware profile page (replaces existing)
```

---

### Step 1 — Add auth.js to EVERY page

In every HTML file, add `auth.js` **BEFORE** `cosmic.js`:

```html
<!-- Add these two lines at the bottom of <body>, in this order -->
<script src="js/auth.js"></script>
<script src="js/cosmic.js"></script>
```

That's it. The modal, CSS, and nav wiring are all injected automatically.

---

### Step 2 — Replace profile.html

Replace your existing `profile.html` with the new one provided.
It auto-shows a login gate when logged out, full profile when logged in.

---

### Step 3 — No changes needed to nav HTML

The `auth.js` script automatically:
- Finds the "Sign In" button in `.nav-actions .btn-primary`
- Wires it to open the auth modal
- After login, replaces it with a user pill showing the first name
- The pill has a dropdown with: My Profile, My Bookings, Sign Out

---

### How it works

**Session storage:**  
Token is stored in `sessionStorage` (NOT `localStorage`).  
It persists across page navigations within the same browser tab,  
and is cleared automatically when the tab is closed.

**Login flow:**
```
User clicks "Sign In"
  → Auth modal opens
  → User submits email + password
  → POST /api/login
  → Token saved to sessionStorage
  → Nav updates: "Sign In" → "Arjun" pill
  → Modal closes with success animation
```

**Logout flow:**
```
User clicks "Sign Out" in dropdown
  → POST /api/logout (deletes session from DB)
  → Token cleared from sessionStorage
  → Nav reverts to "Sign In" button
```

**Page load (returning user):**
```
auth.js reads token from sessionStorage
  → If token exists, reads user from sessionStorage
  → Updates nav immediately (no flicker)
  → Profile page additionally calls GET /api/profile to refresh data
```

---

### Global Auth API

After `auth.js` is loaded, `window.Auth` is available everywhere:

```js
// Open modal programmatically
Auth.openModal('login');     // open on login tab
Auth.openModal('register');  // open on register tab

// Check if logged in
Auth.isLoggedIn();   // → true / false

// Get current user
Auth.getUser();      // → { name, email, userId } or null

// Get token (for fetch calls)
Auth.getToken();     // → "a3f9b2c1..." or null

// Log out
await Auth.logout();

// Validate token against server
const valid = await Auth.checkSession();
```

**Using Auth in cosmic.js for API calls:**

```js
// Instead of the old API helper, use Auth.getToken():
const resp = await fetch('/api/my-bookings', {
  headers: { token: Auth.getToken() }
});
```

---

### Demo credentials

```
Email:    arjun@nebula.in
Password: password123
```

---

### Browser support

Works in all modern browsers (Chrome, Firefox, Safari, Edge).  
`sessionStorage` is universally supported.
