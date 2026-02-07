// Admin 主頁組件

function AdminHomePage({
    onCreateNew,
    onEditPage,
    onDeletePage,
    currentCategory,
    setCurrentCategory,
    searchKeyword,
    setSearchKeyword,
    onSettings
}) {
    const [pages, setPages] = React.useState([]);
    const [loading, setLoading] = React.useState(true);
    const [currentPage, setCurrentPage] = React.useState(1);
    const [isCopying, setIsCopying] = React.useState(false);
    const [baseUrl, setBaseUrl] = React.useState('');
    const pageSize = 12;

    React.useEffect(() => {
        loadPages();
        loadConfig();
    }, []);

    const loadConfig = async () => {
        try {
            const data = await getConfigStatus();
            if (data.config && data.config.baseUrl) {
                setBaseUrl(data.config.baseUrl);
            }
        } catch (error) {
            console.error('載入配置失敗:', error);
        }
    };

    // 當分類或搜尋關鍵字變動時，重置分頁到第一頁
    React.useEffect(() => {
        setCurrentPage(1);
    }, [currentCategory, searchKeyword]);

    const loadPages = async () => {
        try {
            setLoading(true);
            const allPages = await getAllStoredPages();
            setPages(allPages);
        } catch (error) {
            console.error('載入頁面失敗:', error);
            alert('載入失敗: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (pageId) => {
        if (await deleteStoredPage(pageId)) {
            await loadPages(); // 重新加载列表
        } else {
            alert('刪除失敗');
        }
    };

    const handleBatchCopy = async (type) => {
        if (filteredPages.length === 0) {
            alert('沒有可複製的內容');
            return;
        }

        try {
            setIsCopying(true);
            // 模擬處理延遲，防止 UI 閃爍並確保鎖定感
            await new Promise(resolve => setTimeout(resolve, 800));

            const effectiveBaseUrl = baseUrl || window.location.origin;

            let copyText = '';
            if (type === 'links') {
                copyText = filteredPages.map(page => `${effectiveBaseUrl}/reports/${page.fileName}`).join('\n');
            } else {
                copyText = filteredPages.map(page =>
                    `標題: ${page.title}\n描述: ${page.description || '無'}\n連結: ${effectiveBaseUrl}/reports/${page.fileName}`
                ).join('\n\n');
            }

            await navigator.clipboard.writeText(copyText);
            alert(`已成功複製 ${filteredPages.length} 筆結果`);
        } catch (error) {
            console.error('複製失敗:', error);
            alert('複製失敗: ' + error.message);
        } finally {
            setIsCopying(false);
        }
    };

    // 計算分類數量
    const categoryCounts = React.useMemo(() => {
        const counts = { '全部': pages.length };
        pages.forEach(page => {
            if (page.categories) {
                page.categories.forEach(cat => {
                    counts[cat] = (counts[cat] || 0) + 1;
                });
            }
        });
        return counts;
    }, [pages]);

    // 過濾和搜尋
    const filteredPages = React.useMemo(() => {
        return pages.filter(page => {
            const matchCategory = currentCategory === '全部' ||
                (page.categories && page.categories.includes(currentCategory));

            const matchSearch = !searchKeyword ||
                (page.title && page.title.toLowerCase().includes(searchKeyword.toLowerCase())) ||
                (page.description && page.description.toLowerCase().includes(searchKeyword.toLowerCase()));

            return matchCategory && matchSearch;
        });
    }, [pages, currentCategory, searchKeyword]);

    // 分页
    const totalPages = Math.ceil(filteredPages.length / pageSize);
    const paginatedPages = filteredPages.slice(
        (currentPage - 1) * pageSize,
        currentPage * pageSize
    );

    if (loading) {
        return <LoadingProgress text="載入中..." />;
    }

    return (
        <div className="min-h-screen bg-gray-50 relative">
            {/* 複製中的鎖定層 */}
            {isCopying && (
                <div className="fixed inset-0 bg-white/60 backdrop-blur-[2px] z-[100] flex flex-col items-center justify-center">
                    <div className="bg-white p-6 rounded-2xl shadow-xl flex flex-col items-center gap-4 border border-gray-100">
                        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                        <p className="text-gray-900 font-medium">正在處理批量複製...</p>
                        <p className="text-sm text-gray-500">請稍候，完成前請勿操作</p>
                    </div>
                </div>
            )}

            {/* Header */}
            <header className="bg-white shadow-sm border-b sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">HTML Reports Admin</h1>
                            <p className="text-sm text-gray-600">管理後臺</p>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={onSettings}
                                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2"
                            >
                                <div className="icon-settings text-lg"></div>
                                設置
                            </button>
                            <button
                                onClick={() => onCreateNew(currentCategory)}
                                className="btn-primary flex items-center gap-2"
                            >
                                <div className="icon-plus text-lg"></div>
                                創建新頁面
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            <div className="max-w-7xl mx-auto px-4 py-6">
                {/* 搜尋欄 */}
                <div className="mb-6">
                    <SearchBar
                        searchKeyword={searchKeyword}
                        onSearchChange={setSearchKeyword}
                    />
                </div>

                {/* 分類標籤 */}
                <div className="mb-6">
                    <CategoryTabs
                        currentCategory={currentCategory}
                        setCurrentCategory={setCurrentCategory}
                        categoryCounts={categoryCounts}
                    />
                </div>

                {/* 統計信息與批量操作 */}
                <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="text-sm text-gray-600">
                        共 <span className="font-semibold text-gray-900">{filteredPages.length}</span> 個頁面
                        {searchKeyword && ` · 搜尋: "${searchKeyword}"`}
                        {currentCategory !== '全部' && ` · 分類: ${currentCategory}`}
                    </div>

                    <div className="flex gap-2">
                        <div className="relative group">
                            <button className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2 shadow-sm text-sm font-medium">
                                <div className="icon-copy text-lg"></div>
                                批量複製結果
                                <div className="icon-chevron-down text-xs"></div>
                            </button>

                            {/* Dropdown Menu */}
                            <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-100 rounded-xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-20 overflow-hidden">
                                <button
                                    onClick={() => handleBatchCopy('links')}
                                    className="w-full px-4 py-3 text-left text-sm text-gray-700 hover:bg-blue-50 transition-colors flex items-center gap-2 border-b border-gray-50"
                                >
                                    <div className="icon-link text-blue-500"></div>
                                    僅複製連結 (斷行)
                                </button>
                                <button
                                    onClick={() => handleBatchCopy('full')}
                                    className="w-full px-4 py-3 text-left text-sm text-gray-700 hover:bg-blue-50 transition-colors flex items-center gap-2"
                                >
                                    <div className="icon-file-text text-blue-500"></div>
                                    複製標題+描述+連結
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 頁面網格 */}
                {paginatedPages.length === 0 ? (
                    <div className="text-center py-12">
                        <div className="icon-file-text text-6xl text-gray-300 mb-4"></div>
                        <p className="text-gray-500">暫無頁面</p>
                        <button
                            onClick={() => onCreateNew()}
                            className="mt-4 btn-primary"
                        >
                            創建第一個頁面
                        </button>
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-6">
                            {paginatedPages.map(page => (
                                <AdminPageCard
                                    key={page.pageId}
                                    page={page}
                                    baseUrl={baseUrl}
                                    onEdit={onEditPage}
                                    onDelete={handleDelete}
                                />
                            ))}
                        </div>

                        {/* 分页 */}
                        {totalPages > 1 && (
                            <Pagination
                                currentPage={currentPage}
                                totalPages={totalPages}
                                onPageChange={setCurrentPage}
                            />
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
