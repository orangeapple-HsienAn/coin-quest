/**
 * 從 finance-cms src/lib/types.ts 抽出 Player/buildConfig 需要的型別與常數
 * 此檔僅給 lib/remotion 用
 */

/** 語音支援的三語 */
export type VoiceLang = "zh" | "ja" | "en";

/** 所有語音語言；用於 runtime 參數驗證 */

/** 所有語音語言；用於 runtime 參數驗證 */
export const ALL_VOICE_LANGS: readonly VoiceLang[] = [
  "zh",
  "ja",
  "en",
] as const;

export const VOICE_LANG_LABELS: Record<VoiceLang, string> = {
  zh: "中文",
  ja: "日文",
  en: "英文",
};

/** 單一角色在單一語言的語音設定 */

export function isVoiceLang(value: unknown): value is VoiceLang {
  return (
    typeof value === "string" &&
    (ALL_VOICE_LANGS as readonly string[]).includes(value)
  );
}

// ===== 翻譯（P3） =====
export type TargetLang = "ja" | "en";

/** 所有翻譯目標語言；用於 runtime 參數驗證 */

export type CharacterName = "叩叮" | "露比" | "波比" | "帕比";

export const CHARACTER_COLORS: Record<CharacterName, string> = {
  叩叮: "#24c28e",
  露比: "#f2a624",
  波比: "#2470f2",
  帕比: "#24c28e", // 同叩叮
};

/**
 * 角色名稱在各語言下的對應（v0.9.11）
 * 預覽時對話框上方的角色名前綴依此切換語言。
 * 跟翻譯字典 character 類條目（character 類）一致。
 *
 * v0.9.12：日文改用片假名（符合日本兒童讀物對外國人名的標準寫法）。
 */

/**
 * 角色名稱在各語言下的對應（v0.9.11）
 * 預覽時對話框上方的角色名前綴依此切換語言。
 * 跟翻譯字典 character 類條目（character 類）一致。
 *
 * v0.9.12：日文改用片假名（符合日本兒童讀物對外國人名的標準寫法）。
 */
export const CHARACTER_NAMES_BY_LANG: Record<
  CharacterName,
  Record<"zh" | "ja" | "en", string>
> = {
  叩叮: { zh: "叩叮", ja: "コーディ", en: "Kody" },
  露比: { zh: "露比", ja: "ルビー", en: "Ruby" },
  波比: { zh: "波比", ja: "ボビー", en: "Bobby" },
  帕比: { zh: "帕比", ja: "パフィー", en: "Puffy" },
};

// ===== 各章節主題色 =====

/** 預設情緒（每個角色都應該至少有這個） */
export const DEFAULT_EMOTION = "講話";

// ===== 章節前言（章節共通） =====

// ===== 資源（角色情緒 / 背景） =====
export interface CharacterEmotion {
  id: string;
  character: CharacterName;
  emotion: string;
  fileName: string;
  storagePath: string;
  url: string;
}

export interface Background {
  id: string;
  name: string;
  fileName: string;
  storagePath: string;
  url: string;
}

/** 預設情緒（每個角色都應該至少有這個） */

// ===== 章節前言（章節共通） =====
export interface SectionIntro {
  sectionType: string; // 例如「小故事」「小知識」
  sectionName: string; // 最多 12 字
  sectionTeaser: string; // 最多 28 字
}

// ===== AI 審查結果 =====

export interface VersionReview {
  reviewedAt?: unknown; // Firestore Timestamp
  issues: ReviewIssue[];
  /** 若此版本被 AI 推薦為最佳版本（並已被選用），附上推薦原因 */
  recommendation?: {
    reason: string;
  };
}

// ===== 小故事 =====

// ===== 測驗題（共用） =====
export interface QuizQuestion {
  question: string;
  options: [string, string, string, string];
  answer: 0 | 1 | 2 | 3;
  explanation: string;
  enabled?: boolean; // 未設值預設為啟用（true）
}

// ===== 小測驗 =====

export type ImageSubjectType = "person" | "object";

/** 裁切參數（對應 Colab 的 size/x/y 滑桿，中央九宮格為基準） */

/** 裁切參數（對應 Colab 的 size/x/y 滑桿，中央九宮格為基準） */
export interface CropParams {
  size: number; // 放大縮小（+/-）
  x: number; // 左右偏移
  y: number; // 上下偏移
}

