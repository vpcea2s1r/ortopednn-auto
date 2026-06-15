const API = 'https://api.telegram.org/bot' + process.env.TELEGRAM_BOT_TOKEN;
const f = (url, opt) => fetch(url, opt || {signal: AbortSignal.timeout(10000)}).then(r => r.json());
f(API + '/getMyCommands').then(d => console.log('commands:', JSON.stringify(d)));
f(API + '/getMe').then(d => console.log('me:', JSON.stringify(d)));
