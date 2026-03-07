// Admin Panel - With Working Chart
console.log("✅ Admin Panel v9.0 - With Chart");

let allOrders = [];
let allCustomers = [];
let allInventory = [];
let activeFilter = "all";
let activePeriod = "30";
const SESSION_KEY = "gh_admin_secret";

const $ = id => document.getElementById(id);

const esc = s => {
  const div = document.createElement('div');
  div.textContent = s ?? "";
  return div.innerHTML;
};

const showToast = msg => {
  const t = $("toast");
  if (!t) return;
  t.textContent = msg;
  t.classList.add("show");
  setTimeout(() => t.classList.remove("show"), 2500);
};

const getSecret = () => sessionStorage.getItem(SESSION_KEY) || "";
const setSecret = v => sessionStorage.setItem(SESSION_KEY, v);
const clearSecret = () => sessionStorage.removeItem(SESSION_KEY);

const extractCustomer = o => {
  if (o.customer && o.customer.name) {
    return {
      name: o.customer.name || "—",
      phone: o.customer.phone || "—",
      address: o.customer.address || "—",
      notes: o.customer.notes || "",
      missing: false
    };
  }
  
  if (o.customerName) {
    return {
      name: o.customerName,
      phone: o.customerPhone || "—",
      address: o.customerAddress || "—",
      notes: o.customerNotes || "",
      missing: false
    };
  }
  
  return {
    name: "⚠️ No customer data",
    phone: "—",
    address: "—",
    notes: "",
    missing: true
  };
};

const extractItems = o => {
  return (o.items || []).map(i => ({
    name: i.name || i.productName || "Product",
    qty: i.qty || i.quantity || 1,
    price: i.price || i.priceEach || 0,
    unit: i.unit || ""
  }));
};

const calcTotal = o => {
  if (o.total) return Number(o.total);
  return extractItems(o).reduce((s,i) => s + (i.price * i.qty), 0);
};

const formatDate = d => {
  if (!d) return "—";
  const dt = new Date(d);
  return dt.toLocaleDateString("en-GB",{day:"2-digit",month:"short",year:"numeric"}) + "  " + dt.toTimeString().slice(0,5);
};

const normalizeStatus = status => {
  return (status || "new").toLowerCase();
};

const filterByPeriod = orders => {
  if (activePeriod === "all") return orders;
  const cutoff = Date.now() - (Number(activePeriod) * 86400000);
  return orders.filter(o => new Date(o.createdAt || o.timestamp).getTime() >= cutoff);
};

const fetchAPI = async (url, method, body) => {
  const opts = {method, headers: {"x-admin-secret": getSecret()}};
  if (body) {
    opts.headers["Content-Type"] = "application/json";
    opts.body = JSON.stringify(body);
  }
  const res = await fetch(url, opts);
  if (res.status === 403) throw new Error("Forbidden");
  if (!res.ok) throw new Error("HTTP " + res.status);
  return res.json();
};

const doLogin = async () => {
  const inp = $("psw-input");
  const err = $("login-error");
  const btn = $("login-btn");
  
  if (!inp || !btn) return;
  
  if (err) err.classList.remove("show");
  btn.disabled = true;
  btn.textContent = "Checking...";
  
  try {
    const res = await fetch("/api/admin/orders", {
      headers: {"x-admin-secret": inp.value}
    });
    
    if (res.status === 403) throw new Error("Wrong password");
    if (!res.ok) throw new Error("Server error");
    
    const data = await res.json();
    
    setSecret(inp.value);
    allOrders = data.orders || [];
    
    $("login-screen")?.classList.add("hidden");
    renderOrders();
    renderAnalytics();
    showToast(`Welcome! ${allOrders.length} orders`);
  } catch (e) {
    console.error("Login error:", e);
    inp.value = "";
    if (err) {
      err.textContent = e.message === "Wrong password" ? "Incorrect password" : "Server error";
      err.classList.add("show");
    }
  } finally {
    btn.disabled = false;
    btn.textContent = "Sign In";
  }
};

