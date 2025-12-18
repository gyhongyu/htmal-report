// Database diagnostic tool to check actual record count
window.checkActualRecordCount = async function() {
  console.log('=== 開始檢查資料庫 ===');
  
  try {
    let allRecords = [];
    let nextToken = undefined;
    let pageCount = 0;
    
    // Fetch all records with pagination
    do {
      pageCount++;
      console.log(`正在獲取第 ${pageCount} 頁資料...`);
      
      const result = await trickleListObjects('html_page', 100, true, nextToken);
      
      if (result && result.items) {
        console.log(`第 ${pageCount} 頁獲取到 ${result.items.length} 筆資料`);
        allRecords = allRecords.concat(result.items);
        nextToken = result.nextPageToken;
      } else {
        break;
      }
    } while (nextToken);
    
    console.log(`\n總共從資料庫獲取 ${allRecords.length} 筆原始資料`);
    
    // Check each record
    const validRecords = [];
    const invalidRecords = [];
    
    allRecords.forEach((item, index) => {
      const recordInfo = {
        index: index + 1,
        objectId: item.objectId,
        title: item.objectData?.title || '無標題',
        hasHtmlCode: !!item.objectData?.html_code,
        htmlCodeType: typeof item.objectData?.html_code,
        isValid: false
      };
      
      // Check if html_code is valid
      const htmlCode = item.objectData?.html_code;
      if (htmlCode === null || htmlCode === undefined) {
        recordInfo.issue = 'html_code 為 null 或 undefined';
        invalidRecords.push(recordInfo);
      } else if (typeof htmlCode === 'object') {
        recordInfo.issue = 'html_code 是物件類型（已損壞）';
        invalidRecords.push(recordInfo);
      } else {
        recordInfo.isValid = true;
        validRecords.push(recordInfo);
      }
    });
    
    console.log(`\n有效資料: ${validRecords.length} 筆`);
    console.log(`無效資料: ${invalidRecords.length} 筆`);
    
    if (invalidRecords.length > 0) {
      console.log('\n無效資料詳情:');
      invalidRecords.forEach(record => {
        console.log(`- ID: ${record.objectId}, 標題: ${record.title}, 問題: ${record.issue}`);
      });
    }
    
    console.log('\n=== 檢查完成 ===');
    
    return {
      total: allRecords.length,
      valid: validRecords.length,
      invalid: invalidRecords.length,
      validRecords,
      invalidRecords
    };
  } catch (error) {
    console.error('檢查資料庫時發生錯誤:', error);
    return {
      total: 0,
      valid: 0,
      invalid: 0,
      error: error.message
    };
  }
};
