/**
 * 상담사 웹 태블릿 P0 — schedule 밀도 · journal sticky save · #1769 축
 */
import fs from 'fs';
import path from 'path';

const read = (rel) => fs.readFileSync(path.resolve(__dirname, '../../..', rel), 'utf8');

describe('Consultant tablet P0 CSS', () => {
  const schedule = read('components/consultant/ConsultantScheduleSuite.css');
  const journal = read('components/consultant/ConsultationLogModal.css');
  const mobileLayout = read('components/dashboard-v2/templates/MobileLayout.css');

  it('스케줄 태블릿 밀도: ellipsis · min-width:0 · now-indicator 유지', () => {
    expect(schedule).toMatch(/@media \(min-width: 768px\) and \(max-width: 1023px\)/);
    expect(schedule).toMatch(/text-overflow:\s*ellipsis/);
    expect(schedule).toMatch(/fc-now-indicator-line/);
  });

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
});
