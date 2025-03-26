// 釣魚郵件關鍵字（比對信件標題）
const phishingKeywords = [
    "您的帳戶已鎖定", "請立即驗證", "Uber", "更新您的付款資訊",
    "您的密碼已過期", "請點擊此連結", "緊急通知", "重要安全警告"
];

// 可疑寄件人清單（比對寄件人 email）
const phishingSenders = [
    "noreply@moodle3.ntnu.edu.tw",
    "suspicious@example.com"
];

// 偵測釣魚郵件函式
async function detectPhishingEmails() {

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
    console.log(`📨 信箱總數量: ${totalEmails} 封`);
    
    let suspiciousEmails = [];
    let emailsOnCurrentPage = 0; // 追蹤當前頁面檢查的信件數量

    // 針對當前頁面，檢查所有郵件（包含主旨與寄件人）
    function checkEmailsOnPage() {
        const emailsOnPage = document.querySelectorAll("span.bA4 span.zF,span.bA4 span.yP");
        console.log(`🔍 當前頁面找到 ${emailsOnPage.length} 封郵件，開始檢查...`);
        emailsOnCurrentPage = emailsOnPage.length; // 當前頁面檢查的信件數量

        emailsOnPage.forEach(email => {
            // 取得信件標題與寄件人的 email 屬性
            let title = email.textContent.trim();
            let senderEmail = email.getAttribute("email"); // Gmail 寄件人通常儲存在這個屬性中
            console.log("📩 信件標題:", title, "| 寄件人:", senderEmail);

            // 判斷：只要標題或寄件人符合可疑條件，就標記
            let subjectSuspicious = phishingKeywords.some(keyword => title.includes(keyword));
            let senderSuspicious = senderEmail && phishingSenders.some(suspicious => senderEmail.toLowerCase().includes(suspicious.toLowerCase()));

            if (subjectSuspicious || senderSuspicious) {
                // 標記信件
                email.style.color = "red";
                email.style.fontWeight = "bold";
                email.insertAdjacentHTML("afterend", " ⚠️");
                
                // 將結果存成字串，包括主旨與寄件人
                let suspiciousEntry = `${title} | ${senderEmail ? senderEmail : "未知寄件人"}`;
                suspiciousEmails.push(suspiciousEntry);
            }
        });
    }

    // 判斷是否存在「下一頁」按鈕
    function hasNextPage() {
        const nextPageButton = document.querySelector("div[aria-label='較舊']");
        return nextPageButton && !nextPageButton.hasAttribute("disabled");
    }

    // 點擊「下一頁」並偵測所有頁面
    function goToNextPage() {
        let nextPageButton = document.querySelector("div[aria-label='較舊']");
        if (nextPageButton && !nextPageButton.hasAttribute("aria-disabled")) {
            console.log("➡️ 點擊「下一頁」按鈕...");
            nextPageButton.dispatchEvent(new MouseEvent("mousedown"));
            nextPageButton.dispatchEvent(new MouseEvent("mouseup"));
            nextPageButton.click();

            // 等待頁面載入後，再檢查
            setTimeout(() => {
                checkEmailsOnPage();
                // 如果當前頁面的信件數量小於總信件數量且還有下一頁，則繼續點擊
                if (emailsOnCurrentPage < totalEmails && hasNextPage()) {
                    goToNextPage();
                } else {
                    // 偵測完成，顯示結果
                    displaySuspiciousEmails(suspiciousEmails);
                }
            }, 1000); // 等待1秒鐘，根據實際情況調整等待時間
        } else {
            console.log("✅ 已載入所有信件！");
            displaySuspiciousEmails(suspiciousEmails);
        }
    }

    // 開始檢查當前頁面
    checkEmailsOnPage();
    // 如果有下一頁，則自動點擊「下一頁」
    if (hasNextPage()) {
        goToNextPage();
    } else {
        console.log("✅ 沒有更多的頁面可偵測！");
        displaySuspiciousEmails(suspiciousEmails);
    }
}

// 顯示所有可疑郵件（將結果存入 chrome.storage.local 以便 popup 使用）
function displaySuspiciousEmails(suspiciousEmails) {
    console.log("🔴 所有可疑郵件：", suspiciousEmails);
    chrome.storage.local.set({ suspiciousEmails }, () => {
        console.log("📂 可疑郵件已儲存至 chrome.storage.local");
    });
}

// 監聽 popup 傳來的訊息，當收到 "scanEmails" 訊息時啟動偵測
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "scanEmails") {
        detectPhishingEmails();
    }
});
