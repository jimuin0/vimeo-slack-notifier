import { trpc } from '../lib/trpc';

export default function ViewingAnalytics() {
  const { data: stats, isLoading: statsLoading } = trpc.viewingEvents.stats.useQuery();
  const { data: userStats, isLoading: usersLoading } = trpc.viewingEvents.userStats.useQuery();

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">視聴分析</h1>

      <h2 className="text-xl font-semibold mb-3">動画別統計</h2>
      {statsLoading ? (
        <p className="text-gray-500 mb-8">読み込み中...</p>
      ) : stats && stats.length > 0 ? (
        <div className="bg-white rounded-lg shadow overflow-hidden mb-8">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-100">
                <th className="border-b p-3 text-left">動画</th>
                <th className="border-b p-3 text-right">総視聴数</th>
                <th className="border-b p-3 text-right">完了数</th>
                <th className="border-b p-3 text-right">完了率</th>
              </tr>
            </thead>
            <tbody>
              {stats.map((s, i) => (
                <tr key={i} className="hover:bg-gray-50">
                  <td className="border-b p-3">{s.videoTitle}</td>
                  <td className="border-b p-3 text-right">{s.totalViews}</td>
                  <td className="border-b p-3 text-right">{s.completedViews}</td>
                  <td className="border-b p-3 text-right">
                    <span className={s.completionRate >= 80 ? 'text-green-600' : s.completionRate >= 50 ? 'text-yellow-600' : 'text-red-600'}>
                      {s.completionRate.toFixed(1)}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-gray-500 mb-8">まだ視聴データがありません</p>
      )}

      <h2 className="text-xl font-semibold mb-3">視聴者別統計</h2>
      {usersLoading ? (
        <p className="text-gray-500">読み込み中...</p>
      ) : userStats && userStats.length > 0 ? (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-100">
                <th className="border-b p-3 text-left">視聴者</th>
                <th className="border-b p-3 text-right">視聴動画数</th>
                <th className="border-b p-3 text-right">完了数</th>
                <th className="border-b p-3 text-right">完了率</th>
              </tr>
            </thead>
            <tbody>
              {userStats.map((u, i) => (
                <tr key={i} className="hover:bg-gray-50">
                  <td className="border-b p-3">{u.viewerName}</td>
                  <td className="border-b p-3 text-right">{u.totalVideosWatched}</td>
                  <td className="border-b p-3 text-right">{u.completedVideos}</td>
                  <td className="border-b p-3 text-right">
                    <span className={u.completionRate >= 80 ? 'text-green-600' : u.completionRate >= 50 ? 'text-yellow-600' : 'text-red-600'}>
                      {u.completionRate.toFixed(1)}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-gray-500">まだ視聴データがありません</p>
      )}
    </div>
  );
}
