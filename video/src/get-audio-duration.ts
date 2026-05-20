/** 取得音檔時長（秒），用於 calculateMetadata 動態設定場景長度 */
import { Input, ALL_FORMATS, UrlSource } from 'mediabunny'

export const getAudioDuration = async (src: string) => {
  const input = new Input({
    formats: ALL_FORMATS,
    source: new UrlSource(src, { getRetryDelay: () => null }),
  })
  return input.computeDuration()
}
