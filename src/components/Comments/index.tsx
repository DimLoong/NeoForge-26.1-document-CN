// 文档页评论区（Giscus，基于 GitHub Discussions）。
// 特性：跟评/回复、发布时间（中文相对时间）、头像、Markdown、表情反应，主题跟随站点明暗切换。
import React from 'react';
import BrowserOnly from '@docusaurus/BrowserOnly';
import {useColorMode} from '@docusaurus/theme-common';
import Giscus from '@giscus/react';
import {giscusConfig, isGiscusConfigured} from './config';
import styles from './styles.module.css';

function GiscusComments() {
  const {colorMode} = useColorMode();
  // 主题跟随站点明暗切换（切换时 @giscus/react 会向 iframe 发送 postMessage 实时更新）
  const theme = colorMode === 'dark' ? 'dark_dimmed' : 'light';

  return (
    <div className={styles.comments}>
      <div className={styles.header}>
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
        <span>评论</span>
      </div>
      <Giscus
        id="comments"
        repo={giscusConfig.repo}
        repoId={giscusConfig.repoId}
        category={giscusConfig.category}
        categoryId={giscusConfig.categoryId}
        mapping={giscusConfig.mapping}
        strict={giscusConfig.strict}
        reactionsEnabled={giscusConfig.reactionsEnabled}
        emitMetadata={giscusConfig.emitMetadata}
        inputPosition={giscusConfig.inputPosition}
        theme={theme}
        lang={giscusConfig.lang}
        loading={giscusConfig.loading}
      />
    </div>
  );
}

export default function Comments(): JSX.Element {
  return (
    <BrowserOnly fallback={<div />}>
      {() => {
        if (!isGiscusConfigured()) {
          return (
            <div className={styles.comments}>
              <div className={styles.notice}>
                💬 评论功能已接入 Giscus，但尚未配置：请在
                <code> src/components/Comments/config.ts </code>
                中填入从 <a href="https://giscus.app" target="_blank" rel="noreferrer">giscus.app</a>
                获取的 <code>repoId</code> 与 <code>categoryId</code>（并在仓库开启 Discussions）。
              </div>
            </div>
          );
        }
        return <GiscusComments />;
      }}
    </BrowserOnly>
  );
}
