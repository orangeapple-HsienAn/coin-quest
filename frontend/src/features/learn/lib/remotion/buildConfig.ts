// 從 Firestore 各種資料組出 Remotion Player 需要的 VideoConfig + 每頁 durationMs

import type { Defaults, Page, VideoConfig } from "./Composition";
import type {
  Background,
  CharAnimationSettings,
  CharacterEmotion,
  CharacterName,
  KnowledgePage,
  KnowledgeVersion,
  StoryVersion,
  TemplateDoc,
  TopicPage,
  TopicVersion,
  TranslatedKnowledge,
  TranslatedStory,
  TranslatedTopic,
  UnitImage,
  UnitTranslations,
  VoiceDoc,
  VoiceLang,
} from "./cms-types";
import {
  CHARACTER_COLORS,
  CHARACTER_NAMES_BY_LANG,
  DEFAULT_EMOTION,
  DEFAULT_STORY_CHAR_ANIMATION,
  DEFAULT_TOPIC_CHAR_ANIMATION,
} from "./cms-types";
import { proxifyStorageUrl } from "./proxyUrl";

export type PreviewSection = "story" | "knowledge" | "topic";

/** 組 config 需要的所有資料 */
export interface BuildInputs {
  /** 目標 section — v1 只做 story / knowledge */
  section: PreviewSection;
  /** 目標語言 */
  language: VoiceLang;
  /** 小故事版（ZH 權威；語言切換時走 translations 的對應 section） */
  storyVersion?: StoryVersion | null;
  knowledgeVersion?: KnowledgeVersion | null;
  topicVersion?: TopicVersion | null;
  /** 目標語言的翻譯（若 language === zh 可忽略） */
  translations?: UnitTranslations | null;
  /** 單元的圖片子集合（僅小知識 contentImage 會用到） */
  images?: UnitImage[];
  /** 該語言的語音（已生成，有 durationMs + audioUrl） */
  voices: VoiceDoc[];
  /** 該 section 的預設（_1）模板 — 提供頂層 defaults 與 charAnimation */
  template: TemplateDoc | null;
  /** 全部模板（供 per-page template 覆蓋查表用） */
  allTemplates?: TemplateDoc[];
  /** 角色情緒 GIF — 至少要有該角色的 DEFAULT_EMOTION */
  characterEmotions: CharacterEmotion[];
  /** 背景圖（依 name 索引） */
  backgrounds: Background[];
}

interface BuildResult {
  config: VideoConfig;
  pageDurations: (number | null | undefined)[];
}

function pickBackgroundUrl(
  backgrounds: Background[],
  name?: string,
): string | undefined {
  if (!backgrounds.length) return undefined;
  if (name) {
    const hit = backgrounds.find((b) => b.name === name);
    if (hit) return proxifyStorageUrl(hit.url);
  }
  // fallback：排序後的第一張
  return proxifyStorageUrl(backgrounds[0]?.url);
}

function pickCharacterUrl(
  emotions: CharacterEmotion[],
  character: CharacterName,
  emotion?: string,
): string | undefined {
  const want = emotion || DEFAULT_EMOTION;
  const hit = emotions.find(
    (e) => e.character === character && e.emotion === want,
  );
  if (hit) return proxifyStorageUrl(hit.url);
  // fallback：此角色的任一張
  const anyThisChar = emotions.find((e) => e.character === character);
  return proxifyStorageUrl(anyThisChar?.url);
}

function getTranslatedTexts(
  section: PreviewSection,
  translations: UnitTranslations | null | undefined,
): { text: string; html: string }[] | null {
  if (!translations) return null;
  if (section === "topic") {
    const t = translations.topic as TranslatedTopic | undefined;
    if (!t) return null;
    return (t.pages ?? []).map((p) => ({ text: p.text, html: p.html }));
  }
  if (section === "story") {
    const s = translations.story as TranslatedStory | undefined;
    if (!s) return null;
    return (s.pages ?? []).map((p) => ({ text: p.text, html: p.html }));
  }
  const k = translations.knowledge as TranslatedKnowledge | undefined;
  if (!k) return null;
  return (k.pages ?? []).map((p) => ({ text: p.text, html: p.html }));
}

/**
 * 把任何 `<span style="color: ...">...</span>` 都加上 `font-weight: bold`。
 * 處理兩種情況：
 *   1. 本來就有 color 的 span 但沒 font-weight → 加進去
 *   2. 已有 font-weight 的 → 不動
 * 中文原文 / 翻譯 / 角色名稱的 span 都會經過這一層。
 */
