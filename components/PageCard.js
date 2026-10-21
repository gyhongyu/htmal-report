// 支援預覽、編輯、刪除的 PageCard 組件
function PageCard({ page, onEdit, onDelete, onShare, onCopyLink }) {
  try {
    const handlePreview = () => {
      // 🌟 優先使用優雅的 Base62 極簡短網址 (https://html.foxlink.co.in/xxxxxxx)
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
      window.open(url, '_blank');
    };

    const [isDownloading, setIsDownloading] = React.useState(false);

    const handleDownload = async () => {
      try {
        // 雙軌識別：Google Drive 雲端報告 (driveId) 或 GitHub 本地靜態報告 (fileName)
        const isDrive = Boolean(page.driveId || (!page.fileName && page.pageId));
        const targetIdentifier = page.driveId || page.fileName;

        if (!targetIdentifier) {
          console.error('缺少檔案識別碼:', page);
          alert('無法下載：缺少文件識別資訊');
          return;
        }

        setIsDownloading(true);
        console.log('[下載] 正在載入內容:', targetIdentifier, isDrive ? '(Google Drive)' : '(GitHub Reports)');

        // 透過 reportsLoader.js 獲取 HTML 內容 (支援 GAS 雲端 Drive 與 本地 reports/ 雙向請求)
        const htmlContent = await getReportHTML(targetIdentifier, isDrive);

        if (!htmlContent) {
          console.error('[下載] HTML內容為空');
          alert('無法獲取報告內容，請檢查網路連線或雲端權限');
          return;
        }

        console.log('[下載] HTML內容大小:', htmlContent.length, '字節');

        // 智能檔案名稱：標題 + 描述
        let downloadFileName = '';
        const title = (page.title || '無標題').trim();
        const description = (page.description || '').trim();

        if (description) {
          downloadFileName = `${title} ${description}.html`;
        } else {
          downloadFileName = `${title}.html`;
        }

        // 移除檔案名中的非法字元
        downloadFileName = downloadFileName.replace(/[<>:"/\\|?*]/g, '_');

        console.log('[下載] 檔案名:', downloadFileName);

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
        alert('下載失敗，請重試: ' + error.message);
      } finally {
        setIsDownloading(false);
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
                disabled={isDownloading}
                className={`p-1.5 rounded transition-colors ${
                  isDownloading 
                    ? 'text-amber-400 bg-amber-50 cursor-wait' 
                    : 'text-amber-600 hover:text-amber-700 hover:bg-amber-50'
                }`}
                title={isDownloading ? '正在從雲端載入報告...' : '下載HTML文件'}
              >
                <i className={`fas ${isDownloading ? 'fa-spinner fa-spin' : 'fa-download'} text-sm`}></i>
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