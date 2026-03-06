 // DIAGNOSTIC VERSION - Shows exact data format
// Put this in: public/admin-panel.js

console.log("🔍 DIAGNOSTIC MODE ACTIVE");

let allOrders = [];
const SESSION_KEY = "gh_admin_secret";
const $ = (id) => document.getElementById(id);
const getSecret = () => sessionStorage.getItem(SESSION_KEY) || "";
const setSecret = (v) => sessionStorage.setItem(SESSION_KEY, v);

const doLogin = async () => {
  const inp = $("psw-input");
  const btn = $("login-btn");
  
  btn.disabled = true;
  btn.textContent = "Checking...";
  
  try {
    const res = await fetch("/api/admin/orders", {
      headers: {"x-admin-secret": inp.value}
    });
    
    if (!res.ok) throw new Error("Failed");
    
    const data = await res.json();
    
    console.log("=".repeat(80));
    console.log("📊 FULL API RESPONSE:");
    console.log(JSON.stringify(data, null, 2));
    console.log("=".repeat(80));
    
    if (data.orders && data.orders[0]) {
      console.log("🔍 FIRST ORDER - RAW:");
      console.log(JSON.stringify(data.orders[0], null, 2));
      console.log("=".repeat(80));
      
      const order = data.orders[0];
      
      console.log("📦 ORDER STRUCTURE:");
      console.log("- order.id:", order.id);
      console.log("- order.customer:", order.customer);
      console.log("- order.customerName:", order.customerName);
      console.log("- order.customerPhone:", order.customerPhone);
      console.log("- order.customerAddress:", order.customerAddress);
      console.log("=".repeat(80));
      
      if (order.customer) {
        console.log("👤 CUSTOMER OBJECT:");
        console.log("- customer.name:", order.customer.name);
        console.log("- customer.phone:", order.customer.phone);
        console.log("- customer.address:", order.customer.address);
        console.log("=".repeat(80));
      }
      
      if (order.items && order.items[0]) {
        console.log("🛒 FIRST ITEM:");
        console.log(JSON.stringify(order.items[0], null, 2));
        console.log("=".repeat(80));
      }
    }
    
    alert("CHECK CONSOLE (F12) - Look for the data structure, then send me a screenshot!");
    
    setSecret(inp.value);
    allOrders = data.orders || [];
    $("login-screen")?.classList.add("hidden");
    
    // Show simple message
    const grid = $("orders-grid");
    if (grid) {
      grid.innerHTML = `
        <div style="background:white;padding:40px;border-radius:12px;text-align:center;">
          <h2 style="color:#2A6041;margin-bottom:20px;">✅ Diagnostic Complete!</h2>
          <p style="font-size:16px;margin-bottom:20px;">Check the browser console (Press F12)</p>
          <p style="font-size:14px;color:#666;">Look for the data structure and send me a screenshot</p>
          <p style="font-size:14px;color:#666;margin-top:30px;">Found ${allOrders.length} orders</p>
        </div>
      `;
    }
    
  } catch (e) {
    console.error("❌ Error:", e);
    alert("Login failed: " + e.message);
  } finally {
    btn.disabled = false;
    btn.textContent = "Sign In";
  }
};

document.addEventListener("DOMContentLoaded", () => {
  $("login-btn")?.addEventListener("click", doLogin);
  $("psw-input")?.addEventListener("keydown", e => { if (e.key === "Enter") doLogin(); });
  
  const saved = getSecret();
  if (saved) {
    $("login-screen")?.classList.add("hidden");
    
    // Auto-run diagnostic
    fetch("/api/admin/orders", {
      headers: {"x-admin-secret": saved}
    })
    .then(res => res.json())
    .then(data => {
      console.log("=".repeat(80));
      console.log("📊 AUTO-LOADED ORDERS:");
      console.log(JSON.stringify(data.orders?.[0], null, 2));
      console.log("=".repeat(80));
      
      allOrders = data.orders || [];
      const grid = $("orders-grid");
      if (grid) {
        grid.innerHTML = `
          <div style="background:white;padding:40px;border-radius:12px;text-align:center;">
            <h2 style="color:#2A6041;margin-bottom:20px;">✅ Data Loaded!</h2>
            <p style="font-size:16px;margin-bottom:20px;">Check console (F12) for data structure</p>
            <p style="font-size:14px;color:#666;">${allOrders.length} orders found</p>
            <button onclick="location.reload()" style="margin-top:20px;padding:12px 24px;background:#2A6041;color:white;border:none;border-radius:8px;cursor:pointer;">Reload</button>
          </div>
        `;
      }
    });
  }
});

console.log("🔍 DIAGNOSTIC MODE READY - Login to see data structure");