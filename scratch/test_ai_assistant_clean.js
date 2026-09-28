const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');

// 1. Local HTTP server to serve static files
const mimeTypes = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.svg': 'image/svg+xml'
};

const server = http.createServer((req, res) => {
    let filePath = path.join(__dirname, '..', req.url.split('?')[0]);
    if (filePath.endsWith(path.sep) || req.url === '/') {
        filePath = path.join(__dirname, '..', 'index.html');
    }

    console.log('REQ:', req.url);
    fs.readFile(filePath, (err, content) => {
        if (err) {
            console.error('File not found:', filePath);
            res.writeHead(404);
            res.end('Not found');
            return;
        }
        const ext = path.extname(filePath);
        res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'application/octet-stream' });
        res.end(content);
    });
});

server.listen(8899, '127.0.0.1', () => {
    console.log('Local test server running at http://127.0.0.1:8899');
    runBrowserTest();
});

function runBrowserTest() {
    const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
    const port = 9226;

    console.log('Launching Headless Chrome...');
    const chrome = spawn(chromePath, [
        '--headless=new',
        `--remote-debugging-port=${port}`,
        '--disable-gpu',
        '--no-sandbox',
        '--user-data-dir=C:\\Users\\BINY\\AppData\\Local\\Temp\\chrome-ai-clean-' + Date.now(),
        'http://127.0.0.1:8899/index.html'
    ]);

    setTimeout(() => {
        http.get(`http://127.0.0.1:${port}/json`, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', async () => {
                const targets = JSON.parse(data);
                const page = targets.find(t => t.url.includes('127.0.0.1:8899'));
                if (!page) {
                    console.error('Page target not found');
                    cleanup(1);
                    return;
                }

                console.log('Connected to target:', page.url);
                const ws = new WebSocket(page.webSocketDebuggerUrl);

                let reqId = 1;
                const send = (method, params = {}) => {
                    return new Promise((resolve) => {
                        const cur = reqId++;
                        const handler = (evt) => {
                            const msg = JSON.parse(evt.data);
                            if (msg.id === cur) {
                                ws.removeEventListener('message', handler);
                                resolve(msg.result);
                            }
                        };
                        ws.addEventListener('message', handler);
                        ws.send(JSON.stringify({ id: cur, method, params }));
                    });
                };

                const evaluate = async (expression) => {
                    const res = await send('Runtime.evaluate', {
                        expression,
                        returnByValue: true,
                        awaitPromise: true
                    });
                    if (res && res.exceptionDetails) {
                        throw new Error(JSON.stringify(res.exceptionDetails));
                    }
                    return res ? res.result.value : undefined;
                };

                ws.onopen = async () => {
                    try {
                        ws.addEventListener('message', (evt) => {
                            const msg = JSON.parse(evt.data);
                            if (msg.method === 'Runtime.consoleAPICalled') {
                                console.log('[BROWSER CONSOLE]', msg.params.type, msg.params.args.map(a => a.value || a.description || JSON.stringify(a)).join(' '));
                            }
                            if (msg.method === 'Runtime.exceptionThrown') {
                                console.error('[BROWSER EXCEPTION]', JSON.stringify(msg.params.exceptionDetails));
                            }
                        });
                        await send('Runtime.enable');

                        // Wait for page to finish loading scripts
                        console.log('Waiting for readyState complete...');
                        for (let i = 0; i < 20; i++) {
                            const state = await evaluate(`document.readyState`);
                            console.log('readyState:', state);
                            if (state === 'complete') break;
                            await new Promise(r => setTimeout(r, 200));
                        }

                        console.log('--- 1. Check AIAssistant availability ---');
                        const hasAI = await evaluate(`typeof window.AIAssistant === 'object' && typeof window.AIAssistant.ask === 'function'`);
                        console.log('AIAssistant defined:', hasAI);
                        if (!hasAI) {
                            const scripts = await evaluate(`Array.from(document.querySelectorAll('script')).map(s => s.src)`);
                            console.log('Loaded scripts:', scripts);
                            throw new Error('AIAssistant is not loaded!');
                        }

                        console.log('--- 2. Open Chat Window ---');
                        await evaluate(`window.AIAssistant.open()`);
                        const isActive = await evaluate(`document.getElementById('ai-chat-window').classList.contains('active')`);
                        console.log('Chat window active:', isActive);
                        if (!isActive) throw new Error('Chat window not active after open()');

                        console.log('--- 3. Click "지원 자격 및 대상" button ---');
                        const btnCountBefore = await evaluate(`document.querySelectorAll('.quick-reply-btn').length`);
                        console.log('Buttons count before click:', btnCountBefore);

                        await evaluate(`window.AIAssistant.ask('target')`);

                        // Wait 300ms for response
                        await new Promise(r => setTimeout(r, 300));

                        const btnCountAfter = await evaluate(`document.querySelectorAll('.quick-reply-btn').length`);
                        console.log('Buttons count after click:', btnCountAfter);
                        if (btnCountAfter === 0) {
                            throw new Error('Buttons were deleted! "순간 떴다 사라짐" bug occurred!');
                        }
                        console.log('✅ Buttons preserved! (Buttons did NOT disappear)');

                        const messageCount = await evaluate(`document.querySelectorAll('#ai-chat-messages .chat-bubble').length`);
                        console.log('Total chat bubbles:', messageCount);

                        const lastBotMsg = await evaluate(`
                            const msgs = document.querySelectorAll('#ai-chat-messages .bot-message');
                            msgs[msgs.length - 1].innerText;
                        `);
                        console.log('Last Bot Message preview:', lastBotMsg.slice(0, 50) + '...');
                        if (!lastBotMsg.includes('지원 대상 및 자격 기준')) {
                            throw new Error('Bot response does not contain target FAQ content!');
                        }
                        console.log('✅ Target FAQ answer correctly rendered!');

                        console.log('--- 4. Click second button "지원 금액 및 품목" ---');
                        await evaluate(`window.AIAssistant.ask('amount')`);
                        await new Promise(r => setTimeout(r, 300));

                        const lastBotMsg2 = await evaluate(`(() => {
                            const msgs = document.querySelectorAll('#ai-chat-messages .bot-message');
                            return msgs[msgs.length - 1].innerText;
                        })()`);
                        console.log('Second Bot Message preview:', lastBotMsg2.slice(0, 50) + '...');
                        if (!lastBotMsg2.includes('지원 금액 및 품목')) {
                            throw new Error('Bot response does not contain amount FAQ content!');
                        }
                        console.log('✅ Amount FAQ answer correctly rendered without disappearing buttons!');

                        console.log('--- 5. Test typing custom question ---');
                        await evaluate(`(() => {
                            const inp = document.getElementById('ai-chat-input');
                            inp.value = '서류는 뭘 내야 하나요?';
                            window.AIAssistant.send();
                        })()`);
                        await new Promise(r => setTimeout(r, 300));

                        const lastBotMsg3 = await evaluate(`(() => {
                            const msgs = document.querySelectorAll('#ai-chat-messages .bot-message');
                            return msgs[msgs.length - 1].innerText;
                        })()`);
                        console.log('Custom Question Bot Message preview:', lastBotMsg3.slice(0, 50) + '...');
                        if (!lastBotMsg3.includes('제출 서류')) {
                            throw new Error('Bot response does not contain documents FAQ content for custom question!');
                        }
                        console.log('✅ Custom keyword question correctly answered!');

                        console.log('--- 6. Close Chat Window ---');
                        await evaluate(`window.AIAssistant.close()`);
                        const isClosed = await evaluate(`!document.getElementById('ai-chat-window').classList.contains('active')`);
                        console.log('Chat window closed:', isClosed);

                        console.log('\n🎉 ALL AI ASSISTANT CLEAN SLATE TESTS PASSED WITH 100% SUCCESS!');
                        cleanup(0);
                    } catch (e) {
                        console.error('TEST FAILED:', e);
                        cleanup(1);
                    }
                };
            });
        });
    }, 1500);

    function cleanup(code) {
        try { chrome.kill(); } catch (e) {}
        try { server.close(); } catch (e) {}
        process.exit(code);
    }
}
