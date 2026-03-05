 // pages/api/admin-panel.js
// Serves the admin dashboard HTML directly.
// Access at: yourapp.vercel.app/api/admin-panel

export default function handler(req, res) {
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("X-Robots-Tag", "noindex, nofollow");
  res.setHeader("Cache-Control", "no-store, max-age=0");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "no-referrer");
  res.setHeader("X-Content-Type-Options", "nosniff");
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
.sidebar{position:fixed;top:0;left:0;width:240px;height:100vh;background:var(--green-dark);display:flex;flex-direction:column;padding:0;z-index:200;}
.sidebar-logo{padding:26px 24px 22px;border-bottom:1px solid rgba(255,255,255,0.08);}
.sidebar-logo h1{font-size:19px;font-weight:800;color:#fff;letter-spacing:-.4px;}
.sidebar-logo span{font-size:11px;color:rgba(255,255,255,.4);display:block;margin-top:2px;}
.sidebar-nav{padding:16px 12px;flex:1;display:flex;flex-direction:column;gap:3px;}
.nav-item{display:flex;align-items:center;gap:10px;padding:11px 14px;border-radius:var(--r-sm);color:rgba(255,255,255,.5);font-size:13.5px;font-weight:500;cursor:pointer;transition:all .18s;border:none;background:transparent;font-family:'Sora',sans-serif;width:100%;}
.nav-item:hover{background:rgba(255,255,255,.07);color:#fff;}
.nav-item.active{background:rgba(74,155,111,.22);color:#fff;}
.nav-item svg{width:16px;height:16px;flex-shrink:0;}
.main{margin-left:240px;padding:36px 40px;min-height:100vh;}
.tab-page{display:none;}.tab-page.active{display:block;}
.page-header{display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:28px;gap:16px;}
.page-header h2{font-size:26px;font-weight:800;color:var(--green-dark);letter-spacing:-.5px;}
.page-header p{font-size:13px;color:var(--text-light);margin-top:3px;}
.header-actions{display:flex;gap:8px;align-items:center;}
.stats-row{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:24px;}
.stat-card{background:var(--white);border:1px solid var(--stroke);border-radius:var(--r);padding:20px 22px;box-shadow:var(--shadow);transition:transform .2s,box-shadow .2s;position:relative;overflow:hidden;}
.stat-card::before{content:'';position:absolute;top:0;left:0;width:4px;height:100%;border-radius:4px 0 0 4px;}
.stat-card.revenue::before{background:var(--green-mid);}
.stat-card.new-c::before{background:var(--blue);}
.stat-card.confirmed::before{background:var(--gold);}
.stat-card.delivered::before{background:var(--green-light);}
.stat-card:hover{transform:translateY(-2px);box-shadow:var(--shadow-lg);}
.stat-card .s-label{font-size:11px;color:var(--text-light);font-weight:600;text-transform:uppercase;letter-spacing:.6px;margin-bottom:8px;}
.stat-card .s-value{font-size:28px;font-weight:800;letter-spacing:-1px;}
.stat-card.revenue .s-value{color:var(--green-dark);}
.stat-card.new-c .s-value{color:var(--blue);}
.stat-card.confirmed .s-value{color:var(--gold);}
.stat-card.delivered .s-value{color:var(--green-light);}
.stat-card .s-sub{font-size:11px;color:var(--text-light);margin-top:4px;}
.stat-card .s-trend{display:inline-flex;align-items:center;gap:3px;font-size:11px;font-weight:600;padding:2px 7px;border-radius:20px;margin-top:6px;}
.s-trend.up{background:#E8F5EE;color:var(--green-mid);}
.period-bar{display:flex;gap:6px;background:var(--surface);padding:4px;border-radius:var(--r-sm);border:1px solid var(--stroke);width:fit-content;margin-bottom:24px;}
.period-btn{padding:7px 16px;border-radius:8px;border:none;font-family:'Sora',sans-serif;font-size:12px;font-weight:600;color:var(--text-light);cursor:pointer;background:transparent;transition:all .18s;}
.period-btn.active{background:var(--white);color:var(--green-dark);box-shadow:0 1px 8px rgba(0,0,0,.08);}
.three-col{display:grid;grid-template-columns:1fr 1fr 1fr;gap:16px;margin-bottom:16px;}
.section-card{background:var(--white);border:1px solid var(--stroke);border-radius:var(--r);padding:18px 20px;box-shadow:var(--shadow);}
.section-card h3{font-size:14px;font-weight:800;color:var(--green-dark);letter-spacing:-.2px;}
.section-sub{font-size:12px;color:var(--text-light);margin-top:4px;}
.seg-ctrl{display:flex;background:var(--surface);border:1px solid var(--stroke);border-radius:var(--r-sm);padding:3px;gap:2px;}
.seg-btn{padding:6px 14px;border-radius:7px;border:none;font-family:'Sora',sans-serif;font-size:12px;font-weight:600;color:var(--text-light);cursor:pointer;background:transparent;transition:all .18s;}
.seg-btn.active{background:var(--white);color:var(--green-dark);box-shadow:0 1px 6px rgba(0,0,0,.08);}
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
.prod-cat{display:inline-flex;align-items:center;gap:6px;font-size:11px;font-weight:800;padding:4px 10px;border-radius:999px;border:1px solid rgba(0,0,0,.06);white-space:nowrap;}
.rev-val{font-weight:900;color:var(--green-dark);white-space:nowrap;}
.share-wrap{display:flex;align-items:center;gap:10px;justify-content:flex-end;}
.prog-bar-wrap{width:110px;background:var(--surface);border-radius:999px;height:8px;overflow:hidden;}
.prog-bar{height:100%;border-radius:999px;background:var(--green-mid);transition:width 1s ease;}
.share-pct{font-size:11px;color:var(--text-light);min-width:34px;text-align:right;}
.toolbar{display:flex;align-items:center;gap:10px;margin-bottom:20px;flex-wrap:wrap;}
.filter-tabs{display:flex;gap:7px;flex-wrap:wrap;flex:1;}
.filter-tab{padding:8px 16px;border-radius:20px;border:1px solid var(--stroke);background:var(--white);font-family:'Sora',sans-serif;font-size:12.5px;font-weight:500;color:var(--text-mid);cursor:pointer;transition:all .18s;display:flex;align-items:center;gap:5px;}
.filter-tab:hover{border-color:var(--green-mid);color:var(--green-mid);}
.filter-tab.active{background:var(--green-mid);color:#fff;border-color:var(--green-mid);font-weight:600;}
.filter-tab .badge{background:rgba(255,255,255,.25);padding:1px 7px;border-radius:10px;font-size:11px;font-weight:700;}
.filter-tab:not(.active) .badge{background:var(--green-pale);color:var(--green-mid);}
.search-box{display:flex;align-items:center;gap:8px;background:var(--white);border:1px solid var(--stroke);border-radius:var(--r-sm);padding:9px 14px;min-width:200px;}
.search-box input{border:none;outline:none;font-family:'Sora',sans-serif;font-size:13px;color:var(--text-dark);background:transparent;width:100%;}
.search-box input::placeholder{color:var(--text-light);}
.refresh-btn{padding:9px 14px;border-radius:var(--r-sm);border:1px solid var(--stroke);background:var(--white);cursor:pointer;display:flex;align-items:center;gap:6px;font-family:'Sora',sans-serif;font-size:13px;color:var(--text-mid);transition:all .18s;}
.refresh-btn:hover{border-color:var(--green-mid);color:var(--green-mid);}
.orders-grid{display:grid;gap:14px;}
.order-card{background:var(--white);border:1px solid var(--stroke);border-radius:var(--r);box-shadow:var(--shadow);overflow:hidden;transition:box-shadow .2s,transform .2s;animation:fadeUp .3s ease both;}
.order-card:hover{box-shadow:var(--shadow-lg);transform:translateY(-1px);}
@keyframes fadeUp{from{opacity:0;transform:translateY(12px);}to{opacity:1;transform:translateY(0);}}
.order-header{display:flex;align-items:center;justify-content:space-between;padding:16px 20px 13px;border-bottom:1px solid var(--stroke);}
.order-id{font-family:'JetBrains Mono',monospace;font-size:14px;font-weight:600;color:var(--green-dark);}
.order-date{font-size:11.5px;color:var(--text-light);margin-top:2px;}
.status-badge{display:inline-flex;align-items:center;gap:5px;padding:5px 12px;border-radius:20px;font-size:11.5px;font-weight:700;}
.status-badge.new{background:var(--blue-pale);color:var(--blue);}
.status-badge.confirmed{background:var(--gold-pale);color:var(--gold);}
.status-badge.delivered{background:var(--green-pale);color:var(--green-mid);}
.status-badge.cancelled{background:#FFEBEE;color:var(--error);}
.order-body{padding:16px 20px;}
.customer-info{display:flex;gap:20px;flex-wrap:wrap;margin-bottom:14px;}
.customer-info .field{display:flex;align-items:center;gap:6px;font-size:12.5px;color:var(--text-mid);}
.customer-info .field svg{color:var(--green-mid);flex-shrink:0;}
.customer-info .field strong{color:var(--text-dark);font-weight:600;}
.items-table{width:100%;border-collapse:collapse;margin-bottom:12px;}
.items-table tr{border-bottom:1px solid var(--stroke);}
.items-table tr:last-child{border-bottom:none;}
.items-table td{padding:8px 0;font-size:12.5px;color:var(--text-mid);}
.items-table td.item-name{color:var(--text-dark);font-weight:500;}
.items-table td.item-price{text-align:right;font-weight:700;color:var(--green-dark);white-space:nowrap;}
.order-footer{display:flex;align-items:center;justify-content:space-between;padding:14px 20px;background:var(--off-white);border-top:1px solid var(--stroke);gap:12px;flex-wrap:wrap;}
.order-total .total-label{font-size:10px;color:var(--text-light);font-weight:500;}
.order-total .total-value{font-size:20px;font-weight:800;color:var(--green-dark);letter-spacing:-.5px;}
.order-actions{display:flex;gap:7px;flex-wrap:wrap;}
.btn{display:inline-flex;align-items:center;gap:6px;padding:8px 14px;border-radius:var(--r-sm);font-family:'Sora',sans-serif;font-size:12.5px;font-weight:600;cursor:pointer;transition:all .18s;border:none;white-space:nowrap;}
.btn svg{width:13px;height:13px;}
.btn-whatsapp{background:var(--whatsapp);color:#fff;}
.btn-whatsapp:hover{background:#1da84e;}
.btn-phone{background:var(--white);color:var(--green-mid);border:1px solid var(--stroke);}
.btn-phone:hover{border-color:var(--green-mid);background:var(--green-pale);}
.btn-confirm{background:var(--gold-pale);color:var(--gold);border:1px solid #f5d080;}
.btn-confirm:hover{background:#fdeea0;}
.btn-deliver{background:var(--green-pale);color:var(--green-mid);border:1px solid #b2ddc4;}
.btn-deliver:hover{background:#cceedd;}
.btn-cancel{background:#FFEBEE;color:var(--error);border:1px solid #ffcdd2;}
.btn-cancel:hover{background:#ffcdd2;}
.empty-state{text-align:center;padding:70px 40px;color:var(--text-light);}
.empty-state .emoji{font-size:44px;margin-bottom:14px;}
.empty-state h3{font-size:17px;font-weight:700;color:var(--text-mid);margin-bottom:6px;}
.loading-state{display:flex;align-items:center;justify-content:center;padding:70px;gap:12px;color:var(--text-light);}
.spinner{width:22px;height:22px;border:3px solid var(--stroke);border-top-color:var(--green-mid);border-radius:50%;animation:spin .65s linear infinite;}
@keyframes spin{to{transform:rotate(360deg);}}
.toast{position:fixed;bottom:26px;right:26px;background:var(--green-dark);color:#fff;padding:12px 20px;border-radius:var(--r-sm);font-size:13px;font-weight:600;box-shadow:var(--shadow-lg);transform:translateY(80px);opacity:0;transition:all .35s cubic-bezier(.34,1.56,.64,1);z-index:9999;}
.toast.show{transform:translateY(0);opacity:1;}
/* LOGIN */
#login-screen{position:fixed;inset:0;z-index:9999;background:var(--green-dark);display:flex;align-items:center;justify-content:center;}
#login-screen.hidden{display:none;}
.login-bg{position:absolute;inset:0;overflow:hidden;pointer-events:none;}
.login-bg-circle{position:absolute;border-radius:50%;opacity:.07;}
.login-bg-circle.c1{width:520px;height:520px;background:#4A9B6F;top:-120px;right:-100px;}
.login-bg-circle.c2{width:380px;height:380px;background:#C8790A;bottom:-80px;left:-80px;}
.login-bg-circle.c3{width:200px;height:200px;background:#fff;top:40%;left:12%;}
.login-box{position:relative;z-index:2;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.12);border-radius:24px;padding:48px 44px;width:100%;max-width:400px;backdrop-filter:blur(20px);box-shadow:0 24px 80px rgba(0,0,0,.35);animation:loginFadeIn .5s ease both;}
@keyframes loginFadeIn{from{opacity:0;transform:translateY(28px) scale(.97);}to{opacity:1;transform:translateY(0) scale(1);}}
.login-logo{display:flex;align-items:center;gap:12px;margin-bottom:32px;}
.login-logo .logo-icon{width:46px;height:46px;border-radius:14px;background:rgba(74,155,111,.25);border:1px solid rgba(74,155,111,.4);display:flex;align-items:center;justify-content:center;font-size:22px;}
.login-logo .logo-text h1{font-size:18px;font-weight:800;color:#fff;letter-spacing:-.3px;}
.login-logo .logo-text span{font-size:11px;color:rgba(255,255,255,.4);display:block;margin-top:1px;}
.login-title{font-size:22px;font-weight:800;color:#fff;margin-bottom:6px;letter-spacing:-.4px;}
.login-sub{font-size:13px;color:rgba(255,255,255,.45);margin-bottom:28px;}
.login-field{margin-bottom:16px;}
.login-field label{display:block;font-size:11.5px;font-weight:600;color:rgba(255,255,255,.5);margin-bottom:7px;text-transform:uppercase;letter-spacing:.6px;}
.login-input-wrap{position:relative;display:flex;align-items:center;}
.login-input{width:100%;padding:13px 44px 13px 16px;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.14);border-radius:12px;color:#fff;font-family:'Sora',sans-serif;font-size:14px;outline:none;transition:border .2s,background .2s;}
.login-input::placeholder{color:rgba(255,255,255,.25);}
.login-input:focus{border-color:rgba(74,155,111,.7);background:rgba(255,255,255,.10);}
.login-input.error{border-color:rgba(183,28,28,.7);animation:shake .35s ease;}
@keyframes shake{0%,100%{transform:translateX(0);}20%{transform:translateX(-8px);}40%{transform:translateX(8px);}60%{transform:translateX(-5px);}80%{transform:translateX(5px);}}
.toggle-pw{position:absolute;right:14px;background:none;border:none;color:rgba(255,255,255,.35);cursor:pointer;padding:0;display:flex;align-items:center;transition:color .2s;}
.toggle-pw:hover{color:rgba(255,255,255,.7);}
.toggle-pw svg{width:16px;height:16px;}
.login-error{display:none;font-size:12px;color:#ef9a9a;margin-top:-8px;margin-bottom:12px;align-items:center;gap:5px;}
.login-error.show{display:flex;}
.login-btn{width:100%;padding:14px;background:var(--green-mid);border:none;border-radius:12px;color:#fff;font-family:'Sora',sans-serif;font-size:14px;font-weight:700;cursor:pointer;transition:all .2s;margin-top:8px;display:flex;align-items:center;justify-content:center;gap:8px;}
.login-btn:hover{background:var(--green-light);transform:translateY(-1px);}
.login-btn.loading{opacity:.7;pointer-events:none;}
.login-hint{margin-top:20px;padding-top:18px;border-top:1px solid rgba(255,255,255,.08);font-size:11.5px;color:rgba(255,255,255,.28);text-align:center;}
.login-hint code{font-family:'JetBrains Mono',monospace;background:rgba(255,255,255,.08);padding:2px 6px;border-radius:4px;font-size:11px;}
.logout-btn{display:flex;align-items:center;gap:10px;padding:10px 14px;border-radius:var(--r-sm);color:rgba(255,255,255,.4);font-size:13px;font-weight:500;cursor:pointer;transition:all .18s;border:none;background:transparent;font-family:'Sora',sans-serif;width:100%;margin-top:auto;}
.logout-btn:hover{background:rgba(183,28,28,.15);color:#ef9a9a;}
.logout-btn svg{width:15px;height:15px;flex-shrink:0;}
@media(max-width:900px){.sidebar{width:60px;}.sidebar-logo h1,.sidebar-logo span,.nav-item span{display:none;}.nav-item{justify-content:center;padding:13px;}.main{margin-left:60px;padding:22px 18px;}.stats-row{grid-template-columns:1fr 1fr;}.three-col{grid-template-columns:1fr 1fr;}}
@media(max-width:600px){.stats-row{grid-template-columns:1fr 1fr;}.three-col{grid-template-columns:1fr;}}
</style>
</head>
<body>

<!-- LOGIN -->
<div id="login-screen">
  <div class="login-bg">
    <div class="login-bg-circle c1"></div>
    <div class="login-bg-circle c2"></div>
    <div class="login-bg-circle c3"></div>
  </div>
  <div class="login-box">
    <div class="login-logo">
      <div class="logo-icon">
        <img src="/brand/logo17.png" alt="مواسم الخير" style="width: 60px; height: 60px; border-radius: 12px; border: 3px solid rgba(255,255,255,0.2);">
      </div>
      <div class="login-logo-text">
        <h1 style="font-size:18px;font-weight:800;color:#fff;letter-spacing:-.3px;">مواسم الخير</h1>
        <span style="font-size:11px;color:rgba(255,255,255,.4);display:block;margin-top:1px;">MAWASEM AL-KHAIR</span>
      </div>
    </div>
    <div class="login-title">Welcome back</div>
    <div class="login-sub">Enter your password to access the dashboard</div>
    <div class="login-field">
      <label>Password</label>
      <div class="login-input-wrap">
        <input class="login-input" id="psw-input" type="password" placeholder="••••••••"
          onkeydown="if(event.key==='Enter')doLogin()" autocomplete="current-password"/>
        <button class="toggle-pw" onclick="togglePsw()" tabindex="-1">
          <svg id="eye-show" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
          <svg id="eye-hide" style="display:none" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
        </button>
      </div>
    </div>
    <div class="login-error" id="login-error">
      <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
      <span id="login-error-msg">Incorrect password. Please try again.</span>
    </div>
    <button class="login-btn" id="login-btn" onclick="doLogin()">
      <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
      Sign In
    </button>
    <div class="login-hint">Password = <code>ADMIN_SECRET</code> from your Vercel env vars</div>
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
    <button class="nav-item active" id="nav-analytics" onclick="showTab('analytics')">
      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
      <span>Analytics</span>
    </button>
    <button class="nav-item" id="nav-orders" onclick="showTab('orders')">
      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="2"/><line x1="9" y1="12" x2="15" y2="12"/><line x1="9" y1="16" x2="13" y2="16"/></svg>
      <span>Orders</span>
    </button>

    <!-- CUSTOMERS NAV (added per instructions) -->
    <button class="nav-item" id="nav-customers" onclick="showTab('customers')">
      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
      <span>Customers</span>
    </button>

    <!-- INVENTORY NAV -->
    <button class="nav-item" id="nav-inventory" onclick="showTab('inventory')">
      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
        <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
        <line x1="12" y1="22.08" x2="12" y2="12"/>
      </svg>
      <span>Inventory</span>
    </button>
  </nav>
  <div style="padding:10px 12px 16px;border-top:1px solid rgba(255,255,255,.07);">
    <button class="logout-btn" onclick="doLogout()">
      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
      <span>Logout</span>
    </button>
    <div style="padding:8px 2px 0;font-size:11px;color:rgba(255,255,255,.2);">v2.0 · مواسم الخير</div>
  </div>
</aside>

<!-- MAIN -->
<main class="main">

  <!-- ANALYTICS TAB -->
  <div class="tab-page active" id="tab-analytics">
    <div class="page-header">
      <div><h2>Analytics</h2><p id="analytics-subtitle">Performance overview</p></div>
      <div class="header-actions">
        <div class="period-bar">
          <button class="period-btn" onclick="setPeriod('7',this)">7d</button>
          <button class="period-btn active" onclick="setPeriod('30',this)">30d</button>
          <button class="period-btn" onclick="setPeriod('90',this)">90d</button>
          <button class="period-btn" onclick="setPeriod('all',this)">All</button>
        </div>
      </div>
    </div>
    <div class="stats-row">
      <div class="stat-card revenue"><div class="s-label">Total Revenue</div><div class="s-value" id="a-revenue">€0</div><div class="s-trend up" id="a-rev-trend">loading...</div></div>
      <div class="stat-card new-c"><div class="s-label">Total Orders</div><div class="s-value" id="a-orders">0</div><div class="s-sub">all time</div></div>
      <div class="stat-card confirmed"><div class="s-label">Avg Order Value</div><div class="s-value" id="a-avg">€0</div><div class="s-sub">per order</div></div>
      <div class="stat-card delivered"><div class="s-label">Delivery Rate</div><div class="s-value" id="a-rate">0%</div><div class="s-sub">delivered / total</div></div>
    </div>
    <div class="three-col" style="margin-bottom:16px;">
      <div class="section-card"><div style="font-size:22px;margin-bottom:8px;">📦</div><div style="font-size:24px;font-weight:900;color:var(--green-dark)" id="kpi-items">0</div><div style="font-size:11px;color:var(--text-light);margin-top:3px;">Total Items Sold</div></div>
      <div class="section-card"><div style="font-size:22px;margin-bottom:8px;">👥</div><div style="font-size:24px;font-weight:900;color:var(--green-dark)" id="kpi-customers">0</div><div style="font-size:11px;color:var(--text-light);margin-top:3px;">Unique Customers</div></div>
      <div class="section-card"><div style="font-size:22px;margin-bottom:8px;">🏆</div><div style="font-size:18px;font-weight:900;color:var(--green-dark)" id="kpi-top-product">—</div><div style="font-size:11px;color:var(--text-light);margin-top:3px;">Best-Selling Product</div></div>
    </div>
    <div class="section-card" style="margin-bottom:16px;">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px;">
        <div><h3>Sales over Time</h3><div class="section-sub">Revenue by day / month / year</div></div>
        <div class="seg-ctrl">
          <button class="seg-btn active" onclick="setTimeSeg('day',this)">Day</button>
          <button class="seg-btn" onclick="setTimeSeg('month',this)">Month</button>
          <button class="seg-btn" onclick="setTimeSeg('year',this)">Year</button>
        </div>
      </div>
      <canvas id="chartTime" style="display:block;width:100%;height:260px;margin-top:16px;"></canvas>
    </div>
    <div class="section-card" style="margin-bottom:16px;">
      <h3>Top Products by Revenue</h3><div class="section-sub">Best performing products</div>
      <div class="table-shell"><div class="table-scroll"><table class="top-table">
        <thead><tr><th class="cell-rank">#</th><th>Product</th><th>Category</th><th>Qty</th><th>Revenue</th><th style="text-align:right">Share</th></tr></thead>
        <tbody id="top-products-body"></tbody>
      </table></div></div>
    </div>
    <div class="section-card">
      <h3>Customers</h3><div class="section-sub">All customers by total spend</div>
      <div class="table-shell"><div class="table-scroll"><table class="top-table">
        <thead><tr><th class="cell-rank">#</th><th>Customer</th><th>Phone</th><th>Orders</th><th style="text-align:right">Total Spend</th></tr></thead>
        <tbody id="customers-body"></tbody>
      </table></div></div>
    </div>
  </div>

  <!-- ORDERS TAB -->
  <div class="tab-page" id="tab-orders">
    <div class="page-header"><div><h2>Orders</h2><p id="order-count-label">Loading...</p></div></div>
    <div class="stats-row">
      <div class="stat-card revenue"><div class="s-label">Revenue</div><div class="s-value" id="stat-revenue">€0</div><div class="s-sub">all orders</div></div>
      <div class="stat-card new-c"><div class="s-label">New</div><div class="s-value" id="stat-new">0</div><div class="s-sub">awaiting</div></div>
      <div class="stat-card confirmed"><div class="s-label">Confirmed</div><div class="s-value" id="stat-confirmed">0</div><div class="s-sub">to deliver</div></div>
      <div class="stat-card delivered"><div class="s-label">Delivered</div><div class="s-value" id="stat-delivered">0</div><div class="s-sub">completed</div></div>
    </div>
    <div class="toolbar">
      <div class="filter-tabs">
        <button class="filter-tab active" onclick="setFilter('all',this)">🌿 All <span class="badge" id="badge-all">0</span></button>
        <button class="filter-tab" onclick="setFilter('new',this)">🆕 New <span class="badge" id="badge-new">0</span></button>
        <button class="filter-tab" onclick="setFilter('confirmed',this)">✅ Confirmed <span class="badge" id="badge-confirmed">0</span></button>
        <button class="filter-tab" onclick="setFilter('delivered',this)">📦 Delivered <span class="badge" id="badge-delivered">0</span></button>
        <button class="filter-tab" onclick="setFilter('cancelled',this)">❌ Cancelled <span class="badge" id="badge-cancelled">0</span></button>
      </div>
      <div class="search-box">
        <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        <input id="search-input" placeholder="Search orders, customers…" oninput="renderOrders()"/>
      </div>
      <button class="refresh-btn" onclick="loadOrders()">
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
        Refresh
      </button>
    </div>
    <div class="loading-state" id="loading-indicator"><div class="spinner"></div><span>Loading orders…</span></div>
    <div class="orders-grid" id="orders-grid"></div>
  </div>

  <!-- CUSTOMERS TAB (added per instructions - placed AFTER orders tab, not nested) -->
  <div class="tab-page" id="tab-customers">
    <div class="page-header">
      <div>
        <h2>Customers</h2>
        <p id="customer-count-label">Loading...</p>
      </div>
      <button class="refresh-btn" onclick="loadCustomers()">
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
          <polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/>
          <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
        </svg>
        Refresh
      </button>
    </div>

    <div class="section-card">
      <div class="table-shell">
        <div class="table-scroll">
          <table class="top-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Customer</th>
                <th>Phone</th>
                <th>Address</th>
                <th>Orders</th>
                <th>Total Spent</th>
                <th style="text-align:right">Actions</th>
              </tr>
            </thead>
            <tbody id="customers-table-body"></tbody>
          </table>
        </div>
      </div>
    </div>
  </div>

  <!-- INVENTORY TAB -->
  <div class="tab-page" id="tab-inventory">
    <div class="page-header">
      <div>
        <h2>Inventory Management</h2>
        <p id="inventory-subtitle">Stock levels and alerts</p>
      </div>
      <button class="refresh-btn" onclick="loadInventory()">
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
          <polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/>
          <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
        </svg>
        Refresh
      </button>
    </div>

    <!-- Summary Stats -->
    <div class="stats-row">
      <div class="stat-card revenue">
        <div class="s-label">Total Products</div>
        <div class="s-value" id="inv-total">0</div>
        <div class="s-sub">in catalog</div>
      </div>
      <div class="stat-card new-c">
        <div class="s-label">In Stock</div>
        <div class="s-value" id="inv-instock">0</div>
        <div class="s-sub">available</div>
      </div>
      <div class="stat-card confirmed">
        <div class="s-label">Low Stock</div>
        <div class="s-value" id="inv-lowstock">0</div>
        <div class="s-sub">needs attention</div>
      </div>
      <div class="stat-card delivered">
        <div class="s-label">Out of Stock</div>
        <div class="s-value" id="inv-outofstock">0</div>
        <div class="s-sub">unavailable</div>
      </div>
    </div>

    <!-- Inventory Table -->
    <div class="section-card">
      <div class="table-shell">
        <div class="table-scroll">
          <table class="top-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Product</th>
                <th>SKU</th>
                <th>Category</th>
                <th>Stock</th>
                <th>Status</th>
                <th>Price</th>
                <th style="text-align:right">Actions</th>
              </tr>
            </thead>
            <tbody id="inventory-table-body"></tbody>
          </table>
        </div>
      </div>
    </div>
  </div>

</main>

<div class="toast" id="toast"></div>

<script src="/admin-panel.js?v=1" defer></script>
</body>
</html>
`);
}