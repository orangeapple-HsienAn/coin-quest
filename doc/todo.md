TODO:
[] 確認首頁的排名機制會不會造成大量的 query
[] Feat: 與另一個系統實作 Single Sign-On (SSO)，取代目前的匿名登入機制
[] Feat: 把 CMS snapshot 同步機制做成正式版（寫 coin-quest Firestore + Storage、Admin 觸發按鈕、增量同步用 sourceVersion hash），目前 dev 走本機 data/cms-snapshot/ 是過渡作法
[] Feat: 加入「小議題 / 議題測驗」章節類型（CMS 已有 topic/topicQuiz components，unit-1-2 / unit-1-4 受影響）
[] Feat: 章節列表顯示完成狀態（讀 users/{uid}/courseProgress 把已完成卡片變綠）
[] Feat: 章節列表加入「懸浮導引對話框」（吉祥物 + 指向下一個未完成單元，需求書 5.2）
[] Feat: 課程主題列表加入「解鎖機制」（已解鎖彩色 / 待解鎖灰+鎖頭，需求書 5.1）
[] Feat: 批次同步 stage-1 全部 15 lessons 到 coin-quest（目前只有 lesson-1）
[] Improve: S 型路徑虛線連接器精準對齊（步驟 2 留下的微調）
[] Improve: 前端 bundle 1.4MB 太大，用 React.lazy 拆 Remotion / 章節頁
[] Chore: 復原 frontend/src/lib/firebase.ts 的 Emulator 連線（裝 Java + 建 emulator-data 後切回 USE_EMULATOR = true）
[] Chore: 等 CMS 端補 publishedGames.scoreThresholds 欄位後，移除前端寫死的預設門檻
[] Improve: 把 KnowledgeResultCard / StoryResultCard / QuizResultCard / Header 品牌字 / CourseListPage 標題 也接入 i18n（目前日文版 demo 這些仍是中文）
[] Improve: 用 i18n 框架（react-i18next）取代手寫 t() / *_JA 對照表
[] Chore: 等 CMS 端補 publishedGames 多語 snapshot 後，移除前端 gameTranslations.ts 的 zh→ja 對照
[] Improve: UNIT_NAME_JA 目前只 hardcode lesson-1 4 個 unit，之後 sync 時改成從 CMS 翻譯資料動態取

DONE:
[x] Feat: 加入第一課日文版（demo 用）— /course/stage-1-lesson-1-ja
	=> 用 lessonKey suffix (-ja) 編碼語言，影片配音、章節列表 pill、單元名稱、quiz 題目、story 選項、game HTML META、game 結算卡都已日文化；採手寫 zh→ja 對照表（gameTranslations.ts）作為過渡，未來換 i18n 框架取代 (ed71d3e)
[x] Feat: 全新課程容器（learn 模組）— S 型章節列表 + 4 種章節 view + Remotion Player 整合
	=> 砍掉舊 course 模組，依需求書 5.1~5.6 全新實作；含 CMS lesson snapshot 腳本（讀 oafq-cms-1313）、vite dev 中介層、自動 2x2/1x4 quiz 排版、雙保險遊戲完成判定、小故事 A/B/C 三選項；dev 模式暫時直連 production Firebase (cb10897, ab43ff0, 430ad39, e09637b, 7cbcd1e)
[x] Fix: 影片中 Emoji 不斷晃動（sub-pixel jitter）
	=> 移除 ConceptScene 的 iconPulse 和 StoryScene 的 iconWobble 持續動畫，更新 Skills 文件加入 Emoji 動畫禁忌說明，重新渲染 Lesson 2 全部影片 (2257144)
[x] Improve: 依照國際化 skill 修改 knowledge-s1-L02-3 的 lesson plan 及影片
	=> 移除台灣特定引用（中文字貝部首、台灣朝代比較）、修復破題問題（概念場景不再洩漏答案）、修復 narrations.ts 語法錯誤、重新生成圖片與 TTS 音檔 (edf4478)
[x] Improve: write-lesson skill: 不應該以台灣為角度/本位，因為這個課程之後會被翻譯成其他的語言，讓其他的國家做使用。
	=> 移除台灣特定用語（國小/國中→年齡範圍、夜市→超市、金額→通用描述），新增國際化原則至 write-lesson skill，更新 4 個 Skill/文件檔案 (d9aed35)
