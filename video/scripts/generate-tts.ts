/**
 * 使用 Gemini TTS 為每個場景生成旁白音檔
 * 用法：GEMINI_API_KEY=xxx npx tsx scripts/generate-tts.ts
 */
import { GoogleGenAI } from '@google/genai'
import { writeFileSync, mkdirSync, existsSync } from 'fs'
import path from 'path'
import { narrations } from './narrations'

const VOICE_NAME = 'Zephyr'
const OUTPUT_DIR = path.resolve(__dirname, '../public/audio')

// WAV 轉換工具
function parseMimeType(mimeType: string) {
  const [fileType, ...params] = mimeType.split(';').map(s => s.trim())
  const format = fileType.split('/')[1]
  const options: { numChannels: number; sampleRate?: number; bitsPerSample?: number } = {
    numChannels: 1,
  }
  if (format?.startsWith('L')) {
    const bits = parseInt(format.slice(1), 10)
    if (!isNaN(bits)) options.bitsPerSample = bits
  }
  for (const param of params) {
    const [key, value] = param.split('=').map(s => s.trim())
    if (key === 'rate') options.sampleRate = parseInt(value, 10)
  }
  return options as { numChannels: number; sampleRate: number; bitsPerSample: number }
}

function createWavHeader(dataLength: number, opts: { numChannels: number; sampleRate: number; bitsPerSample: number }) {
  const { numChannels, sampleRate, bitsPerSample } = opts
  const byteRate = sampleRate * numChannels * bitsPerSample / 8
  const blockAlign = numChannels * bitsPerSample / 8
  const buffer = Buffer.alloc(44)
  buffer.write('RIFF', 0)
  buffer.writeUInt32LE(36 + dataLength, 4)
  buffer.write('WAVE', 8)
  buffer.write('fmt ', 12)
  buffer.writeUInt32LE(16, 16)
  buffer.writeUInt16LE(1, 20)
  buffer.writeUInt16LE(numChannels, 22)
  buffer.writeUInt32LE(sampleRate, 24)
  buffer.writeUInt32LE(byteRate, 28)
  buffer.writeUInt16LE(blockAlign, 32)
  buffer.writeUInt16LE(bitsPerSample, 34)
  buffer.write('data', 36)
  buffer.writeUInt32LE(dataLength, 40)
  return buffer
}

function convertToWav(rawData: string, mimeType: string) {
  const options = parseMimeType(mimeType)
  const header = createWavHeader(rawData.length, options)
  const buffer = Buffer.from(rawData, 'base64')
  return Buffer.concat([header, buffer])
}

async function generateAudio(ai: GoogleGenAI, text: string): Promise<Buffer> {
  const response = await ai.models.generateContentStream({
    model: 'gemini-2.5-pro-preview-tts',
    config: {
      responseModalities: ['audio'],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: VOICE_NAME },
        },
      },
    },
    contents: [
      {
        role: 'user',
        parts: [{ text: `用溫暖親切、活潑有趣的語氣朗讀以下內容：\n\n${text}` }],
      },
    ],
  })

  // 收集所有音訊 chunks
  const chunks: Buffer[] = []
  for await (const chunk of response) {
    const inlineData = chunk.candidates?.[0]?.content?.parts?.[0]?.inlineData
    if (inlineData?.data) {
      const mimeType = inlineData.mimeType || ''
      // 判斷是否需要轉 WAV
      if (mimeType.startsWith('audio/L') || mimeType.includes('pcm')) {
        chunks.push(convertToWav(inlineData.data, mimeType))
      } else {
        chunks.push(Buffer.from(inlineData.data, 'base64'))
      }
    }
  }

  return Buffer.concat(chunks)
}

async function main() {
  const apiKey = process.env['GEMINI_API_KEY']
  if (!apiKey) {
    console.error('請設定 GEMINI_API_KEY 環境變數')
    process.exit(1)
  }

  const ai = new GoogleGenAI({ apiKey })

  for (const [compositionId, scenes] of Object.entries(narrations)) {
    const dir = path.join(OUTPUT_DIR, compositionId)
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true })

    console.log(`\n=== ${compositionId} (${scenes.length} 場景) ===`)

    for (let i = 0; i < scenes.length; i++) {
      const outPath = path.join(dir, `scene-${i}.wav`)

      // 跳過已存在的檔案
      if (existsSync(outPath)) {
        console.log(`  [${i}] 已存在，跳過`)
        continue
      }

      console.log(`  [${i}] 生成中... "${scenes[i].slice(0, 30)}..."`)
      const audio = await generateAudio(ai, scenes[i])
      writeFileSync(outPath, audio)
      console.log(`  [${i}] ✓ ${outPath}`)
    }
  }

  console.log('\n全部完成！')
}

main().catch(console.error)
