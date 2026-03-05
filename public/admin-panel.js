"use strict";

/* ── STATE ── */
var allOrders    = [];
var activeFilter = 'all';
var activePeriod = '30';
var timeSeg      = 'day';
var SESSION_KEY  = 'gh_admin_secret';

/* ── HELPERS ── */
function getSecret() { return sessionStorage.getItem(SESSION_KEY) || ''; }

function calcTotal(o) {
  if (o.total) return +o.total;
  return (o.items||[]).reduce(function(s,i){return s+(i.price||0)*(i.qty||i.quantity||1);},0);
}

function formatDate(iso) {
  if (!iso) return '—';
  var d = new Date(iso);
  return d.toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'})
    + '  ' + d.toTimeString().slice(0,5);
}

function showToast(msg) {
  var el = document.getElementById('toast');
  if (!el) return;
  el.textContent = msg; el.classList.add('show');
  setTimeout(function(){el.classList.remove('show');}, 2800);
}

function filterByPeriod(orders) {
  if (activePeriod === 'all') return orders;
  var cutoff = Date.now() - (+activePeriod) * 86400000;
  return orders.filter(function(o){ return o.createdAt ? new Date(o.createdAt) >= cutoff : false; });
}

/* ── AUTH ── */
function doLogin() {
  var input = document.getElementById('psw-input');
  var err   = document.getElementById('login-error');
  var btn   = document.getElementById('login-btn');
  if (!input || !err || !btn) return;

  err.classList.remove('show');
  input.classList.remove('error');
  btn.classList.add('loading');
  btn.innerHTML = '<div class="spinner" style="width:16px;height:16px;border-width:2px;border-color:rgba(255,255,255,.3);border-top-color:#fff"></div> Checking…';

  fetch('/api/admin/orders', { headers: { 'x-admin-secret': input.value } })
    .then(function(res) {
      if (res.ok) {
        return res.json().then(function(data) {
          sessionStorage.setItem(SESSION_KEY, input.value);
          allOrders = data.orders || [];
          var screen = document.getElementById('login-screen');
          screen.style.transition = 'opacity .4s ease';
          screen.style.opacity = '0';
          setTimeout(function() {
            screen.classList.add('hidden');
            renderOrders();
            renderAnalytics();
          }, 400);
        });
      } else {
        input.value = '';
        input.classList.add('error');
        document.getElementById('login-error-msg').textContent =
          res.status === 403 ? 'Incorrect password. Please try again.'
                             : 'Server error. Check Firebase credentials in Vercel.';
        err.classList.add('show');
        setTimeout(function(){input.classList.remove('error');}, 500);
        btn.classList.remove('loading');
        btn.innerHTML = '<svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg> Sign In';
        input.focus();
      }
    })
    .catch(function() {
      document.getElementById('login-error-msg').textContent = 'Connection error. Try again.';
      err.classList.add('show');
      btn.classList.remove('loading');
      btn.innerHTML = 'Sign In';
    });
}

function doLogout() {
  sessionStorage.removeItem(SESSION_KEY);
  allOrders = [];
  var screen = document.getElementById('login-screen');
  screen.classList.remove('hidden');
  screen.style.opacity = '0';
  screen.style.transition = 'none';
  requestAnimationFrame(function() {
    screen.style.transition = 'opacity .3s ease';
    screen.style.opacity = '1';
  });
  var inp = document.getElementById('psw-input');
  if (inp) inp.value = '';
  var err = document.getElementById('login-error');
  if (err) err.classList.remove('show');
}

function togglePsw() {
  var inp = document.getElementById('psw-input');
  var s   = document.getElementById('eye-show');
  var h   = document.getElementById('eye-hide');
  if (!inp || !s || !h) return;

  if (inp.type === 'password') { inp.type='text'; s.style.display='none'; h.style.display='block'; }
  else { inp.type='password'; s.style.display='block'; h.style.display='none'; }
}

/* ── LOAD ORDERS ── */
function loadOrders() {
  var secret = getSecret();
  if (!secret) return;
  var loading = document.getElementById('loading-indicator');
  var grid = document.getElementById('orders-grid');
  if (loading) loading.style.display = 'flex';
  if (grid) grid.innerHTML = '';

  fetch('/api/admin/orders', { headers: { 'x-admin-secret': secret } })
    .then(function(res) {
      if (res.status === 403) { sessionStorage.removeItem(SESSION_KEY); location.reload(); return null; }
      return res.json();
    })
    .then(function(data) {
      if (!data) return;
      allOrders = data.orders || [];
      renderOrders();
      renderAnalytics();
      showToast('Orders refreshed — ' + allOrders.length + ' total');
    })
    .catch(function(e) {
      showToast('Error: ' + e.message);
      if (loading) loading.style.display = 'none';
    });
}

