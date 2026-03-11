// pages/api/shopify/publish.js
// サーバーサイドで記事をShopifyに投稿

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { domain, token, version, blogId, article } = req.body;

  if (!domain || !token || !blogId || !article) {
    return res.status(400).json({ error: '必須パラメータが不足しています' });
  }

  const apiVersion = version || '2025-01';
  const cleanDomain = domain.replace(/^https?:\/\//, '').replace(/\/$/, '');

  try {
    const response = await fetch(
      `https://${cleanDomain}/admin/api/${apiVersion}/blogs/${blogId}/articles.json`,
      {
        method: 'POST',
        headers: {
          'X-Shopify-Access-Token': token,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ article }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      let errorMsg = `Shopify APIエラー: ${response.status}`;
      if (response.status === 401) errorMsg = '認証エラー（401）：トークンが無効です';
      if (response.status === 403) errorMsg = '権限エラー（403）：write_contentスコープが必要です';
      if (response.status === 404) errorMsg = 'ストアまたはブログが見つかりません（404）';
      if (data.errors) errorMsg = JSON.stringify(data.errors);

      return res.status(response.status).json({ error: errorMsg });
    }

    return res.status(200).json(data);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
