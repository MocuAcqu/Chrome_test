// 釣魚郵件關鍵字（比對信件標題）
const phishingKeywords = [
    "您的帳戶已鎖定", "請立即驗證", "請參閱下方公告連結",
    "您的密碼已過期", "請點擊此連結", "緊急通知", "重要安全警告"
];

// 可疑寄件人清單（比對寄件人 email）
const phishingSenders = [
    "jobbank@104.com.tw",
    "suspicious@example.com"
];

let maxPagesToCheck = 2; // 預設掃描頁數為 2 頁
let currentPage = 1;     // 初始為第 1 頁

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "scanCurrentEmail") {
        scanCurrentEmail();
        return;
    }    
    
    if (message.action === "scanEmails") {
        maxPagesToCheck = message.limit || 2;
        console.log("🔧 偵測頁數設定為:", maxPagesToCheck); 

  
        detectPhishingEmails()
        return; // ✅ 這個 callback 是 async，不會呼叫 sendResponse
    }else if (message.action === "getMaxPages") {
        try {
            let amountElements = document.querySelectorAll("span.Dj span.ts");
            if (!amountElements.length) {
                sendResponse({ success: false, message: "無法取得信件總數" });
                return;
            }
            let totalText = amountElements[amountElements.length - 1].textContent.trim();
            let totalEmails = parseInt(totalText.replace(/,/g, ""), 10);
            if (isNaN(totalEmails)) {
                sendResponse({ success: false, message: "信件數無效" });
                return;
            }
            let maxPages = Math.ceil(totalEmails / 50);
            sendResponse({ success: true, maxPages });
        } catch (error) {
            sendResponse({ success: false, message: "發生錯誤：" + error.message });
        }
        return true; // ✅ 非同步回傳
    } else {
        // 🧯 若都沒符合，回傳一個基本的錯誤，避免通道被開啟卻沒回應
        sendResponse({ success: false, message: "未知的 action" });
        return false; // ❌ 不需再非同步了
    }
});


let checkedEmails = 0; // 已檢查信件數

