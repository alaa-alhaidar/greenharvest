// pages/api/admin-panel.js
// Serves the admin dashboard HTML.
// Access at: /api/admin-panel

export default function handler(req, res) {
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("X-Robots-Tag", "noindex, nofollow");

  // Recommended security headers (safe even on Vercel)
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "no-referrer");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");

  // If you have CSP globally, this helps. If you don't use CSP, it's harmless to remove.
  // NOTE: We avoid inline scripts now, so no 'unsafe-inline' for script-src needed.
  res.setHeader(
    "Content-Security-Policy",
    [
      "default-src 'self'",
      "img-src 'self' data: https:",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com", // you have inline <style>
      "font-src 'self' https://fonts.gstatic.com",
      "script-src 'self'", // external script only
      "frame-ancestors 'none'",
    ].join("; ")
  );

  res.status(200).send(`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<meta name="robots" content="noindex, nofollow"/>
<title>مواسم الخير · لوحة التحكم</title>
<link href="https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet"/>

<style>
:root {
  --green-dark:#1E3D2F;--green-mid:#2A6041;--green-light:#4A9B6F;
  --green-pale:#E8F5EE;--gold:#C8790A;--gold-pale:#FFF8E1;
  --surface:#F0EDE6;--stroke:#E2DDD5;--white:#FFFFFF;--off-white:#F8F6F1;
  --text-dark:#1A1A1A;--text-mid:#4A4A4A;--text-light:#8A8A8A;
  --error:#B71C1C;--whatsapp:#25D366;--blue:#1565C0;--blue-pale:#E3F2FD;
  --shadow:0 2px 16px rgba(30,61,47,0.09);--shadow-lg:0 8px 40px rgba(30,61,47,0.14);
  --r:16px;--r-sm:10px;
}
*{box-sizing:border-box;margin:0;padding:0;}
body{font-family:'Sora',sans-serif;background:var(--off-white);color:var(--text-dark);min-height:100vh;}
/* Sidebar */
.sidebar{position:fixed;top:0;left:0;width:240px;height:100vh;background:var(--green-dark);display:flex;flex-direction:column;z-index:200;}
.sidebar-logo{padding:26px 24px 22px;border-bottom:1px solid rgba(255,255,255,0.08);}
.sidebar-logo h1{font-size:19px;font-weight:800;color:#fff;letter-spacing:-.4px;}
.sidebar-logo span{font-size:11px;color:rgba(255,255,255,.4);display:block;margin-top:2px;}
.sidebar-nav{padding:16px 12px;flex:1;display:flex;flex-direction:column;gap:3px;}
.nav-item{display:flex;align-items:center;gap:10px;padding:11px 14px;border-radius:var(--r-sm);color:rgba(255,255,255,.5);font-size:13.5px;font-weight:500;cursor:pointer;transition:all .18s;border:none;background:transparent;font-family:'Sora',sans-serif;width:100%;}
.nav-item:hover{background:rgba(255,255,255,.07);color:#fff;}
.nav-item.active{background:rgba(74,155,111,.22);color:#fff;}
.nav-item svg{width:16px;height:16px;flex-shrink:0;}
.logout-btn{display:flex;align-items:center;gap:10px;padding:10px 14px;border-radius:var(--r-sm);color:rgba(255,255,255,.4);font-size:13px;font-weight:500;cursor:pointer;transition:all .18s;border:none;background:transparent;font-family:'Sora',sans-serif;width:100%;}
.logout-btn:hover{background:rgba(183,28,28,.15);color:#ef9a9a;}
/* Main */
.main{margin-left:240px;padding:36px 40px;min-height:100vh;}
.tab-page{display:none;}
.tab-page.active{display:block;}
.page-header{display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:28px;gap:16px;}
.page-header h2{font-size:26px;font-weight:800;color:var(--green-dark);letter-spacing:-.5px;}
.page-header p{font-size:13px;color:var(--text-light);margin-top:3px;}
.header-actions{display:flex;gap:8px;align-items:center;}
/* Cards & tables */
.stats-row{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:24px;}
.stat-card{background:var(--white);border:1px solid var(--stroke);border-radius:var(--r);padding:20px 22px;box-shadow:var(--shadow);position:relative;overflow:hidden;}
.stat-card::before{content:'';position:absolute;top:0;left:0;width:4px;height:100%;border-radius:4px 0 0 4px;}
.stat-card.revenue::before{background:var(--green-mid);}
.stat-card.new-c::before{background:var(--blue);}
.stat-card.confirmed::before{background:var(--gold);}
.stat-card.delivered::before{background:var(--green-light);}
.stat-card .s-label{font-size:11px;color:var(--text-light);font-weight:600;text-transform:uppercase;letter-spacing:.6px;margin-bottom:8px;}
.stat-card .s-value{font-size:28px;font-weight:800;letter-spacing:-1px;}
.stat-card .s-sub{font-size:11px;color:var(--text-light);margin-top:4px;}
.period-bar{display:flex;gap:6px;background:var(--surface);padding:4px;border-radius:var(--r-sm);border:1px solid var(--stroke);width:fit-content;}
.period-btn{padding:7px 16px;border-radius:8px;border:none;font-family:'Sora',sans-serif;font-size:12px;font-weight:600;color:var(--text-light);cursor:pointer;background:transparent;transition:all .18s;}
.period-btn.active{background:var(--white);color:var(--green-dark);box-shadow:0 1px 8px rgba(0,0,0,.08);}
.section-card{background:var(--white);border:1px solid var(--stroke);border-radius:var(--r);padding:18px 20px;box-shadow:var(--shadow);margin-bottom:16px;}
.section-card h3{font-size:14px;font-weight:800;color:var(--green-dark);}
.section-sub{font-size:12px;color:var(--text-light);margin-top:4px;}
.table-shell{margin-top:12px;background:var(--white);border:1px solid var(--stroke);border-radius:14px;overflow:hidden;}
.table-scroll{overflow:auto;max-width:100%;-webkit-overflow-scrolling:touch;}
.top-table{width:100%;border-collapse:separate;border-spacing:0;min-width:780px;}
.top-table thead th{position:sticky;top:0;z-index:2;background:linear-gradient(#ffffff,#fbfaf7);font-size:11px;font-weight:800;color:var(--text-light);text-transform:uppercase;letter-spacing:.6px;padding:12px 14px;text-align:left;border-bottom:1px solid var(--stroke);white-space:nowrap;}
.top-table tbody td{padding:12px 14px;font-size:13px;color:var(--text-mid);border-bottom:1px solid rgba(226,221,213,.85);vertical-align:middle;}
.top-table tbody tr:nth-child(even){background:#FCFBF8;}
.top-table tbody tr:hover{background:#F3F1EC;}
.top-table tbody tr:last-child td{border-bottom:none;}
.top-table th:last-child,.top-table td:last-child{text-align:right;}
.cell-mono{font-family:'JetBrains Mono',monospace;font-size:12px;color:var(--text-mid);}
.cell-rank{width:56px;}
.cell-rank .rank-pill{width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:900;font-size:12px;background:var(--surface);color:var(--green-dark);border:1px solid var(--stroke);}
.prod-name{color:var(--text-dark);font-weight:700;}
.rev-val{font-weight:900;color:var(--green-dark);white-space:nowrap;}
/* Toolbar */
.toolbar{display:flex;align-items:center;gap:10px;margin-bottom:20px;flex-wrap:wrap;}
.filter-tabs{display:flex;gap:7px;flex-wrap:wrap;flex:1;}
.filter-tab{padding:8px 16px;border-radius:20px;border:1px solid var(--stroke);background:var(--white);font-family:'Sora',sans-serif;font-size:12.5px;font-weight:500;color:var(--text-mid);cursor:pointer;transition:all .18s;display:flex;align-items:center;gap:5px;}
.filter-tab.active{background:var(--green-mid);color:#fff;border-color:var(--green-mid);font-weight:600;}
.filter-tab .badge{background:rgba(255,255,255,.25);padding:1px 7px;border-radius:10px;font-size:11px;font-weight:700;}
.filter-tab:not(.active) .badge{background:var(--green-pale);color:var(--green-mid);}
.search-box{display:flex;align-items:center;gap:8px;background:var(--white);border:1px solid var(--stroke);border-radius:var(--r-sm);padding:9px 14px;min-width:200px;}
.search-box input{border:none;outline:none;font-family:'Sora',sans-serif;font-size:13px;color:var(--text-dark);background:transparent;width:100%;}
.refresh-btn{padding:9px 14px;border-radius:var(--r-sm);border:1px solid var(--stroke);background:var(--white);cursor:pointer;display:flex;align-items:center;gap:6px;font-family:'Sora',sans-serif;font-size:13px;color:var(--text-mid);transition:all .18s;}
.refresh-btn:hover{border-color:var(--green-mid);color:var(--green-mid);}
/* Orders cards (minimal) */
.orders-grid{display:grid;gap:14px;}
.order-card{background:var(--white);border:1px solid var(--stroke);border-radius:var(--r);box-shadow:var(--shadow);overflow:hidden;}
.order-header{display:flex;align-items:center;justify-content:space-between;padding:16px 20px 13px;border-bottom:1px solid var(--stroke);}
.order-id{font-family:'JetBrains Mono',monospace;font-size:14px;font-weight:600;color:var(--green-dark);}
.order-date{font-size:11.5px;color:var(--text-light);margin-top:2px;}
.order-body{padding:16px 20px;}
.items-table{width:100%;border-collapse:collapse;margin-bottom:12px;}
.items-table tr{border-bottom:1px solid var(--stroke);}
.items-table tr:last-child{border-bottom:none;}
.items-table td{padding:8px 0;font-size:12.5px;color:var(--text-mid);}
.items-table td.item-name{color:var(--text-dark);font-weight:500;}
.items-table td.item-price{text-align:right;font-weight:700;color:var(--green-dark);white-space:nowrap;}
.order-footer{display:flex;align-items:center;justify-content:space-between;padding:14px 20px;background:var(--off-white);border-top:1px solid var(--stroke);gap:12px;flex-wrap:wrap;}
.order-total .total-label{font-size:10px;color:var(--text-light);font-weight:500;}
.order-total .total-value{font-size:20px;font-weight:800;color:var(--green-dark);letter-spacing:-.5px;}
.btn{display:inline-flex;align-items:center;gap:6px;padding:8px 14px;border-radius:var(--r-sm);font-family:'Sora',sans-serif;font-size:12.5px;font-weight:600;cursor:pointer;transition:all .18s;border:none;white-space:nowrap;}
.btn-whatsapp{background:var(--whatsapp);color:#fff;}
.btn-phone{background:var(--white);color:var(--green-mid);border:1px solid var(--stroke);}
.btn-confirm{background:var(--gold-pale);color:var(--gold);border:1px solid #f5d080;}
.btn-deliver{background:var(--green-pale);color:var(--green-mid);border:1px solid #b2ddc4;}
.btn-cancel{background:#FFEBEE;color:var(--error);border:1px solid #ffcdd2;}
/* Login */
#login-screen{position:fixed;inset:0;z-index:9999;background:var(--green-dark);display:flex;align-items:center;justify-content:center;}
#login-screen.hidden{display:none;}
.login-box{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.12);border-radius:24px;padding:42px 38px;width:100%;max-width:400px;backdrop-filter:blur(20px);box-shadow:0 24px 80px rgba(0,0,0,.35);}
.login-title{font-size:22px;font-weight:800;color:#fff;margin-bottom:6px;}
.login-sub{font-size:13px;color:rgba(255,255,255,.45);margin-bottom:18px;}
.login-field label{display:block;font-size:11.5px;font-weight:600;color:rgba(255,255,255,.5);margin-bottom:7px;text-transform:uppercase;letter-spacing:.6px;}
.login-input{width:100%;padding:13px 14px;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.14);border-radius:12px;color:#fff;font-family:'Sora',sans-serif;font-size:14px;outline:none;}
.login-error{display:none;font-size:12px;color:#ef9a9a;margin-top:10px;}
.login-error.show{display:block;}
.login-btn{width:100%;padding:14px;background:var(--green-mid);border:none;border-radius:12px;color:#fff;font-family:'Sora',sans-serif;font-size:14px;font-weight:700;cursor:pointer;margin-top:12px;}
/* Toast */
.toast{position:fixed;bottom:26px;right:26px;background:var(--green-dark);color:#fff;padding:12px 20px;border-radius:var(--r-sm);font-size:13px;font-weight:600;box-shadow:var(--shadow-lg);transform:translateY(80px);opacity:0;transition:all .35s;z-index:9999;}
.toast.show{transform:translateY(0);opacity:1;}
/* Responsive */
@media(max-width:900px){.sidebar{width:60px;}.sidebar-logo h1,.sidebar-logo span,.nav-item span{display:none;}.nav-item{justify-content:center;padding:13px;}.main{margin-left:60px;padding:22px 18px;}.stats-row{grid-template-columns:1fr 1fr;}}
@media(max-width:600px){.stats-row{grid-template-columns:1fr 1fr;}}
</style>
</head>

<body>
<!-- LOGIN -->
<div id="login-screen">
  <div class="login-box">
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:18px;">
      <img src="/brand/logo17.png" alt="مواسم الخير" style="width:60px;height:60px;border-radius:12px;border:3px solid rgba(255,255,255,0.2);" />
      <div>
        <div style="font-size:18px;font-weight:800;color:#fff;">مواسم الخير</div>
        <div style="font-size:11px;color:rgba(255,255,255,.4);margin-top:2px;">MAWASEM AL-KHAIR</div>
      </div>
    </div>

    <div class="login-title">Welcome back</div>
    <div class="login-sub">Enter your password to access the dashboard</div>

    <div class="login-field">
      <label>Password</label>
      <input class="login-input" id="psw-input" type="password" placeholder="••••••••" autocomplete="current-password"/>
      <div class="login-error" id="login-error">Incorrect password. Please try again.</div>
    </div>

    <button class="login-btn" id="login-btn">Sign In</button>
    <div style="margin-top:16px;font-size:11.5px;color:rgba(255,255,255,.28);text-align:center;">
      Password = <code style="font-family:'JetBrains Mono',monospace;background:rgba(255,255,255,.08);padding:2px 6px;border-radius:4px;">ADMIN_SECRET</code> from Vercel env vars
    </div>
  </div>
</div>

<!-- SIDEBAR -->
<aside class="sidebar">
  <div class="sidebar-logo">
    <img src="/brand/logo17.png" alt="مواسم الخير" style="width: 50px; height: 50px; border-radius: 10px; margin-bottom: 8px;">
    <h1 style="font-size: 16px; margin: 0;">مواسم الخير</h1>
    <span>MAWASEM AL-KHAIR</span>
  </div>

  <nav class="sidebar-nav">
    <button class="nav-item active" id="nav-analytics" data-tab="analytics">
      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
      <span>Analytics</span>
    </button>
    <button class="nav-item" id="nav-orders" data-tab="orders">
      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="2"/><line x1="9" y1="12" x2="15" y2="12"/><line x1="9" y1="16" x2="13" y2="16"/></svg>
      <span>Orders</span>
    </button>
    <button class="nav-item" id="nav-customers" data-tab="customers">
      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
      <span>Customers</span>
    </button>
    <button class="nav-item" id="nav-inventory" data-tab="inventory">
      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
        <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
        <line x1="12" y1="22.08" x2="12" y2="12"/>
      </svg>
      <span>Inventory</span>
    </button>

    <button class="logout-btn" id="logout-btn" style="margin-top:auto;">
      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
      <span>Logout</span>
    </button>
  </nav>

  <div style="padding:10px 12px 16px;border-top:1px solid rgba(255,255,255,.07);">
    <div style="padding:8px 2px 0;font-size:11px;color:rgba(255,255,255,.2);">v2.0 · مواسم الخير</div>
  </div>
</aside>

<!-- MAIN -->
<main class="main">

  <!-- ANALYTICS TAB -->
  <div class="tab-page active" id="tab-analytics">
    <div class="page-header">
      <div>
        <h2>Analytics</h2>
        <p id="analytics-subtitle">Performance overview</p>
      </div>
      <div class="header-actions">
        <div class="period-bar">
          <button class="period-btn" data-period="7">7d</button>
          <button class="period-btn active" data-period="30">30d</button>
          <button class="period-btn" data-period="90">90d</button>
          <button class="period-btn" data-period="all">All</button>
        </div>
      </div>
    </div>

    <div class="stats-row">
      <div class="stat-card revenue"><div class="s-label">Total Revenue</div><div class="s-value" id="a-revenue">€0</div><div class="s-sub" id="a-rev-trend">—</div></div>
      <div class="stat-card new-c"><div class="s-label">Total Orders</div><div class="s-value" id="a-orders">0</div><div class="s-sub">selected period</div></div>
      <div class="stat-card confirmed"><div class="s-label">Avg Order Value</div><div class="s-value" id="a-avg">€0</div><div class="s-sub">per order</div></div>
      <div class="stat-card delivered"><div class="s-label">Delivery Rate</div><div class="s-value" id="a-rate">0%</div><div class="s-sub">delivered / total</div></div>
    </div>

    <div class="section-card">
      <h3>Top Products by Revenue</h3>
      <div class="section-sub">Best performing products</div>
      <div class="table-shell"><div class="table-scroll">
        <table class="top-table">
          <thead><tr><th class="cell-rank">#</th><th>Product</th><th>Qty</th><th>Revenue</th></tr></thead>
          <tbody id="top-products-body"></tbody>
        </table>
      </div></div>
    </div>

    <div class="section-card">
      <h3>Customers</h3>
      <div class="section-sub">All customers by total spend (selected period)</div>
      <div class="table-shell"><div class="table-scroll">
        <table class="top-table">
          <thead><tr><th class="cell-rank">#</th><th>Customer</th><th>Phone</th><th>Orders</th><th style="text-align:right">Total Spend</th></tr></thead>
          <tbody id="customers-body"></tbody>
        </table>
      </div></div>
    </div>
  </div>

  <!-- ORDERS TAB -->
  <div class="tab-page" id="tab-orders">
    <div class="page-header">
      <div><h2>Orders</h2><p id="order-count-label">—</p></div>
      <button class="refresh-btn" id="orders-refresh-btn">Refresh</button>
    </div>

    <div class="toolbar">
      <div class="filter-tabs">
        <button class="filter-tab active" data-filter="all">🌿 All <span class="badge" id="badge-all">0</span></button>
        <button class="filter-tab" data-filter="new">🆕 New <span class="badge" id="badge-new">0</span></button>
        <button class="filter-tab" data-filter="confirmed">✅ Confirmed <span class="badge" id="badge-confirmed">0</span></button>
        <button class="filter-tab" data-filter="delivered">📦 Delivered <span class="badge" id="badge-delivered">0</span></button>
        <button class="filter-tab" data-filter="cancelled">❌ Cancelled <span class="badge" id="badge-cancelled">0</span></button>
      </div>
      <div class="search-box">
        <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        <input id="search-input" placeholder="Search orders, customers…"/>
      </div>
    </div>

    <div class="orders-grid" id="orders-grid"></div>
  </div>

  <!-- CUSTOMERS TAB -->
  <div class="tab-page" id="tab-customers">
    <div class="page-header">
      <div><h2>Customers</h2><p id="customer-count-label">—</p></div>
      <button class="refresh-btn" id="customers-refresh-btn">Refresh</button>
    </div>
    <div class="section-card">
      <div class="table-shell"><div class="table-scroll">
        <table class="top-table">
          <thead>
            <tr>
              <th>#</th><th>Customer</th><th>Phone</th><th>Address</th><th>Orders</th><th>Total Spent</th><th style="text-align:right">Actions</th>
            </tr>
          </thead>
          <tbody id="customers-table-body"></tbody>
        </table>
      </div></div>
    </div>
  </div>

  <!-- INVENTORY TAB -->
  <div class="tab-page" id="tab-inventory">
    <div class="page-header">
      <div><h2>Inventory</h2><p id="inventory-subtitle">—</p></div>
      <button class="refresh-btn" id="inventory-refresh-btn">Refresh</button>
    </div>

    <div class="section-card">
      <div class="table-shell"><div class="table-scroll">
        <table class="top-table">
          <thead>
            <tr>
              <th>#</th><th>Product</th><th>SKU</th><th>Category</th><th>Stock</th><th>Status</th><th>Price</th><th style="text-align:right">Actions</th>
            </tr>
          </thead>
          <tbody id="inventory-table-body"></tbody>
        </table>
      </div></div>
    </div>
  </div>

</main>

<div class="toast" id="toast"></div>

<!-- IMPORTANT: External JS (no inline scripts) -->
<script src="/admin-panel.js" defer></script>
</body>
</html>`);
}