// 简化的只读版本 App
// 仅展示HomePage，移除所有编辑功能

function App() {
  const [currentCategory, setCurrentCategory] = React.useState('全部');
  const [searchKeyword, setSearchKeyword] = React.useState('');

  // GitHub Pages 版本：只读模式
  const handleCreateOrEdit = () => {
    alert('此为只读查看版本\n\n如需创建或编辑报告，请使用本地 Admin 管理后台\n\n详情请查看 README.md');
  };

  return (
    <HomePage
      currentCategory={currentCategory}
      setCurrentCategory={setCurrentCategory}
      searchKeyword={searchKeyword}
      setSearchKeyword={setSearchKeyword}
    />
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);