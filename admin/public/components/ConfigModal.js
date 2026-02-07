// 配置對話框組件

function ConfigModal({ isOpen, onClose, onSave }) {
    const [config, setConfig] = React.useState({
        owner: '',
        repo: '',
        token: '',
        port: '3030'
    });
    const [testing, setTesting] = React.useState(false);
    const [testResult, setTestResult] = React.useState(null);

    React.useEffect(() => {
        if (isOpen) {
            // 載入現有配置
            getConfigStatus().then(data => {
                if (data.config) {
                    setConfig({
                        owner: data.config.owner || '',
                        repo: data.config.repo || '',
                        token: '',  // Token不回顯
                        port: data.config.port || '3030'
                    });
                }
            });
        }
    }, [isOpen]);

    const handleTest = async () => {
        setTesting(true);
        setTestResult(null);

        try {
            // 先保存配置
            await saveConfig(config);

            // 测试连接
            const result = await testConnection();
            setTestResult({ success: true, message: '連接成功！', repo: result.repo });
        } catch (error) {
            setTestResult({ success: false, message: error.message });
        } finally {
            setTesting(false);
        }
    };

    const handleSave = async () => {
        try {
            await saveConfig(config);
            onSave();
        } catch (error) {
            alert('儲存配置失敗: ' + error.message);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-gray-900">GitHub 配置</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                        <div className="icon-x text-xl"></div>
                    </button>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            GitHub 用戶名
                        </label>
                        <input
                            type="text"
                            value={config.owner}
                            onChange={(e) => setConfig({ ...config, owner: e.target.value })}
                            className="input-field"
                            placeholder="your-username"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            倉庫名稱
                        </label>
                        <input
                            type="text"
                            value={config.repo}
                            onChange={(e) => setConfig({ ...config, repo: e.target.value })}
                            className="input-field"
                            placeholder="your-repo-name"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Personal Access Token
                            <a
                                href="https://github.com/settings/tokens/new"
                                target="_blank"
                                className="ml-2 text-xs text-blue-600 hover:underline"
                            >
                                生成Token
                            </a>
                        </label>
                        <input
                            type="password"
                            value={config.token}
                            onChange={(e) => setConfig({ ...config, token: e.target.value })}
                            className="input-field"
                            placeholder="ghp_xxxxxxxxxxxx"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            需要 <code className="bg-gray-100 px-1 rounded">repo</code> 權限
                        </p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            端口
                        </label>
                        <input
                            type="number"
                            value={config.port}
                            onChange={(e) => setConfig({ ...config, port: e.target.value })}
                            className="input-field"
                            placeholder="3030"
                        />
                    </div>

                    {testResult && (
                        <div className={`p-3 rounded-lg ${testResult.success
                            ? 'bg-green-50 text-green-800 border border-green-200'
                            : 'bg-red-50 text-red-800 border border-red-200'
                            }`}>
                            <p className="font-medium">
                                {testResult.success ? '✓ ' : '✗ '}
                                {testResult.message}
                            </p>
                            {testResult.repo && (
                                <p className="text-sm mt-1">
                                    倉庫: {testResult.repo.fullName}
                                </p>
                            )}
                        </div>
                    )}

                    <div className="flex gap-2 pt-4">
                        <button
                            onClick={handleTest}
                            disabled={testing || !config.owner || !config.repo || !config.token}
                            className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {testing ? '測試中...' : '測試連接'}
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={!config.owner || !config.repo || !config.token}
                            className="flex-1 btn-success disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            儲存配置
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