// ===== 單元圖片（P2 — 小知識配圖） =====
// 「沒有對應的 UnitImage 文件」代表尚未生成；
// 文件存在時必為 grid_generated 或 cropped。
export type UnitImageStatus =
  | "grid_generated" // 已生成九宮格，尚未裁切
  | "cropped"; // 裁切完成（最終圖）

/** 語音要做哪些章節 — 目前做 story / knowledge / topic */
export type VoiceSection = "story" | "knowledge" | "topic";

/**
 * 單筆語音段落（存於 units/{unitId}/voices/{voiceId}）
 * voiceId 格式：{lang}_{section}_{pageIndex}
 */
/** 語音生成時 Gemini 音訊審核回傳的單段結果 */
export interface VoiceSegmentReview {
  /** 是否正確朗讀 */
  ok: boolean;
  /** Gemini 實際聽到的文字（標點可能不同於期望） */
  actualText: string;
  /** 具體問題列表（漏字 / 多字 / 唸錯 / 停頓奇怪） */
  issues: string[];
  /** 審核時間（ISO string） */
  reviewedAt?: string;
}

/** 單一角色在單一語言的語音設定 */
export interface VoiceCharLangSetting {
  /** Gemini TTS prebuilt voice 名稱，例如 "Zephyr"、"Pulcherrima" */
  voiceName: string;
  /** 風格指示（director's notes）— 會當作 prompt prefix 送給 TTS */
  directorNotes: string;
}

/**
 * 全站語音設定（存於 voiceSettings/default 單一 doc）
 * 結構：characters[角色][語言] = { voiceName, directorNotes }
 */

export interface VoiceDoc {
  id: string;
  language: VoiceLang;
  section: VoiceSection;
  pageIndex: number;
  character: CharacterName;
  /** 實際送去 TTS 的文字（原文或譯文） */
  text: string;
  /** 生成時使用的文字 hash（供過期偵測：若目前 text 改了會觸發「語音可能過期」提醒） */
  textHash?: string;
  /** Storage 公開 URL（存在代表已生成） */
  audioUrl?: string;
  /** 語音長度（毫秒），在生成時計算好 */
  durationMs?: number;
  /** 合併組識別碼；同組的段落在批次生成時會合併成一次 TTS + 靜音切段 */
  groupId?: string;
  /** Gemini 音訊審核結果（若此次生成有跑 Gemini 切段 + 審核才會有） */
  review?: VoiceSegmentReview;
  /** 當前音訊的 RMS（dBFS）。正常語音約 -25 ~ -15；< -35 偏小聲。生成 / 重切 / 調整音量後更新 */
  rmsDbfs?: number;
  /** 累計手動套用的音量增益（dB）。0 / 缺欄位 = 未調整；正數 = 變大聲、負數 = 變小聲 */
  gainDb?: number;
  /** 累計播放速度倍數（簡單 resample，會改音調）。1 / 缺欄位 = 原速；> 1 變快變高、< 1 變慢變低 */
  speedMultiplier?: number;
  status: "pending" | "generated";
  updatedAt?: unknown;
}

// ===== 影片模板（P5） =====

/** 模板類型（對應單元的三個有版面的章節） */

/**
 * 合併組原始 WAV 元資訊（存於 units/{unitId}/voiceGroups/{groupId}）
 *
 * 為什麼要存這個？v2 支援「重切」— 使用者調整切點時不該再跑一次 TTS（花錢、
 * 音色會漂移）。做法是批次生成時把整組合併後的 WAV 額外存一份，重切只讀它、
 * 套新切點、覆寫每段小 WAV。
 */
export interface VoiceGroupDoc {
  id: string; // 同 groupId
  language: VoiceLang;
  section: VoiceSection;
  character: CharacterName;
  /** 合併 WAV 的 Storage 公開 URL */
  mergedAudioUrl: string;
  /** 合併 WAV 在 Storage 的路徑（供 server 重切直接讀檔，不走 URL） */
  mergedStoragePath: string;
  /** 取樣率（目前固定 24000） */
  sampleRate: number;
  /** 合併 WAV 總長度（ms） */
  totalDurationMs: number;
  /** 當前切點（ms），陣列長度 = 段數 - 1 */
  cutPointsMs: number[];
  /** 組內段數（= 對應的 voices 數） */
  segmentCount: number;
  /** 切段模式（供使用者知道上次是怎麼切的） */
  splitMode?: "auto" | "loose" | "manual-params" | "waveform" | "gemini-audio";
  /** 上次使用的靜音切段參數（若適用） */
  splitParams?: { thresholdDb: number; minSilenceLenMs: number };
  /** Gemini 音訊審核整組通過結果；若此次生成有跑 Gemini 審核才會有 */
  overallOk?: boolean;
  reviewedAt?: unknown;
  /** 累計播放速度倍數（與該組 voices 一致；重切讀此 WAV 時也已是調整過的速度） */
  speedMultiplier?: number;
  updatedAt?: unknown;
}

