export default async function handler(req, res) {
  const { code, shop } = req.query;
  if (!code || !shop) return res.status(400).json({ error: 'missing params', query: req.query });
  const clientId = process.env.SHOPIFY_CLIENT_ID;
  const clientSecret = process.env.SHOPIFY_CLIENT_SECRET;
  try {
    const r = await fetch(`https://${shop}/admin/oauth/access_token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ client_id: clientId, client_secret: clientSecret, code }),
    });
    const text = await r.text();
    let data;
    try { data = JSON.parse(text); } catch(e) {
      return res.status(400).json({ error: 'Shopify returned HTML', status: r.status, body: text.slice(0, 500) });
    }
    if (!data.access_token) return res.status(400).json({ error: 'no token', data });
    res.setHeader('Set-Cookie', [
      `shopify_token=${data.access_token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=604800`,
      `shopify_domain=${shop}; Path=/; Secure; SameSite=Lax; Max-Age=604800`,
    ]);
    res.redirect(302, `/?shop=${shop}&installed=1`);
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
}
