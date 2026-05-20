/**
 * Remotion Root — 註冊所有影片 Composition
 * 使用 `npm run studio` 預覽
 */
import { Composition } from 'remotion'
import { StoryVideo, calculateStoryMetadata } from './compositions/StoryVideo'
import { KnowledgeVideo, calculateKnowledgeMetadata } from './compositions/KnowledgeVideo'
import type { StoryVideoProps, KnowledgeVideoProps } from './types'

// ==============================
// Lesson 1：支出與公益
// ==============================

/** Ch1：小琪的週末購物日（小故事） */
const storyL01: StoryVideoProps & { compositionId: string } = {
  compositionId: 'story-s1-L01',
  title: '小琪的週末購物日',
  courseIcon: '🛒',
  character: { name: '小琪', icon: '👧' },
  storyScenes: [
    {
      text: '小琪一走進文具店，眼睛馬上亮了起來——哇！那邊有一組超～可愛的彩色筆！48 色耶！但等等……她低頭看看自己的書包，拉鍊壞掉了，課本都快掉出來了啦！',
      icon: '🎒',
    },
    {
      text: '書包要 350 元，彩色筆要 200 元。小琪掏出口袋裡的錢數了數——只有 500 元！兩個加起來要 550 元，不夠啊！怎麼辦？只能選一個！',
      icon: '💭',
    },
  ],
  choiceLabels: [
    'A. 兩個都買，跟媽媽借不夠的錢',
    'B. 先買書包，彩色筆等下次再買',
    'C. 只買彩色筆，書包用膠帶黏一黏',
  ],
}

/** Ch2：需要 vs 想要，傻傻分不清？（小知識） */
const knowledgeL01_2: KnowledgeVideoProps & { compositionId: string } = {
  compositionId: 'knowledge-s1-L01-2',
  title: '需要 vs 想要，傻傻分不清？',
  courseIcon: '🧠',
  scenes: [
    //需要 vs 想要概念
    {
      type: 'concept',
      icon: '🍚',
      heading: '需要 vs 想要，到底差在哪？',
      description: '「需要」就是沒有的話會出問題的東西——像是每天的午餐、喝的水、上學穿的制服。「想要」呢？就是有了很開心，但沒有其實也不會怎樣——像是最新的遊戲卡、第十盒彩色筆。',
    },
    //需要 vs 想要 對比插圖
    {
      type: 'image',
      src: 'images/knowledge-s1-L01-2/scene-1.png',
      caption: '需要 vs 想要',
    },
    //猜猜看小遊戲
    {
      type: 'concept',
      icon: '🎯',
      heading: '來玩一個小遊戲！',
      description: '冬天穿的外套——需要！一杯 50 元的珍珠奶茶——想要！上學用的鉛筆——需要！電動遊戲的新角色造型——想要！你答對幾個？',
    },
    //猜猜看物品插圖
    {
      type: 'image',
      src: 'images/knowledge-s1-L01-2/scene-3.png',
      caption: '你答對幾個？',
    },
    //記帳概念
    {
      type: 'concept',
      icon: '📒',
      heading: '記帳就是幫錢拍照！',
      description: '記帳就是幫每一塊錢拍照、做紀錄。你花了 30 元買飲料？寫下來。花了 50 元買文具？寫下來。一個禮拜後回頭看——原來我花最多錢的地方是這裡！是不是很像偵探在找線索？',
    },
    //記帳概念插圖
    {
      type: 'image',
      src: 'images/knowledge-s1-L01-2/scene-5.png',
      caption: '幫每一塊錢拍照！',
    },
    //記帳小偵探
    {
      type: 'concept',
      icon: '✏️',
      heading: '記帳小偵探養成術',
      description: '準備一本小筆記本，每天花錢後馬上記下來，寫「花了多少錢」和「買了什麼」。然後在旁邊標一個 N（需要）或 W（想要）。一個月後打開來看，你可能會嚇一跳！',
    },
    //記帳步驟插圖
    {
      type: 'image',
      src: 'images/knowledge-s1-L01-2/scene-7.png',
      caption: '記帳小偵探出動！',
    },
  ],
  takeaways: [
    '「需要」是沒有會出問題的東西，「想要」是有了很開心、沒有也 OK',
    '花錢時先搞定「需要」，有剩再考慮「想要」',
    '記帳就像偵探找線索，幫你抓出每一塊錢的去向',
  ],
}

