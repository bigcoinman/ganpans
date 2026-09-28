// Inspect live site via Chrome Headless and Chrome DevTools Protocol
const { spawn } = require('child_process');
const http = require('http');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const port = 9222;

console.log('Launching headless Chrome on port ' + port + '...');
const chrome = spawn(chromePath, [
    '--headless=new',
    `--remote-debugging-port=${port}`,
    '--disable-gpu',
    '--no-sandbox',
    'https://ganpans.com'
]);

setTimeout(async () => {
    try {
        http.get(`http://127.0.0.1:${port}/json`, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                console.log('CDP Targets:');
                try {
                    const targets = JSON.parse(data);
                    console.log(targets.map(t => ({ title: t.title, url: t.url, ws: t.webSocketDebuggerUrl })));
                } catch(e) {
                    console.log('Raw data:', data);
                }
                chrome.kill();
            });
        }).on('error', err => {
            console.error('HTTP error:', err.message);
            chrome.kill();
        });
    } catch (e) {
        console.error('Error:', e);
        chrome.kill();
    }
}, 3000);
