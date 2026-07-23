// 全局阅读进度逻辑，挂载于 src/theme/Root，跨页面导航持续存在。
// 职责：
//   1. 顶部低调阅读进度条（随滚动更新）；
//   2. 节流写入 localStorage；
//   3. 恢复阅读位置（无 hash 时恢复 scrollY，有 hash 时优先锚点）；
//   4. 持久化并恢复左侧边栏滚动位置；
//   5. 为左侧边栏已读/在读页面添加低调状态标记。
// 全程 SSR 安全：所有 DOM / storage 访问都在 useEffect（仅客户端）内进行。

import React, {useCallback, useEffect, useRef, useState} from 'react';
import {useLocation} from '@docusaurus/router';
import {
  COMPLETION_THRESHOLD,
  getDocumentProgress,
  getSidebarScroll,
  readDocuments,
  saveDocumentProgress,
  saveSidebarScroll,
} from './storage';
import styles from './styles.module.css';

const WRITE_THROTTLE_MS = 300;

/** 从 pathname 猜测文档版本标签（尽力而为，用于展示）。 */
function detectVersion(pathname: string): string {
  const m = pathname.match(/\/(1\.\d+(?:\.\d+)?)(?:\/|$)/);
  return m ? m[1] : '26.1';
}

/** 读取当前页面标题（去掉站点后缀）。 */
function currentTitle(): string {
  if (typeof document === 'undefined') return '';
  const h1 = document.querySelector('article h1, header h1, h1');
  if (h1 && h1.textContent) return h1.textContent.trim();
  return document.title.replace(/\s*\|.*$/, '').trim();
}

function computeProgress(): {scrollY: number; progress: number} {
  const el = document.documentElement;
  const scrollY = window.scrollY || el.scrollTop || 0;
  const max = el.scrollHeight - window.innerHeight;
  const progress = max > 8 ? Math.min(1, Math.max(0, scrollY / max)) : 1;
  return {scrollY, progress};
}

export default function ReadingProgress(): JSX.Element {
  const location = useLocation();
  const {pathname, hash} = location;
  const [progress, setProgress] = useState(0);

  const writeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latest = useRef<{scrollY: number; progress: number}>({scrollY: 0, progress: 0});

  // 将最新进度写入 storage（节流）。
  const flush = useCallback(() => {
    const {scrollY, progress: p} = latest.current;
    saveDocumentProgress({
      pathname,
      version: detectVersion(pathname),
      scrollY,
      progress: p,
      completed: p >= COMPLETION_THRESHOLD,
      lastReadAt: Date.now(),
      title: currentTitle(),
    });
  }, [pathname]);

  // 滚动监听 + 进度条更新 + 节流写入。
  useEffect(() => {
    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = window.requestAnimationFrame(() => {
        raf = 0;
        const next = computeProgress();
        latest.current = next;
        setProgress(next.progress);
        if (!writeTimer.current) {
          writeTimer.current = setTimeout(() => {
            writeTimer.current = null;
            flush();
          }, WRITE_THROTTLE_MS);
        }
      });
    };

    // 初始化一次当前进度。
    const init = computeProgress();
    latest.current = init;
    setProgress(init.progress);

    window.addEventListener('scroll', onScroll, {passive: true});
    window.addEventListener('resize', onScroll, {passive: true});
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (raf) cancelAnimationFrame(raf);
      if (writeTimer.current) {
        clearTimeout(writeTimer.current);
        writeTimer.current = null;
        flush(); // 离开页面前落盘一次。
      }
    };
  }, [pathname, flush]);

  // 恢复阅读位置：有 hash 优先锚点，无 hash 恢复 scrollY。
  useEffect(() => {
    if (hash) return; // 交由 Docusaurus 处理锚点跳转。
    const saved = getDocumentProgress(pathname);
    if (!saved || !saved.scrollY || saved.scrollY < 40) return;

    let cancelled = false;
    let userScrolled = false;
    const markUser = () => {
      userScrolled = true;
    };
    window.addEventListener('wheel', markUser, {passive: true, once: true});
    window.addEventListener('touchmove', markUser, {passive: true, once: true});
    window.addEventListener('keydown', markUser, {once: true});

    // 等待内容渲染完成后再恢复（两帧 + 兜底 timeout）。
    let frame = 0;
    let tries = 0;
    const tryRestore = () => {
      if (cancelled || userScrolled) return cleanup();
      const el = document.documentElement;
      const reachable = el.scrollHeight - window.innerHeight;
      if (reachable >= saved.scrollY - 4 || tries > 20) {
        window.scrollTo(0, saved.scrollY);
        return cleanup();
      }
      tries += 1;
      frame = window.requestAnimationFrame(tryRestore);
    };
    frame = window.requestAnimationFrame(() =>
      window.requestAnimationFrame(tryRestore),
    );

    function cleanup() {
      cancelled = true;
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener('wheel', markUser);
      window.removeEventListener('touchmove', markUser);
      window.removeEventListener('keydown', markUser);
    }
    return cleanup;
  }, [pathname, hash]);

  // 侧边栏滚动位置持久化与恢复。
  useEffect(() => {
    const sidebar = document.querySelector<HTMLElement>(
      '.theme-doc-sidebar-container .menu.thin-scrollbar, .theme-doc-sidebar-menu',
    );
    if (!sidebar) return;

    const saved = getSidebarScroll();
    if (saved != null) {
      requestAnimationFrame(() => {
        sidebar.scrollTop = saved;
      });
    }

    let timer: ReturnType<typeof setTimeout> | null = null;
    const onScroll = () => {
      if (timer) return;
      timer = setTimeout(() => {
        timer = null;
        saveSidebarScroll(sidebar.scrollTop);
      }, WRITE_THROTTLE_MS);
    };
    sidebar.addEventListener('scroll', onScroll, {passive: true});
    return () => {
      sidebar.removeEventListener('scroll', onScroll);
      if (timer) clearTimeout(timer);
    };
  }, [pathname]);

  // 为左侧边栏链接添加已读/在读状态标记（低调、纯附加）。
  useEffect(() => {
    let frame = window.requestAnimationFrame(() => {
      try {
        const docs = readDocuments();
        const links = document.querySelectorAll<HTMLAnchorElement>('.menu__link[href]');
        links.forEach((link) => {
          const href = link.getAttribute('href') || '';
          const path = href.split('#')[0].replace(/\/$/, '');
          const entry =
            docs[path] || docs[`${path}/`] || docs[href] || docs[href.replace(/\/$/, '')];
          if (!entry) {
            link.removeAttribute('data-reading-status');
            return;
          }
          link.setAttribute(
            'data-reading-status',
            entry.completed ? 'completed' : entry.progress > 0.02 ? 'reading' : '',
          );
        });
      } catch {
        /* 忽略：标记为纯增强，失败不影响功能 */
      }
    });
    return () => cancelAnimationFrame(frame);
  }, [pathname, progress]);

  return (
    <div
      className={styles.progressBar}
      style={{transform: `scaleX(${progress})`}}
      role="progressbar"
      aria-label="页面阅读进度"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(progress * 100)}
    />
  );
}
