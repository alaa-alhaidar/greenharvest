 // SIMPLE VERSION - Basic functionality only
console.log("✅ Simple Admin Panel Loading");

let allOrders = [];
let allCustomers = [];
const SESSION_KEY = "gh_admin_secret";
const $ = id => document.getElementById(id);

const showToast = msg => {
  const t = $("toast");
  if (t) {
    t.textContent = msg;
    t.classList.add("show");
    setTimeout(() => t.classList.remove("show"), 2500);
  }
};

const getSecret = () => sessionStorage.getItem(SESSION_KEY) || "";
const setSecret = v => sessionStorage.setItem(SESSION_KEY, v);

async function doLogin() {
  const inp = $("psw-input");
  const btn = $("login-btn");
  
  btn.disabled = true;
  btn.textContent = "Logging in...";
  
  try {
    const res = await fetch("/api/admin/orders", {
      headers: {"x-admin-secret": inp.value}
    });
    
    if (!res.ok) throw new Error("Login failed");
    
    const data = await res.json();
    allOrders = data.orders || [];
    
    setSecret(inp.value);
    $("login-screen").classList.add("hidden");
    
    renderEverything();
    showToast("Logged in!");
  } catch (e) {
    alert("Login failed");
  } finally {
    btn.disabled = false;
    btn.textContent = "Sign In";
  }
}

function renderEverything() {
  const grid = $("orders-grid");
  if (!grid) return;
  
  // Hide loading
  const loading = $("loading-indicator");
  if (loading) loading.style.display = "none";
  
  // Calculate stats
  let totalRev = 0;
  let newCount = 0;
  let confirmedCount = 0;
  let deliveredCount = 0;
  
  allOrders.forEach(o => {
    const total = o.total || 0;
    totalRev += total;
    
    const status = (o.status || "new").toLowerCase();
    if (status === "new") newCount++;
    if (status === "confirmed") confirmedCount++;
    if (status === "delivered") deliveredCount++;
  });
  
  // Update stats
  if ($("stat-revenue")) $("stat-revenue").textContent = "€" + totalRev.toFixed(2);
  if ($("stat-new")) $("stat-new").textContent = newCount;
  if ($("stat-confirmed")) $("stat-confirmed").textContent = confirmedCount;
  if ($("stat-delivered")) $("stat-delivered").textContent = deliveredCount;
  
  // Update badges
  if ($("badge-all")) $("badge-all").textContent = allOrders.length;
  if ($("badge-new")) $("badge-new").textContent = newCount;
  if ($("badge-confirmed")) $("badge-confirmed").textContent = confirmedCount;
  if ($("badge-delivered")) $("badge-delivered").textContent = deliveredCount;
  
  if ($("order-count-label")) $("order-count-label").textContent = allOrders.length + " total orders";
  
  // Update analytics
  if ($("a-revenue")) $("a-revenue").textContent = "€" + totalRev.toFixed(2);
  if ($("a-orders")) $("a-orders").textContent = allOrders.length;
  if ($("a-avg")) $("a-avg").textContent = "€" + (allOrders.length ? (totalRev/allOrders.length).toFixed(2) : "0.00");
  if ($("a-rate")) $("a-rate").textContent = allOrders.length ? Math.round((deliveredCount/allOrders.length)*100) + "%" : "0%";
  
  // Count items
  let totalItems = 0;
  allOrders.forEach(o => {
    (o.items || []).forEach(i => {
      totalItems += (i.quantity || 1);
    });
  });
  if ($("kpi-items")) $("kpi-items").textContent = totalItems;
  
  // Count unique customers (from customer names in orders)
  const customerSet = new Set();
  allOrders.forEach(o => {
    if (o.customer && o.customer.name) customerSet.add(o.customer.name);
    if (o.customerName) customerSet.add(o.customerName);
  });
  if ($("kpi-customers")) $("kpi-customers").textContent = customerSet.size;
  
  // Top product
  const prodMap = {};
  allOrders.forEach(o => {
    (o.items || []).forEach(i => {
      const name = i.productName || i.name || "Unknown";
      prodMap[name] = (prodMap[name] || 0) + (i.quantity || 1);
    });
  });
  const topProd = Object.entries(prodMap).sort((a,b) => b[1]-a[1])[0];
  if ($("kpi-top-product")) $("kpi-top-product").textContent = topProd ? topProd[0] : "—";
  
  // Render orders
  grid.innerHTML = allOrders.map(o => {
    const shortId = o.shortId || "??????";
    const status = (o.status || "new").toLowerCase();
    const total = o.total || 0;
    const date = o.createdAt ? new Date(o.createdAt).toLocaleDateString() : "—";
    
    // Get customer data
    let custName = "⚠️ No customer data";
    let custPhone = "—";
    let custAddress = "—";
    
    if (o.customer) {
      custName = o.customer.name || custName;
      custPhone = o.customer.phone || custPhone;
      custAddress = o.customer.address || custAddress;
    } else if (o.customerName) {
      custName = o.customerName;
      custPhone = o.customerPhone || custPhone;
      custAddress = o.customerAddress || custAddress;
    }
    
    const hasCustomer = custName !== "⚠️ No customer data";
    
    // Items
    let itemsHTML = "";
    (o.items || []).forEach(i => {
      const name = i.productName || i.name || "Product";
      const qty = i.quantity || 1;
      const price = i.priceEach || i.price || 0;
      itemsHTML += `<div>${qty}x ${name} - €${(price * qty).toFixed(2)}</div>`;
    });
    
    const statusBadge = status === "new" ? "🆕 New" : 
                       status === "confirmed" ? "✅ Confirmed" :
                       status === "delivered" ? "📦 Delivered" : "❌ Cancelled";
    
    return `
      <div style="background:white;padding:16px;border-radius:8px;margin-bottom:12px;border:1px solid #e0e0e0">
        <div style="display:flex;justify-content:space-between;margin-bottom:12px">
          <div>
            <div style="font-weight:bold">#${shortId}</div>
            <div style="font-size:12px;color:#666">${date}</div>
          </div>
          <div style="font-size:12px">${statusBadge}</div>
        </div>
        ${!hasCustomer ? '<div style="background:#FFF3E0;padding:8px;border-radius:4px;font-size:11px;color:#F57C00;margin-bottom:8px">⚠️ Customer data not saved</div>' : ''}
        <div style="font-size:13px;margin-bottom:8px">
          <div>👤 <strong>${custName}</strong></div>
          <div>📍 ${custAddress}</div>
          <div>📱 ${custPhone}</div>
        </div>
        <div style="border-top:1px solid #eee;padding-top:8px;margin-top:8px">
          ${itemsHTML}
        </div>
        <div style="margin-top:12px;font-weight:bold;text-align:right">
          Total: €${total.toFixed(2)}
        </div>
        <div style="margin-top:12px;display:flex;gap:8px;flex-wrap:wrap">
          <button onclick="generateInvoice('${o.id}')" style="padding:6px 12px;background:#2A6041;color:white;border:none;border-radius:4px;cursor:pointer;font-size:12px">Invoice</button>
          ${hasCustomer && custPhone !== "—" ? `<button onclick="window.open('https://wa.me/${custPhone.replace(/\s/g,'').replace(/\+/g,'')}','_blank')" style="padding:6px 12px;background:#25D366;color:white;border:none;border-radius:4px;cursor:pointer;font-size:12px">WhatsApp</button>` : ''}
          ${status === "new" ? `<button onclick="updateStatus('${o.id}','confirmed')" style="padding:6px 12px;background:#4CAF50;color:white;border:none;border-radius:4px;cursor:pointer;font-size:12px">✅ Confirm</button>` : ''}
          ${status === "confirmed" ? `<button onclick="updateStatus('${o.id}','delivered')" style="padding:6px 12px;background:#2196F3;color:white;border:none;border-radius:4px;cursor:pointer;font-size:12px">📦 Delivered</button>` : ''}
        </div>
      </div>
    `;
  }).join("");
  
  // Draw simple chart
  drawSimpleChart();
}