/** Ch3：用零用錢做好事（小知識） */
const knowledgeL01_3: KnowledgeVideoProps & { compositionId: string } = {
  compositionId: 'knowledge-s1-L01-3',
  title: '用零用錢做好事',
  courseIcon: '💝',
  scenes: [
    //什麼是公益
    {
      type: 'concept',
      icon: '🤝',
      heading: '你聽過「公益」嗎？',
      description: '世界上有些小朋友，沒有乾淨的水可以喝、沒有學校可以上。「公益」就是做對別人有幫助的好事——像是捐錢給需要的人、當志工、或是到育幼院陪小朋友玩。',
    },
    //公益場景插圖
    {
      type: 'image',
      src: 'images/knowledge-s1-L01-3/scene-1.png',
      caption: '做對別人有幫助的好事',
    },
    //小朋友也能做公益
    {
      type: 'concept',
      icon: '🌟',
      heading: '小朋友也能做公益！',
      description: '做公益不需要很有錢！你可以把零用錢的一小部分存起來捐出去，比如每個月存 50 元，一年就有 600 元！或是把家裡不玩的玩具、看過的故事書送給需要的小朋友。',
    },
    //小朋友捐物資插圖
    {
      type: 'image',
      src: 'images/knowledge-s1-L01-3/scene-3.png',
      caption: '整理玩具和故事書捐出去',
    },
    //捐錢前做功課
    {
      type: 'concept',
      icon: '🔍',
      heading: '等等！捐錢之前要先做功課',
      description: '捐錢之前要先查三件事：這個機構有沒有政府核准的證明？他們有沒有公開說明錢會用在哪裡？不確定的話，記得問爸爸媽媽一起查查看。做好功課再捐，愛心才不會被浪費！',
    },
    //查核機構插圖
    {
      type: 'image',
      src: 'images/knowledge-s1-L01-3/scene-5.png',
      caption: '和爸媽一起查查看',
    },
    //沒有錢也能做公益
    {
      type: 'concept',
      icon: '🎁',
      heading: '沒有錢也能做公益？',
      description: '除了捐錢，你還可以捐你的「時間」！週末花一個小時去老人院陪爺爺奶奶聊天，他們會非常開心。或是把不穿的衣服、不用的文具整理乾淨捐出去。付出時間和關心，比金錢還珍貴！',
    },
    //時間捐贈插圖
    {
      type: 'image',
      src: 'images/knowledge-s1-L01-3/scene-7.png',
      caption: '付出時間和關心',
    },
  ],
  takeaways: [
    '公益就是做對別人有幫助的好事，小朋友也做得到',
    '捐款之前要先和爸媽一起查機構是否合法、資訊是否公開',
    '除了捐錢，捐物資或付出時間也是超棒的公益方式',
  ],
}

// ==============================
// Lesson 2：古代貨幣
// ==============================

/** Ch1：小傑的交換大作戰（小故事） */
const storyL02: StoryVideoProps & { compositionId: string } = {
  compositionId: 'story-s1-L02',
  title: '小傑的交換大作戰',
  courseIcon: '🪙',
  character: { name: '小傑', icon: '👦' },
  storyScenes: [
    {
      text: '小傑帶了一盒超好吃的手工餅乾來學校。他超想要小美手上那本超人氣漫畫！但小美說：「我不想要餅乾耶，我想要彩色筆。」小傑跑去問有彩色筆的阿凱，結果阿凱說：「我不想要餅乾，我想要貼紙！」',
      icon: '😵',
    },
    {
      text: '天哪！小傑要先找到有貼紙的人、用餅乾換到貼紙、再拿貼紙去跟阿凱換彩色筆、最後才能拿彩色筆去跟小美換漫畫！繞了一大圈，而且下課時間快結束了！如果有一種「大家都想要的東西」可以直接拿來交換，那該有多好？',
      icon: '💭',
    },
  ],
  choiceLabels: [
    'A. 放棄交換，把餅乾自己吃掉',
    'B. 耐心一步一步換，最後換到漫畫',
    'C. 大聲跟小美說：「妳就拿餅乾嘛！」',
  ],
}