function boldifyColoredSpans(html: string): string {
  if (!html) return html;
  return html.replace(
    /<span\s+([^>]*?style\s*=\s*(["']))([^"']*?)(\2[^>]*)>/gi,
    (full, prefix: string, _quote: string, styleContent: string, suffix: string) => {
      // 該 span 的 style 要含 color 才處理
      if (!/color\s*:/i.test(styleContent)) return full;
      // 已經有 font-weight → 不動
      if (/font-weight\s*:/i.test(styleContent)) return full;
      const sep = styleContent.trim().endsWith(";") || styleContent.trim() === "" ? "" : ";";
      const nextStyle = `${styleContent}${sep}font-weight:bold;`;
      return `<span ${prefix}${nextStyle}${suffix}>`;
    },
  );
}

function wrapHtmlParagraph(raw: string): string {
  // textLayer.html 期望包在 <p> 裡才能被 applyParagraphStyles 套寬度
  const trimmed = raw.trim();
  if (!trimmed) return "";
  // 把區塊元素（<div>/<p>/<li>/<h1-6>）的開始標籤一律當作換行 → 統一轉 <br>，
  // 結束標籤直接移除。這樣可以同時處理：
  //   - 中文 contentEditable 按 Enter 產生的 <div>（Chrome 預設）
  //   - 已預先包成 <p>...</p><p>...</p> 的結構化 html
  //   - 翻譯後 renderSegmentsToHtml 產生的 <br> 換行
  //   - 舊資料字面 `\n`
  const flattened = trimmed
    .replace(/<(?:div|p|li|h[1-6])\b[^>]*>/gi, "<br>")
    .replace(/<\/(?:div|p|li|h[1-6])>/gi, "");
  // 依 <br> 或字面 `\n` 切成多項，每項包成獨立 <p>，
  // 項目之間 8px 縱向間距（單純 <br> 看起來太擠）
  const items = flattened
    .split(/<br\s*\/?>|\n/i)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
  if (items.length === 0) return "";
  if (items.length === 1) {
    return boldifyColoredSpans(`<p>${items[0]}</p>`);
  }
  const paragraphs = items
    .map((item, i) => {
      const style = i === 0 ? "margin:0" : "margin:8px 0 0 0";
      return `<p style="${style}">${item}</p>`;
    })
    .join("");
  return boldifyColoredSpans(paragraphs);
}

/**
 * 小故事 / 小議題頁面 — 在內容前加上「角色名稱（帶色、粗體）+ 換行」。
 * 參考 GAS `課程試算表 GAS.txt` 第 375 行的格式：
 *   <p><span style="color: #f2a624; font-weight:bold;">露比</span><br>{內容}</p>
 * 若既有 html 已有角色前綴 → 先移除再套用正確角色色，避免 AI 輸出的 html 與實際角色不符。
 *
 * v0.9.11：角色名前綴依語言切換（叩叮/Kody、露比/Ruby、波比/Bobby、帕比/Puffy），
 * 跟翻譯字典 character 類條目一致。
 */
function wrapHtmlWithRole(
  raw: string,
  character: CharacterName,
  language: VoiceLang,
): string {
  const color = CHARACTER_COLORS[character] ?? "#000000";
  const displayName =
    CHARACTER_NAMES_BY_LANG[character]?.[language] ?? character;
  const trimmed = (raw ?? "").trim();
  // 取出 <p>..</p> 內的內容；不是 <p> 包起來也 OK
  const pMatch = trimmed.match(/^<p\b[^>]*>([\s\S]*)<\/p>\s*$/i);
  let inner = pMatch ? pMatch[1] : trimmed;
  // 若開頭已有「<span color>角色名</span><br>」前綴 → 剝掉（不管舊色 / 名稱是什麼）
  inner = inner.replace(
    /^\s*<span\s+style="[^"]*color:\s*#[a-fA-F0-9]{6}[^"]*"\s*>[^<]*<\/span>\s*<br\s*\/?>/i,
    "",
  );
  // 舊翻譯資料：html 內可能有字面 `\n`（renderSegmentsToHtml 早期沒轉 <br>）
  // 統一把 \n 補成 <br>，避免文字層收到的 \n 被 HTML 折成空白
  inner = inner.replace(/\n/g, "<br>");
  // 角色前綴 + 內容都經 boldifyColoredSpans，讓內容裡的重點字也變粗體
  return boldifyColoredSpans(
    `<p><span style="color: ${color};">${displayName}</span><br>${inner}</p>`,
  );
}

function voiceByPage(
  voices: VoiceDoc[],
  section: PreviewSection,
  language: VoiceLang,
): Map<number, VoiceDoc> {
  const m = new Map<number, VoiceDoc>();
  for (const v of voices) {
    if (v.section !== section) continue;
    if (v.language !== language) continue;
    m.set(v.pageIndex, v);
  }
  return m;
}

/** 取譯文替代圖（P3 #4-A）— 若有手動上傳或 AI 生成的替代圖，優先使用 */
function pickTranslatedImageUrl(
  translations: UnitTranslations | null | undefined,
  section: PreviewSection,
  pageIndex: number,
): string | undefined {
  if (!translations) return undefined;
  if (section !== "knowledge") return undefined;
  const map = translations.images?.knowledge;
  if (!map) return undefined;
  const entry = map[String(pageIndex)];
  return entry?.url;
}

/**
 * 對一串頁依 page.character 計算 entrance / exit 動畫。
 * 觸發規則：該頁角色 != 前一頁 → entrance；該頁角色 != 下一頁 → exit。
 * 第一頁一定 entrance，最後一頁一定 exit。
 *
 * 給小故事（多角色切換）與小議題（固定角色、只有首尾動畫）共用。
 */
function buildCharLayers(
  pages: { character: CharacterName }[],
  anim: CharAnimationSettings,
): {
  charImage: NonNullable<Page["layers"]>["charImage"];
}[] {
  const charChange = pages.map((p, i) => {
    const prev = i > 0 ? pages[i - 1].character : null;
    const next = i < pages.length - 1 ? pages[i + 1].character : null;
    return {
      prevChanged: prev !== p.character, // 第一頁一定算換
      nextChanged: next !== p.character, // 最後一頁一定算換
    };
  });
  return charChange.map((c) => ({
    charImage: {
      entrance:
        c.prevChanged && anim.entranceType !== "none"
          ? {
              type: anim.entranceType,
              durationSec: anim.entranceDurationSec,
              delaySec: anim.entranceDelaySec,
            }
          : undefined,
      exit:
        c.nextChanged && anim.exitType !== "none"
          ? {
              type: anim.exitType,
              durationSec: anim.exitDurationSec,
              delaySec: anim.exitDelaySec,
            }
          : undefined,
    },
  }));
}

export function buildVideoConfig(inputs: BuildInputs): BuildResult {
  const {
    section,
    language,
    storyVersion,
    knowledgeVersion,
    topicVersion,
    translations,
    images,
    voices,
    template,
    allTemplates,
    characterEmotions,
    backgrounds,
  } = inputs;

  const topDefaults = (template?.defaults ?? {}) as Defaults;
  const voiceMap = voiceByPage(voices, section, language);
  const translatedTexts =
    language === "zh" ? null : getTranslatedTexts(section, translations);

  // 找某個 templateId 對應的 defaults；找不到或沒傳 allTemplates → undefined（該頁沿用頂層 defaults）
  const pageDefaultsFor = (
    templateId: string | undefined,
  ): Defaults | undefined => {
    if (!templateId) return undefined;
    if (templateId === template?.id) return undefined; // 同 _1 → 不用重複放
    const hit = allTemplates?.find((t) => t.id === templateId);
    return hit ? ((hit.defaults ?? {}) as Defaults) : undefined;
  };

  /**
   * 決定某頁實際要用的 templateId（v0.9.7）：
   * - 中文：直接用來源頁的 `template`
   * - 非中文：優先用 `translations.templates.{section}.{pageIndex}` 覆寫；沒有才 fallback 來源頁的 `template`
   */
  const pickPageTemplate = (
    sec: "story" | "knowledge" | "topic",
    pageIndex: number,
    sourceTemplate: string | undefined,
  ): string | undefined => {
    if (language === "zh") return sourceTemplate;
    const overrideId =
      translations?.templates?.[sec]?.[String(pageIndex)];
    return overrideId || sourceTemplate;
  };

  const pages: Page[] = [];
  const pageDurations: (number | null | undefined)[] = [];

  if (section === "story") {
    if (!storyVersion) {
      return {
        config: emptyConfig(topDefaults),
        pageDurations: [],
      };
    }
    const storyPages = storyVersion.pages ?? [];
    const storyAnim =
      template?.charAnimation ?? DEFAULT_STORY_CHAR_ANIMATION;
    const layerHints = buildCharLayers(storyPages, storyAnim);
    for (let i = 0; i < storyPages.length; i++) {
      const p = storyPages[i];
      const zhHtml = p.html ?? `<p>${p.dialogue ?? ""}</p>`;
      const rawHtml =
        language === "zh" ? zhHtml : translatedTexts?.[i]?.html ?? "";
      const html = wrapHtmlWithRole(rawHtml, p.character, language);
      const voice = voiceMap.get(i);
      const charUrl = pickCharacterUrl(characterEmotions, p.character, p.emotion);
      const bgUrl = pickBackgroundUrl(backgrounds, p.background);
      pages.push({
        audioUrl: voice?.audioUrl,
        defaults: pageDefaultsFor(pickPageTemplate("story", i, p.template)),
        layers: {
          textLayer: { html },
          charImage: charUrl
            ? {
                url: charUrl,
                entrance: layerHints[i].charImage?.entrance,
                exit: layerHints[i].charImage?.exit,
              }
            : undefined,
          bgImage: bgUrl ? { url: bgUrl } : undefined,
        },
      });
      pageDurations.push(voice?.durationMs ?? null);
    }
  } else if (section === "knowledge") {
    if (!knowledgeVersion) {
      return {
        config: emptyConfig(topDefaults),
        pageDurations: [],
      };
    }
    const knowledgePages = knowledgeVersion.pages ?? [];
    const imageByPage = new Map<number, UnitImage>();
    for (const img of images ?? []) imageByPage.set(img.pageIndex, img);

    for (let i = 0; i < knowledgePages.length; i++) {
      const p: KnowledgePage = knowledgePages[i];
      const zhHtml = p.html ?? `<p>${p.content ?? ""}</p>`;
      const html =
        language === "zh"
          ? wrapHtmlParagraph(zhHtml)
          : wrapHtmlParagraph(translatedTexts?.[i]?.html ?? "");
      const voice = voiceMap.get(i);
      const charUrl = pickCharacterUrl(characterEmotions, p.character, p.emotion);
      const bgUrl = pickBackgroundUrl(backgrounds, p.background);
      // 小知識配圖：譯文替代圖優先（若有且語言非中文），否則用中文原圖
      const translatedImg =
        language !== "zh"
          ? pickTranslatedImageUrl(translations, "knowledge", i)
          : undefined;
      const img = imageByPage.get(i);
      const rawContentUrl =
        translatedImg ?? img?.croppedImageUrl ?? img?.gridImageUrl;
      const contentUrl = proxifyStorageUrl(rawContentUrl);
      pages.push({
        audioUrl: voice?.audioUrl,
        defaults: pageDefaultsFor(pickPageTemplate("knowledge", i, p.template)),
        layers: {
          textLayer: { html },
          charImage: charUrl ? { url: charUrl } : undefined,
          contentImage: contentUrl ? { url: contentUrl } : undefined,
          bgImage: bgUrl ? { url: bgUrl } : undefined,
        },
      });
      pageDurations.push(voice?.durationMs ?? null);
    }
  } else {
    // topic — 結構同小知識（叩叮 + content）但採小故事版型（topic_1 模板）；
    // 角色固定叩叮，所以 buildCharLayers 只會在第一頁 entrance、最後一頁 exit 觸發。
    if (!topicVersion) {
      return {
        config: emptyConfig(topDefaults),
        pageDurations: [],
      };
    }
    const topicPages = topicVersion.pages ?? [];
    const topicAnim =
      template?.charAnimation ?? DEFAULT_TOPIC_CHAR_ANIMATION;
    const layerHints = buildCharLayers(topicPages, topicAnim);
    for (let i = 0; i < topicPages.length; i++) {
      const p: TopicPage = topicPages[i];
      const zhHtml = p.html ?? `<p>${p.content ?? ""}</p>`;
      const rawHtml =
        language === "zh" ? zhHtml : translatedTexts?.[i]?.html ?? "";
      const html = wrapHtmlWithRole(rawHtml, p.character, language);
      const voice = voiceMap.get(i);
      const charUrl = pickCharacterUrl(characterEmotions, p.character, p.emotion);
      const bgUrl = pickBackgroundUrl(backgrounds, p.background);
      pages.push({
        audioUrl: voice?.audioUrl,
        defaults: pageDefaultsFor(pickPageTemplate("topic", i, p.template)),
        layers: {
          textLayer: { html },
          charImage: charUrl
            ? {
                url: charUrl,
                entrance: layerHints[i].charImage?.entrance,
                exit: layerHints[i].charImage?.exit,
              }
            : undefined,
          bgImage: bgUrl ? { url: bgUrl } : undefined,
        },
      });
      pageDurations.push(voice?.durationMs ?? null);
    }
  }

  return {
    config: {
      version: "2.0",
      timeline: {
        fps: 24,
        durationMode: "audio",
        pageGapMs: 0,
        audioPostDelayMs: 200,
      },
      defaults: topDefaults,
      pages,
    },
    pageDurations,
  };
}

function emptyConfig(defaults: Defaults): VideoConfig {
  return {
    version: "2.0",
    timeline: {
      fps: 24,
      durationMode: "audio",
      pageGapMs: 0,
      audioPostDelayMs: 200,
    },
    defaults,
    pages: [],
  };
}
