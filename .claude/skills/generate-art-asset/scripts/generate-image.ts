/**
 * 使用 Gemini API 生成美術素材
 *
 * 用法：
 *   GEMINI_API_KEY=xxx npx tsx scripts/generate-image.ts \
 *     --prompt "描述文字" \
 *     --output output.png \
 *     [--aspect "1:1"] \
 *     [--magenta] \
 *     [--reference ref1.png ref2.png]
 *
 * --magenta: 生成洋紅背景，方便後續去背
 * --reference: 傳入參考圖片（最多 14 張）
 */
import { GoogleGenAI } from '@google/genai'
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs'
import path from 'path'

// 解析 CLI 參數
function parseArgs() {
  const args = process.argv.slice(2)
  const result: {
    prompt: string
    output: string
    aspect: string
    magenta: boolean
    references: string[]
  } = { prompt: '', output: '', aspect: '1:1', magenta: false, references: [] }

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--prompt':
        result.prompt = args[++i]
        break
      case '--output':
        result.output = args[++i]
        break
      case '--aspect':
        result.aspect = args[++i]
        break
      case '--magenta':
        result.magenta = true
        break
      case '--reference':
        // 收集後續所有非 -- 開頭的參數作為參考圖片
        while (i + 1 < args.length && !args[i + 1].startsWith('--')) {
          result.references.push(args[++i])
        }
        break
    }
  }

  if (!result.prompt || !result.output) {
    console.error('必須提供 --prompt 和 --output 參數')
    process.exit(1)
  }

  return result
}

async function main() {
  const apiKey = process.env['GEMINI_API_KEY']
  if (!apiKey) {
    console.error('請設定 GEMINI_API_KEY 環境變數')
    process.exit(1)
  }

  const args = parseArgs()
  const ai = new GoogleGenAI({ apiKey })

  // 組合 prompt：如果需要去背，加上洋紅背景指示
  let fullPrompt = args.prompt
  if (args.magenta) {
    fullPrompt += '\n\nIMPORTANT: The subject must be placed on a solid, uniform magenta/hot-pink background (exactly #FF00FF). No gradients, no shadows on the background. The background must be completely flat and uniform magenta.'
  }

  // 建立 contents：文字 + 參考圖片
  const parts: Array<
    { text: string } | { inlineData: { mimeType: string; data: string } }
  > = [{ text: fullPrompt }]

  for (const refPath of args.references) {
    const absPath = path.resolve(refPath)
    const data = readFileSync(absPath).toString('base64')
    const ext = path.extname(refPath).toLowerCase()
    const mimeType =
      ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg' : 'image/png'
    parts.push({ inlineData: { mimeType, data } })
    console.log(`參考圖片: ${absPath}`)
  }

  console.log(`生成中... (aspect: ${args.aspect}, magenta: ${args.magenta})`)

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: [{ role: 'user', parts }],
    config: {
      responseModalities: ['image'],
      imageConfig: {
        aspectRatio: args.aspect as '1:1',
      },
    },
  })

  // 取得圖片 base64
  const imagePart = response.candidates?.[0]?.content?.parts?.find(
    (p: { inlineData?: { data?: string } }) => p.inlineData?.data
  )
  if (!imagePart?.inlineData?.data) {
    console.error('Gemini 未回傳圖片')
    process.exit(1)
  }

  // 確保輸出目錄存在
  const outDir = path.dirname(path.resolve(args.output))
  if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true })

  const buffer = Buffer.from(imagePart.inlineData.data, 'base64')
  writeFileSync(args.output, buffer)
  console.log(`✓ 已儲存: ${args.output}`)
}

main().catch(console.error)