/** Ch2：沒有錢的世界？以物易物大冒險！（小知識） */
const knowledgeL02_2: KnowledgeVideoProps & { compositionId: string } = {
  compositionId: 'knowledge-s1-L02-2',
  title: '沒有錢的世界？以物易物大冒險！',
  courseIcon: '🔄',
  scenes: [
    //沒有錢怎麼買東西？
    {
      type: 'concept',
      icon: '🌍',
      heading: '沒有錢怎麼買東西？',
      description: '在很久很久以前，沒有鈔票、沒有硬幣、連悠遊卡都沒有！人們靠「以物易物」過日子——用自己的東西去換別人的東西。',
    },
    //古代以物易物場景
    {
      type: 'image',
      src: 'images/knowledge-s1-L02-2/scene-1.png',
      caption: '古代的市集——以物易物',
    },
    //以物易物的大麻煩
    {
      type: 'concept',
      icon: '😰',
      heading: '以物易物的超級大麻煩！',
      description: '你想要的東西，對方不一定想跟你換！這在經濟學裡叫「需求的雙重巧合」——兩個人要剛好互相需要對方的東西。',
    },
    //找不到人換
    {
      type: 'image',
      src: 'images/knowledge-s1-L02-2/scene-3.png',
      caption: '找不到人換怎麼辦？',
    },
    //一條魚值幾顆蘋果？
    {
      type: 'concept',
      icon: '⚖️',
      heading: '一條魚值幾顆蘋果？',
      description: '東西要怎麼算「等值」？沒有統一的標準，每次交換都要爭論半天——大家都覺得自己的東西比較好！',
    },
    //爭論價值
    {
      type: 'image',
      src: 'images/knowledge-s1-L02-2/scene-5.png',
      caption: '沒有標準，吵不完！',
    },
    //世界上最奇怪的「錢」
    {
      type: 'concept',
      icon: '🌎',
      heading: '世界上最奇怪的「錢」',
      description: '有人用鹽巴當錢、有人用茶葉、有人用貝殼，甚至有人用比人還高的大石頭當錢！',
    },
    //各種奇特貨幣
    {
      type: 'image',
      src: 'images/knowledge-s1-L02-2/scene-7.png',
      caption: '各種奇特的早期「貨幣」',
    },
    //為什麼需要發明「錢」？
    {
      type: 'concept',
      icon: '💡',
      heading: '為什麼人類需要發明「錢」？',
      description: '人們需要一種大家都認同的東西——方便交換、方便攜帶、不容易壞掉。後來他們找到了最棒的答案——金屬！',
    },
    //從以物易物到貨幣
    {
      type: 'image',
      src: 'images/knowledge-s1-L02-2/scene-9.png',
      caption: '以物易物 → 貨幣的誕生',
    },
  ],
  takeaways: [
    '以物易物就是直接用東西換東西，不用錢',
    '最大的困難：找不到互相需要的人，也很難算出誰比較值錢',
    '為了解決這些問題，人類才一步步發明了「貨幣」',
  ],
}

