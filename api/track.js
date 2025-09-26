// api/track.js
export default async function handler(req, res) {
  // Allow only POST
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).send('Method Not Allowed');
  }

  // Basic CORS — adjust origin as needed (set to your domain)
  const allowedOrigin = req.headers.origin || '';
  // You may restrict to your actual domain: e.g. https://yourdomain.com
  res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  try {
    const body = req.body || (await new Promise(r=>{ let s=''; req.on('data',c=>s+=c); req.on('end',()=>r(JSON.parse(s))); }));
    // Basic validation
    if (!body || !body.userId) {
      return res.status(400).json({ error: 'Missing userId' });
    }

    // Prepare payload for Make webhook
    const forwardPayload = {
      userId: body.userId,
      displayName: body.displayName || '',
      utm_source: body.utm_source || '',
      utm_campaign: body.utm_campaign || '',
      timestamp: body.timestamp || new Date().toISOString()
    };

    const MAKE_WEBHOOK_URL = process.env.MAKE_WEBHOOK_URL;
    if (!MAKE_WEBHOOK_URL) {
      console.error('MAKE_WEBHOOK_URL not set in env');
      return res.status(500).json({ error: 'Server misconfiguration' });
    }

    // Send to Make webhook server-to-server
    const r = await fetch(MAKE_WEBHOOK_URL, {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify(forwardPayload)
    });

    if (!r.ok) {
      const text = await r.text();
      console.error('Make webhook error', r.status, text);
      return res.status(502).json({ error: 'Forward failed', details: text });
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('track error', err);
    return res.status(500).json({ error: String(err) });
  }
}
