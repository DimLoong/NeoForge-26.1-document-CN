// 阅读进度相关的类型定义。

/** 单篇文档的阅读进度记录。 */
export type DocumentProgress = {
  /** 页面路径（location.pathname）。 */
  pathname: string;
  /** 文档版本标签，例如 "26.1"。 */
  version: string;
  /** 上次离开时的滚动位置（像素）。 */
  scrollY: number;
  /** 阅读进度，取值 0 ~ 1（存储层保存比例，展示层换算为百分比）。 */
  progress: number;
  /** 是否已读完（达到阈值）。 */
  completed: boolean;
  /** 最近一次阅读的时间戳（毫秒）。 */
  lastReadAt: number;
  /** 页面标题，用于“继续阅读”入口展示。 */
  title?: string;
};

/** 所有文档进度的集合，键为 pathname。 */
export type DocumentProgressMap = Record<string, DocumentProgress>;
