// 注册自定义 navbar item 类型：'custom-continueReading'。
// 在 docusaurus.config.js 的 navbar.items 中通过该 type 引用。
import ComponentTypes from '@theme-original/NavbarItem/ComponentTypes';
import ContinueReading from '@site/src/components/ReadingProgress/ContinueReading';

export default {
  ...ComponentTypes,
  'custom-continueReading': ContinueReading,
};
