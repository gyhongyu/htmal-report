function PreviewPanel({ htmlCode }) {
  try {
    const iframeRef = React.useRef(null);

    React.useEffect(() => {
      if (iframeRef.current) {
        const iframe = iframeRef.current;
        const doc = iframe.contentDocument || iframe.contentWindow.document;
        doc.open();
        doc.write(htmlCode);
        doc.close();
      }
    }, [htmlCode]);

    return (
      <div className="bg-white rounded-lg shadow-sm border h-full flex flex-col" data-name="preview-panel" data-file="components/PreviewPanel.js">
        <div className="p-4 border-b bg-gray-50 rounded-t-lg">
          <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <div className="icon-monitor text-xl text-[var(--success-color)]"></div>
            即時預覽
          </h2>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            您的HTML代碼的即時預覽效果
          </p>
        </div>
        
        <div className="flex-1 p-4">
          <iframe
            ref={iframeRef}
            className="preview-frame"
            title="HTML預覽"
            sandbox="allow-scripts allow-same-origin"
          />
        </div>
        
        <div className="p-4 border-t bg-gray-50 rounded-b-lg">
          <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
            <div className="icon-info text-base"></div>
            <span>預覽會自動更新，支援HTML、CSS和JavaScript</span>
          </div>
        </div>
      </div>
    );
  } catch (error) {
    console.error('PreviewPanel component error:', error);
    return null;
  }
}