function ShareModal({ shareUrl, title, onClose }) {
  try {
    const [copied, setCopied] = React.useState(false);

    const handleCopy = async () => {
      try {
        const text = title ? `${title}\n${shareUrl}` : shareUrl;
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error('复制失败:', err);
      }
    };

    const handleOverlayClick = (e) => {
      if (e.target === e.currentTarget) {
        onClose();
      }
    };

    return (
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        onClick={handleOverlayClick}
        data-name="share-modal" 
        data-file="components/ShareModal.js"
      >
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <div className="icon-share text-xl text-[var(--primary-color)]"></div>
                分享您的網頁
              </h3>
              <button 
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600"
              >
                <div className="icon-x text-xl"></div>
              </button>
            </div>
            
            <p className="text-[var(--text-secondary)] mb-4">
              您的HTML代碼已儲存，可以透過以下連結分享給其他人訪問：
            </p>
            
            <div className="bg-gray-50 p-3 rounded-lg border mb-4">
              {title && (
                <div className="mb-2">
                  <div className="text-sm font-medium text-gray-700">{title}</div>
                </div>
              )}
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={shareUrl}
                  readOnly
                  className="flex-1 bg-transparent text-sm text-gray-700 outline-none"
                />
                <button
                  onClick={handleCopy}
                  className={`px-3 py-1 rounded text-sm transition-colors ${
                    copied 
                      ? 'bg-[var(--success-color)] text-white' 
                      : 'bg-[var(--primary-color)] text-white hover:bg-[var(--primary-hover)]'
                  }`}
                >
                  {copied ? '已複製' : '複製'}
                </button>
              </div>
            </div>
            
            <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
              <div className="icon-info text-base"></div>
              <span>連結永久有效，其他人可以透過此連結查看您的網頁</span>
            </div>
          </div>
        </div>
      </div>
    );
  } catch (error) {
    console.error('ShareModal component error:', error);
    return null;
  }
}