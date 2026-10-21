/**
 * #1729 r2 게이트 — 오버레이 CSS · 390 chevron · 유틸·페이징 상수 스모크
 *
 * @author CoreSolution
 * @since 2026-10-21
 */

import fs from 'fs';
import path from 'path';
import { CLIENT_NOTIFICATION_LIST_PAGE_SIZE } from '../../../constants/pagedList';

const readCss = (...parts) => fs.readFileSync(path.resolve(__dirname, ...parts), 'utf8');

describe('issue #1729 r2 gate CSS/constants', () => {
  test('알림 모달 오버레이는 top:0 !important + color-mix background !important', () => {
    const css = readCss('..', 'UnifiedNotifications.css');
    expect(css).toMatch(
      /\.unified-notifications-modal\.mg-modal-overlay\s*\{[\s\S]*?top:\s*0\s*!important;/
    );
    expect(css).toMatch(
      /\.unified-notifications-modal\.mg-modal-overlay\s*\{[\s\S]*?background:\s*color-mix\([\s\S]*?\)\s*!important;/
    );
  });

  test('알림 모달 액션은 가로 flex · outline 닫기 · only-child 전체 폭', () => {
    const css = readCss('..', 'UnifiedNotifications.css');
    expect(css).toMatch(
      /\.unified-notifications-modal__actions\s*\{[\s\S]*?flex-direction:\s*row\s*!important;/
    );
    expect(css).toMatch(/\.mg-action-btn--outline\s*\{[\s\S]*?border:/);
    expect(css).toMatch(/\.mg-action-btn:only-child\s*\{[\s\S]*?width:\s*100%;/);
  });

  test('390 미디어에서 notif-card__chev 를 display:none 하지 않는다', () => {
    const css = readCss('..', 'NotificationListCard.css');
    const media = css.match(/@media\s*\(max-width:\s*480px\)\s*\{([\s\S]*?)\n\}/);
    expect(media).not.toBeNull();
    expect(media[1]).not.toMatch(/\.notif-card__chev\s*\{[\s\S]*?display:\s*none/);
  });

  test('MGPagination info-text 는 body-md + text-secondary', () => {
    const css = readCss('..', '..', 'common', 'MGPagination.css');
    expect(css).toMatch(
      /\.mg-pagination__info-text\s*\{[\s\S]*?font-size:\s*var\(--mg-v2-font-size-body-md\);[\s\S]*?color:\s*var\(--mg-v2-color-text-secondary\);/
    );
  });

  test('내담자 알림 목록 page size 는 6', () => {
    expect(CLIENT_NOTIFICATION_LIST_PAGE_SIZE).toBe(6);
  });
});
