---
name: generate-art-asset
description: >
  使用 Gemini Image Generation API 產生影片或遊戲用的美術素材。
  支援一般素材生成、浮水印移除、洋紅背景去背。
  當用戶需要產生圖片、icon、角色、場景插圖等視覺素材時使用。
compatibility: Requires Node.js, ImageMagick (magick CLI), and GEMINI_API_KEY
metadata:
  author: coin-quest
  version: "1.0"
---

# 美術素材生成指南

本 Skill 引導你使用 Gemini API 產生符合專案風格的美術素材，並自動移除浮水印、可選去背。

## 視覺風格規範

**風格關鍵字：Flat · Kawaii · Pastel · Fun**

- 扁平向量插畫，無陰影、圓角元素
- 柔和粉彩配色（粉紅、薄荷、黃、薰衣草）
- 適合 7～15 歲年齡層的可愛風格
- 畫面乾淨、構圖簡潔、不含任何文字

### 配色板

| 名稱 | 色碼 | 用途 |
|------|------|------|
| Coral | `#FF6B6B` | 主色、標題、重要元素 |
| Teal | `#4ECDC4` | 副色、正面結果 |
| Sunshine | `#FFE66D` | 強調、提示 |
| Lavender | `#A29BFE` | 裝飾、次要元素 |
| Mint | `#55EFC4` | 正確 / 獎勵 |
| Warm White | `#FFF8F0` | 預設背景 |

## Prompt 撰寫規範

### 統一風格 Prefix

所有 prompt 必須以此前綴開頭，確保風格一致：

```
Flat vector illustration for children's educational video. Kawaii cute style, soft pastel colors (pink, mint, yellow, lavender), rounded shapes, no text or words in the image. Simple clean composition on light background.
```

### 撰寫技巧

- 用英文撰寫 prompt（Gemini 英文理解較佳）
- 描述**場景內容**而非風格（風格已由 prefix 統一）
- 明確列出畫面中的物件與排列方式
- 指定比例：影片素材用 `16:9`、icon 或角色用 `1:1`
- 避免要求文字出現在圖片中

### Prompt 範例

**影片配圖：**
```
Subject: A cheerful child holding a small notebook and pen, with floating icons around them showing a drink cup and stationery. Money coins trail from the items to the notebook.
```

**遊戲角色素材（去背）：**
```
A cute cartoon fox mascot standing and waving, wearing a small backpack. Full body view, simple design.
```

## 工具與腳本

### 前置準備

首次使用前需安裝依賴：

```bash
cd .claude/skills/generate-art-asset && npm install
```

### 腳本一覽

| 腳本 | 用途 | 指令 |
|------|------|------|
| `generate-image.ts` | 呼叫 Gemini 生成圖片 | `npx tsx scripts/generate-image.ts` |
| `remove-watermark.ts` | 移除 SynthID 浮水印 | `npx tsx scripts/remove-watermark.ts` |
| `remove-background.ts` | 洋紅背景取樣去背 | `npx tsx scripts/remove-background.ts` |

## 工作流程

### 流程 A：一般素材（有背景）

適用於影片插圖、場景圖等不需要透明背景的素材。

```
1. 撰寫 prompt（加上風格 prefix）
2. 生成圖片
3. 移除浮水印
4. 完成 ✓
```

**操作指令：**

```bash
cd .claude/skills/generate-art-asset

# Step 1: 生成圖片
GEMINI_API_KEY=xxx npx tsx scripts/generate-image.ts \
  --prompt "風格prefix + 場景描述" \
  --output /path/to/output.png \
  --aspect "16:9"

# Step 2: 移除浮水印
npx tsx scripts/remove-watermark.ts /path/to/output.png
```

### 流程 B：去背素材（透明背景）

適用於角色、icon、遊戲物件等需要透明背景的素材。

```
1. 撰寫 prompt（加上風格 prefix）
2. 生成圖片（洋紅背景）
3. 移除浮水印
4. 角落取樣 + 去背
5. 完成 ✓
```

**操作指令：**

```bash
cd .claude/skills/generate-art-asset

# Step 1: 生成洋紅背景圖片（--magenta 自動加入背景指示）
GEMINI_API_KEY=xxx npx tsx scripts/generate-image.ts \
  --prompt "風格prefix + 場景描述" \
  --output /path/to/output.png \
  --aspect "1:1" \
  --magenta

# Step 2: 移除浮水印
npx tsx scripts/remove-watermark.ts /path/to/output.png

# Step 3: 角落取樣 + 去背
npx tsx scripts/remove-background.ts /path/to/output.png
```

### 使用參考圖片

`references/` 資料夾可放入參考圖片，供 Gemini 參考風格或內容：

```bash
GEMINI_API_KEY=xxx npx tsx scripts/generate-image.ts \
  --prompt "與參考圖片風格一致的..." \
  --output output.png \
  --reference references/style-ref.png references/another-ref.png
```

## generate-image.ts 參數

| 參數 | 必填 | 說明 |
|------|------|------|
| `--prompt` | ✅ | 圖片描述（建議包含風格 prefix） |
| `--output` | ✅ | 輸出路徑 |
| `--aspect` | ❌ | 比例，預設 `1:1`。影片用 `16:9` |
| `--magenta` | ❌ | 生成洋紅背景，用於後續去背 |
| `--reference` | ❌ | 參考圖片路徑（可多張） |

## 注意事項

- **API Key**：如果環境變數 `GEMINI_API_KEY` 未設定，請向用戶索取
- **浮水印**：Gemini 生成的所有圖片都有 SynthID 浮水印，務必執行 `remove-watermark.ts`
- **去背容差**：`remove-background.ts` 使用 15% fuzz 容差，如效果不佳可調整腳本中的 `fuzz` 值
- **圖片品質**：如果生成結果不滿意，可以重新生成（每次結果不同）
- **Model**：使用 `gemini-2.5-flash-image`，約 $0.04/張
