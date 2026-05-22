// Client 端同步計算 PreparedTimeline，跳過原 Composition 的 getAudioDurationInSeconds fetch。
// 音訊時長由外部傳入的 pageDurations（ms）決定 — 來源是 Firestore voices.{durationMs}。

import type {
  PreparedPage,
  PreparedTimeline,
  VideoConfig,
} from "./Composition";
import { resolveLayers } from "./mergeLayers";

const DEFAULT_AUDIO_MS = 1000;

/**
 * 從 config + 每頁 duration（ms）同步組出 PreparedTimeline。
 *
 * @param config    Remotion 影片 config
 * @param pageDurations  與 config.pages 等長的音訊時長陣列（ms）；若為 null/undefined 走 fallback
 * @param fallbackMs     缺 duration 時的 fallback（預設 1000ms）
 */
export function prepareTimelineFromDurations(
  config: VideoConfig,
  pageDurations: (number | null | undefined)[],
  fallbackMs: number = DEFAULT_AUDIO_MS,
): PreparedTimeline {
  if (config.timeline.durationMode !== "audio") {
    throw new Error("Only durationMode='audio' is supported.");
  }
  if (config.pages.length === 0) {
    throw new Error("pages must contain at least one item.");
  }
  if (pageDurations.length !== config.pages.length) {
    throw new Error(
      `pageDurations length (${pageDurations.length}) != pages length (${config.pages.length})`,
    );
  }

  const fps = config.timeline.fps;
  const pageGapFrames = Math.round((config.timeline.pageGapMs / 1000) * fps);
  const audioPostDelayMs = config.timeline.audioPostDelayMs ?? 0;
  const audioPostDelayFrames = Math.max(
    Math.round((audioPostDelayMs / 1000) * fps),
    0,
  );

  const narrationFramesArr = config.pages.map((_, i) => {
    const ms = pageDurations[i];
    const effectiveMs =
      typeof ms === "number" && Number.isFinite(ms) && ms >= 0
        ? ms
        : fallbackMs;
    return Math.max(Math.round((effectiveMs / 1000) * fps), 1);
  });

  let cursor = 0;
  const pages: PreparedPage[] = config.pages.map((page, pageIndex) => {
    const narration = narrationFramesArr[pageIndex];
    const layers = resolveLayers(config.defaults, page);
    const exitType = layers.charImage.exit?.type;
    const shouldAnimateExit = exitType === "fade-out" || exitType === "slide-down";
    const exitDurationSec = layers.charImage.exit?.durationSec ?? 0.6;
    const exitDelaySec = layers.charImage.exit?.delaySec ?? 0;
    const exitDurationFrames = shouldAnimateExit
      ? Math.max(Math.round(exitDurationSec * fps), 1)
      : 0;
    const exitDelayFrames = shouldAnimateExit
      ? Math.max(Math.round(exitDelaySec * fps), 0)
      : 0;
    const totalFrames =
      narration +
      audioPostDelayFrames +
      exitDelayFrames +
      exitDurationFrames +
      pageGapFrames;

    const prepared: PreparedPage = {
      startFrame: cursor,
      totalFrames,
      narrationFrames: narration,
      audioPostDelayFrames,
      audioUrl: page.audioUrl,
      layers,
    };

    cursor += totalFrames;
    return prepared;
  });

  return {
    durationInFrames: cursor,
    fps,
    pageGapFrames,
    pages,
  };
}
