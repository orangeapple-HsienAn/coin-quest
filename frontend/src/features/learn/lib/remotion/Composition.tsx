// Remotion Composition（從 finance-cms 搬進來，已做以下調整）
// - 移除 @remotion/media-utils 的 getAudioDurationInSeconds 依賴
// - 移除 prepareTimeline / calculateVideoMetadata（改由 src/lib/remotion/timeline.ts 於 client 端同步計算）
// - 直接 expects 外部算好的 PreparedTimeline 作為 inputProps.timeline

import { Gif } from "@remotion/gif";
import {
  AbsoluteFill,
  Audio,
  Img,
  Sequence,
  interpolate,
  staticFile,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

type Position = {
  x?: number;
  y?: number;
};

type Padding = {
  top?: number;
  right?: number;
  bottom?: number;
  left?: number;
};

type TextFont = {
  family?: string;
  size?: number;
  color?: string;
  lineHeight?: number | string;
};

export type Entrance = {
  type?: string;
  durationSec?: number;
  delaySec?: number;
};

export type Exit = {
  type?: string;
  durationSec?: number;
  delaySec?: number;
};

type ImageObjectFit = "fill" | "contain" | "cover" | "none" | "scale-down";

export type ImageLayer = {
  url?: string | null | number;
  zIndex?: number;
  width?: number;
  height?: number;
  objectFit?: ImageObjectFit;
  border?: string;
  borderRadius?: number;
  transform?: string;
  boxShadow?: string;
  filter?: string;
  position?: Position;
};

export type TextLayer = {
  html?: string;
  zIndex?: number;
  width?: number;
  height?: number;
  paragraphWidth?: number | string;
  paragraphLineHeight?: number | string;
  position?: Position;
  transform?: string;
  boxShadow?: string;
  padding?: Padding;
  backgroundColor?: string;
  borderRadius?: number;
  font?: TextFont;
};

export type CharacterLayer = ImageLayer & {
  transform?: string;
  boxShadow?: string;
  filter?: string;
  entrance?: Entrance;
  exit?: Exit;
};

export type Layers = {
  bgImage?: ImageLayer;
  contentImage?: ImageLayer;
  charImage?: CharacterLayer;
  textLayer?: TextLayer;
};

export type Defaults = {
  bgImage?: ImageLayer;
  contentImage?: ImageLayer;
  charImage?: CharacterLayer;
  textLayer?: TextLayer;
};

export type Page = {
  /**
   * 音訊 URL。Player 模式下這裡不再用來算時長（由外部的 durationMs 決定），
   * 但仍作為 <Audio> 的 src 使用。
   */
  audioUrl?: string | number | null;
  defaults?: Defaults;
  layers?: Layers;
};

export type TimelineConfig = {
  fps: number;
  durationMode: "audio";
  pageGapMs: number;
  audioPostDelayMs?: number;
};

export type BgmConfig = {
  url: string | null;
  volume: number;
  loop: boolean;
};

export type VideoConfig = {
  version: string;
  outName?: string;
  timeline: TimelineConfig;
  bgm?: BgmConfig;
  defaults?: Defaults;
  pages: Page[];
};

export type PreparedPage = {
  startFrame: number;
  totalFrames: number;
  narrationFrames: number;
  audioPostDelayFrames: number;
  audioUrl?: string | number | null;
  layers: Required<Layers>;
};

export type PreparedTimeline = {
  durationInFrames: number;
  fps: number;
  pageGapFrames: number;
  pages: PreparedPage[];
};

export type VideoCompositionProps = {
  config: VideoConfig;
  timeline: PreparedTimeline | null;
};

const isGifUrl = (url?: string | null): boolean => {
  if (!url) {
    return false;
  }

  return /\.gif(?:$|[?#])/i.test(url);
};

const resolveAssetSrc = (url?: string | number | null): string | undefined => {
  if (url === undefined || url === null) {
    return undefined;
  }

  if (typeof url === "number") {
    return undefined;
  }

  if (/^(https?:)?\/\//i.test(url) || url.startsWith("data:")) {
    return url;
  }

  if (url.startsWith("/")) {
    return staticFile(url.slice(1));
  }

  return url;
};

const applyParagraphStyles = (
  html: string,
  paragraphWidth?: number | string,
  paragraphLineHeight?: number | string,
): string => {
  if (paragraphWidth === undefined && paragraphLineHeight === undefined) {
    return html;
  }

  const styleTokens: string[] = [];

  if (paragraphWidth !== undefined) {
    const widthValue =
      typeof paragraphWidth === "number" ? `${paragraphWidth}px` : paragraphWidth;
    styleTokens.push(`width:${widthValue};`);
  }

  if (paragraphLineHeight !== undefined) {
    styleTokens.push(`line-height:${paragraphLineHeight};`);
  }

  const paragraphStyle = styleTokens.join("");

  return html.replace(/<p\b([^>]*)>/gi, (tag, rawAttrs: string) => {
    const attrs = rawAttrs ?? "";
    const styleMatch = attrs.match(/\sstyle=(["'])(.*?)\1/i);

    if (styleMatch) {
      const quote = styleMatch[1];
      const styleValue = styleMatch[2].trim();
      const mergedStyle = `${styleValue}${styleValue.length === 0 || styleValue.endsWith(";") ? "" : ";"}${paragraphStyle}`;

      return tag.replace(styleMatch[0], ` style=${quote}${mergedStyle}${quote}`);
    }

    return `<p${attrs} style="${paragraphStyle}">`;
  });
};

type PageSceneProps = {
  page: PreparedPage;
};

const PageScene: React.FC<PageSceneProps> = ({ page }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const localFrame = Math.max(frame, 0);
  const bgImageSrc = resolveAssetSrc(page.layers.bgImage.url);
  const contentImageSrc = resolveAssetSrc(page.layers.contentImage.url);
  const charImageSrc = resolveAssetSrc(page.layers.charImage.url);

  const entranceType = page.layers.charImage.entrance?.type;
  const entranceDurationSec = page.layers.charImage.entrance?.durationSec ?? 0.6;
  const entranceDelaySec = page.layers.charImage.entrance?.delaySec ?? 0;
  const entranceDurationFrames = Math.max(Math.round(entranceDurationSec * fps), 1);
  const entranceDelayFrames = Math.max(Math.round(entranceDelaySec * fps), 0);
  const shouldAnimateEntranceSlideUp = entranceType === "slide-up";
  const shouldAnimateEntranceFade = entranceType === "fade-in";

  const entranceProgress = shouldAnimateEntranceSlideUp
    ? spring({
      fps,
      frame: Math.max(localFrame - entranceDelayFrames, 0),
      durationInFrames: entranceDurationFrames,
    })
    : 1;

  const charOpacity = shouldAnimateEntranceFade ? entranceProgress : 1;
  const charTranslateY =
    shouldAnimateEntranceSlideUp
      ? interpolate(entranceProgress, [0, 1], [40, 0], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      })
      : 0;

  const exitType = page.layers.charImage.exit?.type;
  const exitDurationSec = page.layers.charImage.exit?.durationSec ?? 0.6;
  const exitDelaySec = page.layers.charImage.exit?.delaySec ?? 0;
  const exitDurationFrames = Math.max(Math.round(exitDurationSec * fps), 1);
  const exitDelayFrames = Math.max(Math.round(exitDelaySec * fps), 0);
  const shouldAnimateExitFade = exitType === "fade-out";
  const shouldAnimateExitSlideDown = exitType === "slide-down";
  const shouldAnimateExit = shouldAnimateExitFade || shouldAnimateExitSlideDown;
  const exitStartFrame = Math.max(
    page.narrationFrames + page.audioPostDelayFrames + exitDelayFrames,
    0,
  );

  const exitProgress = shouldAnimateExit
    ? spring({
      fps,
      frame: Math.max(localFrame - exitStartFrame, 0),
      durationInFrames: exitDurationFrames,
    })
    : 0;

  const exitOpacity = shouldAnimateExit
    ? interpolate(exitProgress, [0, 1], [1, 0], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    })
    : 1;

  const exitTranslateY = shouldAnimateExitSlideDown
    ? interpolate(exitProgress, [0, 1], [0, 40], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    })
    : 0;

  const baseTransform = page.layers.charImage.transform ?? "";
  const combinedCharOpacity = charOpacity * exitOpacity;
  const combinedCharTranslateY = charTranslateY + exitTranslateY;
  const combinedCharTransform = `${baseTransform} translateY(${combinedCharTranslateY}px)`.trim();

  const textPadding = page.layers.textLayer.padding;
  const textFont = page.layers.textLayer.font;
  const textHtml = applyParagraphStyles(
    page.layers.textLayer.html ?? "",
    page.layers.textLayer.paragraphWidth,
    page.layers.textLayer.paragraphLineHeight,
  );

  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      {bgImageSrc ? (
        <Img
          src={bgImageSrc}
          style={{
            position: "absolute",
            left: page.layers.bgImage.position?.x ?? 0,
            top: page.layers.bgImage.position?.y ?? 0,
            width: page.layers.bgImage.width ?? "100%",
            height: page.layers.bgImage.height ?? "100%",
            objectFit: page.layers.bgImage.objectFit ?? "cover",
            zIndex: page.layers.bgImage.zIndex ?? 0,
            transform: page.layers.bgImage.transform,
            boxShadow: page.layers.bgImage.boxShadow,
            filter: page.layers.bgImage.filter,
            border: page.layers.bgImage.border,
            borderRadius: page.layers.bgImage.borderRadius,
          }}
        />
      ) : null}

      {contentImageSrc ? (
        <div
          style={{
            position: "absolute",
            left: page.layers.contentImage.position?.x ?? 100,
            top: page.layers.contentImage.position?.y ?? 150,
            width: page.layers.contentImage.width ?? 960,
            height: page.layers.contentImage.height ?? 700,
            border: page.layers.contentImage.border,
            borderRadius: page.layers.contentImage.borderRadius,
            transform: page.layers.contentImage.transform,
            boxShadow: page.layers.contentImage.boxShadow,
            filter: page.layers.contentImage.filter,
            overflow: "hidden",
            zIndex: page.layers.contentImage.zIndex ?? 1,
          }}
        >
          <Img
            src={contentImageSrc}
            style={{
              width: "100%",
              height: "100%",
              objectFit: page.layers.contentImage.objectFit ?? "cover",
              objectPosition: "center",
            }}
          />
        </div>
      ) : null}

      {charImageSrc ? (
        isGifUrl(charImageSrc) ? (
          <Gif
            src={charImageSrc}
            fit="contain"
            style={{
              position: "absolute",
              left: page.layers.charImage.position?.x ?? 100,
              top: page.layers.charImage.position?.y ?? 150,
              width: page.layers.charImage.width,
              height: page.layers.charImage.height,
              maxWidth: page.layers.charImage.width === undefined ? 720 : undefined,
              maxHeight: page.layers.charImage.height === undefined ? 840 : undefined,
              zIndex: page.layers.charImage.zIndex ?? 2,
              opacity: combinedCharOpacity,
              transform: combinedCharTransform,
              boxShadow: page.layers.charImage.boxShadow,
              filter: page.layers.charImage.filter,
              border: page.layers.charImage.border,
              borderRadius: page.layers.charImage.borderRadius,
            }}
          />
        ) : (
          <Img
            src={charImageSrc}
            style={{
              position: "absolute",
              left: page.layers.charImage.position?.x ?? 100,
              top: page.layers.charImage.position?.y ?? 150,
              width: page.layers.charImage.width,
              height: page.layers.charImage.height,
              maxWidth: page.layers.charImage.width === undefined ? 720 : undefined,
              maxHeight: page.layers.charImage.height === undefined ? 840 : undefined,
              objectFit: "contain",
              zIndex: page.layers.charImage.zIndex ?? 2,
              opacity: combinedCharOpacity,
              transform: combinedCharTransform,
              boxShadow: page.layers.charImage.boxShadow,
              filter: page.layers.charImage.filter,
              border: page.layers.charImage.border,
              borderRadius: page.layers.charImage.borderRadius,
            }}
          />
        )
      ) : null}

      {page.layers.textLayer.html ? (
        <div
          style={{
            position: "absolute",
            left: page.layers.textLayer.position?.x ?? 80,
            top: page.layers.textLayer.position?.y,
            width: page.layers.textLayer.width ?? 300,
            height: page.layers.textLayer.height ?? 200,
            bottom: page.layers.textLayer.position?.y === undefined ? 80 : undefined,
            zIndex: page.layers.textLayer.zIndex ?? 3,
            transform: page.layers.textLayer.transform,
            boxShadow: page.layers.textLayer.boxShadow,
            backgroundColor: page.layers.textLayer.backgroundColor ?? "#FFFFFF",
            borderRadius: page.layers.textLayer.borderRadius ?? 10,
            paddingTop: textPadding?.top ?? 20,
            paddingRight: textPadding?.right ?? 20,
            paddingBottom: textPadding?.bottom ?? 20,
            paddingLeft: textPadding?.left ?? 20,
            fontFamily: textFont?.family ?? "Arial",
            fontSize: textFont?.size ?? 24,
            color: textFont?.color ?? "#000000",
            lineHeight: textFont?.lineHeight ?? 1.4,
          }}
          dangerouslySetInnerHTML={{ __html: textHtml }}
        />
      ) : null}
    </AbsoluteFill>
  );
};

export const MyComposition: React.FC<VideoCompositionProps> = ({ config, timeline }) => {
  if (!timeline) {
    return <AbsoluteFill style={{ backgroundColor: "#000" }} />;
  }

  const bgmSrc = resolveAssetSrc(config.bgm?.url);

  return (
    <AbsoluteFill>
      {bgmSrc ? (
        <Audio
          src={bgmSrc}
          volume={config.bgm?.volume ?? 1}
          loop={config.bgm?.loop ?? false}
        />
      ) : null}

      {timeline.pages.map((page, index) => {
        const isNumericAudio =
          typeof page.audioUrl === "number" ||
          (typeof page.audioUrl === "string" && /^\s*\d+\s*$/.test(page.audioUrl));

        const narrationSrc = isNumericAudio
          ? undefined
          : resolveAssetSrc(typeof page.audioUrl === "string" ? page.audioUrl : String(page.audioUrl ?? ""));

        return (
          <Sequence
            key={index}
            from={page.startFrame}
            durationInFrames={page.totalFrames}
            // 提前 3 秒隱形掛載下一段，讓 <Audio>/<Img> 在真正切換前就把 src 接好、解碼完成，
            // 避免換頁瞬間瀏覽器才開始準備 DOM 元素造成卡頓（Remotion 官方建議）
            premountFor={timeline.fps * 3}
          >
            <PageScene page={page} />
            {narrationSrc ? (
              <Audio
                src={narrationSrc}
                volume={1}
                // 不設 endAt：讓音訊播到自然結尾或 Sequence 卸載為止。
                // Sequence 會比 narrationFrames 多 audioPostDelayMs 的尾巴，
                // 等於多給音訊空間追上首次播放的 decode 啟動延遲，避免尾音被切掉。
                pauseWhenBuffering
              />
            ) : null}
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};
