# Vimeo視聴完了 Slack通知システム - デプロイメントガイド

## 構成

- **データベース**: Supabase (PostgreSQL)
- **バックエンド**: Railway (Express + tRPC)
- **フロントエンド**: Vercel (React + Vite)
- **通知**: Slack Webhook

---

## 1. Supabaseセットアップ

### 1.1 プロジェクト作成
1. https://supabase.com/ にログイン
2. "New Project" → プロジェクト名・パスワード・リージョン設定
3. "Create new project"

### 1.2 テーブル作成
1. Supabaseダッシュボード → "SQL Editor"
2. `scripts/setup.sql` の内容をコピーして実行

### 1.3 認証設定
1. "Authentication" → "Providers" → "Email" を有効化

### 1.4 環境変数の取得
- **Project Settings → API**:
  - `SUPABASE_URL`: Project URL
  - `SUPABASE_SERVICE_ROLE_KEY`: service_role secret
  - `VITE_SUPABASE_ANON_KEY`: anon public key
- **Project Settings → Database → Connection string (URI)**:
  - `DATABASE_URL`: PostgreSQL接続文字列

---

## 2. Slack Webhook作成

1. https://api.slack.com/apps → "Create New App" → "From scratch"
2. "Incoming Webhooks" → 有効化
3. "Add New Webhook to Workspace" → 通知先チャンネルを選択
4. Webhook URLをコピー → `SLACK_WEBHOOK_URL`

---

## 3. Railwayデプロイ（バックエンド）

### 3.1 環境変数設定

```
DATABASE_URL=postgresql://postgres.[ref]:[password]@aws-0-xxx.pooler.supabase.com:6543/postgres
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/xxx/xxx/xxx
NODE_ENV=production
PORT=3000
```

### 3.2 デプロイ
1. GitHubリポジトリを接続
2. 環境変数を設定
3. デプロイ → URLを取得

---

## 4. Vercelデプロイ（フロントエンド）

### 4.1 環境変数設定

```
VITE_API_URL=https://[Railway URL]
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

### 4.2 ビルド設定
- Framework: Vite
- Build Command: `npm run build:client`
- Output Directory: `dist/client`

---

## 5. 初期設定

### 5.1 管理者アカウント作成
1. Vercel URLにアクセス
2. メールアドレスでサインアップ
3. メール認証完了

### 5.2 動画登録
1. ログイン → "動画管理"
2. Vimeo Video ID・タイトル・通知メッセージを入力

### 5.3 視聴者への共有
視聴URLを共有: `https://[Vercelドメイン]/watch/[VideoID]`

---

## 6. 動作フロー

1. 視聴者がURLにアクセス → 名前入力
2. Vimeo動画を再生
3. 視聴完了 → Slackに自動通知
4. 管理画面で視聴状況を確認