const doLogout = () => {
  clearSecret();
  allOrders = [];
  $("login-screen")?.classList.remove("hidden");
  $("psw-input").value = "";
};

const loadOrders = async () => {
  try {
    const data = await fetchAPI("/api/admin/orders", "GET");
    allOrders = data.orders || [];
    renderOrders();
    renderAnalytics();
    showToast(`${allOrders.length} orders`);
  } catch (e) {
    if (e.message === "Forbidden") doLogout();
  }
};

const loadCustomers = async () => {
  try {
    const data = await fetchAPI("/api/admin/customers", "GET");
    allCustomers = data.customers || [];
    renderCustomers();
  } catch (e) {
    if (e.message === "Forbidden") doLogout();
  }
};

const loadInventory = async () => {
  try {
    const data = await fetchAPI("/api/admin/inventory", "GET");
    allInventory = data.inventory || [];
    renderInventory(data.summary || {});
  } catch (e) {
    if (e.message === "Forbidden") doLogout();
  }
};

const updateStatus = async (orderId, status) => {
  const o = allOrders.find(x => x.id === orderId);
  if (o) o.status = status;
  renderOrders();
  renderAnalytics();
  
  try {
    await fetchAPI("/api/admin/update-status", "POST", {orderId, status});
    showToast("Status updated");
  } catch (e) {
    if (e.message === "Forbidden") doLogout();
  }
};

const generateInvoice = async (orderId) => {
  showToast("Generating...");
  try {
    const res = await fetch("/api/admin/generate-invoice", {
      method: "POST",
      headers: {"Content-Type": "application/json", "x-admin-secret": getSecret()},
      body: JSON.stringify({orderId})
    });
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Invoice-${orderId.slice(-6)}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast("Downloaded!");
  } catch (e) {
    showToast("Failed");
  }
};

const showTab = tab => {
  document.querySelectorAll(".tab-page").forEach(p => p.classList.remove("active"));
  document.querySelectorAll(".nav-item").forEach(n => n.classList.remove("active"));
  $(`tab-${tab}`)?.classList.add("active");
  $(`nav-${tab}`)?.classList.add("active");
  
  if (tab === "analytics") renderAnalytics();
  if (tab === "customers" && !allCustomers.length) loadCustomers();
  if (tab === "inventory" && !allInventory.length) loadInventory();
};

const setFilter = (f, btn) => {
  activeFilter = f;
  document.querySelectorAll(".filter-tab").forEach(t => t.classList.remove("active"));
  btn?.classList.add("active");
  renderOrders();
};

const setPeriod = (p, btn) => {
  activePeriod = p;
  document.querySelectorAll(".period-btn").forEach(b => b.classList.remove("active"));
  btn?.classList.add("active");
  renderAnalytics();
};