[x] Improve: 移除 genreate-lesson-video 的 A/B roll 機制
	=> 移除所有 A/B roll 術語與強制交替排列，改為概念場景與配圖場景自由組合，新增配圖頻率、旁白畫面協調等規則，更新 14 個檔案（Skills、程式碼註解、lesson plan、video-guide） (467d6f4)
[x] Feat: 依據目前的影片規範，設計 agent skill: generate-lesson-video
	=> 建立 generate-lesson-video Agent Skill（SKILL.md + SCENE-CATALOG + ANIMATION-PATTERNS），涵蓋 Story/Knowledge 影片完整製作流程、場景元件速查、進階動態效果範例，並引用 remotion-best-practices 與 generate-art-asset skill
[x] Feat: 依據目前的美術風格，設計 agent skill: generate-art-asset
	=> 建立 generate-art-asset Agent Skill（SKILL.md + 3 腳本），支援 Gemini 圖片生成、SynthID 浮水印移除、洋紅背景角落取樣去背，含 references 資料夾供參考圖片使用
[x] Improve: 目前點下「我要簽到」按鈕後，modal會直接消失，過一段時間才又出現簽到成功的 modal，在這個過程中，用戶會不知道到底發生什麼事，甚至以為功能壞掉了。
	=> 確認 Modal 保持開啟並顯示「簽到中...」loading 狀態，等 API 回應後再無縫切換至成功 Modal
[x] Improve: 目前的影片腳本還是有點單調，需要搭配圖示或採用 AB roll 的機制
	=> 知識影片加入 A/B roll：ConceptScene（A-roll）與 Gemini 生成插圖的 ImageScene（B-roll）交替切換，旁白拆分為前後兩段，新增 generate-images 腳本 (a67ac09)
[x] Feat: 製作 Lesson 1 課程影片（小故事 + 小知識 x2），整合至前端影片播放器
	=> 更新 lesson plan 為互動教學風格、動態場景長度（calculateMetadata + mediabunny）、修正 sub-pixel 文字抖動、ChapterPage 嵌入 <video> 播放器、MP4 靜態檔案部署 (904120c)
[x] Feat: 新增 insuranceProducts 的 seed 資料
	=> 建立 5 筆保險產品 seed（意外險、醫療險、住宅火災險、癌症險、竊盜險），使用固定 ID 並寫入 Firestore (414424e)
[x] Feat: 新增 stocks 的 seed 資料
	=> 建立 57 筆股票 seed（台灣50成分股 50 檔 + ETF 6 檔 + 加權指數），ID 格式 TW-{代號}，新增 country 欄位 (fcc328a)
[x] Feat: 新增 levels 的 seed 資料（10 級完整數值表，含稱號、日薪、所需經驗）
	=> 建立 10 筆等級 seed（Lv.1 打工新手 ~ Lv.10 專案決策者），Document ID 為數字字串 (ddb750e)
[x] Feat: 命運卡新增「正面獎勵」與「無事發生」結果類型（目前僅有風險損失）
	=> 將 RiskCard 重構為 FateCard，支援 risk/neutral/reward 三種類型，更新前後端與所有文件 (1b97979)
[x] Feat: 命運卡現金不足時允許餘額為負值
	=> 已在 FateCard 重構中移除 Math.max(0, ...) 限制 (1b97979)
[x] Feat: 等級與薪資進度卡片：左側當前狀態、中央經驗進度條、右側下一級目標
	=> LevelProgress 元件已完整實作（左側當前等級/稱號/日薪、中央經驗進度條、右側下一級目標）
[x] Feat: 儲蓄頁面左右分欄佈局（左側操作儀表板 + 右側明細列表）
	=> SavingsPage 已實作 grid-cols-2 左右分欄
[x] Feat: 存提款防呆：存款上限為現金、提款上限為儲蓄餘額
	=> handleDeposit/handleWithdraw 已有金額上限驗證
[x] Feat: 首頁簽到按鈕：未完成紅色、已完成綠色狀態區分
	=> CheckInButton 改為 unchecked=coral/red、checked=teal/green (7d3427e)
[x] Feat: 首頁任務區塊：加入點擊行為（每日測驗開始測驗、變動任務跳轉對應頁面、課程任務進入課程）
	=> DailyTasks 加入 linkTo 屬性與 Link 跳轉 (7d3427e)
