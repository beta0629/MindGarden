/**
 * #1798 검증 4 FAIL 가드 — ☰ x 토큰 · availability 빈 상태 채움 · 주간 종일 행 min-height · 일지 칩 role
 */
const fs = require('fs');
const path = require('path');

const read = (...p) => fs.readFileSync(path.join(__dirname, '..', ...p), 'utf8');

describe('#1798 FAIL guards', () => {
  it('상담사 soft-sheet GNB edge-pad = subpage pad-x 토큰', () => {
    const css = read('..', 'dashboard-v2', 'templates', 'MobileLayout.css');
    expect(css).toMatch(/\.mg-v2-mobile-layout--soft-sheet\s*\{[^}]*--mg-v2-mobile-gnb-edge-pad:\s*var\(--mg-v2-subpage-pad-x\)/);
  });
  it('빈 상태 단독 패널은 flex column + 빈 상태 flex-grow', () => {
    const css = read('suite', 'ConsultantSuite.css');
    expect(css).toMatch(/consultant-suite__panel:has\(> \.consultant-suite-empty:only-child\)\s*\{[^}]*flex-direction:\s*column/);
    expect(css).toMatch(/consultant-suite-empty:only-child\s*\{[^}]*flex:\s*1 1 auto/);
  });
  it('timeGrid 종일 행 frame min-height 0', () => {
    expect(read('ConsultantScheduleSuite.css')).toMatch(/\.fc-timegrid \.fc-daygrid-day \.fc-daygrid-day-frame\s*\{[^}]*min-height:\s*0/);
  });
  it('일지 상태 칩(aria-pressed 버튼) 컨테이너는 tablist 아님', () => {
    const js = read('journal-tablet', 'ConsultantJournalTabletList.js');
    expect(js).not.toMatch(/role="tablist"/);
  });
});
