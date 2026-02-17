import { integer, pgEnum, pgTable, text, timestamp, varchar, boolean } from "drizzle-orm/pg-core";

/**
 * PostgreSQL (Supabase) Schema
 * Vimeo視聴完了 Slack通知システム
 */

/**
 * Vimeo Videos
 */
export const vimeoVideos = pgTable("vimeo_videos", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  videoId: varchar("video_id", { length: 64 }).notNull().unique(),
  title: text("title").notNull(),
  description: text("description"),
  notificationMessage: text("notification_message").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type VimeoVideo = typeof vimeoVideos.$inferSelect;
export type InsertVimeoVideo = typeof vimeoVideos.$inferInsert;

/**
 * Notification History
 */
export const notificationStatusEnum = pgEnum("notification_status", ["success", "failed"]);

export const notificationHistory = pgTable("notification_history", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  videoId: varchar("video_id", { length: 64 }).notNull(),
  videoTitle: text("video_title"),
  viewerName: text("viewer_name").notNull(),
  message: text("message").notNull(),
  status: notificationStatusEnum("status").notNull(),
  errorMessage: text("error_message"),
  sentAt: timestamp("sent_at").defaultNow().notNull(),
});

export type NotificationHistory = typeof notificationHistory.$inferSelect;
export type InsertNotificationHistory = typeof notificationHistory.$inferInsert;

/**
 * Viewing Events
 */
export const eventTypeEnum = pgEnum("event_type", ["play", "pause", "timeupdate", "ended", "seeked"]);

export const viewingEvents = pgTable("viewing_events", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  viewerName: text("viewer_name"),
  sessionId: varchar("session_id", { length: 64 }).notNull(),
  videoId: varchar("video_id", { length: 64 }).notNull(),
  eventType: eventTypeEnum("event_type").notNull(),
  currentTime: integer("current_time").notNull(),
  duration: integer("duration").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type ViewingEvent = typeof viewingEvents.$inferSelect;
export type InsertViewingEvent = typeof viewingEvents.$inferInsert;