/** 模板 ID — 格式 `{type}_{index}`，index 從 1 開始遞增。例：story_1 / knowledge_2 / topic_3 */
export type TemplateId = string;

/** 每個 type 的預設 ID（index = 1），不可刪除 */

/** 角色換場動畫參數（目前只有小故事真的用；小知識各頁靜止不動）
 *
 * 觸發規則（寫死在 buildConfig）：
 * - entrance：該頁角色 != 前一頁 → 播放（第一頁一定播）
 * - exit：該頁角色 != 下一頁 → 播放（最後一頁一定播）
 */
export interface CharAnimationSettings {
  /** 入場類型。"slide-up" 從下滑上 + spring；"fade-in" 漸入；"none" 不動畫 */
  entranceType: "slide-up" | "fade-in" | "none";
  /** 入場動畫長度（秒） */
  entranceDurationSec: number;
  /** 入場延遲（秒，從該頁開始起算） */
  entranceDelaySec: number;
  /** 離場類型。"fade-out" 淡出；"slide-down" 往下滑；"none" 不動畫 */
  exitType: "fade-out" | "slide-down" | "none";
  /** 離場動畫長度（秒） */
  exitDurationSec: number;
  /** 離場延遲（秒，從語音結束起算） */
  exitDelaySec: number;
}

/** 小故事預設動畫（模板缺欄位時的 fallback） */

/** 小故事預設動畫（模板缺欄位時的 fallback） */
export const DEFAULT_STORY_CHAR_ANIMATION: CharAnimationSettings = {
  entranceType: "slide-up",
  entranceDurationSec: 0.6,
  entranceDelaySec: 0,
  exitType: "fade-out",
  exitDurationSec: 0.6,
  exitDelaySec: 0,
};

/** 小知識預設動畫（全部 none；填進 doc 主要為了 UI 一致性） */

/** 小議題預設動畫（第一頁入場、最後一頁離場；叩叮固定角色） */
export const DEFAULT_TOPIC_CHAR_ANIMATION: CharAnimationSettings = {
  entranceType: "slide-up",
  entranceDurationSec: 0.6,
  entranceDelaySec: 0,
  exitType: "fade-out",
  exitDurationSec: 0.6,
  exitDelaySec: 0,
};

/** 影片模板 — 儲存在 templates/{templateId}
 *
 * defaults 欄位是 Remotion VideoConfig 的 Defaults 物件（bg/content/char/textLayer 的預設樣式），
 * 在 Player 播放前會被 page 層的 layers 覆寫。為避免 type 循環依賴，此處用 Record 表示。
 */

/** 影片模板 — 儲存在 templates/{templateId}
 *
 * defaults 欄位是 Remotion VideoConfig 的 Defaults 物件（bg/content/char/textLayer 的預設樣式），
 * 在 Player 播放前會被 page 層的 layers 覆寫。為避免 type 循環依賴，此處用 Record 表示。
 */
export interface TemplateDoc {
  id: TemplateId;
  name: string;
  description?: string;
  /** Remotion Defaults — 見 src/remotion/Composition.tsx */
  defaults: Record<string, unknown>;
  /** 角色換場動畫（目前僅 story_1 實際套用） */
  charAnimation?: CharAnimationSettings;
  updatedAt?: unknown;
}

/**
 * 合併組原始 WAV 元資訊（存於 units/{unitId}/voiceGroups/{groupId}）
 *
 * 為什麼要存這個？v2 支援「重切」— 使用者調整切點時不該再跑一次 TTS（花錢、
 * 音色會漂移）。做法是批次生成時把整組合併後的 WAV 額外存一份，重切只讀它、
 * 套新切點、覆寫每段小 WAV。
 */

// ===== 小故事 =====
export interface StoryPage {
  character: CharacterName;
  dialogue: string;
  html?: string; // 含顏色標記的 HTML（之後補）
  emotion?: string;
  background?: string;
  /** 本頁使用的版型 ID（story_*）；未設值 → fallback 到 story_1 */
  template?: string;
}

