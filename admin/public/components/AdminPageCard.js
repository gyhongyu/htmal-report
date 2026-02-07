// Admin 頁面卡片組件（帶編輯和刪除功能）

function AdminPageCard({ page, onEdit, onDelete }) {
    const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false);

    const formatDate = (dateStr) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const handleDelete = async () => {
        try {
            onDelete(page.pageId);
            setShowDeleteConfirm(false);
        } catch (error) {
            alert('刪除失敗: ' + error.message);
        }
    };

    return (
        <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-lg transition-shadow duration-200">
            <div className="flex items-start justify-between mb-3">
                <h3 className="text-lg font-semibold text-gray-900 line-clamp-2 flex-1">
                    {page.title}
                </h3>
            </div>

            {page.description && (
                <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                    {page.description}
                </p>
            )}

            <div className="flex flex-wrap gap-2 mb-3">
                {page.categories && page.categories.slice(0, 3).map(cat => (
                    <span
                        key={cat}
                        className="inline-block px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-md"
                    >
                        {cat}
                    </span>
                ))}
                {page.categories && page.categories.length > 3 && (
                    <span className="inline-block px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-md">
                        +{page.categories.length - 3}
                    </span>
                )}
            </div>

            <div className="text-xs text-gray-500 mb-3">
                <div>創建: {formatDate(page.createdAt)}</div>
                <div>更新: {formatDate(page.updatedAt)}</div>
            </div>

            <div className="flex gap-2">
                <button
                    onClick={() => onEdit(page.pageId)}
                    className="flex-1 px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-1"
                >
                    <div className="icon-edit text-sm"></div>
                    編輯
                </button>
                <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="px-3 py-2 bg-red-50 text-red-600 text-sm rounded-lg hover:bg-red-100 transition-colors flex items-center justify-center gap-1"
                >
                    <div className="icon-trash-2 text-sm"></div>
                    刪除
                </button>
            </div>

            {/* 刪除確認對話框 */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 max-w-sm mx-4">
                        <h3 className="text-lg font-bold text-gray-900 mb-2">確認刪除</h3>
                        <p className="text-gray-600 mb-4">
                            確定要刪除「{page.title}」嗎？此操作無法撤回。
                        </p>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setShowDeleteConfirm(false)}
                                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                            >
                                取消
                            </button>
                            <button
                                onClick={handleDelete}
                                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                            >
                                確認刪除
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
