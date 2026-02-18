# 📋 動画視聴管理システム - 完全マニュアル v1.0

**最終更新**: 2026年2月18日 14:30 JST  
**バージョン**: 1.0  
**作成者**: Claude + 神原 良祐

> ⚠️ v1.0: Vimeo→YouTube切替対応。Railway障害によるビルド遅延あり。フロントエンドはVercel、バックエンドはRailway、DBはSupabase構成。

---

## 📖 変更履歴

| バージョン | 日付 | 変更内容 |
|-----------|------|----------|
| v1.0 | 2026/02/18 | 初版作成。Vimeo→YouTube Player API切替、Vercel SPA routing修正、Manus CSSテーマ適用、Railwayデプロイ完了、DB schema整合性修正（description削除） |

---

## 📖 目次

1. [システム概要](#1-システム概要)
2. [インフラ構成](#2-インフラ構成)
3. [ファイル構成](#3-ファイル構成)
4. [データベース設計](#4-データベース設計)
5. [機能一覧](#5-機能一覧)
6. [動画登録〜視聴〜Slack通知フロー](#6-動画登録視聴slack通知フロー)
7. [環境変数一覧](#7-環境変数一覧)
8. [デプロイ手順](#8-デプロイ手順)
9. [運用・確認コマンド](#9-運用確認コマンド)
10. [トラブルシューティング](#10-トラブルシューティング)
11. [未完了タスク・残課題](#11-未完了タスク残課題)
12. [関連リンク](#12-関連リンク)

---

## 1. システム概要

スタッフや外部パートナーにYouTube動画を視聴させ、**誰が・いつ・どこまで視聴したか**を追跡し、視聴完了時にSlackへ自動通知するシステム。

### 1.1 全体アーキテクチャ

```
┌──────────────────────────────────────────────────────────────────┐
│                 動画視聴管理システム                               │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  【管理者フロー】                                                 │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐                   │
│  │  管理画面 │───▶│  Vercel  │───▶│ Railway  │                   │
│  │ (ブラウザ)│    │ (React)  │    │ (API)    │                   │
│  └──────────┘    └──────────┘    └────┬─────┘                   │
│                                       │                          │
│                                       ▼                          │
│                                 ┌──────────┐                     │
│                                 │ Supabase │                     │
│                                 │(PostgreSQL)│                   │
│                                 └──────────┘                     │
│                                       │                          │
│  【視聴者フロー】                      │                          │
│  ┌──────────┐    ┌──────────┐    ┌────┴─────┐    ┌──────────┐  │
│  │  視聴者  │───▶│ 名前入力 │───▶│ YouTube  │───▶│  Slack   │  │
│  │ (スマホ) │    │  ページ  │    │ Player   │    │  通知    │  │
│  └──────────┘    └──────────┘    └──────────┘    └──────────┘  │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

### 1.2 利用シーン

| シーン | 説明 |
|-------|------|
| スタッフ研修 | 新入社員に研修動画を視聴させ、完了をSlackで確認 |
| 他社向け教育 | パートナー企業に教育動画を配布、視聴率を管理画面で追跡 |
| 社内周知 | 全社通達を動画で配信、未視聴者を把握 |

---

## 2. インフラ構成

### 2.1 全体構成

| サービス | 役割 | URL |
|---------|------|-----|
| Vercel | フロントエンド（React/TypeScript） | https://vimeo-slack-notifier.vercel.app |
| Railway | バックエンド（Node.js/Express/tRPC） | https://vimeo-slack-notifier-production.up.railway.app |
| Supabase | データベース（PostgreSQL）＋認証 | https://apxyqumnnhnbfhrzjusy.supabase.co |
| Slack | Webhook通知 | Incoming Webhook |
| YouTube | 動画配信（限定公開） | YouTube IFrame Player API |

### 2.2 Vercel（フロントエンド）

| 項目 | 値 |
|------|-----|
| プロジェクト名 | vimeo-slack-notifier |
| フレームワーク | Vite + React + TypeScript |
| ビルドコマンド | `npx vite build` |
| 出力ディレクトリ | `dist/client` |
| SPAルーティング | `vercel.json` の rewrites で `/(.*)` → `/` |
| デプロイ方式 | GitHub main push で自動デプロイ |

### 2.3 Railway（バックエンド）

| 項目 | 値 |
|------|-----|
| サービス名 | vimeo-slack-notifier |
| ランタイム | Node.js（Nixpacks） |
| ビルドコマンド | `npm run build:server`（esbuild） |
| 起動コマンド | `npm start`（`NODE_ENV=production node dist/index.js`） |
| デプロイ方式 | GitHub main push で自動デプロイ |
| 設定ファイル | `railway.toml` |

### 2.4 Supabase（データベース＋認証）

| 項目 | 値 |
|------|-----|
| プロジェクトID | apxyqumnnhnbfhrzjusy |
| URL | https://apxyqumnnhnbfhrzjusy.supabase.co |
| 認証方式 | Supabase Auth（Email/Password） |
| DBアクセス | service_role キーで直接アクセス |

---

## 3. ファイル構成

```
~/Projects/vimeo-slack-notifier-main/
├── client/                          # フロントエンド
│   ├── src/
│   │   ├── App.tsx                  # メインルーティング・レイアウト
│   │   ├── main.tsx                 # tRPC Provider・認証ヘッダー設定
│   │   ├── index.css                # Manus CSSテーマ
│   │   ├── lib/
│   │   │   ├── trpc.ts              # tRPCクライアント
│   │   │   └── supabase.ts          # Supabaseクライアント
│   │   └── pages/
│   │       ├── Login.tsx            # ログイン/サインアップ
│   │       ├── Home.tsx             # ダッシュボード
│   │       ├── VimeoVideos.tsx      # 動画管理（CRUD）
│   │       ├── WatchVideo.tsx       # ★視聴者ページ（YouTube Player API）
│   │       ├── NotificationHistory.tsx  # 通知履歴
│   │       └── ViewingAnalytics.tsx     # 視聴分析
│   └── index.html                   # エントリーHTML
├── server/                          # バックエンド
│   ├── index.ts                     # Express + CORS + tRPC
│   ├── routers.ts                   # tRPCルーター定義
│   ├── trpc.ts                      # tRPC初期化（public/protected）
│   ├── context.ts                   # リクエストコンテキスト（認証）
│   ├── db.ts                        # DB操作（Drizzle ORM）
│   ├── slack.ts                     # Slack Webhook送信
│   └── supabase.ts                  # Supabase認証（トークン検証）
├── drizzle/
│   └── schema.ts                    # DBスキーマ定義
├── vercel.json                      # Vercel設定（SPA rewrites）
├── railway.toml                     # Railway設定（build/start）
├── vite.config.ts                   # Viteビルド設定
├── package.json                     # 依存関係・スクリプト
└── tsconfig.json                    # TypeScript設定
```

---

## 4. データベース設計

### 4.1 テーブル一覧

| テーブル | 用途 |
|---------|------|
| `vimeo_videos` | 登録された動画の管理 |
| `notification_history` | Slack通知の送信履歴 |
| `viewing_events` | 視聴イベントの記録（play/pause/timeupdate/ended） |

### 4.2 vimeo_videos

| カラム | 型 | 説明 |
|--------|-----|------|
| id | integer (PK, auto) | ID |
| video_id | varchar(64), unique | YouTube Video ID |
| title | text | 動画タイトル |
| description | text (nullable) | 説明（現在未使用、互換性のため残存） |
| notification_message | text | 通知メッセージ |
| is_active | boolean (default: true) | 有効/無効 |
| created_at | timestamp | 作成日時 |
| updated_at | timestamp | 更新日時 |

### 4.3 notification_history

| カラム | 型 | 説明 |
|--------|-----|------|
| id | integer (PK, auto) | ID |
| video_id | varchar(64) | YouTube Video ID |
| video_title | text (nullable) | 動画タイトル |
| viewer_name | text | 視聴者名 |
| message | text | 通知メッセージ |
| status | enum('success','failed') | 送信結果 |
| error_message | text (nullable) | エラー詳細 |
| sent_at | timestamp | 送信日時 |

### 4.4 viewing_events

| カラム | 型 | 説明 |
|--------|-----|------|
| id | integer (PK, auto) | ID |
| viewer_name | text (nullable) | 視聴者名 |
| session_id | varchar(64) | セッションID（UUID） |
| video_id | varchar(64) | YouTube Video ID |
| event_type | enum('play','pause','timeupdate','ended','seeked') | イベント種別 |
| current_time | integer | 再生位置（秒） |
| duration | integer | 動画全体の長さ（秒） |
| created_at | timestamp | 記録日時 |

---

## 5. 機能一覧

### 5.1 管理者機能（認証必須）

| 機能 | ページ | 説明 |
|------|--------|------|
| ログイン | `/` | Supabase Auth（Email/Password） |
| 動画管理 | `/vimeo-videos` | YouTube動画のCRUD（ID・タイトル・通知メッセージ） |
| 通知履歴 | `/notification-history` | Slack通知の送信履歴一覧 |
| 視聴分析 | `/viewing-analytics` | 動画別・ユーザー別の視聴率 |

### 5.2 視聴者機能（認証不要）

| 機能 | URL | 説明 |
|------|-----|------|
| 動画視聴 | `/watch/:videoId` | 名前入力→YouTube動画再生→視聴完了でSlack通知 |

### 5.3 視聴追跡

| イベント | タイミング | 記録内容 |
|---------|-----------|---------|
| play | 再生開始時 | 再生位置・動画長 |
| pause | 一時停止時 | 再生位置・動画長 |
| timeupdate | 10秒ごと | 再生位置・動画長 |
| ended | 再生完了時 | 再生位置・動画長 → Slack通知送信 |

---

## 6. 動画登録〜視聴〜Slack通知フロー

### 6.1 管理者：動画を登録

1. `https://vimeo-slack-notifier.vercel.app` にログイン
2. 「動画管理」→「＋ 新規追加」
3. YouTube Video ID・タイトル・通知メッセージを入力し「保存」
4. 視聴URLが生成される: `https://vimeo-slack-notifier.vercel.app/watch/{videoId}`

### 6.2 視聴者：動画を視聴

1. 管理者から受け取ったURL（`/watch/{videoId}`）にアクセス
2. 名前を入力して「視聴を開始する」をクリック
3. YouTube動画が表示される
4. 視聴中は10秒ごとに再生位置がDBに記録される
5. 動画を最後まで視聴すると「✅ 視聴完了しました」が表示

### 6.3 自動処理：Slack通知

視聴完了時に以下のSlack通知が自動送信される:

```
🎬 視聴完了通知
視聴者: 山田太郎
動画: テスト動画
Video ID: dQw4w9WgXcQ
視聴完了日時: 2026/02/18 14:30
```

---

## 7. 環境変数一覧

### 7.1 Vercel（フロントエンド）

| 変数名 | 説明 | 例 |
|--------|------|-----|
| VITE_API_URL | Railway APIのURL | `https://vimeo-slack-notifier-production.up.railway.app` |
| VITE_SUPABASE_URL | Supabase URL | `https://apxyqumnnhnbfhrzjusy.supabase.co` |
| VITE_SUPABASE_ANON_KEY | Supabase Anon Key | `eyJ...` |

### 7.2 Railway（バックエンド）

| 変数名 | 説明 |
|--------|------|
| DATABASE_URL | Supabase PostgreSQL接続URL |
| SUPABASE_URL | Supabase URL |
| SUPABASE_SERVICE_ROLE_KEY | Supabase Service Role Key |
| SLACK_WEBHOOK_URL | Slack Incoming Webhook URL |
| PORT | サーバーポート（デフォルト: 3000） |
| NODE_ENV | 環境（production） |

---

## 8. デプロイ手順

### 8.1 通常デプロイ（自動）

```bash
cd ~/Projects/vimeo-slack-notifier-main
git add -A
git commit -m "変更内容"
git push
```

- **Vercel**: GitHub push で自動ビルド・デプロイ（約10秒）
- **Railway**: GitHub push で自動ビルド・デプロイ（約2-3分）

### 8.2 Railway手動Redeploy

Railway障害時やビルドが止まった場合:
1. https://railway.app → vimeo-slack-notifier → Deployments
2. 最新デプロイの「⋮」→「Redeploy」

### 8.3 ビルドコマンド

```bash
# フロントエンド（Vite）
npm run build:client    # → dist/client/

# バックエンド（esbuild）
npm run build:server    # → dist/index.js

# 両方
npm run build
```

---

## 9. 運用・確認コマンド

### 9.1 ヘルスチェック

```bash
# Railway API
curl -s "https://vimeo-slack-notifier-production.up.railway.app/health"
# 期待: {"status":"ok"}
```

### 9.2 API動作確認（認証なし）

```bash
# Public: 動画取得テスト
curl -s "https://vimeo-slack-notifier-production.up.railway.app/api/trpc/vimeoVideos.getByVideoId?batch=1&input=%7B%220%22%3A%7B%22json%22%3A%7B%22videoId%22%3A%22test%22%7D%7D%7D"

# Protected: 認証エラー確認（UNAUTHORIZEDが正常）
curl -s "https://vimeo-slack-notifier-production.up.railway.app/api/trpc/vimeoVideos.list"
```

### 9.3 DBテーブル確認（Supabase SQL Editor）

```sql
-- 登録済み動画一覧
SELECT * FROM vimeo_videos ORDER BY created_at DESC;

-- 通知履歴
SELECT * FROM notification_history ORDER BY sent_at DESC LIMIT 20;

-- 視聴イベント
SELECT * FROM viewing_events ORDER BY created_at DESC LIMIT 20;

-- 動画別視聴率
SELECT 
  ve.video_id, vv.title,
  COUNT(DISTINCT ve.session_id) as total_views,
  COUNT(DISTINCT CASE WHEN ve.event_type = 'ended' THEN ve.session_id END) as completed
FROM viewing_events ve
LEFT JOIN vimeo_videos vv ON ve.video_id = vv.video_id
GROUP BY ve.video_id, vv.title;
```

---

## 10. トラブルシューティング

### 10.1 「読み込み中...」で止まる

**原因**: Railway APIとの通信エラー（500 or CORS）

**対処**:
1. ヘルスチェック: `curl https://vimeo-slack-notifier-production.up.railway.app/health`
2. Railwayログ確認: Railway Dashboard → Logs
3. DB接続確認: `DATABASE_URL`環境変数が正しいか

### 10.2 保存ボタンで400/500エラー

**原因**: DBスキーマとコードの不一致

**対処**:
1. Supabase SQL Editorでテーブル構造確認: `SELECT column_name FROM information_schema.columns WHERE table_name = 'vimeo_videos';`
2. drizzle/schema.tsと一致しているか確認
3. 不一致の場合: `ALTER TABLE`でカラム追加/削除

### 10.3 Vercelで404エラー（ページリロード時）

**原因**: SPA routing未設定

**対処**: `vercel.json`に以下を追加:
```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/" }
  ]
}
```

### 10.4 Railwayビルドが止まる

**原因**: Railway障害（`Builds are paused due to an incident`）

**対処**:
1. https://status.railway.com で障害状況確認
2. 障害解消後に空コミットでビルドトリガー: `git commit --allow-empty -m "trigger rebuild" && git push`

### 10.5 Slack通知が届かない

**原因**: SLACK_WEBHOOK_URL未設定 or Webhook無効化

**対処**:
1. Railway Variables → `SLACK_WEBHOOK_URL`が設定されているか確認
2. Slack App設定でWebhookが有効か確認
3. テスト: `curl -X POST {WEBHOOK_URL} -d '{"text":"test"}'`

---

## 11. 未完了タスク・残課題

| 課題 | 優先度 | 詳細 |
|------|--------|------|
| 動画登録テスト | 🔴高 | YouTube動画ID登録→視聴→Slack通知の一連フローテスト未完了 |
| ナビバー表記統一 | 🟡中 | 一部「Vimeo Slack通知」のまま。「動画視聴管理」に変更済みだがVercel再デプロイ待ち |
| UIデザイン改善 | 🟢低 | Manus CSSテーマ適用済みだが、コンポーネント個別のスタイリング余地あり |
| YouTube限定公開設定ガイド | 🟡中 | 管理者向けにYouTubeでの限定公開動画作成手順を作成 |
| Slack Webhook設定ガイド | 🟡中 | 初期セットアップ手順を作成 |
| 視聴率レポート機能 | 🟢低 | 管理画面の視聴分析ページの動作確認 |
| 複数動画の一括管理 | 🟢低 | 動画グループ機能（研修コース等） |

---

## 12. 関連リンク

| リソース | URL |
|---------|-----|
| フロントエンド（本番） | https://vimeo-slack-notifier.vercel.app |
| バックエンドAPI | https://vimeo-slack-notifier-production.up.railway.app |
| GitHub リポジトリ | https://github.com/jimuin0/vimeo-slack-notifier |
| Supabase Dashboard | https://supabase.com/dashboard/project/apxyqumnnhnbfhrzjusy |
| Railway Dashboard | https://railway.app (vimeo-slack-notifier) |
| Vercel Dashboard | https://vercel.com/jimuin/vimeo-slack-notifier |
| YouTube IFrame API | https://developers.google.com/youtube/iframe_api_reference |
| Slack Incoming Webhooks | https://api.slack.com/messaging/webhooks |

---

**最終更新**: 2026年2月18日 14:30 v1.0  
**作成者**: Claude + 神原良祐
