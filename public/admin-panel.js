// MINIMAL VERSION - Just make it work
console.log("🟢 Loading minimal admin panel");

let orders = [];
const SECRET_KEY = "gh_admin_secret";

function $(id) { return document.getElementById(id); }

function getSecret() {
  return sessionStorage.getItem(SECRET_KEY) || "";
}

function setSecret(val) {
  sessionStorage.setItem(SECRET_KEY, val);
}

async function doLogin() {
  console.log("🔐 Attempting login");
  
  const input = $("psw-input");
  const button = $("login-btn");
  const error = $("login-error");
  
  button.disabled = true;
  button.textContent = "Checking...";
  
  try {
    const response = await fetch("/api/admin/orders", {
      headers: { "x-admin-secret": input.value }
    });
    
    console.log("📡 Response status:", response.status);
    
    if (!response.ok) {
      throw new Error("Login failed");
    }
    
    const data = await response.json();
    console.log("📦 Received data:", data);
    
    orders = data.orders || [];
    console.log("✅ Loaded", orders.length, "orders");
    
    setSecret(input.value);
    $("login-screen").classList.add("hidden");
    
    showOrders();
    
  } catch (err) {
    console.error("❌ Login error:", err);
    if (error) {
      error.textContent = "Login failed";
      error.classList.add("show");
    }
  } finally {
    button.disabled = false;
    button.textContent = "Sign In";
  }
}

function showOrders() {
  console.log("📊 Showing orders");
  
  const grid = $("orders-grid");
  const loading = $("loading-indicator");
  
  if (loading) loading.style.display = "none";
  
  // Calculate stats
  let total = 0;
  orders.forEach(o => total += (o.total || 0));
  
  // Update UI
  if ($("stat-revenue")) $("stat-revenue").textContent = "€" + total.toFixed(2);
  if ($("badge-all")) $("badge-all").textContent = orders.length;
  if ($("order-count-label")) $("order-count-label").textContent = orders.length + " orders";
  
  // Show orders
  if (!grid) return;
  
  grid.innerHTML = orders.map(order => {
    console.log("🔍 Order:", order);
    
    const id = order.shortId || "???";
    const total = order.total || 0;
    const status = (order.status || "new").toUpperCase();
    
    // Get customer data
    let name = "⚠️ No data";
    let phone = "—";
    let address = "—";
    
    if (order.customer) {
      name = order.customer.name || name;
      phone = order.customer.phone || phone;
      address = order.customer.address || address;
    } else if (order.customerName) {
      name = order.customerName;
      phone = order.customerPhone || phone;
      address = order.customerAddress || address;
    }
    
    console.log("👤 Customer:", {name, phone, address});
    
    // Get items
    let itemsHTML = "";
    if (order.items) {
      order.items.forEach(item => {
        const qty = item.quantity || item.qty || 1;
        const itemName = item.productName || item.name || "Item";
        const price = item.priceEach || item.price || 0;
        itemsHTML += `<div style="margin:4px 0">${qty}x ${itemName} - €${(price * qty).toFixed(2)}</div>`;
      });
    }
    
    return `
      <div style="background:white;padding:20px;border-radius:8px;margin-bottom:16px;border:1px solid #ddd">
        <div style="font-weight:bold;margin-bottom:8px">Order #${id}</div>
        <div style="font-size:12px;color:#666;margin-bottom:12px">${status}</div>
        
        <div style="margin-bottom:12px">
          <div>👤 ${name}</div>
          <div>📍 ${address}</div>
          <div>📱 ${phone}</div>
        </div>
        
        <div style="border-top:1px solid #eee;padding-top:12px;margin-top:12px">
          ${itemsHTML}
        </div>
        
        <div style="margin-top:12px;font-weight:bold;text-align:right">
          Total: €${total.toFixed(2)}
        </div>
      </div>
    `;
  }).join("");
  
  console.log("✅ Rendered", orders.length, "orders");
}

function showTab(tab) {
  console.log("📑 Switch to tab:", tab);
}

function setFilter(f, btn) {
  console.log("🔍 Filter:", f);
}

function setPeriod(p, btn) {
  console.log("📅 Period:", p);
}

async function updateStatus(orderId, status) {
  console.log("🔄 Update status:", orderId, status);
}

async function generateInvoice(orderId) {
  console.log("📄 Generate invoice:", orderId);
}

// Initialize
document.addEventListener("DOMContentLoaded", () => {
  console.log("✅ DOM Ready");
  
  const loginBtn = $("login-btn");
  const passwordInput = $("psw-input");
  
  if (loginBtn) loginBtn.addEventListener("click", doLogin);
  if (passwordInput) {
    passwordInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") doLogin();
    });
  }
  
  // Auto-login if saved
  const saved = getSecret();
  if (saved) {
    console.log("🔑 Found saved session");
    $("login-screen").classList.add("hidden");
    
    fetch("/api/admin/orders", {
      headers: { "x-admin-secret": saved }
    })
    .then(r => r.json())
    .then(data => {
      orders = data.orders || [];
      console.log("📦 Auto-loaded", orders.length, "orders");
      showOrders();
    })
    .catch(err => {
      console.error("❌ Auto-login failed:", err);
      $("login-screen").classList.remove("hidden");
    });
  }
});

console.log("✅ Minimal admin panel loaded");