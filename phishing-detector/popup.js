chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.scripting.executeScript(
      {
        target: { tabId: tabs[0].id },
        function: countPhishingEmails
      },
      (results) => {
        document.getElementById("status").innerText = `偵測到 ${results[0].result} 封可疑郵件！`;
      }
    );
  });
  
  function countPhishingEmails() {
    const phishingIcons = document.querySelectorAll("span.bog:contains('⚠️')");
    return phishingIcons.length;
  }
  
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs.length === 0) return;
    chrome.scripting.executeScript({
      target: { tabId: tabs[0].id },
      files: ["content.js"]
    });
  });
  
