import { useState } from 'react';
import { trpc } from '../lib/trpc';

export default function VimeoVideos() {
  const utils = trpc.useUtils();
  const { data: videos, isLoading } = trpc.vimeoVideos.list.useQuery();
  const addVideo = trpc.vimeoVideos.add.useMutation({
    onSuccess: () => { utils.vimeoVideos.list.invalidate(); resetForm(); },
  });
  const updateVideo = trpc.vimeoVideos.update.useMutation({
    onSuccess: () => { utils.vimeoVideos.list.invalidate(); setEditingId(null); },
  });
  const deleteVideo = trpc.vimeoVideos.delete.useMutation({
    onSuccess: () => utils.vimeoVideos.list.invalidate(),
  });

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [videoId, setVideoId] = useState('');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');

  const resetForm = () => {
    setVideoId(''); setTitle(''); setMessage(''); setShowForm(false); setEditingId(null);
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    await addVideo.mutateAsync({ videoId, title, notificationMessage: message });
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId === null) return;
    await updateVideo.mutateAsync({ id: editingId, title, notificationMessage: message });
  };

  const startEdit = (v: any) => {
    setEditingId(v.id);
    setVideoId(v.videoId);
    setTitle(v.title);
    setMessage(v.notificationMessage);
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('この動画を削除しますか？')) return;
    await deleteVideo.mutateAsync({ id });
  };

  const apiUrl = import.meta.env.VITE_API_URL || window.location.origin;
  const baseUrl = window.location.origin;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">動画管理</h1>
        <button
          onClick={() => { resetForm(); setShowForm(!showForm); }}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          {showForm ? 'キャンセル' : '＋ 新規追加'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={editingId ? handleUpdate : handleAdd} className="bg-white p-6 rounded-lg shadow mb-6">
          <h2 className="text-lg font-semibold mb-4">{editingId ? '動画を編集' : '動画を追加'}</h2>
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">YouTube Video ID</label>
              <input
                type="text"
                value={videoId}
                onChange={(e) => setVideoId(e.target.value)}
                placeholder="例: 123456789"
                className="w-full border p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                disabled={!!editingId}
              />
              {!editingId && (
                <p className="text-xs text-gray-500 mt-1">YouTubeのURLのID部分（例: youtube.com/watch?v=<strong>123456789</strong>）</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">タイトル</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="例: 入社研修①"
                className="w-full border p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">通知メッセージ</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="例: 視聴完了しました"
                className="w-full border p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={2}
                required
              />
            </div>
          </div>
          <button
            type="submit"
            className="mt-4 bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700"
            disabled={addVideo.isPending || updateVideo.isPending}
          >
            {addVideo.isPending || updateVideo.isPending ? '保存中...' : '保存'}
          </button>
        </form>
      )}

      {isLoading ? (
        <p className="text-gray-500">読み込み中...</p>
      ) : videos && videos.length > 0 ? (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-100">
                <th className="border-b p-3 text-left">Video ID</th>
                <th className="border-b p-3 text-left">タイトル</th>
                <th className="border-b p-3 text-left">通知メッセージ</th>
                <th className="border-b p-3 text-left">視聴URL</th>
                <th className="border-b p-3 text-left">操作</th>
              </tr>
            </thead>
            <tbody>
              {videos.map((v) => (
                <tr key={v.id} className="hover:bg-gray-50">
                  <td className="border-b p-3 font-mono text-sm">{v.videoId}</td>
                  <td className="border-b p-3">{v.title}</td>
                  <td className="border-b p-3 text-sm text-gray-600">{v.notificationMessage}</td>
                  <td className="border-b p-3">
                    <code className="text-xs bg-gray-100 px-2 py-1 rounded break-all">
                      {baseUrl}/watch/{v.videoId}
                    </code>
                  </td>
                  <td className="border-b p-3">
                    <button
                      onClick={() => startEdit(v)}
                      className="text-blue-600 hover:underline mr-3 text-sm"
                    >
                      編集
                    </button>
                    <button
                      onClick={() => handleDelete(v.id)}
                      className="text-red-600 hover:underline text-sm"
                    >
                      削除
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-white p-8 rounded-lg shadow text-center text-gray-500">
          動画が登録されていません。「新規追加」から動画を登録してください。
        </div>
      )}
    </div>
  );
}
