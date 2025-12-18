class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">載入出錯</h1>
            <p className="text-gray-600 mb-4">抱歉，頁面載入時出現了問題</p>
            <button onClick={() => window.location.reload()} className="btn-primary">
              重新載入
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function PreviewApp() {
  try {
    const [htmlContent, setHtmlContent] = React.useState('');
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState(null);

    React.useEffect(() => {
      const loadPage = async () => {
        const urlParams = new URLSearchParams(window.location.search);
        const pageId = urlParams.get('id');
        
        console.log('預覽頁面載入 - pageId:', pageId);
        
        if (pageId) {
          try {
            const storedHTML = await getStoredHTML(pageId);
            console.log('獲取到的HTML內容:', storedHTML ? '存在' : '不存在');
            
            if (storedHTML) {
              setHtmlContent(storedHTML);
            } else {
              setError('頁面不存在或已過期');
            }
          } catch (error) {
            console.error('載入頁面失敗:', error);
            setError('頁面載入失敗');
          }
        } else {
          setError('無效的頁面連結');
        }
        
        setLoading(false);
      };
      
      loadPage();
    }, []);

    if (loading) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="icon-loader-2 text-4xl text-[var(--primary-color)] animate-spin mb-4"></div>
            <p className="text-gray-600">正在載入頁面...</p>
          </div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="icon-alert-circle text-4xl text-red-500 mb-4"></div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">頁面未找到</h1>
            <p className="text-gray-600 mb-4">{error}</p>
            <a href="index.html" className="btn-primary">
              返回首頁
            </a>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen" data-name="preview-app" data-file="preview-app.js">
        <iframe
          srcDoc={htmlContent}
          className="w-full h-screen border-0"
          title="HTML預覽"
          sandbox="allow-scripts allow-same-origin"
        />
      </div>
    );
  } catch (error) {
    console.error('PreviewApp component error:', error);
    return null;
  }
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <ErrorBoundary>
    <PreviewApp />
  </ErrorBoundary>
);