/**
 * v2 GNB 드롭다운 패널의 position: fixed 위치 계산 (트리거 기준, 플립 지원)
 * ProfileDropdown, QuickActionsDropdown, NotificationDropdown에서 공통 사용
 *
 * @author CoreSolution
 * @since 2026-03-15
 */

import { useState, useLayoutEffect } from 'react';

const DEFAULT_OFFSET_Y = 8;
const DEFAULT_VIEWPORT_PADDING = 16;
const Z_INDEX_DROPDOWN = 'var(--z-dropdown)';

/** panelEl 없을 때 사용하는 기본 패널 너비 (트리거만 있을 때 fallback) */
const FALLBACK_PANEL_WIDTH = 280;
const FALLBACK_PANEL_HEIGHT = 240;

/**
 * 트리거 기준 패널 위치 계산 (뷰포트 아래/오른쪽 나가면 플립)
 * panelEl이 null이면 트리거만으로 기본 top/left 반환 (ref 타이밍 이슈 완화)
 * @param {HTMLElement} triggerEl
 * @param {HTMLElement|null} panelEl
 * @param {{ offsetY?: number, viewportPadding?: number }} options
 * @returns {React.CSSProperties}
 */
function computePanelStyle(triggerEl, panelEl, options = {}) {
  const style = { position: 'fixed', zIndex: Z_INDEX_DROPDOWN };
  if (!triggerEl) return style;

  const offsetY = options.offsetY ?? DEFAULT_OFFSET_Y;
  const pad = options.viewportPadding ?? DEFAULT_VIEWPORT_PADDING;
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const tr = triggerEl.getBoundingClientRect();
  const panelWidth = panelEl ? panelEl.getBoundingClientRect().width : FALLBACK_PANEL_WIDTH;
  const panelHeight = panelEl ? panelEl.getBoundingClientRect().height : FALLBACK_PANEL_HEIGHT;

  // 세로: 아래 우선, 공간 부족 시 위로 플립
  const spaceBelow = vh - tr.bottom - pad;
  const spaceAbove = tr.top - pad;
  if (spaceBelow >= panelHeight || spaceBelow >= spaceAbove) {
    style.top = tr.bottom + offsetY;
  } else {
    style.top = 'auto';
    style.bottom = vh - tr.top + offsetY;
  }

  // 가로: 패널 오른쪽을 트리거 오른쪽에 맞춤, 왼쪽 나가면 트리거 왼쪽에 맞춤
  const rightAlignLeft = tr.right - panelWidth;
  if (rightAlignLeft >= pad) {
    style.left = rightAlignLeft;
  } else if (tr.left + panelWidth <= vw - pad) {
    style.left = tr.left;
  } else {
    style.left = pad;
  }

  return style;
}

/**
 * v2 드롭다운 패널용 fixed 위치 훅
 * @param {React.RefObject<HTMLElement>} triggerRef - 트리거 버튼/영역 ref
 * @param {React.RefObject<HTMLElement>} panelRef - 패널 DOM ref
 * @param {boolean} isOpen - 열림 여부
 * @param {{ offsetY?: number, viewportPadding?: number }} options
 * @returns {React.CSSProperties} 패널에 적용할 style
 */
export function useDropdownPosition(triggerRef, panelRef, isOpen, options = {}) {
  const [panelStyle, setPanelStyle] = useState(() => ({
    position: 'fixed',
    zIndex: Z_INDEX_DROPDOWN
  }));

  useLayoutEffect(() => {
    if (!isOpen) return;

    const triggerEl = triggerRef?.current;
    const panelEl = panelRef?.current;
    if (!triggerEl) return;

    const onFrame = () => {
      const el = panelRef?.current ?? panelEl;
      const next = computePanelStyle(triggerEl, el, options);
      setPanelStyle(next);
    };

    requestAnimationFrame(onFrame);

    window.addEventListener('resize', onFrame);
    window.addEventListener('scroll', onFrame, true);

    return () => {
      window.removeEventListener('resize', onFrame);
      window.removeEventListener('scroll', onFrame, true);
    };
  }, [isOpen, triggerRef, panelRef, options.offsetY, options.viewportPadding]);

  return panelStyle;
}

export default useDropdownPosition;
