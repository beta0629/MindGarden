/**
 * PR 1799 재검 가드 — 커버 홈 하단 빈영역·빈 흰 카드, availability 빈 상태 요일 카드 배치
 */
const fs = require('fs');
const path = require('path');

const read = (...p) => fs.readFileSync(path.join(__dirname, '..', '..', ...p), 'utf8');

describe('cover/empty fill guards', () => {
  it('내담자 커버: ≥90rem 챕터 1열 + 칼럼 시트 폭 + dense 행이 카드 높이 채움', () => {
    const css = read('client', 'clientDashboard', 'coverChapter', 'ClientCoverChapter.css');
    const tail = css.slice(css.lastIndexOf('@media (min-width: 90rem)'));
    expect(tail).toMatch(/\.client-cover__chapters\s*\{[^}]*display:\s*flex;[^}]*flex-direction:\s*column;[^}]*align-items:\s*stretch/);
    expect(css).toMatch(/\.client-cover \.client-cover__chapters\s*\{[^}]*width:\s*100%/);
    expect(css).toMatch(/\.client-cover__dense > \.client-cover__row\s*\{[^}]*flex:\s*1 1 auto/);
  });
  it('상담사 커버: dense 행이 카드 높이 채움', () => {
    const css = read('dashboard-v2', 'consultant', 'ConsultantCoverChapterHome.css');
    expect(css).toMatch(/\.consultant-cover-chapter__dense > \.consultant-cover-chapter__row\s*\{[^}]*flex:\s*1 1 auto/);
  });
  it('availability 빈 상태: 요일 카드 목록으로 본문 채움', () => {
    const js = read('consultant', 'ConsultantAvailability.js');
    expect(js).toMatch(/availability\.dayOverviewAria/);
    expect(js).toMatch(/DAYS_OF_WEEK\.map\(\(day\)/);
  });
});
