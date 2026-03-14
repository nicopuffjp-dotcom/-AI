export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const { topic, wordCount, style, toggles, links, categories, imgSize, imgSource, format } = req.body;
  if (!topic) return res.status(400).json({ error: 'topic required' });

  const apiKey = process.env.GEMINI_API_KEY;
  const styleLabel = style === 'pro' ? 'プロライター（専門的）' : style === 'casual' ? 'カジュアル' : 'SEO特化';

  const prompt = `あなたはプロのブログライターです。以下の条件で日本語のブログ記事をHTML形式で作成してください。

テーマ: ${topic}
文字数: 約${wordCount}文字
スタイル: ${styleLabel}
カテゴリ: ${categories?.join(', ')}

要件:
${toggles?.toc ? '- 目次を冒頭に追加する' : ''}
${toggles?.summary ? '- まとめセクションを末尾に追加する' : ''}
${toggles?.bullets ? '- 箇条書きを活用する' : ''}
${toggles?.bold ? '- 重要キーワードを<strong>で強調する' : ''}
${toggles?.seo ? '- SEOを意識したキーワード配置にする' : ''}
${toggles?.h2divider ? '- H2タグの前に<hr>区切り線を入れる' : ''}
${links?.length > 0 ? `- 以下のURLを自然な形で内部リンクとして挿入する: ${links.join(', ')}` : ''}

出力形式:
- 1行目: 記事タイトル（HTMLタグなし）
- 2行目以降: 本文HTML（<h2>,<h3>,<p>,<ul>,<li>,<strong>等を使用）
- \`\`\`などのコードブロックは使わない
- bodyタグやhtmlタグは不要`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.7, maxOutputTokens: 8192 }
        })
      }
    );
    const data = await response.json();
    if (!response.ok) return res.status(500).json({ error: data.error?.message || 'Gemini error' });
    
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const lines = text.split('\n');
    const title = lines[0].replace(/<[^>]*>/g, '').trim();
    const html = lines.slice(1).join('\n').trim();
    
    return res.status(200).json({ title, html });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
