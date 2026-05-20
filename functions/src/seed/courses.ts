/**
 * 課程 seed 資料
 * 執行方式：npm run seed:courses (在 functions 目錄下)
 *
 * 建立 3 個課程主題 + 各自的章節（含 content 欄位）
 */
import { initializeApp, applicationDefault } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'

initializeApp({ credential: applicationDefault(), projectId: 'oa-coin-quest' })
const db = getFirestore()

// === Content 型別 ===

interface StoryContent {
  videoUrl: string
  scenarios: {
    label: string
    description: string
    result: string
    stars: number
    experienceReward: number
  }[]
}

interface KnowledgeContent {
  videoUrl: string
}

interface QuizContent {
  questions: {
    question: string
    options: string[]
    correctIndex: number
    explanation: string
  }[]
}

// === Course & Chapter 定義 ===

interface CourseSeed {
  id: string
  name: string
  description: string
  iconUrl: string
  order: number
  unlockLevel: number
  chapterCount: number
  isActive: boolean
  chapters: ChapterSeed[]
}

interface GameContent {
  gameType: 'guessNumber' | 'memoryFlip'
}

interface ChapterSeed {
  id: string
  title: string
  type: 'story' | 'knowledge' | 'quiz' | 'game'
  order: number
  experienceReward: number
  coinReward: number
  content: StoryContent | KnowledgeContent | QuizContent | GameContent
}

// === Seed 資料 ===

