// 從原 Composition.tsx 抽出的 layer merge helpers（純 config 合併邏輯，client 端組 config 時會用到）

import type {
  CharacterLayer,
  Defaults,
  ImageLayer,
  Layers,
  Page,
  TextLayer,
} from "./Composition";

type Position = { x?: number; y?: number };
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

function mergePosition(base?: Position, override?: Position): Position {
  return {
    x: override?.x ?? base?.x,
    y: override?.y ?? base?.y,
  };
}

function mergePadding(base?: Padding, override?: Padding): Padding {
  return {
    top: override?.top ?? base?.top,
    right: override?.right ?? base?.right,
    bottom: override?.bottom ?? base?.bottom,
    left: override?.left ?? base?.left,
  };
}

function mergeFont(base?: TextFont, override?: TextFont): TextFont {
  return {
    family: override?.family ?? base?.family,
    size: override?.size ?? base?.size,
    color: override?.color ?? base?.color,
    lineHeight: override?.lineHeight ?? base?.lineHeight,
  };
}

function mergeImageLayer(base?: ImageLayer, override?: ImageLayer): ImageLayer {
  return {
    ...base,
    ...override,
    position: mergePosition(base?.position, override?.position),
  };
}

function mergeCharacterLayer(
  base?: CharacterLayer,
  override?: CharacterLayer,
): CharacterLayer {
  return {
    ...mergeImageLayer(base, override),
    entrance: {
      ...base?.entrance,
      ...override?.entrance,
    },
    exit: {
      ...base?.exit,
      ...override?.exit,
    },
  };
}

function mergeTextLayer(base?: TextLayer, override?: TextLayer): TextLayer {
  return {
    ...base,
    ...override,
    position: mergePosition(base?.position, override?.position),
    padding: mergePadding(base?.padding, override?.padding),
    font: mergeFont(base?.font, override?.font),
  };
}

export function resolveLayers(
  topDefaults: Defaults | undefined,
  page: Page,
): Required<Layers> {
  // 合併順序：top-level defaults → page-level defaults → page.layers
  const bgImage = mergeImageLayer(
    mergeImageLayer(topDefaults?.bgImage, page.defaults?.bgImage),
    page.layers?.bgImage,
  );
  const contentImage = mergeImageLayer(
    mergeImageLayer(topDefaults?.contentImage, page.defaults?.contentImage),
    page.layers?.contentImage,
  );
  const charImage = mergeCharacterLayer(
    mergeCharacterLayer(topDefaults?.charImage, page.defaults?.charImage),
    page.layers?.charImage,
  );
  const textLayer = mergeTextLayer(
    mergeTextLayer(topDefaults?.textLayer, page.defaults?.textLayer),
    page.layers?.textLayer,
  );
  return { bgImage, contentImage, charImage, textLayer };
}