// 偵測釣魚郵件函式
async function detectPhishingEmails() {
    console.log("⚙️ 偵測啟動，將偵測最多", maxPagesToCheck, "頁");

    let suspiciousEmails = [];

    // 📌 檢查信件總數
    let amountElements = document.querySelectorAll("span.Dj span.ts");
    if (!amountElements.length) {
        console.log("⚠️ 無法獲取信件總數，請檢查選擇器！");
        return;
    }
    let totalText = amountElements[amountElements.length - 1].textContent.trim();
    let totalEmails = parseInt(totalText.replace(/,/g, ""), 10);
    if (isNaN(totalEmails)) {
        console.log("⚠️ 獲取信件總數失敗，請確認 Gmail 介面是否變更！");
        return;
    }
    //console.log(`📨 信箱總數量: ${totalEmails} 封，將偵測最多 ${maxEmailsToCheck/50} 頁`);
    
    //let suspiciousEmails = [];
    
    let emailsOnCurrentPage = 0; // 追蹤當前頁面檢查的信件數量

    // 針對當前頁面，檢查所有郵件（包含主旨與寄件人）
    async function checkEmailsOnPage() {
        
        const emailRows = document.querySelectorAll("tr.zA");
        //console.log(`🔍 當前頁面找到 ${emailRows.length} 封郵件，開始檢查...`);
        console.log(`🔍 第 ${currentPage} 頁找到 ${emailRows.length} 封郵件，開始檢查...`);
        emailsOnCurrentPage = emailRows.length;
        emailRows.forEach(row => {
            const titleSpan = row.querySelector("span.bog");
            const senderSpan = row.querySelector("span.zF") || row.querySelector("span.yP");
    
            if (!titleSpan || !senderSpan) return;
    
            let title = titleSpan.textContent.trim();
            let senderEmail = senderSpan.getAttribute("email") || "未知寄件人";
    
            console.log("📩 信件標題:", title, "| 寄件人:", senderEmail);
    
            // 判斷是否可疑
            let subjectSuspicious = phishingKeywords.some(keyword => title.includes(keyword));
            let senderSuspicious = phishingSenders.some(suspicious => senderEmail.toLowerCase().includes(suspicious.toLowerCase()));
    
            if (subjectSuspicious || senderSuspicious) {
                // 註記整行信件樣式
                row.style.color = "red";
                row.style.fontWeight = "bold";
                row.insertAdjacentHTML("beforeend", " ⚠️");
    
                // 儲存為物件（防止重複主旨漏記）
                suspiciousEmails.push({
                    title,
                    sender: senderEmail
                });
            }
            checkedEmails++; // 增加已檢查的信件數
        });
        /*
        for (let row of emailRows) {
            const titleSpan = row.querySelector("span.bog");
            const senderSpan = row.querySelector("span.zF") || row.querySelector("span.yP");
    
            if (!titleSpan || !senderSpan) continue;
    
            let title = titleSpan.textContent.trim();
            let senderEmail = senderSpan.getAttribute("email") || "未知寄件人";
    
            console.log("📩 檢查信件:", title, "|", senderEmail);
    
            // 檢查主旨或寄件人是否可疑
            let subjectSuspicious = phishingKeywords.some(keyword => title.includes(keyword));
            let senderSuspicious = phishingSenders.some(s => senderEmail.toLowerCase().includes(s.toLowerCase()));
    
            if (subjectSuspicious || senderSuspicious) {
                row.style.color = "red";
                row.style.fontWeight = "bold";
                row.insertAdjacentHTML("beforeend", " ⚠️");
    
                suspiciousEmails.push({ title, sender: senderEmail });
            }
    
            // ⬇️ 這行會點進信件看內文（額外判斷）
            await scanEmailContent(row, title, senderEmail);
    
            checkedEmails++;
        }*/
    }

    // 判斷是否存在「下一頁」按鈕
    function hasNextPage() {
        const nextPageButton = document.querySelector("div[aria-label='較舊']");
        return nextPageButton && !nextPageButton.hasAttribute("disabled");
    }

    // 點擊「下一頁」並偵測所有頁面
    async function goToNextPage() {
        if (currentPage >= maxPagesToCheck) {
            console.log(`✅ 已達到 ${maxPagesToCheck} 頁上限，停止偵測`);
            displaySuspiciousEmails(suspiciousEmails);
            moveAndClickNewest();
            return;
        }

        let nextPageButton = document.querySelector("div[aria-label='較舊']");
        if (nextPageButton && !nextPageButton.hasAttribute("aria-disabled")) {
            console.log("➡️ 點擊「下一頁」按鈕...");
            nextPageButton.dispatchEvent(new MouseEvent("mousedown"));
            nextPageButton.dispatchEvent(new MouseEvent("mouseup"));
            nextPageButton.click();

            // 等待頁面載入後，再檢查
            setTimeout(() => {
                currentPage++;
                checkEmailsOnPage();
                if (hasNextPage() && currentPage < maxPagesToCheck) {
                    goToNextPage();
                } else {
                    displaySuspiciousEmails(suspiciousEmails);
                    moveAndClickNewest();
                }
            }, 1500);
        } else {
            console.log("✅ 沒有更多頁了");
            displaySuspiciousEmails(suspiciousEmails);
            moveAndClickNewest();
        }
    }

    // 開始檢查當前頁面
    await checkEmailsOnPage();
    if (hasNextPage() && currentPage < maxPagesToCheck) {
        goToNextPage();
    } else {
        displaySuspiciousEmails(suspiciousEmails);
        moveAndClickNewest();
    }
}

