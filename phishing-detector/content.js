
const phishingKeywords = [
  "您的帳戶異常",
  "請立即驗證",
  "輸入您的密碼",
  "安全警告",
  "點擊此處確認",
  "Uber" // 測試關鍵字
];

const GMAIL_EMAIL_LIST_SELECTOR = "div[role='main']"; // Gmail 主要信件列表
const GMAIL_SENDER_SELECTOR = "span.yP"; // **寄件者**
const GMAIL_SUBJECT_SELECTOR = "div.y6 span"; // **標題**
const GMAIL_BODY_SELECTOR = "div.a3s"; // **郵件內文**



function checkEmails() {
  let emailList = document.querySelector(GMAIL_EMAIL_LIST_SELECTOR);
  if (!emailList) return { subjectAlertCount: 0, senderAlertCount: 0, bodyAlertCount: 0 };

  let emails = document.querySelectorAll(GMAIL_SENDER_SELECTOR); 
  let subjects = document.querySelectorAll(GMAIL_SUBJECT_SELECTOR);

  let subjectAlertCount = 0;
  let senderAlertCount = 0;
  let bodyAlertCount = 0;

  emails.forEach((emailElement, index) => {
      let senderName = emailElement.innerText.trim();
      let subjectElement = subjects[index];

      if (!subjectElement) return;

      let subject = subjectElement.innerText.trim();

      let isSubjectAlerted = false; // 確保標題只計數一次
      phishingKeywords.forEach(keyword => {
          if (subject.includes(keyword) && subjectElement.dataset.alerted !== "true") {
              subjectElement.style.color = "red";
              subjectElement.innerHTML += " ⚠️";
              subjectElement.dataset.alerted = "true";
              isSubjectAlerted = true;
          }
      });
      if (isSubjectAlerted) subjectAlertCount++;

      if (phishingKeywords.some(keyword => senderName.includes(keyword)) && emailElement.dataset.alerted !== "true") {
          emailElement.style.color = "red";
          emailElement.innerHTML += " ⚠️";
          emailElement.dataset.alerted = "true";
          senderAlertCount++;
      }
  });

  let bodies = document.querySelectorAll(GMAIL_BODY_SELECTOR);
  bodies.forEach(body => {
      let text = body.innerText || "";
      let isBodyAlerted = false;
      phishingKeywords.forEach(keyword => {
          if (text.includes(keyword)) {
              body.style.backgroundColor = "yellow";
              isBodyAlerted = true;
          }
      });
      if (isBodyAlerted) bodyAlertCount++;
  });

  return { subjectAlertCount, senderAlertCount, bodyAlertCount };
}




const observer = new MutationObserver((mutationsList, observer) => {
  console.log("📬 Gmail 發生變化，開始檢查郵件...");

  observer.disconnect(); // 先停止監聽，避免重複觸發

  setTimeout(() => {
      checkEmails();
      
      const emailList = document.querySelector(GMAIL_EMAIL_LIST_SELECTOR);
      if (emailList) {
          observer.observe(emailList, { childList: true, subtree: true });
      } else {
          console.warn("⚠️ 無法找到 Gmail 郵件列表，稍後再試...");
      }
  }, 100); // 延遲 100 毫秒，確保 Gmail DOM 變更完成
});



function observeGmail() {

    let emailList = document.querySelector(GMAIL_EMAIL_LIST_SELECTOR);
    if (emailList) {
        observer.observe(emailList, { childList: true, subtree: true });
        console.log("📬 Gmail 監聽器啟動！");
    } else {
        console.warn("⚠️ 無法找到 Gmail 信件列表，稍後重試...");
        setTimeout(observeGmail, 1000);
    }
}




// ✅ 監聽 `popup.js` 要求更新數據
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "requestPhishingData") {
      console.log("📬 收到 popup.js 的請求，開始分析郵件...");
      
      let result = checkEmails(); // 獲取所有數據
      
      console.log(`📬 偵測到標題異常 ${result.subjectAlertCount} 封`);
      console.log(`📬 偵測到寄件者異常 ${result.senderAlertCount} 封`);
      console.log(`📬 偵測到內文異常 ${result.bodyAlertCount} 封`);

      sendResponse({ 
          status: "ok", 
          subjectCount: result.subjectAlertCount, 
          senderCount: result.senderAlertCount, 
          bodyCount: result.bodyAlertCount 
      });
      
      return true; // 讓 `sendResponse` 正常運行
  }
});


// **啟動監聽**
observeGmail();

