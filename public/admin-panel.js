"use strict";

/* ── STATE ── */
let allOrders = [];
let allCustomers = [];
let allInventory = [];

let activeFilter = "all";
let activePeriod = "30";

const SESSION_KEY = "gh_admin_secret";

/* ── DOM HELPERS ── */
function $(id) { return document.getElementById(id); }

function esc(s) {
  return String(s ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function showToast(msg) {
  const el = $("toast");
  if (!el) return;
  el.textContent = msg;
  el.classList.add("show");
  setTimeout(() => el.classList.remove("show"), 2500);
}

function getSecret() {
  return sessionStorage.getItem(SESSION_KEY) || "";
}

function setSecret(v) {
  sessionStorage.setItem(SESSION_KEY, v);
}

function clearSecret() {
  sessionStorage.removeItem(SESSION_KEY);
}

function calcTotal(o) {
  if (o?.total) return +o.total;
  return (o?.items || []).reduce((s, i) => s + (i.price || 0) * (i.qty || i.quantity || 1), 0);
}

function formatDate(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  return (
    d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) +
    "  " +
    d.toTimeString().slice(0, 5)
  );
}

function filterByPeriod(orders) {
  if (activePeriod === "all") return orders;
  const cutoff = Date.now() - Number(activePeriod) * 86400000;
  return orders.filter(o => o.createdAt ? new Date(o.createdAt).getTime() >= cutoff : false);
}

/* ── FETCH HELPERS ── */
async function fetchJsonGET(url, secret) {
  const res = await fetch(url, {
    method: "GET",
    headers: { "x-admin-secret": secret }
  });

  if (res.status === 403) {
    const err = new Error("Forbidden");
    err.status = 403;
    throw err;
  }
  if (!res.ok) {
    const err = new Error(`Request failed: ${res.status}`);
    err.status = res.status;
    throw err;
  }
  return res.json();
}

async function fetchJsonPOST(url, secret, bodyObj) {
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-admin-secret": secret
    },
    body: JSON.stringify(bodyObj || {})
  });

  if (res.status === 403) {
    const err = new Error("Forbidden");
    err.status = 403;
    throw err;
  }
  if (!res.ok) {
    const err = new Error(`Request failed: ${res.status}`);
    err.status = res.status;
    throw err;
  }
  return res.json().catch(() => ({}));
}

/* ── AUTH ── */
function showLogin() {
  $("login-screen")?.classList.remove("hidden");
  $("login-error")?.classList.remove("show");
}

function hideLogin() {
  $("login-screen")?.classList.add("hidden");
  $("login-error")?.classList.remove("show");
}

async function doLogin() {
  console.log("🔵 doLogin called");
  const input = $("psw-input");
  const err = $("login-error");
  const btn = $("login-btn");
  if (!input || !err || !btn) return;

  err.classList.remove("show");
  btn.disabled = true;
  btn.textContent = "Checking…";

  const secret = input.value;

  try {
    const data = await fetchJsonGET("/api/admin/orders", secret);
    console.log("✅ Orders loaded:", data.orders?.length);

    setSecret(secret);
    allOrders = data.orders || [];

    hideLogin();
    showToast(`Welcome — ${allOrders.length} orders loaded`);

    renderOrders();
    renderAnalytics();
  } catch (e) {
    console.error("❌ Login error:", e);
    input.value = "";
    err.textContent =
      e.status === 403 ? "Incorrect password. Please try again."
      : "Server error. Check Firebase credentials.";
    err.classList.add("show");
  } finally {
    btn.disabled = false;
    btn.textContent = "Sign In";
  }
}

function doLogout() {
  clearSecret();
  allOrders = [];
  allCustomers = [];
  allInventory = [];
  showLogin();
  const inp = $("psw-input");
  if (inp) inp.value = "";
  showToast("Logged out");
}

/* ── LOADERS ── */
async function loadOrders() {
  const secret = getSecret();
  if (!secret) return showLogin();

  try {
    const data = await fetchJsonGET("/api/admin/orders", secret);
    allOrders = data.orders || [];
    renderOrders();
    renderAnalytics();
    showToast(`Orders refreshed — ${allOrders.length} total`);
  } catch (e) {
    if (e.status === 403) {
      doLogout();
      return;
    }
    showToast(`Error loading orders`);
  }
}