/** Ch3：從貝殼到金塊——貨幣變變變！（小知識） */
const knowledgeL02_3: KnowledgeVideoProps & { compositionId: string } = {
  compositionId: 'knowledge-s1-L02-3',
  title: '從貝殼到金塊——貨幣變變變！',
  courseIcon: '🐚',
  scenes: [
    //猜猜看，第一種「錢」是什麼？
    {
      type: 'concept',
      icon: '🐚',
      heading: '猜猜看，第一種「錢」是什麼？',
      description: '提示：它來自海邊，小小的、亮亮的……你猜到了嗎？',
    },
    //寶貝螺
    {
      type: 'image',
      src: 'images/knowledge-s1-L02-3/scene-1.png',
      caption: '寶貝螺——最早的「錢」',
    },
    //貝殼的缺點
    {
      type: 'concept',
      icon: '🔨',
      heading: '貝殼也有缺點？',
      description: '貝殼容易碎掉，而且只要去海邊就能撿到——太容易取得的東西大家就不覺得珍貴了！',
    },
    //貝殼問題
    {
      type: 'image',
      src: 'images/knowledge-s1-L02-3/scene-3.png',
      caption: '貝殼容易壞、太容易撿到',
    },
    //金銀為什麼適合當貨幣？
    {
      type: 'concept',
      icon: '✨',
      heading: '為什麼金子銀子最適合當「錢」？',
      description: '三大原因：稀有所以珍貴、不會生鏽也不會腐爛、閃閃發光大家都喜歡！',
    },
    //金銀三大優點
    {
      type: 'image',
      src: 'images/knowledge-s1-L02-3/scene-5.png',
      caption: '金銀的三大優點',
    },
    //金屬怎麼變成錢幣？
    {
      type: 'concept',
      icon: '⚖️',
      heading: '金屬怎麼變成「錢幣」？',
      description: '聰明的古代人把金屬做成固定大小、固定重量的錢幣，上面刻國王頭像當標記。世界上最早的錢幣出現在兩千七百年前的土耳其！',
    },
    //最早的錢幣
    {
      type: 'image',
      src: 'images/knowledge-s1-L02-3/scene-7.png',
      caption: '世界最早的錢幣——距今兩千七百年',
    },
    //中國銅錢的秘密
    {
      type: 'concept',
      icon: '🪙',
      heading: '中國銅錢的秘密',
      description: '方孔圓錢——外面圓圓的、中間方方的洞，可以用繩子穿成一串帶著走。一串「一貫」就是一千個銅錢，重三、四公斤！',
    },
    //方孔圓錢
    {
      type: 'image',
      src: 'images/knowledge-s1-L02-3/scene-9.png',
      caption: '方孔圓錢——穿起來帶著走',
    },
  ],
  takeaways: [
    '貝殼是最早的「貨幣」之一，但容易壞、太好取得',
    '金銀因為稀有、耐久、閃亮，成為最受歡迎的貨幣材料',
    '古人把金屬做成固定重量的錢幣，省去秤重的麻煩',
    '中國方孔圓錢可以用繩子穿成一串，方便攜帶',
  ],
}

/** Ch4：紙鈔大發明——古人的防偽黑科技！（小知識） */
const knowledgeL02_4: KnowledgeVideoProps & { compositionId: string } = {
  compositionId: 'knowledge-s1-L02-4',
  title: '紙鈔大發明——古人的防偽黑科技！',
  courseIcon: '📜',
  scenes: [
    //金屬錢幣的大煩惱
    {
      type: 'concept',
      icon: '💪',
      heading: '金屬錢幣的大煩惱',
      description: '一串銅錢就有三、四公斤重！如果要買貴的東西，要帶幾百串出門——根本走不動！',
    },
    //帶錢出門好辛苦
    {
      type: 'image',
      src: 'images/knowledge-s1-L02-4/scene-1.png',
      caption: '帶錢出門好辛苦！',
    },
    //世界第一張紙鈔——交子
    {
      type: 'concept',
      icon: '🏆',
      heading: '世界第一張紙鈔——交子！',
      description: '大約一千年前，中國宋朝的商人發明了紙鈔「交子」。把銅錢存在錢莊，拿一張紙收據就能買東西！比歐洲人早了六百多年！',
    },
    //交子
    {
      type: 'image',
      src: 'images/knowledge-s1-L02-4/scene-3.png',
      caption: '交子——中國發明，世界第一！',
    },
    //古代紙鈔怎麼防偽？
    {
      type: 'concept',
      icon: '😱',
      heading: '古代紙鈔怎麼防偽？',
      description: '古代人在紙鈔上加了三大防偽設計：特殊紙張、超複雜的花紋圖案、以及官方大紅印章。一般人根本沒辦法模仿！',
    },
    //防偽三招
    {
      type: 'image',
      src: 'images/knowledge-s1-L02-4/scene-5.png',
      caption: '三大防偽招數',
    },
    //做假鈔的下場
    {
      type: 'concept',
      icon: '🚨',
      heading: '做假鈔的下場',
      description: '偽造貨幣從古到今都是非常嚴重的罪！宋朝的交子上面甚至直接印了警告文字。千萬不要有造假的念頭喔！',
    },
    //偽造的嚴重性
    {
      type: 'image',
      src: 'images/knowledge-s1-L02-4/scene-7.png',
      caption: '偽造紙鈔，後果嚴重！',
    },
    //防偽一直在進化
    {
      type: 'concept',
      icon: '🧠',
      heading: '從古代到現代——防偽一直在進化！',
      description: '古代用特殊紙張和花紋，現代鈔票有浮水印、變色油墨、隱藏數字。一切的起點就是一千年前中國人發明的交子！',
    },
    //防偽進化史
    {
      type: 'image',
      src: 'images/knowledge-s1-L02-4/scene-9.png',
      caption: '防偽技術不斷進化',
    },
  ],
  takeaways: [
    '金屬貨幣太重，促使人們發明了紙鈔',
    '世界第一張紙鈔「交子」誕生在中國宋朝，比歐洲早六百多年',
    '古代紙鈔的防偽三招：特殊紙張、複雜花紋、官方印章',
    '偽造貨幣從古到今都是嚴重犯罪，千萬不能做',
  ],
}

