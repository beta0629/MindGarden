/**
 * 상담일지 대시보드 모달·전체화면 라우트 공통 chrome 토큰 계약과 내담자 요약 라벨 한 줄 유지 계약.
 */
import fs from 'fs';
import path from 'path';

const readSrc = (relativePath) => fs.readFileSync(path.resolve(__dirname, '../../..', relativePath), 'utf8');

const extractBlock = (css, selector) => {
  const start = css.indexOf(`${selector} {`);
  if (start < 0) return null;
  return css.slice(start, css.indexOf('}', start) + 1);
};

const LITERAL_PATTERN = /#[0-9a-fA-F]{3,8}\b|\b\d+(\.\d+)?px\b/;

describe('ConsultationLogModal chrome tokens', () => {
  const css = readSrc('components/consultant/ConsultationLogModal.css');

  it('필드·섹션 chrome 토큰은 모달 루트 한 곳에서 디자인 토큰으로만 정의된다', () => {
    const root = extractBlock(css, '.mg-modal.mg-v2-clinic-os');
    expect(root).not.toBeNull();
    [
      '--mg-v2-consultation-log-field-radius: var(--mg-v2-radius-md)',
      '--mg-v2-consultation-log-field-border-color: var(--mg-v2-color-border-default)',
      '--mg-v2-consultation-log-field-bg: var(--mg-v2-color-surface-card)',
      '--mg-v2-consultation-log-section-radius: var(--mg-v2-radius-lg)',
      '--mg-v2-consultation-log-section-bg: var(--mg-v2-color-surface-card)'
    ].forEach((decl) => expect(root).toContain(decl));
    expect(root).not.toMatch(LITERAL_PATTERN);
  });

  it('입력·textarea·select 는 필드 토큰만 참조한다', () => {
    const block = extractBlock(css, '.mg-v2-clinic-os .mg-v2-consultation-log-modal textarea');
    expect(block).toMatch(/border-radius:\s*var\(--mg-v2-consultation-log-field-radius\)/);
    expect(block).toMatch(/border:\s*var\(--mg-v2-consultation-log-field-border-width\) solid var\(--mg-v2-consultation-log-field-border-color\)/);
    expect(block).toMatch(/background:\s*var\(--mg-v2-consultation-log-field-bg\)/);
    expect(block).not.toMatch(LITERAL_PATTERN);
  });

  it('섹션 카드·섹션 헤더는 섹션 토큰만 참조한다', () => {
    const superblock = extractBlock(css, '.mg-v2-clinic-os .mg-v2-consultation-log__content-superblock');
    expect(superblock).toMatch(/border-radius:\s*var\(--mg-v2-consultation-log-section-radius\)/);
    expect(superblock).toMatch(/background:\s*var\(--mg-v2-consultation-log-section-bg\)/);

    const heading = extractBlock(css, '.mg-v2-clinic-os .mg-v2-consultation-log__section-heading');
    expect(heading).toMatch(/background:\s*var\(--mg-v2-consultation-log-section-header-bg\)/);
    expect(heading).not.toMatch(LITERAL_PATTERN);

    const accordionHeader = extractBlock(
      css,
      '.mg-v2-clinic-os .mg-v2-consultation-log-modal__client-profile-panel .mg-accordion-header.mg-button'
    );
    expect(accordionHeader).toMatch(/background:\s*var\(--mg-v2-consultation-log-section-header-bg\)/);
  });

  it('전체화면 라우트는 별도 스타일 없이 같은 공용 모달을 렌더한다', () => {
    const screen = readSrc('components/consultant/ConsultationRecordScreen.js');
    expect(screen).toMatch(/import ConsultationLogModal from '\.\/ConsultationLogModal'/);
    expect(screen).not.toMatch(/import '\.[^']*\.css'/);
  });
});

describe('mg-v2-detail 라벨 한 줄 유지', () => {
  const tokens = readSrc('styles/unified-design-tokens.css');

  it('라벨은 줄바꿈·축소하지 않고 긴 값만 줄바꿈한다', () => {
    const label = extractBlock(tokens, '.mg-v2-detail-label');
    expect(label).toMatch(/white-space:\s*nowrap/);
    expect(label).toMatch(/flex-shrink:\s*0/);
    const value = extractBlock(tokens, '.mg-v2-detail-value');
    expect(value).toMatch(/min-width:\s*0/);
    expect(value).toMatch(/overflow-wrap:\s*anywhere/);
  });
});