/* ── UPDATE STATUS ── */
function updateStatus(id, status) {
  var secret = getSecret();
  var o = allOrders.find(function(x){ return x.id === id; });
  if (!o) return;
  o.status = status;
  renderOrders();
  renderAnalytics();

  fetch('/api/admin/update-status', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-admin-secret': secret },
    body: JSON.stringify({ orderId: id, status: status })
  })
  .then(function(res) {
    showToast(res.ok ? 'Status updated to: ' + status : 'Update failed — try refreshing');
  })
  .catch(function(){ showToast('Network error'); });
}

/* ── TABS & FILTERS ── */
function showTab(tab) {
  document.querySelectorAll('.tab-page').forEach(function(p){p.classList.remove('active');});
  document.querySelectorAll('.nav-item').forEach(function(b){b.classList.remove('active');});
  var tabEl = document.getElementById('tab-'+tab);
  var navEl = document.getElementById('nav-'+tab);
  if (tabEl) tabEl.classList.add('active');
  if (navEl) navEl.classList.add('active');

  if (tab === 'analytics') setTimeout(renderAnalytics, 50);
  if (tab === 'customers' && allCustomers.length === 0) loadCustomers();
  if (tab === 'inventory' && !window.inventoryLoaded) { loadInventory(); window.inventoryLoaded = true; }
}

function setFilter(filter, btn) {
  activeFilter = filter;
  document.querySelectorAll('.filter-tab').forEach(function(b){b.classList.remove('active');});
  if (btn) btn.classList.add('active');
  renderOrders();
}

function setPeriod(p, btn) {
  activePeriod = p;
  document.querySelectorAll('.period-btn').forEach(function(b){b.classList.remove('active');});
  if (btn) btn.classList.add('active');
  renderAnalytics();
}

function setTimeSeg(seg, btn) {
  timeSeg = seg;
  document.querySelectorAll('.seg-btn').forEach(function(b){b.classList.remove('active');});
  if (btn) btn.classList.add('active');
  buildChartTime(filterByPeriod(allOrders));
}

