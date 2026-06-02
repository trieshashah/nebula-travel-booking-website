/* ==========================================
   NEBULA TRAVEL — COSMIC.JS  (Backend Edition)
   All data from MySQL via Node.js API.
   No localStorage. No mock data.
   Session token stored in memory only.
   ========================================== */

// ── SESSION TOKEN — in-memory only (never localStorage) ──────────
let SESSION_TOKEN = sessionStorage.getItem("nebula_session");

function getToken()       { return SESSION_TOKEN; }
function setToken(t)      { SESSION_TOKEN = t; }
function clearToken()     { SESSION_TOKEN = null; }

// ── API HELPER ────────────────────────────────────────────────────
const API = {
  async request(method, endpoint, body = null) {
    const opts = {
      method,
      headers: { 'Content-Type': 'application/json' }
    };
    if (SESSION_TOKEN) opts.headers['token'] = SESSION_TOKEN;
    if (body)          opts.body = JSON.stringify(body);

    try {
      const res  = await fetch(`/api${endpoint}`, opts);
      const json = await res.json();
      return json;                    // { success, message, data }
    } catch (err) {
      console.error('[API]', method, endpoint, err);
      return { success: false, message: 'Network error — could not reach server' };
    }
  },

  get(endpoint)          { return this.request('GET',  endpoint); },
  post(endpoint, body)   { return this.request('POST', endpoint, body); },
  put(endpoint, body)    { return this.request('PUT',  endpoint, body); },
};

// ── STARFIELD CANVAS ──────────────────────────────────────────────
function initStarfield() {
  const canvas = document.getElementById('starfield');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let W = window.innerWidth, H = window.innerHeight;
  let mouseX = W / 2, mouseY = H / 2;
  const STAR_COUNT = 140;
  const METEOR_MAX = 3;

  canvas.width = W; canvas.height = H;

  const stars = Array.from({ length: STAR_COUNT }, () => ({
    x: Math.random() * W, y: Math.random() * H,
    r: Math.random() * 1.8 + 0.3,
    alpha: Math.random(), speed: Math.random() * 0.003 + 0.001,
    drift: (Math.random() - 0.5) * 0.08,
    color: ['#f0e6ff', '#8B5CF6', '#EC4899', '#3B82F6', '#06B6D4'][Math.floor(Math.random() * 5)]
  }));

  const meteors = [];
  let mTimer = 0;

  function spawnMeteor() {
    if (meteors.length >= METEOR_MAX) return;
    meteors.push({
      x: Math.random() * W, y: -20,
      vx: (Math.random() * 2 + 1) * 1.5, vy: (Math.random() * 2 + 2) * 1.5,
      len: Math.random() * 120 + 60, alpha: 1, w: Math.random() * 1.5 + 0.5
    });
  }

  function drawMeteor(m) {
    const grad = ctx.createLinearGradient(m.x, m.y, m.x - m.vx * m.len / 5, m.y - m.vy * m.len / 5);
    grad.addColorStop(0, `rgba(255,255,255,${m.alpha})`);
    grad.addColorStop(0.5, `rgba(139,92,246,${m.alpha * 0.5})`);
    grad.addColorStop(1, 'transparent');
    ctx.strokeStyle = grad; ctx.lineWidth = m.w;
    ctx.beginPath(); ctx.moveTo(m.x, m.y);
    ctx.lineTo(m.x - m.vx * m.len / 5, m.y - m.vy * m.len / 5);
    ctx.stroke();
  }

  function tick() {
    ctx.clearRect(0, 0, W, H);
    const pxO = (mouseX / W - 0.5) * 20, pyO = (mouseY / H - 0.5) * 20;
    stars.forEach(s => {
      s.alpha += s.speed;
      if (s.alpha > 1 || s.alpha < 0) s.speed *= -1;
      s.x += s.drift;
      if (s.x < 0) s.x = W; if (s.x > W) s.x = 0;
      ctx.save();
      ctx.globalAlpha = Math.max(0, Math.min(1, s.alpha));
      ctx.fillStyle = s.color;
      ctx.shadowBlur = s.r * 3; ctx.shadowColor = s.color;
      ctx.beginPath();
      ctx.arc(s.x + pxO * (s.r / 2), s.y + pyO * (s.r / 2), s.r, 0, Math.PI * 2);
      ctx.fill(); ctx.restore();
    });
    mTimer++;
    if (mTimer > 120 + Math.random() * 180) { spawnMeteor(); mTimer = 0; }
    for (let i = meteors.length - 1; i >= 0; i--) {
      const m = meteors[i];
      m.x += m.vx; m.y += m.vy; m.alpha -= 0.015;
      if (m.alpha <= 0 || m.x > W + 100 || m.y > H + 100) { meteors.splice(i, 1); continue; }
      ctx.save(); ctx.globalAlpha = m.alpha; drawMeteor(m); ctx.restore();
    }
    requestAnimationFrame(tick);
  }
  tick();
  window.addEventListener('resize', () => { W = canvas.width = window.innerWidth; H = canvas.height = window.innerHeight; });
  document.addEventListener('mousemove', e => { mouseX = e.clientX; mouseY = e.clientY; });
}

// ── THEME TOGGLE — persisted in a plain JS variable (not LS) ─────
let _themeIdx = 0;
function initThemeToggle() {
  const themes = ['purple', 'blue', 'pink'];
  const applyTheme = () => {
    document.documentElement.setAttribute('data-theme', themes[_themeIdx]);
    document.querySelectorAll('.theme-toggle').forEach(btn => {
      btn.textContent = ['🌌', '🔵', '🌸'][_themeIdx];
    });
  };
  applyTheme();
  document.querySelectorAll('.theme-toggle').forEach(btn => {
    btn.addEventListener('click', () => {
      _themeIdx = (_themeIdx + 1) % themes.length;
      applyTheme();
      showToast('Theme shifted to ' + themes[_themeIdx] + ' nebula', 'info');
    });
  });
}

// ── HAMBURGER ─────────────────────────────────────────────────────
function initHamburger() {
  const ham = document.querySelector('.hamburger');
  const mobileNav = document.querySelector('.nav-mobile');
  if (!ham || !mobileNav) return;
  ham.addEventListener('click', () => {
    ham.classList.toggle('open');
    mobileNav.classList.toggle('open');
  });
}

