# Chrome_test

這是關於我在嘗試學習如何使用chrome，並構思如何與專題結合的程式碼。

## 【簡介】

目前進度:
1. 我目前有跟著官方教學完成練習，練習的程式碼分別為c_hello、focus-mode、quick-api-reference、reading-time，並且了解要如何使用這些擴充工作
2. 有開始思考需要用到的images、icons
3. 有嘗試製作一個假設的釣魚信件擴充工具(phishing-detector)，但因為還在學習跟嘗試階段，目前只有基本模樣

可以討論、思考的地方:
1. 呈現方式(自動化偵測，部會有額外的UI介面、popup視窗、右鍵選單)
2. UI設計(繪製還是找現有圖片、有什麼需要包含的元素)

未來目標:
1. 先完成假設版的釣魚信件擴充工具，並成功執行
2. 研究background.js串接後台的部分
4. 更深入了解chrome api
5. 開始設計UI介面(做出草稿或流程圖)

## 【說明】
1.了解Chrome在跟目錄中的結構(這是我簡要列出基本的架構)
![image](https://github.com/MocuAcqu/Chrome_test/blob/main/chrome%E5%9F%BA%E6%9C%AC%E8%B7%9F%E7%9B%AE%E9%8C%84%E6%9E%B6%E6%A7%8B.png)

2.練習實作
- c_hello
  
  試作如何在出現頁面呼喚擴充工具，顯示hello extensions(類似hello world)
  
- focus-mode

  藉由擴充工具，改變網頁的CSS，有網頁內容放大集中的錯覺
  
- quick-api-reference

  能夠快速搜尋到chrome的API
  
- reading-time

  計算閱讀該網頁內容(article)字數，並計算對應閱讀時間


## 【參考資料】
1. [Chrome Extension 開發與實作 03-官網導讀：架構總覽Architecture Overview](https://ithelp.ithome.com.tw/articles/10186334)
2. [Chrome 擴充功能](https://developer.chrome.com/docs/extensions/ai?hl=zh-tw)
3. [從頭開始學習開發 Chrome extension](https://medium.com/@alexian853/%E5%BE%9E%E9%A0%AD%E9%96%8B%E5%A7%8B%E5%AD%B8%E7%BF%92%E9%96%8B%E7%99%BC-chrome-extension-v3-%E7%89%88%E6%9C%AC-96d7fdfc00d1)
4. 
