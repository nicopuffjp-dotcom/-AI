// pages/api/shopify/blogs.js
// サーバーサイドでShopify APIを叩く → CORSを回避

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { domain, token, version } = req.query;

  if (!domain || !token) {
    return res.status(400).json({ error: 'domain と token は必須です' });
  }

  const apiVersion = version || '2025-01';
  const cleanDomain = domain.replace(/^https?:\/\//, '').replace(/\/$/, '');

  try {
    const response = await fetch(
      `https://${cleanDomain}/admin/api/${apiVersion}/blogs.json`,
      {
        method: 'GET',
        headers: {
          'X-Shopify-Access-Token': token,
          'Content-Type': 'application/json',
        },
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        error: data.errors || `Shopify APIエラー: ${response.status}`,
        status: response.status,
      });
    }

    return res.status(200).json(data);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
