chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === "complete" && tab.url) {
        console.log("🌐 新網頁載入，重置偵測結果...");
        chrome.storage.local.set({ suspiciousEmails: [] }); // 清空儲存的可疑郵件
    }
});

/*
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "resetStorage") {
        console.log("🔄 使用者點擊開始分析，清空 suspiciousEmails");
        chrome.storage.local.set({ suspiciousEmails: [] }, () => {
            sendResponse({ success: true });
        });
        return true; // ⚠️ 告訴 Chrome 這是 async 回傳
    }
});*/
