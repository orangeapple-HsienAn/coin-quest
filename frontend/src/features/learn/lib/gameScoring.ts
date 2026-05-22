/**
 * 小遊戲分數 → 星級 / 金幣換算（5.5）
 *
 * Figma 設計的金幣對照：
 *   1★ → +50
 *   2★ → +100
 *   3★ → +200
 *
 * 星級門檻：CMS 端 publishedGames 之後會加 scoreThresholds 欄位，
 * 在那之前，使用以下預設值（之後接 CMS 資料時改成讀 meta.scoreThresholds）。
 */
export interface ScoreThresholds {
  star1: number
  star2: number
  star3: number
}

export const DEFAULT_SCORE_THRESHOLDS: ScoreThresholds = {
  star1: 30,
  star2: 60,
  star3: 90,
}

export const STAR_COIN_REWARDS = [0, 50, 100, 200] as const // index = 星數

export function computeStars(score: number, thresholds: ScoreThresholds = DEFAULT_SCORE_THRESHOLDS): number {
  if (score >= thresholds.star3) return 3
  if (score >= thresholds.star2) return 2
  if (score >= thresholds.star1) return 1
  return 0
}

export function coinsForStars(stars: number): number {
  return STAR_COIN_REWARDS[Math.max(0, Math.min(3, stars))]
}
