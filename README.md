# BlogCraft AI — セットアップガイド

## 必要なもの
- GitHubアカウント（無料）
- Vercelアカウント（無料） → https://vercel.com
- Anthropic APIキー → https://console.anthropic.com

---

## デプロイ手順

### 1. GitHubにアップロード
1. GitHub.com で新しいリポジトリを作成（例：`blogcraft-ai`）
2. このフォルダの中身を全部アップロード

### 2. Vercelにデプロイ
1. https://vercel.com にログイン
2. 「New Project」→ GitHubのリポジトリを選択
3. 「Environment Variables」に以下を追加：
   - Key: `ANTHROPIC_API_KEY`
   - Value: `sk-ant-xxxxxx`（あなたのAPIキー）
4. 「Deploy」をクリック

### 3. URLが発行される
`https://blogcraft-ai-xxxx.vercel.app` のようなURLが発行され、
誰でもアクセスできます。

---

## Shopify接続方法

### Dev Dashboardでトークンを取得する手順

1. https://partners.shopify.com でDev Dashboardを開く
2. 「blog」アプリ → 「バージョン」→「blog-1」を開く
3. 「設定を編集」または「新しいバージョンを作成」をクリック
4. スコープに以下を追加：
   - `write_content`
   - `read_content`
   - `write_publications`
   - `read_publications`
5. 「アプリをインストール」→ ストアを選択
6. インストール後に表示されるトークン（`shpat_...`）をコピー

### BlogCraft AIに入力
- ストアドメイン：`nicopuff.myshopify.com`
- トークン：上記でコピーしたもの
- 「接続して確認」をクリック

---

## ローカルで試す場合

```bash
# 依存関係インストール
npm install

# .env.local を作成してAPIキーを入れる
cp .env.example .env.local
# .env.local を編集してAPIキーを入力

# 起動
npm run dev

# http://localhost:3000 で開く
```

---

## 将来のShopify公式アプリ化について

このコードはShopify公式アプリ（OAuth対応）への移行を見越した構造で作られています。
`pages/api/shopify/` 以下のAPIルートを拡張することで対応できます。
