export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const targetHost = 'ortopednn-auto.pages.dev';
    
    // Build target URL
    const targetUrl = `https://${targetHost}${url.pathname}${url.search}`;
    
    try {
      // Fetch from Cloudflare Pages
      const response = await fetch(targetUrl, {
        method: request.method,
        headers: {
          'User-Agent': request.headers.get('User-Agent') || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': request.headers.get('Accept') || 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'ru-RU,ru;q=0.9,en;q=0.8',
          'Accept-Encoding': 'gzip, deflate, br',
          ...Object.fromEntries(
            request.headers.entries()
              .filter(([k]) => !['cf-connecting-ip', 'cf-ipcountry', 'cf-ray', 'x-forwarded-for'].includes(k))
          )
        },
        redirect: 'follow',
        body: request.method !== 'GET' && request.method !== 'HEAD' ? request.body : undefined
      });
      
      // Clone response with modified headers
      const newResponse = new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: new Headers(response.headers)
      });
      
      // Add caching headers
      newResponse.headers.set('Cache-Control', 'public, max-age=300, stale-while-revalidate=600');
      newResponse.headers.set('CF-Cache-Status', 'DYNAMIC');
      newResponse.headers.set('X-Proxy-Worker', 'ortopednn-proxy-v1');
      
      return newResponse;
      
    } catch (error) {
      // If error, return fallback page
      return new Response(getFallbackPage(url.pathname), {
        status: 503,
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'Cache-Control': 'no-cache'
        }
      });
    }
  }
};

function getFallbackPage(path) {
  return `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Стоматолог-ортопед Никитина М.Г.</title>
  <meta name="description" content="Протезирование зубов в Нижнем Новгороде. Коронки, виниры, съёмные и бюгельные протезы.">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      background: linear-gradient(135deg, #faf5ff 0%, #f5f3ff 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
      color: #1e1b4b;
    }
    .container {
      max-width: 500px;
      text-align: center;
      background: white;
      padding: 40px;
      border-radius: 20px;
      box-shadow: 0 20px 60px rgba(124, 58, 237, 0.15);
    }
    h1 {
      font-size: 1.5rem;
      color: #7c3aed;
      margin-bottom: 20px;
    }
    .contact {
      background: #faf5ff;
      padding: 20px;
      border-radius: 12px;
      margin: 20px 0;
    }
    .contact-item {
      margin: 12px 0;
    }
    .contact-item a {
      color: #7c3aed;
      text-decoration: none;
      font-size: 1.1rem;
      font-weight: 600;
    }
    .contact-item a:hover {
      text-decoration: underline;
    }
    .phone {
      font-size: 1.5rem;
      display: block;
      margin: 16px 0;
      background: linear-gradient(135deg, #7c3aed, #5b21b6);
      color: white !important;
      padding: 12px 24px;
      border-radius: 10px;
      text-decoration: none;
    }
    .note {
      font-size: 0.875rem;
      color: #6b7280;
      margin-top: 24px;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>Стоматолог-ортопед Никитина Марина Георгиевна</h1>
    
    <div class="contact">
      <p>Протезирование зубов в Нижнем Новгороде</p>
      
      <div class="contact-item">
        <a href="tel:+79202537317" class="phone">+7 920 253 73 17</a>
      </div>
      
      <div class="contact-item">
        <a href="https://t.me/nikitina_ortoped" target="_blank">Telegram</a>
      </div>
      
      <div class="contact-item">
        <a href="https://wa.me/79202537317" target="_blank">WhatsApp</a>
      </div>
    </div>
    
    <p class="note">
      Услуги: металлокерамика, цирконий, виниры E-MAX, съёмные и бюгельные протезы
    </p>
  </div>
</body>
</html>`;
}