[x] Feat: 首頁任務狀態：未完成顯示圓圈可點擊、已完成顯示打勾綠框不可點擊
	=> 未完成顯示空心圓圈可點擊跳轉、已完成顯示綠色打勾與綠框不可點擊 (7d3427e)
[x] Feat: 收支明細類別文字顏色邏輯：流入綠色、流出紅色
	=> 類別文字顏色改為依據流向（amount >= 0 綠色、< 0 紅色）(7d3427e)
[x] Feat: 排行榜標題顯示「（等級稱號）排行榜」
	=> 從 levels collection 取得等級名稱並顯示於標題 (7d3427e)
[x] Feat: 排行榜使用者自身排名以綠色邊框區隔
	=> 自身排名卡片改為 teal/green 邊框與背景色 (7d3427e)
[x] Feat: 保險卡片網格排列 + 保障說明文字
	=> 改為 grid-cols-2 網格排列 (7d3427e)
[x] Feat: 保險保障中狀態精確倒數（XX天 XX時 XX分）
	=> getRemainingTime 回傳天/時/分精確倒數 (7d3427e)
[x] Feat: 保險已過期狀態顯示「保險效力已終止」+ 橘色標籤
	=> 已過期顯示橘色「已過期」標籤與「保險效力已終止」文字 (7d3427e)
[x] Feat: 存提款金額以 $100 為單位增減
	=> 存提款彈窗加入 +/- 按鈕，每次增減 $100 (7d3427e)
[x] Feat: 利率公告欄支援 Hover 顯示利息計算規則
	=> 利率欄加入 group hover Tooltip 顯示計算規則 (7d3427e)
[x] Feat: 簽到確認彈窗（步驟一）：「簽到時，將抽取命運卡。確定現在要簽到了嗎？」
	=> 點擊簽到後顯示確認彈窗，含「我要簽到」與「取消」按鈕 (b462f23)
[x] Feat: 簽到成功視窗（步驟二）：顯示日期與薪水，必須點擊「抽取命運卡」按鈕才能繼續
	=> 簽到成功後顯示日期與薪水，必須點擊「抽取命運卡」才能繼續 (b462f23)
[x] Feat: 簽到日曆視覺狀態：已簽到（淺綠+金幣+打勾）、今日未簽到（橘紅爆炸貼紙）、未來日期（僅數字）
	=> Calendar 元件加入三種視覺狀態：淺綠+金幣+打勾、橘紅簽到按鈕、灰色數字 (b462f23)
[x] Feat: 排行榜前三名改為凸字型頒獎台設計
	=> 前三名改為凸字型頒獎台，中間第1名最高、左側第2名、右側第3名，含皇冠圖示 (dad06da)
[x] Feat: 排行榜圖示定義（錢袋/金幣/折線圖/小豬撲滿）+ Tooltip hover 互動
	=> 表頭改用圖示（💼💰📈🐷）並加入 hover Tooltip 顯示名稱，新增儲蓄欄 (dad06da)
[x] Feat: 所有頁面統一頂部資訊列（返回按鈕、經驗值、可用現金、個人頭像）
	=> Header 元件新增 backTo 屬性，所有子頁面返回按鈕移入頂部資訊列 (746b9ba)
[x] Feat: 章節類型名稱修正：「小考驗」→「小測驗」
	=> CourseDetailPage 的 quiz label 從「小考驗」改為「小測驗」(2ad0ce2)
[x] Feat: 股票色彩規範：台股標準（漲紅跌綠）
	=> 股票頁面所有漲跌顏色改為台股慣例：漲紅跌綠 (58f398a)
[x] Feat: 股票交易數量以 100 為單位增減、股/張切換
	=> 交易彈窗數量以 100 增減，新增股/張切換按鈕 (58f398a)
[x] Feat: 股票買賣現金不足/持股不足提示
	=> 交易時顯示現金不足或持股不足的提示訊息 (58f398a)
[x] Discuss: 股價浮動邏輯待討論（方案 A 真實歷史重播 vs 方案 B 新聞事件驅動）
	=> 決定採用每日爬取 TWSE 真實收盤價，建立 scheduled function 每日 15:00 自動更新 (67c931d)
[x] Improve: 目前 stockPriceHistory 以及 stocks 是獨立且平行的兩個 collection
	=> 移除 stockPriceHistory collection，改用 stocks/{id}.priceHistory object field + config/currentStockPrices 聚合文件 (67c931d)
