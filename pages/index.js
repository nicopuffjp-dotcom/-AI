import { useState, useRef } from 'react';
import Head from 'next/head';

export default function Home() {
  // ─── STATE ───
  const [topic, setTopic] = useState('');
  const [wordCount, setWordCount] = useState(2000);
  const [style, setStyle] = useState('pro');
  const [platform, setPlatform] = useState('shopify');
  const [links, setLinks] = useState([]);
  const [newLink, setNewLink] = useState('');
  const [categories, setCategories] = useState(['コマース']);
  const [toggles, setToggles] = useState({
    eyecatch: true, toc: true, summary: true, bullets: true, cta: false,
    h2divider: true, bold: true, seo: true,
  });

  // Shopify
  const [shopifyDomain, setShopifyDomain] = useState('');
  const [shopifyToken, setShopifyToken] = useState('');
  const [apiVersion, setApiVersion] = useState('2025-01');
  const [connecting, setConnecting] = useState(false);
  const [connected, setConnected] = useState(false);
  const [blogs, setBlogs] = useState([]);
  const [selectedBlog, setSelectedBlog] = useState(null);
  const [publishMode, setPublishMode] = useState('draft');
  const [author, setAuthor] = useState('');
  const [connError, setConnError] = useState('');

  // Generation
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState(0); // 0-5
  const [generatedHTML, setGeneratedHTML] = useState('');
  const [generatedTitle, setGeneratedTitle] = useState('');

  // Publishing
  const [publishing, setPublishing] = useState(false);
  const [publishResult, setPublishResult] = useState(null); // {success, message, url}

  // UI
  const [editMode, setEditMode] = useState(false);
  const [toast, setToast] = useState('');
  const [imgSize, setImgSize] = useState('16:9');
  const previewRef = useRef(null);

  // ─── HELPERS ───
  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const toggleCategory = (cat) => {
    setCategories(prev =>
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    );
  };

  const addLink = () => {
    if (!newLink.trim()) return;
    setLinks(prev => [...prev, newLink.trim()]);
    setNewLink('');
  };

  // ─── CONNECT SHOPIFY ───
  const connectShopify = async () => {
    if (!shopifyDomain || !shopifyToken) return;
    setConnecting(true);
    setConnError('');
    setConnected(false);
    setBlogs([]);
    setSelectedBlog(null);

    try {
      const clean = shopifyDomain.replace(/^https?:\/\//, '').replace(/\/$/, '');
      const res = await fetch(
        `/api/shopify/blogs?domain=${encodeURIComponent(clean)}&token=${encodeURIComponent(shopifyToken)}&version=${apiVersion}`
      );
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Shopify接続エラー');

      setConnected(true);
      setBlogs(data.blogs || []);
      if (data.blogs?.length > 0) setSelectedBlog(data.blogs[0]);
      showToast(`✓ 接続成功！${data.blogs.length}件のブログが見つかりました`);
    } catch (err) {
      setConnError(err.message);
    } finally {
      setConnecting(false);
    }
  };

  // ─── GENERATE ───
  const generate = async () => {
    if (!topic.trim()) { showToast('テーマを入力してください'); return; }
    setGenerating(true);
    setProgress(0);
    setGeneratedHTML('');
    setPublishResult(null);

    // Animate progress
    const steps = [300, 700, 1200, 2000, 3000];
    steps.forEach((ms, i) => setTimeout(() => setProgress(i + 1), ms));

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, wordCount, style, links, platform }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setGeneratedHTML(data.html);
      setGeneratedTitle(data.title);
      setProgress(5);
      showToast('✓ 記事が生成されました');
    } catch (err) {
      showToast('エラー：' + err.message);
      setProgress(0);
    } finally {
      setGenerating(false);
    }
  };

  // ─── PUBLISH ───
  const publishToShopify = async () => {
    if (!generatedHTML) { showToast('まず記事を生成してください'); return; }
    if (!connected) { showToast('Shopifyに接続してください'); return; }
    if (!selectedBlog) { showToast('ブログを選択してください'); return; }

    setPublishing(true);
    setPublishResult(null);

    const bodyHtml = previewRef.current
      ? previewRef.current.innerHTML
      : generatedHTML;

    try {
      const clean = shopifyDomain.replace(/^https?:\/\//, '').replace(/\/$/, '');
      const res = await fetch('/api/shopify/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          domain: clean,
          token: shopifyToken,
          version: apiVersion,
          blogId: selectedBlog.id,
          article: {
            title: generatedTitle,
            body_html: bodyHtml,
            author: author || undefined,
            published: publishMode === 'published',
            tags: categories.join(', '),
          },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      const article = data.article;
      const adminUrl = `https://${clean}/admin/articles/${article.id}`;
      setPublishResult({
        success: true,
        message: publishMode === 'published' ? '公開しました！' : '下書きとして保存しました',
        adminUrl,
        handle: article.handle,
      });
      showToast(publishMode === 'published' ? '🛍 Shopifyに公開しました！' : '📝 下書き保存しました');
    } catch (err) {
      setPublishResult({ success: false, message: err.message });
      showToast('投稿エラー：' + err.message);
    } finally {
      setPublishing(false);
    }
  };

  const copyHTML = () => {
    const html = previewRef.current ? previewRef.current.innerHTML : generatedHTML;
    navigator.clipboard.writeText(html).then(() => showToast('HTMLをコピーしました'));
  };

  const STEPS = ['分析', '調査', '構成', '執筆', '仕上げ'];
  const CATS = ['コマース', 'ライフスタイル', '技術', 'トレンド', 'ノウハウ', '事例'];
  const IMG_SIZES = [
    { label: '正方形', sub: '1:1' }, { label: '横長', sub: '16:9' },
    { label: '縦長', sub: '4:5' }, { label: '1200px', sub: 'Large' },
    { label: '800px', sub: 'Medium' }, { label: '400px', sub: 'Thumb' },
  ];

  return (
    <>
      <Head>
        <title>BlogCraft AI</title>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet" />
      </Head>

      <style>{`
        *{box-sizing:border-box;margin:0;padding:0}
        body{font-family:'DM Sans',sans-serif;background:#F7F6F3;color:#1A1916;font-size:14px;line-height:1.6}
        ::-webkit-scrollbar{width:4px}::-webkit-scrollbar-track{background:transparent}::-webkit-scrollbar-thumb{background:#D4D0C8;border-radius:2px}
      `}</style>

      {/* NAV */}
      <nav style={{background:'#fff',borderBottom:'1px solid #E5E3DC',height:52,display:'flex',alignItems:'center',justifyContent:'space-between',padding:'0 28px',position:'sticky',top:0,zIndex:100}}>
        <div style={{display:'flex',alignItems:'center',gap:8,fontWeight:600,fontSize:15,letterSpacing:'-0.02em'}}>
          <div style={{width:8,height:8,background:'#5C8E00',borderRadius:'50%'}}/>
          BlogCraft AI
        </div>
        <div style={{fontSize:11,color:'#9B9892'}}>Powered by Anthropic Claude</div>
      </nav>

      {/* LAYOUT */}
      <div style={{display:'grid',gridTemplateColumns:'256px 1fr 296px',height:'calc(100vh - 52px)',overflow:'hidden'}}>

        {/* ── LEFT SIDEBAR ── */}
        <div style={{background:'#fff',borderRight:'1px solid #E5E3DC',overflowY:'auto',padding:18,display:'flex',flexDirection:'column',gap:16}}>

          {/* Platform */}
          <div>
            <div style={labelStyle}>投稿先</div>
            {[
              {id:'shopify',icon:'🛍️',name:'Shopify',desc:'ブログ記事として投稿'},
              {id:'note',icon:'📝',name:'note',desc:'記事として公開'},
              {id:'both',icon:'⚡',name:'両方に投稿',desc:'同時投稿'},
            ].map(p => (
              <div key={p.id} onClick={() => setPlatform(p.id)}
                style={{border:`1.5px solid ${platform===p.id?'#5C8E00':'#E5E3DC'}`,background:platform===p.id?'#F0F6E4':'#fff',borderRadius:10,padding:'10px 12px',cursor:'pointer',display:'flex',alignItems:'center',gap:10,marginBottom:6,transition:'all 0.15s'}}>
                <div style={{width:28,height:28,borderRadius:7,background:'#F0EFEc',display:'flex',alignItems:'center',justifyContent:'center',fontSize:14,flexShrink:0}}>{p.icon}</div>
                <div style={{flex:1}}>
                  <div style={{fontSize:13,fontWeight:500}}>{p.name}</div>
                  <div style={{fontSize:10,color:'#9B9892'}}>{p.desc}</div>
                </div>
                <div style={{width:14,height:14,borderRadius:'50%',border:`2px solid ${platform===p.id?'#5C8E00':'#D4D0C8'}`,background:platform===p.id?'#5C8E00':'transparent',display:'flex',alignItems:'center',justifyContent:'center',fontSize:8,color:'white',flexShrink:0}}>
                  {platform===p.id&&'✓'}
                </div>
              </div>
            ))}
          </div>

          <div style={{height:1,background:'#E5E3DC'}}/>

          {/* Article settings */}
          <div>
            <div style={labelStyle}>記事設定</div>
            <div style={{marginBottom:12}}>
              <div style={fieldLabelStyle}>文字数：<span style={{color:'#2563EB',fontFamily:'DM Mono',fontWeight:600}}>{wordCount.toLocaleString()}</span></div>
              <input type="range" min={500} max={5000} step={100} value={wordCount}
                onChange={e => setWordCount(Number(e.target.value))}
                style={{width:'100%',accentColor:'#2563EB',cursor:'pointer'}}/>
            </div>
            <div style={{marginBottom:12}}>
              <div style={fieldLabelStyle}>ライティングスタイル</div>
              <select value={style} onChange={e => setStyle(e.target.value)} style={selectStyle}>
                <option value="pro">プロライター（専門的）</option>
                <option value="seo">SEO最適化</option>
                <option value="story">ストーリーテリング</option>
                <option value="casual">カジュアル</option>
                <option value="expert">業界専門家</option>
              </select>
            </div>
            <div>
              <div style={fieldLabelStyle}>カテゴリ</div>
              <div style={{display:'flex',flexWrap:'wrap',gap:5}}>
                {CATS.map(c => (
                  <div key={c} onClick={() => toggleCategory(c)}
                    style={{padding:'3px 9px',borderRadius:20,fontSize:11,fontWeight:500,border:`1.5px solid ${categories.includes(c)?'#2563EB':'#E5E3DC'}`,background:categories.includes(c)?'#2563EB':'#fff',color:categories.includes(c)?'#fff':'#6B6760',cursor:'pointer',transition:'all 0.15s'}}>
                    {c}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div style={{height:1,background:'#E5E3DC'}}/>

          {/* Layout toggles */}
          <div>
            <div style={labelStyle}>レイアウト</div>
            {[
              ['eyecatch','アイキャッチ画像'],['toc','目次を自動生成'],
              ['summary','まとめセクション'],['bullets','箇条書きに変換'],['cta','CTAボタン追加'],
            ].map(([key, label]) => (
              <div key={key} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'6px 0',borderBottom:'1px solid #F0EFEc'}}>
                <span style={{fontSize:11,color:'#6B6760',fontWeight:500}}>{label}</span>
                <div onClick={() => setToggles(p=>({...p,[key]:!p[key]}))}
                  style={{width:28,height:16,background:toggles[key]?'#2563EB':'#D4D0C8',borderRadius:8,position:'relative',cursor:'pointer',transition:'background 0.2s',flexShrink:0}}>
                  <div style={{position:'absolute',top:3,left:toggles[key]?11:3,width:10,height:10,background:'white',borderRadius:'50%',transition:'left 0.2s'}}/>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── MAIN ── */}
        <div style={{overflowY:'auto',padding:24,display:'flex',flexDirection:'column',gap:14}}>

          {/* Hero input */}
          <div style={{background:'#fff',border:'1.5px solid #E5E3DC',borderRadius:16,padding:18,boxShadow:'0 1px 3px rgba(0,0,0,0.06)'}}>
            <div style={{fontSize:10,fontWeight:600,letterSpacing:'0.06em',textTransform:'uppercase',color:'#9B9892',marginBottom:8}}>テーマ・キーワードを入力</div>
            <textarea value={topic} onChange={e => setTopic(e.target.value)}
              placeholder="例：ECサイトで売上を伸ばす方法、秋のファッショントレンド..."
              style={{width:'100%',border:'none',outline:'none',fontSize:17,fontFamily:'DM Sans',color:'#1A1916',background:'none',resize:'none',lineHeight:1.5,minHeight:52}}
              rows={3}/>
            <div style={{display:'flex',gap:5,flexWrap:'wrap',marginTop:6}}>
              {['ECサイト運営','商品レビュー','Shopify活用','マーケティング','ブランディング'].map(kw => (
                <span key={kw} onClick={() => setTopic(p => p ? p+'、'+kw : kw)}
                  style={{padding:'3px 9px',background:'#F0EFEc',borderRadius:4,fontSize:11,color:'#6B6760',fontWeight:500,cursor:'pointer',border:'1px solid #E5E3DC'}}>
                  + {kw}
                </span>
              ))}
            </div>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginTop:14,paddingTop:14,borderTop:'1px solid #E5E3DC',gap:10}}>
              <div style={{display:'flex',gap:5,flexWrap:'wrap'}}>
                {[
                  ['💡 商品ページ改善','ECサイトで購買率を高める商品ページの作り方'],
                  ['📱 SNS戦略','Shopifyで売れるブランドを作るためのSNS戦略'],
                  ['📧 リピーター施策','リピーター獲得のためのメール施策完全ガイド'],
                ].map(([label, val]) => (
                  <button key={label} onClick={() => setTopic(val)}
                    style={{padding:'3px 10px',borderRadius:4,fontSize:11,fontWeight:500,background:'#F0EFEc',color:'#6B6760',cursor:'pointer',border:'none',fontFamily:'DM Sans'}}>
                    {label}
                  </button>
                ))}
              </div>
              <button onClick={generate} disabled={generating}
                style={{display:'flex',alignItems:'center',gap:7,padding:'9px 20px',background:generating?'#93C5FD':'#2563EB',color:'white',border:'none',borderRadius:10,fontSize:13,fontWeight:600,fontFamily:'DM Sans',cursor:generating?'not-allowed':'pointer',whiteSpace:'nowrap',transition:'all 0.15s'}}>
                {generating ? (
                  <><span style={spinnerStyle}/> 生成中...</>
                ) : '✦ 生成する'}
              </button>
            </div>
          </div>

          {/* Progress */}
          {generating && (
            <div style={{background:'#fff',border:'1.5px solid #E5E3DC',borderRadius:16,padding:'14px 18px'}}>
              <div style={{display:'flex'}}>
                {STEPS.map((s, i) => (
                  <div key={s} style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',gap:5,position:'relative'}}>
                    {i < STEPS.length - 1 && <div style={{position:'absolute',top:10,left:'50%',right:'-50%',height:2,background:progress>i+1?'#16A34A':'#E5E3DC',zIndex:0,transition:'background 0.5s'}}/>}
                    <div style={{width:20,height:20,borderRadius:'50%',background:progress>i?'#16A34A':progress===i+1?'#2563EB':'#fff',border:`2px solid ${progress>i?'#16A34A':progress===i+1?'#2563EB':'#D4D0C8'}`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:9,fontWeight:600,color:progress>i||progress===i+1?'white':'#9B9892',position:'relative',zIndex:1,transition:'all 0.3s'}}>
                      {progress > i ? '✓' : i+1}
                    </div>
                    <div style={{fontSize:9,color:progress>=i+1?'#6B6760':'#9B9892',fontWeight:500,textAlign:'center'}}>{s}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Publish result */}
          {publishResult && (
            <div style={{padding:'12px 16px',borderRadius:10,background:publishResult.success?'#F0FDF4':'#FEF2F2',border:`1px solid ${publishResult.success?'#BBF7D0':'#FECACA'}`,color:publishResult.success?'#16A34A':'#DC2626',display:'flex',gap:10,alignItems:'flex-start',animation:'fadeUp 0.3s ease'}}>
              <span style={{fontSize:16}}>{publishResult.success?'✓':'❌'}</span>
              <div>
                <div style={{fontWeight:600,fontSize:13}}>{publishResult.message}</div>
                {publishResult.adminUrl && (
                  <a href={publishResult.adminUrl} target="_blank" rel="noreferrer"
                    style={{fontSize:11,color:'inherit',fontWeight:600}}>管理画面で確認 →</a>
                )}
              </div>
            </div>
          )}

          {/* Article preview */}
          {generatedHTML ? (
            <div style={{background:'#fff',border:'1.5px solid #E5E3DC',borderRadius:16,overflow:'hidden',boxShadow:'0 1px 3px rgba(0,0,0,0.06)'}}>
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'10px 16px',borderBottom:'1px solid #E5E3DC',background:'#F0EFEc'}}>
                <span style={{fontSize:10,fontWeight:600,color:'#9B9892',letterSpacing:'0.05em',textTransform:'uppercase'}}>プレビュー</span>
                <div style={{display:'flex',gap:5,flexWrap:'wrap'}}>
                  <button onClick={copyHTML} style={btnSmStyle}>HTMLコピー</button>
                  <button onClick={() => setEditMode(p=>!p)} style={{...btnSmStyle,background:editMode?'#EEF3FD':'white',borderColor:editMode?'#2563EB':'#E5E3DC',color:editMode?'#2563EB':'#6B6760'}}>
                    ✏ {editMode?'編集中':'編集'}
                  </button>
                  {(platform==='shopify'||platform==='both') && (
                    <button onClick={publishToShopify} disabled={publishing||!connected}
                      style={{...btnSmStyle,background:'#F0F6E4',borderColor:'#5C8E00',color:'#3d5f00',fontWeight:600,opacity:(!connected)?0.5:1,cursor:(!connected)?'not-allowed':'pointer'}}>
                      {publishing ? <><span style={spinnerStyle}/> 投稿中...</> : '🛍 Shopifyへ投稿'}
                    </button>
                  )}
                  {(platform==='note'||platform==='both') && (
                    <button style={{...btnSmStyle,background:'#E8F8F5',borderColor:'#41C9B4',color:'#1a7066',fontWeight:600}}>📝 noteへ投稿</button>
                  )}
                </div>
              </div>
              <div style={{padding:'28px 36px',maxHeight:480,overflowY:'auto'}}>
                <div
                  ref={previewRef}
                  contentEditable={editMode}
                  suppressContentEditableWarning
                  style={{outline:editMode?'2px solid #2563EB':'none',borderRadius:editMode?4:0,padding:editMode?4:0}}
                  dangerouslySetInnerHTML={{__html: generatedHTML}}
                />
              </div>
              <div style={{display:'flex',alignItems:'center',gap:10,padding:'8px 16px',borderTop:'1px solid #E5E3DC',background:'#F0EFEc'}}>
                <span style={{fontSize:10,color:'#9B9892'}}>文字数</span>
                <div style={{flex:1,height:3,background:'#E5E3DC',borderRadius:2,overflow:'hidden'}}>
                  <div style={{height:'100%',background:'#2563EB',borderRadius:2,width:`${Math.min(100,(generatedHTML.replace(/<[^>]+>/g,'').length/wordCount)*100)}%`,transition:'width 1s ease'}}/>
                </div>
                <span style={{fontSize:10,fontWeight:600,color:'#6B6760',fontFamily:'DM Mono'}}>
                  {generatedHTML.replace(/<[^>]+>/g,'').length.toLocaleString()} / {wordCount.toLocaleString()}
                </span>
              </div>
            </div>
          ) : !generating && (
            <div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'60px 20px',textAlign:'center',color:'#9B9892',gap:8}}>
              <div style={{fontSize:32,opacity:0.4}}>✦</div>
              <div style={{fontSize:13,fontWeight:500,color:'#6B6760'}}>テーマを入力して記事を生成</div>
              <div style={{fontSize:11,lineHeight:1.6}}>プロライターレベルの文章をAIが自動で作成します</div>
            </div>
          )}
        </div>

        {/* ── RIGHT PANEL ── */}
        <div style={{background:'#fff',borderLeft:'1px solid #E5E3DC',overflowY:'auto',padding:18,display:'flex',flexDirection:'column',gap:16}}>

          {/* Shopify connection */}
          <div>
            <div style={labelStyle}>Shopify 接続設定</div>
            <div style={{border:'1.5px solid #5C8E00',borderRadius:10,overflow:'hidden'}}>
              <div style={{background:'#5C8E00',padding:'9px 13px',display:'flex',alignItems:'center',gap:8}}>
                <span style={{color:'white',fontSize:13,fontWeight:600}}>🛍️ Admin API 連携</span>
                {connected && <span style={{marginLeft:'auto',background:'rgba(255,255,255,0.2)',color:'white',fontSize:10,fontWeight:600,padding:'2px 8px',borderRadius:20}}>✓ 接続済み</span>}
              </div>
              <div style={{padding:13,display:'flex',flexDirection:'column',gap:10}}>
                <div style={{background:'#EEF3FD',border:'1px solid #BFDBFE',borderRadius:8,padding:'8px 11px',fontSize:10,color:'#2563EB',lineHeight:1.6}}>
                  ℹ️ Shopify Dev Dashboard → バージョン → スコープに <strong>write_content</strong> / <strong>read_content</strong> を追加してインストールすると トークンが発行されます
                </div>
                <ShopifyField label="ストアドメイン">
                  <input value={shopifyDomain} onChange={e=>setShopifyDomain(e.target.value)}
                    placeholder="yourstore.myshopify.com" style={monoInputStyle}/>
                </ShopifyField>
                <ShopifyField label="Admin API アクセストークン">
                  <input type="password" value={shopifyToken} onChange={e=>setShopifyToken(e.target.value)}
                    placeholder="shpat_xxxxxxxxxxxx" style={monoInputStyle}/>
                </ShopifyField>
                <ShopifyField label="APIバージョン">
                  <select value={apiVersion} onChange={e=>setApiVersion(e.target.value)} style={{...monoInputStyle,fontFamily:'DM Sans'}}>
                    <option value="2025-01">2025-01（最新）</option>
                    <option value="2024-10">2024-10</option>
                    <option value="2024-07">2024-07</option>
                  </select>
                </ShopifyField>
                <button onClick={connectShopify} disabled={connecting||!shopifyDomain||!shopifyToken}
                  style={{padding:'8px 14px',background:connected?'#16A34A':connecting?'#9CA3AF':'#5C8E00',color:'white',border:'none',borderRadius:8,fontSize:12,fontWeight:600,fontFamily:'DM Sans',cursor:connecting||!shopifyDomain||!shopifyToken?'not-allowed':'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:6,transition:'background 0.15s'}}>
                  {connecting ? <><span style={spinnerStyle}/>接続中...</> : connected ? '✓ 再接続' : '接続して確認'}
                </button>
                {connError && <div style={{background:'#FEF2F2',border:'1px solid #FECACA',borderRadius:8,padding:'8px 11px',fontSize:11,color:'#DC2626'}}>{connError}</div>}

                {/* Blog list */}
                {connected && blogs.length > 0 && (
                  <div>
                    <div style={{fontSize:11,fontWeight:600,color:'#6B6760',marginBottom:6}}>投稿先ブログ</div>
                    {blogs.map(b => (
                      <div key={b.id} onClick={() => setSelectedBlog(b)}
                        style={{display:'flex',alignItems:'center',gap:8,padding:'8px 10px',background:selectedBlog?.id===b.id?'#F0F6E4':'white',border:`1.5px solid ${selectedBlog?.id===b.id?'#5C8E00':'#E5E3DC'}`,borderRadius:7,cursor:'pointer',marginBottom:5,transition:'all 0.15s'}}>
                        <div style={{width:12,height:12,borderRadius:'50%',border:`2px solid ${selectedBlog?.id===b.id?'#5C8E00':'#D4D0C8'}`,background:selectedBlog?.id===b.id?'#5C8E00':'transparent',flexShrink:0}}/>
                        <div style={{flex:1}}>
                          <div style={{fontSize:12,fontWeight:500}}>{b.title}</div>
                          <div style={{fontSize:10,fontFamily:'DM Mono',color:'#9B9892'}}>ID: {b.id}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Publish settings */}
                {connected && selectedBlog && (
                  <>
                    <ShopifyField label="公開ステータス">
                      <select value={publishMode} onChange={e=>setPublishMode(e.target.value)} style={{...monoInputStyle,fontFamily:'DM Sans'}}>
                        <option value="draft">下書きとして保存</option>
                        <option value="published">即時公開</option>
                      </select>
                    </ShopifyField>
                    <ShopifyField label="著者名（任意）">
                      <input value={author} onChange={e=>setAuthor(e.target.value)}
                        placeholder="例：ブログ編集部" style={{...monoInputStyle,fontFamily:'DM Sans'}}/>
                    </ShopifyField>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Image settings */}
          <div>
            <div style={labelStyle}>画像設定</div>
            <div style={{background:'#F7F6F3',border:'1px solid #E5E3DC',borderRadius:10,padding:13}}>
              <div style={{fontSize:11,fontWeight:500,color:'#6B6760',marginBottom:7}}>画像サイズ</div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:5,marginBottom:10}}>
                {IMG_SIZES.map(s => (
                  <div key={s.sub} onClick={() => setImgSize(s.sub)}
                    style={{padding:'6px 4px',borderRadius:6,border:`1.5px solid ${imgSize===s.sub?'#2563EB':'#E5E3DC'}`,background:imgSize===s.sub?'#EEF3FD':'white',cursor:'pointer',textAlign:'center',fontSize:10,fontWeight:500,color:imgSize===s.sub?'#2563EB':'#6B6760',transition:'all 0.15s'}}>
                    {s.label}
                    <span style={{display:'block',fontSize:9,fontFamily:'DM Mono',color:'#9B9892',marginTop:1}}>{s.sub}</span>
                  </div>
                ))}
              </div>
              <div style={{fontSize:11,fontWeight:500,color:'#6B6760',marginBottom:5}}>画像ソース</div>
              <select style={{width:'100%',border:'1.5px solid #E5E3DC',borderRadius:8,padding:'6px 9px',fontSize:11,background:'white',fontFamily:'DM Sans',outline:'none',color:'#1A1916'}}>
                <option>Unsplash（無料・高品質）</option>
                <option>Pexels（無料）</option>
                <option>独自アップロード</option>
              </select>
            </div>
          </div>

          {/* Links */}
          <div>
            <div style={labelStyle}>内部リンク挿入</div>
            <div style={{background:'#F7F6F3',border:'1px solid #E5E3DC',borderRadius:10,padding:13}}>
              {links.map((l, i) => (
                <div key={i} style={{display:'flex',alignItems:'center',gap:7,padding:'6px 9px',background:'white',border:'1px solid #E5E3DC',borderRadius:6,marginBottom:5}}>
                  <span style={{fontSize:12}}>🔗</span>
                  <span style={{fontSize:10,fontFamily:'DM Mono',color:'#6B6760',flex:1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{l}</span>
                  <button onClick={() => setLinks(p=>p.filter((_,j)=>j!==i))} style={{color:'#9B9892',cursor:'pointer',fontSize:11,border:'none',background:'none',padding:2}}>✕</button>
                </div>
              ))}
              <div style={{display:'flex',gap:5}}>
                <input value={newLink} onChange={e=>setNewLink(e.target.value)}
                  onKeyDown={e=>e.key==='Enter'&&addLink()}
                  placeholder="URLを追加..."
                  style={{flex:1,border:'1.5px solid #E5E3DC',borderRadius:6,padding:'6px 9px',fontSize:11,fontFamily:'DM Mono',outline:'none',color:'#1A1916',background:'white'}}/>
                <button onClick={addLink} style={{padding:'6px 11px',borderRadius:6,background:'#2563EB',color:'white',border:'none',cursor:'pointer',fontSize:12,fontFamily:'DM Sans',fontWeight:500}}>追加</button>
              </div>
            </div>
          </div>

          {/* Format toggles */}
          <div>
            <div style={labelStyle}>フォーマット</div>
            <div style={{background:'#F7F6F3',border:'1px solid #E5E3DC',borderRadius:10,padding:13}}>
              {[['h2divider','H2前に区切り線'],['bold','強調テキスト（太字）'],['seo','SEOメタ自動生成']].map(([key,label])=>(
                <div key={key} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'6px 0',borderBottom:'1px solid #E5E3DC'}}>
                  <span style={{fontSize:11,color:'#6B6760',fontWeight:500}}>{label}</span>
                  <div onClick={()=>setToggles(p=>({...p,[key]:!p[key]}))}
                    style={{width:28,height:16,background:toggles[key]?'#2563EB':'#D4D0C8',borderRadius:8,position:'relative',cursor:'pointer',transition:'background 0.2s',flexShrink:0}}>
                    <div style={{position:'absolute',top:3,left:toggles[key]?11:3,width:10,height:10,background:'white',borderRadius:'50%',transition:'left 0.2s'}}/>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div style={{position:'fixed',bottom:20,right:20,background:'#1A1916',color:'white',padding:'9px 16px',borderRadius:8,fontSize:12,fontWeight:500,zIndex:9999,maxWidth:280,animation:'fadeUp 0.25s ease'}}>
          {toast}
        </div>
      )}

      <style>{`
        @keyframes fadeUp{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
        @keyframes spin{to{transform:rotate(360deg)}}
        .preview-content h1{font-size:22px;font-weight:600;margin-bottom:10px;letter-spacing:-0.02em;line-height:1.3}
        .preview-content h2{font-size:17px;font-weight:600;margin:22px 0 8px;letter-spacing:-0.01em}
        .preview-content h3{font-size:15px;font-weight:600;margin:16px 0 6px}
        .preview-content p{margin-bottom:12px;line-height:1.8}
        .preview-content ul,.preview-content ol{padding-left:20px;margin-bottom:12px}
        .preview-content li{margin-bottom:4px;line-height:1.7}
        .preview-content a{color:#2563EB;text-decoration:none}
        .preview-content strong{font-weight:600}
      `}</style>
    </>
  );
}

// ─── SUB COMPONENTS ───
function ShopifyField({ label, children }) {
  return (
    <div>
      <div style={{fontSize:11,fontWeight:600,color:'#6B6760',marginBottom:4}}>{label}</div>
      {children}
    </div>
  );
}

// ─── STYLES ───
const labelStyle = { fontSize:10, fontWeight:600, letterSpacing:'0.08em', textTransform:'uppercase', color:'#9B9892', marginBottom:8 };
const fieldLabelStyle = { fontSize:11, fontWeight:500, color:'#6B6760', marginBottom:5 };
const selectStyle = { width:'100%', border:'1.5px solid #E5E3DC', borderRadius:8, padding:'7px 9px', fontSize:12, fontFamily:'DM Sans', outline:'none', color:'#1A1916', background:'#F7F6F3' };
const monoInputStyle = { width:'100%', border:'1.5px solid #E5E3DC', borderRadius:8, padding:'7px 10px', fontSize:12, fontFamily:'DM Mono', outline:'none', color:'#1A1916', background:'#F7F6F3' };
const btnSmStyle = { padding:'5px 11px', borderRadius:6, fontSize:11, fontWeight:500, fontFamily:'DM Sans', cursor:'pointer', border:'1.5px solid #E5E3DC', background:'white', color:'#6B6760', transition:'all 0.15s' };
const spinnerStyle = { display:'inline-block', width:11, height:11, border:'2px solid rgba(255,255,255,0.4)', borderTopColor:'white', borderRadius:'50%', animation:'spin 0.7s linear infinite', verticalAlign:'middle' };
