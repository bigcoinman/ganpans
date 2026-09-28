const { spawn } = require('child_process');
const http = require('http');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const port = 9224;

console.log('1. Launching Chrome against https://ganpans.com ...');
const chrome = spawn(chromePath, [
    '--headless=new',
    `--remote-debugging-port=${port}`,
    '--disable-gpu',
    '--no-sandbox',
    '--user-data-dir=C:\\Users\\BINY\\AppData\\Local\\Temp\\chrome-diag-' + Date.now(),
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
                    console.log('3. Listening to console and exceptions...');
                    ws.addEventListener('message', (evt) => {
                        const msg = JSON.parse(evt.data);
                        if (msg.method === 'Runtime.consoleAPICalled') {
                            console.log(`[PAGE CONSOLE ${msg.params.type.toUpperCase()}]`, msg.params.args.map(a => a.value || a.description || JSON.stringify(a)).join(' '));
                        }
                        if (msg.method === 'Runtime.exceptionThrown') {
                            console.error('[PAGE UNCAUGHT EXCEPTION]', JSON.stringify(msg.params.exceptionDetails));
                        }
                    });

                    await send('Console.enable');
                    await send('Runtime.enable');
                    await send('Page.enable');

                    // Wait 2 seconds for initial load
                    await new Promise(r => setTimeout(r, 2000));

                    console.log('\n--- STEP 1: Inspecting AI Trigger and Chat Window ---');
                    const step1 = await send('Runtime.evaluate', {
                        expression: `(() => {
                            const trig = document.getElementById('ai-assistant-trigger');
                            const win = document.getElementById('ai-chat-window');
                            return {
                                trigDisplay: trig ? window.getComputedStyle(trig).display : null,
                                trigZIndex: trig ? window.getComputedStyle(trig).zIndex : null,
                                winDisplay: win ? window.getComputedStyle(win).display : null,
                                winActive: win ? win.classList.contains('active') : false,
                                winZIndex: win ? window.getComputedStyle(win).zIndex : null,
                                windowFaqDb: !!window.faqDatabase,
                                handleAIQuickReplyType: typeof window.handleAIQuickReply
                            };
                        })()`,
                        returnByValue: true
                    });
                    console.log('Step 1 result:', step1.result.value);

                    console.log('\n--- STEP 2: Clicking AI Trigger to Open Chat Window ---');
                    const step2 = await send('Runtime.evaluate', {
                        expression: `(() => {
                            const trig = document.getElementById('ai-assistant-trigger');
                            if (trig) trig.click();
                            const win = document.getElementById('ai-chat-window');
                            return {
                                winDisplay: win ? window.getComputedStyle(win).display : null,
                                winActive: win ? win.classList.contains('active') : false
                            };
                        })()`,
                        returnByValue: true
                    });
                    console.log('Step 2 result:', step2.result.value);

                    console.log('\n--- STEP 3: Clicking "지원 자격 및 대상" Quick Reply Button ---');
                    const step3 = await send('Runtime.evaluate', {
                        expression: `(() => {
                            const btn = document.querySelector('.quick-reply-btn[data-faq="target"]');
                            if (!btn) return { error: 'Button not found!' };
                            const text = btn.innerText;
                            btn.click();
                            const win = document.getElementById('ai-chat-window');
                            const msgs = Array.from(document.querySelectorAll('#ai-chat-messages .chat-bubble')).map(m => ({
                                text: m.innerText.substring(0, 40),
                                cls: m.className
                            }));
                            return {
                                btnClicked: text,
                                winActiveImmediately: win ? win.classList.contains('active') : false,
                                winDisplayImmediately: win ? window.getComputedStyle(win).display : null,
                                messagesCountImmediately: msgs.length,
                                messagesImmediately: msgs
                            };
                        })()`,
                        returnByValue: true
                    });
                    console.log('Step 3 result (immediate):', step3.result.value);

                    // Wait 600ms for setTimeout to fire
                    console.log('\n--- STEP 4: Waiting 600ms for Bot Response ---');
                    await new Promise(r => setTimeout(r, 600));

                    const step4 = await send('Runtime.evaluate', {
                        expression: `(() => {
                            const win = document.getElementById('ai-chat-window');
                            const msgs = Array.from(document.querySelectorAll('#ai-chat-messages .chat-bubble')).map(m => ({
                                text: m.innerText.substring(0, 50),
                                cls: m.className
                            }));
                            const quickReplies = document.querySelector('.ai-quick-replies');
                            return {
                                winActiveAfter: win ? win.classList.contains('active') : false,
                                winDisplayAfter: win ? window.getComputedStyle(win).display : null,
                                messagesCountAfter: msgs.length,
                                messagesAfter: msgs,
                                quickRepliesExistAfter: !!quickReplies,
                                quickReplyButtonsCount: quickReplies ? quickReplies.querySelectorAll('button').length : 0
                            };
                        })()`,
                        returnByValue: true
                    });
                    console.log('Step 4 result (after 600ms):', step4.result.value);

                    console.log('\n--- STEP 5: Testing Input and Send Button ---');
                    const step5 = await send('Runtime.evaluate', {
                        expression: `(() => {
                            const inp = document.getElementById('ai-chat-input');
                            const sendBtn = document.getElementById('ai-chat-send');
                            if (!inp || !sendBtn) return { error: 'input or sendBtn not found' };
                            inp.value = '지원 금액이 얼마인가요?';
                            sendBtn.click();
                            return { inputValAfterSend: inp.value };
                        })()`,
                        returnByValue: true
                    });
                    console.log('Step 5 result (immediate send):', step5.result.value);

                    await new Promise(r => setTimeout(r, 600));

                    const step6 = await send('Runtime.evaluate', {
                        expression: `(() => {
                            const msgs = Array.from(document.querySelectorAll('#ai-chat-messages .chat-bubble')).map(m => ({
                                text: m.innerText.substring(0, 50),
                                cls: m.className
                            }));
                            return {
                                totalMessages: msgs.length,
                                lastMessage: msgs[msgs.length - 1]
                            };
                        })()`,
                        returnByValue: true
                    });
                    console.log('Step 6 result (after send response):', step6.result.value);

                    console.log('\n--- DIAGNOSIS COMPLETED ---');
                    chrome.kill();
                    process.exit(0);
                };
            });
        });
    } catch (e) {
        console.error('Error during inspection:', e);
        chrome.kill();
        process.exit(1);
    }
}, 1500);
