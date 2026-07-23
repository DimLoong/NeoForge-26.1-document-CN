// “继续阅读”导航栏入口：展示最后阅读的文档与进度，点击回到上次位置；
// 内含“清除阅读记录”（二次确认，仅删除本项目键）。
// 作为自定义 navbar item 注册（见 src/theme/NavbarItem/ComponentTypes）。

import React, {useCallback, useEffect, useRef, useState} from 'react';
import Link from '@docusaurus/Link';
import BrowserOnly from '@docusaurus/BrowserOnly';
import {
  KEY_DOCUMENTS,
  KEY_LAST_DOCUMENT,
  clearAllReadingData,
  getLastDocument,
} from './storage';
import type {DocumentProgress} from './types';
import styles from './styles.module.css';

function BookmarkIcon() {
  return (
    <svg
      className={styles.continueIcon}
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true">
      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
    </svg>
  );
}

function ContinueReadingInner() {
  const [last, setLast] = useState<DocumentProgress | undefined>(undefined);
  const [open, setOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const refresh = useCallback(() => {
    setLast(getLastDocument());
  }, []);

  useEffect(() => {
    refresh();
    // 多标签页同步：其他标签更新进度时刷新。
    const onStorage = (e: StorageEvent) => {
      if (e.key === KEY_DOCUMENTS || e.key === KEY_LAST_DOCUMENT || e.key === null) {
        refresh();
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [refresh]);

  // 打开面板时刷新一次，并绑定外部点击关闭。
  useEffect(() => {
    if (!open) return;
    refresh();
    const onClick = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
        setConfirming(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        setConfirming(false);
      }
    };
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open, refresh]);

  const percent = last ? Math.round((last.progress || 0) * 100) : 0;
  const hasHistory = Boolean(last && last.pathname);

  const handleReset = () => {
    clearAllReadingData();
    setLast(undefined);
    setConfirming(false);
    setOpen(false);
  };

  // 从未阅读：提供“开始阅读”入口。
  if (!hasHistory) {
    return (
      <div className={styles.continueWrapper} ref={wrapperRef}>
        <Link className={styles.continueButton} to="/docs/gettingstarted/">
          <BookmarkIcon />
          <span className={styles.continueLabel}>开始阅读</span>
        </Link>
      </div>
    );
  }

  return (
    <div className={styles.continueWrapper} ref={wrapperRef}>
      <button
        type="button"
        className={styles.continueButton}
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="true"
        aria-expanded={open}>
        <BookmarkIcon />
        <span className={styles.continueLabel}>{last!.title || '继续阅读'}</span>
        <span className={styles.continuePercent}>{percent}%</span>
      </button>

      {open && (
        <div className={styles.popover} role="dialog" aria-label="继续阅读">
          <div className={styles.popoverTitle}>继续阅读</div>
          <div className={styles.popoverDocTitle}>{last!.title || last!.pathname}</div>
          <div className={styles.popoverMeta}>
            <div className={styles.miniBar}>
              <div className={styles.miniBarFill} style={{width: `${percent}%`}} />
            </div>
            <span>{last!.completed ? '已读完' : `${percent}%`}</span>
          </div>
          <div className={styles.popoverActions}>
            <Link
              className={styles.popoverPrimary}
              to={last!.pathname}
              onClick={() => setOpen(false)}>
              回到上次位置
            </Link>
            <button
              type="button"
              className={styles.resetButton}
              onClick={() => setConfirming((v) => !v)}>
              清除记录
            </button>
          </div>
          {confirming && (
            <div className={styles.resetConfirm}>
              <div className={styles.resetConfirmText}>
                确定清除全部阅读进度？此操作只删除本阅读器的记录，不影响主题等其他设置。
              </div>
              <div className={styles.popoverActions}>
                <button
                  type="button"
                  className={styles.resetButton}
                  onClick={handleReset}>
                  确认清除
                </button>
                <button
                  type="button"
                  className={styles.popoverPrimary}
                  onClick={() => setConfirming(false)}>
                  取消
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function ContinueReading(): JSX.Element {
  // navbar 会在 SSR 阶段渲染，这里用 BrowserOnly 保证仅客户端读取 localStorage。
  return (
    <BrowserOnly fallback={<span />}>{() => <ContinueReadingInner />}</BrowserOnly>
  );
}