// ==============================
// Lesson 3：現代貨幣與支付工具
// ==============================

/** Ch1：小美的神奇付款日（小故事） */
const storyL03: StoryVideoProps & { compositionId: string } = {
  compositionId: 'story-s1-L03',
  title: '小美的神奇付款日',
  courseIcon: '💳',
  character: { name: '小美', icon: '👧' },
  storyScenes: [
    {
      text: '欸！不帶錢包？那要怎麼付錢啊？小美滿頭問號地跟著爸爸走進超市。他們買了蛋糕材料、氣球、果汁、還有一大袋零食。到了結帳的時候——結果爸爸從口袋掏出手機，對著機器「嗶」了一聲，螢幕就顯示「付款成功」！',
      icon: '📱',
    },
    {
      text: '小美看傻了：「手機裡面有錢嗎？怎麼嗶一下就買到東西了？那如果手機沒電怎麼辦？是不是就不能付錢了？」爸爸笑了笑說：「這叫做行動支付喔！不過確實，如果手機沒電就不能用了。所以你覺得，出門應該只靠一種付款方式嗎？」',
      icon: '💭',
    },
  ],
  choiceLabels: [
    'A. 以後都用手機付款就好了',
    'B. 認識各種付款方式，多準備幾種',
    'C. 現金最可靠，不要用手機付款',
  ],
}

