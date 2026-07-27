export const giscusConfig = {
    /** 形如 "owner/repo" */
    repo: "DimLoong/NeoForge-26.1-document-CN" as `${string}/${string}`,
    /** 从 giscus.app 获取，形如 "R_kgDO..." */
    repoId: "R_kgDOTg9G0A",
    /** Discussions 分类名，需与 categoryId 对应 */
    category: "General",
    /** 从 giscus.app 获取，形如 "DIC_kwDO..." */
    categoryId: "DIC_kwDOTg9G0M4DCEJH",
    /** 按页面路径映射，每页独立评论区 */
    mapping: "pathname" as const,
    /** 严格匹配，避免不同页面串评论 */
    strict: "1" as const,
    /** 开启表情反应 */
    reactionsEnabled: "1" as const,
    emitMetadata: "0" as const,
    /** 评论输入框位置：'top' 顶部 / 'bottom' 底部 */
    inputPosition: "top" as const,
    /** 界面语言：简体中文 */
    lang: "zh-CN",
    /** 懒加载：滚动到评论区才加载 */
    loading: "lazy" as const
};

/** 是否已完成 giscus 配置（占位符已替换）。 */
export function isGiscusConfigured(): boolean {
    return (
        !giscusConfig.repoId.includes("PLACEHOLDER") &&
        !giscusConfig.categoryId.includes("PLACEHOLDER")
    );
}