const renderOrders = () => {
  const grid = $("orders-grid");
  const loading = $("loading-indicator");
  if (!grid) return;
  
  if (loading) loading.style.display = "none";
  
  let filtered = [...allOrders];
  
  if (activeFilter !== "all") {
    filtered = filtered.filter(o => normalizeStatus(o.status) === activeFilter);
  }
  
  const search = ($("search-input")?.value || "").toLowerCase();
  if (search) {
    filtered = filtered.filter(o => {
      const c = extractCustomer(o);
      const id = (o.shortId || o.id || "").toLowerCase();
      return id.includes(search) || c.name.toLowerCase().includes(search) || 
             c.phone.toLowerCase().includes(search) || c.address.toLowerCase().includes(search);
    });
  }
  
  const totalRev = allOrders.reduce((s, o) => s + calcTotal(o), 0);
  if ($("stat-revenue")) $("stat-revenue").textContent = "€" + totalRev.toFixed(2);
  if ($("stat-new")) $("stat-new").textContent = allOrders.filter(o => normalizeStatus(o.status) === "new").length;
  if ($("stat-confirmed")) $("stat-confirmed").textContent = allOrders.filter(o => normalizeStatus(o.status) === "confirmed").length;
  if ($("stat-delivered")) $("stat-delivered").textContent = allOrders.filter(o => normalizeStatus(o.status) === "delivered").length;
  
  ["all","new","confirmed","delivered","cancelled"].forEach(s => {
    const b = $(`badge-${s}`);
    if (b) b.textContent = s === "all" ? allOrders.length : allOrders.filter(o => normalizeStatus(o.status) === s).length;
  });
  
  if ($("order-count-label")) $("order-count-label").textContent = `${allOrders.length} total orders`;
  
  if (!filtered.length) {
    grid.innerHTML = `<div class="empty-state"><div class="emoji">📋</div><h3>No orders</h3></div>`;
    return;
  }
  
  grid.innerHTML = filtered.map(o => {
    const c = extractCustomer(o);
    const items = extractItems(o);
    const total = calcTotal(o);
    const shortId = o.shortId || o.id?.slice(-6).toUpperCase() || "??????";
    const phone = c.phone.replace(/\s/g, "").replace(/\+/g, "");
    const status = normalizeStatus(o.status);
    
    const itemsHTML = items.map(i => `<tr><td class="item-name">${esc(i.qty)}x ${esc(i.name)}</td><td class="item-price">€${(i.price * i.qty).toFixed(2)}</td></tr>`).join("");
    
    const badges = {
      new: '<span class="status-badge new">🆕 New</span>',
      confirmed: '<span class="status-badge confirmed">✅ Confirmed</span>',
      delivered: '<span class="status-badge delivered">📦 Delivered</span>',
      cancelled: '<span class="status-badge cancelled">❌ Cancelled</span>'
    };
    
    const waMsg = encodeURIComponent(`✅ مرحباً ${c.name}!\nطلبك #${shortId}\n€${total.toFixed(2)}`);
    
    const customerWarning = c.missing ? `<div style="background:#FFF3E0;padding:8px 12px;border-radius:6px;font-size:11px;color:#F57C00;margin-bottom:8px;">⚠️ Customer data not saved</div>` : '';
    
    return `<div class="order-card">
      <div class="order-header">
        <div><div class="order-id">#${esc(shortId)}</div><div class="order-date">${esc(formatDate(o.createdAt))}</div></div>
        ${badges[status] || badges.new}
      </div>
      <div class="order-body">
        ${customerWarning}
        <div class="customer-info">
          <div class="field"><svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg><strong${c.missing ? ' style="color:#F57C00"' : ''}>${esc(c.name)}</strong></div>
          <div class="field"><svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>${esc(c.address)}</div>
          <div class="field"><svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.36 12 19.79 19.79 0 0 1 1.21 3.18A2 2 0 0 1 3.18 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.15a16 16 0 0 0 8 8l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 24 17z"/></svg>${esc(c.phone)}</div>
          ${c.notes ? `<div class="field">📝 ${esc(c.notes)}</div>` : ""}
        </div>
        <table class="items-table">${itemsHTML}</table>
      </div>
      <div class="order-footer">
        <div class="order-total"><div class="total-label">Total</div><div class="total-value">€${total.toFixed(2)}</div></div>
        <div class="order-actions">
          <button class="btn btn-invoice" onclick="generateInvoice('${esc(o.id)}')" style="background:var(--white);color:var(--green-mid);border:1px solid var(--stroke)"><svg fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2" width="13" height="13"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>Invoice</button>
          ${!c.missing && phone && phone !== "—" ? `<button class="btn btn-whatsapp" onclick="window.open('https://wa.me/${phone}?text=${waMsg}','_blank')">WhatsApp</button>` : ""}
          ${!c.missing && phone && phone !== "—" ? `<button class="btn btn-phone" onclick="window.open('tel:${phone}')">Call</button>` : ""}
          ${status !== "confirmed" && status !== "delivered" && status !== "cancelled" ? `<button class="btn btn-confirm" onclick="updateStatus('${esc(o.id)}','confirmed')">✅ Confirm</button>` : ""}
          ${status === "confirmed" ? `<button class="btn btn-deliver" onclick="updateStatus('${esc(o.id)}','delivered')">📦 Delivered</button>` : ""}
          ${status !== "cancelled" && status !== "delivered" ? `<button class="btn btn-cancel" onclick="updateStatus('${esc(o.id)}','cancelled')">Cancel</button>` : ""}
        </div>
      </div>
    </div>`;
  }).join("");
};

