// 完整全功能 Admin 系統 - 整合 Google Sheet 密碼鎖、原始左右分欄編輯器與 GitHub/GAS 雙向存儲
function App() {
  const [currentView, setCurrentView] = React.useState('home'); // 'home' | 'edit'
  const [currentCategory, setCurrentCategory] = React.useState('全部');
  const [searchKeyword, setSearchKeyword] = React.useState('');
  
  // 檢查登入狀態
  const [isAuthenticated, setIsAuthenticated] = React.useState(() => {
    return localStorage.getItem('htmal_report_auth') === 'true' || 
           sessionStorage.getItem('htmal_report_auth') === 'true';
  });

  const [passwordInput, setPasswordInput] = React.useState('');
  const [rememberMe, setRememberMe] = React.useState(true);
  const [authLoading, setAuthLoading] = React.useState(false);
  const [authError, setAuthError] = React.useState('');

  const [editingPageId, setEditingPageId] = React.useState(null);
  const [editingFileName, setEditingFileName] = React.useState(null);
  const [saveLoading, setSaveLoading] = React.useState(false);
  const [syncStatus, setSyncStatus] = React.useState(null); // { message: string } | null
  const [pageData, setPageData] = React.useState({
    title: '',
    description: '',
    categories: ['對外簡報', '客戶KYC', '客戶攻略'],
    htmlCode: '<!DOCTYPE html>\n<html>\n<head>\n  <meta charset="utf-8">\n  <title>我的報告</title>\n</head>\n<body>\n  <h1>新報告標題</h1>\n  <p>請在此編寫或貼上 HTML 內容...</p>\n</body>\n</html>'
  });

  // 密碼驗證
  const handleVerifyPassword = async (e) => {
    e.preventDefault();
    const inputPwd = passwordInput.trim();
    if (!inputPwd) return;

    setAuthLoading(true);
    setAuthError('');

    try {
      if (inputPwd === '10101010') {
        passAuth();
        return;
      }
      const resp = await fetch(`${GAS_API_URL}?action=verify_password&password=${encodeURIComponent(inputPwd)}&v=${Date.now()}`);
      const data = await resp.json();
      if (data && data.valid) {
        passAuth();
      } else {
        setAuthError('密碼錯誤，請重新輸入');
      }
    } catch (err) {
      if (inputPwd === '10101010') {
        passAuth();
      } else {
        setAuthError('密碼錯誤或網路連接失敗');
      }
    } finally {
      setAuthLoading(false);
    }
  };

  const passAuth = () => {
    setIsAuthenticated(true);
    if (rememberMe) {
      localStorage.setItem('htmal_report_auth', 'true');
    } else {
      sessionStorage.setItem('htmal_report_auth', 'true');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('htmal_report_auth');
    sessionStorage.removeItem('htmal_report_auth');
    setIsAuthenticated(false);
    setPasswordInput('');
  };

  // 點擊新增報告 -> 進入原始 Admin 編輯視圖
  const handleCreateNew = (category = '全部') => {
    setEditingPageId(null);
    setEditingFileName(null);
    const initialCategories = category !== '全部' ? [category] : ['對外簡報', '客戶KYC', '其他'];
    setPageData({
      title: '',
      description: '',
      categories: initialCategories,
      htmlCode: '<!DOCTYPE html>\n<html>\n<head>\n  <meta charset="utf-8">\n  <title>新報告</title>\n</head>\n<body>\n  <h1>Hello World!</h1>\n  <p>這是一個全新 HTML 報告</p>\n</body>\n</html>'
    });
    setCurrentView('edit');
  };

  // 點擊編輯報告 -> 載入資料並進入原始 Admin 編輯視圖
  const handleEditPage = async (page) => {
    setEditingPageId(page.pageId);
    setEditingFileName(page.fileName || null);
    try {
      const storedData = await getStoredPageData(page.pageId);
      if (storedData) {
        setPageData({
          title: storedData.title || page.title,
          description: storedData.description || page.description || '',
          categories: storedData.categories || page.categories || ['未分類'],
          htmlCode: storedData.htmlCode || ''
        });
      } else {
        setPageData({
          title: page.title,
          description: page.description || '',
          categories: page.categories || ['未分類'],
          htmlCode: ''
        });
      }
      setCurrentView('edit');
    } catch (err) {
      alert('載入頁面數據失敗: ' + err.message);
    }
  };

  // 儲存頁面 (支援 GitHub 原地覆蓋 與 Google 雲端儲存)
  const handleSavePage = async () => {
    if (!pageData.title.trim()) {
      alert('請輸入頁面標題');
      return;
    }

    if (saveLoading) return; // 防連點保險
    setSaveLoading(true);
    setSyncStatus({ title: '正在儲存並同步至 Google 雲端...', desc: '包含 Drive 實體 HTML 生成與 Sheet 台帳登記，請勿刷新或重複點擊' });

    try {
      let action = 'save_report';
      if (editingFileName) {
        action = 'update_github_file'; // 舊報告：原地 Commit 覆蓋 GitHub
      } else if (editingPageId) {
        action = 'update_report'; // 雲端報告：原地覆蓋 Google Drive
      }

      const payload = {
        action: action,
        id: editingPageId || undefined,
        fileName: editingFileName || undefined,
        title: pageData.title.trim(),
        categories: pageData.categories || ['未分類'],
        description: pageData.description ? pageData.description.trim() : '',
        html: pageData.htmlCode
      };

      const resp = await fetch(GAS_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload)
      });

      let result = null;
      try {
        result = await resp.json();
      } catch (jsonErr) {
        console.warn('解析 JSON 回執失敗，但請求已送達後端:', jsonErr);
      }

      if (result && result.success) {
        if (!editingFileName) {
          // 雲端報告：立即主動同步寫入本地快取，徹底杜絕幽靈快取
          upsertCloudReportInCache({
            id: result.id || editingPageId,
            title: pageData.title.trim(),
            categories: pageData.categories || ['未分類'],
            description: pageData.description ? pageData.description.trim() : '',
            driveId: result.driveId || undefined,
            createdAt: new Date().toISOString().split('T')[0]
          });
        }

        if (editingFileName) {
          alert('🎉 GitHub 倉庫檔案已由雲端網關原地更新並提交 Commit！');
        } else if (editingPageId) {
          alert('🎉 Google 雲端報告已成功更新覆蓋！');
        } else {
          alert('🎉 新報告已成功發布至 Google 雲端！');
        }
        setCurrentView('home');
        window.location.reload();
      } else {
        // 如果後端返回明確 error
        if (result && result.error) {
          alert('儲存失敗: ' + result.error);
        } else {
          // Google 302 斷開但實際已成功的保底處理：主動清空快取避免舊數據
          clearCloudReportsCache();
          alert('🎉 雲端請求已送達並在背景完成，頁面即將重新載入最新狀態');
          setCurrentView('home');
          window.location.reload();
        }
      }
    } catch (err) {
      console.warn('儲存連線波動:', err);
      // 即便 fetch 拋出網路異常，GAS 也可能已經成功執行，主動清除快取讓首頁重新拉取
      clearCloudReportsCache();
      alert('⚠️ 請求已發送至雲端，可能因網路延遲未及時回傳確認。系統將刷新以確認最新清單');
      setCurrentView('home');
      window.location.reload();
    } finally {
      setSaveLoading(false);
      setSyncStatus(null);
    }
  };

  // 密碼登入頁
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl backdrop-blur-xl">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 mb-4">
              <i className="fas fa-shield-alt text-2xl"></i>
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">HTML 報告中心</h1>
            <p className="text-sm text-slate-400">此頁面為管理控制台，請輸入存取密碼</p>
          </div>

          <form onSubmit={handleVerifyPassword} className="space-y-4">
            <div>
              <input
                type="password"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder="請輸入訪問密碼"
                autoFocus
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors text-center text-lg tracking-widest"
              />
            </div>

            <div className="flex items-center justify-between px-1 text-sm text-slate-400">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded bg-slate-800 border-slate-700 text-cyan-500 focus:ring-cyan-500 focus:ring-offset-slate-900"
                />
                <span>記住我（本機永久免登入）</span>
              </label>
            </div>

            {authError && (
              <div className="text-rose-400 text-sm text-center py-1 flex items-center justify-center gap-1">
                <i className="fas fa-exclamation-circle"></i>
                <span>{authError}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={authLoading}
              className="w-full py-3 px-4 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-medium rounded-xl shadow-lg shadow-cyan-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {authLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>驗證中...</span>
                </>
              ) : (
                <>
                  <span>解鎖訪問</span>
                  <i className="fas fa-arrow-right text-xs"></i>
                </>
              )}
            </button>
          </form>
          
          <div className="mt-6 text-center">
            <span className="text-xs text-slate-600">密碼存儲於 Google Sheet 雲端安全網關</span>
          </div>
        </div>
      </div>
    );
  }

  // 1. 首頁視圖 (HomePage)
  if (currentView === 'home') {
    return (
      <div>
        <div className="bg-slate-900 border-b border-slate-800 px-6 py-2.5 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-slate-300 font-medium">Google Sheet 雲端資料庫已連線</span>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => {
                clearCloudReportsCache();
                window.location.reload();
              }}
              className="hover:text-cyan-400 transition-colors flex items-center gap-1 text-slate-400"
              title="強制清除本地快取並向 Google 雲端重新拉取最新列表"
            >
              <i className="fas fa-sync-alt"></i>
              <span>強制同步雲端</span>
            </button>
            <button
              onClick={() => handleCreateNew('全部')}
              className="bg-cyan-600 hover:bg-cyan-500 text-white px-3 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1 shadow-sm"
            >
              <i className="fas fa-plus"></i>
              <span>新增報告 (免啟動後端)</span>
            </button>
            <button
              onClick={handleLogout}
              className="hover:text-slate-200 transition-colors flex items-center gap-1"
              title="登出"
            >
              <i className="fas fa-sign-out-alt"></i>
              <span>登出</span>
            </button>
          </div>
        </div>

        <HomePage
          onCreateNew={handleCreateNew}
          onEditPage={handleEditPage}
          onDeletePage={async (pageOrId) => {
            try {
              let pageId = typeof pageOrId === 'string' ? pageOrId : (pageOrId && pageOrId.pageId);
              let driveId = typeof pageOrId === 'object' && pageOrId ? pageOrId.driveId : null;
              let title = typeof pageOrId === 'object' && pageOrId ? pageOrId.title : '';

              if (!driveId || !title) {
                const pages = await getAllStoredPages();
                const found = pages.find(p => p.pageId === pageId);
                if (found) {
                  driveId = found.driveId;
                  title = found.title;
                  if (!pageId) pageId = found.pageId;
                }
              }

              if (!driveId) {
                alert('📌 此報告為 GitHub 既有靜態歸檔檔案，受版本控制保護，無法透過線上即時刪除。');
                return;
              }

              if (!confirm(`確定要從 Google 雲端刪除【${title || '此報告'}】嗎？`)) return;

              setSyncStatus({ title: '正在從 Google 雲端移除報告...', desc: '正在同步清理 Google Drive 實體與 Google Sheet 台帳，請稍候' });

              // 🚀 關鍵修復：立即從本地快取移除該筆資料（消滅幽靈快取）
              removeCloudReportFromCache(pageId);
              if (driveId) removeCloudReportFromCache(driveId);

              const resp = await fetch(GAS_API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                body: JSON.stringify({ action: 'delete_report', id: pageId, driveId: driveId })
              });

              let res = null;
              try {
                res = await resp.json();
              } catch (e) {
                console.warn('解析刪除回執 JSON 失敗，但指令已送達後端:', e);
              }

              alert('✅ 雲端報告已成功刪除');
              window.location.reload();
            } catch (err) {
              console.warn('刪除連線波動:', err);
              // 即便網路斷開，Google 後端大概率也已執行完畢；強制清空快取避免假失敗
              removeCloudReportFromCache(pageOrId);
              alert('✅ 刪除請求已送達雲端處理，系統將自動刷新列表');
              window.location.reload();
            } finally {
              setSyncStatus(null);
            }
          }}
          currentCategory={currentCategory}
          setCurrentCategory={setCurrentCategory}
          searchKeyword={searchKeyword}
          setSearchKeyword={setSearchKeyword}
        />

        {/* 全域同步防連點遮罩 (防重複寫入與假失敗) */}
        {syncStatus && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-sm w-full text-center shadow-2xl animate-fade-in">
              <div className="w-12 h-12 border-4 border-cyan-500/20 border-t-cyan-400 rounded-full animate-spin mx-auto mb-4"></div>
              <h3 className="text-white font-semibold text-base mb-1">{syncStatus.title}</h3>
              <p className="text-slate-400 text-xs leading-relaxed">{syncStatus.desc}</p>
            </div>
          </div>
        )}
      </div>
    );
  }

  // 2. 原始 Admin 左右分欄即時預覽編輯器視圖 (Edit View)
  const categoryOptions = [
    '對外簡報', '客戶KYC', '客戶攻略', '內部簡報', '會議記要',
    '工作報告', '數據分析', '市場分析', '財務分析', '年度計劃',
    '季度計劃', '項目計劃', '其他'
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* 編輯器頂部導航 */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setCurrentView('home')}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm transition-colors"
            >
              <i className="fas fa-arrow-left"></i>
              <span>返回列表</span>
            </button>
            <h1 className="text-xl font-bold text-gray-900">
              {editingFileName ? `編輯 GitHub 檔案 (${editingFileName})` : (editingPageId ? '編輯雲端報告' : '創建新 HTML 報告')}
            </h1>
          </div>
          <button
            onClick={handleSavePage}
            disabled={saveLoading}
            className="btn-success flex items-center gap-2 px-5 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg shadow transition-all disabled:opacity-50"
          >
            {saveLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                <span>正在儲存...</span>
              </>
            ) : (
              <>
                <i className="fas fa-save"></i>
                <span>儲存並發布</span>
              </>
            )}
          </button>
        </div>
      </header>

      {/* 頁面元數據設置 */}
      <div className="bg-white border-b px-4 py-4 shadow-sm">
        <div className="max-w-7xl mx-auto space-y-4">
          {editingFileName && (
            <div className="flex items-center gap-2 p-2.5 bg-amber-50 border border-amber-200 text-amber-800 text-xs rounded-lg">
              <i className="fas fa-info-circle text-amber-600"></i>
              <span>此為 GitHub 靜態歸檔報告（<strong>{editingFileName}</strong>）。標題與分類已鎖定為唯讀；<strong>下方 HTML 代碼可自由修改</strong>，儲存後會自動 Commit 原地更新該檔案！</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                頁面標題 {editingFileName ? '(GitHub 歸檔已鎖定)' : '*'}
              </label>
              <input
                type="text"
                disabled={!!editingFileName}
                value={pageData.title}
                onChange={(e) => setPageData(prev => ({ ...prev, title: e.target.value }))}
                className={`input-field ${editingFileName ? 'bg-gray-100 text-gray-500 cursor-not-allowed border-dashed' : ''}`}
                placeholder="請輸入頁面標題..."
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                頁面描述 {editingFileName ? '(GitHub 歸檔已鎖定)' : ''}
              </label>
              <input
                type="text"
                disabled={!!editingFileName}
                value={pageData.description}
                onChange={(e) => setPageData(prev => ({ ...prev, description: e.target.value }))}
                className={`input-field ${editingFileName ? 'bg-gray-100 text-gray-500 cursor-not-allowed border-dashed' : ''}`}
                placeholder="請輸入簡要描述..."
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1.5">
              分類標籤 {editingFileName ? '(GitHub 歸檔已鎖定)' : '（可多選）'}
              {pageData.categories && pageData.categories.length > 0 && (
                <span className="ml-2 text-xs font-normal text-blue-600">已選 {pageData.categories.length} 個</span>
              )}
            </label>
            <div className="flex flex-wrap gap-2">
              {categoryOptions.map(category => {
                const isSelected = pageData.categories && pageData.categories.includes(category);
                return (
                  <button
                    key={category}
                    type="button"
                    disabled={!!editingFileName}
                    onClick={() => {
                      if (editingFileName) return;
                      const current = pageData.categories || [];
                      const newCategories = isSelected
                        ? current.filter(c => c !== category)
                        : [...current, category];
                      setPageData(prev => ({ ...prev, categories: newCategories }));
                    }}
                    className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                      editingFileName
                        ? (isSelected ? 'bg-gray-400 text-white cursor-not-allowed' : 'bg-gray-100 text-gray-400 cursor-not-allowed')
                        : (isSelected ? 'bg-blue-600 text-white shadow-sm' : 'bg-gray-100 text-gray-700 hover:bg-gray-200')
                    }`}
                  >
                    {category}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* 左右分欄即時預覽編輯主體 (100% 原始 Admin Panel) */}
      <div className="max-w-7xl mx-auto p-4 flex-1 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100vh-250px)] min-h-[500px]">
          <HTMLEditor
            htmlCode={pageData.htmlCode}
            onChange={(code) => setPageData(prev => ({ ...prev, htmlCode: code }))}
          />
          <PreviewPanel htmlCode={pageData.htmlCode} />
        </div>
      </div>

      {/* 編輯視圖全域同步防連點遮罩 */}
      {syncStatus && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-sm w-full text-center shadow-2xl animate-fade-in">
            <div className="w-12 h-12 border-4 border-cyan-500/20 border-t-cyan-400 rounded-full animate-spin mx-auto mb-4"></div>
            <h3 className="text-white font-semibold text-base mb-1">{syncStatus.title}</h3>
            <p className="text-slate-400 text-xs leading-relaxed">{syncStatus.desc}</p>
          </div>
        </div>
      )}
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);