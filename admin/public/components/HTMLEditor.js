function HTMLEditor({ htmlCode, onChange }) {
  try {
    return (
      <div className="bg-white rounded-lg shadow-sm border h-full flex flex-col" data-name="html-editor" data-file="components/HTMLEditor.js">
        <div className="p-4 border-b bg-gray-50 rounded-t-lg">
          <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <div className="icon-code text-xl text-[var(--primary-color)]"></div>
            HTML代碼編輯器
          </h2>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            在下方輸入您的HTML代碼，右側將即時顯示預覽效果
          </p>
        </div>
        
        <div className="flex-1 p-4">
          <textarea
            value={htmlCode}
            onChange={(e) => onChange(e.target.value)}
            className="input-field h-full resize-none font-mono text-sm"
            placeholder="請輸入您的HTML代碼..."
            spellCheck={false}
          />
        </div>
        
        <div className="p-4 border-t bg-gray-50 rounded-b-lg">
          <div className="flex items-center justify-between text-sm text-[var(--text-secondary)]">
            <span>字符數: {htmlCode.length}</span>
            <span>行數: {htmlCode.split('\n').length}</span>
          </div>
        </div>
      </div>
    );
  } catch (error) {
    console.error('HTMLEditor component error:', error);
    return null;
  }
}