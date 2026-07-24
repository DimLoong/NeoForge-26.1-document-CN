// 侧边栏顶部的版本选择器（自定义下拉，风格与站点一致，替代原生 select）。
// 仅在存在多个版本的文档插件（主文档）中显示；单版本插件不显示。
import React, {useCallback, useEffect, useRef, useState} from 'react';
import {useHistory} from '@docusaurus/router';
import {
  useActivePluginAndVersion,
  useVersions,
} from '@docusaurus/plugin-content-docs/client';
import styles from './styles.module.css';

function Chevron({open}: {open: boolean}) {
  return (
    <svg
      className={styles.chevron}
      data-open={open ? 'true' : 'false'}
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

export default function SidebarVersionSelector(): JSX.Element | null {
  const history = useHistory();
  const active = useActivePluginAndVersion({failfast: false});
  const pluginId = active?.activePlugin?.pluginId ?? 'default';
  // 按 rules-of-hooks 无条件调用；'default' 插件始终存在，安全兜底。
  const versions = useVersions(pluginId);
  const currentVersion = active?.activeVersion;

  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) close();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open, close]);

  if (!currentVersion || versions.length <= 1) {
    return null;
  }

  const goToVersion = (name: string) => {
    close();
    if (name === currentVersion.name) return;
    const target = versions.find((v) => v.name === name);
    if (!target) return;
    const mainDoc =
      target.docs.find((d) => d.id === target.mainDocId) ?? target.docs[0];
    if (mainDoc) history.push(mainDoc.path);
  };

  return (
    <div className={styles.wrapper} ref={wrapperRef}>
      <span className={styles.label}>文档版本</span>
      <button
        type="button"
        className={styles.trigger}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}>
        <span className={styles.current}>{currentVersion.label}</span>
        <Chevron open={open} />
      </button>

      {open && (
        <ul className={styles.menu} role="listbox" aria-label="选择文档版本">
          {versions.map((v) => {
            const activeItem = v.name === currentVersion.name;
            return (
              <li key={v.name}>
                <button
                  type="button"
                  role="option"
                  aria-selected={activeItem}
                  className={styles.option}
                  data-active={activeItem ? 'true' : 'false'}
                  onClick={() => goToVersion(v.name)}>
                  <span>{v.label}</span>
                  {activeItem && (
                    <svg
                      className={styles.check}
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
