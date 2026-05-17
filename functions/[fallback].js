export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    // If requesting main domain, redirect to pages.dev or serve content
    if (url.hostname === 'ortopednn.ru' || url.hostname === 'www.ortopednn.ru') {
      // Check if original URL is blocked
      const targetUrl = `https://ortopednn-auto.pages.dev${url.pathname}${url.search}`;
      
      try {
        // Try to fetch from Cloudflare Pages
        const response = await fetch(targetUrl, {
          headers: {
            'User-Agent': request.headers.get('User-Agent') || 'Mozilla/5.0',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7',
          }
        });
        
        if (response.ok) {
          // Clone response and return with caching headers
          const newResponse = new Response(response.body, response);
          newResponse.headers.set('Cache-Control', 'public, max-age=3600');
          newResponse.headers.set('CF-Cache-Status', 'HIT');
          return newResponse;
        }
        
        // If fetch fails, return error page with alternative access info
        return new Response(getBlockedPage(url.pathname), {
          headers: { 'Content-Type': 'text/html; charset=utf-8' }
        });
        
      } catch (error) {
        return new Response(getBlockedPage(url.pathname), {
          headers: { 'Content-Type': 'text/html; charset=utf-8' }
        });
      }
    }
    
    // For other hostnames, handle normally
    return fetch(request);
  }
};

function getBlockedPage(path) {
  return `
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Сайт временно недоступен</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      max-width: 600px;
      margin: 50px auto;
      padding: 20px;
      text-align: center;
      background: #faf5ff;
      color: #1e1b4b;
    }
    h1 { color: #7c3aed; }
    .alternative {
      background: white;
      padding: 24px;
      border-radius: 12px;
      margin: 20px 0;
      border: 1px solid #e9d5ff;
    }
    a {
      display: inline-block;
      background: #7c3aed;
      color: white;
      padding: 12px 24px;
      border-radius: 8px;
      text-decoration: none;
      margin: 8px;
    }
    a:hover { background: #6d28d9; }
    code {
      background: #f3e8ff;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 14px;
    }
  </style>
</head>
<body>
  <h1>Временные ограничения</h1>
  <p>Сайт может быть недоступен через прямое подключение. Вот способы доступа:</p>
  
  <div class="alternative">
    <h2>Вариант 1: Альтернативный адрес</h2>
    <p><a href="https://ortopednn.pages.dev${path}" target="_blank">ortopednn.pages.dev</a></p>
    <p>Используйте этот адрес если основной сайт не открывается.</p>
  </div>
  
  <div class="alternative">
    <h2>Вариант 2: VPN</h2>
    <p>Используйте VPN-сервис для доступа к заблокированным сайтам.</p>
  </div>
  
  <div class="alternative">
    <h2>Вариант 3: Сохраните контакты</h2>
    <p>Телефон для связи: <strong>+7 920 253 73 17</strong></p>
    <p>Или напишите в <a href="https://t.me/nikitina_ortoped" target="_blank">Telegram</a></p>
  </div>
  
  <p><small>Последнее обновление: ${new Date().toLocaleDateString('ru-RU')}</small></p>
</body>
</html>
  `.trim();
}