export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const { topic, wordCount, style, toggles, links, categories, template, images, imagePositions, supplement } = req.body;
  if (!topic) return res.status(400).json({ error: 'topic required' });

  const apiKey = process.env.GEMINI_API_KEY;
  const styleLabel = style === 'pro' ? 'プロライター（専門的）' : style === 'casual' ? 'カジュアル' : 'SEO特化';

  const tmplMap = {
    circuit: {
      wrapper: 'background:linear-gradient(180deg,#0d1117,#111827);color:#a0aec0;padding:24px;border-radius:12px;',
      h2: 'background:linear-gradient(135deg,rgba(0,212,255,0.1),rgba(0,212,255,0.05));border:1px solid rgba(0,212,255,0.3);border-radius:6px;padding:10px 14px;font-size:18px;font-weight:500;color:#00d4ff;margin:24px 0 12px;',
      h3: 'font-size:15px;font-weight:500;color:#67e8f9;margin:16px 0 8px;border-left:2px solid #00d4ff;padding-left:10px;',
      p: 'font-size:15px;line-height:1.9;color:#a0aec0;margin-bottom:14px;',
      strong: 'color:#00d4ff;font-weight:600;',
      box: 'border:1px solid rgba(0,212,255,0.4);border-radius:6px;padding:12px 16px;margin:16px 0;background:rgba(0,212,255,0.05);color:#67e8f9;font-size:13px;line-height:1.7;',
      link: '#67e8f9',
      ul: 'padding-left:20px;margin-bottom:14px;color:#a0aec0;',
      li: 'margin-bottom:6px;line-height:1.8;color:#a0aec0;',
    },
    bangking: {
      wrapper: 'background:linear-gradient(180deg,#120a00,#111111);color:#9ca3af;padding:24px;border-radius:12px;',
      h2: 'border-left:3px solid #f97316;padding-left:12px;font-size:18px;font-weight:500;color:#fb923c;margin:24px 0 12px;',
      h3: 'font-size:15px;font-weight:500;color:#fdba74;margin:16px 0 8px;',
      p: 'font-size:15px;line-height:1.9;color:#9ca3af;margin-bottom:14px;',
      strong: 'color:#f97316;font-weight:600;',
      box: 'background:linear-gradient(135deg,rgba(249,115,22,0.15),rgba(239,68,68,0.1));border:1px solid rgba(249,115,22,0.4);border-radius:6px;padding:12px 16px;margin:16px 0;color:#fb923c;font-size:13px;line-height:1.7;',
      link: '#fdba74',
      ul: 'padding-left:20px;margin-bottom:14px;color:#9ca3af;',
      li: 'margin-bottom:6px;line-height:1.8;color:#9ca3af;',
    },
    whitetech: {
      wrapper: 'background:#fff;color:#374151;padding:24px;border-radius:12px;border:1px solid #e5e7eb;',
      h2: 'background:linear-gradient(135deg,#eef2ff,#e0f2fe);border-radius:6px;padding:10px 14px;font-size:18px;font-weight:500;color:#3730a3;margin:24px 0 12px;',
      h3: 'font-size:15px;font-weight:500;color:#4f46e5;margin:16px 0 8px;border-left:2px solid #6366f1;padding-left:10px;',
      p: 'font-size:15px;line-height:1.9;color:#374151;margin-bottom:14px;',
      strong: 'color:#4f46e5;font-weight:600;',
      box: 'background:linear-gradient(135deg,#eef2ff,#e0f2fe);border:1px solid #c7d2fe;border-radius:8px;padding:12px 16px;margin:16px 0;color:#3730a3;font-size:13px;line-height:1.7;',
      link: '#4f46e5',
      ul: 'padding-left:20px;margin-bottom:14px;color:#374151;',
      li: 'margin-bottom:6px;line-height:1.8;color:#374151;',
    },
    neonchrome: {
      wrapper: 'background:linear-gradient(180deg,#0a0a0a,#111111);color:#9ca3af;padding:24px;border-radius:12px;',
      h2: 'background:linear-gradient(135deg,rgba(0,255,200,0.08),rgba(255,0,200,0.05));border:1px solid rgba(0,255,200,0.25);border-radius:6px;padding:10px 14px;font-size:18px;font-weight:500;color:#00ffc8;margin:24px 0 12px;',
      h3: 'font-size:15px;font-weight:500;color:#a78bfa;margin:16px 0 8px;border-left:2px solid #00ffc8;padding-left:10px;',
      p: 'font-size:15px;line-height:1.9;color:#9ca3af;margin-bottom:14px;',
      strong: 'color:#00ffc8;font-weight:600;',
      box: 'border:1px solid rgba(0,255,200,0.3);border-radius:6px;padding:12px 16px;margin:16px 0;background:rgba(0,255,200,0.05);color:#00ffc8;font-size:13px;line-height:1.7;',
      link: '#a78bfa',
      ul: 'padding-left:20px;margin-bottom:14px;color:#9ca3af;',
      li: 'margin-bottom:6px;line-height:1.8;color:#9ca3af;',
    },
    urbansmoke: {
      wrapper: 'background:linear-gradient(180deg,#1a1f2e,#111827);color:#9ca3af;padding:24px;border-radius:12px;',
      h2: 'border-left:2px solid #f97316;padding-left:12px;font-size:18px;font-weight:500;color:#f9fafb;margin:24px 0 12px;',
      h3: 'font-size:15px;font-weight:500;color:#d1d5db;margin:16px 0 8px;',
      p: 'font-size:15px;line-height:1.9;color:#9ca3af;margin-bottom:14px;',
      strong: 'color:#f97316;font-weight:600;',
      box: 'background:linear-gradient(135deg,#1f2937,#111827);border:1px solid #374151;border-left:3px solid #f97316;padding:12px 16px;margin:16px 0;color:#d1d5db;font-size:13px;line-height:1.7;',
      link: '#fb923c',
      ul: 'padding-left:20px;margin-bottom:14px;color:#9ca3af;',
      li: 'margin-bottom:6px;line-height:1.8;color:#9ca3af;',
    },
  };

  const tmpl = tmplMap[template] || tmplMap.circuit;

  // URLクロール
  let crawledText = '';
  if (links && links.length > 0) {
    for (const link of links.slice(0, 3)) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000);
        const r = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/crawl`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: link }),
          signal: controller.signal
        });
        clearTimeout(timeout);
        const d = await r.json();
        if (d.text) crawledText += `\n\n【${link}の内容】\n${d.text}`;
      } catch(e) {}
    }
  }

  const supplementText = supplement ? '\n【重要な補足・指示】\n' + supplement + '\nこの指示を必ず守って記事を作成してください。' : '';
  const prompt = `あなたはプロのブログライターです。以下の条件で日本語のブログ記事をHTML形式で作成してください。
