const url = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/getMe`;
fetch(url, {signal: AbortSignal.timeout(15000)})
  .then(r => r.text())
  .then(d => console.log(d))
  .catch(e => console.log("FAIL: " + e.message));
