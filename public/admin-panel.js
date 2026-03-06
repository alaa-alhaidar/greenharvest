console.log("✅ Admin Panel v4.0 - ULTRA FIX");

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
  return (o?.items || []).reduce((s,i) => s + (i.price||i.priceEach||0) * (i.qty||i.quantity||1), 0);
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

// COMPREHENSIVE customer extraction
function getCustomerData(order) {
  console.log("🔍 Extracting customer from:", order);
  
  const cust = order.customer || {};
  
  // Try ALL possible field names
  const name = cust.name || order.customerName || order.name || 
                cust.fullName || order.fullName || 
                cust.customerName || "—";
                
  const phone = cust.phone || order.customerPhone || order.phone || 
                cust.phoneNumber || order.phoneNumber ||
                cust.mobile || order.mobile || "—";
                
  const address = cust.address || order.customerAddress || order.address ||
                  cust.location || order.location ||
                  cust.deliveryAddress || order.deliveryAddress || "—";
                  
  const notes = cust.notes || order.customerNotes || order.note || order.notes || "";
  
  const result = { name, phone, address, notes };
  console.log("👤 Extracted:", result);
  return result;
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
  if (!res.ok) { const err = new Error("Failed: " + res.status); err.status = res.status; throw err; }
  return res.json().catch(() => ({}));
}

function showLogin() {
  $("login-screen")?.classList.remove("hidden");
}

function hideLogin() {
  $("login-screen")?.classList.add("hidden");
}

async function doLogin() {
  const input = $("psw-input");
  const err = $("login-error");
  const btn = $("login-btn");
  if (!input) return;

  if (err) err.classList.remove("show");
  if (btn) {
    btn.disabled = true;
    btn.textContent = "Checking…";
  }

  try {
    const data = await fetchJSON("/api/admin/orders", "GET", input.value);
    console.log("✅ Orders loaded:", data);

    setSecret(input.value);
    allOrders = data.orders || [];

    hideLogin();
    showToast(`Welcome — ${allOrders.length} orders`);

    renderOrders();
    renderAnalytics();
  } catch (e) {
    console.error("❌ Login error:", e);
    input.value = "";
    if (err) {
      err.textContent = e.status === 403 ? "Incorrect password" : "Server error";
      err.classList.add("show");
    }
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.textContent = "Sign In";
    }
  }
}

function doLogout() {
  clearSecret();
  allOrders = [];
  showLogin();
  if ($("psw-input")) $("psw-input").value = "";
}

async function loadOrders() {
  const secret = getSecret();
  if (!secret) return showLogin();

  try {
    const data = await fetchJSON("/api/admin/orders", "GET", secret);
    allOrders = data.orders || [];
    renderOrders();
    renderAnalytics();
    showToast(`Refreshed — ${allOrders.length} orders`);
  } catch (e) {
    if (e.status === 403) { doLogout(); return; }
    showToast("Error loading");
  }
}

async function loadCustomers() {
  const secret = getSecret();
  if (!secret) return showLogin();

  try {
    const data = await fetchJSON("/api/admin/customers", "GET", secret);
    allCustomers = data.customers || [];
    renderCustomers();
  } catch (e) {
    if (e.status === 403) return doLogout();
  }
}

async function loadInventory() {
  const secret = getSecret();
  if (!secret) return showLogin();

  try {
    const data = await fetchJSON("/api/admin/inventory", "GET", secret);
    allInventory = data.inventory || [];
    renderInventory(data.summary || {});
  } catch (e) {
    if (e.status === 403) return doLogout();
  }
}

async function updateStatus(orderId, status) {
  const secret = getSecret();
  if (!secret) return;

  const o = allOrders.find(x => x.id === orderId);
  if (o) o.status = status;
  renderOrders();
  renderAnalytics();

  try {
    await fetchJSON("/api/admin/update-status", "POST", secret, { orderId, status });
  } catch (e) {
    if (e.status === 403) doLogout();
  }
}

