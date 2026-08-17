// 支援預覽、編輯、刪除的 PageCard 組件
function PageCard({ page, onEdit, onDelete, onShare, onCopyLink }) {
  try {
    const handlePreview = () => {
      // 若是 GAS 雲端報告 (帶 driveId 或無 fileName)，使用 preview.html?id=xxx 渲染
      if (page.driveId || !page.fileName) {
        const url = `${window.location.origin}/preview.html?id=${page.pageId}`;
        window.open(url, '_blank');
      } else {
        // 本地既有檔案直接打開
        const url = `${window.location.origin}/reports/${page.fileName}`;
        window.open(url, '_blank');
      }
    };

    const handleDownload = async () => {
      try {
        // page 对象来自 reports-index.json，包含 fileName 属性
        const fileName = page.fileName;

        if (!fileName) {
          console.error('無文件名:', page);
          alert('無法下載：缺少文件信息');
          return;
        }

        console.log('[下載] 正在加載文件:', fileName);

        // 从 reports/ 文件夹加载 HTML 内容
        const htmlContent = await getReportHTML(fileName);

        if (!htmlContent) {
          console.error('[下載] HTML內容為空');
          alert('無法獲取報告內容');
          return;
        }

        console.log('[下載] HTML內容大小:', htmlContent.length, '字節');

        // 智能文件名：标题 + 描述
        let downloadFileName = '';
        const title = (page.title || '無標題').trim();
        const description = (page.description || '').trim();

        if (description) {
          downloadFileName = `${title} ${description}.html`;
        } else {
          downloadFileName = `${title}.html`;
        }

        // 移除文件名中的非法字符
        downloadFileName = downloadFileName.replace(/[<>:"/\\|?*]/g, '_');

        console.log('[下載] 文件名:', downloadFileName);

        const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
        const url = URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = url;
        link.download = downloadFileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        URL.revokeObjectURL(url);

        console.log('[下載] 成功');
      } catch (error) {
        console.error('[下載] 失敗:', error);
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
                className="flex items-center gap-1 px-2.5 py-1.5 text-emerald-600 hover:text-white hover:bg-emerald-600 border border-emerald-600 rounded text-xs font-medium transition-colors"
                title="全螢幕開啟報告"
              >
                <i className="fas fa-external-link-alt"></i>
                <span>預覽</span>
              </button>
              
              {onEdit && (
                <button
                  onClick={() => onEdit(page)}
                  className="flex items-center gap-1 px-2.5 py-1.5 text-blue-600 hover:text-white hover:bg-blue-600 border border-blue-600 rounded text-xs font-medium transition-colors"
                  title="編輯報告內容"
                >
                  <i className="fas fa-edit"></i>
                  <span>編輯</span>
                </button>
              )}

              {/* 只有 Google 雲端報告才具備線上刪除功能 (避免刪除 GitHub 靜態檔案引發混亂) */}
              {page.driveId && onDelete && (
                <button
                  onClick={() => onDelete(page)}
                  className="flex items-center gap-1 px-2.5 py-1.5 text-rose-600 hover:text-white hover:bg-rose-600 border border-rose-600 rounded text-xs font-medium transition-colors"
                  title="從 Google 雲端刪除此報告"
                >
                  <i className="fas fa-trash-alt"></i>
                  <span>刪除</span>
                </button>
              )}
            </div>
            
            <div className="flex items-center gap-1">
              <button
                onClick={handleDownload}
                className="p-1.5 text-amber-600 hover:text-amber-700 hover:bg-amber-50 rounded transition-colors"
                title="下載HTML文件"
              >
                <i className="fas fa-download text-sm"></i>
              </button>
              <button
                onClick={onCopyLink}
                className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded transition-colors"
                title="複製獨立連結"
              >
                <i className="fas fa-copy text-sm"></i>
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