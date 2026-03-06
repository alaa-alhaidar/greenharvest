 console.log("✅ Admin Panel JavaScript v3.0 Loading...");

let allOrders = [];
let allCustomers = [];
let allInventory = [];
let activeFilter = "all";
let activePeriod = "30";
const SESSION_KEY = "gh_admin_secret";

function $(id) { return document.getElementById(id); }

function esc(s) {
  return String(s ?? "").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;");
}

function showToast(msg) {
  const el = $("toast");
  if (!el) return;
  el.textContent = msg;
  el.classList.add("show");
  setTimeout(() => el.classList.remove("show"), 2500);
}

function getSecret() { return sessionStorage.getItem(SESSION_KEY) || ""; }
function setSecret(v) { sessionStorage.setItem(SESSION_KEY, v); }
function clearSecret() { sessionStorage.removeItem(SESSION_KEY); }

function calcTotal(o) {
  if (o?.total) return +o.total;
  return (o?.items || []).reduce((s,i) => s + (i.price||0) * (i.qty||i.quantity||1), 0);
}

function formatDate(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString("en-GB",{day:"2-digit",month:"short",year:"numeric"}) + "  " + d.toTimeString().slice(0,5);
}

function filterByPeriod(orders) {
  if (activePeriod === "all") return orders;
  const cutoff = Date.now() - Number(activePeriod) * 86400000;
  return orders.filter(o => o.createdAt ? new Date(o.createdAt).getTime() >= cutoff : false);
}

async function fetchJSON(url, method, secret, body) {
  const opts = {
    method,
    headers: { "x-admin-secret": secret }
  };
  if (body) {
    opts.headers["Content-Type"] = "application/json";
    opts.body = JSON.stringify(body);
  }
  const res = await fetch(url, opts);
  if (res.status === 403) { const err = new Error("Forbidden"); err.status = 403; throw err; }
  if (!res.ok) { const err = new Error("Request failed: " + res.status); err.status = res.status; throw err; }
  return res.json().catch(() => ({}));
}

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

  try {
    const data = await fetchJSON("/api/admin/orders", "GET", input.value);
    console.log("✅ Orders loaded:", data.orders?.length);

    setSecret(input.value);
    allOrders = data.orders || [];

    hideLogin();
    showToast(`Welcome — ${allOrders.length} orders loaded`);

    renderOrders();
    renderAnalytics();
  } catch (e) {
    console.error("❌ Login error:", e);
    input.value = "";
    err.textContent = e.status === 403 ? "Incorrect password." : "Server error.";
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
  $("psw-input").value = "";
  showToast("Logged out");
}

async function loadOrders() {
  const secret = getSecret();
  if (!secret) return showLogin();

  try {
    const data = await fetchJSON("/api/admin/orders", "GET", secret);
    allOrders = data.orders || [];
    renderOrders();
    renderAnalytics();
    showToast(`Orders refreshed — ${allOrders.length} total`);
  } catch (e) {
    if (e.status === 403) { doLogout(); return; }
    showToast("Error loading orders");
  }
}

async function loadCustomers() {
  const secret = getSecret();
  if (!secret) return showLogin();

  try {
    const data = await fetchJSON("/api/admin/customers", "GET", secret);
    allCustomers = data.customers || [];
    renderCustomers();
    showToast(`Customers refreshed — ${allCustomers.length} total`);
  } catch (e) {
    if (e.status === 403) return doLogout();
    showToast("Error loading customers");
  }
}

async function loadInventory() {
  const secret = getSecret();
  if (!secret) return showLogin();

  const subtitle = $("inventory-subtitle");
  if (subtitle) subtitle.textContent = "Loading…";

  try {
    const data = await fetchJSON("/api/admin/inventory", "GET", secret);
    allInventory = data.inventory || [];
    renderInventory(data.summary || {});
    if (subtitle) subtitle.textContent = `${allInventory.length} products`;
    showToast("Inventory loaded");
  } catch (e) {
    if (subtitle) subtitle.textContent = "Error";
    if (e.status === 403) return doLogout();
    showToast("Error loading inventory");
  }
}

