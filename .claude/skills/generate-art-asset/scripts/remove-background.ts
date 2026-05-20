/**
 * 洋紅背景去背：對角落取樣實際背景色，再用 ImageMagick 進行 flood fill 去背
 *
 * 用法：npx tsx scripts/remove-background.ts input.png [output.png]
 * 如果不指定 output，會覆蓋原檔
 *
 * 原理：Gemini 產生的洋紅背景可能有色差，因此先取樣四角實際顏色，
 * 再用該顏色搭配 fuzz 容差進行 flood fill 去除。
 */
import sharp from 'sharp'
import { execSync } from 'child_process'
import path from 'path'

/**
 * 取樣四角像素，回傳最常見的 hex 色碼
 */
async function sampleCornerColor(imagePath: string): Promise<string> {
  const { data, info } = await sharp(path.resolve(imagePath))
    .raw()
    .toBuffer({ resolveWithObject: true })

  const w = info.width
  const h = info.height
  const ch = info.channels

  // 四角座標（各內縮 2px 避免邊緣誤差）
  const corners = [
    { x: 2, y: 2 },                   // 左上
    { x: w - 3, y: 2 },               // 右上
    { x: 2, y: h - 3 },               // 左下
    { x: w - 3, y: h - 3 },           // 右下
  ]

  // 取樣並計算平均色
  let r = 0, g = 0, b = 0
  for (const { x, y } of corners) {
    const offset = (y * w + x) * ch
    r += data[offset]
    g += data[offset + 1]
    b += data[offset + 2]
  }

  r = Math.round(r / 4)
  g = Math.round(g / 4)
  b = Math.round(b / 4)

  const hex = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
  console.log(`角落取樣平均色: ${hex} (R:${r} G:${g} B:${b})`)

  return hex
}

async function main() {
  const inputPath = process.argv[2]
  const outputPath = process.argv[3] || inputPath

  if (!inputPath) {
    console.error('用法: npx tsx scripts/remove-background.ts input.png [output.png]')
    process.exit(1)
  }

  const absInput = path.resolve(inputPath)
  const absOutput = path.resolve(outputPath)

  // Step 1: 取樣角落顏色
  const bgColor = await sampleCornerColor(absInput)

  // Step 2: 使用 ImageMagick flood fill 從四角去背
  // -fuzz 15% 容許色差，-fill none 替換為透明
  // 對四角分別執行 floodfill，確保背景完整去除
  const fuzz = '15%'
  const cmd = [
    'magick',
    `"${absInput}"`,
    `-fuzz ${fuzz}`,
    `-fill none`,
    // 從四角 flood fill
    `-draw "color 0,0 floodfill"`,
    `-draw "color 0,%[fx:h-1] floodfill"`,
    `-draw "color %[fx:w-1],0 floodfill"`,
    `-draw "color %[fx:w-1],%[fx:h-1] floodfill"`,
    `"${absOutput}"`,
  ].join(' ')

  console.log(`執行去背...`)
  execSync(cmd, { stdio: 'inherit' })
  console.log(`✓ 去背完成: ${absOutput}`)
}

main().catch(console.error)