async function generateInvoice(orderId) {
  const secret = getSecret();
  if (!secret) return;

  showToast("Generating...");

  try {
    const res = await fetch("/api/admin/generate-invoice", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-admin-secret": secret },
      body: JSON.stringify({ orderId })
    });

    if (!res.ok) throw new Error("Failed");

    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Invoice-${orderId.slice(-6).toUpperCase()}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    showToast("Downloaded!");
  } catch (e) {
    showToast("Invoice failed");
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
  const grid = $("orders-grid");
  const loading = $("loading-indicator");
  if (!grid) return;

  if (loading) loading.style.display = "none";

  const search = ($("search-input")?.value || "").toLowerCase();

  let filtered = allOrders.slice();
  if (activeFilter !== "all") filtered = filtered.filter(o => o.status === activeFilter);

  if (search) {
    filtered = filtered.filter(o => {
      const cust = getCustomerData(o);
      return (
        (o.shortId || "").toLowerCase().includes(search) ||
        cust.name.toLowerCase().includes(search) ||
        cust.phone.toLowerCase().includes(search) ||
        cust.address.toLowerCase().includes(search)
      );
    });
  }

  // Update stats
  const totalRev = allOrders.reduce((s, o) => s + calcTotal(o), 0);
  if ($("stat-revenue")) $("stat-revenue").textContent = "€" + totalRev.toFixed(2);
  if ($("stat-new")) $("stat-new").textContent = allOrders.filter(o => o.status === "new").length;
  if ($("stat-confirmed")) $("stat-confirmed").textContent = allOrders.filter(o => o.status === "confirmed").length;
  if ($("stat-delivered")) $("stat-delivered").textContent = allOrders.filter(o => o.status === "delivered").length;

  ["all","new","confirmed","delivered","cancelled"].forEach(s => {
    const el = $(`badge-${s}`);
    if (!el) return;
    el.textContent = s === "all" ? allOrders.length : allOrders.filter(o => o.status === s).length;
  });

  if ($("order-count-label")) $("order-count-label").textContent = `${allOrders.length} total orders`;

  if (!filtered.length) {
    grid.innerHTML = `<div class="empty-state"><div class="emoji">📋</div><h3>No orders</h3></div>`;
    return;
  }

  grid.innerHTML = filtered.map(o => {
    const cust = getCustomerData(o);
    const total = calcTotal(o);
    const shortId = o.shortId || String(o.id || "").slice(-6).toUpperCase();
    const phone = String(cust.phone || "").replace(/\s/g, "").replace(/\+/g, "");

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

    const waMsg = encodeURIComponent(`✅ مرحباً ${cust.name}!\nتم تأكيد طلبك #${shortId}\n€${total.toFixed(2)}`);

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
            <strong>${esc(cust.name)}</strong>
          </div>
          <div class="field">
            <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
            ${esc(cust.address)}
          </div>
          <div class="field">
            <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.36 12 19.79 19.79 0 0 1 1.21 3.18A2 2 0 0 1 3.18 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.15a16 16 0 0 0 8 8l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 24 17z"/></svg>
            ${esc(cust.phone)}
          </div>
          ${cust.notes ? `<div class="field">📝 ${esc(cust.notes)}</div>` : ""}
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
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
            Invoice
          </button>
          ${phone && phone !== "—" ? `<button class="btn btn-whatsapp" onclick="window.open('https://wa.me/${phone}?text=${waMsg}','_blank')">WhatsApp</button>` : ""}
          ${phone && phone !== "—" ? `<button class="btn btn-phone" onclick="window.open('tel:${phone}')">Call</button>` : ""}
          ${o.status !== "confirmed" && o.status !== "delivered" ? `<button class="btn btn-confirm" onclick="updateStatus('${esc(o.id)}','confirmed')">✅ Confirm</button>` : ""}
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

  if ($("a-revenue")) $("a-revenue").textContent = "€" + totalRev.toFixed(2);
  if ($("a-orders")) $("a-orders").textContent = orders.length;
  if ($("a-avg")) $("a-avg").textContent = "€" + avg.toFixed(2);
  if ($("a-rate")) $("a-rate").textContent = rate + "%";

  // Calculate KPIs
  const totalItems = orders.reduce((sum, o) => {
    return sum + (o.items || []).reduce((s, i) => s + (i.qty || i.quantity || 1), 0);
  }, 0);

  const uniqueCustomers = new Set();
  orders.forEach(o => {
    const cust = getCustomerData(o);
    if (cust.name !== "—") uniqueCustomers.add(cust.name);
  });

  const productMap = {};
  orders.forEach(o => {
    (o.items || []).forEach(i => {
      const name = i.name || i.productName || "?";
      const qty = i.qty || i.quantity || 1;
      productMap[name] = (productMap[name] || 0) + qty;
    });
  });
  
  const topProduct = Object.entries(productMap).sort((a,b) => b[1] - a[1])[0];

  if ($("kpi-items")) $("kpi-items").textContent = totalItems;
  if ($("kpi-customers")) $("kpi-customers").textContent = uniqueCustomers.size;
  if ($("kpi-top-product")) $("kpi-top-product").textContent = topProduct ? topProduct[0] : "—";

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
  const sorted = Object.values(pm).sort((a,b) => b.rev - a.rev);

  if ($("top-products-body")) {
    $("top-products-body").innerHTML = sorted.map((p,i) => `<tr>
      <td class="cell-rank"><div class="rank-pill">${i+1}</div></td>
      <td><span class="prod-name">${esc(p.name)}</span></td>
      <td>${p.qty}</td>
      <td class="rev-val">€${p.rev.toFixed(2)}</td>
    </tr>`).join("") || `<tr><td colspan="4">No data</td></tr>`;
  }
}

function buildTopCustomers(orders) {
  const cm = {};
  for (const o of orders) {
    const cust = getCustomerData(o);
    const k = cust.name;
    if (k === "—") continue;
    if (!cm[k]) cm[k] = { name: k, total: 0, count: 0, phone: cust.phone };
    cm[k].total += calcTotal(o);
    cm[k].count++;
  }
  const sorted = Object.values(cm).sort((a,b) => b.total - a.total);

  if ($("customers-body")) {
    $("customers-body").innerHTML = sorted.map((c,i) => `<tr>
      <td class="cell-rank"><div class="rank-pill">${i+1}</div></td>
      <td><span class="prod-name">${esc(c.name)}</span></td>
      <td class="cell-mono">${esc(c.phone || "—")}</td>
      <td>${c.count} order${c.count !== 1 ? "s" : ""}</td>
      <td class="rev-val" style="text-align:right">€${c.total.toFixed(2)}</td>
    </tr>`).join("") || `<tr><td colspan="5">No data</td></tr>`;
  }
}

function renderCustomers() {
  if ($("customer-count-label")) $("customer-count-label").textContent = `${allCustomers.length} customers`;
  const tbody = $("customers-table-body");
  if (!tbody) return;

  if (!allCustomers.length) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:40px">No customers</td></tr>`;
    return;
  }

  tbody.innerHTML = allCustomers.map((c,i) => {
    const phone = String(c.phone || "").replace(/\s/g, "").replace(/\+/g, "");
    return `<tr>
      <td class="cell-rank"><div class="rank-pill">${i+1}</div></td>
      <td><span class="prod-name">${esc(c.name || "Unknown")}</span></td>
      <td class="cell-mono">${esc(c.phone || "—")}</td>
      <td>${esc(c.address || "—")}</td>
      <td>${Number(c.orderCount || 0)}</td>
      <td class="rev-val">€${Number(c.totalSpent || 0).toFixed(2)}</td>
      <td>${phone ? `<button class="btn btn-whatsapp" onclick="window.open('https://wa.me/${phone}','_blank')">Contact</button>` : ""}</td>
    </tr>`;
  }).join("");
}

function renderInventory(summary) {
  if ($("inv-total")) $("inv-total").textContent = summary.totalProducts || 0;
  if ($("inv-instock")) $("inv-instock").textContent = summary.inStock || 0;
  if ($("inv-lowstock")) $("inv-lowstock").textContent = summary.lowStock || 0;
  if ($("inv-outofstock")) $("inv-outofstock").textContent = summary.outOfStock || 0;

  const tbody = $("inventory-table-body");
  if (!tbody) return;

  tbody.innerHTML = allInventory.map((p,i) => {
    const statusEmoji = p.status === "out" ? "❌" : p.status === "low" ? "⚠️" : "✅";
    return `<tr>
      <td>${i+1}</td>
      <td>${esc(p.name || "")}</td>
      <td>${esc(p.sku || "-")}</td>
      <td>${esc(p.category || "-")}</td>
      <td>${p.stock || 0}</td>
      <td>${statusEmoji}</td>
      <td>€${Number(p.price || 0).toFixed(2)}</td>
      <td>—</td>
    </tr>`;
  }).join("") || `<tr><td colspan="8">No products</td></tr>`;
}

document.addEventListener("DOMContentLoaded", () => {
  console.log("✅ Dashboard ready");
  
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