/** Ch2：鈔票裡的小祕密——防偽大解密！（小知識） */
const knowledgeL03_2: KnowledgeVideoProps & { compositionId: string } = {
  compositionId: 'knowledge-s1-L03-2',
  title: '鈔票裡的小祕密——防偽大解密！',
  courseIcon: '🔍',
  scenes: [
    // 鈔票偵探出動
    {
      type: 'concept',
      icon: '🔍',
      heading: '鈔票偵探出動！',
      description: '每張鈔票上都藏了超多小祕密！這些祕密是用來防止壞人印假鈔的「防偽技術」！跟我一起來當「鈔票偵探」吧！',
    },
    {
      type: 'image',
      src: 'images/knowledge-s1-L03-2/scene-1.png',
      caption: '鈔票偵探出動！',
    },
    // 浮水印
    {
      type: 'concept',
      icon: '💡',
      heading: '第一招：浮水印',
      description: '拿起一張鈔票，對著燈光看——紙裡面藏了一個圖案！它是造紙時嵌進去的，不是印上去的，影印機根本印不出來！',
    },
    {
      type: 'image',
      src: 'images/knowledge-s1-L03-2/scene-3.png',
      caption: '對著光看——浮水印現身！',
    },
    // 變色油墨
    {
      type: 'concept',
      icon: '🎨',
      heading: '第二招：變色油墨',
      description: '鈔票上有些數字，從不同角度看顏色會變！正面看是金色，側面看變成綠色！這種油墨超級貴，造假的人根本買不到！',
    },
    {
      type: 'image',
      src: 'images/knowledge-s1-L03-2/scene-5.png',
      caption: '角度不同，顏色就變！',
    },
    // 凹版印刷
    {
      type: 'concept',
      icon: '✋',
      heading: '第三招：凹版印刷',
      description: '用手指輕輕滑過鈔票表面，有些地方是凸凸的——那就是凹版印刷！真鈔摸起來有顆粒感，假鈔是平滑的。閉著眼睛也能辨真假！',
    },
    {
      type: 'image',
      src: 'images/knowledge-s1-L03-2/scene-7.png',
      caption: '用摸的也能辨真假！',
    },
    // 安全線
    {
      type: 'concept',
      icon: '🧵',
      heading: '第四招：隱藏安全線',
      description: '鈔票的紙裡面藏了一條金屬線！有些閃亮、有些會變色、有些印了超迷你文字。這些都是造假的人很難複製的技術！',
    },
    {
      type: 'image',
      src: 'images/knowledge-s1-L03-2/scene-9.png',
      caption: '紙裡藏了一條安全線！',
    },
  ],
  takeaways: [
    '浮水印——對光看到隱藏圖案',
    '變色油墨——不同角度顏色會變',
    '凹版印刷——用摸的就能辨真假',
    '安全線——紙裡藏了金屬線',
  ],
}

/** Ch3：不帶現金也能買東西？支付工具大集合！（小知識） */
const knowledgeL03_3: KnowledgeVideoProps & { compositionId: string } = {
  compositionId: 'knowledge-s1-L03-3',
  title: '不帶現金也能買東西？支付工具大集合！',
  courseIcon: '💳',
  scenes: [
    // 不帶現金也能買東西？
    {
      type: 'concept',
      icon: '🤯',
      heading: '不帶現金也能買東西？',
      description: '除了鈔票和硬幣，人類還發明了好多種付錢的方法。今天就來認識這些厲害的「支付工具」！',
    },
    {
      type: 'image',
      src: 'images/knowledge-s1-L03-3/scene-1.png',
      caption: '支付工具大集合！',
    },
    // 金融卡
    {
      type: 'concept',
      icon: '💳',
      heading: '金融卡——你的銀行帳戶好夥伴',
      description: '金融卡連著你的銀行帳戶，刷卡的時候錢直接從帳戶扣掉。帳戶有多少才能花多少，就像銀行在幫你跑腿！',
    },
    {
      type: 'image',
      src: 'images/knowledge-s1-L03-3/scene-3.png',
      caption: '金融卡的運作方式',
    },
    // 信用卡
    {
      type: 'concept',
      icon: '🦸',
      heading: '信用卡——先買後付的超能力',
      description: '信用卡就像銀行先幫你墊錢！你今天買，月底再還。但花的錢最後還是要還的！忘記還會被多收「利息」喔！',
    },
    {
      type: 'image',
      src: 'images/knowledge-s1-L03-3/scene-5.png',
      caption: '信用卡：先買後付，月底要還！',
    },
    // 行動支付
    {
      type: 'concept',
      icon: '📱',
      heading: '行動支付——手機變錢包！',
      description: '手機裡安裝電子錢包，綁定銀行帳戶或信用卡。掃碼或感應，嗶一聲——付款完成！不用掏錢包、不用找零！',
    },
    {
      type: 'image',
      src: 'images/knowledge-s1-L03-3/scene-7.png',
      caption: '手機嗶一下，付款完成！',
    },
    // 支付工具小提醒
    {
      type: 'concept',
      icon: '⚠️',
      heading: '支付工具小提醒',
      description: '行動支付不是萬能的！手機沒電不能用、有些小店只收現金。最聰明的做法是多準備幾種支付方式，遇到什麼狀況都不怕！',
    },
    {
      type: 'image',
      src: 'images/knowledge-s1-L03-3/scene-9.png',
      caption: '多種支付方式才安全！',
    },
  ],
  takeaways: [
    '金融卡直接從銀行帳戶扣款',
    '信用卡是「先買後付」，月底要記得還',
    '行動支付靠手機就能付錢',
    '多準備幾種支付方式最安全',
  ],
}

