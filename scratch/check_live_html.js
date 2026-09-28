const https = require('https');
https.get('https://ganpans.com/', (res) => {
    let body = '';
    res.on('data', c => body += c);
    res.on('end', () => {
        const scriptMatches = body.match(/<script src="[^"]*"/g);
        console.log('Script tags on ganpans.com:\n', scriptMatches);
        const trigger = body.includes('ai-assistant-trigger');
        console.log('Includes ai-assistant-trigger:', trigger);
        const quickReplies = body.includes('quick-reply-btn');
        console.log('Includes quick-reply-btn:', quickReplies);
    });
});