const courses: CourseSeed[] = [
  // 課程一：理財入門
  {
    id: 'course-finance-101',
    name: '理財入門',
    description: '學習基礎理財觀念，認識金錢的價值與管理方式',
    iconUrl: '💰',
    order: 1,
    unlockLevel: 1,
    chapterCount: 6,
    isActive: true,
    chapters: [
      {
        id: 'ch-f101-1',
        title: '小琪的週末購物日',
        type: 'story',
        order: 1,
        experienceReward: 30,
        coinReward: 0,
        content: {
          videoUrl: '/videos/story-s1-L01.mp4',
          scenarios: [
            {
              label: 'A. 全部拿去買玩具',
              description: '小明拿到零用錢後，立刻跑去買了最新的玩具。',
              result: '玩具很快就玩膩了，月底沒錢買想要的漫畫。衝動消費讓小明錯失了其他選擇。',
              stars: 1,
              experienceReward: 10,
            },
            {
              label: 'B. 存一半，花一半',
              description: '小明決定把一半的零用錢存起來，另一半用來買喜歡的東西。',
              result: '月底時小明既有新漫畫，存款也在慢慢增加。平衡消費與儲蓄是最棒的選擇！',
              stars: 3,
              experienceReward: 30,
            },
            {
              label: 'C. 全部存起來不花',
              description: '小明把所有零用錢都存進撲滿，一毛都不花。',
              result: '雖然存了很多錢，但完全沒有享受到零用錢的樂趣。適度消費也是重要的！',
              stars: 2,
              experienceReward: 20,
            },
          ],
        } as StoryContent,
      },
      {
        id: 'ch-f101-2',
        title: '什麼是「需要」和「想要」？',
        type: 'knowledge',
        order: 2,
        experienceReward: 50,
        coinReward: 0,
        content: {
          videoUrl: '/videos/knowledge-s1-L01-2.mp4',
        } as KnowledgeContent,
      },
      {
        id: 'ch-f101-3',
        title: '理財觀念小測驗',
        type: 'quiz',
        order: 3,
        experienceReward: 0, // 測驗經驗值由公式計算
        coinReward: 0,       // 測驗金幣由公式計算
        content: {
          questions: [
            {
              question: '下列哪一項屬於「需要」而非「想要」？',
              options: ['最新款手機', '每天的午餐', '名牌球鞋', '遊戲點數'],
              correctIndex: 1,
              explanation: '午餐是維持健康的基本需求，屬於「需要」。而最新款手機、名牌球鞋和遊戲點數雖然讓人開心，但屬於「想要」。',
            },
            {
              question: '小華每月零用錢 $1,000，他想存錢買 $3,000 的書包。最少要存幾個月？',
              options: ['1 個月', '2 個月', '3 個月', '4 個月'],
              correctIndex: 2,
              explanation: '$3,000 ÷ $1,000 = 3 個月。如果小華每月全額存下零用錢，最少需要 3 個月才能買到書包。',
            },
            {
              question: '以下哪種行為是良好的理財習慣？',
              options: ['看到喜歡的就買', '記錄每天的花費', '把錢全借給朋友', '零用錢當天花完'],
              correctIndex: 1,
              explanation: '記帳是最基本也最重要的理財習慣，能幫助你了解錢花到哪裡去了。',
            },
          ],
        } as QuizContent,
      },
      {
        id: 'ch-f101-4',
        title: '認識銀行與存款',
        type: 'knowledge',
        order: 4,
        experienceReward: 50,
        coinReward: 0,
        content: {
          videoUrl: '/videos/knowledge-s1-L01-3.mp4',
        } as KnowledgeContent,
      },
      {
        id: 'ch-f101-5',
        title: '儲蓄觀念大挑戰',
        type: 'quiz',
        order: 5,
        experienceReward: 0,
        coinReward: 0,
        content: {
          questions: [
            {
              question: '把錢存在銀行，銀行會給你什麼回饋？',
              options: ['禮物', '利息', '點數', '折價券'],
              correctIndex: 1,
              explanation: '銀行會根據你的存款金額和利率，定期支付「利息」作為回饋。這就是錢能生錢的基本原理。',
            },
            {
              question: '「複利」的意思是什麼？',
              options: ['利息固定不變', '利息也會產生利息', '利率每年調低', '只計算本金的利息'],
              correctIndex: 1,
              explanation: '複利就是「利滾利」，不只本金會產生利息，之前賺到的利息也會再產生利息，讓你的錢越滾越大。',
            },
            {
              question: '如果你有 $10,000，年利率 10%，一年後本利和是多少？',
              options: ['$10,000', '$10,100', '$11,000', '$12,000'],
              correctIndex: 2,
              explanation: '$10,000 × 10% = $1,000 的利息。本金 $10,000 + 利息 $1,000 = $11,000。',
            },
          ],
        } as QuizContent,
      },
      {
        id: 'ch-f101-6',
        title: '理財猜猜看',
        type: 'game',
        order: 6,
        experienceReward: 20,
        coinReward: 0, // 金幣由星級決定
        content: {
          gameType: 'guessNumber',
        } as GameContent,
      },
    ],
  },

  // 課程 1-2：古代貨幣
  {
    id: 'course-ancient-currency',
    name: '古代貨幣',
    description: '探索從以物易物到金屬錢幣、再到紙鈔的貨幣演變歷程',
    iconUrl: '🪙',
    order: 2,
    unlockLevel: 1,
    chapterCount: 6,
    isActive: true,
    chapters: [
      // Ch1：小傑的交換大作戰（小故事）
      {
        id: 'ch-s1-L02-1',
        title: '小傑的交換大作戰',
        type: 'story',
        order: 1,
        experienceReward: 30,
        coinReward: 0,
        content: {
          videoUrl: '/videos/story-s1-L02.mp4',
          scenarios: [
            {
              label: 'A. 放棄交換，把餅乾自己吃掉',
              description: '小傑覺得交換太麻煩了，乾脆把餅乾吃掉算了。',
              result: '小傑吃到了好吃的餅乾，但漫畫也沒換到。有時候換不到不是因為東西不好，而是因為「以物易物」真的很不方便！如果有一種大家都接受的交換工具就好了——嘿，這就是「錢」被發明出來的原因喔！',
              stars: 1,
              experienceReward: 10,
            },
            {
              label: 'B. 耐心地一步一步換，先找貼紙、再換彩色筆、最後換漫畫',
              description: '小傑不放棄，決定按照順序一個一個換過去。',
              result: '小傑花了好大一番功夫，終於換到漫畫了！雖然很辛苦，但他也發現了一件事：以物易物就是這麼麻煩，要剛好找到互相需要的人才行。古代人也遇到同樣的問題，所以後來才發明了「錢」來解決這個困難！',
              stars: 3,
              experienceReward: 30,
            },
            {
              label: 'C. 大聲跟小美說：「妳就拿餅乾嘛！」',
              description: '小傑覺得自己的餅乾這麼好吃，硬要小美接受。',
              result: '小美不開心地走掉了。交換最重要的規則就是——雙方都同意才算數！硬塞給別人可不行。這也是以物易物的難處：你覺得很有價值的東西，別人不一定覺得。所以後來人類才發明了一種「大家都認同價值」的東西，那就是——貨幣！',
              stars: 2,
              experienceReward: 20,
            },
          ],
        } as StoryContent,
      },
      // Ch2：沒有錢的世界？以物易物大冒險！（小知識）
      {
        id: 'ch-s1-L02-2',
        title: '沒有錢的世界？以物易物大冒險！',
        type: 'knowledge',
        order: 2,
        experienceReward: 50,
        coinReward: 0,
        content: {
          videoUrl: '/videos/knowledge-s1-L02-2.mp4',
        } as KnowledgeContent,
      },
      // Ch3：從貝殼到金塊——貨幣變變變！（小知識）
      {
        id: 'ch-s1-L02-3',
        title: '從貝殼到金塊——貨幣變變變！',
        type: 'knowledge',
        order: 3,
        experienceReward: 50,
        coinReward: 0,
        content: {
          videoUrl: '/videos/knowledge-s1-L02-3.mp4',
        } as KnowledgeContent,
      },
      // Ch4：紙鈔大發明——古人的防偽黑科技！（小知識）
      {
        id: 'ch-s1-L02-4',
        title: '紙鈔大發明——古人的防偽黑科技！',
        type: 'knowledge',
        order: 4,
        experienceReward: 50,
        coinReward: 0,
        content: {
          videoUrl: '/videos/knowledge-s1-L02-4.mp4',
        } as KnowledgeContent,
      },
      // Ch5：古代貨幣小測驗
      {
        id: 'ch-s1-L02-5',
        title: '古代貨幣小測驗',
        type: 'quiz',
        order: 5,
        experienceReward: 0,
        coinReward: 0,
        content: {
          questions: [
            {
              question: '在「以物易物」的時代，最大的困難是什麼？',
              options: ['東西太多不知道怎麼選', '每個人都想要金子', '需要找到剛好互相需要對方東西的人', '沒有人願意交換'],
              correctIndex: 2,
              explanation: '以物易物最大的麻煩就是「需求的雙重巧合」——你想要對方的東西，對方也要剛好想要你的東西，才能交換成功。光是找到一個配對就很困難了！',
            },
            {
              question: '為什麼很多跟「錢」有關的中文字都有「貝」這個部首？',
              options: ['因為古代人覺得貝殼很漂亮', '因為古代最早用貝殼當作貨幣', '因為「貝」的發音很好聽', '因為貝殼的形狀像錢幣'],
              correctIndex: 1,
              explanation: '在中國古代，貝殼（尤其是寶貝螺）是最早被大量當成貨幣使用的東西。所以「買」、「賣」、「財」、「貨」這些跟錢有關的字，都有「貝」這個部首！文字裡藏著歷史呢！',
            },
            {
              question: '金子和銀子之所以適合當貨幣，是因為它們具備哪些特點？',
              options: ['很重、很大、很硬', '很輕、會變色、容易取得', '可以吃、可以穿、可以蓋房子', '稀有、不易損壞、大家認為有價值'],
              correctIndex: 3,
              explanation: '金銀適合當貨幣有三大原因：第一，稀有所以珍貴；第二，不會生鏽或腐爛；第三，閃閃發亮，大家都覺得有價值。這三個特點讓它們成為全世界最受歡迎的貨幣材料！',
            },
            {
              question: '世界上第一張紙鈔叫什麼名字？來自哪裡？',
              options: ['交子，來自中國宋朝', '美金，來自美國', '歐元，來自歐洲', '日圓，來自日本'],
              correctIndex: 0,
              explanation: '世界上第一張紙鈔叫「交子」，大約一千年前誕生在中國宋朝的四川省。比歐洲人開始用紙鈔早了六百多年！紙鈔可是中國人的偉大發明喔！',
            },
            {
              question: '古代紙鈔用了哪些方法來防止被偽造？',
              options: ['用金子做的紙、國王親筆簽名、附送護身符', '把紙鈔做得超大張、用看不懂的外星文字、塗上辣椒水', '特殊紙張、複雜花紋圖案、官方印章', '只有皇帝可以摸、放在保險箱裡、不讓任何人看到'],
              correctIndex: 2,
              explanation: '古代紙鈔的防偽三招是：用特殊的紙張（一般紙不行）、印上超複雜的花紋圖案（一般人畫不出來），以及蓋上官方印章（代表政府認證）。這些智慧一直延續到現代鈔票的防偽設計呢！',
            },
          ],
        } as QuizContent,
      },
      // Ch6：貨幣配對大挑戰（小遊戲）
      {
        id: 'ch-s1-L02-6',
        title: '貨幣配對大挑戰',
        type: 'game',
        order: 6,
        experienceReward: 20,
        coinReward: 0,
        content: {
          gameType: 'memoryFlip',
        } as GameContent,
      },
    ],
  },

  // 課程 1-3：現代貨幣與支付工具
  {
    id: 'course-modern-currency',
    name: '現代貨幣與支付工具',
    description: '認識鈔票防偽技術與各種支付工具，學習聰明付款',
    iconUrl: '💳',
    order: 3,
    unlockLevel: 1,
    chapterCount: 5,
    isActive: true,
    chapters: [
      // Ch1：小美的神奇付款日（小故事）
      {
        id: 'ch-s1-L03-1',
        title: '小美的神奇付款日',
        type: 'story',
        order: 1,
        experienceReward: 30,
        coinReward: 0,
        content: {
          videoUrl: '/videos/story-s1-L03.mp4',
          scenarios: [
            {
              label: 'A. 以後都用手機付款就好了，鈔票太麻煩了',
              description: '小美覺得手機付款超酷超方便，決定以後都不帶現金。',
              result: '結果有一天手機沒電，又遇到一家只收現金的小店，什麼都買不了！只靠一種付款方式，遇到突發狀況就會很頭痛。認識多種支付工具才能隨機應變！',
              stars: 1,
              experienceReward: 10,
            },
            {
              label: 'B. 認識各種付款方式，出門可以多準備幾種',
              description: '小美決定學習不同的付款方式，出門時帶一點現金，也知道怎麼用其他工具。',
              result: '太聰明了！鈔票、硬幣、金融卡、行動支付，每種方式都有它好用的時候。多認識幾種，不管遇到什麼狀況都不怕！這就是「支付素養」的第一步！',
              stars: 3,
              experienceReward: 30,
            },
            {
              label: 'C. 現金最可靠，不要用什麼手機付款',
              description: '小美覺得看得到摸得到的鈔票最安心，不想學那些新東西。',
              result: '現金確實很可靠，但有時候帶太多現金出門反而不安全，找零也麻煩。而且現在越來越多地方可以用電子支付，多學一點新工具不是壞事喔！',
              stars: 2,
              experienceReward: 20,
            },
          ],
        } as StoryContent,
      },
      // Ch2：鈔票裡的小祕密——防偽大解密！（小知識）
      {
        id: 'ch-s1-L03-2',
        title: '鈔票裡的小祕密——防偽大解密！',
        type: 'knowledge',
        order: 2,
        experienceReward: 50,
        coinReward: 0,
        content: {
          videoUrl: '/videos/knowledge-s1-L03-2.mp4',
        } as KnowledgeContent,
      },
      // Ch3：不帶現金也能買東西？支付工具大集合！（小知識）
      {
        id: 'ch-s1-L03-3',
        title: '不帶現金也能買東西？支付工具大集合！',
        type: 'knowledge',
        order: 3,
        experienceReward: 50,
        coinReward: 0,
        content: {
          videoUrl: '/videos/knowledge-s1-L03-3.mp4',
        } as KnowledgeContent,
      },
      // Ch4：現代貨幣與支付小測驗
      {
        id: 'ch-s1-L03-4',
        title: '現代貨幣與支付小測驗',
        type: 'quiz',
        order: 4,
        experienceReward: 0,
        coinReward: 0,
        content: {
          questions: [
            {
              question: '把鈔票對著光看到的隱藏圖案叫什麼？',
              options: ['彩色印刷', '浮水印', '貼紙', '刺繡'],
              correctIndex: 1,
              explanation: '對著光看到的隱藏圖案叫「浮水印」！它是在造紙的時候就嵌進去的，不是後來印上去的，所以影印機根本印不出來。這是鈔票最經典的防偽設計之一！',
            },
            {
              question: '金融卡和信用卡最大的差別是什麼？',
              options: ['顏色不同', '金融卡是直接從帳戶扣錢，信用卡是先買後付', '信用卡只能在國外用', '金融卡是免費的，信用卡要收費'],
              correctIndex: 1,
              explanation: '金融卡刷的時候直接從你的銀行帳戶扣錢，帳戶有多少才能花多少。信用卡則是銀行先幫你付，月底再跟你收。記住：信用卡花的錢最後還是要還的，忘了還還會被多收利息喔！',
            },
            {
              question: '下面哪一個不是鈔票的防偽技術？',
              options: ['浮水印', '變色油墨', '在鈔票上簽自己的名字', '凹版印刷'],
              correctIndex: 2,
              explanation: '浮水印、變色油墨、凹版印刷都是正式的防偽技術，但「簽自己的名字」可不算喔！鈔票的防偽設計都是在製造過程中完成的，不是個人能自己加上去的！',
            },
            {
              question: '行動支付的最大缺點是什麼？',
              options: ['速度太慢', '只能買食物', '手機沒電就不能用', '只有大人才能用'],
              correctIndex: 2,
              explanation: '行動支付靠手機運作，所以手機一旦沒電就無法付款了！除此之外，有些店家也不支援行動支付。所以出門最好多準備幾種付款方式，以備不時之需！',
            },
            {
              question: '出門買東西最聰明的做法是什麼？',
              options: ['全部帶現金最安全', '只用行動支付最方便', '不帶任何東西，跟別人借', '多準備幾種支付方式，隨機應變'],
              correctIndex: 3,
              explanation: '每種支付方式都有優缺點——現金可能遺失、手機可能沒電、有些店只收現金。多認識幾種支付方式，出門帶一些現金、帶卡片、手機也充好電，這樣不管遇到什麼狀況都不怕！',
            },
          ],
        } as QuizContent,
      },
      // Ch5：支付知識猜猜看（小遊戲）
      {
        id: 'ch-s1-L03-5',
        title: '支付知識猜猜看',
        type: 'game',
        order: 5,
        experienceReward: 20,
        coinReward: 0,
        content: {
          gameType: 'guessNumber',
        } as GameContent,
      },
    ],
  },

  // 課程三：儲蓄與保險
  {
    id: 'course-savings-insurance',
    name: '儲蓄與保險',
    description: '了解儲蓄的力量和保險的保障功能',
    iconUrl: '🛡️',
    order: 4,
    unlockLevel: 2,
    chapterCount: 5,
    isActive: true,
    chapters: [
      {
        id: 'ch-si-1',
        title: '小美的意外事故',
        type: 'story',
        order: 1,
        experienceReward: 30,
        coinReward: 0,
        content: {
          videoUrl: '',
          scenarios: [
            {
              label: 'A. 用存款支付全部醫藥費',
              description: '小美用自己的存款支付了所有醫療費用。',
              result: '雖然解決了問題，但存款大幅減少，幾個月的努力一夕歸零。如果有保險就不用這麼辛苦了。',
              stars: 1,
              experienceReward: 10,
            },
            {
              label: 'B. 申請保險理賠',
              description: '小美想起之前買的意外險，趕緊申請理賠。',
              result: '保險公司核准理賠，支付了大部分醫療費用。小美的存款幾乎沒有減少，這就是保險的力量！',
              stars: 3,
              experienceReward: 30,
            },
            {
              label: 'C. 向朋友借錢',
              description: '小美不想花自己的錢，決定向朋友借錢付醫藥費。',
              result: '雖然暫時解決了問題，但欠債會造成人際關係的壓力，而且還是要還錢的。',
              stars: 1,
              experienceReward: 10,
            },
          ],
        } as StoryContent,
      },
      {
        id: 'ch-si-2',
        title: '什麼是保險？',
        type: 'knowledge',
        order: 2,
        experienceReward: 50,
        coinReward: 0,
        content: {
          videoUrl: '',
        } as KnowledgeContent,
      },
      {
        id: 'ch-si-3',
        title: '認識不同種類的保險',
        type: 'knowledge',
        order: 3,
        experienceReward: 50,
        coinReward: 0,
        content: {
          videoUrl: '',
        } as KnowledgeContent,
      },
      {
        id: 'ch-si-4',
        title: '保險知識小測驗',
        type: 'quiz',
        order: 4,
        experienceReward: 0,
        coinReward: 0,
        content: {
          questions: [
            {
              question: '保險最主要的功能是什麼？',
              options: ['賺取投資報酬', '轉移風險損失', '增加存款利率', '獲得購物折扣'],
              correctIndex: 1,
              explanation: '保險的核心功能是「轉移風險」。透過繳納保費，當意外發生時，由保險公司承擔大部分的損失。',
            },
            {
              question: '以下哪種情況適合使用「醫療險」理賠？',
              options: ['手機被偷', '感冒看醫生', '車子拋錨', '房子漏水'],
              correctIndex: 1,
              explanation: '醫療險保障的是疾病或受傷的醫療費用，感冒看醫生就是醫療險的保障範圍。',
            },
            {
              question: '買保險時，定期繳納的費用叫做什麼？',
              options: ['利息', '保費', '手續費', '服務費'],
              correctIndex: 1,
              explanation: '「保費」是投保人定期支付給保險公司的費用，用來換取保險保障。',
            },
            {
              question: '如果保險到期了沒有續保，發生意外時會怎樣？',
              options: ['保險公司照常理賠', '需要自己承擔所有費用', '保險會自動續約', '可以事後再補買'],
              correctIndex: 1,
              explanation: '保險過期後保障就終止了，發生意外需要自己承擔全部費用。記得注意保險到期日！',
            },
          ],
        } as QuizContent,
      },
      {
        id: 'ch-si-5',
        title: '保險記憶大挑戰',
        type: 'game',
        order: 5,
        experienceReward: 20,
        coinReward: 0,
        content: {
          gameType: 'memoryFlip',
        } as GameContent,
      },
    ],
  },

  // 課程四：投資理財
  {
    id: 'course-investment',
    name: '投資理財',
    description: '認識股票與投資的基本概念，學會聰明投資',
    iconUrl: '📈',
    order: 5,
    unlockLevel: 4,
    chapterCount: 6,
    isActive: true,
    chapters: [
      {
        id: 'ch-inv-1',
        title: '阿傑的第一次投資',
        type: 'story',
        order: 1,
        experienceReward: 30,
        coinReward: 0,
        content: {
          videoUrl: '',
          scenarios: [
            {
              label: 'A. 把所有錢投入一支股票',
              description: '阿傑聽同學說某支股票會漲，就把所有積蓄都買了這支股票。',
              result: '股票大跌，阿傑損失慘重。把所有雞蛋放在同一個籃子裡是非常危險的！',
              stars: 1,
              experienceReward: 10,
            },
            {
              label: 'B. 分散買不同的股票和 ETF',
              description: '阿傑先做功課，把錢分散投入不同產業的股票和 ETF。',
              result: '雖然有些股票跌了，但其他的漲了，整體報酬穩定。分散投資是降低風險的好方法！',
              stars: 3,
              experienceReward: 30,
            },
            {
              label: 'C. 因為怕賠錢所以不投資',
              description: '阿傑覺得投資太可怕了，決定把錢全部存在銀行。',
              result: '雖然存款很安全，但利率很低，長期下來可能跟不上物價上漲。適度投資也是理財的一部分。',
              stars: 2,
              experienceReward: 20,
            },
          ],
        } as StoryContent,
      },
      {
        id: 'ch-inv-2',
        title: '什麼是股票？',
        type: 'knowledge',
        order: 2,
        experienceReward: 50,
        coinReward: 0,
        content: {
          videoUrl: '',
        } as KnowledgeContent,
      },
      {
        id: 'ch-inv-3',
        title: '股票基礎小測驗',
        type: 'quiz',
        order: 3,
        experienceReward: 0,
        coinReward: 0,
        content: {
          questions: [
            {
              question: '買股票等於什麼意思？',
              options: ['借錢給公司', '成為公司的股東', '購買公司的產品', '租用公司的設備'],
              correctIndex: 1,
              explanation: '買股票就是買下公司的一小部分所有權，成為公司的股東。公司賺錢時，你也可能獲利。',
            },
            {
              question: 'ETF 的全名是什麼？',
              options: ['Electronic Transfer Fund', 'Exchange Traded Fund', 'Extra Trading Fee', 'Estimated Total Fund'],
              correctIndex: 1,
              explanation: 'ETF 是 Exchange Traded Fund（指數股票型基金），它像一個「套餐」，一次買進多支股票，方便分散風險。',
            },
            {
              question: '在台灣股市，股價上漲時用什麼顏色表示？',
              options: ['綠色', '藍色', '紅色', '黃色'],
              correctIndex: 2,
              explanation: '台灣股市的慣例是「漲紅跌綠」，股價上漲用紅色表示，下跌用綠色表示。和美國股市剛好相反！',
            },
          ],
        } as QuizContent,
      },
      {
        id: 'ch-inv-4',
        title: '認識 ETF 與分散風險',
        type: 'knowledge',
        order: 4,
        experienceReward: 50,
        coinReward: 0,
        content: {
          videoUrl: '',
        } as KnowledgeContent,
      },
      {
        id: 'ch-inv-5',
        title: '投資策略小測驗',
        type: 'quiz',
        order: 5,
        experienceReward: 0,
        coinReward: 0,
        content: {
          questions: [
            {
              question: '「不要把所有雞蛋放在同一個籃子裡」指的是什麼投資觀念？',
              options: ['集中投資', '分散風險', '短線交易', '追高殺低'],
              correctIndex: 1,
              explanation: '這句話的意思是要「分散風險」。將資金分散投入不同的標的，即使其中一個虧損，整體影響也會比較小。',
            },
            {
              question: '以下哪種行為是「追高殺低」？',
              options: ['股價低時買入，高時賣出', '定期定額投入', '股價高時搶進，低時恐慌賣出', '長期持有不交易'],
              correctIndex: 2,
              explanation: '「追高殺低」就是在股價很高時才搶著買，在股價跌低時又害怕地賣掉，這是投資最常見的錯誤。',
            },
            {
              question: '「定期定額」投資法的優點是什麼？',
              options: ['保證賺錢', '不用花任何錢', '平均買入成本，降低風險', '短期就能大賺'],
              correctIndex: 2,
              explanation: '定期定額就是固定時間投入固定金額，在股價高時少買、低時多買，長期下來可以平均成本、降低風險。',
            },
          ],
        } as QuizContent,
      },
      {
        id: 'ch-inv-6',
        title: '投資數字大挑戰',
        type: 'game',
        order: 6,
        experienceReward: 20,
        coinReward: 0,
        content: {
          gameType: 'guessNumber',
        } as GameContent,
      },
    ],
  },
]

async function seed() {
  const batch = db.batch()

  for (const { id: courseId, chapters, ...courseData } of courses) {
    // 寫入課程文件
    const courseRef = db.collection('courses').doc(courseId)
    batch.set(courseRef, courseData)

    // 寫入章節文件（子 collection）
    for (const { id: chapterId, ...chapterData } of chapters) {
      const chapterRef = courseRef.collection('chapters').doc(chapterId)
      batch.set(chapterRef, chapterData)
    }
  }

  await batch.commit()

  for (const course of courses) {
    console.log(`✓ ${course.name}：${course.chapters.length} 個章節`)
  }
  const total = courses.reduce((sum, c) => sum + c.chapters.length, 0)
  console.log(`課程 seed 完成，共 ${courses.length} 個課程、${total} 個章節`)
}

seed()