/* ── RENDER ORDERS ── */
function renderOrders() {
  var loading = document.getElementById('loading-indicator');
  if (loading) loading.style.display = 'none';

  var searchEl = document.getElementById('search-input');
  var search = (searchEl ? searchEl.value : '').toLowerCase();

  var filtered = allOrders;
  if (activeFilter !== 'all') filtered = filtered.filter(function(o){return o.status===activeFilter;});
  if (search) filtered = filtered.filter(function(o){
    return (o.shortId||'').toLowerCase().includes(search)
      || ((o.customer||{}).name||'').toLowerCase().includes(search)
      || ((o.customer||{}).phone||'').toLowerCase().includes(search)
      || ((o.customer||{}).address||'').toLowerCase().includes(search);
  });

  /* stats */
  var rev = allOrders.reduce(function(s,o){return s+calcTotal(o);},0);
  var el;
  el = document.getElementById('stat-revenue'); if (el) el.textContent  = '€'+rev.toFixed(2);
  el = document.getElementById('stat-new'); if (el) el.textContent      = allOrders.filter(function(o){return o.status==='new';}).length;
  el = document.getElementById('stat-confirmed'); if (el) el.textContent= allOrders.filter(function(o){return o.status==='confirmed';}).length;
  el = document.getElementById('stat-delivered'); if (el) el.textContent= allOrders.filter(function(o){return o.status==='delivered';}).length;

  ['all','new','confirmed','delivered','cancelled'].forEach(function(s){
    var b = document.getElementById('badge-'+s);
    if(b) b.textContent = s==='all'?allOrders.length:allOrders.filter(function(o){return o.status===s;}).length;
  });

  el = document.getElementById('order-count-label');
  if (el) el.textContent = allOrders.length + ' total orders';

  var grid = document.getElementById('orders-grid');
  if (!grid) return;

  if (!filtered.length) {
    grid.innerHTML = '<div class="empty-state"><div class="emoji">📋</div><h3>No orders found</h3><p>Orders from your shop appear here automatically.</p></div>';
    return;
  }

  var statusBadge = {
    new:       '<span class="status-badge new">🆕 New</span>',
    confirmed: '<span class="status-badge confirmed">✅ Confirmed</span>',
    delivered: '<span class="status-badge delivered">📦 Delivered</span>',
    cancelled: '<span class="status-badge cancelled">❌ Cancelled</span>'
  };

  grid.innerHTML = filtered.map(function(o, idx) {
    var cust   = o.customer || {};
    var total  = calcTotal(o);
    var shortId = o.shortId || o.id.slice(-6).toUpperCase();
    var phone  = (cust.phone||'').replace(/\s/g,'').replace(/\+/g,'');

    var itemRows = (o.items||[]).map(function(i){
      var qty = i.qty || i.quantity || 1;
      return '<tr><td class="item-name">'+qty+'x '+(i.name||'Product')+'</td>'
        +'<td class="item-price">€'+((i.price||0)*qty).toFixed(2)+'</td></tr>';
    }).join('');

    var waMsg = encodeURIComponent(
      '✅ مرحباً '+(cust.name||'')+'!\nتم تأكيد طلبك #'+shortId+' من مواسم الخير\nالمجموع: €'+total.toFixed(2)+'\nالدفع: عند الاستلام 💵\n\nشكراً لك! 🌿'
    );

    var actions = '';
    if (o.status!=='confirmed' && o.status!=='delivered')
      actions += "<button class=\"btn btn-confirm\" onclick=\"updateStatus('" + o.id + "','confirmed')\">✅ Confirm</button>";
    if (o.status==='confirmed')
      actions += "<button class=\"btn btn-deliver\" onclick=\"updateStatus('" + o.id + "','delivered')\">📦 Delivered</button>";
    if (o.status!=='cancelled' && o.status!=='delivered')
      actions += "<button class=\"btn btn-cancel\" onclick=\"updateStatus('" + o.id + "','cancelled')\">Cancel</button>";

    return '<div class="order-card" style="animation-delay:'+idx*0.04+'s">'
      +'<div class="order-header">'
        +'<div><div class="order-id">#'+shortId+'</div>'
        +'<div class="order-date">'+formatDate(o.createdAt)+'</div></div>'
        +(statusBadge[o.status]||statusBadge.new)
      +'</div>'
      +'<div class="order-body">'
        +'<div class="customer-info">'
          +'<div class="field"><strong>'+(cust.name||'—')+'</strong></div>'
          +'<div class="field">'+(cust.address||'—')+'</div>'
          +'<div class="field">'+(cust.phone||'—')+'</div>'
          +(cust.notes?'<div class="field">📝 '+cust.notes+'</div>':'')
        +'</div>'
        +'<table class="items-table">'+itemRows+'</table>'
      +'</div>'
      +'<div class="order-footer">'
        +'<div class="order-total"><div class="total-label">Total</div><div class="total-value">€'+total.toFixed(2)+'</div></div>'
        +'<div class="order-actions">'
          + "<button class=\"btn btn-invoice\" style=\"background:var(--white);color:var(--green-mid);border:1px solid var(--stroke)\" onclick=\"generateInvoice('" + o.id + "')\">"
            +'<svg fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>'
            +'Invoice</button>'
          + (phone ? "<button class=\"btn btn-whatsapp\" onclick=\"window.open('https://wa.me/" + phone + "?text=" + waMsg + "','_blank')\">" : "")
            +'<svg fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/></svg>'
            +(phone ? 'WhatsApp</button>' : '')
          + (phone ? "<button class=\"btn btn-phone\" onclick=\"window.open('tel:" + phone + "')\">" : "")
            +'<svg fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.36 12 19.79 19.79 0 0 1 1.21 3.18 2 2 0 0 1 3.18 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.15a16 16 0 0 0 8 8l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 24 17z"/></svg>'
            +(phone ? 'Call</button>' : '')
          + actions
        +'</div>'
      +'</div>'
    +'</div>';
  }).join('');
}

