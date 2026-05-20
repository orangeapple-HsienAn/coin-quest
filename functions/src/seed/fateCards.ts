/**
 * 命運卡 seed 資料
 * 執行方式：npm run seed:fateCards (在 functions 目錄下)
 *
 * 類型分佈：
 * - risk (10 張)：對應 5 種保險類別，每類 2 張
 * - neutral (3 張)：平安無事
 * - reward (3 張)：正面獎勵
 */
import { initializeApp, applicationDefault } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'

initializeApp({ credential: applicationDefault(), projectId: 'oa-coin-quest' })
const db = getFirestore()

interface FateCardSeed {
  id: string
  type: 'risk' | 'neutral' | 'reward'
  title: string
  description: string
  imageUrl: string
  coinLoss: number
  coinGain: number
  category: string
  weight: number
  isActive: boolean
}

const fateCards: FateCardSeed[] = [
  // === Risk 卡：意外類 (accident) ===
  {
    id: 'risk-accident-1',
    type: 'risk',
    title: '走路滑倒',
    description: '下雨天路滑，不小心摔了一跤，膝蓋擦傷需要就醫。',
    imageUrl: '',
    coinLoss: 3000,
    coinGain: 0,
    category: 'accident',
    weight: 3,
    isActive: true,
  },
  {
    id: 'risk-accident-2',
    type: 'risk',
    title: '運動扭傷',
    description: '打球時不小心扭到腳踝，需要看醫生和復健治療。',
    imageUrl: '',
    coinLoss: 4000,
    coinGain: 0,
    category: 'accident',
    weight: 2,
    isActive: true,
  },

  // === Risk 卡：醫療類 (medical) ===
  {
    id: 'risk-medical-1',
    type: 'risk',
    title: '感冒發燒',
    description: '季節交替不小心感冒了，需要看醫生吃藥休息。',
    imageUrl: '',
    coinLoss: 2000,
    coinGain: 0,
    category: 'medical',
    weight: 4,
    isActive: true,
  },
  {
    id: 'risk-medical-2',
    type: 'risk',
    title: '食物中毒',
    description: '吃到不新鮮的食物，上吐下瀉需要急診治療。',
    imageUrl: '',
    coinLoss: 3000,
    coinGain: 0,
    category: 'medical',
    weight: 2,
    isActive: true,
  },

  // === Risk 卡：火災類 (fire) ===
  {
    id: 'risk-fire-1',
    type: 'risk',
    title: '廚房走火',
    description: '煮飯時油鍋起火，廚房設備受損需要維修。',
    imageUrl: '',
    coinLoss: 8000,
    coinGain: 0,
    category: 'fire',
    weight: 1,
    isActive: true,
  },
  {
    id: 'risk-fire-2',
    type: 'risk',
    title: '颱風水災',
    description: '颱風過境造成家中淹水，家具和電器泡水損壞。',
    imageUrl: '',
    coinLoss: 10000,
    coinGain: 0,
    category: 'fire',
    weight: 1,
    isActive: true,
  },

  // === Risk 卡：癌症類 (cancer) ===
  {
    id: 'risk-cancer-1',
    type: 'risk',
    title: '健檢發現異常',
    description: '年度健檢發現腫瘤指數偏高，需要進一步檢查和治療。',
    imageUrl: '',
    coinLoss: 12000,
    coinGain: 0,
    category: 'cancer',
    weight: 1,
    isActive: true,
  },
  {
    id: 'risk-cancer-2',
    type: 'risk',
    title: '家族病史追蹤',
    description: '因家族癌症病史，醫生建議做深度篩檢，費用不便宜。',
    imageUrl: '',
    coinLoss: 8000,
    coinGain: 0,
    category: 'cancer',
    weight: 1,
    isActive: true,
  },

  // === Risk 卡：竊盜類 (theft) ===
  {
    id: 'risk-theft-1',
    type: 'risk',
    title: '手機被偷',
    description: '搭捷運時手機被扒走了，需要重新購買一支。',
    imageUrl: '',
    coinLoss: 5000,
    coinGain: 0,
    category: 'theft',
    weight: 2,
    isActive: true,
  },
  {
    id: 'risk-theft-2',
    type: 'risk',
    title: '住家遭竊',
    description: '出門旅遊時家裡遭小偷，貴重物品被偷走了。',
    imageUrl: '',
    coinLoss: 8000,
    coinGain: 0,
    category: 'theft',
    weight: 1,
    isActive: true,
  },

  // === Neutral 卡 ===
  {
    id: 'neutral-1',
    type: 'neutral',
    title: '平凡的一天',
    description: '今天一切順利，沒有發生什麼特別的事情。',
    imageUrl: '',
    coinLoss: 0,
    coinGain: 0,
    category: 'none',
    weight: 8,
    isActive: true,
  },
  {
    id: 'neutral-2',
    type: 'neutral',
    title: '悠閒假日',
    description: '在家看了一整天電視，度過了輕鬆的一天。',
    imageUrl: '',
    coinLoss: 0,
    coinGain: 0,
    category: 'none',
    weight: 6,
    isActive: true,
  },
  {
    id: 'neutral-3',
    type: 'neutral',
    title: '天氣晴朗',
    description: '陽光普照，心情愉快地散了個步。',
    imageUrl: '',
    coinLoss: 0,
    coinGain: 0,
    category: 'none',
    weight: 6,
    isActive: true,
  },

  // === Reward 卡 ===
  {
    id: 'reward-1',
    type: 'reward',
    title: '路邊撿到錢',
    description: '在路上撿到一個紅包，裡面有一些零錢！',
    imageUrl: '',
    coinLoss: 0,
    coinGain: 500,
    category: 'none',
    weight: 3,
    isActive: true,
  },
  {
    id: 'reward-2',
    type: 'reward',
    title: '中了小獎',
    description: '買的刮刮樂中獎了，雖然不多但很開心！',
    imageUrl: '',
    coinLoss: 0,
    coinGain: 1000,
    category: 'none',
    weight: 2,
    isActive: true,
  },
  {
    id: 'reward-3',
    type: 'reward',
    title: '績效獎金',
    description: '這個月工作表現優異，老闆額外發了獎金！',
    imageUrl: '',
    coinLoss: 0,
    coinGain: 2000,
    category: 'none',
    weight: 1,
    isActive: true,
  },
]

async function seed() {
  const batch = db.batch()

  for (const { id, ...data } of fateCards) {
    const ref = db.collection('fateCards').doc(id)
    batch.set(ref, data)
  }

  await batch.commit()

  const riskCount = fateCards.filter((c) => c.type === 'risk').length
  const neutralCount = fateCards.filter((c) => c.type === 'neutral').length
  const rewardCount = fateCards.filter((c) => c.type === 'reward').length

  console.log(`✓ Risk 卡 ${riskCount} 張`)
  console.log(`✓ Neutral 卡 ${neutralCount} 張`)
  console.log(`✓ Reward 卡 ${rewardCount} 張`)
  console.log(`命運卡 seed 完成，共 ${fateCards.length} 張`)
}

seed()
