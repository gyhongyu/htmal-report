function PageCard({ page, onEdit, onDelete, onShare, onCopyLink }) {
  try {
    const handlePreview = () => {
      const url = `${window.location.origin}/preview.html?id=${page.pageId}`;
      window.open(url, '_blank');
    };

    const handleDownload = () => {
      try {
        const htmlContent = page.htmlCode || '';
        const fileName = (page.title || '無標題頁面').replace(/[<>:"/\\|?*]/g, '_') + '.html';
        
        const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        URL.revokeObjectURL(url);
      } catch (error) {
        console.error('下載失敗:', error);
        alert('下載失敗，請重試');
      }
    };

    const formatDate = (dateString) => {
      const date = new Date(dateString);
      return date.toLocaleDateString('zh-CN') + ' ' + date.toLocaleTimeString('zh-CN', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    };

    const handleDoubleClick = () => {
      onEdit(page.pageId);
    };

    return (
      <div 
        className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-all duration-200 group cursor-pointer" 
        onDoubleClick={handleDoubleClick}
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
                <button
                  onClick={() => onEdit(page.pageId)}
                  className="ml-2 p-1.5 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-full transition-colors flex-shrink-0"
                  title="快速编辑"
                >
                  <div className="icon-edit text-base"></div>
                </button>
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
            <div className="flex items-center gap-1">
              <button
                onClick={() => onEdit(page.pageId)}
                className="flex items-center gap-1 px-2 py-1 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded text-sm transition-colors"
                title="編輯頁面"
              >
                <div className="icon-edit text-sm"></div>
                <span>編輯</span>
              </button>
              <button
                onClick={handlePreview}
                className="flex items-center gap-1 px-2 py-1 text-green-600 hover:text-green-700 hover:bg-green-50 rounded text-sm transition-colors"
                title="預覽頁面"
              >
                <div className="icon-external-link text-sm"></div>
                <span>預覽</span>
              </button>
              <button
                onClick={onShare}
                className="flex items-center gap-1 px-2 py-1 text-purple-600 hover:text-purple-700 hover:bg-purple-50 rounded text-sm transition-colors"
                title="分享頁面"
              >
                <div className="icon-share text-sm"></div>
                <span>分享</span>
              </button>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={handleDownload}
                className="p-1 text-orange-600 hover:text-orange-700 hover:bg-orange-50 rounded transition-colors"
                title="下載HTML文件"
              >
                <div className="icon-download text-sm"></div>
              </button>
              <button
                onClick={onCopyLink}
                className="p-1 text-gray-600 hover:text-gray-700 hover:bg-gray-50 rounded transition-colors"
                title="複製連結"
              >
                <div className="icon-copy text-sm"></div>
              </button>
              <button
                onClick={onDelete}
                className="p-1 text-red-600 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                title="刪除頁面"
              >
                <div className="icon-trash-2 text-sm"></div>
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