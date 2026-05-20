/**
 * 使用 Gemini 生成配圖
 * 用法：GEMINI_API_KEY=xxx npx tsx scripts/generate-images.ts
 */
import { GoogleGenAI } from '@google/genai'
import { writeFileSync, mkdirSync, existsSync } from 'fs'
import path from 'path'

const OUTPUT_DIR = path.resolve(__dirname, '../public/images')

// 統一風格 prompt prefix（兒童教育影片插圖風格）
const STYLE_PREFIX =
  'Flat vector illustration for children\'s educational video. Kawaii cute style, soft pastel colors (pink, mint, yellow, lavender), rounded shapes, no text or words in the image. Simple clean composition on light background. 16:9 aspect ratio. Subject: '

/**
 * 每支影片的配圖 prompt
 * key = compositionId, value = { sceneIndex: prompt }
 * sceneIndex 對應 Root.tsx 中 scenes 陣列的 index（僅 type: 'image' 的場景）
 */
const imagePrompts: Record<string, Record<number, string>> = {
  'knowledge-s1-L01-2': {
    // scene-1: 需要 vs 想要 對比圖
    1: 'Split comparison: left side shows a child eating lunch, drinking water, and wearing school uniform (daily necessities). Right side shows game cards, colorful pens, and idol album (wants). Clear visual contrast between needs and wants.',
    // scene-3: 猜猜看物品
    3: 'Four items floating in a grid: a warm winter coat, a cup of bubble tea with pearls, a pencil, and a gaming character avatar with colorful costume. Each item in its own circular frame.',
    // scene-5: 記帳概念
    5: 'A cheerful child holding a small notebook and pen, with floating icons around them showing a drink cup and stationery. The notebook has simple tally marks. Money coins trail from the items to the notebook.',
    // scene-7: 記帳小偵探
    7: 'A child dressed as a detective with a magnifying glass, examining a colorful notebook. The notebook has simple N and W marks next to items. Stars and sparkles around the child.',
  },
  'knowledge-s1-L01-3': {
    // scene-1: 公益場景
    1: 'Children volunteering in a community: sweeping the street together, planting flowers, and helping an elderly person carry groceries. Warm and cheerful atmosphere.',
    // scene-3: 小朋友捐物資
    3: 'A child carefully organizing toys and storybooks into a donation box. Stuffed animals, picture books, and building blocks. A heart symbol floating above the box.',
    // scene-5: 查核機構
    5: 'A child and parents sitting together at a computer, looking at a screen showing a checklist with green checkmarks. The family looks happy and engaged.',
    // scene-7: 時間捐贈
    7: 'A child sitting with grandparents in a cozy room, reading a storybook together. The grandparents are smiling warmly. A clock icon and a heart symbol nearby.',
  },

  // === Lesson 2：古代貨幣 ===

  'knowledge-s1-L02-2': {
    // scene-1: 古代以物易物場景
    1: 'Ancient village marketplace scene. A farmer trading rice bags with a fisherman holding fresh fish. Other villagers exchanging goods in the background. Warm and friendly atmosphere.',
    // scene-3: 找不到人換——牛換鞋的困境
    3: 'A confused boy holding a cow on a leash, standing in front of a shoemaker who is shaking his head and pointing to wheat. Speech bubble with wheat icon. Humorous scene.',
    // scene-5: 爭論價值——魚和蘋果的天平
    5: 'Two ancient people arguing over a balance scale. One side has a fish, the other side has apples. Both people have animated arguing expressions. Humorous scene.',
    // scene-7: 各種奇特的早期貨幣
    7: 'Museum-style display of ancient trade items: salt blocks, compressed tea bricks, cowrie shells, and a giant round stone coin with a hole in the center (Yap stone money). Each item labeled with a small tag.',
    // scene-9: 以物易物到貨幣的轉變
    9: 'Split scene: left side shows chaotic barter with confused people, right side shows organized trading with shiny gold and silver coins. Arrow pointing from left to right showing progress. Bright and cheerful.',
  },
  'knowledge-s1-L02-3': {
    // scene-1: 寶貝螺——最早的錢
    1: 'Beautiful cowrie shells arranged in rows, some strung together on a cord like a necklace. Ancient marketplace in the background with diverse traders. A merchant happily trading shells for goods at a market stall.',
    // scene-3: 貝殼的缺點
    3: 'Split scene showing problems with shell money: top half shows a broken/cracked shell, bottom half shows a child happily picking up many shells at the beach with buckets full of shells. Humorous contrast.',
    // scene-5: 金銀的三大優點
    5: 'Sparkling gold nuggets and silver bars displayed like precious treasures. Three icons next to them: a diamond (rare), a shield (durable), a star (beautiful). Clean infographic layout.',
    // scene-7: 世界最早的金屬錢幣
    7: 'Ancient Lydian coins with lion head imprint displayed alongside a balance scale being put away. A simple timeline arrow showing "2700 years ago". Museum display style.',
    // scene-9: 中國方孔圓錢
    9: 'Chinese ancient round copper coins with square holes strung together on a red cord. A small child trying to lift a heavy string of coins with effort and sweat drops. Humorous and educational.',
  },
  'knowledge-s1-L02-4': {
    // scene-1: 帶銅錢出門好辛苦
    1: 'An ancient Chinese merchant struggling to carry multiple heavy strings of coins on a shoulder pole, sweating and stumbling. Other people watching with sympathy. Humorous scene.',
    // scene-3: 交子——世界第一張紙鈔
    3: 'An ancient Chinese paper money bill (交子) with decorative patterns, displayed prominently. A proud Song Dynasty merchant holding it up next to a heavy pile of copper coins for contrast.',
    // scene-5: 古代紙鈔的三大防偽設計
    5: 'Close-up of an ancient banknote showing three anti-counterfeit features highlighted with magnifying glass circles: special fiber paper texture, intricate complex patterns, and a large red official seal stamp.',
    // scene-7: 偽造紙鈔後果嚴重
    7: 'An ancient Chinese banknote with a prominent warning text section highlighted in red. A stern-looking official/judge figure pointing at the warning. Serious but kid-friendly tone.',
    // scene-9: 防偽技術進化史
    9: 'Timeline evolution from left to right: ancient Jiaozi paper money → medieval coins → modern banknote with watermark and color-shifting ink visible. Arrows connecting each stage. Bright educational infographic.',
  },
  // === Lesson 3：現代貨幣與支付工具 ===

  'knowledge-s1-L03-2': {
    // scene-1: 鈔票偵探出動
    1: 'A curious child holding a banknote up to bright light, with a magnifying glass nearby. The child has an excited detective expression. Light rays passing through the banknote reveal hidden patterns.',
    // scene-3: 浮水印
    3: 'Close-up of a banknote held against bright light showing a hidden watermark portrait appearing. Arrows and circles highlighting the hidden image. Educational diagram style with "before and after" comparison.',
    // scene-5: 變色油墨
    5: 'A banknote being tilted at two different angles showing color-changing ink on numbers. Left side shows gold/bronze color, right side shows green color. Split-view educational illustration with tilt arrows.',
    // scene-7: 凹版印刷
    7: 'A child\'s finger touching a banknote surface with magnified view showing raised bumps and texture. Side-by-side comparison: real note with bumpy texture vs smooth fake. Kid-friendly educational style.',
    // scene-9: 安全線
    9: 'Magnified view of a banknote showing an embedded metallic security thread running through the paper. A magnifying glass reveals micro-text on the thread. Colorful security fibers visible in paper.',
  },
  'knowledge-s1-L03-3': {
    // scene-1: 支付工具大集合
    1: 'Multiple payment methods floating around a shopping bag in a circle: cash bills, coins, a credit card, a smartphone with payment app, and a smartwatch. Colorful educational poster layout.',
    // scene-3: 金融卡運作方式
    3: 'A cartoon debit card with an arrow connecting to a bank building, then another arrow going to a shop/store. Money coins flowing along the arrows showing the payment flow. Simple diagram for kids.',
    // scene-5: 信用卡先買後付
    5: 'Cartoon timeline: left shows Day 1 with happy shopping using credit card, middle shows calendar flipping to month end, right shows a bill/invoice arriving. A worried piggy bank looking at the bill.',
    // scene-7: 行動支付
    7: 'A smartphone screen showing a digital wallet app with a green checkmark and "Payment Success" animation. NFC radio waves emanating from the phone toward a payment terminal. Modern clean style.',
    // scene-9: 多種支付方式
    9: 'Split scene: left side shows problems (dead phone with empty battery icon, a "Cash Only" sign on a small shop). Right side shows a prepared happy kid holding cash, card, and charged phone.',
  },
}