const renderAnalytics = () => {
  console.log("📊 Rendering analytics");
  
  const orders = filterByPeriod(allOrders);
  const totalRev = orders.reduce((s, o) => s + calcTotal(o), 0);
  const delivered = orders.filter(o => normalizeStatus(o.status) === "delivered").length;
  const rate = orders.length ? Math.round((delivered / orders.length) * 100) : 0;
  const avg = orders.length ? totalRev / orders.length : 0;
  
  if ($("a-revenue")) $("a-revenue").textContent = "€" + totalRev.toFixed(2);
  if ($("a-orders")) $("a-orders").textContent = orders.length;
  if ($("a-avg")) $("a-avg").textContent = "€" + avg.toFixed(2);
  if ($("a-rate")) $("a-rate").textContent = rate + "%";
  
  const totalItems = orders.reduce((sum, o) => sum + extractItems(o).reduce((s, i) => s + i.qty, 0), 0);
  
  const uniqueCustomers = new Set();
  orders.forEach(o => {
    const c = extractCustomer(o);
    if (!c.missing && c.name !== "—") uniqueCustomers.add(c.name);
  });
  
  const prodMap = {};
  orders.forEach(o => {
    extractItems(o).forEach(i => {
      prodMap[i.name] = (prodMap[i.name] || 0) + i.qty;
    });
  });
  const topProd = Object.entries(prodMap).sort((a,b) => b[1] - a[1])[0];
  
  if ($("kpi-items")) $("kpi-items").textContent = totalItems;
  if ($("kpi-customers")) $("kpi-customers").textContent = uniqueCustomers.size;
  if ($("kpi-top-product")) $("kpi-top-product").textContent = topProd ? topProd[0] : "—";
  
  // Render the chart!
  renderSalesChart(orders);
};

const renderSalesChart = (orders) => {
  console.log("📈 Rendering sales chart with", orders.length, "orders");
  
  const canvas = document.getElementById("sales-chart");
  if (!canvas) {
    console.log("❌ Canvas not found");
    return;
  }
  
  const ctx = canvas.getContext("2d");
  
  // Set canvas size
  canvas.width = canvas.offsetWidth || 800;
  canvas.height = 300;
  
  console.log("Canvas size:", canvas.width, "x", canvas.height);
  
  // Clear canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  if (!orders.length) {
    ctx.fillStyle = "#999";
    ctx.font = "14px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("No data for selected period", canvas.width / 2, canvas.height / 2);
    return;
  }
  
  // Group orders by date
  const dateMap = {};
  orders.forEach(o => {
    const date = new Date(o.createdAt || o.timestamp);
    const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD
    if (!dateMap[dateStr]) dateMap[dateStr] = 0;
    dateMap[dateStr] += calcTotal(o);
  });
  
  const dates = Object.keys(dateMap).sort();
  const values = dates.map(d => dateMap[d]);
  
  console.log("Chart data:", dates.length, "dates", values);
  
  if (!dates.length) {
    ctx.fillStyle = "#999";
    ctx.font = "14px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("No data", canvas.width / 2, canvas.height / 2);
    return;
  }
  
  const maxValue = Math.max(...values, 1);
  const padding = 50;
  const chartWidth = canvas.width - padding * 2;
  const chartHeight = canvas.height - padding * 2;
  const barWidth = Math.max(Math.min(chartWidth / dates.length - 10, 60), 20);
  
  console.log("Max value:", maxValue, "Bar width:", barWidth);
  
  // Draw bars
  dates.forEach((date, i) => {
    const value = dateMap[date];
    const barHeight = (value / maxValue) * chartHeight;
    const x = padding + (i * (chartWidth / dates.length));
    const y = padding + chartHeight - barHeight;
    
    // Bar
    ctx.fillStyle = "#2A6041";
    ctx.fillRect(x, y, barWidth, barHeight);
    
    // Date label
    ctx.fillStyle = "#666";
    ctx.font = "10px sans-serif";
    ctx.save();
    ctx.translate(x + barWidth/2, canvas.height - padding + 20);
    ctx.rotate(-Math.PI/4);
    ctx.textAlign = "right";
    const d = new Date(date);
    ctx.fillText(d.toLocaleDateString("en-GB", {day:"2-digit",month:"short"}), 0, 0);
    ctx.restore();
  });
  
  // Y-axis labels
  ctx.fillStyle = "#666";
  ctx.font = "11px sans-serif";
  ctx.textAlign = "right";
  for (let i = 0; i <= 4; i++) {
    const value = (maxValue / 4) * i;
    const y = padding + chartHeight - (chartHeight / 4) * i;
    ctx.fillText("€" + value.toFixed(0), padding - 10, y + 4);
  }
  
  console.log("✅ Chart rendered");
};