/* ── ANALYTICS ── */
function renderAnalytics() {
  var orders = filterByPeriod(allOrders);
  var totalRev = orders.reduce(function(s,o){return s+calcTotal(o);},0);
  var delivered = orders.filter(function(o){return o.status==='delivered';}).length;
  var rate = orders.length ? Math.round(delivered/orders.length*100) : 0;
  var avg  = orders.length ? totalRev/orders.length : 0;
  var totalItems = orders.reduce(function(s,o){
    return s+(o.items||[]).reduce(function(si,i){return si+(i.qty||i.quantity||1);},0);
  },0);
  var seen={};
  orders.forEach(function(o){if((o.customer||{}).name)seen[(o.customer).name]=1;});

  document.getElementById('a-revenue').textContent  = '€'+totalRev.toFixed(2);
  document.getElementById('a-orders').textContent   = orders.length;
  document.getElementById('a-avg').textContent      = '€'+avg.toFixed(2);
  document.getElementById('a-rate').textContent     = rate+'%';
  document.getElementById('kpi-items').textContent  = totalItems;
  document.getElementById('kpi-customers').textContent = Object.keys(seen).length;

  var prodMap={};
  orders.forEach(function(o){
    (o.items||[]).forEach(function(it){
      var k=it.name||'?';
      prodMap[k]=(prodMap[k]||0)+(it.qty||it.quantity||1);
    });
  });
  var top=Object.entries(prodMap).sort(function(a,b){return b[1]-a[1];})[0];
  document.getElementById('kpi-top-product').textContent = top?top[0]:'—';

  buildChartTime(orders);
  buildTopProducts(orders, totalRev);
  buildTopCustomers(orders);
}

/* NOTE: keep your existing buildChartTime, buildTopProducts, drawBarChart, inventory, invoice, etc.
   (If you want, paste the rest of your JS and I’ll merge it cleanly into this file.)
*/

/* ── CUSTOMERS TAB ── */
var allCustomers = [];

function loadCustomers() {
  var secret = getSecret();
  if (!secret) return;

  fetch('/api/admin/customers', { headers: { 'x-admin-secret': secret } })
    .then(function(res) {
      if (res.status === 403) { sessionStorage.removeItem(SESSION_KEY); location.reload(); return null; }
      return res.json();
    })
    .then(function(data) {
      if (!data) return;
      allCustomers = data.customers || [];
      renderCustomers();
      showToast('Customers refreshed — ' + allCustomers.length + ' total');
    })
    .catch(function(e) {
      showToast('Error: ' + e.message);
    });
}

function renderCustomers() {
  var tbody = document.getElementById('customers-table-body');
  document.getElementById('customer-count-label').textContent = allCustomers.length + ' total customers';

  if (allCustomers.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:40px;color:var(--text-light)">No customers yet</td></tr>';
    return;
  }

  tbody.innerHTML = allCustomers.map(function(c, i) {
    var phone = (c.phone || '').replace(/\s/g, '').replace(/\+/g, '');
    var waMsg = encodeURIComponent(
      'مرحباً ' + c.name + '!\n\nشكراً لك لكونك عميلاً عزيزاً في مواسم الخير! 🌿\n\nنتمنى أن تكون استمتعت بطلباتك. أخبرنا إذا كنت بحاجة لأي شيء!'
    );

    return '<tr>'
      + '<td class="cell-rank"><div class="rank-pill">' + (i + 1) + '</div></td>'
      + '<td><span class="prod-name">' + (c.name || 'Unknown') + '</span></td>'
      + '<td class="cell-mono">' + (c.phone || '—') + '</td>'
      + '<td>' + (c.address || '—') + '</td>'
      + '<td>' + c.orderCount + ' order' + (c.orderCount !== 1 ? 's' : '') + '</td>'
      + '<td class="rev-val">€' + c.totalSpent.toFixed(2) + '</td>'
      + '<td style="text-align:right">'
        + "<button class=\"btn btn-whatsapp\" style=\"font-size:11px;padding:6px 10px\" onclick=\"window.open('https://wa.me/" + phone + "?text=" + waMsg + "','_blank')\">"
          + ' Contact'
        + '</button>'
      + '</td>'
    + '</tr>';
  }).join('');
}

/* ── INIT ── */
var loadingIndicator = document.getElementById('loading-indicator');
if (loadingIndicator) loadingIndicator.style.display = 'none';

var saved = sessionStorage.getItem(SESSION_KEY);
if (saved) {
  document.getElementById('login-screen').classList.add('hidden');
  loadOrders();
}

/* ---- Expose functions for inline onclick handlers ---- */
window.doLogin = doLogin;
window.doLogout = doLogout;
window.togglePsw = togglePsw;
window.showTab = showTab;
window.setFilter = setFilter;
window.setPeriod = setPeriod;
window.setTimeSeg = setTimeSeg;
window.loadOrders = loadOrders;
window.updateStatus = updateStatus;
window.loadCustomers = loadCustomers;
window.renderCustomers = renderCustomers;
window.renderOrders = renderOrders;
window.renderAnalytics = renderAnalytics;