async function updateStatus(orderId, status) {
  const secret = getSecret();
  if (!secret) return showLogin();

  const o = allOrders.find(x => x.id === orderId);
  if (o) o.status = status;
  renderOrders();
  renderAnalytics();

  try {
    await fetchJSON("/api/admin/update-status", "POST", secret, { orderId, status });
    showToast(`Status: ${status}`);
  } catch (e) {
    if (e.status === 403) return doLogout();
    showToast("Update failed");
  }
}

async function generateInvoice(orderId) {
  const secret = getSecret();
  if (!secret) return showLogin();

  showToast("Generating invoice...");

  try {
    const res = await fetch("/api/admin/generate-invoice", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-admin-secret": secret
      },
      body: JSON.stringify({ orderId })
    });

    if (!res.ok) throw new Error("Failed");

    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `MawasemAlKhair-Invoice-${orderId.slice(-6).toUpperCase()}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    showToast("Invoice downloaded!");
  } catch (e) {
    if (e.status === 403) return doLogout();
    showToast("Invoice generation failed");
  }
}

function showTab(tab) {
  document.querySelectorAll(".tab-page").forEach(p => p.classList.remove("active"));
  document.querySelectorAll(".nav-item").forEach(b => b.classList.remove("active"));

  $(`tab-${tab}`)?.classList.add("active");
  $(`nav-${tab}`)?.classList.add("active");

  if (tab === "analytics") renderAnalytics();
  if (tab === "customers" && allCustomers.length === 0) loadCustomers();
  if (tab === "inventory" && allInventory.length === 0) loadInventory();
}

function setFilter(filter, btn) {
  activeFilter = filter;
  document.querySelectorAll(".filter-tab").forEach(b => b.classList.remove("active"));
  btn?.classList.add("active");
  renderOrders();
}

function setPeriod(period, btn) {
  activePeriod = period;
  document.querySelectorAll(".period-btn").forEach(b => b.classList.remove("active"));
  btn?.classList.add("active");
  renderAnalytics();
}

function renderOrders() {
  console.log("📊 Rendering orders:", allOrders.length);
  
  const grid = $("orders-grid");
  const loading = $("loading-indicator");
  if (!grid) return;

  if (loading) loading.style.display = "none";

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

  // Update stats
  const totalRev = allOrders.reduce((s, o) => s + calcTotal(o), 0);
  $("stat-revenue").textContent = "€" + totalRev.toFixed(2);
  $("stat-new").textContent = allOrders.filter(o => o.status === "new").length;
  $("stat-confirmed").textContent = allOrders.filter(o => o.status === "confirmed").length;
  $("stat-delivered").textContent = allOrders.filter(o => o.status === "delivered").length;

  ["all","new","confirmed","delivered","cancelled"].forEach(s => {
    const el = $(`badge-${s}`);
    if (!el) return;
    el.textContent = s === "all" ? allOrders.length : allOrders.filter(o => o.status === s).length;
  });

  $("order-count-label").textContent = `${allOrders.length} total orders`;

  if (!filtered.length) {
    grid.innerHTML = `<div class="empty-state"><div class="emoji">📋</div><h3>No orders found</h3></div>`;
    return;
  }

  grid.innerHTML = filtered.map(o => {
    // FIXED: Handle both data structures
    const cust = o.customer || {};
    const custName = cust.name || o.customerName || "—";
    const custPhone = cust.phone || o.customerPhone || "—";
    const custAddress = cust.address || o.customerAddress || "—";
    const custNotes = cust.notes || o.customerNotes || o.note || "";
    
    const total = calcTotal(o);
    const shortId = o.shortId || String(o.id || "").slice(-6).toUpperCase();
    const phone = String(custPhone || "").replace(/\s/g, "").replace(/\+/g, "");

    const itemsRows = (o.items || []).map(i => {
      const qty = i.qty || i.quantity || 1;
      const itemName = i.name || i.productName || "Product";
      const itemPrice = i.price || i.priceEach || 0;
      
      return `<tr>
        <td class="item-name">${esc(qty)}x ${esc(itemName)}</td>
        <td class="item-price">€${(itemPrice * qty).toFixed(2)}</td>
      </tr>`;
    }).join("");

    const statusBadge = {
      new: `<span class="status-badge new">🆕 New</span>`,
      confirmed: `<span class="status-badge confirmed">✅ Confirmed</span>`,
      delivered: `<span class="status-badge delivered">📦 Delivered</span>`,
      cancelled: `<span class="status-badge cancelled">❌ Cancelled</span>`
    };

    const waMsg = encodeURIComponent(
      `✅ مرحباً ${custName}!\nتم تأكيد طلبك #${shortId} من مواسم الخير\nالمجموع: €${total.toFixed(2)}\nالدفع: عند الاستلام 💵\n\nشكراً لك! 🌿`
    );

    return `<div class="order-card">
      <div class="order-header">
        <div>
          <div class="order-id">#${esc(shortId)}</div>
          <div class="order-date">${esc(formatDate(o.createdAt))}</div>
        </div>
        ${statusBadge[o.status] || statusBadge.new}
      </div>

      <div class="order-body">
        <div class="customer-info">
          <div class="field">
            <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            <strong>${esc(custName)}</strong>
          </div>
          <div class="field">
            <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
            ${esc(custAddress)}
          </div>
          <div class="field">
            <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.36 12 19.79 19.79 0 0 1 1.21 3.18A2 2 0 0 1 3.18 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.15a16 16 0 0 0 8 8l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 24 17z"/></svg>
            ${esc(custPhone)}
          </div>
          ${custNotes ? `<div class="field">📝 ${esc(custNotes)}</div>` : ""}
        </div>

        <table class="items-table">${itemsRows}</table>
      </div>

      <div class="order-footer">
        <div class="order-total">
          <div class="total-label">Total</div>
          <div class="total-value">€${total.toFixed(2)}</div>
        </div>

        <div class="order-actions">
          <button class="btn btn-invoice" onclick="generateInvoice('${esc(o.id)}')" style="background:var(--white);color:var(--green-mid);border:1px solid var(--stroke)">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
            Invoice
          </button>
          ${phone && phone !== "—" ? `<button class="btn btn-whatsapp" onclick="window.open('https://wa.me/${phone}?text=${waMsg}','_blank')">
            <svg fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347zM12 0C5.373 0 0 5.373 0 12c0 2.093.541 4.063 1.487 5.779L0 24l6.371-1.471A11.94 11.94 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 0 1-5.013-1.371l-.36-.214-3.721.859.894-3.617-.235-.372A9.795 9.795 0 0 1 2.182 12C2.182 6.58 6.58 2.182 12 2.182S21.818 6.58 21.818 12 17.42 21.818 12 21.818z"/></svg>
            WhatsApp
          </button>` : ""}
          ${phone && phone !== "—" ? `<button class="btn btn-phone" onclick="window.open('tel:${phone}')">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.36 12 19.79 19.79 0 0 1 1.21 3.18A2 2 0 0 1 3.18 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.15a16 16 0 0 0 8 8l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 24 17z"/></svg>
            Call
          </button>` : ""}
          ${o.status !== "confirmed" && o.status !== "delivered" && o.status !== "cancelled" ? `<button class="btn btn-confirm" onclick="updateStatus('${esc(o.id)}','confirmed')">✅ Confirm</button>` : ""}
          ${o.status === "confirmed" ? `<button class="btn btn-deliver" onclick="updateStatus('${esc(o.id)}','delivered')">📦 Delivered</button>` : ""}
          ${o.status !== "cancelled" && o.status !== "delivered" ? `<button class="btn btn-cancel" onclick="updateStatus('${esc(o.id)}','cancelled')">Cancel</button>` : ""}
        </div>
      </div>
    </div>`;
  }).join("");
}