async function loadCustomers() {
  const secret = getSecret();
  if (!secret) return showLogin();

  try {
    const data = await fetchJsonGET("/api/admin/customers", secret);
    allCustomers = data.customers || [];
    renderCustomers();
    showToast(`Customers refreshed — ${allCustomers.length} total`);
  } catch (e) {
    if (e.status === 403) return doLogout();
    showToast(`Error loading customers`);
  }
}

async function loadInventory() {
  const secret = getSecret();
  if (!secret) return showLogin();

  const subtitle = $("inventory-subtitle");
  if (subtitle) subtitle.textContent = "Loading…";

  try {
    const data = await fetchJsonGET("/api/admin/inventory", secret);
    allInventory = data.inventory || [];
    renderInventory(data.summary || {});
    if (subtitle) subtitle.textContent = `${allInventory.length} products`;
    showToast("Inventory loaded");
  } catch (e) {
    if (subtitle) subtitle.textContent = "Error";
    if (e.status === 403) return doLogout();
    showToast(`Error loading inventory`);
  }
}

/* ── UPDATE STATUS ── */
async function updateStatus(orderId, status) {
  const secret = getSecret();
  if (!secret) return showLogin();

  const o = allOrders.find(x => x.id === orderId);
  if (o) o.status = status;
  renderOrders();

  try {
    await fetchJsonPOST("/api/admin/update-status", secret, { orderId, status });
    showToast(`Status: ${status}`);
  } catch (e) {
    if (e.status === 403) return doLogout();
    showToast(`Update failed`);
  }
}

/* ── TABS ── */
function showTab(tab) {
  document.querySelectorAll(".tab-page").forEach(p => p.classList.remove("active"));
  document.querySelectorAll(".nav-item").forEach(b => b.classList.remove("active"));

  $(`tab-${tab}`)?.classList.add("active");
  $(`nav-${tab}`)?.classList.add("active");

  if (tab === "analytics") renderAnalytics();
  if (tab === "customers" && allCustomers.length === 0) loadCustomers();
  if (tab === "inventory" && allInventory.length === 0) loadInventory();
}

/* ── FILTERS / PERIOD ── */
function setFilter(filter) {
  activeFilter = filter;
  document.querySelectorAll(".filter-tab").forEach(b => b.classList.remove("active"));
  document.querySelector(`.filter-tab[data-filter="${filter}"]`)?.classList.add("active");
  renderOrders();
}

function setPeriod(period) {
  activePeriod = period;
  document.querySelectorAll(".period-btn").forEach(b => b.classList.remove("active"));
  document.querySelector(`.period-btn[data-period="${period}"]`)?.classList.add("active");
  renderAnalytics();
}

