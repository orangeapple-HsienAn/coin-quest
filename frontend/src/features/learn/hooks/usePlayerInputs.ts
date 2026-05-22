/**
 * 把 snapshot 內的所有資料聚合成 buildVideoConfig 需要的 BuildInputs。
 * 包含 unit / voices / images / translations + lesson 共用 templates / backgrounds / characters。
 */
import { useEffect, useState } from 'react'
import { fetchSnapshotJson } from '../lib/snapshot'
import type {
  Background,
  CharacterEmotion,
  TemplateDoc,
  UnitImage,
  UnitTranslations,
  VoiceDoc,
  VoiceLang,
} from '../lib/remotion/cms-types'
import type { UnitDoc } from '../lib/types'
import type { BuildInputs, PreviewSection } from '../lib/remotion/buildConfig'

interface UsePlayerInputsArgs {
  lessonKey: string
  unitId: string
  section: PreviewSection
  language?: VoiceLang
}

export function usePlayerInputs({ lessonKey, unitId, section, language = 'zh' }: UsePlayerInputsArgs) {
  const [inputs, setInputs] = useState<BuildInputs | null>(null)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        // 1. unit + 子集合（snapshot 都是物件形式 {id: data}，轉成 array）
        const [unit, voicesObj, imagesObj, translationsObj, templatesObj, bgsObj, charsObj] =
          await Promise.all([
            fetchSnapshotJson<UnitDoc>(lessonKey, 'units', unitId, 'unit.json'),
            fetchSnapshotJson<Record<string, VoiceDoc>>(lessonKey, 'units', unitId, 'voices.json'),
            fetchSnapshotJson<Record<string, UnitImage>>(lessonKey, 'units', unitId, 'images.json').catch(() => ({})),
            fetchSnapshotJson<Record<string, UnitTranslations[keyof UnitTranslations]>>(
              lessonKey,
              'units',
              unitId,
              'translations.json',
            ).catch(() => ({})),
            fetchSnapshotJson<Record<string, TemplateDoc>>(lessonKey, 'templates.json'),
            fetchSnapshotJson<Record<string, Background>>(lessonKey, 'assets', 'backgrounds.json'),
            fetchSnapshotJson<Record<string, CharacterEmotion>>(lessonKey, 'assets', 'characters.json'),
          ])

        // snapshot 內 doc 的 id 是 JSON 的 key，CMS 端是文件 ID；converter 把 key 注入 id 欄位
        const inject = <T extends object>(o: Record<string, T>): (T & { id: string })[] =>
          Object.entries(o).map(([id, v]) => ({ ...v, id }))
        const voices = inject(voicesObj)
        const images = inject(imagesObj)
        const templates = inject(templatesObj)
        const backgrounds = inject(bgsObj)
        const characterEmotions = inject(charsObj)

        // translations.json 的結構：{ en: {...}, ja: {...} } — 取目標語言的那份（zh 為來源不需翻譯）
        const translations =
          language === 'zh' ? null : ((translationsObj as Record<string, unknown>)[language] as UnitTranslations | null) ?? null

        // 取對應 section 的 _1 模板（為當前 section 提供 defaults 與 charAnimation）
        const templateIdPrefix = `${section}_`
        const template =
          templates.find((t) => t.id === `${templateIdPrefix}1`) ?? templates.find((t) => t.id.startsWith(templateIdPrefix)) ?? null

        const built: BuildInputs = {
          section,
          language,
          storyVersion: unit.components.story?.versions?.[0] ?? null,
          knowledgeVersion: unit.components.knowledge?.versions?.[0] ?? null,
          topicVersion: unit.components.topic?.versions?.[0] ?? null,
          translations,
          images,
          voices,
          template,
          allTemplates: templates,
          characterEmotions,
          backgrounds,
        } as BuildInputs

        if (!cancelled) setInputs(built)
      } catch (e) {
        if (!cancelled) setError(e as Error)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [lessonKey, unitId, section, language])

  return { inputs, error, loading: !inputs && !error }
}
