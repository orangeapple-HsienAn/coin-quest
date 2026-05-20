/** Admin CRUD 欄位定義 */
export interface FieldDef {
  key: string
  label: string
  type: 'text' | 'number' | 'boolean' | 'select' | 'textarea'
  options?: { value: string; label: string }[]
  required?: boolean
}

/** Collection 設定 */
export interface CollectionConfig {
  label: string
  icon: string
  path: string          // Firestore collection 路徑
  fields: FieldDef[]
  hasIdInput?: boolean   // 新增時是否手動輸入 doc ID
}

// 各 collection 的欄位設定
export const COLLECTIONS: Record<string, CollectionConfig> = {
  fateCards: {
    label: '命運卡',
    icon: '🎴',
    path: 'fateCards',
    hasIdInput: true,
    fields: [
      { key: 'type', label: '類型', type: 'select', required: true, options: [
        { value: 'risk', label: '風險' },
        { value: 'neutral', label: '無事' },
        { value: 'reward', label: '獎勵' },
      ]},
      { key: 'title', label: '標題', type: 'text', required: true },
      { key: 'description', label: '描述', type: 'textarea', required: true },
      { key: 'imageUrl', label: '圖片 URL', type: 'text' },
      { key: 'coinLoss', label: '損失金幣', type: 'number' },
      { key: 'coinGain', label: '獲得金幣', type: 'number' },
      { key: 'category', label: '類別', type: 'text', required: true },
      { key: 'weight', label: '權重', type: 'number', required: true },
      { key: 'isActive', label: '啟用', type: 'boolean' },
    ],
  },

  courses: {
    label: '課程',
    icon: '📘',
    path: 'courses',
    hasIdInput: true,
    fields: [
      { key: 'name', label: '課程名稱', type: 'text', required: true },
      { key: 'description', label: '描述', type: 'textarea', required: true },
      { key: 'iconUrl', label: '圖示 (emoji)', type: 'text', required: true },
      { key: 'order', label: '排序', type: 'number', required: true },
      { key: 'unlockLevel', label: '解鎖等級', type: 'number', required: true },
      { key: 'chapterCount', label: '章節數', type: 'number', required: true },
      { key: 'isActive', label: '啟用', type: 'boolean' },
    ],
  },

  insuranceProducts: {
    label: '保險產品',
    icon: '🛡️',
    path: 'insuranceProducts',
    hasIdInput: true,
    fields: [
      { key: 'name', label: '名稱', type: 'text', required: true },
      { key: 'description', label: '說明', type: 'textarea', required: true },
      { key: 'iconUrl', label: '圖示', type: 'text' },
      { key: 'claimAmount', label: '理賠金額', type: 'number', required: true },
      { key: 'premium', label: '保費', type: 'number', required: true },
      { key: 'durationDays', label: '效期（天）', type: 'number', required: true },
      { key: 'fateCardCategory', label: '對應命運卡類別', type: 'text', required: true },
      { key: 'isActive', label: '啟用', type: 'boolean' },
      { key: 'order', label: '排序', type: 'number' },
    ],
  },

  levels: {
    label: '等級',
    icon: '📊',
    path: 'levels',
    hasIdInput: true,
    fields: [
      { key: 'level', label: '等級', type: 'number', required: true },
      { key: 'name', label: '稱號', type: 'text', required: true },
      { key: 'dailySalary', label: '日薪', type: 'number', required: true },
      { key: 'experienceRequired', label: '所需經驗', type: 'number', required: true },
      { key: 'badgeUrl', label: '徽章 URL', type: 'text' },
    ],
  },

  stocks: {
    label: '股票',
    icon: '📈',
    path: 'stocks',
    hasIdInput: true,
    fields: [
      { key: 'symbol', label: '代號', type: 'text', required: true },
      { key: 'name', label: '名稱', type: 'text', required: true },
      { key: 'country', label: '國家', type: 'text', required: true },
      { key: 'currentPrice', label: '現價', type: 'number', required: true },
      { key: 'previousClose', label: '前收盤價', type: 'number', required: true },
      { key: 'change', label: '漲跌', type: 'number' },
      { key: 'changePercent', label: '漲跌幅 %', type: 'number' },
      { key: 'isIndex', label: '指數', type: 'boolean' },
      { key: 'isActive', label: '啟用', type: 'boolean' },
    ],
  },
}

// 章節欄位設定（用於 AdminChaptersPage）
export const CHAPTER_FIELDS: FieldDef[] = [
  { key: 'title', label: '標題', type: 'text', required: true },
  { key: 'type', label: '類型', type: 'select', required: true, options: [
    { value: 'story', label: '小故事' },
    { value: 'knowledge', label: '小知識' },
    { value: 'quiz', label: '小測驗' },
    { value: 'game', label: '小遊戲' },
  ]},
  { key: 'order', label: '排序', type: 'number', required: true },
  { key: 'experienceReward', label: '經驗獎勵', type: 'number', required: true },
  { key: 'coinReward', label: '金幣獎勵', type: 'number' },
  { key: 'content', label: '內容 (JSON)', type: 'textarea' },
]
