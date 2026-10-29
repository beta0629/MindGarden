/**
 * 상담사 웹 태블릿 — 셸 overlay 게이트 · 일지 sticky · soft-sheet
 * (스케줄 밀도 assertion 없음 — /consultant/schedule OUT OF SCOPE)
 */
import fs from 'fs';
import path from 'path';

const read = (rel) => fs.readFileSync(path.resolve(__dirname, '../../..', rel), 'utf8');

describe('Consultant tablet shell + journal CSS contracts', () => {
  const journal = read('components/consultant/ConsultationLogModal.css');
  const mobileLayout = read('components/dashboard-v2/templates/MobileLayout.css');
  const drawer = read('components/dashboard-v2/organisms/MobileLnbDrawer.css');
  const tabletList = read('components/consultant/journal-tablet/ConsultantJournalTabletList.css');
  const tabletDetail = read('components/consultant/journal-tablet/ConsultantJournalTabletDetail.css');
  const schedule = read('components/consultant/ConsultantScheduleSuite.css');

  it('일지 actions sticky + safe-area-inset-bottom', () => {
    expect(journal).toMatch(/\.mg-modal__actions[\s\S]*position:\s*sticky/);
    expect(journal).toMatch(/env\(safe-area-inset-bottom/);
    expect(journal).toMatch(/orientation: landscape\) and \(min-width: 768px\) and \(max-width: 1023px\)/);
  });

  it('soft-sheet stage는 100dvh 셸·safe-area 패딩·push 금지(margin-left:0)', () => {
    expect(mobileLayout).toMatch(/min-height:\s*100dvh/);
    expect(mobileLayout).toMatch(/mg-v2-mobile-layout--soft-sheet/);
    expect(mobileLayout).toMatch(/env\(safe-area-inset-left/);
    expect(mobileLayout).toMatch(/env\(safe-area-inset-bottom/);
    expect(mobileLayout).toMatch(
      /\.mg-v2-mobile-layout--soft-sheet[\s\S]*?\.mg-v2-mobile-layout__main[\s\S]*?margin-left:\s*0/
    );
    // push-layout 클래스 규칙 없음 (주석 제외: drawer-open 선택자 미사용)
    expect(mobileLayout).not.toMatch(/\.[\w-]*drawer-open[\w-]*\s*\{/);
    expect(mobileLayout).not.toMatch(/margin-left:\s*\d+px/);
    expect(mobileLayout).not.toMatch(/margin-left:\s*var\(--mg-layout-sidebar/);
  });

  it('soft-sheet drawer/overlay는 position:fixed (push 아님)', () => {
    expect(drawer).toMatch(/\.mg-v2-mobile-lnb-overlay\s*\{[^}]*position:\s*fixed/);
    expect(drawer).toMatch(/\.mg-v2-mobile-lnb-drawer\s*\{[^}]*position:\s*fixed/);
    expect(drawer).toMatch(/transform:\s*translateX\(-100%\)/);
  });

  it('일지 목록 터치 행 min-height≥56 축 · 말줄임', () => {
    expect(tabletList).toMatch(/consultant-journal-tablet__row/);
    expect(tabletList).toMatch(/min-height:\s*calc\(var\(--mg-v2-touch-target-min\)/);
    expect(tabletList).toMatch(/text-overflow:\s*ellipsis/);
    expect(tabletList).not.toMatch(/#[0-9a-fA-F]{3,8}/);
  });

  it('일지 상세 stone read-out · ghost actions · safe-area bottom', () => {
    expect(tabletDetail).toMatch(/surface-stone/);
    expect(tabletDetail).toMatch(/consultant-journal-tablet-detail__actions/);
    expect(tabletDetail).toMatch(/env\(safe-area-inset-bottom/);
    expect(tabletDetail).toMatch(/btn--list/);
    expect(tabletDetail).toMatch(/btn--edit/);
    expect(tabletDetail).not.toMatch(/#[0-9a-fA-F]{3,8}/);
  });

  it('스케줄 밀도 태블릿 미디어쿼리가 없다(일정 OUT OF SCOPE)', () => {
    expect(schedule).not.toMatch(/@media \(min-width: 768px\) and \(max-width: 1023px\)/);
  });
});
