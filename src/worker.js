export default {
  async fetch(req, env, ctx) {
    if (req.method !== 'POST') {
      return new Response('405', { status: 405 });
    }
    
    const fd = await req.formData();
    
    if (fd.get('bot-check')) {
      return new Response('Bot', { status: 403 });
    }
    
    const txt = `🦷 Заявка
📞 ${fd.get('phone')}`;
    
    await fetch(`https://api.telegram.org/bot${env.TG_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: env.TG_CHAT_ID,
        text: txt
      })
    });
    
    return new Response('OK');
  }
};