export interface StoryChoice {
  label: string;
  ending: {
    title: string;
    description: string;
    score: 10 | 20 | 30 | 40 | 50;
  };
}

export interface StoryVersion {
  intro: SectionIntro;
  pages: StoryPage[];
  choices: [StoryChoice, StoryChoice, StoryChoice]; // 固定 3 個選項
  review?: VersionReview;
}

// ===== 小知識 =====

// ===== 小知識 =====
export interface KnowledgePage {
  character: CharacterName; // 固定為「叩叮」
  content: string;
  html?: string;
  imagePrompt: string; // AI 圖片生成提示，以「在數字 5 的格子」開頭
  emotion?: string;
  background?: string;
  /** 本頁使用的版型 ID（knowledge_*）；未設值 → fallback 到 knowledge_1 */
  template?: string;
}

export interface KnowledgeVersion {
  intro: SectionIntro;
  pages: KnowledgePage[];
  review?: VersionReview;
}

// ===== 測驗題（共用） =====

// ===== 小議題 =====
export interface TopicPage {
  character: CharacterName; // 固定為「叩叮」
  content: string;
  html?: string;
  emotion?: string;
  background?: string;
  /** 本頁使用的版型 ID（topic_*）；未設值 → fallback 到 topic_1 */
  template?: string;
}

export interface TopicVersion {
  intro: SectionIntro;
  introduction: string;
  pages: TopicPage[];
  questions: QuizQuestion[]; // 6 題
  review?: VersionReview;
}

// ===== 小議題測驗（獨立章節的測驗，和 topic 內的測驗不同） =====

export interface UnitImage {
  id: string; // 以 pageIndex 編碼：page_0, page_1, ...
  pageIndex: number;
  prompt: string; // 當前 imagePrompt（快照，方便重生用）
  dialogueContent: string; // 對應小知識頁的文字（審核時顯示用）
  subjectType?: ImageSubjectType; // 人物 or 物件（決定參考圖）
  gridImageUrl?: string; // 九宮格原圖（4K）
  croppedImageUrl?: string; // 裁切後的最終圖
  cropParams?: CropParams; // 裁切參數
  status: UnitImageStatus;
  manualUpload?: boolean; // 最終圖是否為手動上傳替換
  updatedAt?: unknown;
}

// ===== 提示詞 =====

// ===== 翻譯 AI 審查結果 =====
export type TranslationReviewSeverity = "info" | "warn" | "error";

export type TranslationReviewCategory =
  | "accuracy" // 譯文意思是否準確反映原文
  | "tone" // 角色語氣是否符合規則
  | "terminology" // 字典詞彙是否使用一致
  | "formatting" // 標點、數字、排版
  | "cultural"; // 是否在地化/國際化得當

export interface TranslationReviewIssue {
  severity: TranslationReviewSeverity;
  category: TranslationReviewCategory;
  description: string;
  location?: string; // 例如「第 3 頁」「題目 2」「結局 B」
  suggestion?: string;
}

export interface TranslationReview {
  comment: string; // 50-150 字整體評語
  issues: TranslationReviewIssue[];
  reviewedAt: string; // ISO timestamp
  /**
   * 使用者選擇忽略此份 AI 建議（不跑「照建議修改」、頂欄計數不算）。
   * 重新跑 review 時自動清除（API 寫入新 review 時不帶此欄）。
   */
  ignored?: boolean;
}

/** AI 翻譯審查結果 */
export interface GameMetaTranslationReview {
  /** 是否「沒問題」（無重要 issues） */
  okay: boolean;
  /** 整體評語（30-100 字） */
  summary: string;
  /** 個別欄位發現的問題 */
  issues: {
    /** 欄位名（例：title、startInstructions、customLabels.placeBucket） */
    field: string;
    /** 嚴重度 */
    severity: "low" | "medium" | "high";
    /** 問題描述 */
    problem: string;
    /** 建議改法 */
    suggestion: string;
  }[];
}

/** 翻譯後的 segment — 純文字 + 可選重點字顏色 */
export interface TranslatedSegment {
  text: string;
  color?: string; // 有顏色代表該 segment 是重點字
}

/** 翻譯結果的頁 — 對話 / 敘述頁共用 */

/** 翻譯結果的頁 — 對話 / 敘述頁共用 */
export interface TranslatedPage {
  segments: TranslatedSegment[]; // AI 輸出的語意段落
  text: string; // 由 segments 拼接的純文字（方便直接顯示）
  html: string; // 由 segments 拼接的 HTML（含 <span> 重點字）
}

