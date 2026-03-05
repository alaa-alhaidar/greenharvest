// pages/api/admin-debug.js
// DEBUG VERSION - Check browser console after loading

export default function handler(req, res) {
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.status(200).send(`<!DOCTYPE html>
<html>
<head>
<title>Admin Debug</title>
<style>
body{font-family:Arial;padding:40px;background:#f5f5f5;}
.box{background:white;padding:30px;border-radius:10px;max-width:500px;margin:0 auto;}
button{padding:15px 30px;background:#2A6041;color:white;border:none;border-radius:8px;cursor:pointer;font-size:16px;width:100%;}
.status{margin:20px 0;padding:15px;background:#E8F5EE;border-radius:8px;}
</style>
</head>
<body>

<div class="box">
  <h1>🔍 Debug Mode</h1>
  
  <div class="status">
    <p><strong>Status:</strong> <span id="status">Loading...</span></p>
    <p><strong>doLogin exists:</strong> <span id="doLoginStatus">Checking...</span></p>
  </div>

  <button onclick="testDoLogin()">Test doLogin Function</button>
  
  <div style="margin-top:20px;padding:15px;background:#FFF3E0;border-radius:8px;">
    <p><strong>Instructions:</strong></p>
    <ol style="margin:10px 0;padding-left:20px;">
      <li>Open DevTools (Press F12)</li>
      <li>Go to Console tab</li>
      <li>Look for any RED errors</li>
      <li>Click the button above</li>
      <li>Check what happens</li>
    </ol>
  </div>
</div>

<script>
console.log('🟢 Script tag is executing!');

// Define doLogin
function doLogin() {
  console.log('✅ doLogin called successfully!');
  alert('doLogin works! ✅');
  return true;
}

// Test function
function testDoLogin() {
  console.log('🔵 testDoLogin called');
  
  if (typeof doLogin === 'function') {
    console.log('✅ doLogin is defined as a function');
    document.getElementById('doLoginStatus').textContent = 'YES ✅';
    doLogin();
  } else {
    console.log('❌ doLogin is NOT defined');
    document.getElementById('doLoginStatus').textContent = 'NO ❌';
    alert('ERROR: doLogin is not defined!');
  }
}

// Auto-check on load
window.addEventListener('load', function() {
  console.log('🟢 Page loaded');
  
  document.getElementById('status').textContent = 'Page loaded successfully ✅';
  
  if (typeof doLogin === 'function') {
    console.log('✅ doLogin exists after page load');
    document.getElementById('doLoginStatus').textContent = 'YES ✅';
  } else {
    console.log('❌ doLogin does NOT exist after page load');
    document.getElementById('doLoginStatus').textContent = 'NO ❌';
  }
  
  console.log('All functions defined:', Object.keys(window).filter(k => typeof window[k] === 'function').slice(0, 20));
});

console.log('🟢 Script execution completed');
console.log('doLogin type:', typeof doLogin);
</script>

</body>
</html>
`);
}