// ==============================
// 註冊 Compositions
// ==============================

export const RemotionRoot: React.FC = () => {
  return (
    <>
      {/* Lesson 1 — 小故事 */}
      <Composition
        id="story-s1-L01"
        component={StoryVideo as React.FC}
        durationInFrames={720}
        width={1920}
        height={1080}
        fps={30}
        defaultProps={storyL01}
        calculateMetadata={calculateStoryMetadata}
      />

      {/* Lesson 1 — 小知識：需要 vs 想要 */}
      <Composition
        id="knowledge-s1-L01-2"
        component={KnowledgeVideo as React.FC}
        durationInFrames={1080}
        width={1920}
        height={1080}
        fps={30}
        defaultProps={knowledgeL01_2}
        calculateMetadata={calculateKnowledgeMetadata}
      />

      {/* Lesson 1 — 小知識：用零用錢做好事 */}
      <Composition
        id="knowledge-s1-L01-3"
        component={KnowledgeVideo as React.FC}
        durationInFrames={1080}
        width={1920}
        height={1080}
        fps={30}
        defaultProps={knowledgeL01_3}
        calculateMetadata={calculateKnowledgeMetadata}
      />

      {/* Lesson 2 — 小故事：小傑的交換大作戰 */}
      <Composition
        id="story-s1-L02"
        component={StoryVideo as React.FC}
        durationInFrames={720}
        width={1920}
        height={1080}
        fps={30}
        defaultProps={storyL02}
        calculateMetadata={calculateStoryMetadata}
      />

      {/* Lesson 2 — 小知識：以物易物大冒險 */}
      <Composition
        id="knowledge-s1-L02-2"
        component={KnowledgeVideo as React.FC}
        durationInFrames={1200}
        width={1920}
        height={1080}
        fps={30}
        defaultProps={knowledgeL02_2}
        calculateMetadata={calculateKnowledgeMetadata}
      />

      {/* Lesson 2 — 小知識：貝殼到金塊 */}
      <Composition
        id="knowledge-s1-L02-3"
        component={KnowledgeVideo as React.FC}
        durationInFrames={1200}
        width={1920}
        height={1080}
        fps={30}
        defaultProps={knowledgeL02_3}
        calculateMetadata={calculateKnowledgeMetadata}
      />

      {/* Lesson 2 — 小知識：紙鈔防偽 */}
      <Composition
        id="knowledge-s1-L02-4"
        component={KnowledgeVideo as React.FC}
        durationInFrames={1200}
        width={1920}
        height={1080}
        fps={30}
        defaultProps={knowledgeL02_4}
        calculateMetadata={calculateKnowledgeMetadata}
      />

      {/* Lesson 3 — 小故事：小美的神奇付款日 */}
      <Composition
        id="story-s1-L03"
        component={StoryVideo as React.FC}
        durationInFrames={720}
        width={1920}
        height={1080}
        fps={30}
        defaultProps={storyL03}
        calculateMetadata={calculateStoryMetadata}
      />

      {/* Lesson 3 — 小知識：鈔票防偽大解密 */}
      <Composition
        id="knowledge-s1-L03-2"
        component={KnowledgeVideo as React.FC}
        durationInFrames={1200}
        width={1920}
        height={1080}
        fps={30}
        defaultProps={knowledgeL03_2}
        calculateMetadata={calculateKnowledgeMetadata}
      />

      {/* Lesson 3 — 小知識：支付工具大集合 */}
      <Composition
        id="knowledge-s1-L03-3"
        component={KnowledgeVideo as React.FC}
        durationInFrames={1200}
        width={1920}
        height={1080}
        fps={30}
        defaultProps={knowledgeL03_3}
        calculateMetadata={calculateKnowledgeMetadata}
      />
    </>
  )
}