const renderCustomers = () => {
  if ($("customer-count-label")) $("customer-count-label").textContent = `${allCustomers.length} customers`;
  const tbody = $("customers-table-body");
  if (!tbody) return;
  
  tbody.innerHTML = allCustomers.map((c,i) => `<tr>
    <td class="cell-rank"><div class="rank-pill">${i+1}</div></td>
    <td><span class="prod-name">${esc(c.name || "Unknown")}</span></td>
    <td class="cell-mono">${esc(c.phone || "—")}</td>
    <td>${esc(c.address || "—")}</td>
    <td>${c.orderCount || 0}</td>
    <td class="rev-val">€${Number(c.totalSpent || 0).toFixed(2)}</td>
    <td>${c.phone ? `<button class="btn btn-whatsapp" onclick="window.open('https://wa.me/${c.phone.replace(/\s/g,'')}','_blank')">Contact</button>` : ""}</td>
  </tr>`).join("") || `<tr><td colspan="7">No customers</td></tr>`;
};

const renderInventory = summary => {
  if ($("inv-total")) $("inv-total").textContent = summary.totalProducts || 0;
  if ($("inv-instock")) $("inv-instock").textContent = summary.inStock || 0;
  if ($("inv-lowstock")) $("inv-lowstock").textContent = summary.lowStock || 0;
  if ($("inv-outofstock")) $("inv-outofstock").textContent = summary.outOfStock || 0;
  
  const tbody = $("inventory-table-body");
  if (!tbody) return;
  
  tbody.innerHTML = allInventory.map((p,i) => `<tr>
    <td>${i+1}</td>
    <td>${esc(p.name || "")}</td>
    <td>${esc(p.sku || "-")}</td>
    <td>${esc(p.category || "-")}</td>
    <td>${p.stock || 0}</td>
    <td>${p.status === "out" ? "❌" : p.status === "low" ? "⚠️" : "✅"}</td>
    <td>€${Number(p.price || 0).toFixed(2)}</td>
    <td>—</td>
  </tr>`).join("") || `<tr><td colspan="8">No products</td></tr>`;
};

document.addEventListener("DOMContentLoaded", () => {
  console.log("✅ Dashboard ready");
  
  $("login-btn")?.addEventListener("click", doLogin);
  $("psw-input")?.addEventListener("keydown", e => { if (e.key === "Enter") doLogin(); });
  
  const saved = getSecret();
  if (saved) {
    $("login-screen")?.classList.add("hidden");
    loadOrders();
  }
});

console.log("✅ Admin Panel v9.0 Loaded - With Chart!");