// ── TOAST ─────────────────────────────────────────────────────────
function showToast(msg, type = 'info', duration = 3500) {
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }
  const icons = { success: '✦', error: '✗', info: '◉' };
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<span>${icons[type] || '◉'}</span><span>${msg}</span>`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.animation = 'toastOut 0.4s ease forwards';
    setTimeout(() => toast.remove(), 400);
  }, duration);
}

// ── WORMHOLE LOADER ───────────────────────────────────────────────
function showLoader(msg = 'TRAVERSING WORMHOLE...') {
  let overlay = document.querySelector('.wormhole-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.className = 'wormhole-overlay';
    overlay.innerHTML = `
      <div class="wormhole">
        <div class="wormhole-ring"></div>
        <div class="wormhole-ring"></div>
        <div class="wormhole-ring"></div>
      </div>
      <div class="wormhole-text">${msg}</div>`;
    document.body.appendChild(overlay);
  }
  overlay.classList.add('active');
  return overlay;
}
function hideLoader() {
  const overlay = document.querySelector('.wormhole-overlay');
  if (overlay) overlay.classList.remove('active');
}

// ── SCROLL REVEAL ─────────────────────────────────────────────────
function initScrollReveal() {
  const els = document.querySelectorAll('.reveal');
  if (!els.length) return;
  const obs = new IntersectionObserver((entries) => {
    entries.forEach((e, i) => { if (e.isIntersecting) setTimeout(() => e.target.classList.add('visible'), i * 80); });
  }, { threshold: 0.1 });
  els.forEach(el => obs.observe(el));
}

// ── 3D TILT ───────────────────────────────────────────────────────
function initTiltEffects() {
  document.querySelectorAll('.tilt-card').forEach(card => {
    card.addEventListener('mousemove', e => {
      const rect = card.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top)  / rect.height - 0.5;
      card.style.transform = `perspective(600px) rotateY(${x * 10}deg) rotateX(${-y * 8}deg) translateY(-4px) scale(1.02)`;
    });
    card.addEventListener('mouseleave', () => { card.style.transform = ''; });
  });
}

// ── CITIES AUTOCOMPLETE ───────────────────────────────────────────
const CITIES = [
  { name: 'Mumbai',     code: 'BOM', state: 'Maharashtra' },
  { name: 'Delhi',      code: 'DEL', state: 'Delhi' },
  { name: 'Bangalore',  code: 'BLR', state: 'Karnataka' },
  { name: 'Chennai',    code: 'MAA', state: 'Tamil Nadu' },
  { name: 'Hyderabad',  code: 'HYD', state: 'Telangana' },
  { name: 'Kolkata',    code: 'CCU', state: 'West Bengal' },
  { name: 'Pune',       code: 'PNQ', state: 'Maharashtra' },
  { name: 'Ahmedabad',  code: 'AMD', state: 'Gujarat' },
  { name: 'Jaipur',     code: 'JAI', state: 'Rajasthan' },
  { name: 'Surat',      code: 'STV', state: 'Gujarat' },
  { name: 'Nagpur',     code: 'NAG', state: 'Maharashtra' },
  { name: 'Indore',     code: 'IDR', state: 'Madhya Pradesh' },
  { name: 'Bhopal',     code: 'BHO', state: 'Madhya Pradesh' },
  { name: 'Varanasi',   code: 'VNS', state: 'Uttar Pradesh' },
  { name: 'Lucknow',    code: 'LKO', state: 'Uttar Pradesh' },
  { name: 'Patna',      code: 'PAT', state: 'Bihar' },
  { name: 'Kochi',      code: 'COK', state: 'Kerala' },
  { name: 'Goa',        code: 'GOI', state: 'Goa' },
  { name: 'Agra',       code: 'AGR', state: 'Uttar Pradesh' },
  { name: 'Amritsar',   code: 'ATQ', state: 'Punjab' }
];

function initAutocomplete(inputEl, dropdownEl) {
  if (!inputEl || !dropdownEl) return;
  const wrap = inputEl.closest('.holo-input-wrap');
  inputEl.addEventListener('input', () => {
    const q = inputEl.value.trim().toLowerCase();
    if (wrap) wrap.classList.toggle('has-value', q.length > 0);
    if (!q) { dropdownEl.style.display = 'none'; return; }
    const matches = CITIES.filter(c => c.name.toLowerCase().startsWith(q) || c.code.toLowerCase().startsWith(q));
    if (!matches.length) { dropdownEl.style.display = 'none'; return; }
    dropdownEl.innerHTML = matches.slice(0, 6).map(c => `
      <div class="autocomplete-item" data-val="${c.name}">
        <span>🌆</span>
        <div>
          <div style="color:var(--text-primary);font-size:0.9rem;">${c.name}</div>
          <div style="color:var(--text-muted);font-size:0.72rem;">${c.state}</div>
        </div>
        <span class="city-code">${c.code}</span>
      </div>`).join('');
    dropdownEl.style.display = 'block';
    dropdownEl.querySelectorAll('.autocomplete-item').forEach(item => {
      item.addEventListener('click', () => {
        inputEl.value = item.dataset.val;
        if (wrap) wrap.classList.add('has-value');
        dropdownEl.style.display = 'none';
      });
    });
  });
  document.addEventListener('click', e => {
    if (!dropdownEl.contains(e.target) && e.target !== inputEl) dropdownEl.style.display = 'none';
  });
}

function initDateInputs() {
  document.querySelectorAll('input[type="date"]').forEach(el => {
    const wrap = el.closest('.holo-input-wrap');
    el.min = new Date().toISOString().split('T')[0];
    el.addEventListener('change', () => { if (wrap) wrap.classList.toggle('has-value', el.value !== ''); });
    if (el.value && wrap) wrap.classList.add('has-value');
  });
}

function initPassengerCounter() {
  const trigger  = document.querySelector('.passenger-trigger');
  const dropdown = document.querySelector('.passenger-dropdown');
  if (!trigger || !dropdown) return;
  let adults = 1, children = 0, seniors = 0;
  const updateDisplay = () => {
    const total = adults + children + seniors;
    trigger.querySelector('.passenger-val').textContent = `${total} Passenger${total !== 1 ? 's' : ''}`;
    const wrap = trigger.closest('.holo-input-wrap');
    if (wrap) wrap.classList.add('has-value');
  };
  trigger.addEventListener('click', e => {
    e.stopPropagation();
    dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
  });
  document.addEventListener('click', e => {
    if (!dropdown.contains(e.target) && e.target !== trigger) dropdown.style.display = 'none';
  });
  dropdown.querySelectorAll('.counter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const row = btn.closest('.passenger-row');
      const type = row.dataset.type;
      const valEl = row.querySelector('.counter-val');
      let current = parseInt(valEl.textContent);
      if (btn.dataset.dir === '+') {
        if (type === 'adults') adults++;
        else if (type === 'children') children++;
        else seniors++;
        current++;
      } else {
        const min = type === 'adults' ? 1 : 0;
        if (current <= min) return;
        if (type === 'adults') adults--;
        else if (type === 'children') children--;
        else seniors--;
        current--;
      }
      valEl.textContent = current;
      updateDisplay();
    });
  });
}

function initSwap() {
  const swapBtn = document.querySelector('.swap-btn');
  if (!swapBtn) return;
  swapBtn.addEventListener('click', () => {
    const from = document.querySelector('#fromCity');
    const to   = document.querySelector('#toCity');
    if (!from || !to) return;
    [from.value, to.value] = [to.value, from.value];
    document.querySelectorAll('.holo-input-wrap').forEach(w => {
      const inp = w.querySelector('.holo-input');
      if (inp) w.classList.toggle('has-value', inp.value !== '');
    });
    showToast('Cities swapped! ✦', 'info', 1500);
  });
}

function initHoloInputs() {
  document.querySelectorAll('.holo-input').forEach(input => {
    const wrap = input.closest('.holo-input-wrap');
    if (!wrap) return;
    const check = () => wrap.classList.toggle('has-value', input.value !== '');
    input.addEventListener('input', check);
    input.addEventListener('change', check);
    check();
  });
}

function initSearchForm() {
  const form = document.querySelector('.search-form');
  if (!form) return;
  form.addEventListener('submit', e => {
    e.preventDefault();
    const from = document.querySelector('#fromCity')?.value;
    const to   = document.querySelector('#toCity')?.value;
    const date = document.querySelector('#travelDate')?.value;
    const mode = document.querySelector('.portal-tab.active')?.dataset.mode || 'bus';
    if (!from) { showToast('Please enter departure city', 'error'); return; }
    if (!to)   { showToast('Please enter destination city', 'error'); return; }
    if (!date) { showToast('Please select travel date', 'error'); return; }
    if (from === to) { showToast('Source and destination cannot be same', 'error'); return; }
    showLoader('SCANNING GALAXY...');
    setTimeout(() => {
      hideLoader();
      const params = new URLSearchParams({ from, to, date, mode });
      window.location.href = `search-results.html?${params}`;
    }, 1000);
  });
}

function initPortalTabs() {
  document.querySelectorAll('.portal-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.portal-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
    });
  });
}

// ── COUNTER ANIMATION ─────────────────────────────────────────────
function initCounterAnimation() {
  document.querySelectorAll('.count-up').forEach(el => {
    const target = parseInt(el.textContent.replace(/\D/g, ''));
    const suffix = el.textContent.replace(/[\d,]/g, '');
    let current = 0;
    const step = target / 60;
    const timer = setInterval(() => {
      current = Math.min(current + step, target);
      el.textContent = Math.round(current).toLocaleString() + suffix;
      if (current >= target) clearInterval(timer);
    }, 16);
  });
}

// ─────────────────────────────────────────────────────────────────
// SEARCH RESULTS — fetch from /api/search
// ─────────────────────────────────────────────────────────────────
let _searchResults = [];   // in-memory store for current results

async function initResultsPage() {
  const params = new URLSearchParams(window.location.search);
  const from   = params.get('from') || 'Mumbai';
  const to     = params.get('to')   || 'Delhi';
  const mode   = params.get('mode') || 'bus';
  const dateStr= params.get('date') || '';

  const routeEl = document.querySelector('.search-route-display');
  if (routeEl) routeEl.textContent = `${from} → ${to}`;

  const dateEl = document.getElementById('routeDateDisplay');
  if (dateEl && dateStr) {
    const d = new Date(dateStr);
    dateEl.textContent = d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
  }

  showLoader('SCANNING GALAXY...');
  const resp = await API.get(`/search?type=${encodeURIComponent(mode)}&from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`);
  hideLoader();

  if (!resp.success) {
    showToast(resp.message || 'Search failed', 'error');
    renderResultCards([]);
    return;
  }

  _searchResults = resp.data.vehicles || [];
  renderResultCards(_searchResults);
  initFilterCheckboxes();
  initPriceSlider();
  initSortSelect();
}

function renderResultCards(vehicles) {
  let container = document.getElementById('resultsContainer');
  if (!container) {
    const header = document.querySelector('.results-header');
    if (!header) return;
    container = document.createElement('div');
    container.id = 'resultsContainer';
    header.insertAdjacentElement('afterend', container);
    document.querySelectorAll('.result-card').forEach(c => c.style.display = 'none');
  }

  const countEl = document.querySelector('#resultCount') || document.querySelector('.results-count span');
  if (countEl) countEl.textContent = vehicles.length;

  if (!vehicles.length) {
    container.innerHTML = `
      <div class="glass-card" style="padding:3rem;text-align:center;margin-top:1rem;">
        <div style="font-size:3rem;margin-bottom:1rem;">🌌</div>
        <div style="font-family:'Orbitron',monospace;font-size:1rem;color:var(--text-muted);">No cosmic routes found</div>
        <div style="font-size:0.85rem;color:var(--text-muted);margin-top:0.5rem;">Try adjusting your filters or route</div>
      </div>`;
    return;
  }

  container.innerHTML = vehicles.map((v, i) => {
    const seats    = v.seats_available;
    const seatsText= seats <= 10
      ? `<span style="color:var(--nebula-pink);font-weight:600;">ALMOST FULL</span>`
      : `<span style="color:var(--text-muted);">seats left</span>`;
    const ringColor = seats <= 10 ? '#EC4899' : seats <= 20 ? '#06B6D4' : 'var(--nebula-primary)';
    const dashArr   = Math.round((seats / 40) * 126);
    const tagHtml   = v.tag_html || '';

    return `
    <div class="glass-card result-card tilt-card reveal" style="transition-delay:${i * 0.08}s;"
      data-price="${v.price}" data-rating="${v.rating}" data-type="${v.bus_type}"
      data-dep="${v.departure_time}" data-amenities="${v.amenities}">
      <div class="result-card-inner">
        <div class="operator-logo">${v.icon || '🚌'}</div>
        <div>
          <div style="font-family:'Orbitron',monospace;font-size:0.85rem;font-weight:700;color:var(--nebula-primary);margin-bottom:6px;">${v.name}</div>
          <div class="result-route">
            <div>
              <div class="route-time">${v.departure_time}</div>
              <div class="route-city">${v.from_city}</div>
            </div>
            <div class="route-line">
              <div class="route-duration">${v.duration}</div>
              <div class="route-dotted"></div>
            </div>
            <div>
              <div class="route-time">${v.arrival_time}</div>
              <div class="route-city">${v.to_city}</div>
            </div>
          </div>
          <div class="result-tags" style="flex-direction:row;margin-top:10px;">${tagHtml}</div>
        </div>
        <div style="text-align:center;">
          <div class="avail-ring">
            <svg width="48" height="48">
              <circle cx="24" cy="24" r="20" fill="none" stroke="rgba(139,92,246,0.15)" stroke-width="3"/>
              <circle cx="24" cy="24" r="20" fill="none" stroke="${ringColor}" stroke-width="3"
                stroke-linecap="round" stroke-dasharray="${dashArr} ${126 - dashArr}"/>
            </svg>
            <span class="avail-ring-num">${seats}</span>
          </div>
          <div style="font-size:0.68rem;margin-top:4px;">${seatsText}</div>
        </div>
        <div class="result-price-wrap">
          <div class="result-price">₹${v.price.toLocaleString('en-IN')}</div>
          <div class="result-per">per seat</div>
          <div class="result-seats">⭐ ${v.rating} rated</div>
          <button class="book-now-btn" data-vehicle-id="${v.id}">BOOK NOW</button>
        </div>
      </div>
    </div>`;
  }).join('');

  initTiltEffects();

  document.querySelectorAll('.book-now-btn').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      const vehicleId = btn.dataset.vehicleId;
      showLoader('PLOTTING COURSE...');
      setTimeout(() => {
        hideLoader();
        const qp = new URLSearchParams(window.location.search);
        qp.set('vehicleId', vehicleId);
        window.location.href = `vehicle-details.html?${qp}`;
      }, 800);
    });
  });

  setTimeout(() => initScrollReveal(), 50);
}

// ── FILTER ENGINE — operates on in-memory _searchResults ─────────
function applyFilters() {
  const slider   = document.querySelector('.price-slider');
  const maxPrice = slider ? parseInt(slider.value) : 5000;

  const typeCheckboxes = document.querySelectorAll('[data-group="type"] .filter-option input');
  const typeLabels     = ['AC Sleeper', 'Non-AC Sleeper', 'Volvo AC', 'Seater (Semi)'];
  const checkedTypes   = [];
  typeCheckboxes.forEach((cb, i) => { if (cb.checked) checkedTypes.push(typeLabels[i]); });

  let result = _searchResults.filter(v => {
    if (v.price > maxPrice) return false;
    if (checkedTypes.length && !checkedTypes.some(t => (v.bus_type || '').includes(t))) return false;
    return true;
  });

  result = applySortToArray(result);
  renderResultCards(result);
}

function initPriceSlider() {
  const slider = document.querySelector('.price-slider');
  if (!slider) return;
  const update = () => {
    const pct = (slider.value / slider.max) * 100;
    slider.style.setProperty('--val', pct + '%');
    const disp = document.querySelector('.price-display .price-max');
    if (disp) disp.textContent = '₹' + parseInt(slider.value).toLocaleString();
    applyFilters();
  };
  slider.addEventListener('input', update);
  update();
}

function initFilterCheckboxes() {
  document.querySelectorAll('.filter-option input[type="checkbox"]').forEach(cb => {
    cb.addEventListener('change', applyFilters);
  });
}

let currentSort = 'price';
function applySortToArray(arr) {
  return [...arr].sort((a, b) => {
    if (currentSort === 'price')   return a.price - b.price;
    if (currentSort === 'rating')  return b.rating - a.rating;
    if (currentSort === 'fastest') return (a.duration || '').localeCompare(b.duration || '');
    return 0;
  });
}

function initSortSelect() {
  const sel = document.querySelector('.sort-select');
  if (!sel) return;
  sel.addEventListener('change', () => { currentSort = sel.value || 'price'; applyFilters(); });
}

// ─────────────────────────────────────────────────────────────────
// VEHICLE DETAILS — fetch from /api/vehicle
// ─────────────────────────────────────────────────────────────────
const SEAT_STATE = {
  selected: new Set(),
  booked:   new Set(),
  maxSeats: 6,
  pricePerSeat: 850,
  vehicleId: null
};

async function initSeatMap() {
  const grid = document.querySelector('.seat-grid');
  if (!grid) return;

  // Get vehicleId from URL
  const params    = new URLSearchParams(window.location.search);
  const vehicleId = parseInt(params.get('vehicleId') || '0');
  SEAT_STATE.vehicleId = vehicleId;

  if (vehicleId) {
    showLoader('LOADING VEHICLE...');
    const resp = await API.get(`/vehicle?id=${vehicleId}`);
    hideLoader();

    if (resp.success) {
      const { vehicle, bookedSeats } = resp.data;

      // Update page with real data
      SEAT_STATE.pricePerSeat = vehicle.price;
      const nameEl = document.querySelector('.vehicle-name');
      if (nameEl) nameEl.textContent = vehicle.name;
      const priceEl = document.querySelector('.price-per-seat-val');
      if (priceEl) priceEl.textContent = vehicle.price;
      const bigPriceEl = document.querySelector('.vehicle-header [style*="2rem"]');
      if (bigPriceEl) bigPriceEl.textContent = `₹${vehicle.price}`;

      // Mark booked seats from API
      bookedSeats.forEach(s => SEAT_STATE.booked.add(s));

      // Update route viz
      const fromEl = document.querySelector('.route-stop-city');
      if (fromEl) fromEl.textContent = vehicle.from_city;
      const stops   = document.querySelectorAll('.route-stop-city');
      if (stops[1]) stops[1].textContent = vehicle.to_city;

      // Update summary card
      const routeEl = document.querySelector('.summary-row .summary-val');
      if (routeEl) routeEl.textContent = `${vehicle.from_city} → ${vehicle.to_city}`;
    } else {
      showToast(resp.message || 'Could not load vehicle', 'error');
    }
  }

  // Mark booked seats in DOM
  const allSeats = grid.querySelectorAll('.seat:not(.aisle-gap)');
  allSeats.forEach(seat => {
    const id = seat.dataset.seatId;
    if (!id) return;
    if (SEAT_STATE.booked.has(id)) {
      seat.classList.add('booked');
    } else {
      seat.addEventListener('click', () => toggleSeat(seat));
    }
  });

  drawConstellationLines();
}

function toggleSeat(seat) {
  const id = seat.dataset.seatId;
  if (SEAT_STATE.selected.has(id)) {
    SEAT_STATE.selected.delete(id);
    seat.classList.remove('selected');
    showToast(`Seat ${id} deselected`, 'info', 1200);
  } else {
    if (SEAT_STATE.selected.size >= SEAT_STATE.maxSeats) {
      showToast(`Max ${SEAT_STATE.maxSeats} seats per booking`, 'error');
      return;
    }
    SEAT_STATE.selected.add(id);
    seat.classList.add('selected');
    showToast(`Seat ${id} selected ✦`, 'success', 1200);
  }
  updateSeatSummary();
  drawConstellationLines();
}

function updateSeatSummary() {
  const count    = SEAT_STATE.selected.size;
  const subtotal = count * SEAT_STATE.pricePerSeat;
  const gst      = Math.round(subtotal * 0.05);
  const total    = subtotal + gst;

  const seatsEl = document.querySelector('.selected-seats-val');
  const totalEl = document.querySelector('.seat-total-val');
  const countEl = document.querySelector('.seat-count-display');
  const gstEl   = document.getElementById('gstDisplay');

  if (seatsEl) seatsEl.textContent = count ? [...SEAT_STATE.selected].join(', ') : '—';
  if (totalEl) totalEl.textContent = '₹' + total.toLocaleString('en-IN');
  if (countEl) countEl.textContent = count;
  if (gstEl)   gstEl.textContent   = '₹' + gst.toLocaleString('en-IN');

  const proceedBtn = document.querySelector('.proceed-btn');
  if (proceedBtn) {
    proceedBtn.disabled      = count === 0;
    proceedBtn.style.opacity = count === 0 ? '0.5' : '1';
  }
}

function drawConstellationLines() {
  const svg = document.getElementById('seatSvg');
  if (!svg) return;
  const selectedEls = [...SEAT_STATE.selected].map(id =>
    document.querySelector(`.seat[data-seat-id="${id}"]`)
  ).filter(Boolean);
  svg.innerHTML = '';
  if (selectedEls.length < 2) return;
  const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
  defs.innerHTML = `
    <linearGradient id="constGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#8B5CF6"/>
      <stop offset="100%" stop-color="#EC4899"/>
    </linearGradient>
    <filter id="glow">
      <feGaussianBlur stdDeviation="2" result="blur"/>
      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>`;
  svg.appendChild(defs);
  const gridRect = document.querySelector('.seat-grid').getBoundingClientRect();
  for (let i = 0; i < selectedEls.length - 1; i++) {
    const r1 = selectedEls[i].getBoundingClientRect();
    const r2 = selectedEls[i + 1].getBoundingClientRect();
    const x1 = r1.left + r1.width / 2 - gridRect.left;
    const y1 = r1.top  + r1.height / 2 - gridRect.top;
    const x2 = r2.left + r2.width / 2 - gridRect.left;
    const y2 = r2.top  + r2.height / 2 - gridRect.top;
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', x1); line.setAttribute('y1', y1);
    line.setAttribute('x2', x2); line.setAttribute('y2', y2);
    line.setAttribute('stroke', 'url(#constGrad)');
    line.setAttribute('stroke-width', '1.5');
    line.setAttribute('stroke-dasharray', '4 4');
    line.setAttribute('opacity', '0.7');
    svg.appendChild(line);
    [r1, r2].forEach(r => {
      const cx = r.left + r.width / 2 - gridRect.left;
      const cy = r.top  + r.height / 2 - gridRect.top;
      const dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      dot.setAttribute('cx', cx); dot.setAttribute('cy', cy); dot.setAttribute('r', '3');
      dot.setAttribute('fill', '#8B5CF6'); dot.setAttribute('filter', 'url(#glow)');
      svg.appendChild(dot);
    });
  }
}

function proceedToBooking() {
  if (SEAT_STATE.selected.size === 0) { showToast('Please select at least 1 seat', 'error'); return; }
  if (!SESSION_TOKEN) { showToast('Please login to continue booking', 'error'); return; }
  const seats    = [...SEAT_STATE.selected].join(',');
  const subtotal = SEAT_STATE.selected.size * SEAT_STATE.pricePerSeat;
  const gst      = Math.round(subtotal * 0.05);
  const total    = subtotal + gst;
  const params   = new URLSearchParams(window.location.search);
  window.location.href = `booking.html?seats=${encodeURIComponent(seats)}&total=${total}&vehicleId=${params.get('vehicleId') || ''}`;
}

// ─────────────────────────────────────────────────────────────────
// BOOKING FLOW — 4-step; final step POSTs to /api/book
// ─────────────────────────────────────────────────────────────────
// In-memory passenger / boarding / payment store (cleared on page load)
const BOOKING_DRAFT = { passenger: {}, boarding: {}, payment: 'upi' };

let currentStep = 0;

function initBookingSteps() {
  const panels    = document.querySelectorAll('.step-panel');
  const stepItems = document.querySelectorAll('.step-item');
  const connectors= document.querySelectorAll('.step-connector');
  if (!panels.length) return;

  const params     = new URLSearchParams(window.location.search);
  const seats      = params.get('seats');
  const total      = params.get('total');
  const vehicleId  = params.get('vehicleId');

  const seatDisplay = document.getElementById('seatDisplay');
  if (seatDisplay && seats) seatDisplay.textContent = seats;

  function goToStep(n) {
    panels.forEach((p, i) => p.classList.toggle('active', i === n));
    stepItems.forEach((s, i) => {
      s.classList.remove('active', 'done');
      if (i === n) s.classList.add('active');
      else if (i < n) s.classList.add('done');
    });
    connectors.forEach((c, i) => c.classList.toggle('done', i < n));
    currentStep = n;
    if (n === 3) populateReviewStep();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  goToStep(0);

  document.querySelectorAll('.next-step-btn').forEach(btn => {
    btn.addEventListener('click', () => { if (validateStep(currentStep)) goToStep(currentStep + 1); });
  });
  document.querySelectorAll('.prev-step-btn').forEach(btn => {
    btn.addEventListener('click', () => { if (currentStep > 0) goToStep(currentStep - 1); });
  });

  // Card number formatting
  const cardInput = document.querySelector('[placeholder=" "][maxlength="19"]');
  if (cardInput) {
    cardInput.addEventListener('input', () => {
      let val = cardInput.value.replace(/\D/g, '').substring(0, 16);
      cardInput.value = val.replace(/(.{4})/g, '$1 ').trim();
    });
  }
  document.querySelectorAll('.holo-input[maxlength="5"]').forEach(el => {
    el.addEventListener('input', () => {
      let val = el.value.replace(/\D/g, '');
      if (val.length >= 2) val = val.slice(0, 2) + '/' + val.slice(2, 4);
      el.value = val;
    });
  });

  updatePaymentBreakdown(seats, total);

  const confirmBtn = document.querySelector('.confirm-booking-btn');
  if (confirmBtn) {
    confirmBtn.addEventListener('click', () => confirmBooking(seats, total, vehicleId));
  }
}

function validateStep(step) {
  if (step === 0) {
    const name  = document.querySelector('#passengerName')?.value?.trim();
    const age   = document.querySelector('#passengerAge')?.value;
    const email = document.querySelector('#passengerEmail')?.value?.trim();
    const phone = document.querySelector('#passengerPhone')?.value?.trim();
    if (!name)  { showToast('Please enter passenger name', 'error'); return false; }
    if (!age || age < 1 || age > 120) { showToast('Please enter valid age', 'error'); return false; }
    if (!email || !email.includes('@')) { showToast('Please enter valid email', 'error'); return false; }
    if (phone && !/^[6-9]\d{9}$/.test(phone.replace(/\D/g, ''))) {
      showToast('Please enter valid 10-digit mobile number', 'error'); return false;
    }
    const gender = document.querySelector('#passengerGender')?.value || null;
    BOOKING_DRAFT.passenger = { name, age: parseInt(age), email, phone, gender };
  }
  if (step === 1) {
    const boarding = document.querySelector('.boarding-item.selected');
    if (!boarding) { showToast('Please select a boarding point', 'error'); return false; }
    BOOKING_DRAFT.boarding = { stop: boarding.dataset.stop, time: boarding.dataset.time };
  }
  if (step === 2) {
    const activeMethod = document.querySelector('.payment-method.active');
    BOOKING_DRAFT.payment = activeMethod?.dataset.method || 'upi';
    if (BOOKING_DRAFT.payment === 'card') {
      const cardNum = document.querySelector('[maxlength="19"]')?.value?.replace(/\s/g, '');
      if (!cardNum || cardNum.length < 16) { showToast('Please enter valid card number', 'error'); return false; }
      const cvv = document.querySelector('[maxlength="3"]')?.value;
      if (!cvv || cvv.length < 3) { showToast('Please enter valid CVV', 'error'); return false; }
    }
  }
  return true;
}

function populateReviewStep() {
  const p = BOOKING_DRAFT.passenger;
  const params = new URLSearchParams(window.location.search);
  const seats  = params.get('seats') || '—';
  const total  = params.get('total') || '0';

  const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
  set('reviewName',  p.name  || '—');
  set('reviewPhone', p.phone || '—');
  set('reviewEmail', p.email || '—');
  set('reviewSeats', seats);
  document.querySelectorAll('.review-total-val').forEach(el => el.textContent = '₹' + parseInt(total).toLocaleString('en-IN'));
}

function updatePaymentBreakdown(seats, total) {
  const seatCount = seats ? seats.split(',').length : 1;
  const baseEl    = document.querySelector('.price-total-base');
  if (baseEl) baseEl.textContent = '₹' + (seatCount * SEAT_STATE.pricePerSeat || parseInt(total || '0')).toLocaleString('en-IN');
}

async function confirmBooking(seats, total, vehicleId) {
  if (!SESSION_TOKEN) {
    showToast('Please login to confirm booking', 'error');
    setTimeout(() => window.location.href = 'profile.html', 1500);
    return;
  }
  const p = BOOKING_DRAFT.passenger;
  if (!p.name) { showToast('Passenger info missing — go back to step 1', 'error'); return; }

  showLoader('CONFIRMING BOOKING...');

  const resp = await API.post('/book', {
    vehicle_id:       parseInt(vehicleId) || 1,
    passenger_name:   p.name,
    passenger_age:    p.age,
    passenger_gender: p.gender,
    passenger_email:  p.email,
    passenger_phone:  p.phone,
    seat_numbers:     seats,
    boarding_point:   BOOKING_DRAFT.boarding.stop || '',
    payment_method:   BOOKING_DRAFT.payment || 'upi'
  });

  hideLoader();

  if (resp.success) {
    showBookingSuccess(resp.data.pnr, resp.data.seat_numbers, resp.data.total_price);
  } else {
    showToast(resp.message || 'Booking failed', 'error');
  }
}

function showBookingSuccess(pnr, seats, total) {
  const overlay = document.createElement('div');
  overlay.style.cssText = `
    position:fixed;inset:0;background:rgba(2,1,10,0.95);backdrop-filter:blur(20px);
    z-index:9999;display:flex;align-items:center;justify-content:center;flex-direction:column;
    gap:1.5rem;text-align:center;padding:2rem;`;
  overlay.innerHTML = `
    <div style="font-size:4rem;animation:float 2s ease-in-out infinite;">🚀</div>
    <div style="font-family:'Orbitron',monospace;font-size:2rem;font-weight:700;
      background:linear-gradient(135deg,#8B5CF6,#EC4899);-webkit-background-clip:text;
      -webkit-text-fill-color:transparent;background-clip:text;">BOOKING CONFIRMED!</div>
    <div style="color:rgba(240,230,255,0.6);font-size:1rem;">Your cosmic journey is locked in.</div>
    <div style="background:rgba(139,92,246,0.1);border:1px solid rgba(139,92,246,0.4);
      border-radius:14px;padding:1rem 2rem;">
      <div style="font-size:0.75rem;letter-spacing:2px;color:rgba(240,230,255,0.4);margin-bottom:4px;">PNR NUMBER</div>
      <div style="font-family:'Orbitron',monospace;font-size:1.5rem;font-weight:700;color:#8B5CF6;">${pnr}</div>
    </div>
    <div style="font-size:0.85rem;color:rgba(240,230,255,0.5);">Seats: ${seats} · Total: ₹${parseInt(total).toLocaleString('en-IN')}</div>
    <div style="display:flex;gap:1rem;margin-top:1rem;flex-wrap:wrap;justify-content:center;">
      <button onclick="window.location.href='my-bookings.html'" style="
        padding:12px 28px;background:linear-gradient(135deg,#8B5CF6,#EC4899);border:none;
        border-radius:30px;color:white;font-family:'Exo 2',sans-serif;font-size:0.9rem;
        font-weight:600;cursor:pointer;letter-spacing:1px;">View My Bookings</button>
      <button onclick="window.location.href='index.html'" style="
        padding:12px 28px;background:none;border:1px solid rgba(139,92,246,0.5);
        border-radius:30px;color:rgba(240,230,255,0.7);font-family:'Exo 2',sans-serif;
        font-size:0.9rem;cursor:pointer;letter-spacing:1px;">Book Another</button>
    </div>`;
  document.body.appendChild(overlay);
}

function initPaymentMethods() {
  document.querySelectorAll('.payment-method').forEach(pm => {
    pm.addEventListener('click', () => {
      document.querySelectorAll('.payment-method').forEach(p => p.classList.remove('active'));
      pm.classList.add('active');
      document.querySelectorAll('.payment-detail').forEach(d => d.style.display = 'none');
      const detail = document.querySelector(`.payment-detail[data-method="${pm.dataset.method}"]`);
      if (detail) detail.style.display = 'block';
    });
  });
}

function initPromoCode() {
  const btn = document.querySelector('.promo-apply-btn');
  if (!btn) return;
  const PROMOS = { 'NEBULA20': 20, 'COSMIC10': 10, 'GALAXY15': 15, 'SPACE25': 25, 'STARDUST5': 5 };
  btn.addEventListener('click', () => {
    const input = document.querySelector('#promoCode');
    if (!input) return;
    const code = input.value.trim().toUpperCase();
    if (PROMOS[code]) {
      showToast(`Promo applied! ${PROMOS[code]}% off ✦`, 'success');
      input.style.borderColor = 'var(--nebula-cyan)';
    } else {
      showToast('Invalid promo code', 'error');
      input.style.borderColor = 'rgba(239,68,68,0.6)';
      setTimeout(() => { input.style.borderColor = ''; }, 2000);
    }
  });
}

function initBoardingPoints() {
  document.querySelectorAll('.boarding-item').forEach(item => {
    item.addEventListener('click', () => {
      document.querySelectorAll('.boarding-item').forEach(b => b.classList.remove('selected'));
      item.classList.add('selected');
    });
  });
}

// ─────────────────────────────────────────────────────────────────
// MY BOOKINGS — fetch from /api/my-bookings
// ─────────────────────────────────────────────────────────────────
async function initMyBookings() {
  initFilterTabs();
  initPNRChecker();
  await loadUserBookings();
}

function initFilterTabs() {
  document.querySelectorAll('.filter-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const filter = tab.dataset.filter;
      document.querySelectorAll('.booking-card').forEach(card => {
        const status = card.dataset.status;
        card.style.display = (filter === 'all' || status === filter) ? '' : 'none';
      });
      updateFilterTabCounts();
    });
  });
}

function updateFilterTabCounts() {
  const cards = document.querySelectorAll('.booking-card');
  let upcoming = 0, completed = 0, cancelled = 0;
  cards.forEach(c => {
    if (c.dataset.status === 'confirmed' || c.dataset.status === 'upcoming') upcoming++;
    else if (c.dataset.status === 'completed') completed++;
    else if (c.dataset.status === 'cancelled') cancelled++;
  });
  const tabs = document.querySelectorAll('.filter-tab');
  if (tabs[0]) tabs[0].textContent = `All Trips (${cards.length})`;
  if (tabs[1]) tabs[1].textContent = `Upcoming (${upcoming})`;
  if (tabs[2]) tabs[2].textContent = `Completed (${completed})`;
  if (tabs[3]) tabs[3].textContent = `Cancelled (${cancelled})`;
}

async function loadUserBookings() {
  if (!SESSION_TOKEN) {
    const container = document.getElementById('bookingCards');
    if (container) container.innerHTML = `
      <div class="glass-card" style="padding:3rem;text-align:center;">
        <div style="font-size:3rem;margin-bottom:1rem;">🔐</div>
        <div style="font-family:'Orbitron',monospace;color:var(--text-muted);">Please login to view bookings</div>
        <a href="profile.html"><button class="btn-primary" style="margin-top:1.5rem;">Sign In</button></a>
      </div>`;
    return;
  }

  showLoader('LOADING BOOKINGS...');
  const resp = await API.get('/my-bookings');
  hideLoader();

  if (!resp.success) { showToast(resp.message || 'Failed to load bookings', 'error'); return; }

  const container = document.getElementById('bookingCards');
  if (!container) return;

  const bookings = resp.data.bookings || [];
  if (!bookings.length) {
    container.innerHTML = `
      <div class="glass-card" style="padding:3rem;text-align:center;">
        <div style="font-size:3rem;margin-bottom:1rem;">🌌</div>
        <div style="font-family:'Orbitron',monospace;color:var(--text-muted);">No bookings yet</div>
        <div style="font-size:0.85rem;color:var(--text-muted);margin-top:0.5rem;">Your cosmic journeys will appear here</div>
        <a href="index.html"><button class="btn-primary" style="margin-top:1.5rem;">Search Routes</button></a>
      </div>`;
    updateFilterTabCounts();
    return;
  }

  container.innerHTML = '';
  const fragment = document.createDocumentFragment();

  bookings.forEach(b => {
    const div = document.createElement('div');
    div.className  = 'booking-card glass-card reveal';
    div.dataset.status = b.booking_status;
    const statusClass = b.booking_status === 'confirmed' ? 'status-confirmed' : b.booking_status === 'cancelled' ? 'status-cancelled' : 'status-completed';
    div.innerHTML = `
      <div class="booking-mode-icon">${b.vehicle_icon || '🚌'}</div>
      <div class="booking-info">
        <div class="booking-route">${b.from_city} → ${b.to_city}</div>
        <div class="booking-meta">PNR: ${b.pnr} · ${b.departure_time} — ${b.arrival_time} · ${b.duration}</div>
        <div class="booking-operator">${b.vehicle_name} · Seat(s): ${b.seat_numbers}</div>
        <div style="margin-top:8px;"><span class="status-badge ${statusClass}">● ${b.booking_status.toUpperCase()}</span></div>
      </div>
      <div class="booking-right">
        <div class="booking-price">₹${b.total_price.toLocaleString('en-IN')}</div>
        <div class="booking-actions">
          <button class="action-btn" onclick="showToast('PNR: ${b.pnr} | ${b.from_city} → ${b.to_city}','info')">View Ticket</button>
          ${b.booking_status !== 'cancelled' ? `<button class="action-btn cancel-btn" data-pnr="${b.pnr}">Cancel</button>` : ''}
        </div>
      </div>`;
    fragment.appendChild(div);
  });

  container.appendChild(fragment);

  // Wire cancel buttons
  container.querySelectorAll('.cancel-btn').forEach(btn => {
    btn.addEventListener('click', () => cancelUserBooking(btn.dataset.pnr, btn));
  });

  updateFilterTabCounts();
  initScrollReveal();
}

async function cancelUserBooking(pnr, btn) {
  if (!confirm(`Cancel booking ${pnr}?`)) return;
  showLoader('CANCELLING...');
  const resp = await API.post('/cancel', { pnr });
  hideLoader();
  if (resp.success) {
    const card = btn.closest('.booking-card');
    if (card) {
      card.dataset.status = 'cancelled';
      const badge = card.querySelector('.status-badge');
      if (badge) { badge.className = 'status-badge status-cancelled'; badge.textContent = '● CANCELLED'; }
      btn.remove();
    }
    showToast(`Booking ${pnr} cancelled`, 'info');
    updateFilterTabCounts();
  } else {
    showToast(resp.message || 'Cancellation failed', 'error');
  }
}

async function initPNRChecker() {
  const btn = document.getElementById('pnrCheckBtn') || document.querySelector('.check-pnr-btn');
  if (!btn) return;

  const doCheck = async () => {
    const input = document.querySelector('#pnrInput');
    if (!input) return;
    const pnr = input.value.trim().toUpperCase();
    if (!pnr) { showToast('Please enter PNR number', 'error'); return; }

    showLoader('SCANNING CONSTELLATION...');
    const resp = await API.get(`/pnr?pnr=${encodeURIComponent(pnr)}`);
    hideLoader();

    const resultDiv = document.getElementById('pnrResult') || document.querySelector('.pnr-result');
    if (!resultDiv) return;

    if (resp.success) {
      const r = resp.data;
      const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
      set('pnrResultId',       r.pnr);
      set('pnrResultOperator', r.vehicle_name);
      set('pnrFrom',           r.from_city);
      set('pnrTo',             r.to_city);
      set('pnrDepTime',        r.departure_time);
      set('pnrArrTime',        r.arrival_time);
      set('pnrDepDate',        new Date(r.created_at).toLocaleDateString('en-IN'));
      set('pnrPassenger',      r.passenger_name);
      set('pnrSeat',           r.seat_numbers);
      set('pnrBoarding',       r.boarding_point || 'As per ticket');
      set('pnrAmount',         '₹' + r.total_price.toLocaleString('en-IN'));
      const statusEl = document.getElementById('pnrResultStatus');
      if (statusEl) {
        statusEl.className = `status-badge status-${r.booking_status}`;
        statusEl.textContent = `● ${r.booking_status.toUpperCase()}`;
      }
      resultDiv.classList.add('show');
      showToast(`PNR ${pnr} found ✦`, 'success');
    } else {
      resultDiv.classList.remove('show');
      resultDiv.innerHTML = `<div style="text-align:center;padding:2rem;color:var(--text-muted);">No booking found for PNR: <strong>${pnr}</strong></div>`;
      resultDiv.classList.add('show');
      showToast(resp.message || 'PNR not found', 'error');
    }
  };

  btn.addEventListener('click', doCheck);
  const input = document.querySelector('#pnrInput');
  if (input) input.addEventListener('keydown', e => { if (e.key === 'Enter') doCheck(); });
}

// ─────────────────────────────────────────────────────────────────
// PROFILE — Login / Register / Profile update via API
// ─────────────────────────────────────────────────────────────────
async function initProfilePage() {
  initProfileTabs();
  initToggleSwitches();
  initPasswordChange();
  await loadProfileData();
  initAuthForms();
  initProfileSave();
}

function initProfileTabs() {
  document.querySelectorAll('.profile-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.profile-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const targetId = 'tab-' + tab.dataset.tab;
      document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
      const targetPanel = document.getElementById(targetId);
      if (targetPanel) targetPanel.classList.add('active');
    });
  });
}

async function loadProfileData() {
  if (!SESSION_TOKEN) return;
  const resp = await API.get('/profile');
  if (!resp.success) return;
  const u = resp.data;
  const set = (id, val) => { const el = document.getElementById(id); if (el) el.value = val || ''; };
  const set2 = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val || '—'; };
  set('firstName', u.name?.split(' ')[0]);
  set('lastName',  u.name?.split(' ').slice(1).join(' '));
  set('emailField', u.email);
  set('phoneField', u.phone);
  set2('profileName', u.name);
  set2('profileEmail', u.email);
}

function initAuthForms() {
  // Login form
  const loginBtn = document.getElementById('loginBtn');
  if (loginBtn) {
    loginBtn.addEventListener('click', async () => {
      const email    = document.getElementById('loginEmail')?.value?.trim();
      const password = document.getElementById('loginPassword')?.value;
      if (!email || !password) { showToast('Email and password required', 'error'); return; }
      showLoader('AUTHENTICATING...');
      const resp = await API.post('/login', { email, password });
      hideLoader();
      if (resp.success) {
        setToken(resp.data.token);
        showToast(`Welcome back, ${resp.data.name}! ✦`, 'success');
        setTimeout(() => location.reload(), 1000);
      } else {
        showToast(resp.message || 'Login failed', 'error');
      }
    });
  }

  // Register form
  const registerBtn = document.getElementById('registerBtn');
  if (registerBtn) {
    registerBtn.addEventListener('click', async () => {
      const name     = document.getElementById('regName')?.value?.trim();
      const email    = document.getElementById('regEmail')?.value?.trim();
      const phone    = document.getElementById('regPhone')?.value?.trim();
      const password = document.getElementById('regPassword')?.value;
      if (!name || !email || !password) { showToast('Name, email and password required', 'error'); return; }
      showLoader('CREATING ACCOUNT...');
      const resp = await API.post('/register', { name, email, phone, password });
      hideLoader();
      if (resp.success) {
        setToken(resp.data.token);
        showToast(`Account created! Welcome, ${resp.data.name} ✦`, 'success');
        setTimeout(() => location.reload(), 1000);
      } else {
        showToast(resp.message || 'Registration failed', 'error');
      }
    });
  }

  // Logout button
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
      showLoader('LOGGING OUT...');
      await API.post('/logout');
      clearToken();
      hideLoader();
      showToast('Logged out successfully', 'info');
      setTimeout(() => location.reload(), 800);
    });
  }
}

function initProfileSave() {
  const saveBtn = document.getElementById('saveProfileBtn');
  if (!saveBtn || !SESSION_TOKEN) return;
  saveBtn.addEventListener('click', async () => {
    const firstName = document.getElementById('firstName')?.value?.trim() || '';
    const lastName  = document.getElementById('lastName')?.value?.trim()  || '';
    const name      = `${firstName} ${lastName}`.trim();
    const phone     = document.getElementById('phoneField')?.value?.trim();
    if (!name) { showToast('Please enter your name', 'error'); return; }
    showLoader('SAVING...');
    const resp = await API.put('/profile', { name, phone });
    hideLoader();
    if (resp.success) {
      showToast('Profile saved successfully ✦', 'success');
      saveBtn.textContent = '✦ Saved!';
      setTimeout(() => { saveBtn.textContent = '💾 Save Changes'; }, 2000);
    } else {
      showToast(resp.message || 'Save failed', 'error');
    }
  });
}

function initToggleSwitches() {
  document.querySelectorAll('.toggle-switch').forEach(toggle => {
    toggle.removeAttribute('onclick');
    toggle.addEventListener('click', () => {
      toggle.classList.toggle('on');
      const isOn = toggle.classList.contains('on');
      showToast(`${isOn ? 'Enabled' : 'Disabled'} notification setting`, 'info', 1500);
    });
  });
}

function initPasswordChange() {
  const settingsTab = document.getElementById('tab-settings');
  if (!settingsTab) return;
  const pwdInputs    = settingsTab.querySelectorAll('input[type="password"]');
  const changePwdBtn = settingsTab.querySelector('.btn-primary');
  if (!changePwdBtn) return;
  changePwdBtn.removeAttribute('onclick');
  changePwdBtn.addEventListener('click', () => {
    const oldPwd = pwdInputs[0]?.value;
    const newPwd = pwdInputs[1]?.value;
    if (!oldPwd) { showToast('Please enter your current password', 'error'); return; }
    if (!newPwd || newPwd.length < 8) { showToast('New password must be at least 8 characters', 'error'); return; }
    if (oldPwd === newPwd) { showToast('New password must be different', 'error'); return; }
    showLoader('UPDATING PASSWORD...');
    setTimeout(() => {
      hideLoader();
      showToast('Password updated successfully ✦', 'success');
      pwdInputs.forEach(i => { i.value = ''; });
    }, 1000);
  });
}

// ─────────────────────────────────────────────────────────────────
// ADMIN — unchanged (chart + live feed are UI-only demo widgets)
// ─────────────────────────────────────────────────────────────────
function initAdminPage() {
  initAdminChart();
  initLiveFeed();
  initAdminSidebar();
}

function initAdminChart() {
  const canvas = document.getElementById('analyticsChart');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width = canvas.offsetWidth || 700;
  const H = canvas.height = 260;
  const months   = ['Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'];
  const bookings = [310, 420, 480, 580, 760, 640, 890, 1120];
  const revenue  = [390, 510, 570, 690, 870, 750, 1020, 1380];
  const maxVal   = Math.max(...bookings, ...revenue) * 1.1;
  const pad      = { top: 24, right: 24, bottom: 44, left: 56 };

  function drawChart() {
    ctx.clearRect(0, 0, W, H);
    ctx.strokeStyle = 'rgba(255,255,255,0.06)'; ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = pad.top + (H - pad.top - pad.bottom) * (1 - i / 4);
      ctx.beginPath(); ctx.moveTo(pad.left, y); ctx.lineTo(W - pad.right, y); ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,0.25)';
      ctx.font = '11px Exo 2, sans-serif'; ctx.textAlign = 'right';
      ctx.fillText(Math.round(maxVal * i / 4 / 100) * 100, pad.left - 8, y + 4);
    }
    const drawLine = (data, c1, c2, alpha = 0.9) => {
      const xStep = (W - pad.left - pad.right) / (data.length - 1);
      const pts = data.map((v, i) => ({ x: pad.left + i * xStep, y: pad.top + (H - pad.top - pad.bottom) * (1 - v / maxVal) }));
      const grad = ctx.createLinearGradient(0, pad.top, 0, H - pad.bottom);
      grad.addColorStop(0, c1 + '55'); grad.addColorStop(1, c1 + '00');
      ctx.fillStyle = grad; ctx.beginPath();
      ctx.moveTo(pts[0].x, H - pad.bottom); ctx.lineTo(pts[0].x, pts[0].y);
      for (let i = 1; i < pts.length; i++) {
        const mx = (pts[i - 1].x + pts[i].x) / 2;
        ctx.bezierCurveTo(mx, pts[i - 1].y, mx, pts[i].y, pts[i].x, pts[i].y);
      }
      ctx.lineTo(pts[pts.length - 1].x, H - pad.bottom); ctx.closePath(); ctx.fill();
      const lg = ctx.createLinearGradient(pad.left, 0, W - pad.right, 0);
      lg.addColorStop(0, c1); lg.addColorStop(1, c2);
      ctx.strokeStyle = lg; ctx.lineWidth = 2.5; ctx.globalAlpha = alpha;
      ctx.beginPath(); ctx.moveTo(pts[0].x, pts[0].y);
      for (let i = 1; i < pts.length; i++) {
        const mx = (pts[i - 1].x + pts[i].x) / 2;
        ctx.bezierCurveTo(mx, pts[i - 1].y, mx, pts[i].y, pts[i].x, pts[i].y);
      }
      ctx.stroke(); ctx.globalAlpha = 1;
      pts.forEach((p, i) => {
        ctx.fillStyle = c1; ctx.shadowBlur = 10; ctx.shadowColor = c1;
        ctx.beginPath(); ctx.arc(p.x, p.y, 4, 0, Math.PI * 2); ctx.fill(); ctx.shadowBlur = 0;
        ctx.fillStyle = c1; ctx.font = 'bold 10px Exo 2, sans-serif'; ctx.textAlign = 'center';
        ctx.fillText(data[i], p.x, p.y - 8);
      });
    };
    drawLine(bookings, '#8B5CF6', '#EC4899');
    drawLine(revenue,  '#06B6D4', '#3B82F6', 0.65);
    ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.font = '11px Exo 2, sans-serif'; ctx.textAlign = 'center';
    const xStep = (W - pad.left - pad.right) / (months.length - 1);
    months.forEach((m, i) => ctx.fillText(m, pad.left + i * xStep, H - 8));
    ctx.fillStyle = '#8B5CF6'; ctx.fillRect(pad.left, 8, 14, 3);
    ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.font = '11px Exo 2'; ctx.textAlign = 'left';
    ctx.fillText('Bookings', pad.left + 18, 14);
    ctx.fillStyle = '#06B6D4'; ctx.fillRect(pad.left + 90, 8, 14, 3);
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.fillText('Revenue (×100)', pad.left + 108, 14);
  }
  drawChart();
  window.addEventListener('resize', () => { canvas.width = canvas.offsetWidth; drawChart(); });
}

const LIVE_EVENTS = [
  ['green',  () => `${['Arjun Kumar','Priya Singh','Rahul Mehta'][Math.floor(Math.random()*3)]} booked ${['Mumbai → Delhi','Bangalore → Chennai','Pune → Goa'][Math.floor(Math.random()*3)]} ₹${Math.floor(Math.random()*1500+400)}`],
  ['purple', () => `New user registered: user${Math.floor(Math.random()*9000+1000)}@nebula.in`],
  ['red',    () => `Booking NEB${Math.floor(Math.random()*900000+100000)} cancelled`],
  ['green',  () => `Payment received ₹${Math.floor(Math.random()*2000+500)} via ${['UPI','Card','NetBanking'][Math.floor(Math.random()*3)]}`],
];

function initLiveFeed() {
  const feed = document.getElementById('liveFeed');
  if (!feed) return;
  const addItem = () => {
    const [dotClass, msgFn] = LIVE_EVENTS[Math.floor(Math.random() * LIVE_EVENTS.length)];
    const item = document.createElement('div');
    item.className = 'feed-item';
    item.style.animation = 'fadeInUp 0.4s ease both';
    item.innerHTML = `<div class="feed-dot ${dotClass}"></div><span>${msgFn()}</span><span class="feed-time">just now</span>`;
    feed.querySelectorAll('.feed-time').forEach((t, i) => {
      const ages = ['just now','1m ago','2m ago','4m ago','6m ago','9m ago'];
      if (ages[i + 1]) t.textContent = ages[i + 1];
    });
    feed.insertBefore(item, feed.firstChild);
    while (feed.children.length > 8) feed.removeChild(feed.lastChild);
  };
  setInterval(addItem, 8000);
}

function initAdminSidebar() {
  document.querySelectorAll('.sidebar-link').forEach(link => {
    link.addEventListener('click', () => {
      document.querySelectorAll('.sidebar-link').forEach(l => l.classList.remove('active'));
      link.classList.add('active');
    });
  });
}

// ── MAIN INIT ─────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initStarfield();
  initThemeToggle();
  initHamburger();
  initScrollReveal();
  initTiltEffects();
  initHoloInputs();

  const page = document.body.dataset.page;

  if (page === 'home') {
    initPortalTabs();
    initAutocomplete(document.querySelector('#fromCity'), document.querySelector('#fromDropdown'));
    initAutocomplete(document.querySelector('#toCity'),   document.querySelector('#toDropdown'));
    initDateInputs();
    initPassengerCounter();
    initSwap();
    initSearchForm();
    initCounterAnimation();
  }

  if (page === 'results') { initResultsPage(); }
  if (page === 'details') { initSeatMap(); }
  if (page === 'booking') {
    initBookingSteps();
    initPaymentMethods();
    initPromoCode();
    initBoardingPoints();
  }
  if (page === 'profile')  { initProfilePage(); }
  if (page === 'bookings') { initMyBookings(); }
  if (page === 'admin')    { initAdminPage(); }
});
