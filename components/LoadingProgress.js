function LoadingProgress({ progress }) {
  try {
    return (
      <div className="w-full" data-name="loading-progress" data-file="components/LoadingProgress.js">
        <div className="progress-bar">
          <div 
            className="progress-bar-fill" 
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        <div className="text-center mt-2 text-sm text-gray-600">
          載入中... {progress}%
        </div>
      </div>
    );
  } catch (error) {
    console.error('LoadingProgress component error:', error);
    return null;
  }
}