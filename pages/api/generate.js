// pages/api/generate.js
// サーバーサイドでAnthropicを呼ぶ（APIキーをサーバーで管理）

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { topic, wordCount, style, links, platform } = req.body;

  // APIキーは環境変数から（Vercelの環境変数に設定）
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'ANTHROPIC_API_KEY が設定されていません' });
  }

  const styleLabel = {
    pro: 'プロライター（専門的・信頼性重視）',
    seo: 'SEO最適化ライター',
    story: 'ストーリーテリングライター',
    casual: 'カジュアルライター',
    expert: '業界専門家（深掘り解説）',
  }[style] || 'プロライター';

  const linkList = links?.length
    ? links.map((l) => `- ${l}`).join('\n')
    : '（なし）';

  const prompt = `あなたは${styleLabel}として、以下の条件でブログ記事を執筆してください。

テーマ：${topic}
目標文字数：約${wordCount || 2000}字
投稿先：${platform || 'Shopifyブログ'}

要件：
1. プロのライターとして、読者の課題に的確に答える高品質な記事を書く
2. 読み進めたくなる導入文から始める
3. H2・H3を使って論理的に構成する
4. 実践的・具体的なアドバイスや事例を含める
5. SEOを意識したキーワードの自然な配置
6. 挿入リンク（自然な文脈で本文内に含める）：
${linkList}
7. 読者が次のアクションを取りたくなるまとめで締めくくる

出力形式：HTMLのみ（h1, h2, h3, p, ul, li, strong タグ使用）
・h1タグは1つだけ（記事タイトル）
・余分な説明文・コードブロック・Markdownは不要
・日本語で記述`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4000,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        error: data.error?.message || 'Anthropic APIエラー',
      });
    }

    const html = data.content[0].text.replace(/```html|```/g, '').trim();
    const titleMatch = html.match(/<h1[^>]*>(.*?)<\/h1>/i);
    const title = titleMatch ? titleMatch[1].replace(/<[^>]+>/g, '') : topic;

    return res.status(200).json({ html, title });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
