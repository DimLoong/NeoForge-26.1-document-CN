// 在桌面端侧边栏的滚动容器内部、菜单列表之上加入版本选择器（Q4）。
// 包裹官方 Content 而非顶层 DocSidebar：确保选择器位于带 navbar 偏移的 sticky
// 容器 `.sidebar` 内部，不会跑到视窗顶部、也不会被 padding-top 截断。
import React from 'react';
import Content from '@theme-original/DocSidebar/Desktop/Content';
import type ContentType from '@theme/DocSidebar/Desktop/Content';
import type {WrapperProps} from '@docusaurus/types';
import SidebarVersionSelector from '@site/src/components/SidebarVersionSelector';

type Props = WrapperProps<typeof ContentType>;

export default function ContentWrapper(props: Props): JSX.Element {
  return (
    <>
      <SidebarVersionSelector />
      <Content {...props} />
    </>
  );
}
