/**
 * 保險產品 seed 資料
 * 執行方式：npm run seed:insurance (在 functions 目錄下)
 */
import { initializeApp, applicationDefault } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'

initializeApp({ credential: applicationDefault(), projectId: 'oa-coin-quest' })
const db = getFirestore()

const insuranceProducts = [
  {
    id: 'accident',
    name: '意外險',
    description: '保障跌倒、扭傷等日常意外傷害',
    iconUrl: '',
    claimAmount: 5000,
    premium: 800,
    durationDays: 30,
    fateCardCategory: 'accident',
    isActive: true,
    order: 1,
  },
  {
    id: 'medical',
    name: '醫療險',
    description: '保障感冒發燒、住院等疾病支出',
    iconUrl: '',
    claimAmount: 3000,
    premium: 600,
    durationDays: 30,
    fateCardCategory: 'medical',
    isActive: true,
    order: 2,
  },
  {
    id: 'fire',
    name: '住宅火災險',
    description: '保障火災、水災等造成的住宅損失',
    iconUrl: '',
    claimAmount: 10000,
    premium: 1500,
    durationDays: 90,
    fateCardCategory: 'fire',
    isActive: true,
    order: 3,
  },
  {
    id: 'cancer',
    name: '癌症險',
    description: '保障癌症治療的高額醫療費用',
    iconUrl: '',
    claimAmount: 15000,
    premium: 3000,
    durationDays: 90,
    fateCardCategory: 'cancer',
    isActive: true,
    order: 4,
  },
  {
    id: 'theft',
    name: '竊盜險',
    description: '保障住宅遭竊或個人財物被盜的損失',
    iconUrl: '',
    claimAmount: 8000,
    premium: 1200,
    durationDays: 60,
    fateCardCategory: 'theft',
    isActive: true,
    order: 5,
  },
]

async function seed() {
  for (const { id, ...data } of insuranceProducts) {
    await db.collection('insuranceProducts').doc(id).set(data)
    console.log(`✓ ${data.name} (${id})`)
  }
  console.log('保險產品 seed 完成')
}

seed()
