import { Link } from 'wouter';

export default function Home() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Vimeo視聴完了 Slack通知</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Link href="/vimeo-videos">
          <a className="block p-6 bg-white rounded-lg shadow hover:shadow-lg transition">
            <h2 className="text-xl font-semibold mb-2">🎬 動画管理</h2>
            <p className="text-gray-600">Vimeo動画の登録・管理</p>
          </a>
        </Link>
        
        <Link href="/notification-history">
          <a className="block p-6 bg-white rounded-lg shadow hover:shadow-lg transition">
            <h2 className="text-xl font-semibold mb-2">📋 通知履歴</h2>
            <p className="text-gray-600">Slack通知の送信履歴</p>
          </a>
        </Link>
        
        <Link href="/viewing-analytics">
          <a className="block p-6 bg-white rounded-lg shadow hover:shadow-lg transition">
            <h2 className="text-xl font-semibold mb-2">📊 視聴分析</h2>
            <p className="text-gray-600">動画視聴データの分析</p>
          </a>
        </Link>
      </div>
    </div>
  );
}
