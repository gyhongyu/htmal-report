function SearchBar({ searchKeyword, onSearchChange }) {
  try {
    return (
      <div className="relative" data-name="search-bar" data-file="components/SearchBar.js">
        <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
          <div className="icon-search text-lg"></div>
        </div>
        <input
          type="text"
          value={searchKeyword}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="搜尋標題或描述..."
          className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary-color)] focus:border-transparent outline-none"
        />
        {searchKeyword && (
          <button
            onClick={() => onSearchChange('')}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <div className="icon-x text-lg"></div>
          </button>
        )}
      </div>
    );
  } catch (error) {
    console.error('SearchBar component error:', error);
    return null;
  }
}