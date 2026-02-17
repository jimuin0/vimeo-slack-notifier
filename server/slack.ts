import axios from 'axios';

const SLACK_WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL || '';

export async function sendSlackNotification(
  viewerName: string,
  videoTitle: string,
  videoId: string
): Promise<{ success: boolean; error?: string }> {
  if (!SLACK_WEBHOOK_URL) {
    console.error('[Slack] SLACK_WEBHOOK_URL is not set');
    return { success: false, error: 'SLACK_WEBHOOK_URL is not configured' };
  }

  const now = new Date().toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' });

  const payload = {
    blocks: [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: '🎬 視聴完了通知',
          emoji: true,
        },
      },
      {
        type: 'section',
        fields: [
          { type: 'mrkdwn', text: `*視聴者:*\n${viewerName}` },
          { type: 'mrkdwn', text: `*動画:*\n${videoTitle}` },
          { type: 'mrkdwn', text: `*Video ID:*\n${videoId}` },
          { type: 'mrkdwn', text: `*視聴完了日時:*\n${now}` },
        ],
      },
    ],
  };

  try {
    await axios.post(SLACK_WEBHOOK_URL, payload);
    return { success: true };
  } catch (error: any) {
    console.error('[Slack] Failed to send notification:', error.response?.data || error.message);
    return {
      success: false,
      error: error.response?.data || error.message || 'Unknown error',
    };
  }
}
