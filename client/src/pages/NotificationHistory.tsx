import { trpc } from '../lib/trpc';

export default function NotificationHistory() {
  const { data: history } = trpc.notification.history.useQuery({ limit: 50 });
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-4">通知履歴</h1>
      <table className="w-full border">
        <thead>
          <tr className="bg-gray-100">
            <th className="border p-2">動画</th>
            <th className="border p-2">視聴者</th>
            <th className="border p-2">ステータス</th>
            <th className="border p-2">送信日時</th>
          </tr>
        </thead>
        <tbody>
          {history?.map((h) => (
            <tr key={h.id}>
              <td className="border p-2">{h.videoTitle || h.videoId}</td>
              <td className="border p-2">{h.viewerName}</td>
              <td className="border p-2">
                <span className={h.status === 'success' ? 'text-green-600' : 'text-red-600'}>
                  {h.status === 'success' ? '✅ 成功' : '❌ 失敗'}
                </span>
              </td>
              <td className="border p-2">{new Date(h.sentAt).toLocaleString('ja-JP')}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
