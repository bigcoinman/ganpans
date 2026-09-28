// Live Chrome Headless Inspector for ganpans.com
const { spawn } = require('child_process');
const http = require('http');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const port = 9223;

console.log('1. Launching Chrome...');
const chrome = spawn(chromePath, [
    '--headless=new',
    `--remote-debugging-port=${port}`,
    '--disable-gpu',
    '--no-sandbox',
    '--user-data-dir=C:\\Users\\BINY\\AppData\\Local\\Temp\\chrome-test-' + Date.now(),
    'https://ganpans.com'
]);

setTimeout(async () => {
    try {
        http.get(`http://127.0.0.1:${port}/json`, async (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', async () => {
                const targets = JSON.parse(data);
                const page = targets.find(t => t.url.includes('ganpans.com'));
                if (!page) {
                    console.error('Page target not found!');
                    chrome.kill();
                    return;
                }

                console.log('2. Connected to page:', page.url);
                const ws = new WebSocket(page.webSocketDebuggerUrl);

                let id = 1;
                const send = (method, params = {}) => {
                    return new Promise((resolve) => {
                        const curId = id++;
                        const handler = (evt) => {
                            const msg = JSON.parse(evt.data);
                            if (msg.id === curId) {
                                ws.removeEventListener('message', handler);
                                resolve(msg.result);
                            }
                        };
                        ws.addEventListener('message', handler);
                        ws.send(JSON.stringify({ id: curId, method, params }));
                    });
                };

                ws.onopen = async () => {
                    console.log('3. WebSocket open, enabling Console and Runtime...');
                    
                    ws.addEventListener('message', (evt) => {
                        const msg = JSON.parse(evt.data);
                        if (msg.method === 'Runtime.consoleAPICalled') {
                            console.log(`[CONSOLE ${msg.params.type.toUpperCase()}]`, msg.params.args.map(a => a.value || a.description).join(' '));
                        }
                        if (msg.method === 'Runtime.exceptionThrown') {
                            console.error('[UNCAUGHT EXCEPTION]', msg.params.exceptionDetails);
                        }
                    });

                    await send('Console.enable');
                    await send('Runtime.enable');

                    // Check elements and click trigger
                    console.log('4. Inspecting DOM via Runtime.evaluate...');
                    const checkEval = await send('Runtime.evaluate', {
                        expression: `(() => {
                            const trigger = document.getElementById('ai-assistant-trigger');
                            const chatWindow = document.getElementById('ai-chat-window');
                            const btns = Array.from(document.querySelectorAll('.quick-reply-btn')).map(b => b.innerText);
                            return {
                                triggerExists: !!trigger,
                                triggerDisplay: trigger ? window.getComputedStyle(trigger).display : null,
                                chatWindowExists: !!chatWindow,
                                chatWindowClass: chatWindow ? chatWindow.className : null,
                                chatWindowDisplay: chatWindow ? window.getComputedStyle(chatWindow).display : null,
                                buttonsCount: btns.length,
                                buttons: btns,
                                aiInitialized: window._aiAssistantInitialized
                            };
                        })()`,
                        returnByValue: true
                    });

                    console.log('DOM State BEFORE Click:', checkEval.result.value);

                    // Click AI Assistant trigger
                    console.log('5. Clicking #ai-assistant-trigger...');
                    const clickEval = await send('Runtime.evaluate', {
                        expression: `(() => {
                            const trigger = document.getElementById('ai-assistant-trigger');
                            if (trigger) trigger.click();
                            const chatWindow = document.getElementById('ai-chat-window');
                            return {
                                triggerDisplayAfter: trigger ? window.getComputedStyle(trigger).display : null,
                                chatWindowClassAfter: chatWindow ? chatWindow.className : null,
                                chatWindowDisplayAfter: chatWindow ? window.getComputedStyle(chatWindow).display : null
                            };
                        })()`,
                        returnByValue: true
                    });
                    console.log('DOM State AFTER Trigger Click:', clickEval.result.value);

                    // Now click first button (data-faq="target") and check response
                    console.log('6. Clicking first quick-reply button...');
                    const btnClickEval = await send('Runtime.evaluate', {
                        expression: `(() => {
                            const btn = document.querySelector('.quick-reply-btn');
                            if (btn) btn.click();
                            return { btnClicked: !!btn, btnText: btn ? btn.innerText : null };
                        })()`,
                        returnByValue: true
                    });
                    console.log('Quick reply click result:', btnClickEval.result.value);

                    // Wait 1.5s for response
                    setTimeout(async () => {
                        const respEval = await send('Runtime.evaluate', {
                            expression: `(() => {
                                const msgs = Array.from(document.querySelectorAll('#ai-chat-messages .chat-bubble')).map(m => ({
                                    cls: m.className,
                                    text: m.innerText.slice(0, 60)
                                }));
                                return msgs;
                            })()`,
                            returnByValue: true
                        });
                        console.log('Messages in chat window:', respEval.result.value);
                        ws.close();
                        chrome.kill();
                    }, 1500);
                };
            });
        });
    } catch(e) {
        console.error('Execution error:', e);
        chrome.kill();
    }
}, 3000);
