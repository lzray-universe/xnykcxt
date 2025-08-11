/* Service Worker: forward '/api/*' to configured Cloudflare Worker origin */
const CONFIG_URL = '/api-proxy.json';
let PROXY_ORIGIN = '';

self.addEventListener('install', (e) => { self.skipWaiting(); });
self.addEventListener('activate', (e) => { self.clients.claim(); });

async function loadConfig(){
  if (PROXY_ORIGIN) return PROXY_ORIGIN;
  try {
    const resp = await fetch(CONFIG_URL, { cache: 'no-store' });
    const conf = await resp.json();
    PROXY_ORIGIN = (conf && conf.origin) || '';
  } catch(e){ PROXY_ORIGIN = ''; }
  return PROXY_ORIGIN;
}

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (!url.pathname.startsWith('/api/')) return;

  event.respondWith((async () => {
    const origin = await loadConfig();
    // If not configured, just fall through (will 404 on GitHub Pages)
    if (!origin) {
      return fetch(event.request);
    }
    // Build target URL
    const target = origin.replace(/\/$/,'') + url.pathname + url.search;
    const init = {
      method: event.request.method,
      headers: event.request.headers,
      body: (event.request.method === 'GET' || event.request.method === 'HEAD') ? undefined : await event.request.arrayBuffer(),
      mode: 'cors',
      redirect: 'follow',
    };
    try {
      const resp = await fetch(target, init);
      // Return as-is; CORS already allowed by Worker ('*')
      return new Response(resp.body, {
        status: resp.status,
        statusText: resp.statusText,
        headers: resp.headers
      });
    } catch (e) {
      return new Response('Proxy error', { status: 502 });
    }
  })());
});
