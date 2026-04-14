export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const { keyword } = req.body;
  if (!keyword) return res.status(400).json({ error: 'keyword required' });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'ANTHROPIC_API_KEY not set' });

  // 競合URLをクロール（Google検索の代替として固定URLパターン）
  const searchUrls = [
    `https://www.google.com/search?q=${encodeURIComponent(keyword)}&num=5&hl=ja`,
  ];

  let crawledContent = '';
  for (const url of searchUrls) {
    try {
      const r = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept-Language': 'ja,en-US;q=0.9',
        }
      });
      const html = await r.text();
      const text = html
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 2000);
      crawledContent += text;
    } catch (e) {}
  }

  const prompt = `あなたはSEO専門家です。
キーワード「${keyword}」で上位を狙うブログ記事に必要なトピック・構成を分析してください。

${crawledContent ? `【参考情報】\n${crawledContent}\n\n` : ''}

以下のJSON形式のみで回答してください（他のテキスト不要）:
{
  "mainKeyword": "メインキーワード",
  "searchIntent": "検索意図の説明（1〜2文）",
  "difficulty": "easy|medium|hard",
  "monthlyVolume": "推定月間検索数（例: 3,200）",
  "relatedKeywords": ["関連KW1", "関連KW2", "関連KW3", "関連KW4", "関連KW5"],
  "lsiKeywords": ["LSI語1", "LSI語2", "LSI語3", "LSI語4", "LSI語5"],
  "mustTopics": [
    {"title": "必須トピック1", "reason": "なぜ必要か", "priority": "high"},
    {"title": "必須トピック2", "reason": "なぜ必要か", "priority": "high"},
    {"title": "必須トピック3", "reason": "なぜ必要か", "priority": "medium"},
    {"title": "必須トピック4", "reason": "なぜ必要か", "priority": "medium"},
    {"title": "必須トピック5", "reason": "なぜ必要か", "priority": "low"}
  ],
  "suggestedStructure": [
    {"heading": "H1: 記事タイトル案", "type": "h1", "chars": 0},
    {"heading": "H2: セクション1", "type": "h2", "chars": 600},
    {"heading": "H3: サブセクション", "type": "h3", "chars": 300},
    {"heading": "H2: セクション2", "type": "h2", "chars": 700},
    {"heading": "H2: セクション3", "type": "h2", "chars": 700},
    {"heading": "H2: まとめ", "type": "h2", "chars": 300}
  ],
  "metaTitle": "SEO最適化タイトル（32文字以内）",
  "metaDescription": "メタディスクリプション（120文字以内）",
  "tips": ["SEOアドバイス1", "SEOアドバイス2", "SEOアドバイス3"]
}`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5',
        max_tokens: 2000,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    const data = await response.json();
    if (!response.ok) return res.status(500).json({ error: data.error?.message || 'Claude error' });

    const text = data.content?.[0]?.text || '';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return res.status(500).json({ error: 'JSON parse error' });

    const result = JSON.parse(jsonMatch[0]);
    return res.status(200).json(result);
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
