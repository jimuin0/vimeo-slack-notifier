import { eq, desc, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import {
  vimeoVideos,
  notificationHistory,
  viewingEvents,
  type InsertViewingEvent,
} from "../drizzle/schema";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      const client = postgres(process.env.DATABASE_URL);
      _db = drizzle(client);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// Vimeo Videos
export async function getAllVimeoVideos() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(vimeoVideos).orderBy(desc(vimeoVideos.createdAt));
}

export async function addVimeoVideo(data: {
  videoId: string;
  title: string;
  notificationMessage: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(vimeoVideos).values(data);
}

export async function updateVimeoVideo(id: number, data: Partial<{
  title: string;
  notificationMessage: string;
  isActive: boolean;
}>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(vimeoVideos).set({ ...data, updatedAt: new Date() }).where(eq(vimeoVideos.id, id));
}

export async function deleteVimeoVideo(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(vimeoVideos).where(eq(vimeoVideos.id, id));
}

export async function getVimeoVideoByVideoId(videoId: string) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(vimeoVideos).where(eq(vimeoVideos.videoId, videoId)).limit(1);
  return result.length > 0 ? result[0] : null;
}

// Notification History
export async function addNotificationHistory(data: {
  videoId: string;
  videoTitle?: string;
  viewerName: string;
  message: string;
  success: boolean;
  errorMessage?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(notificationHistory).values({
    videoId: data.videoId,
    videoTitle: data.videoTitle,
    viewerName: data.viewerName,
    message: data.message,
    status: data.success ? 'success' : 'failed',
    errorMessage: data.errorMessage,
  });
}

export async function getNotificationHistory(limit: number = 100) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(notificationHistory).orderBy(desc(notificationHistory.sentAt)).limit(limit);
}

// Viewing Events
export async function recordViewingEvent(event: InsertViewingEvent) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(viewingEvents).values(event);
}

export async function getAllVideoStats() {
  const db = await getDb();
  if (!db) return [];
  const result: any = await db.execute(sql`
    SELECT 
      ve.video_id, vv.title as video_title,
      COUNT(DISTINCT ve.session_id) as total_views,
      COUNT(DISTINCT CASE WHEN ve.event_type = 'ended' THEN ve.session_id END) as completed_views
    FROM viewing_events ve
    LEFT JOIN vimeo_videos vv ON ve.video_id = vv.video_id
    GROUP BY ve.video_id, vv.title ORDER BY total_views DESC
  `);
  return (result.rows || []).map((row: any) => ({
    videoId: row.video_id,
    videoTitle: row.video_title || '不明な動画',
    totalViews: Number(row.total_views),
    completedViews: Number(row.completed_views),
    completionRate: row.total_views > 0 ? (Number(row.completed_views) / Number(row.total_views)) * 100 : 0,
  }));
}

export async function getAllUserStats() {
  const db = await getDb();
  if (!db) return [];
  const result: any = await db.execute(sql`
    SELECT 
      session_id,
      viewer_name,
      COUNT(DISTINCT video_id) as total_videos_watched,
      COUNT(DISTINCT CASE WHEN event_type = 'ended' THEN video_id END) as completed_videos
    FROM viewing_events GROUP BY session_id, viewer_name ORDER BY MAX(created_at) DESC
  `);
  return (result.rows || []).map((row: any) => {
    const totalVideosWatched = Number(row.total_videos_watched);
    const completedVideos = Number(row.completed_videos);
    return {
      sessionId: row.session_id,
      viewerName: row.viewer_name || '不明',
      totalVideosWatched,
      completedVideos,
      completionRate: totalVideosWatched > 0 ? (completedVideos / totalVideosWatched) * 100 : 0,
    };
  });
}
