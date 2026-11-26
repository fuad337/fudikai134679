/**
 * Fudik AI + Epoint payment backend for Cloudflare Workers.
 * Required bindings/secrets: SUBSCRIPTIONS (KV namespace), EPOINT_PUBLIC_KEY,
 * EPOINT_PRIVATE_KEY, SITE_URL. Optional variable: ALLOWED_ORIGIN.
 */
const PLANS = {
  pro: { amount: 5.99, description: 'Fudik AI PRO - 1 month', days: 30 },
  super: { amount: 13.99, description: 'Fudik AI SUPER - 1 month', days: 30 }
};

function json(data, status = 200, origin = '*') {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'access-control-allow-origin': origin,
      'access-control-allow-methods': 'GET, POST, OPTIONS', 'access-control-allow-headers': 'Content-Type' }
  });
}
function bytesToBase64(bytes) {
  let binary = ''; for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}
async function epointSignature(privateKey, data) {
  const bytes = new TextEncoder().encode(privateKey + data + privateKey);
  const digest = await crypto.subtle.digest('SHA-1', bytes);
  return bytesToBase64(new Uint8Array(digest));
}
function safeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) return false;
  let out = 0; for (let i = 0; i < a.length; i++) out |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return out === 0;
}
async function parseEpointForm(request) {
  const form = await request.formData();
  return { data: String(form.get('data') || ''), signature: String(form.get('signature') || '') };
}

export default {
  async fetch(request, env) {
    const origin = env.ALLOWED_ORIGIN || '*';
    if (request.method === 'OPTIONS') return new Response(null, { headers: {
      'access-control-allow-origin': origin, 'access-control-allow-methods': 'GET, POST, OPTIONS',
      'access-control-allow-headers': 'Content-Type' } });
    const url = new URL(request.url);

    if (url.pathname === '/api/create-payment' && request.method === 'POST') {
      if (!env.SUBSCRIPTIONS || !env.EPOINT_PUBLIC_KEY || !env.EPOINT_PRIVATE_KEY || !env.SITE_URL)
        return json({ error: 'Сервер оплаты ещё не настроен.' }, 503, origin);
      let body;
      try { body = await request.json(); } catch { return json({ error: 'Некорректный запрос.' }, 400, origin); }
      const tier = body.tier;
      const customerId = String(body.customer_id || '');
      if (!PLANS[tier] || !/^[a-f0-9-]{30,80}$/i.test(customerId))
        return json({ error: 'Некорректный тариф или идентификатор клиента.' }, 400, origin);

      const plan = PLANS[tier];
      const orderId = `FUDIK-${crypto.randomUUID()}`;
      const site = env.SITE_URL.replace(/\/$/, '');
      const payload = {
        public_key: env.EPOINT_PUBLIC_KEY,
        amount: plan.amount,
        currency: 'USD',
        language: 'ru',
        order_id: orderId,
        description: plan.description,
        result_url: `${url.origin}/api/epoint-callback`,
        success_redirect_url: `${site}/?payment=success&order_id=${encodeURIComponent(orderId)}&customer_id=${encodeURIComponent(customerId)}`,
        error_redirect_url: `${site}/?payment=error`
      };
      const data = bytesToBase64(new TextEncoder().encode(JSON.stringify(payload)));
      const signature = await epointSignature(env.EPOINT_PRIVATE_KEY, data);
      const form = new URLSearchParams({ data, signature });
      let response;
      try {
        response = await fetch('https://epoint.az/api/1/request', { method: 'POST',
          headers: { 'content-type': 'application/x-www-form-urlencoded' }, body: form });
      } catch { return json({ error: 'Не удалось связаться с Epoint.' }, 502, origin); }
      const result = await response.json().catch(() => ({}));
      const redirectUrl = result.redirect_url || result.redirectUrl || result.checkout_url;
      if (!response.ok || !redirectUrl) return json({ error: result.message || 'Epoint не создал платёж. Проверьте данные мерчанта и валюту USD.' }, 502, origin);
      await env.SUBSCRIPTIONS.put(`order:${orderId}`, JSON.stringify({ orderId, customerId, tier,
        amount: plan.amount, currency: 'USD', status: 'new', createdAt: Date.now() }), { expirationTtl: 86400 });
      return json({ redirect_url: redirectUrl, order_id: orderId }, 200, origin);
    }

    if (url.pathname === '/api/payment-status' && request.method === 'GET') {
      const customerId = url.searchParams.get('customer_id') || '';
      if (!/^[a-f0-9-]{30,80}$/i.test(customerId)) return json({ error: 'Некорректный клиент.' }, 400, origin);
      const raw = await env.SUBSCRIPTIONS.get(`subscription:${customerId}`);
      if (!raw) return json({ tier: 'free', active: false }, 200, origin);
      const subscription = JSON.parse(raw);
      if (subscription.expiresAt <= Date.now()) return json({ tier: 'free', active: false }, 200, origin);
      return json({ tier: subscription.tier, active: true, expiresAt: subscription.expiresAt }, 200, origin);
    }

    if (url.pathname === '/api/epoint-callback' && request.method === 'POST') {
      if (!env.SUBSCRIPTIONS || !env.EPOINT_PRIVATE_KEY) return new Response('CONFIG_ERROR', { status: 503 });
      const { data, signature } = await parseEpointForm(request);
      const expected = await epointSignature(env.EPOINT_PRIVATE_KEY, data);
      if (!safeEqual(signature, expected)) return new Response('INVALID_SIGNATURE', { status: 401 });
      let result;
      try { result = JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(data), c => c.charCodeAt(0)))); }
      catch { return new Response('INVALID_DATA', { status: 400 }); }
      const orderId = String(result.order_id || '');
      const orderRaw = await env.SUBSCRIPTIONS.get(`order:${orderId}`);
      if (!orderRaw) return new Response('ORDER_NOT_FOUND', { status: 404 });
      const order = JSON.parse(orderRaw);
      if (Number(result.amount) !== order.amount || String(result.status).toLowerCase() !== 'success') {
        order.status = String(result.status || 'failed');
        await env.SUBSCRIPTIONS.put(`order:${orderId}`, JSON.stringify(order), { expirationTtl: 86400 });
        return new Response('OK');
      }
      const expiresAt = Date.now() + PLANS[order.tier].days * 86400000;
      await env.SUBSCRIPTIONS.put(`subscription:${order.customerId}`, JSON.stringify({ tier: order.tier,
        expiresAt, orderId }), { expirationTtl: 35 * 86400 });
      order.status = 'success'; order.paidAt = Date.now();
      await env.SUBSCRIPTIONS.put(`order:${orderId}`, JSON.stringify(order), { expirationTtl: 86400 });
      return new Response('OK');
    }

    return json({ error: 'Not found' }, 404, origin);
  }
};
