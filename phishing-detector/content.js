// 釣魚郵件關鍵字列表
const phishingKeywords = [
    "您的帳戶異常", 
    "請立即驗證", 
    "輸入您的密碼", 
    "安全警告",
    "點擊此處確認",
  ];
  
  // 搜尋郵件標題並標記
  function checkEmails() {
    const emailSubjects = document.querySelectorAll("span.bog");
  
    emailSubjects.forEach(subject => {
      const text = subject.innerText || subject.textContent;
  
      phishingKeywords.forEach(keyword => {
        if (text.includes(keyword)) {
          subject.style.color = "red";  // 將標題變紅
          subject.innerHTML += " ⚠️";  // 在標題後加警示符號
        }
      });
    });
  }
  
  // Gmail 使用 SPA（單頁應用），所以要監聽 DOM 變化
  const observer = new MutationObserver(checkEmails);
  observer.observe(document.body, { childList: true, subtree: true });
  
  // 初次執行
  checkEmails();
  