/* ── RENDER: ORDERS ── */
function renderOrders() {
  console.log("📊 Rendering orders:", allOrders.length);
  const grid = $("orders-grid");
  if (!grid) return;

  const search = ($("search-input")?.value || "").toLowerCase();

  let filtered = allOrders.slice();
  if (activeFilter !== "all") filtered = filtered.filter(o => o.status === activeFilter);

  if (search) {
    filtered = filtered.filter(o => {
      const cust = o.customer || {};
      const custName = cust.name || o.customerName || "";
      const custPhone = cust.phone || o.customerPhone || "";
      const custAddress = cust.address || o.customerAddress || "";
      
      return (
        (o.shortId || "").toLowerCase().includes(search) ||
        custName.toLowerCase().includes(search) ||
        custPhone.toLowerCase().includes(search) ||
        custAddress.toLowerCase().includes(search)
      );
    });
  }

  $("order-count-label").textContent = `${allOrders.length} total orders`;
  ["all", "new", "confirmed", "delivered", "cancelled"].forEach(s => {
    const el = $(`badge-${s}`);
    if (!el) return;
    el.textContent = s === "all" ? allOrders.length : allOrders.filter(o => o.status === s).length;
  });

  if (!filtered.length) {
    grid.innerHTML = `<div class="section-card"><div class="section-sub">No orders found</div></div>`;
    return;
  }

  grid.innerHTML = filtered.map(o => {
    console.log("📦 Order data:", o);
    
    // FIXED: Support BOTH data structures
    const cust = o.customer || {};
    const custName = cust.name || o.customerName || "—";
    const custPhone = cust.phone || o.customerPhone || "—";
    const custAddress = cust.address || o.customerAddress || "—";
    const custNotes = cust.notes || o.customerNotes || o.note || "";
    
    console.log("👤 Customer:", { custName, custPhone, custAddress });
    
    const total = calcTotal(o);
    const shortId = o.shortId || String(o.id || "").slice(-6).toUpperCase();
    const phone = String(custPhone || "").replace(/\s/g, "").replace(/\+/g, "");

    const itemsRows = (o.items || []).map(i => {
      const qty = i.qty || i.quantity || 1;
      const itemName = i.name || i.productName || "Product";
      const itemPrice = i.price || i.priceEach || 0;
      
      console.log("🛒 Item:", { itemName, itemPrice, qty });
      
      return `<tr>
        <td class="item-name">${esc(qty)}x ${esc(itemName)}</td>
        <td class="item-price">€${(itemPrice * qty).toFixed(2)}</td>
      </tr>`;
    }).join("");

    const canConfirm = o.status !== "confirmed" && o.status !== "delivered" && o.status !== "cancelled";
    const canDeliver = o.status === "confirmed";
    const canCancel = o.status !== "cancelled" && o.status !== "delivered";

    const waMsg = encodeURIComponent(
      `✅ مرحباً ${custName}!\nتم تأكيد طلبك #${shortId} من مواسم الخير\nالمجموع: €${total.toFixed(2)}\nالدفع: عند الاستلام 💵\n\nشكراً لك! 🌿`
    );

    return `<div class="order-card">
      <div class="order-header">
        <div>
          <div class="order-id">#${esc(shortId)}</div>
          <div class="order-date">${esc(formatDate(o.createdAt))}</div>
        </div>
        <div style="font-size:12px;color:#666;font-weight:700;">${esc(o.status || "new")}</div>
      </div>

      <div class="order-body">
        <div style="display:flex;gap:12px;flex-wrap:wrap;margin-bottom:10px;font-size:12.5px;color:#555;">
          <div><strong>${esc(custName)}</strong></div>
          <div>${esc(custAddress)}</div>
          <div>${esc(custPhone)}</div>
          ${custNotes ? `<div>📝 ${esc(custNotes)}</div>` : ""}
        </div>

        <table class="items-table">${itemsRows}</table>
      </div>

      <div class="order-footer">
        <div class="order-total">
          <div class="total-label">Total</div>
          <div class="total-value">€${total.toFixed(2)}</div>
        </div>

        <div style="display:flex;gap:8px;flex-wrap:wrap;">
          ${phone && phone !== "—" ? `<button class="btn btn-whatsapp" data-wa="${esc(phone)}" data-msg="${esc(waMsg)}">WhatsApp</button>` : ``}
          ${phone && phone !== "—" ? `<button class="btn btn-phone" data-tel="${esc(phone)}">Call</button>` : ``}
          ${canConfirm ? `<button class="btn btn-confirm" data-action="confirm" data-id="${esc(o.id)}">✅ Confirm</button>` : ``}
          ${canDeliver ? `<button class="btn btn-deliver" data-action="deliver" data-id="${esc(o.id)}">📦 Delivered</button>` : ``}
          ${canCancel ? `<button class="btn btn-cancel" data-action="cancel" data-id="${esc(o.id)}">Cancel</button>` : ``}
        </div>
      </div>
    </div>`;
  }).join("");

  grid.onclick = (e) => {
    const btn = e.target.closest("button");
    if (!btn) return;

    if (btn.classList.contains("btn-whatsapp")) {
      const phone = btn.getAttribute("data-wa");
      const msg = btn.getAttribute("data-msg");
      window.open(`https://wa.me/${phone}?text=${msg}`, "_blank");
      return;
    }
    if (btn.classList.contains("btn-phone")) {
      const phone = btn.getAttribute("data-tel");
      window.open(`tel:${phone}`);
      return;
    }

    const id = btn.getAttribute("data-id");
    const action = btn.getAttribute("data-action");
    if (!id || !action) return;

    if (action === "confirm") updateStatus(id, "confirmed");
    if (action === "deliver") updateStatus(id, "delivered");
    if (action === "cancel") updateStatus(id, "cancelled");
  };
}

