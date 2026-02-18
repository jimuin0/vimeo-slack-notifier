import { useState, useEffect } from 'react';
import { Route, Switch, Link, useLocation } from 'wouter';
import { supabase } from './lib/supabase';
import Login from './pages/Login';
import Home from './pages/Home';
import VimeoVideos from './pages/VimeoVideos';
import NotificationHistory from './pages/NotificationHistory';
import ViewingAnalytics from './pages/ViewingAnalytics';
import WatchVideo from './pages/WatchVideo';

function AdminLayout({ children, onLogout }: { children: React.ReactNode; onLogout: () => void }) {
  const [location] = useLocation();

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/">
              <a className="font-bold text-lg">動画視聴管理</a>
            </Link>
            <Link href="/vimeo-videos">
              <a className={`text-sm ${location === '/vimeo-videos' ? 'text-blue-600 font-semibold' : 'text-gray-600 hover:text-gray-900'}`}>
                動画管理
              </a>
            </Link>
            <Link href="/notification-history">
              <a className={`text-sm ${location === '/notification-history' ? 'text-blue-600 font-semibold' : 'text-gray-600 hover:text-gray-900'}`}>
                通知履歴
              </a>
            </Link>
            <Link href="/viewing-analytics">
              <a className={`text-sm ${location === '/viewing-analytics' ? 'text-blue-600 font-semibold' : 'text-gray-600 hover:text-gray-900'}`}>
                視聴分析
              </a>
            </Link>
          </div>
          <button
            onClick={onLogout}
            className="text-sm text-gray-500 hover:text-red-600"
          >
            ログアウト
          </button>
        </div>
      </nav>
      {children}
    </div>
  );
}

function AdminRoutes({ onLogout }: { onLogout: () => void }) {
  return (
    <AdminLayout onLogout={onLogout}>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/vimeo-videos" component={VimeoVideos} />
        <Route path="/notification-history" component={NotificationHistory} />
        <Route path="/viewing-analytics" component={ViewingAnalytics} />
      </Switch>
    </AdminLayout>
  );
}

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [location] = useLocation();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user || null);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  // /watch/:videoId is always public - no auth required
  if (location.startsWith('/watch/')) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Switch>
          <Route path="/watch/:videoId" component={WatchVideo} />
        </Switch>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500">読み込み中...</p>
      </div>
    );
  }

  if (!user) {
    return <Login onLogin={() => {}} />;
  }

  return <AdminRoutes onLogout={handleLogout} />;
}
