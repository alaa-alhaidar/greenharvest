// TEST FILE - pages/api/admin-panel-test.js
// Deploy this to verify your files are updating

export default function handler(req, res) {
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.status(200).send(`<!DOCTYPE html>
<html>
<head>
<title>Admin Panel Test</title>
<style>
body {
  font-family: Arial, sans-serif;
  max-width: 800px;
  margin: 50px auto;
  padding: 20px;
  background: #f5f5f5;
}
.test-box {
  background: white;
  border: 3px solid #2A6041;
  border-radius: 10px;
  padding: 30px;
  margin: 20px 0;
}
.success { background: #d4edda; border-color: #28a745; color: #155724; }
.error { background: #f8d7da; border-color: #dc3545; color: #721c24; }
h1 { color: #2A6041; }
code { background: #f0f0f0; padding: 2px 6px; border-radius: 4px; }
button {
  background: #2A6041;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 16px;
  font-weight: bold;
}
button:hover { background: #1E5A2F; }
</style>
</head>
<body>
<h1>🔍 Admin Panel Deployment Test</h1>

<div class="test-box success">
  <h2>✅ This Test File is Working!</h2>
  <p>You successfully deployed <code>admin-panel-test.js</code></p>
  <p><strong>File Version:</strong> Test v1.0</p>
  <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
</div>

<div class="test-box">
  <h2>📋 Test Checklist:</h2>
  <p><strong>1. Can you see this page?</strong></p>
  <p style="margin-left: 20px;">✅ YES → Deployment is working</p>
  <p style="margin-left: 20px;">❌ NO → You're not seeing this, so N/A</p>
  
  <p style="margin-top: 20px;"><strong>2. Click the button below:</strong></p>
  <button onclick="testFunction()">Click Me to Test JavaScript</button>
  <p id="result" style="margin-top: 10px; font-weight: bold;"></p>
</div>

<div class="test-box">
  <h2>🎯 Next Steps:</h2>
  <ol>
    <li>If you see this page → Vercel deployment works ✅</li>
    <li>If the button works → JavaScript works ✅</li>
    <li>Now replace <code>admin-panel.js</code> with the real file</li>
    <li>Deploy again</li>
    <li>Visit <code>/api/admin-panel</code> (not admin-panel-test)</li>
  </ol>
</div>

<div class="test-box error">
  <h2>⚠️ Important:</h2>
  <p>This is a <strong>TEST FILE</strong>!</p>
  <p>The real admin panel is at: <code>/api/admin-panel</code></p>
  <p>This test is at: <code>/api/admin-panel-test</code></p>
</div>

<script>
function testFunction() {
  var result = document.getElementById('result');
  result.textContent = '✅ JavaScript is working! Functions are loading correctly!';
  result.style.color = '#28a745';
  result.style.fontSize = '18px';
  
  alert('JavaScript works! If you see this alert, your deployment is fine. The issue is with the admin-panel.js file itself.');
}

console.log('✅ Test file loaded successfully!');
console.log('Functions available:', typeof testFunction);
</script>

</body>
</html>
`);
}