/* ── RENDER: ANALYTICS ── */
function renderAnalytics() {
  const orders = filterByPeriod(allOrders);
  const totalRev = orders.reduce((s, o) => s + calcTotal(o), 0);
  const delivered = orders.filter(o => o.status === "delivered").length;
  const rate = orders.length ? Math.round((delivered / orders.length) * 100) : 0;
  const avg = orders.length ? totalRev / orders.length : 0;

  $("a-revenue").textContent = `€${totalRev.toFixed(2)}`;
  $("a-orders").textContent = `${orders.length}`;
  $("a-avg").textContent = `€${avg.toFixed(2)}`;
  $("a-rate").textContent = `${rate}%`;

  buildTopProducts(orders);
  buildTopCustomers(orders);
}

function buildTopProducts(orders) {
  const pm = {};
  for (const o of orders) {
    for (const it of (o.items || [])) {
      const k = it.name || it.productName || "?";
      if (!pm[k]) pm[k] = { name: k, qty: 0, rev: 0 };
      const qty = it.qty || it.quantity || 1;
      const price = it.price || it.priceEach || 0;
      pm[k].qty += qty;
      pm[k].rev += price * qty;
    }
  }
  const sorted = Object.values(pm).sort((a, b) => b.rev - a.rev).slice(0, 50);

  $("top-products-body").innerHTML =
    sorted.map((p, i) => `<tr>
      <td class="cell-rank"><div class="rank-pill">${i + 1}</div></td>
      <td><span class="prod-name">${esc(p.name)}</span></td>
      <td>${p.qty}</td>
      <td class="rev-val">€${p.rev.toFixed(2)}</td>
    </tr>`).join("") ||
    `<tr><td colspan="4" style="padding:16px;color:#888;">No data</td></tr>`;
}

function buildTopCustomers(orders) {
  const cm = {};
  for (const o of orders) {
    const cust = o.customer || {};
    const k = cust.name || o.customerName || "Unknown";
    if (!cm[k]) cm[k] = { name: k, total: 0, count: 0, phone: cust.phone || o.customerPhone || "" };
    cm[k].total += calcTotal(o);
    cm[k].count++;
  }
  const sorted = Object.values(cm).sort((a, b) => b.total - a.total).slice(0, 200);

  $("customers-body").innerHTML =
    sorted.map((c, i) => `<tr>
      <td class="cell-rank"><div class="rank-pill">${i + 1}</div></td>
      <td><span class="prod-name">${esc(c.name)}</span></td>
      <td class="cell-mono">${esc(c.phone || "—")}</td>
      <td>${c.count} order${c.count !== 1 ? "s" : ""}</td>
      <td class="rev-val" style="text-align:right">€${c.total.toFixed(2)}</td>
    </tr>`).join("") ||
    `<tr><td colspan="5" style="padding:16px;color:#888;">No data</td></tr>`;
}

/* ── RENDER: CUSTOMERS TAB ── */
function renderCustomers() {
  $("customer-count-label").textContent = `${allCustomers.length} total customers`;
  const tbody = $("customers-table-body");
  if (!tbody) return;

  if (!allCustomers.length) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:40px;color:#999;">No customers yet</td></tr>`;
    return;
  }

  tbody.innerHTML = allCustomers.map((c, i) => {
    const phone = String(c.phone || "").replace(/\s/g, "").replace(/\+/g, "");
    const waMsg = encodeURIComponent(
      `مرحباً ${c.name || ""}!\n\nشكراً لك لكونك عميلاً عزيزاً في مواسم الخير! 🌿`
    );

    return `<tr>
      <td class="cell-rank"><div class="rank-pill">${i + 1}</div></td>
      <td><span class="prod-name">${esc(c.name || "Unknown")}</span></td>
      <td class="cell-mono">${esc(c.phone || "—")}</td>
      <td>${esc(c.address || "—")}</td>
      <td>${Number(c.orderCount || 0)} order${Number(c.orderCount || 0) !== 1 ? "s" : ""}</td>
      <td class="rev-val">€${Number(c.totalSpent || 0).toFixed(2)}</td>
      <td style="text-align:right">
        ${phone && phone !== "—" ? `<button class="btn btn-whatsapp" data-wa="${esc(phone)}" data-msg="${esc(waMsg)}" style="padding:6px 10px;font-size:11px;">Contact</button>` : ""}
      </td>
    </tr>`;
  }).join("");

  tbody.onclick = (e) => {
    const btn = e.target.closest("button");
    if (!btn) return;
    if (btn.classList.contains("btn-whatsapp")) {
      const phone = btn.getAttribute("data-wa");
      const msg = btn.getAttribute("data-msg");
      window.open(`https://wa.me/${phone}?text=${msg}`, "_blank");
    }
  };
}

