function CategoryTabs({
  activeCategory,
  currentCategory,
  onCategoryChange,
  setCurrentCategory,
  categoryCounts = {}
}) {
  console.log('Admin CategoryTabs rendered', { activeCategory, currentCategory, categoryCounts });
  const active = activeCategory || currentCategory;
  const onChange = onCategoryChange || setCurrentCategory;
  const safeCounts = categoryCounts || {};

  try {

    const [showMore, setShowMore] = React.useState(false);

    const categories = [
      { id: '全部', name: '全部', icon: 'layout-grid' },
      { id: '客戶簡報', name: '客戶簡報', icon: 'presentation' },
      { id: '內部簡報', name: '內部簡報', icon: 'file-text' },
      { id: '會議記要', name: '會議記要', icon: 'file-check' },
      { id: '工作報告', name: '工作報告', icon: 'clipboard-list' },
      { id: '數據分析', name: '數據分析', icon: 'chart-bar' },
      { id: '市場分析', name: '市場分析', icon: 'trending-up' },
      { id: '財務分析', name: '財務分析', icon: 'dollar-sign' },
      { id: '年度計劃', name: '年度計劃', icon: 'calendar' },
      { id: '季度計劃', name: '季度計劃', icon: 'calendar-days' },
      { id: '項目計劃', name: '項目計劃', icon: 'folder-kanban' },
      { id: '其他', name: '其他', icon: 'ellipsis' }
    ];

    const visibleCategories = showMore ? categories : categories.slice(0, 6);
    const hasMore = categories.length > 6;

    return (
      <div className="bg-white border-b" data-name="category-tabs" data-file="components/CategoryTabs.js">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-wrap gap-2 py-3">
            {visibleCategories.map(category => {
              const count = safeCounts[category.id] || 0;
              const isActive = active === category.id;

              return (
                <button
                  key={category.id}
                  onClick={() => onChange(category.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap transition-all ${isActive
                    ? 'bg-[var(--primary-color)] text-white shadow-sm'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                >
                  <div className={`icon-${category.icon} text-base`}></div>
                  <span className="font-medium">{category.name}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${isActive ? 'bg-white bg-opacity-20' : 'bg-white'
                    }`}>
                    {count}
                  </span>
                </button>
              );
            })}

            {hasMore && (
              <button
                onClick={() => setShowMore(!showMore)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
              >
                <div className={`icon-${showMore ? 'chevron-up' : 'chevron-down'} text-base`}></div>
                <span className="font-medium">{showMore ? '收合' : '更多'}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    );
  } catch (error) {
    console.error('CategoryTabs component error:', error);
    return null;
  }
}