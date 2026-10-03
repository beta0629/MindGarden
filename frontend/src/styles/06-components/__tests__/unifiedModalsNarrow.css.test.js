/**
 * 390px 등 좁은 화면에서 대형 모달이 뷰포트 밖으로 밀리거나 헤더 닫기 버튼이 제목을 접지 않도록 하는 CSS 계약.
 */
import fs from 'fs';
import path from 'path';

const readCss = (relativePath) => fs.readFileSync(path.resolve(__dirname, relativePath), 'utf8');

const extractBlock = (css, selector) => {
  const start = css.indexOf(`${selector} {`);
  if (start < 0) return null;
  return css.slice(start, css.indexOf('}', start) + 1);
};

describe('unified modals narrow-screen contract', () => {
  const modalsCss = readCss('../_unified-modals.css');

  it('large 모달 min-width 는 vw 상한으로 묶여 max-width 를 넘지 않는다', () => {
    const blocks = modalsCss.split('}').filter((chunk) => /\n\.mg-modal\.mg-modal--large \{[^{]*min-width/.test(chunk));
    expect(blocks).toHaveLength(1);
    const [block] = blocks;
    expect(block).toMatch(/min-width:\s*min\(var\(--mg-v2-grid-container-md\),\s*92vw\)/);
    expect(block).not.toMatch(/min-width:\s*\d+px/);
  });

  it('헤더 닫기 버튼은 전역 .mg-button 100% 폭을 받지 않는다', () => {
    const closeBlock = extractBlock(modalsCss, '.mg-modal__header .mg-modal__close.mg-button');
    expect(closeBlock).toMatch(/width:\s*auto/);
    expect(closeBlock).toMatch(/flex:\s*0 0 auto/);
    const contentBlock = extractBlock(modalsCss, '.mg-modal__header .mg-modal__header-content');
    expect(contentBlock).toMatch(/min-width:\s*0/);
  });

  it('일정 상세 전용 min-width 덮어쓰기는 공통 규칙으로 흡수되어 남지 않는다', () => {
    const scheduleCss = readCss('../../../components/schedule/ScheduleB0KlA.css');
    expect(scheduleCss).not.toMatch(/\.mg-modal\.mg-modal--large\.schedule-detail-modal\s*\{/);
    const parties = extractBlock(scheduleCss, '.schedule-detail-modal__parties');
    expect(parties).toMatch(/flex-wrap:\s*wrap/);
  });
});
