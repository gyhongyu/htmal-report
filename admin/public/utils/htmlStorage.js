// HTML存储和分享工具函数

async function savePageData(pageId, pageData) {
  try {
    const now = new Date().toISOString();
    
    // Ensure html_code is a plain string, not an object
    const htmlCodeString = typeof pageData.htmlCode === 'string' 
      ? pageData.htmlCode 
      : String(pageData.htmlCode || '');
    
    const dataToSave = {
      title: pageData.title || '',
      description: pageData.description || '',
      categories: pageData.categories || [],
      html_code: htmlCodeString,
      created_at: now,
      updated_at: now
    };
    
    if (pageId) {
      // 更新现有页面
      try {
        const existingPage = await trickleGetObject('html_page', pageId);
        if (existingPage && existingPage.objectData) {
          dataToSave.created_at = existingPage.objectData.created_at || now;
        }
      } catch (e) {
        console.error('获取现有页面失败:', e);
      }
      
      const result = await trickleUpdateObject('html_page', pageId, dataToSave);
      return result.objectId;
    } else {
      // 创建新页面
      const result = await trickleCreateObject('html_page', dataToSave);
      return result.objectId;
    }
  } catch (error) {
    console.error('保存页面数据失败:', error);
    return null;
  }
}

async function getStoredPageData(pageId) {
  try {
    const result = await trickleGetObject('html_page', pageId);
    if (result && result.objectData) {
      // Ensure html_code is always a string
      const htmlCode = result.objectData.html_code;
      const htmlCodeString = typeof htmlCode === 'string' 
        ? htmlCode 
        : (htmlCode ? String(htmlCode) : '');
      
      return {
        title: result.objectData.title || '',
        description: result.objectData.description || '',
        categories: result.objectData.categories || [],
        htmlCode: htmlCodeString,
        createdAt: result.objectData.created_at || new Date().toISOString(),
        updatedAt: result.objectData.updated_at || new Date().toISOString()
      };
    }
    return null;
  } catch (error) {
    console.error('获取页面数据失败:', error);
    return null;
  }
}

async function getStoredHTML(pageId) {
  try {
    const result = await trickleGetObject('html_page', pageId);
    if (result && result.objectData) {
      const htmlCode = result.objectData.html_code;
      
      // Handle null or undefined
      if (htmlCode === null || htmlCode === undefined) {
        return null;
      }
      
      // If it's already a string, return it
      if (typeof htmlCode === 'string') {
        return htmlCode;
      }
      
      // If it's an object or array, skip this record
      if (typeof htmlCode === 'object') {
        console.error(`记录 ${pageId} 的 html_code 是对象类型，数据已损坏`);
        return null;
      }
      
      // Try to convert to string as last resort
      return String(htmlCode);
    }
    return null;
  } catch (error) {
    console.error('获取存储的HTML失败:', error);
    return null;
  }
}

async function getAllStoredPages() {
  try {
    console.log('=== getAllStoredPages 開始 ===');
    let allItems = [];
    let nextToken = undefined;
    let pageNum = 0;
    
    // Fetch all pages with pagination
    do {
      pageNum++;
      console.log(`正在獲取第 ${pageNum} 頁...`);
      const result = await trickleListObjects('html_page', 100, true, nextToken);
      
      if (!result || !result.items) {
        console.log('沒有更多資料');
        break;
      }
      
      console.log(`第 ${pageNum} 頁獲取到 ${result.items.length} 筆`);
      allItems = allItems.concat(result.items);
      nextToken = result.nextPageToken;
    } while (nextToken);
    
    console.log(`總共獲取 ${allItems.length} 筆原始資料`);
    
    const pages = allItems
      .filter(item => {
        if (!item || !item.objectData) {
          console.warn('跳過無效記錄: 缺少 objectData');
          return false;
        }
        
        // 检查 html_code 是否为有效字符串
        const htmlCode = item.objectData.html_code;
        if (htmlCode === null || htmlCode === undefined) {
          console.warn(`跳過記錄 ${item.objectId}: html_code 為空`);
          return false;
        }
        
        // 如果是对象或数组,跳过这条记录
        if (typeof htmlCode === 'object') {
          console.warn(`跳過損壞的記錄 ${item.objectId}: html_code 是物件類型`);
          return false;
        }
        
        return true;
      })
      .map(item => {
        // Ensure html_code is always a string
        const htmlCode = item.objectData.html_code;
        const htmlCodeString = typeof htmlCode === 'string' 
          ? htmlCode 
          : String(htmlCode || '');
        
        return {
          pageId: item.objectId,
          title: item.objectData.title || '無標題',
          description: item.objectData.description || '',
          categories: item.objectData.categories || [],
          htmlCode: htmlCodeString,
          createdAt: item.objectData.created_at || new Date().toISOString(),
          updatedAt: item.objectData.updated_at || new Date().toISOString()
        };
      });
    
    console.log(`過濾後有效頁面數: ${pages.length}`);
    console.log('=== getAllStoredPages 結束 ===');
    
    return pages.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  } catch (error) {
    console.error('获取所有存储页面失败:', error);
    return [];
  }
}

async function deleteStoredPage(pageId) {
  try {
    await trickleDeleteObject('html_page', pageId);
    return true;
  } catch (error) {
    console.error('删除页面失败:', error);
    return false;
  }
}