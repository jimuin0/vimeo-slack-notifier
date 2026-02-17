import { z } from "zod";
import { router, publicProcedure, protectedProcedure } from "./trpc";
import * as db from "./db";
import { sendSlackNotification } from "./slack";

export const appRouter = router({
  // Vimeo Videos
  vimeoVideos: router({
    list: protectedProcedure.query(async () => {
      return await db.getAllVimeoVideos();
    }),
    add: protectedProcedure
      .input(z.object({
        videoId: z.string(),
        title: z.string(),
        notificationMessage: z.string(),
      }))
      .mutation(async ({ input }) => {
        await db.addVimeoVideo(input);
        return { success: true };
      }),
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        title: z.string().optional(),
        notificationMessage: z.string().optional(),
        isActive: z.boolean().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await db.updateVimeoVideo(id, data);
        return { success: true };
      }),
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteVimeoVideo(input.id);
        return { success: true };
      }),
    // Public: get video info by videoId (for viewer page)
    getByVideoId: publicProcedure
      .input(z.object({ videoId: z.string() }))
      .query(async ({ input }) => {
        return await db.getVimeoVideoByVideoId(input.videoId);
      }),
  }),

  // Notification
  notification: router({
    // Called when viewer completes watching
    sendCompletion: publicProcedure
      .input(z.object({
        videoId: z.string(),
        viewerName: z.string(),
      }))
      .mutation(async ({ input }) => {
        const video = await db.getVimeoVideoByVideoId(input.videoId);
        const videoTitle = video?.title || input.videoId;
        
        const result = await sendSlackNotification(
          input.viewerName,
          videoTitle,
          input.videoId
        );

        await db.addNotificationHistory({
          videoId: input.videoId,
          videoTitle: videoTitle,
          viewerName: input.viewerName,
          message: `${input.viewerName}さんが「${videoTitle}」を視聴完了`,
          success: result.success,
          errorMessage: result.error,
        });

        return { success: result.success };
      }),
    history: protectedProcedure
      .input(z.object({ limit: z.number().optional() }))
      .query(async ({ input }) => {
        return await db.getNotificationHistory(input.limit);
      }),
  }),

  // Viewing Events
  viewingEvents: router({
    record: publicProcedure
      .input(z.object({
        viewerName: z.string().optional(),
        sessionId: z.string(),
        videoId: z.string(),
        eventType: z.enum(['play', 'pause', 'timeupdate', 'ended', 'seeked']),
        currentTime: z.number(),
        duration: z.number(),
      }))
      .mutation(async ({ input }) => {
        await db.recordViewingEvent(input);
        return { success: true };
      }),
    stats: protectedProcedure.query(async () => {
      return await db.getAllVideoStats();
    }),
    userStats: protectedProcedure.query(async () => {
      return await db.getAllUserStats();
    }),
  }),
});

export type AppRouter = typeof appRouter;
