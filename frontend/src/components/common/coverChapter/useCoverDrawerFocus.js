/**
 * 커버 ☰ 드로어 공통 접근성 훅 — 내담자 CoverMenuDrawer · 상담사 MobileLnbDrawer(soft-sheet) 공용 SSOT.
 * 열림: 첫 포커스 가능 항목으로 이동 · Tab 트랩 · Esc 닫기
 * 닫힘: 연 버튼(☰)으로 포커스 복귀 (activeElement가 없으면 returnFocusSelector)
 *
 * @author CoreSolution
 * @since 2026-10-30
 */

import { useEffect, useRef } from 'react';

export const COVER_DRAWER_FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

const isFocusableTarget = (el) => (
  el
  && typeof el.focus === 'function'
  && el !== document.body
  && el.isConnected !== false
);

/**
 * @param {object} params
 * @param {boolean} params.isOpen
 * @param {{current: HTMLElement|null}} params.panelRef
 * @param {() => void} params.onClose
 * @param {string} [params.returnFocusSelector] - ☰ 버튼 셀렉터(클릭 시 포커스가 안 잡히는 브라우저 대비)
 */
const useCoverDrawerFocus = ({ isOpen, panelRef, onClose, returnFocusSelector }) => {
  const returnFocusRef = useRef(null);
  const wasOpenRef = useRef(false);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (typeof document === 'undefined') {
      return undefined;
    }
    if (isOpen) {
      wasOpenRef.current = true;
      const active = document.activeElement;
      const panel = panelRef.current;
      returnFocusRef.current = isFocusableTarget(active) && !(panel && panel.contains(active))
        ? active
        : null;
      const first = panel?.querySelector(COVER_DRAWER_FOCUSABLE_SELECTOR);
      if (first && typeof first.focus === 'function') {
        first.focus();
      }
      const onKeyDown = (e) => {
        if (e.key === 'Escape') {
          e.preventDefault();
          onCloseRef.current?.();
          return;
        }
        if (e.key !== 'Tab' || !panelRef.current) {
          return;
        }
        const nodes = Array.from(panelRef.current.querySelectorAll(COVER_DRAWER_FOCUSABLE_SELECTOR));
        if (nodes.length === 0) {
          return;
        }
        const head = nodes[0];
        const tail = nodes[nodes.length - 1];
        const inside = panelRef.current.contains(document.activeElement);
        if (e.shiftKey && (document.activeElement === head || !inside)) {
          e.preventDefault();
          tail.focus();
        } else if (!e.shiftKey && (document.activeElement === tail || !inside)) {
          e.preventDefault();
          head.focus();
        }
      };
      document.addEventListener('keydown', onKeyDown);
      return () => document.removeEventListener('keydown', onKeyDown);
    }
    if (wasOpenRef.current) {
      wasOpenRef.current = false;
      let target = returnFocusRef.current;
      returnFocusRef.current = null;
      if (!isFocusableTarget(target) && returnFocusSelector) {
        target = document.querySelector(returnFocusSelector);
      }
      if (isFocusableTarget(target)) {
        target.focus();
      }
    }
    return undefined;
  }, [isOpen, panelRef, returnFocusSelector]);
};

export default useCoverDrawerFocus;
