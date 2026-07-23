// 包裹整个应用的 Root 组件。Docusaurus 会在所有页面之上渲染 Root，
// 且在客户端导航时保持挂载，因此适合放置全局阅读进度逻辑。
import React from 'react';
import BrowserOnly from '@docusaurus/BrowserOnly';
import ReadingProgress from '@site/src/components/ReadingProgress';

export default function Root({children}: {children: React.ReactNode}): JSX.Element {
  return (
    <>
      {/* 仅客户端挂载：内部所有 DOM / localStorage 访问都在 useEffect 中。 */}
      <BrowserOnly>{() => <ReadingProgress />}</BrowserOnly>
      {children}
    </>
  );
}
