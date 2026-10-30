/**
 * #1797 회귀 가드 — 월뷰 view-harness/scroller 높이·position 재정의 금지(셀 0 높이 붕괴)
 */
const fs = require('fs');
const path = require('path');

const css = fs.readFileSync(path.join(__dirname, '..', 'ConsultantScheduleSuite.css'), 'utf8');

describe('consultant month view harness', () => {
  it('fc-view-harness·fc-scroller 높이 강제 auto 없음', () => {
    expect(css).not.toMatch(/fc-view-harness[^{]*\{[^}]*height:\s*auto/);
    expect(css).not.toMatch(/fc-scroller[^{]*\{[^}]*height:\s*auto/);
    expect(css).not.toMatch(/fc-dayGridMonth-view\s*\{[^}]*position:\s*relative/);
  });
});
