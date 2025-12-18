// Admin 主应用

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error('ErrorBoundary caught:', error, errorInfo.componentStack);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen flex items-center justify-center bg-gray-50">
                    <div className="text-center">
                        <h1 className="text-2xl font-bold text-gray-900 mb-4">出错了</h1>
                        <p className="text-gray-600 mb-4">抱歉，发生了意外错误</p>
                        <button
                            onClick={() => window.location.reload()}
                            className="btn-primary"
                        >
                            重新加载
                        </button>
                    </div>
                </div>
            );
        }
        return this.props.children;
    }
}

function App() {
    const [currentView, setCurrentView] = React.useState('home'); // 'home' | 'edit'
    const [currentPageId, setCurrentPageId] = React.useState(null);
    const [currentCategory, setCurrentCategory] = React.useState('全部');
    const [searchKeyword, setSearchKeyword] = React.useState('');
    const [showConfigModal, setShowConfigModal] = React.useState(false);
    const [configReady, setConfigReady] = React.useState(false);

    const [pageData, setPageData] = React.useState({
        title: '',
        description: '',
        categories: [],
        htmlCode: '<!DOCTYPE html>\n<html>\n<head>\n  <title>我的网页</title>\n</head>\n<body>\n  <h1>Hello World!</h1>\n  <p>这是一个示例网页</p>\n</body>\n</html>'
    });

    // 检查配置状态
    React.useEffect(() => {
        checkConfig();
    }, []);

    const checkConfig = async () => {
        try {
            const status = await getConfigStatus();
            if (status.configured) {
                setConfigReady(true);
            } else {
                setShowConfigModal(true);
            }
        } catch (error) {
            console.error('检查配置失败:', error);
            setShowConfigModal(true);
        }
    };

    const handleConfigSaved = () => {
        setShowConfigModal(false);
        setConfigReady(true);
    };

    const handleCreateNew = (category = '全部') => {
        setCurrentPageId(null);
        const initialCategories = category !== '全部' ? [category] : [];
        setPageData({
            title: '',
            description: '',
            categories: initialCategories,
            htmlCode: '<!DOCTYPE html>\n<html>\n<head>\n  <title>我的网页</title>\n</head>\n<body>\n  <h1>Hello World!</h1>\n  <p>这是一个示例网页</p>\n</body>\n</html>'
        });
        setCurrentView('edit');
    };

    const handleEditPage = async (pageId) => {
        try {
            const storedData = await getStoredPageData(pageId);
            if (storedData) {
                setCurrentPageId(pageId);
                setPageData(storedData);
                setCurrentView('edit');
            } else {
                alert('页面数据不存在');
            }
        } catch (error) {
            console.error('加载页面失败:', error);
            alert('加载页面失败: ' + error.message);
        }
    };

    const handleSavePage = async () => {
        if (!pageData.title.trim()) {
            alert('请输入页面标题');
            return;
        }

        if (!pageData.categories || pageData.categories.length < 3) {
            alert('请至少选择3个分类标签');
            return;
        }

        try {
            const savedPageId = await savePageData(currentPageId, pageData);
            if (savedPageId) {
                alert('保存成功！');
                setCurrentPageId(savedPageId);
                setCurrentView('home');
            } else {
                alert('保存失败，请重试');
            }
        } catch (error) {
            console.error('保存页面失败:', error);
            alert('保存失败: ' + error.message);
        }
    };

    const handleBackToHome = () => {
        setCurrentView('home');
    };

    const handleShowSettings = () => {
        setShowConfigModal(true);
    };

    if (!configReady) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">欢迎使用 HTML Reports Admin</h1>
                    <p className="text-gray-600 mb-4">请先配置 GitHub 仓库信息</p>
                </div>
                <ConfigModal
                    isOpen={showConfigModal}
                    onClose={() => { }}
                    onSave={handleConfigSaved}
                />
            </div>
        );
    }

    if (currentView === 'home') {
        return (
            <>
                <AdminHomePage
                    onCreateNew={handleCreateNew}
                    onEditPage={handleEditPage}
                    currentCategory={currentCategory}
                    setCurrentCategory={setCurrentCategory}
                    searchKeyword={searchKeyword}
                    setSearchKeyword={setSearchKeyword}
                    onSettings={handleShowSettings}
                />
                <ConfigModal
                    isOpen={showConfigModal}
                    onClose={() => setShowConfigModal(false)}
                    onSave={() => {
                        setShowConfigModal(false);
                        window.location.reload();
                    }}
                />
            </>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white shadow-sm border-b">
                <div className="max-w-7xl mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={handleBackToHome}
                                className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
                            >
                                <div className="icon-arrow-left text-lg"></div>
                                返回首页
                            </button>
                            <h1 className="text-2xl font-bold text-gray-900">
                                {currentPageId ? '编辑页面' : '创建新页面'}
                            </h1>
                        </div>
                        <button
                            onClick={handleSavePage}
                            className="btn-success flex items-center gap-2"
                        >
                            <div className="icon-save text-lg"></div>
                            保存页面
                        </button>
                    </div>
                </div>
            </header>

            {/* Page Info */}
            <div className="bg-white border-b">
                <div className="max-w-7xl mx-auto px-4 py-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">页面标题</label>
                            <input
                                type="text"
                                value={pageData.title}
                                onChange={(e) => setPageData(prev => ({ ...prev, title: e.target.value }))}
                                className="input-field"
                                placeholder="请输入页面标题..."
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">页面描述</label>
                            <input
                                type="text"
                                value={pageData.description}
                                onChange={(e) => setPageData(prev => ({ ...prev, description: e.target.value }))}
                                className="input-field"
                                placeholder="请输入页面描述..."
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            分类标签 <span className="text-red-500">（至少选择3个）</span>
                            {pageData.categories && pageData.categories.length > 0 && (
                                <span className="ml-2 text-sm text-gray-500">已选择 {pageData.categories.length} 个</span>
                            )}
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {['客戶簡報', '內部簡報', '會議記要', '工作報告', '數據分析', '市場分析', '財務分析', '年度計劃', '季度計劃', '項目計劃', '其他'].map(category => {
                                const isSelected = pageData.categories && pageData.categories.includes(category);
                                return (
                                    <button
                                        key={category}
                                        type="button"
                                        onClick={() => {
                                            const current = pageData.categories || [];
                                            const newCategories = isSelected
                                                ? current.filter(c => c !== category)
                                                : [...current, category];
                                            setPageData(prev => ({ ...prev, categories: newCategories }));
                                        }}
                                        className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${isSelected
                                                ? 'bg-[var(--primary-color)] text-white'
                                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                            }`}
                                    >
                                        {category}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto p-4">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100vh-220px)]">
                    {/* Editor Panel */}
                    <HTMLEditor
                        htmlCode={pageData.htmlCode}
                        onChange={(code) => setPageData(prev => ({ ...prev, htmlCode: code }))}
                    />

                    {/* Preview Panel */}
                    <PreviewPanel htmlCode={pageData.htmlCode} />
                </div>
            </div>
        </div>
    );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
    <ErrorBoundary>
        <App />
    </ErrorBoundary>
);