${supplementText}

【最重要】文字数は${wordCount}文字を絶対に超えないこと。HTMLタグを除いたテキスト文字数で${wordCount}文字以内に必ず収めること。超えた場合は失敗とみなします。

テーマ: ${topic}
文字数: ${wordCount}文字以内（厳守・絶対厳守）。
スタイル: ${styleLabel}
カテゴリ: ${(categories||[]).join(', ')}
${crawledText ? `\n参考情報（以下のURLから取得した実際の商品・サイト情報を記事に反映してください）:${crawledText}` : ''}

要件:
${toggles && toggles.toc ? '- 目次を冒頭に追加する' : ''}
${toggles && toggles.summary ? '- まとめセクションを末尾に追加する' : ''}
${toggles && toggles.bullets ? '- 箇条書きを活用する' : ''}
${toggles && toggles.bold ? '- 重要キーワードを<strong>で強調する' : ''}
${toggles && toggles.seo ? '- SEOを意識したキーワード配置にする' : ''}
${toggles && toggles.h2divider ? '- H2タグの前に<hr>区切り線を入れる' : ''}
${links && links.length > 0 ? `- 以下のURLを自然な形で内部リンクとして挿入する: ${links.join(', ')}` : ''}

出力形式:
- 1行目: 記事タイトル（HTMLタグなし）
- 2行目以降: 本文HTML（<h2>,<h3>,<p>,<ul>,<li>,<strong>等を使用）
- バックティックなどのコードブロックは使わない
- bodyタグやhtmlタグは不要`;

  try {
    // 画像がある場合はマルチモーダルで送信
    const parts = [];
    if (images && images.length > 0) {
      for (const img of images.slice(0, 3)) {
        const base64 = img.url.split(',')[1];
        const mimeType = img.url.split(';')[0].split(':')[1];
        parts.push({ inline_data: { mime_type: mimeType, data: base64 } });
      }
      parts.push({ text: '上記の画像は商品・ブランドの画像です。画像から読み取れる特徴・デザイン・雰囲気・色・スタイルを記事内容に反映してください。\n\n' + prompt });
    } else {
      parts.push({ text: prompt });
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts }],
          generationConfig: { temperature: 0.7, maxOutputTokens: 8192 }
        })
      }
    );
    const data = await response.json();
    if (!response.ok) return res.status(500).json({ error: data.error && data.error.message ? data.error.message : 'Gemini error' });

    const text = data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts && data.candidates[0].content.parts[0] ? data.candidates[0].content.parts[0].text : '';
    const lines = text.split('\n');
    const title = lines[0].replace(/<[^>]*>/g, '').trim();
    let html = lines.slice(1).join('\n').trim();

    html = html.replace(/<h2([^>]*)>/g, '<h2$1 style="' + tmpl.h2 + '">');
    html = html.replace(/<h3([^>]*)>/g, '<h3$1 style="' + tmpl.h3 + '">');
    html = html.replace(/<p([^>]*)>/g, '<p$1 style="' + tmpl.p + '">');
    html = html.replace(/<strong([^>]*)>/g, '<strong$1 style="' + tmpl.strong + '">');
    html = html.replace(/<blockquote([^>]*)>/g, '<blockquote$1 style="' + tmpl.box + '">');
    html = html.replace(/<a([^>]*href[^>]*)>/g, '<a$1 style="color:' + tmpl.link + ';text-decoration:underline;">');
    html = html.replace(/<ul([^>]*)>/g, '<ul$1 style="' + tmpl.ul + '">');
    html = html.replace(/<li([^>]*)>/g, '<li$1 style="' + tmpl.li + '">');
    html = '<div style="' + tmpl.wrapper + '">' + html + '</div>';

    // 画像挿入
    if (images && images.length > 0) {
      const eyecatch = images.filter(img => (imagePositions && imagePositions[img.id]) === 'eyecatch');
      const afterH2 = images.filter(img => (imagePositions && imagePositions[img.id]) === 'afterh2');
      const middle = images.filter(img => (imagePositions && imagePositions[img.id]) === 'middle');
      const bottom = images.filter(img => (imagePositions && imagePositions[img.id]) === 'bottom');
      if (eyecatch.length > 0) {
        const imgs = eyecatch.map(img => `<img src="${img.url}" alt="${img.filename}" style="width:100%;border-radius:8px;margin-bottom:16px;">`).join('');
        html = html.replace('<div style="' + tmpl.wrapper + '">', '<div style="' + tmpl.wrapper + '">' + imgs);
      }
      if (afterH2.length > 0) {
        const imgs = afterH2.map(img => `<img src="${img.url}" alt="${img.filename}" style="width:100%;border-radius:8px;margin:16px 0;">`).join('');
        html = html.replace('</h2>', '</h2>' + imgs);
      }
      if (middle.length > 0) {
        const imgs = middle.map(img => `<img src="${img.url}" alt="${img.filename}" style="width:100%;border-radius:8px;margin:16px 0;">`).join('');
        const half = Math.floor(html.length / 2);
        const cut = html.indexOf('</p>', half);
        if (cut !== -1) html = html.slice(0, cut + 4) + imgs + html.slice(cut + 4);
      }
      if (bottom.length > 0) {
        const imgs = bottom.map(img => `<img src="${img.url}" alt="${img.filename}" style="width:100%;border-radius:8px;margin-top:16px;">`).join('');
        html = html.replace('</div>', imgs + '</div>');
      }
    }

    return res.status(200).json({ title, html });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
