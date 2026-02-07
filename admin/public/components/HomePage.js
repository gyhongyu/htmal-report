function HomePage({ onCreateNew, onEditPage, currentCategory, setCurrentCategory, searchKeyword, setSearchKeyword }) {
  try {
    const [allPages, setAllPages] = React.useState([]);
    const [loading, setLoading] = React.useState(true);
    const [progress, setProgress] = React.useState(0);
    const [showShareModal, setShowShareModal] = React.useState(false);
    const [shareData, setShareData] = React.useState({ title: '', url: '' });
    const [currentPage, setCurrentPage] = React.useState(1);
    const [diagnosticInfo, setDiagnosticInfo] = React.useState(null);
    const itemsPerPage = 21;

    React.useEffect(() => {
      loadAllPages();
    }, []);

    const loadAllPages = async () => {
      setLoading(true);
      setProgress(0);

      try {
        setProgress(30);
        console.log('開始載入所有頁面...');
        const pages = await getAllStoredPages();
        console.log('getAllStoredPages 返回的頁面數:', pages.length);
        console.log('頁面內容預覽:', pages.slice(0, 3));
        setProgress(70);
        setAllPages(pages);
        setCurrentPage(1);
        setProgress(100);

        setTimeout(() => setLoading(false), 300);
      } catch (error) {
        console.error('載入頁面列表失敗:', error);
        setLoading(false);
      }
    };

    const filteredPages = React.useMemo(() => {
      console.log('=== 過濾邏輯調試 ===');
      console.log('搜尋關鍵字:', searchKeyword);
      console.log('當前分類:', currentCategory);
      console.log('所有頁面數量:', allPages.length);

      // Step 1: Filter by search keyword
      let filtered = allPages;
      if (searchKeyword.trim()) {
        const keyword = searchKeyword.toLowerCase().trim();
        filtered = allPages.filter(page => {
          const titleMatch = page.title && page.title.toLowerCase().includes(keyword);
          const descMatch = page.description && page.description.toLowerCase().includes(keyword);
          return titleMatch || descMatch;
        });
        console.log('關鍵字過濾後:', filtered.length, '筆');
      }

      // Step 2: Filter by category
      if (currentCategory !== '全部') {
        filtered = filtered.filter(page => {
          return page.categories && page.categories.includes(currentCategory);
        });
        console.log('分類過濾後:', filtered.length, '筆');
      }

      console.log('最終結果:', filtered.length, '筆');
      console.log('===================');
      return filtered;
    }, [allPages, currentCategory, searchKeyword]);

    const categoryCounts = React.useMemo(() => {
      // Filter by search keyword first
      let pagesToCount = allPages;
      if (searchKeyword.trim()) {
        const keyword = searchKeyword.toLowerCase().trim();
        pagesToCount = allPages.filter(page => {
          const titleMatch = page.title && page.title.toLowerCase().includes(keyword);
          const descMatch = page.description && page.description.toLowerCase().includes(keyword);
          return titleMatch || descMatch;
        });
      }

      const counts = { '全部': pagesToCount.length };
      pagesToCount.forEach(page => {
        if (page.categories && Array.isArray(page.categories)) {
          page.categories.forEach(cat => {
            counts[cat] = (counts[cat] || 0) + 1;
          });
        }
      });
      return counts;
    }, [allPages, searchKeyword]);

    const totalPages = Math.ceil(filteredPages.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedPages = filteredPages.slice(startIndex, startIndex + itemsPerPage);

    React.useEffect(() => {
      setCurrentPage(1);
    }, [currentCategory]);

    const handleCategoryChange = async (category) => {
      setLoading(true);
      setProgress(0);
      setCurrentCategory(category);

      setProgress(50);
      await new Promise(resolve => setTimeout(resolve, 200));
      setProgress(100);

      setTimeout(() => setLoading(false), 300);
    };

    const handleDeletePage = async (pageId) => {
      if (confirm('確定要刪除這個頁面嗎？刪除後無法恢復。')) {
        const success = await deleteStoredPage(pageId);
        if (success) {
          loadAllPages();
        } else {
          alert('刪除失敗，請重試');
        }
      }
    };

    const handleSharePage = async (pageId, title) => {
      const pageData = await getStoredPageData(pageId);
      const htmlData = await getStoredHTML(pageId);

      if (!pageData || !htmlData) {
        alert('頁面資料不完整，無法分享');
        return;
      }

      const url = `${window.location.origin}/preview.html?id=${pageId}`;
      setShareData({ title, url });
      setShowShareModal(true);
    };

    const handleCopyLink = async (pageId, title) => {
      const url = `${window.location.origin}/preview.html?id=${pageId}`;
      const text = `${title}\n${url}`;
      await navigator.clipboard.writeText(text);
      alert('連結已複製到剪貼簿');
    };

    const handleDiagnostic = async () => {
      try {
        console.log('開始執行診斷...');
        if (typeof window.checkActualRecordCount !== 'function') {
          alert('診斷工具尚未載入，請重新整理頁面後再試');
          return;
        }

        const result = await window.checkActualRecordCount();

        if (result.error) {
          alert(`診斷過程發生錯誤：${result.error}`);
          return;
        }

        setDiagnosticInfo(result);
        alert(`資料庫診斷完成！\n總資料: ${result.total} 筆\n有效資料: ${result.valid} 筆\n無效資料: ${result.invalid} 筆\n\n詳細信息請查看瀏覽器控制台`);
      } catch (error) {
        console.error('診斷失敗:', error);
        alert('診斷失敗，請查看控制台了解詳情');
      }
    };

    return (
      <div className="min-h-screen bg-gray-50" data-name="homepage" data-file="components/HomePage.js">
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 py-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  HTML代碼管理器
                  {diagnosticInfo && (
                    <span className="ml-3 text-sm font-normal text-gray-600">
                      (資料庫: {diagnosticInfo.total} 筆 | 有效: {diagnosticInfo.valid} 筆 | 無效: {diagnosticInfo.invalid} 筆)
                    </span>
                  )}
                </h1>
                <p className="text-gray-600 mt-2">創建、編輯和管理您的HTML頁面</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleDiagnostic}
                  className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors flex items-center gap-2"
                  title="檢查資料庫狀態"
                >
                  <div className="icon-activity text-lg"></div>
                  診斷
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
            <div className="max-w-md">
              <SearchBar
                searchKeyword={searchKeyword}
                onSearchChange={setSearchKeyword}
              />
            </div>
          </div>
        </header>

        <CategoryTabs
          activeCategory={currentCategory}
          onCategoryChange={handleCategoryChange}
          categoryCounts={categoryCounts}
        />

        {loading && (
          <div className="max-w-7xl mx-auto px-4 py-8">
            <LoadingProgress progress={progress} />
          </div>
        )}

        {!loading && (
          <div className="max-w-7xl mx-auto p-6">
            {paginatedPages.length === 0 ? (
              <div className="text-center py-16">
                <div className="icon-file-text text-6xl text-gray-300 mb-4"></div>
                <h3 className="text-xl font-medium text-gray-900 mb-2">
                  {currentCategory === '全部' ? '還沒有HTML頁面' : `${currentCategory}分類中還沒有頁面`}
                </h3>
                <p className="text-gray-600 mb-6">創建您的第一個HTML頁面開始吧</p>
                <button
                  onClick={() => onCreateNew(currentCategory)}
                  className="btn-primary flex items-center gap-2 mx-auto"
                >
                  <div className="icon-plus text-lg"></div>
                  創建新頁面
                </button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {paginatedPages.map((page) => (
                    <PageCard
                      key={page.pageId}
                      page={page}
                      onEdit={(pageId) => onEditPage(pageId)}
                      onDelete={() => handleDeletePage(page.pageId)}
                      onShare={() => handleSharePage(page.pageId, page.title)}
                      onCopyLink={() => handleCopyLink(page.pageId, page.title)}
                    />
                  ))}
                </div>
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                />
              </>
            )}
          </div>
        )}

        {showShareModal && (
          <ShareModal
            shareUrl={shareData.url}
            title={shareData.title}
            onClose={() => setShowShareModal(false)}
          />
        )}
      </div>
    );
  } catch (error) {
    console.error('HomePage component error:', error);
    return null;
  }
}