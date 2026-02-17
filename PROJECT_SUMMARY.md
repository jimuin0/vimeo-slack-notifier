# Vimeo視聴完了 Slack通知システム

## 概要
Vimeo動画の視聴完了を検知し、Slack Webhookで自動通知するシステム。

## 技術スタック
- **フロントエンド**: React + Vite + TailwindCSS + tRPC Client
- **バックエンド**: Express + tRPC + Drizzle ORM
- **データベース**: Supabase (PostgreSQL)
- **デプロイ**: Railway (API) + Vercel (フロントエンド)
- **通知**: Slack Incoming Webhook

## テーブル構成
1. **vimeo_videos**: 動画管理（Video ID、タイトル、通知メッセージ）
2. **notification_history**: 通知履歴（動画、視聴者名、ステータス）
3. **viewing_events**: 視聴イベント（再生・一時停止・完了等のログ）

## 環境変数

### Railway（バックエンド）
| 変数名 | 説明 |
|--------|------|
| DATABASE_URL | Supabase PostgreSQL接続文字列 |
| SUPABASE_URL | Supabase Project URL |
| SUPABASE_SERVICE_ROLE_KEY | Supabase Service Role Key |
| SLACK_WEBHOOK_URL | Slack Incoming Webhook URL |
| NODE_ENV | production |
| PORT | 3000 |

### Vercel（フロントエンド）
| 変数名 | 説明 |
|--------|------|
| VITE_API_URL | Railway APIのURL |
| VITE_SUPABASE_URL | Supabase Project URL |
| VITE_SUPABASE_ANON_KEY | Supabase Anon Key |

## 動作フロー
1. 管理者が動画を登録（管理画面）
2. 視聴者にURL共有: `/watch/[VideoID]`
3. 視聴者が名前入力 → 動画再生
4. 視聴完了 → Slackに自動通知
5. 管理画面で視聴状況・通知履歴を確認