[x] Feat: 依照 PM 規格實作股票交易介面（三分頁：買賣股票、未實現損益、已實現損益）
	=> 重構 StockPage 為三分頁：買賣股票（含 Recharts 走勢圖 + inline 交易面板）、未實現損益表格、已實現損益表格 (e22e03c)
[x] Feat: 股票頁面頂部資產儀表板兼分頁切換器
	=> 頂部顯示五項資產數據，已實現/未實現損益可點擊切換分頁，active tab 顯示綠色底線 (e22e03c)
[x] Feat: 已實現損益分頁：時間、交易股數、買入單價、賣出單價、損益金額、報酬率
	=> 從 stockTransactions 讀取 sell 紀錄，買入單價由 realizedPnL 反推，含完整 7 欄表格 (e22e03c)
[x] Feat: 課程首頁改為「主題圓形圖示」排列，含解鎖/待解鎖機制
	=> CourseListPage 改為圓形圖示網格，已解鎖顯示彩色圓形+進度指示，待解鎖顯示灰色+鎖頭 (bc7b7df)
[x] Feat: 章節單元列表改為 S 型蛇行路徑設計（取代傳統列表）
	=> CourseDetailPage 改為 S 型蛇行路徑，每行 3 節點，奇偶行交替方向，虛線連接 (bc7b7df)
[x] Feat: 章節懸浮導引對話框（吉祥物指引下一個單元）
	=> 下一個待完成章節上方顯示🦊吉祥物+「來挑戰這個吧！」對話泡泡 (bc7b7df)
[x] Feat: 小故事頁面：影片觀看 → 情境 ABC 選擇 → 星級評價結算
	=> ChapterPage 實作 StoryView：影片 placeholder → 三選項情境選擇 → 星級+經驗結算 (bc7b7df)
[x] Feat: 小知識頁面：影片觀看 → 經驗值結算
	=> ChapterPage 實作 KnowledgeView：影片 placeholder → 完成結算+經驗獎勵 (bc7b7df)
[x] Feat: 小測驗頁面：選擇題作答 → 即時詳解 → 獎勵結算（經驗=50+答對×10，金幣=答對×10）
	=> ChapterPage 實作 QuizView：逐題作答+即時詳解+結算畫面，含 completeChapter Cloud Function (bc7b7df)
[x] Feat: admin 介面: 實作 user.role 機制，如果是 "admin" 就能訪問後台 （/admin），對 fateCards, courses, insuranceProducts, levels, stocks 等資料進行 CRUD
	=> 新增 AdminRoute + 通用 CRUD 頁面（config 驅動），支援 5 個 collection 的新增/編輯/刪除，含章節管理、Firestore rules admin 寫入權限 (e191924)
[x] 股票交易時間僅限台灣時間 16:00-21:00
	=> buyStock/sellStock Cloud Function 加入 assertTradingHours() 檢查，非 16:00-21:00 回傳錯誤 (b6cc86e)
[x] Feat: 小遊戲頁面：嵌入式遊戲 → 分數 + 星級獎勵結算（1~3星對應 50/100/200 金幣）
	=> GameView 框架：分數→星級→金幣結算 UI，含獎勵對照表與 completeChapter 整合 (9ba1fcb)
[x] Feat: 小遊戲頁面：猜數字小遊戲
	=> GuessNumberGame：猜 1-100 數字，提示大小，依次數計星（≤3=3星, ≤5=2星, ≤8=1星）(6fe842e)
[x] Feat: 小遊戲頁面：記憶翻牌
	=> MemoryFlipGame：4x4 emoji 配對翻牌，依翻牌次數計星（≤10=3星, ≤15=2星, ≤20=1星）(9af951b)
[x] 研究 remotion 的原理及使用方式，設計課程影片的 skill
	=> 建立 course-video Agent Skill（SKILL.md + Design System + Remotion Patterns），定義小故事/小知識影片的場景結構、配色動畫規範與製作流程 (1ad25aa)
[x] 設計 write-lesson 的 skill: 從 curriculums 中取得課綱，進行規劃，撰寫適合轉換為影片的 lesson plan
	=> 建立 write-lesson Agent Skill（SKILL.md + Content Schema），定義章節規劃原則、影片腳本格式、測驗題目撰寫規範，輸出可直接用於 seed 資料與 course-video skill
