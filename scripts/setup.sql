-- Vimeo視聴完了 Slack通知システム
-- Supabase SQL Editor で実行してください

-- Enum types
DO $$ BEGIN
  CREATE TYPE notification_status AS ENUM ('success', 'failed');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE event_type AS ENUM ('play', 'pause', 'timeupdate', 'ended', 'seeked');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Vimeo動画テーブル
CREATE TABLE IF NOT EXISTS vimeo_videos (
  id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  video_id VARCHAR(64) NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT,
  notification_message TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 通知履歴テーブル
CREATE TABLE IF NOT EXISTS notification_history (
  id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  video_id VARCHAR(64) NOT NULL,
  video_title TEXT,
  viewer_name TEXT NOT NULL,
  message TEXT NOT NULL,
  status notification_status NOT NULL,
  error_message TEXT,
  sent_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 視聴イベントテーブル
CREATE TABLE IF NOT EXISTS viewing_events (
  id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  viewer_name TEXT,
  session_id VARCHAR(64) NOT NULL,
  video_id VARCHAR(64) NOT NULL,
  event_type event_type NOT NULL,
  current_time INTEGER NOT NULL,
  duration INTEGER NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- インデックス
CREATE INDEX IF NOT EXISTS idx_vimeo_videos_video_id ON vimeo_videos(video_id);
CREATE INDEX IF NOT EXISTS idx_notification_history_video_id ON notification_history(video_id);
CREATE INDEX IF NOT EXISTS idx_viewing_events_video_id ON viewing_events(video_id);
CREATE INDEX IF NOT EXISTS idx_viewing_events_session_id ON viewing_events(session_id);
CREATE INDEX IF NOT EXISTS idx_viewing_events_viewer_name ON viewing_events(viewer_name);
