// pages/api/admin-panel.js
// Serves the admin dashboard HTML directly.
// Access at: yourapp.vercel.app/api/admin-panel

export default function handler(req, res) {
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("X-Robots-Tag", "noindex, nofollow");
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
        <img src="/brand/logo17.png" alt="مواسم الخير" style="width: 80px; height: 80px; border-radius: 12px; border: 3px solid rgba(255,255,255,0.2);">
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

</main>

<div class="toast" id="toast"></div>

<script>
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
  document.getElementById('psw-input').value = '';
  document.getElementById('login-error').classList.remove('show');
}

function togglePsw() {
  var inp = document.getElementById('psw-input');
  var s   = document.getElementById('eye-show');
  var h   = document.getElementById('eye-hide');
  if (inp.type === 'password') { inp.type='text'; s.style.display='none'; h.style.display='block'; }
  else { inp.type='password'; s.style.display='block'; h.style.display='none'; }
}

/* ── LOAD ORDERS ── */
function loadOrders() {
  var secret = getSecret();
  if (!secret) return;
  document.getElementById('loading-indicator').style.display = 'flex';
  document.getElementById('orders-grid').innerHTML = '';

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
      document.getElementById('loading-indicator').style.display = 'none';
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
  document.getElementById('tab-'+tab).classList.add('active');
  document.getElementById('nav-'+tab).classList.add('active');

  if (tab === 'analytics') setTimeout(renderAnalytics, 50);

  // Added per instructions
  if (tab === 'customers' && allCustomers.length === 0) {
    loadCustomers();
  }
}

function setFilter(filter, btn) {
  activeFilter = filter;
  document.querySelectorAll('.filter-tab').forEach(function(b){b.classList.remove('active');});
  btn.classList.add('active');
  renderOrders();
}

function setPeriod(p, btn) {
  activePeriod = p;
  document.querySelectorAll('.period-btn').forEach(function(b){b.classList.remove('active');});
  btn.classList.add('active');
  renderAnalytics();
}

function setTimeSeg(seg, btn) {
  timeSeg = seg;
  document.querySelectorAll('.seg-btn').forEach(function(b){b.classList.remove('active');});
  btn.classList.add('active');
  buildChartTime(filterByPeriod(allOrders));
}

