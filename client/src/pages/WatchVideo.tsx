import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'wouter';
import { trpc } from '../lib/trpc';

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

export default function WatchVideo() {
  const { videoId } = useParams<{ videoId: string }>();
  const [viewerName, setViewerName] = useState('');
  const [isNameSubmitted, setIsNameSubmitted] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [sessionId] = useState(() => crypto.randomUUID());
  const playerRef = useRef<any>(null);
  const timerRef = useRef<any>(null);
  const lastRecordedRef = useRef<number>(0);

  const { data: video } = trpc.vimeoVideos.getByVideoId.useQuery(
    { videoId: videoId || '' },
    { enabled: !!videoId }
  );

  const recordEvent = trpc.viewingEvents.record.useMutation();
  const sendCompletion = trpc.notification.sendCompletion.useMutation();

  const startTimeTracking = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      const player = playerRef.current;
      if (!player || !player.getCurrentTime) return;
      const currentSec = Math.floor(player.getCurrentTime());
      const duration = Math.floor(player.getDuration());
      if (currentSec - lastRecordedRef.current >= 10) {
        lastRecordedRef.current = currentSec;
        recordEvent.mutate({
          viewerName,
          sessionId,
          videoId: videoId || '',
          eventType: 'timeupdate',
          currentTime: currentSec,
          duration,
        });
      }
    }, 2000);
  }, [viewerName, sessionId, videoId]);

  const stopTimeTracking = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!isNameSubmitted || !videoId) return;

    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      document.head.appendChild(tag);
    }

    const initPlayer = () => {
      playerRef.current = new window.YT.Player('youtube-player', {
        videoId,
        playerVars: {
          autoplay: 0,
          rel: 0,
          modestbranding: 1,
        },
        events: {
          onStateChange: (event: any) => {
            const player = event.target;
            const currentTime = Math.floor(player.getCurrentTime());
            const duration = Math.floor(player.getDuration());

            switch (event.data) {
              case window.YT.PlayerState.PLAYING:
                recordEvent.mutate({
                  viewerName,
                  sessionId,
                  videoId,
                  eventType: 'play',
                  currentTime,
                  duration,
                });
                startTimeTracking();
                break;

              case window.YT.PlayerState.PAUSED:
                recordEvent.mutate({
                  viewerName,
                  sessionId,
                  videoId,
                  eventType: 'pause',
                  currentTime,
                  duration,
                });
                stopTimeTracking();
                break;

              case window.YT.PlayerState.ENDED:
                recordEvent.mutate({
                  viewerName,
                  sessionId,
                  videoId,
                  eventType: 'ended',
                  currentTime: duration,
                  duration,
                });
                stopTimeTracking();
                if (!isCompleted) {
                  setIsCompleted(true);
                  sendCompletion.mutate({ videoId, viewerName });
                }
                break;
            }
          },
        },
      });
    };

    if (window.YT && window.YT.Player) {
      initPlayer();
    } else {
      window.onYouTubeIframeAPIReady = initPlayer;
    }

    return () => {
      stopTimeTracking();
      if (playerRef.current && playerRef.current.destroy) {
        playerRef.current.destroy();
      }
    };
  }, [isNameSubmitted, videoId]);

  const handleNameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (viewerName.trim()) {
      setIsNameSubmitted(true);
    }
  };

  if (!videoId) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500">動画IDが指定されていません</p>
      </div>
    );
  }

  if (!isNameSubmitted) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full mx-4">
          <h1 className="text-2xl font-bold mb-2 text-center">
            {video?.title || '動画視聴'}
          </h1>
          <p className="text-gray-600 mb-6 text-center">
            視聴を開始するにはお名前を入力してください
          </p>
          <form onSubmit={handleNameSubmit}>
            <input
              type="text"
              value={viewerName}
              onChange={(e) => setViewerName(e.target.value)}
              placeholder="お名前（例：山田太郎）"
              className="w-full border border-gray-300 p-3 rounded-lg mb-4 text-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
              required
            />
            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-3 rounded-lg text-lg font-semibold hover:bg-blue-700 transition"
            >
              視聴を開始する
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-2xl font-bold mb-4">{video?.title || '動画視聴'}</h1>
      <p className="text-gray-600 mb-4">視聴者: {viewerName}</p>

      <div className="relative w-full" style={{ paddingTop: '56.25%' }}>
        <div
          id="youtube-player"
          className="absolute top-0 left-0 w-full h-full rounded-lg"
        />
      </div>

      {isCompleted && (
        <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-green-800 font-semibold">
            ✅ 視聴完了しました。ありがとうございました！
          </p>
        </div>
      )}
    </div>
  );
}
