"use strict";(()=>{var e={};e.id=565,e.ids=[565],e.modules={145:e=>{e.exports=require("next/dist/compiled/next-server/pages-api.runtime.prod.js")},6249:(e,t)=>{Object.defineProperty(t,"l",{enumerable:!0,get:function(){return function e(t,n){return n in t?t[n]:"then"in t&&"function"==typeof t.then?t.then(t=>e(t,n)):"function"==typeof t&&"default"===n?t:void 0}}})},6740:(e,t,n)=>{n.r(t),n.d(t,{config:()=>l,default:()=>u,routeModule:()=>d});var r={};n.r(r),n.d(r,{default:()=>s});var o=n(1802),i=n(7153),a=n(6249);async function s(e,t){if("POST"!==e.method)return t.status(405).end();let{topic:n,wordCount:r,style:o,toggles:i,links:a,categories:s,imgSize:u,imgSource:l,format:d}=e.body;if(!n)return t.status(400).json({error:"topic required"});let p=process.env.GEMINI_API_KEY,c=`あなたはプロのブログライターです。以下の条件で日本語のブログ記事をHTML形式で作成してください。

テーマ: ${n}
文字数: 必ず約${r}文字以内に収めること（厳守）。絶対に超えないこと。
スタイル: ${"pro"===o?"プロライター（専門的）":"casual"===o?"カジュアル":"SEO特化"}
カテゴリ: ${s?.join(", ")}

要件:
${i?.toc?"- 目次を冒頭に追加する":""}
${i?.summary?"- まとめセクションを末尾に追加する":""}
${i?.bullets?"- 箇条書きを活用する":""}
${i?.bold?"- 重要キーワードを<strong>で強調する":""}
${i?.seo?"- SEOを意識したキーワード配置にする":""}
${i?.h2divider?"- H2タグの前に<hr>区切り線を入れる":""}
${a?.length>0?`- 以下のURLを自然な形で内部リンクとして挿入する: ${a.join(", ")}`:""}

出力形式:
- 1行目: 記事タイトル（HTMLタグなし）
- 2行目以降: 本文HTML（<h2>,<h3>,<p>,<ul>,<li>,<strong>等を使用）
- \`\`\`などのコードブロックは使わない
- bodyタグやhtmlタグは不要`;try{let e=await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${p}`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({contents:[{parts:[{text:c}]}],generationConfig:{temperature:.7,maxOutputTokens:4096}})}),n=await e.json();if(!e.ok)return t.status(500).json({error:n.error?.message||"Gemini error"});let r=(n.candidates?.[0]?.content?.parts?.[0]?.text||"").split("\n"),o=r[0].replace(/<[^>]*>/g,"").trim(),i=r.slice(1).join("\n").trim();return t.status(200).json({title:o,html:i})}catch(e){return t.status(500).json({error:e.message})}}let u=(0,a.l)(r,"default"),l=(0,a.l)(r,"config"),d=new o.PagesAPIRouteModule({definition:{kind:i.x.PAGES_API,page:"/api/generate",pathname:"/api/generate",bundlePath:"",filename:""},userland:r})},7153:(e,t)=>{var n;Object.defineProperty(t,"x",{enumerable:!0,get:function(){return n}}),function(e){e.PAGES="PAGES",e.PAGES_API="PAGES_API",e.APP_PAGE="APP_PAGE",e.APP_ROUTE="APP_ROUTE"}(n||(n={}))},1802:(e,t,n)=>{e.exports=n(145)}};var t=require("../../webpack-api-runtime.js");t.C(e);var n=t(t.s=6740);module.exports=n})();