/** 小故事結局 */

/** 小故事結局 */
export interface TranslatedEnding {
  title: string;
  description: string;
}

export interface TranslatedChoice {
  label: string;
  ending: TranslatedEnding;
}

export interface TranslatedSectionIntro {
  sectionName: string;
  sectionTeaser: string;
}

// ===== 翻譯 AI 審查結果 =====

export interface TranslatedStory {
  intro: TranslatedSectionIntro;
  pages: TranslatedPage[];
  choices: TranslatedChoice[];
  review?: TranslationReview;
}

export interface TranslatedKnowledge {
  intro: TranslatedSectionIntro;
  pages: TranslatedPage[];
  review?: TranslationReview;
}

export interface TranslatedTopic {
  intro: TranslatedSectionIntro;
  introduction: string;
  pages: TranslatedPage[];
  questions: TranslatedQuizQuestion[];
  review?: TranslationReview;
}

export interface TranslatedQuizQuestion {
  question: string;
  options: string[];
  explanation: string;
}

export interface TranslatedQuiz {
  intro: TranslatedSectionIntro;
  questions: TranslatedQuizQuestion[];
  review?: TranslationReview;
}

export interface TranslatedTopicQuiz {
  intro: TranslatedSectionIntro;
  questions: TranslatedQuizQuestion[];
  review?: TranslationReview;
}

/** 手動上傳的多語替代圖（P3 #4-A）
 * 依章節 × pageIndex 記錄該語言版本的替代圖 URL；沒有紀錄代表 fallback 用原圖。
 * 目前只有小知識（knowledge）有配圖，保留結構供未來其他章節擴充。
 */

export interface TranslatedGame {
  intro: TranslatedSectionIntro;
  title: string;
  subtitle: string;
  scenario: string;
  visual: string;
  rules: string;
  review?: TranslationReview;
}

export interface TranslatedImageOverride {
  url: string;
  updatedAt?: unknown;
  /** "manual" = 使用者手動上傳；"ai" = AI 自動重繪。未設欄位視為 "manual"（相容舊資料） */
  source?: "manual" | "ai";
  /** 僅在 source = "ai" 時寫入：視覺模型審查圖上實際文字的結果 */
  review?: TranslatedImageReview;
}

export type TranslatedImageMap = Partial<
  Record<
    "story" | "knowledge" | "quiz" | "game" | "topic" | "topicQuiz",
    Record<string, TranslatedImageOverride>
  >
>;

/** 單元某語言的翻譯結果（存於 units/{id}/translations/{lang}） */

/** 手動上傳的多語替代圖（P3 #4-A）
 * 依章節 × pageIndex 記錄該語言版本的替代圖 URL；沒有紀錄代表 fallback 用原圖。
 * 目前只有小知識（knowledge）有配圖，保留結構供未來其他章節擴充。
 */
export interface TranslatedImageReview {
  ok: boolean;
  actualText: string;
  issues: string[];
}

/** 單元某語言的翻譯結果（存於 units/{id}/translations/{lang}） */
export interface UnitTranslations {
  lang: TargetLang;
  story?: TranslatedStory;
  knowledge?: TranslatedKnowledge;
  quiz?: TranslatedQuiz;
  game?: TranslatedGame;
  topic?: TranslatedTopic;
  topicQuiz?: TranslatedTopicQuiz;
  /** 各章節翻譯當下的原文 hash，用來偵測原文改動後譯文是否過期 */
  sourceHashes?: Partial<
    Record<
      "story" | "knowledge" | "quiz" | "game" | "topic" | "topicQuiz",
      string
    >
  >;
  /** 手動上傳的多語替代圖（P3 #4-A） */
  images?: TranslatedImageMap;
  /**
   * 各語言獨立的 per-page 版型覆寫（v0.9.7）。
   * key 是頁碼字串，value 是 templateId（如 `"knowledge_2"`）。
   * 沒設或設成空 → 預覽時 fallback 來源頁的 `template`，再沒設就用該 type 的 `_1` 預設。
   */
  templates?: Partial<
    Record<
      "story" | "knowledge" | "topic",
      Record<string, string>
    >
  >;
  generatedAt?: unknown;
  editedAt?: unknown;
}

/** AI 建議新增到字典的詞（翻譯 API 一併回傳） */

export type ReviewIssueCategory = "correctness" | "internationalization";

export interface ReviewIssue {
  category: ReviewIssueCategory;
  description: string;
  location?: string;
}