function drawSimpleChart() {
  const canvas = document.getElementById("sales-chart");
  if (!canvas) return;
  
  const ctx = canvas.getContext("2d");
  canvas.width = canvas.offsetWidth;
  canvas.height = 300;
  
  // Group by date
  const dateMap = {};
  allOrders.forEach(o => {
    if (!o.createdAt) return;
    const date = new Date(o.createdAt).toLocaleDateString();
    dateMap[date] = (dateMap[date] || 0) + (o.total || 0);
  });
  
  const dates = Object.keys(dateMap).sort();
  if (!dates.length) {
    ctx.fillStyle = "#999";
    ctx.font = "14px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("No sales data", canvas.width/2, canvas.height/2);
    return;
  }
  
  const values = dates.map(d => dateMap[d]);
  const maxVal = Math.max(...values);
  
  const barWidth = Math.min((canvas.width - 80) / dates.length - 5, 60);
  const chartHeight = 250;
  
  dates.forEach((date, i) => {
    const val = dateMap[date];
    const barHeight = (val / maxVal) * chartHeight;
    const x = 50 + (i * (canvas.width - 80) / dates.length);
    const y = chartHeight - barHeight + 20;
    
    ctx.fillStyle = "#2A6041";
    ctx.fillRect(x, y, barWidth, barHeight);
    
    ctx.fillStyle = "#333";
    ctx.font = "10px sans-serif";
    ctx.save();
    ctx.translate(x + barWidth/2, chartHeight + 30);
    ctx.rotate(-0.5);
    ctx.textAlign = "right";
    ctx.fillText(date, 0, 0);
    ctx.restore();
  });
}

async function updateStatus(orderId, status) {
  try {
    await fetch("/api/admin/update-status", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-admin-secret": getSecret()
      },
      body: JSON.stringify({orderId, status})
    });
    
    const order = allOrders.find(o => o.id === orderId);
    if (order) order.status = status;
    
    renderEverything();
    showToast("Status updated");
  } catch (e) {
    alert("Update failed");
  }
}

async function generateInvoice(orderId) {
  try {
    const res = await fetch("/api/admin/generate-invoice", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-admin-secret": getSecret()
      },
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
    
    showToast("Invoice downloaded");
  } catch (e) {
    alert("Invoice failed");
  }
}

function showTab(tab) {
  document.querySelectorAll(".tab-page").forEach(p => p.classList.remove("active"));
  document.querySelectorAll(".nav-item").forEach(n => n.classList.remove("active"));
  $(`tab-${tab}`).classList.add("active");
  $(`nav-${tab}`).classList.add("active");
  
  if (tab === "analytics") renderEverything();
}

function setFilter(filter, btn) {
  // Simple filter - just re-render
  renderEverything();
}

function setPeriod(period, btn) {
  // Simple period - just re-render
  renderEverything();
}

document.addEventListener("DOMContentLoaded", () => {
  console.log("✅ Ready");
  
  $("login-btn")?.addEventListener("click", doLogin);
  $("psw-input")?.addEventListener("keydown", e => {
    if (e.key === "Enter") doLogin();
  });
  
  const saved = getSecret();
  if (saved) {
    $("login-screen").classList.add("hidden");
    fetch("/api/admin/orders", {headers: {"x-admin-secret": saved}})
      .then(r => r.json())
      .then(d => {
        allOrders = d.orders || [];
        renderEverything();
      });
  }
});

console.log("✅ Simple Admin Panel Loaded");