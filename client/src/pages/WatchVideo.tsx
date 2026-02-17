import { useState, useEffect, useRef } from 'react';
import { useParams } from 'wouter';
import { trpc } from '../lib/trpc';

declare global {
  interface Window {
    Vimeo: any;
  }
}

export default function WatchVideo() {
  const { videoId } = useParams<{ videoId: string }>();
  const [viewerName, setViewerName] = useState('');
  const [isNameSubmitted, setIsNameSubmitted] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [sessionId] = useState(() => crypto.randomUUID());
  const playerRef = useRef<any>(null);

  const { data: video } = trpc.vimeoVideos.getByVideoId.useQuery(
    { videoId: videoId || '' },
    { enabled: !!videoId }
  );

  const recordEvent = trpc.viewingEvents.record.useMutation();
  const sendCompletion = trpc.notification.sendCompletion.useMutation();

  useEffect(() => {
    if (!isNameSubmitted || !videoId) return;

    const iframe = document.getElementById('vimeo-player') as HTMLIFrameElement;
    if (!iframe || !window.Vimeo) return;

    const player = new window.Vimeo.Player(iframe);
    playerRef.current = player;

    player.on('play', () => {
      recordEvent.mutate({
        viewerName,
        sessionId,
        videoId,
        eventType: 'play',
        currentTime: 0,
        duration: 0,
      });
    });

    player.on('pause', (data: any) => {
      recordEvent.mutate({
        viewerName,
        sessionId,
        videoId,
        eventType: 'pause',
        currentTime: Math.floor(data.seconds),
        duration: Math.floor(data.duration),
      });
    });

    player.on('ended', (data: any) => {
      recordEvent.mutate({
        viewerName,
        sessionId,
        videoId,
        eventType: 'ended',
        currentTime: Math.floor(data.duration),
        duration: Math.floor(data.duration),
      });

      if (!isCompleted) {
        setIsCompleted(true);
        sendCompletion.mutate({ videoId, viewerName });
      }
    });

    // Record timeupdate every 10 seconds
    let lastRecorded = 0;
    player.on('timeupdate', (data: any) => {
      const currentSec = Math.floor(data.seconds);
      if (currentSec - lastRecorded >= 10) {
        lastRecorded = currentSec;
        recordEvent.mutate({
          viewerName,
          sessionId,
          videoId,
          eventType: 'timeupdate',
          currentTime: currentSec,
          duration: Math.floor(data.duration),
        });
      }
    });

    return () => {
      player.off('play');
      player.off('pause');
      player.off('ended');
      player.off('timeupdate');
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

  // Step 1: Name input
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

  // Step 2: Video player
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-2xl font-bold mb-4">{video?.title || '動画視聴'}</h1>
      <p className="text-gray-600 mb-4">視聴者: {viewerName}</p>
      
      <div className="relative w-full" style={{ paddingTop: '56.25%' }}>
        <iframe
          id="vimeo-player"
          src={`https://player.vimeo.com/video/${videoId}?autopause=0`}
          className="absolute top-0 left-0 w-full h-full rounded-lg"
          frameBorder="0"
          allow="autoplay; fullscreen; picture-in-picture"
          allowFullScreen
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
