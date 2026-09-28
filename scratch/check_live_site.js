async function checkLive() {
  const htmlRes = await fetch('https://ganpans.com/index.html', { cache: 'no-store' });
  const html = await htmlRes.text();
  
  const appJsMatch = html.match(/app\.js\?v=([^\"]+)/);
  console.log('Live index.html app.js version:', appJsMatch ? appJsMatch[1] : 'not found');

  const secJsMatch = html.match(/security-utils\.js\?v=([^\"]+)/);
  console.log('Live index.html security-utils.js version:', secJsMatch ? secJsMatch[1] : 'not found');

  // Now check if live app.js has fetchAndRenderAdminApplicationsFresh
  const appRes = await fetch('https://ganpans.com/app.js?v=' + (appJsMatch ? appJsMatch[1] : Date.now()), { cache: 'no-store' });
  const appJs = await appRes.text();
  console.log('Live app.js size:', appJs.length);
  console.log('Live app.js has fetchAndRenderAdminApplicationsFresh:', appJs.includes('fetchAndRenderAdminApplicationsFresh'));
  console.log('Live app.js has switchAdminTab apps branch:', appJs.includes("tabName === 'apps'") && appJs.includes('fetchAndRenderAdminApplicationsFresh'));
}

checkLive().catch(console.error);
