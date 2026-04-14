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
      return res.status(400).json({ error: 'Shopify returned HTML', status: r.status, body: text.slice(0, 200) });
    }
    if (!data.access_token) return res.status(400).json({ error: 'no token', data });

    // トークンをクッキーに保存してリダイレクト
    res.setHeader('Set-Cookie', [
      `shopify_token=${data.access_token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=604800`,
      `shopify_domain=${shop}; Path=/; Secure; SameSite=Lax; Max-Age=604800`,
    ]);

    // トークンを画面に一時表示
    res.status(200).send(`
      <html><body style="font-family:sans-serif;padding:40px;background:#f0fdf4;">
        <h2 style="color:#16a34a;">✓ 連携成功！</h2>
        <p>以下のトークンをコピーしてください：</p>
        <code style="display:block;background:#fff;border:1px solid #ccc;padding:16px;border-radius:8px;font-size:14px;word-break:break-all;margin:16px 0;">${data.access_token}</code>
        <p>このトークンをBlogCraftの「Admin APIアクセストークン」欄に貼り付けてください。</p>
        <a href="https://blogcraftai.vercel.app" style="display:inline-block;margin-top:16px;padding:10px 20px;background:#16a34a;color:white;border-radius:8px;text-decoration:none;">BlogCraftに戻る</a>
      </body></html>
    `);
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
}