/* ── RENDER ORDERS ── */
function renderOrders() {
  document.getElementById('loading-indicator').style.display = 'none';
  var search = document.getElementById('search-input').value.toLowerCase();
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
  document.getElementById('stat-revenue').textContent  = '€'+rev.toFixed(2);
  document.getElementById('stat-new').textContent      = allOrders.filter(function(o){return o.status==='new';}).length;
  document.getElementById('stat-confirmed').textContent= allOrders.filter(function(o){return o.status==='confirmed';}).length;
  document.getElementById('stat-delivered').textContent= allOrders.filter(function(o){return o.status==='delivered';}).length;
  ['all','new','confirmed','delivered','cancelled'].forEach(function(s){
    var el = document.getElementById('badge-'+s);
    if(el) el.textContent = s==='all'?allOrders.length:allOrders.filter(function(o){return o.status===s;}).length;
  });
  document.getElementById('order-count-label').textContent = allOrders.length + ' total orders';

  var grid = document.getElementById('orders-grid');
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
    var phone  = (cust.phone||'').replace(/\\s/g,'').replace('+','');

    var itemRows = (o.items||[]).map(function(i){
      var qty = i.qty || i.quantity || 1;
      return '<tr><td class="item-name">'+qty+'x '+(i.name||'Product')+'</td>'
        +'<td class="item-price">€'+((i.price||0)*qty).toFixed(2)+'</td></tr>';
    }).join('');

    var waMsg = encodeURIComponent(
      '✅ مرحباً '+cust.name+'!\\nتم تأكيد طلبك #'+shortId+' من مواسم الخير\\nالمجموع: €'+total.toFixed(2)+'\\nالدفع: عند الاستلام 💵\\n\\nشكراً لك! 🌿'
    );

    var actions = '';
    if (o.status!=='confirmed' && o.status!=='delivered')
      actions += '<button class="btn btn-confirm" onclick="updateStatus(\\''+o.id+'\\',\\'confirmed\\')">✅ Confirm</button>';
    if (o.status==='confirmed')
      actions += '<button class="btn btn-deliver" onclick="updateStatus(\\''+o.id+'\\',\\'delivered\\')">📦 Delivered</button>';
    if (o.status!=='cancelled' && o.status!=='delivered')
      actions += '<button class="btn btn-cancel" onclick="updateStatus(\\''+o.id+'\\',\\'cancelled\\')">Cancel</button>';

    return '<div class="order-card" style="animation-delay:'+idx*0.04+'s">'
      +'<div class="order-header">'
        +'<div><div class="order-id">#'+shortId+'</div>'
        +'<div class="order-date">'+formatDate(o.createdAt)+'</div></div>'
        +(statusBadge[o.status]||statusBadge.new)
      +'</div>'
      +'<div class="order-body">'
        +'<div class="customer-info">'
          +'<div class="field"><svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg><strong>'+(cust.name||'—')+'</strong></div>'
          +'<div class="field"><svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>'+(cust.address||'—')+'</div>'
          +'<div class="field"><svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.36 12 19.79 19.79 0 0 1 1.21 3.18 2 2 0 0 1 3.18 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.15a16 16 0 0 0 8 8l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 24 17z"/></svg>'+(cust.phone||'—')+'</div>'
          +(cust.notes?'<div class="field">📝 '+cust.notes+'</div>':'')
        +'</div>'
        +'<table class="items-table">'+itemRows+'</table>'
      +'</div>'
      +'<div class="order-footer">'
        +'<div class="order-total"><div class="total-label">Total</div><div class="total-value">€'+total.toFixed(2)+'</div></div>'
        +'<div class="order-actions">'
          +'<button class="btn btn-invoice" style="background:var(--white);color:var(--green-mid);border:1px solid var(--stroke)" onclick="generateInvoice(\\''+o.id+'\\')">'
            +'<svg fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>'
            +'Invoice</button>'
          +'<button class="btn btn-whatsapp" onclick="window.open(\\'https://wa.me/'+phone+'?text='+waMsg+'\\',\\'_blank\\')">'
            +'<svg fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347zM12 0C5.373 0 0 5.373 0 12c0 2.093.541 4.063 1.487 5.779L0 24l6.371-1.471A11.94 11.94 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 0 1-5.013-1.371l-.36-.214-3.721.859.894-3.617-.235-.372A9.795 9.795 0 0 1 2.182 12C2.182 6.58 6.58 2.182 12 2.182S21.818 6.58 21.818 12 17.42 21.818 12 21.818z"/></svg>'
            +'WhatsApp</button>'
          +'<button class="btn btn-phone" onclick="window.open(\\'tel:'+phone+'\\')">'
            +'<svg fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.36 12 19.79 19.79 0 0 1 1.21 3.18 2 2 0 0 1 3.18 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.15a16 16 0 0 0 8 8l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 24 17z"/></svg>'
            +'Call</button>'
          +actions
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

function buildChartTime(orders) {
  var buckets={};
  orders.forEach(function(o){
    if (!o.createdAt) return;
    var d=new Date(o.createdAt);
    var key;
    if      (timeSeg==='day')   key=d.toISOString().slice(0,10);
    else if (timeSeg==='month') key=d.toISOString().slice(0,7);
    else                        key=String(d.getFullYear());
    buckets[key]=(buckets[key]||0)+calcTotal(o);
  });
  var sorted=Object.entries(buckets).sort(function(a,b){return a[0].localeCompare(b[0]);});
  var labels=sorted.map(function(e){
    var k=e[0];
    if(timeSeg==='day') return new Date(k).toLocaleDateString('en-GB',{day:'2-digit',month:'short'});
    if(timeSeg==='month'){var p=k.split('-');return new Date(+p[0],+p[1]-1).toLocaleDateString('en-GB',{month:'short',year:'2-digit'});}
    return k;
  });
  var values=sorted.map(function(e){return e[1];});
  var n=values.length||1;
  var colors=values.map(function(_,i){var t=i/(n-1||1);var g=Math.round(64+t*91);return 'rgba(42,'+g+',65,'+(0.55+t*0.45)+')';});
  drawBarChart('chartTime',labels,values,colors,function(v){return '€'+v.toFixed(0);});
}

function buildTopProducts(orders, totalRev) {
  var pm={};
  orders.forEach(function(o){
    (o.items||[]).forEach(function(it){
      var k=it.name||'?';
      if(!pm[k]) pm[k]={name:k,qty:0,rev:0,cat:it.category||''};
      pm[k].qty+=(it.qty||it.quantity||1);
      pm[k].rev+=(it.price||0)*(it.qty||it.quantity||1);
    });
  });
  var sorted=Object.values(pm).sort(function(a,b){return b.rev-a.rev;});
  var maxRev=sorted[0]?sorted[0].rev:1;
  var catColors={'Honey':'#FFF8E1','Olive Oil':'#E8F5EE','Olives':'#E8F5EE','Oils':'#FBE9E7'};
  var catText  ={'Honey':'#C8790A','Olive Oil':'#2A6041','Olives':'#2A6041','Oils':'#6D4C41'};
  document.getElementById('top-products-body').innerHTML=sorted.map(function(p,i){
    var pct=totalRev?Math.round(p.rev/totalRev*100):0;
    var w=Math.round(p.rev/maxRev*100);
    return '<tr><td class="cell-rank"><div class="rank-pill">'+(i+1)+'</div></td>'
      +'<td><span class="prod-name">'+p.name+'</span></td>'
      +'<td><span class="prod-cat" style="background:'+(catColors[p.cat]||'#f0f0f0')+';color:'+(catText[p.cat]||'#666')+'">'+( p.cat||'—')+'</span></td>'
      +'<td>'+p.qty+'</td><td class="rev-val">€'+p.rev.toFixed(2)+'</td>'
      +'<td><div class="share-wrap"><div class="prog-bar-wrap"><div class="prog-bar" style="width:'+w+'%"></div></div><span class="share-pct">'+pct+'%</span></div></td></tr>';
  }).join('');
}

function buildTopCustomers(orders) {
  var cm={};
  allOrders.forEach(function(o){
    var c=o.customer||{};
    var k=c.name||'Unknown';
    if(!cm[k]) cm[k]={name:k,total:0,count:0,phone:c.phone||''};
    cm[k].total+=calcTotal(o);
    cm[k].count++;
  });
  var sorted=Object.values(cm).sort(function(a,b){return b.total-a.total;});
  document.getElementById('customers-body').innerHTML=sorted.map(function(c,i){
    return '<tr><td class="cell-rank"><div class="rank-pill">'+(i+1)+'</div></td>'
      +'<td><span class="prod-name">'+c.name+'</span></td>'
      +'<td class="cell-mono">'+(c.phone||'—')+'</td>'
      +'<td>'+c.count+' order'+(c.count!==1?'s':'')+'</td>'
      +'<td class="rev-val" style="text-align:right">€'+c.total.toFixed(2)+'</td></tr>';
  }).join('');
}

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
    var phone = (c.phone || '').replace(/\\s/g, '').replace('+', '');
    var waMsg = encodeURIComponent(
      'مرحباً ' + c.name + '!\\n\\nشكراً لك لكونك عميلاً عزيزاً في مواسم الخير! 🌿\\n\\nنتمنى أن تكون استمتعت بطلباتك. أخبرنا إذا كنت بحاجة لأي شيء!'
    );

    return '<tr>'
      + '<td class="cell-rank"><div class="rank-pill">' + (i + 1) + '</div></td>'
      + '<td><span class="prod-name">' + (c.name || 'Unknown') + '</span></td>'
      + '<td class="cell-mono">' + (c.phone || '—') + '</td>'
      + '<td>' + (c.address || '—') + '</td>'
      + '<td>' + c.orderCount + ' order' + (c.orderCount !== 1 ? 's' : '') + '</td>'
      + '<td class="rev-val">€' + c.totalSpent.toFixed(2) + '</td>'
      + '<td style="text-align:right">'
        + '<button class="btn btn-whatsapp" style="font-size:11px;padding:6px 10px" onclick="window.open(\\'https://wa.me/' + phone + '?text=' + waMsg + '\\',\\'_blank\\')">'
          + '<svg fill="currentColor" viewBox="0 0 24 24" style="width:11px;height:11px"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347zM12 0C5.373 0 0 5.373 0 12c0 2.093.541 4.063 1.487 5.779L0 24l6.371-1.471A11.94 11.94 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 0 1-5.013-1.371l-.36-.214-3.721.859.894-3.617-.235-.372A9.795 9.795 0 0 1 2.182 12C2.182 6.58 6.58 2.182 12 2.182S21.818 6.58 21.818 12 17.42 21.818 12 21.818z"/></svg>'
          + ' Contact'
        + '</button>'
      + '</td>'
    + '</tr>';
  }).join('');
}