/* ── RENDER: INVENTORY TAB ── */
function renderInventory(summary) {
  $("inv-total").textContent = summary.totalProducts || 0;
  $("inv-instock").textContent = summary.inStock || 0;
  $("inv-lowstock").textContent = summary.lowStock || 0;
  $("inv-outofstock").textContent = summary.outOfStock || 0;

  const tbody = $("inventory-table-body");
  if (!tbody) return;

  if (!allInventory.length) {
    tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;padding:40px;color:#999;">No products</td></tr>`;
    return;
  }

  tbody.innerHTML = allInventory.map((p, i) => {
    const stock = Number(p.stock || 0);
    const rp = Number(p.reorderPoint || 0);
    const status = p.status || (stock === 0 ? "out" : stock <= rp ? "low" : "ok");
    const statusEmoji = status === "out" ? "❌" : status === "critical" ? "🔴" : status === "low" ? "⚠️" : "✅";
    const statusText = status === "out" ? "Out of Stock" : status === "critical" ? "Critical" : status === "low" ? "Low" : "In Stock";
    const price = Number(p.price || 0).toFixed(2);

    return `<tr>
      <td style="color:#999;font-weight:600">${i + 1}</td>
      <td><div style="font-weight:700;color:#1A1A1A">${esc(p.name || "")}</div>
          <div style="font-size:11px;color:#999;margin-top:2px">${esc(p.unit || "")}</div></td>
      <td style="font-family:monospace;font-size:11px;color:#666">${esc(p.sku || "-")}</td>
      <td style="font-size:12px;color:#666">${esc(p.category || "-")}</td>
      <td style="font-weight:800">${stock}</td>
      <td><span style="font-size:16px">${statusEmoji}</span> <span style="font-size:12px;font-weight:600">${esc(statusText)}</span></td>
      <td style="font-weight:700">€${price}</td>
      <td style="text-align:right;color:#999">—</td>
    </tr>`;
  }).join("");
}

/* ── INIT / WIRE UI ── */
document.addEventListener("DOMContentLoaded", () => {
  console.log("✅ Admin panel JS loaded!");
  
  $("login-btn")?.addEventListener("click", doLogin);
  $("psw-input")?.addEventListener("keydown", (e) => { if (e.key === "Enter") doLogin(); });
  $("logout-btn")?.addEventListener("click", doLogout);

  document.querySelectorAll(".nav-item[data-tab]").forEach(btn => {
    btn.addEventListener("click", () => showTab(btn.getAttribute("data-tab")));
  });

  document.querySelectorAll(".period-btn").forEach(btn => {
    btn.addEventListener("click", () => setPeriod(btn.getAttribute("data-period")));
  });

  document.querySelectorAll(".filter-tab[data-filter]").forEach(btn => {
    btn.addEventListener("click", () => setFilter(btn.getAttribute("data-filter")));
  });

  $("orders-refresh-btn")?.addEventListener("click", loadOrders);
  $("customers-refresh-btn")?.addEventListener("click", loadCustomers);
  $("inventory-refresh-btn")?.addEventListener("click", loadInventory);

  $("search-input")?.addEventListener("input", renderOrders);

  const saved = getSecret();
  if (saved) {
    hideLogin();
    loadOrders();
  } else {
    showLogin();
  }
});