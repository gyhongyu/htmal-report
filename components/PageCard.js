// 只读版本的 PageCard - 用于 GitHub Pages
function PageCard({ page, onShare, onCopyLink }) {
  try {
    const handlePreview = () => {
      const url = `${window.location.origin}/preview.html?id=${page.pageId}`;
      window.open(url, '_blank');
    };

    const formatDate = (dateString) => {
      const date = new Date(dateString);
      return date.toLocaleDateString('zh-CN') + ' ' + date.toLocaleTimeString('zh-CN', {
        hour: '2-digit',
        minute: '2-digit'
      });
    };

    return (
      <div
        className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-all duration-200"
        data-name="page-card"
        data-file="components/PageCard.js"
      >
        <div className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 line-clamp-2 mb-1">
                    {page.title || '無標題頁面'}
                  </h3>
                  {page.categories && page.categories.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {page.categories.slice(0, 3).map((cat, idx) => (
                        <span key={idx} className="inline-block px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded">
                          {cat}
                        </span>
                      ))}
                      {page.categories.length > 3 && (
                        <span className="inline-block px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded">
                          +{page.categories.length - 3}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
              <p className="text-gray-600 text-sm line-clamp-3 mb-3">
                {page.description || '暫無描述'}
              </p>
              <div className="text-xs text-gray-500">
                創建時間: {formatDate(page.createdAt)}
              </div>
              {page.updatedAt !== page.createdAt && (
                <div className="text-xs text-gray-500">
                  更新時間: {formatDate(page.updatedAt)}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t">
            <div className="flex items-center gap-2">
              <button
                onClick={handlePreview}
                className="flex items-center gap-1 px-3 py-1.5 text-green-600 hover:text-white hover:bg-green-600 border border-green-600 rounded text-sm transition-colors"
                title="預覽頁面"
              >
                <div className="icon-external-link text-sm"></div>
                <span>預覽</span>
              </button>
              <button
                onClick={onShare}
                className="flex items-center gap-1 px-3 py-1.5 text-purple-600 hover:text-white hover:bg-purple-600 border border-purple-600 rounded text-sm transition-colors"
                title="分享頁面"
              >
                <div className="icon-share text-sm"></div>
                <span>分享</span>
              </button>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={onCopyLink}
                className="p-1.5 text-gray-600 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
                title="複製連結"
              >
                <div className="icon-copy text-base"></div>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  } catch (error) {
    console.error('PageCard component error:', error);
    return null;
  }
}