function simulateMouseEvent(target, type) {
    const event = new MouseEvent(type, {
      view: window,
      bubbles: true,
      cancelable: true
    });
    target.dispatchEvent(event);
  }
  
  async function moveAndClickNewest() {

    const moreBtn = document.querySelector("div[aria-label='顯示更多郵件']");
    if (!moreBtn) return console.error("❌ 無法找到『顯示更多郵件』按鈕");
  
    console.log("🖱 正在展開選單...");
    simulateMouseEvent(moreBtn, "mouseover");
    simulateMouseEvent(moreBtn, "mousedown");
    simulateMouseEvent(moreBtn, "mouseup");
    moreBtn.click(); // 最後呼叫 click()
  
    // 等待下拉選單展開
    await new Promise(resolve => setTimeout(resolve, 300)); // 可視情況調整等待時間
  
    // 嘗試找到「最新」選項
    const newestBtn = Array.from(document.querySelectorAll("div[role='menuitem'] div"))
      .find(el => el.textContent.trim() === "最新");
  
    if (!newestBtn) return console.error("❌ 無法找到『最新』選項，可能尚未正確展開選單");
  
    console.log("🖱 正在點擊『最新』...");
    simulateMouseEvent(newestBtn, "mouseover");
    simulateMouseEvent(newestBtn, "mousedown");
    simulateMouseEvent(newestBtn, "mouseup");
    newestBtn.click();
  }
  

function displaySuspiciousEmails(suspiciousEmails) {
    console.log("🔍 偵測到可疑郵件：", suspiciousEmails);
    chrome.storage.local.set({ suspiciousEmails }, async () => {
        console.log("✅ 已儲存 suspiciousEmails");
        
    }); 
}

async function scanEmailContent(row, title, senderEmail) {
    row.click(); // 點進信件
    console.log("📬 已點開信件:", title);

    await new Promise(resolve => setTimeout(resolve, 1500)); // 等信件載入

    let contentElement = document.querySelector("div.a3s"); // Gmail 內文容器
    if (!contentElement) {
        console.warn("❗ 無法找到內文");
        return;
    }

    let contentText = contentElement.innerText || "";
    let contentSuspicious = phishingKeywords.some(keyword => contentText.includes(keyword));

    if (contentSuspicious) {
        console.log("⚠️ 內文含釣魚字詞:", contentText.slice(0, 80));
        suspiciousEmails.push({
            title,
            sender: senderEmail,
            preview: contentText.slice(0, 100)
        });
    }

     // 點返回箭頭
    let backButton = document.querySelector("div[title='返回收件匣']");
    if (backButton) {
        backButton.dispatchEvent(new MouseEvent("mousedown"));
        backButton.dispatchEvent(new MouseEvent("mouseup"));
        backButton.click();
        console.log("↩️ 返回信件列表");
    }

    await new Promise(resolve => setTimeout(resolve, 1000)); // 等返回完成
}

async function scanCurrentEmail() {
    let suspicious = {
        title: "",
        sender: "",
        preview: "",
        attachments: [],
        problems: []
    };

    // 取得標題、寄件人
    const titleElement = document.querySelector("h2.hP");
    const senderElement = document.querySelector("span.gD");

    if (!titleElement || !senderElement) {
        console.warn("❗ 無法取得標題或寄件人，請確認是否點入單封信");
        chrome.storage.local.set({ singleEmailResult: { error: "無法取得信件資訊" } });
        return;
    }

    suspicious.title = titleElement.textContent.trim();
    suspicious.sender = senderElement.getAttribute("email") || "未知寄件人";

    // 檢查標題與寄件人
    if (phishingKeywords.some(k => suspicious.title.includes(k))) {
        suspicious.problems.push("標題含可疑關鍵字");
    }
    if (phishingSenders.some(s => suspicious.sender.toLowerCase().includes(s.toLowerCase()))) {
        suspicious.problems.push("寄件人為可疑來源");
    }

    // 檢查內文
    const contentElement = document.querySelector("div.a3s");
    if (contentElement) {
        suspicious.preview = contentElement.innerText.slice(0, 200);
        if (phishingKeywords.some(k => suspicious.preview.includes(k))) {
            suspicious.problems.push("信件內容含可疑字詞");
        }
    }

    // 檢查附件
    const attachments = document.querySelectorAll("div.aQH span.aZo");
    if (attachments.length > 0) {
        suspicious.attachments = Array.from(attachments).map(el => el.textContent);
        suspicious.problems.push("信件含有附件，請小心檢查");
    }

    chrome.storage.local.set({ singleEmailResult: suspicious });
}
