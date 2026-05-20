/**
 * 等級 seed 資料（10 級完整數值表）
 * 執行方式：npm run seed:levels (在 functions 目錄下)
 */
import { initializeApp, applicationDefault } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'

initializeApp({ credential: applicationDefault(), projectId: 'oa-coin-quest' })
const db = getFirestore()

const levels = [
  { level: 1, name: '打工新手', dailySalary: 1000, experienceRequired: 0 },
  { level: 2, name: '資深打工族', dailySalary: 1200, experienceRequired: 1600 },
  { level: 3, name: '職場實習生', dailySalary: 1400, experienceRequired: 3600 },
  { level: 4, name: '正職工具人', dailySalary: 1600, experienceRequired: 6000 },
  { level: 5, name: '資深老油條', dailySalary: 1800, experienceRequired: 9000 },
  { level: 6, name: '專案小組長', dailySalary: 2200, experienceRequired: 13000 },
  { level: 7, name: '救火大隊長', dailySalary: 2600, experienceRequired: 18000 },
  { level: 8, name: '拆彈專家', dailySalary: 3000, experienceRequired: 25000 },
  { level: 9, name: '策略大師', dailySalary: 3600, experienceRequired: 35000 },
  { level: 10, name: '專案決策者', dailySalary: 4200, experienceRequired: 50000 },
]

async function seed() {
  for (const { level, ...data } of levels) {
    await db.collection('levels').doc(String(level)).set({ level, ...data, badgeUrl: '' })
    console.log(`✓ Lv.${level} ${data.name}`)
  }
  console.log(`等級 seed 完成，共 ${levels.length} 筆`)
}

seed()