function renderAnalytics() {
  const orders = filterByPeriod(allOrders);
  const totalRev = orders.reduce((s, o) => s + calcTotal(o), 0);
  const delivered = orders.filter(o => o.status === "delivered").length;
  const rate = orders.length ? Math.round((delivered / orders.length) * 100) : 0;
  const avg = orders.length ? totalRev / orders.length : 0;

  $("a-revenue").textContent = "€" + totalRev.toFixed(2);
  $("a-orders").textContent = orders.length;
  $("a-avg").textContent = "€" + avg.toFixed(2);
  $("a-rate").textContent = rate + "%";

  buildTopProducts(orders);
  buildTopCustomers(allOrders);
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
  const sorted = Object.values(pm).sort((a,b) => b.rev - a.rev).slice(0,50);

  $("top-products-body").innerHTML = sorted.map((p,i) => `<tr>
    <td class="cell-rank"><div class="rank-pill">${i+1}</div></td>
    <td><span class="prod-name">${esc(p.name)}</span></td>
    <td>${p.qty}</td>
    <td class="rev-val">€${p.rev.toFixed(2)}</td>
  </tr>`).join("") || `<tr><td colspan="4" style="padding:16px;color:#888;">No data</td></tr>`;
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
  const sorted = Object.values(cm).sort((a,b) => b.total - a.total).slice(0,200);

  $("customers-body").innerHTML = sorted.map((c,i) => `<tr>
    <td class="cell-rank"><div class="rank-pill">${i+1}</div></td>
    <td><span class="prod-name">${esc(c.name)}</span></td>
    <td class="cell-mono">${esc(c.phone || "—")}</td>
    <td>${c.count} order${c.count !== 1 ? "s" : ""}</td>
    <td class="rev-val" style="text-align:right">€${c.total.toFixed(2)}</td>
  </tr>`).join("") || `<tr><td colspan="5" style="padding:16px;color:#888;">No data</td></tr>`;
}

