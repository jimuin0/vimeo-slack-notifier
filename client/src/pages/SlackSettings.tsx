export default function SlackSettings() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-4">Slack設定</h1>
      <div className="bg-white p-6 rounded-lg shadow max-w-md">
        <p className="text-gray-600 mb-4">
          Slack Webhook URLはRailwayの環境変数 <code className="bg-gray-100 px-1 rounded">SLACK_WEBHOOK_URL</code> で設定されています。
        </p>
        <p className="text-gray-600">
          変更する場合はRailwayダッシュボードから環境変数を更新してください。
        </p>
      </div>
    </div>
  );
}
