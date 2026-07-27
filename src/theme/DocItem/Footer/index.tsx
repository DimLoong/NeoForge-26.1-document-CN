// 在文档页正文页脚（标签、上一页/下一页等）之后追加评论区。
import React from 'react';
import Footer from '@theme-original/DocItem/Footer';
import type FooterType from '@theme/DocItem/Footer';
import type {WrapperProps} from '@docusaurus/types';
import Comments from '@site/src/components/Comments';

type Props = WrapperProps<typeof FooterType>;

export default function FooterWrapper(props: Props): JSX.Element {
  return (
    <>
      <Footer {...props} />
      <Comments />
    </>
  );
}