function renderCustomers() {
  $("customer-count-label").textContent = `${allCustomers.length} total customers`;
  const tbody = $("customers-table-body");
  if (!tbody) return;

  if (!allCustomers.length) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:40px;color:#999;">No customers yet</td></tr>`;
    return;
  }

  tbody.innerHTML = allCustomers.map((c,i) => {
    const phone = String(c.phone || "").replace(/\s/g, "").replace(/\+/g, "");
    const waMsg = encodeURIComponent(`مرحباً ${c.name || ""}!\n\nشكراً لك لكونك عميلاً عزيزاً في مواسم الخير! 🌿`);

    return `<tr>
      <td class="cell-rank"><div class="rank-pill">${i+1}</div></td>
      <td><span class="prod-name">${esc(c.name || "Unknown")}</span></td>
      <td class="cell-mono">${esc(c.phone || "—")}</td>
      <td>${esc(c.address || "—")}</td>
      <td>${Number(c.orderCount || 0)} order${Number(c.orderCount || 0) !== 1 ? "s" : ""}</td>
      <td class="rev-val">€${Number(c.totalSpent || 0).toFixed(2)}</td>
      <td style="text-align:right">
        ${phone && phone !== "—" ? `<button class="btn btn-whatsapp" onclick="window.open('https://wa.me/${phone}?text=${waMsg}','_blank')" style="padding:6px 10px;font-size:11px;">Contact</button>` : ""}
      </td>
    </tr>`;
  }).join("");
}

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

  tbody.innerHTML = allInventory.map((p,i) => {
    const stock = Number(p.stock || 0);
    const statusEmoji = p.status === "out" ? "❌" : p.status === "critical" ? "🔴" : p.status === "low" ? "⚠️" : "✅";
    const statusText = p.status === "out" ? "Out" : p.status === "critical" ? "Critical" : p.status === "low" ? "Low" : "Good";

    return `<tr>
      <td style="color:#999;font-weight:600">${i+1}</td>
      <td><div style="font-weight:700">${esc(p.name || "")}</div>
          <div style="font-size:11px;color:#999">${esc(p.unit || "")}</div></td>
      <td style="font-family:monospace;font-size:11px">${esc(p.sku || "-")}</td>
      <td>${esc(p.category || "-")}</td>
      <td style="font-weight:800">${stock}</td>
      <td>${statusEmoji} ${esc(statusText)}</td>
      <td style="font-weight:700">€${Number(p.price || 0).toFixed(2)}</td>
      <td style="text-align:right">—</td>
    </tr>`;
  }).join("");
}

document.addEventListener("DOMContentLoaded", () => {
  console.log("✅ Admin panel ready!");
  
  $("login-btn")?.addEventListener("click", doLogin);
  $("psw-input")?.addEventListener("keydown", e => { if (e.key === "Enter") doLogin(); });

  const saved = getSecret();
  if (saved) {
    hideLogin();
    loadOrders();
  } else {
    showLogin();
  }
});

console.log("✅ Admin Panel JavaScript v3.0 Loaded!");