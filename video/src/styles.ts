/**
 * Design System — 課程影片配色與常數
 * 風格：Motion Graphic / Flat / Cute / Fun
 */
import { loadFont } from '@remotion/google-fonts/NotoSansTC'

// 載入 Noto Sans TC 字型（限定 weights 避免載入全部 9 個字重共 945 個請求，減少文字抖動）
export const { fontFamily } = loadFont('normal', {
  weights: ['400', '700'],
})

// === 主色板 ===
export const CORAL = '#FF6B6B'
export const TEAL = '#4ECDC4'
export const SUNSHINE = '#FFE66D'
export const LAVENDER = '#A29BFE'
export const MINT = '#55EFC4'

// === 中性色 ===
export const DARK = '#2D3436'
export const GRAY = '#636E72'
export const WARM_WHITE = '#FFF8F0'

// === 場景背景色 ===
export const BG_TITLE = '#FFF8F0'
export const BG_BLUE = '#F0F9FF'
export const BG_PINK = '#FFF0F0'
export const BG_YELLOW = '#FFFFF0'
export const BG_GREEN = '#F0FFF4'

// === 交替背景色（知識點場景輪流使用） ===
export const CONCEPT_BGS = [BG_BLUE, BG_PINK, BG_YELLOW, BG_GREEN, BG_BLUE]

// === 動畫參數 ===
export const SPRING_BOUNCY = { damping: 10, stiffness: 100 }
export const SPRING_GENTLE = { damping: 15, stiffness: 100 }
