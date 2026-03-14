export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const { topic, wordCount, style, toggles, links, categories, imgSize, imgSource, format } = req.body;
  if (!topic) return res.status(400).json({ error: 'topic required' });

  const apiKey = process.env.GEMINI_API_KEY;

  const templates = {
    circuit: {
      wrapper: 'background:linear-gradient(180deg,#0d1117,#111827);color:#a0aec0;padding:24px;border-radius:12px;',
      h2: 'background:linear-gradient(135deg,rgba(0,212,255,0.1),rgba(0,212,255,0.05));border:1px solid rgba(0,212,255,0.3);border-radius:6px;padding:10px 14px;font-size:18px;font-weight:500;color:#00d4ff;margin:24px 0 12px;',
      h3: 'font-size:15px;font-weight:500;color:#67e8f9;margin:16px 0 8px;border-left:2px solid #00d4ff;padding-left:10px;',
      p: 'font-size:15px;line-height:1.9;color:#a0aec0;margin-bottom:14px;',
      box: 'border:1px solid rgba(0,212,255,0.4);border-radius:6px;padding:12px 16px;margin:16px 0;background:rgba(0,212,255,0.05);color:#67e8f9;font-size:13px;line-height:1.7;',
      strong: 'color:#00d4ff;font-weight:600;',
    },
    bangking: {
      wrapper: 'background:linear-gradient(180deg,#120a00,#111111);color:#9ca3af;padding:24px;border-radius:12px;',
      h2: 'border-left:3px solid #f97316;padding-left:12px;font-size:18px;font-weight:500;color:#fb923c;margin:24px 0 12px;',
      h3: 'font-size:15px;font-weight:500;color:#fdba74;margin:16px 0 8px;',
      p: 'font-size:15px;line-height:1.9;color:#9ca3af;margin-bottom:14px;',
      box: 'background:linear-gradient(135deg,rgba(249,115,22,0.15),rgba(239,68,68,0.1));border:1px solid rgba(249,115,22,0.4);border-radius:6px;padding:12px 16px;margin:16px 0;color:#fb923c;font-size:13px;line-height:1.7;',
      strong: 'color:#f97316;font-weight:600;',
    },
    whitetech: {
      wrapper: 'background:#fff;color:#374151;padding:24px;border-radius:12px;border:1px solid #e5e7eb;',
      h2: 'background:linear-gradient(135deg,#eef2ff,#e0f2fe);border-radius:6px;padding:10px 14px;font-size:18px;font-weight:500;color:#3730a3;margin:24px 0 12px;',
      h3: 'font-size:15px;font-weight:500;color:#4f46e5;margin:16px 0 8px;border-left:2px solid #6366f1;padding-left:10px;',
      p: 'font-size:15px;line-height:1.9;color:#374151;margin-bottom:14px;',
      box: 'background:linear-gradient(135deg,#eef2ff,#e0f2fe);border:1px solid #c7d2fe;border-radius:8px;padding:12px 16px;margin:16px 0;color:#3730a3;font-size:13px;line-height:1.7;',
      strong: 'color:#4f46e5;font-weight:600;',
    },
    neonchrome: {
      wrapper: 'background:linear-gradient(180deg,#0a0a0a,#111111);color:#9ca3af;padding:24px;border-radius:12px;',
      h2: 'background:linear-gradient(135deg,rgba(0,255,200,0.08),rgba(255,0,200,0.05));border:1px solid rgba(0,255,200,0.25);border-radius:6px;padding:10px 14px;font-size:18px;font-weight:500;color:#00ffc8;margin:24px 0 12px;',
      h3: 'font-size:15px;font-weight:500;color:#a78bfa;margin:16px 0 8px;border-left:2px solid #00ffc8;padding-left:10px;',
      p: 'font-size:15px;line-height:1.9;color:#9ca3af;margin-bottom:14px;',
      box: 'border:1px solid rgba(0,255,200,0.3);border-radius:6px;padding:12px 16px;margin:16px 0;background:rgba(0,255,200,0.05);color:#00ffc8;font-size:13px;line-height:1.7;',
      strong: 'color:#00ffc8;font-weight:600;',
    },
    urbansmoke: {
      wrapper: 'background:linear-gradient(180deg,#1a1f2e,#111827);color:#9ca3af;padding:24px;border-radius:12px;',
      h2: 'border-left:2px solid #f97316;padding-left:12px;font-size:18px;font-weight:500;color:#f9fafb;margin:24px 0 12px;',
      h3: 'font-size:15px;font-weight:500;color:#d1d5db;margin:16px 0 8px;',
      p: 'font-size:15px;line-height:1.9;color:#9ca3af;margin-bottom:14px;',
      box: 'background:linear-gradient(135deg,#1f2937,#111827);border:1px solid #374151;border-left:3px solid #f97316;padding:12px 16px;margin:16px 0;color:#d1d5db;font-size:13px;line-height:1.7;',
      strong: 'color:#f97316;font-weight:600;',
    },
  };

  const tmpl = templates[template] || templates.circuit;
  const { template } = req.body;
  const styleLabel = style === 'pro' ? 'プロライター（専門的）' : style === 'casual' ? 'カジュアル' : 'SEO特化';

  const prompt = `あなたはプロのブログライターです。以下の条件で日本語のブログ記事をHTML形式で作成してください。

テーマ: ${topic}
文字数: 必ず約${wordCount}文字以内に収めること（厳守）。絶対に超えないこと。
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
          generationConfig: { temperature: 0.7, maxOutputTokens:4096 }
        })
      }
    );
    const data = await response.json();
    if (!response.ok) return res.status(500).json({ error: data.error?.message || 'Gemini error' });
    
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const lines = text.split('\n');
    const title = lines[0].replace(/<[^>]*>/g, '').trim();
    let html = lines.slice(1).join('\n').trim();
    html = html.replace(/<h2([^>]*)>/g, `<h2$1 style="${tmpl.h2}">`);
    html = html.replace(/<h3([^>]*)>/g, `<h3$1 style="${tmpl.h3}">`);
    html = html.replace(/<p([^>]*)>/g, `<p$1 style="${tmpl.p}">`);
    html = html.replace(/<strong([^>]*)>/g, `<strong$1 style="${tmpl.strong}">`);
    html = html.replace(/<blockquote([^>]*)>/g, `<blockquote$1 style="${tmpl.box}">`);
    html = `<div style="${tmpl.wrapper}">${html}</div>`;
    
    return res.status(200).json({ title, html });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
