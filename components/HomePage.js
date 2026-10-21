function HomePage({ onCreateNew, onEditPage, onDeletePage, searchKeyword, setSearchKeyword }) {
  try {
    const [allPages, setAllPages] = React.useState([]);
    const [loading, setLoading] = React.useState(true);
    const [progress, setProgress] = React.useState(0);
    const [showShareModal, setShowShareModal] = React.useState(false);
    const [shareData, setShareData] = React.useState({ title: '', url: '' });
    const [currentPage, setCurrentPage] = React.useState(1);
    const [isCopying, setIsCopying] = React.useState(false);
    const [baseUrl, setBaseUrl] = React.useState('');
    const itemsPerPage = 21;

    React.useEffect(() => {
      loadAllPages();
      loadConfig();
    }, []);

    const loadConfig = async () => {
      try {
        const data = await getConfigStatus();
        if (data.config && data.config.baseUrl) {
          setBaseUrl(data.config.baseUrl);
        }
      } catch (error) {
        console.error('加載配置失敗:', error);
      }
    };

    const loadAllPages = async () => {
      setLoading(true);
      setProgress(0);

      try {
        setProgress(30);
        console.log('開始載入所有頁面...');
        const pages = await getAllStoredPages((updatedPages) => {
          console.log('⚡ SWR 背景同步回傳，無縫更新頁面清單，總數:', updatedPages.length);
          setAllPages(updatedPages);
        });
        console.log('getAllStoredPages 首屏頁面數:', pages.length);
        console.log('頁面內容預覽:', pages.slice(0, 3));
        setProgress(70);
        setAllPages(pages);
        setCurrentPage(1);
        setProgress(100);

        setTimeout(() => setLoading(false), 300);
      } catch (error) {
        console.error('加載頁面列表失敗:', error);
        setLoading(false);
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

    const filteredPages = React.useMemo(() => {
      // 純關鍵字極速檢索 (標題 + 摘要)
      if (!searchKeyword.trim()) {
        return allPages;
      }
      const keyword = searchKeyword.toLowerCase().trim();
      return allPages.filter(page => {
        const titleMatch = page.title && page.title.toLowerCase().includes(keyword);
        const descMatch = page.description && page.description.toLowerCase().includes(keyword);
        return titleMatch || descMatch;
      });
    }, [allPages, searchKeyword]);

    const totalPages = Math.ceil(filteredPages.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedPages = filteredPages.slice(startIndex, startIndex + itemsPerPage);

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
      try {
        // 找到对应的 page 获取 fileName
        const page = allPages.find(p => p.pageId === pageId);
        if (!page) {
          alert('頁面資料不存在，無法分享');
          return;
        }

        let url = '';
        if (typeof window.getShortReportUrl === 'function') {
          url = window.getShortReportUrl(page.pageId);
        }
        if (!url) {
          if (page.driveId || !page.fileName) {
            const driveParam = page.driveId ? `&driveId=${page.driveId}` : '';
            url = `${window.location.origin}/preview.html?id=${page.pageId}${driveParam}`;
          } else {
            url = `${window.location.origin}/reports/${page.fileName}`;
          }
        }

        // 优先使用原生分享 API（移动设备会弹出 WhatsApp/WeChat/Line 等）
        if (navigator.share) {
          try {
            await navigator.share({
              title: title,
              text: page.description || title,
              url: url
            });
            console.log('[分享] 成功使用原生分享');
          } catch (err) {
            // 用户取消分享，不需要提示
            if (err.name !== 'AbortError') {
              console.error('[分享] 失败:', err);
              // 降级：复制链接
              await navigator.clipboard.writeText(url);
              alert('分享失敗，連結已複製到剪貼簿');
            }
          }
        } else {
          // 降级方案：直接复制链接（桌面浏览器）
          await navigator.clipboard.writeText(url);
          alert('分享連結已複製到剪貼簿');
          console.log('[分享] 使用降级方案（复制链接）');
        }
      } catch (error) {
        console.error('[分享] 错误:', error);
        alert('分享失敗，請重試');
      }
    };

    const handleCopyLink = async (pageId, title) => {
      const page = allPages.find(p => p.pageId === pageId);
      if (!page) {
        alert('無法複製連結');
        return;
      }

      // 優先生成優雅的 33 字元 Base62 短網址 (https://html.foxlink.co.in/xxxxxxx)
      let url = '';
      if (typeof window.getShortReportUrl === 'function') {
        url = window.getShortReportUrl(page.pageId);
      }

      // 降級容錯
      if (!url) {
        if (page.driveId || !page.fileName) {
          const driveParam = page.driveId ? `&driveId=${page.driveId}` : '';
          url = `${window.location.origin}/preview.html?id=${page.pageId}${driveParam}`;
        } else {
          url = `${window.location.origin}/reports/${page.fileName}`;
        }
      }

      const text = `${title}\n${url}`;
      await navigator.clipboard.writeText(text);
      alert('獨立報告短連結已複製到剪貼簿：\n' + url);
    };

    return (
      <div className="min-h-screen bg-gray-50 relative" data-name="homepage" data-file="components/HomePage.js">
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

        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 py-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  HTML代碼管理器
                </h1>
                <p className="text-gray-600 mt-2">查看和分享您的HTML頁面</p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="max-w-md flex-1">
                <SearchBar
                  searchKeyword={searchKeyword}
                  onSearchChange={setSearchKeyword}
                />
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
          </div>
        </header>

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
                  {searchKeyword.trim() ? `找不到符合「${searchKeyword}」的報告` : '還沒有HTML頁面'}
                </h3>
                <p className="text-gray-600 mb-6">
                  {searchKeyword.trim() ? '請嘗試更換關鍵字重新搜尋' : '創建您的第一個HTML頁面開始吧'}
                </p>
                <button
                  onClick={() => onCreateNew()}
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
                      onEdit={onEditPage ? () => onEditPage(page) : null}
                      onDelete={onDeletePage ? (p) => onDeletePage(p || page) : null}
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