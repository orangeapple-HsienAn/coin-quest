/** 小故事影片 props */
export interface StoryVideoProps {
  title: string
  courseIcon: string
  /** 角色名稱 + emoji */
  character: { name: string; icon: string }
  /** 故事情境場景（2～3 段） */
  storyScenes: { text: string; icon: string }[]
  /** 三個選項的 label */
  choiceLabels: string[]
  /** 各場景幀數（由 calculateMetadata 注入） */
  sceneDurations?: number[]
}

/** 知識影片場景：概念場景或配圖場景 */
export type KnowledgeScene =
  | { type: 'concept'; icon: string; heading: string; description: string }
  | { type: 'image'; src: string; caption?: string }

/** 小知識影片 props */
export interface KnowledgeVideoProps {
  title: string
  courseIcon: string
  /** 場景列表（概念場景與配圖場景自由組合） */
  scenes: KnowledgeScene[]
  /** 重點整理 */
  takeaways: string[]
  /** 各場景幀數（由 calculateMetadata 注入） */
  sceneDurations?: number[]
}
