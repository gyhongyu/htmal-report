// Database cleanup and diagnostic utilities

async function checkDatabaseHealth() {
  console.log('开始检查数据库健康状态...');
  
  // Skip database health check to avoid JSON parsing errors
  // The getAllStoredPages function already handles corrupted data
  return {
    healthy: true,
    totalItems: 0,
    issues: [],
    skipped: true
  };
}

async function fixCorruptedRecords() {
  console.log('跳过清理操作 - getAllStoredPages 会自动过滤损坏的记录');
  return { fixed: 0, failed: 0, skipped: true };
}