async function generateImage(ai: GoogleGenAI, prompt: string): Promise<Buffer> {
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: STYLE_PREFIX + prompt,
    config: {
      responseModalities: ['image'],
    },
  })

  // 從 response 取得圖片 base64 資料
  const part = response.candidates?.[0]?.content?.parts?.find(
    (p: { inlineData?: { data?: string } }) => p.inlineData?.data
  )
  if (!part?.inlineData?.data) {
    throw new Error('No image data in response')
  }

  return Buffer.from(part.inlineData.data, 'base64')
}

async function main() {
  const apiKey = process.env['GEMINI_API_KEY']
  if (!apiKey) {
    console.error('請設定 GEMINI_API_KEY 環境變數')
    process.exit(1)
  }

  const ai = new GoogleGenAI({ apiKey })

  for (const [compositionId, scenes] of Object.entries(imagePrompts)) {
    const dir = path.join(OUTPUT_DIR, compositionId)
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true })

    console.log(`\n=== ${compositionId} ===`)

    for (const [sceneIdx, prompt] of Object.entries(scenes)) {
      const outPath = path.join(dir, `scene-${sceneIdx}.png`)

      // 跳過已存在的檔案
      if (existsSync(outPath)) {
        console.log(`  [scene-${sceneIdx}] 已存在，跳過`)
        continue
      }

      console.log(`  [scene-${sceneIdx}] 生成中...`)
      const imageBuffer = await generateImage(ai, prompt)
      writeFileSync(outPath, imageBuffer)
      console.log(`  [scene-${sceneIdx}] ✓ ${outPath}`)
    }
  }

  console.log('\n全部完成！')
}

main().catch(console.error)