/* ── INVOICE GENERATION ── */
function generateInvoice(orderId) {
  var secret = getSecret();
  if (!secret) return;

  var btn = event.target;
  // If click landed on SVG/path, climb to button
  if (btn && btn.tagName && btn.tagName.toLowerCase() !== 'button') {
    btn = btn.closest('button');
  }
  var originalText = btn ? btn.innerHTML : '';
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '<div class="spinner" style="width:11px;height:11px;border-width:2px"></div> Generating...';
  }

  fetch('/api/admin/generate-invoice', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-admin-secret': secret
    },
    body: JSON.stringify({ orderId: orderId })
  })
    .then(function(res) {
      if (!res.ok) throw new Error('Failed to generate invoice');
      return res.blob();
    })
    .then(function(blob) {
      var url = window.URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url;
      a.download = 'MawasemAlKhair-Invoice-' + orderId.slice(-6).toUpperCase() + '.pdf';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      showToast('Invoice downloaded successfully!');
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = originalText;
      }
    })
    .catch(function(e) {
      showToast('Error generating invoice: ' + e.message);
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = originalText;
      }
    });
}

function drawBarChart(canvasId, labels, values, colors, yFmt) {
  var canvas=document.getElementById(canvasId);
  if(!canvas) return;
  var dpr=window.devicePixelRatio||1;
  var W=canvas.getBoundingClientRect().width||700;
  var H=260;
  canvas.width=Math.round(W*dpr); canvas.height=Math.round(H*dpr);
  canvas.style.height=H+'px';
  var ctx=canvas.getContext('2d');
  ctx.setTransform(dpr,0,0,dpr,0,0);
  var padL=54,padR=24,padT=20,padB=56;
  var cw=W-padL-padR, ch=H-padT-padB;
  ctx.clearRect(0,0,W,H);
  var n=labels.length;
  if(!n){ctx.fillStyle='#8A8A8A';ctx.font='13px Sora,sans-serif';ctx.textAlign='center';ctx.fillText('No data for selected period',W/2,H/2);return;}
  var maxV=Math.max.apply(null,values.concat([1]));
  var barW=Math.max(8,Math.min(52,(cw/n)*0.62));
  var gap=cw/n;
  for(var gi=0;gi<=5;gi++){
    var gy=padT+ch-(gi/5)*ch;
    ctx.strokeStyle='#E2DDD5';ctx.lineWidth=1;
    ctx.beginPath();ctx.moveTo(padL,gy);ctx.lineTo(padL+cw,gy);ctx.stroke();
    ctx.fillStyle='#8A8A8A';ctx.font='10px Sora,sans-serif';ctx.textAlign='right';
    ctx.fillText(yFmt?yFmt(maxV*gi/5):Math.round(maxV*gi/5),padL-6,gy+4);
  }
  values.forEach(function(v,i){
    var bh=(v/maxV)*ch;
    var x=padL+i*gap+(gap-barW)/2;
    var y=padT+ch-bh;
    var r=Math.min(6,barW/2);
    var color=Array.isArray(colors)?colors[i%colors.length]:(colors||'#2A6041');
    ctx.beginPath();
    ctx.moveTo(x+r,y);ctx.lineTo(x+barW-r,y);
    ctx.arcTo(x+barW,y,x+barW,y+r,r);
    ctx.lineTo(x+barW,y+bh);ctx.lineTo(x,y+bh);
    ctx.arcTo(x,y,x+r,y,r);ctx.closePath();
    ctx.fillStyle=color;ctx.fill();
    if(v>0){ctx.fillStyle='#1A1A1A';ctx.font='bold '+Math.min(11,Math.max(9,barW/4))+'px Sora,sans-serif';ctx.textAlign='center';ctx.fillText(yFmt?yFmt(v):v,x+barW/2,y-5);}
    var lbl=labels[i]||'';
    var fs=Math.min(11,Math.max(8,barW/4.5));
    ctx.fillStyle='#4A4A4A';ctx.font=fs+'px Sora,sans-serif';ctx.textAlign='center';
    if(n>14){ctx.save();ctx.translate(x+barW/2,padT+ch+12);ctx.rotate(-Math.PI/4);ctx.fillText(lbl.length>6?lbl.slice(0,5)+'…':lbl,0,0);ctx.restore();}
    else{var mc=Math.max(3,Math.floor(barW/(fs*0.55)));ctx.fillText(lbl.length>mc?lbl.slice(0,mc-1)+'…':lbl,x+barW/2,padT+ch+16);}
  });
  ctx.strokeStyle='#E2DDD5';ctx.lineWidth=1.5;
  ctx.beginPath();ctx.moveTo(padL,padT+ch);ctx.lineTo(padL+cw,padT+ch);ctx.stroke();
}

/* ── INIT ── */
document.getElementById('loading-indicator').style.display = 'none';
var saved = sessionStorage.getItem(SESSION_KEY);
if (saved) {
  document.getElementById('login-screen').classList.add('hidden');
  loadOrders();
}
</script>
</body>
</html>
`);
}