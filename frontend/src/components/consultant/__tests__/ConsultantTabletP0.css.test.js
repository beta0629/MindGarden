/**
 * 상담사 웹 태블릿 — 셸 overlay · 일지 sticky (스케줄 밀도 검증 제거)
 * @see ConsultantTabletShellJournal.css.test.js
 */
import fs from 'fs';
import path from 'path';

const read = (rel) => fs.readFileSync(path.resolve(__dirname, '../../..', rel), 'utf8');

describe('Consultant tablet P0 CSS (shell + journal sticky only)', () => {
  const journal = read('components/consultant/ConsultationLogModal.css');
  const mobileLayout = read('components/dashboard-v2/templates/MobileLayout.css');
  const drawer = read('components/dashboard-v2/organisms/MobileLnbDrawer.css');

  it('일지 actions sticky + safe-area-inset-bottom', () => {
    expect(journal).toMatch(/\.mg-modal__actions[\s\S]*position:\s*sticky/);
    expect(journal).toMatch(/env\(safe-area-inset-bottom/);
    expect(journal).toMatch(/orientation: landscape\) and \(min-width: 768px\) and \(max-width: 1023px\)/);
  });

  it('soft-sheet stage는 100dvh 셸·safe-area 패딩을 유지한다', () => {
    expect(mobileLayout).toMatch(/min-height:\s*100dvh/);
    expect(mobileLayout).toMatch(/mg-v2-mobile-layout--soft-sheet/);
    expect(mobileLayout).toMatch(/env\(safe-area-inset-left/);
    expect(mobileLayout).toMatch(/env\(safe-area-inset-bottom/);
  });

  it('drawer/overlay는 position:fixed (본문 push 아님)', () => {
    expect(drawer).toMatch(/\.mg-v2-mobile-lnb-overlay\s*\{[^}]*position:\s*fixed/);
    expect(drawer).toMatch(/\.mg-v2-mobile-lnb-drawer\s*\{[^}]*position:\s*fixed/);
  });
});
