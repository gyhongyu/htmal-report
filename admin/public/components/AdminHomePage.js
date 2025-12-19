// Admin 主页组件

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
    const pageSize = 12;

    React.useEffect(() => {
        loadPages();
    }, []);

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
            console.error('加载页面失败:', error);
            alert('加载失败: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (pageId) => {
        if (await deleteStoredPage(pageId)) {
            await loadPages(); // 重新加载列表
        } else {
            alert('删除失败');
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

    // 过滤和搜索
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
        return <LoadingProgress text="加载中..." />;
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white shadow-sm border-b sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">HTML Reports Admin</h1>
                            <p className="text-sm text-gray-600">管理后台</p>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={onSettings}
                                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2"
                            >
                                <div className="icon-settings text-lg"></div>
                                设置
                            </button>
                            <button
                                onClick={() => onCreateNew(currentCategory)}
                                className="btn-primary flex items-center gap-2"
                            >
                                <div className="icon-plus text-lg"></div>
                                创建新页面
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            <div className="max-w-7xl mx-auto px-4 py-6">
                {/* 搜索栏 */}
                <div className="mb-6">
                    <SearchBar
                        searchKeyword={searchKeyword}
                        onSearchChange={setSearchKeyword}
                    />
                </div>

                {/* 分类标签 */}
                <div className="mb-6">
                    <CategoryTabs
                        currentCategory={currentCategory}
                        setCurrentCategory={setCurrentCategory}
                        categoryCounts={categoryCounts}
                    />
                </div>

                {/* 统计信息 */}
                <div className="mb-6">
                    <div className="text-sm text-gray-600">
                        共 <span className="font-semibold text-gray-900">{filteredPages.length}</span> 個頁面
                        {searchKeyword && ` · 搜尋: "${searchKeyword}"`}
                        {currentCategory !== '全部' && ` · 分類: ${currentCategory}`}
                    </div>
                </div>

                {/* 页面网格 */}
                {paginatedPages.length === 0 ? (
                    <div className="text-center py-12">
                        <div className="icon-file-text text-6xl text-gray-300 mb-4"></div>
                        <p className="text-gray-500">暂无页面</p>
                        <button
                            onClick={() => onCreateNew()}
                            className="mt-4 btn-primary"
                        >
                            创建第一个页面
                        </button>
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-6">
                            {paginatedPages.map(page => (
                                <AdminPageCard
                                    key={page.pageId}
                                    page={page}
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
