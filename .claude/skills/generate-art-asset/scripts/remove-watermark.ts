/**
 * 移除 Gemini SynthID 浮水印
 * 演算法移植自 gemini-watermark-remover (https://github.com/journey-ad/gemini-watermark-remover)
 *
 * 用法：npx tsx scripts/remove-watermark.ts input.png [output.png]
 * 如果不指定 output，會覆蓋原檔
 */
import sharp from 'sharp'
import path from 'path'

// 浮水印設定：依圖片大小決定 tile 尺寸
interface WatermarkConfig {
  tileSize: number // 48 或 96
  margin: number // 離右下角的邊距
}

function getConfig(width: number, height: number): WatermarkConfig {
  const isLarge = width > 1024 || height > 1024
  return {
    tileSize: isLarge ? 96 : 48,
    margin: isLarge ? 64 : 32,
  }
}

/**
 * 從 alpha map 圖片載入透明度陣列
 * alpha = max(R, G, B) / 255，每個 pixel 一個值
 */
async function loadAlphaMap(tileSize: number): Promise<Float32Array> {
  const assetPath = path.resolve(
    __dirname,
    `../assets/bg_${tileSize}.png`
  )
  const { data, info } = await sharp(assetPath)
    .raw()
    .ensureAlpha()
    .toBuffer({ resolveWithObject: true })

  const pixelCount = info.width * info.height
  const alphaMap = new Float32Array(pixelCount)

  for (let i = 0; i < pixelCount; i++) {
    const offset = i * 4 // RGBA
    const r = data[offset]
    const g = data[offset + 1]
    const b = data[offset + 2]
    alphaMap[i] = Math.max(r, g, b) / 255
  }

  return alphaMap
}

/**
 * 核心：反向 alpha blending 移除浮水印
 * 原始公式：watermarked = alpha * 255 + (1 - alpha) * original
 * 反推公式：original = (watermarked - alpha * 255) / (1 - alpha)
 */
function removeWatermark(
  imageData: Buffer,
  imageWidth: number,
  imageHeight: number,
  channels: number,
  alphaMap: Float32Array,
  config: WatermarkConfig
) {
  const { tileSize, margin } = config

  // 浮水印位於右下角（margin 內縮）
  const wmStartX = imageWidth - margin - tileSize
  const wmStartY = imageHeight - margin - tileSize

  if (wmStartX < 0 || wmStartY < 0) return // 圖片太小，無浮水印

  for (let ty = 0; ty < tileSize; ty++) {
    for (let tx = 0; tx < tileSize; tx++) {
      const alpha = alphaMap[ty * tileSize + tx]
      if (alpha < 0.002) continue // 跳過幾乎透明的像素

      const a = Math.min(alpha, 0.99) // 避免除以零
      const px = wmStartX + tx
      const py = wmStartY + ty
      const offset = (py * imageWidth + px) * channels

      // 對 R, G, B 三個通道分別反推
      for (let c = 0; c < 3; c++) {
        const watermarked = imageData[offset + c]
        const original = (watermarked - a * 255) / (1 - a)
        imageData[offset + c] = Math.round(
          Math.min(255, Math.max(0, original))
        )
      }
    }
  }
}

async function main() {
  const inputPath = process.argv[2]
  const outputPath = process.argv[3] || inputPath

  if (!inputPath) {
    console.error('用法: npx tsx scripts/remove-watermark.ts input.png [output.png]')
    process.exit(1)
  }

  // 讀取圖片為 raw pixels
  const image = sharp(path.resolve(inputPath))
  const metadata = await image.metadata()
  const width = metadata.width!
  const height = metadata.height!

  const { data, info } = await image
    .raw()
    .ensureAlpha()
    .toBuffer({ resolveWithObject: true })

  console.log(`圖片大小: ${width}x${height}`)

  // 取得設定 & alpha map
  const config = getConfig(width, height)
  console.log(`浮水印 tile: ${config.tileSize}px, margin: ${config.margin}px`)

  const alphaMap = await loadAlphaMap(config.tileSize)

  // 移除浮水印
  removeWatermark(data, info.width, info.height, info.channels, alphaMap, config)

  // 儲存結果
  await sharp(data, {
    raw: { width: info.width, height: info.height, channels: info.channels },
  })
    .png()
    .toFile(path.resolve(outputPath))

  console.log(`✓ 浮水印已移除: ${outputPath}`)
}

main().catch(console.error)
