/**
 * SCT 공개·관리 CSS — 어두운 배경 위 제목 color 명시 가드.
 *
 * 배경 (PR #1965 F1):
 *  - `.mg-v2-sct-lp-h`에 color 없으면 전역 h1 `rgb(31,41,55)`가
 *    cover `neutral-900`(`#0F172A`) 위에 적용 → 대비 ≈1.22:1 (실패).
 *  - after: `color: var(--mg-v2-color-text-inverse)` (`#FFFFFF`) on
 *    `neutral-900` → 대비 ≈17.85:1.
 *  - cover__h 는 #1963에서 동일 패턴으로 고정됨.
 *
 * 범위: sctPublicLanding.css / sctPublic.css / sctAdmin.css
 *
 * @author MindGarden
 * @since 2026-11-27
 */

const fs = require('fs');
const path = require('path');

const SCT_CSS_FILES = [
  path.join(__dirname, '..', 'sctPublicLanding.css'),
  path.join(__dirname, '..', 'sctPublic.css'),
  path.join(__dirname, '..', '..', '..', 'admin', 'sct', 'sctAdmin.css')
];

/** 어두운 커버/헤로 배경으로 쓰는 토큰 */
const DARK_BG_TOKENS = [
  '--mg-v2-color-neutral-900',
  '--mg-v2-color-text-primary'
];

/** 대비용 밝은 텍스트 토큰 (text-inverse 또는 동등) */
const INVERSE_TEXT_TOKENS = [
  '--mg-v2-color-text-inverse',
  '--mg-v2-color-neutral-50',
  '--mg-v2-color-neutral-100'
];

/** 제목 역할 클래스 (h1~h3 / __h / -h / 명시 SCT 제목) */
const HEADING_SELECTORS = [
  '.mg-v2-sct-lp-h',
  '.mg-v2-sct-cover__h',
  '.mg-v2-sct-h1'
];

/**
 * 단순 CSS 규칙 블록 추출: `.selector { ... }` (중첩 @media 내부 포함).
 * @param {string} css
 * @param {string} selector
 * @returns {string[]}
 */
function extractRuleBodies(css, selector) {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp(`${escaped}\\s*\\{([^}]*)\\}`, 'g');
  const bodies = [];
  let match = re.exec(css);
  while (match) {
    bodies.push(match[1]);
    match = re.exec(css);
  }
  return bodies;
}

/**
 * 규칙 본문에서 color: var(--mg-v2-*) 선언 추출.
 * @param {string} body
 * @returns {string|null}
 */
function extractColorToken(body) {
  const m = body.match(/color\s*:\s*var\(\s*(--mg-v2-[a-z0-9-]+)\s*\)/i);
  return m ? m[1] : null;
}

/**
 * 파일에 어두운 배경 토큰이 선언돼 있는지.
 * @param {string} css
 * @returns {boolean}
 */
function hasDarkBackground(css) {
  return DARK_BG_TOKENS.some((token) => {
    const re = new RegExp(
      `background(?:-color)?\\s*:\\s*var\\(\\s*${token.replace(/-/g, '\\-')}\\s*\\)`,
      'i'
    );
    return re.test(css);
  });
}

describe('SCT dark-heading color guard', () => {
  const cssByFile = SCT_CSS_FILES.map((filePath) => ({
    filePath,
    name: path.basename(filePath),
    css: fs.readFileSync(filePath, 'utf8')
  }));

  it('스캔 대상 SCT CSS 파일이 존재한다', () => {
    SCT_CSS_FILES.forEach((filePath) => {
      expect(fs.existsSync(filePath)).toBe(true);
    });
  });

  it('.mg-v2-sct-lp-h 는 text-inverse(또는 동등) color를 명시한다 (≈17.85:1)', () => {
    const landing = cssByFile.find((f) => f.name === 'sctPublicLanding.css');
    expect(landing).toBeTruthy();
    const bodies = extractRuleBodies(landing.css, '.mg-v2-sct-lp-h');
    expect(bodies.length).toBeGreaterThan(0);
    const withColor = bodies
      .map(extractColorToken)
      .filter((token) => token != null);
    expect(withColor.length).toBeGreaterThan(0);
    expect(
      withColor.every((token) => INVERSE_TEXT_TOKENS.includes(token))
    ).toBe(true);
  });

  it('.mg-v2-sct-cover__h 는 text-inverse(또는 동등) color를 명시한다', () => {
    const pub = cssByFile.find((f) => f.name === 'sctPublic.css');
    expect(pub).toBeTruthy();
    const bodies = extractRuleBodies(pub.css, '.mg-v2-sct-cover__h');
    expect(bodies.length).toBeGreaterThan(0);
    const withColor = bodies
      .map(extractColorToken)
      .filter((token) => token != null);
    expect(withColor.length).toBeGreaterThan(0);
    expect(
      withColor.every((token) => INVERSE_TEXT_TOKENS.includes(token))
    ).toBe(true);
  });

  it('어두운 배경이 있는 SCT CSS에서 제목 클래스는 color: var(--mg-v2-*)를 가진다', () => {
    cssByFile.forEach(({ name, css }) => {
      if (!hasDarkBackground(css)) {
        return;
      }
      HEADING_SELECTORS.forEach((selector) => {
        const bodies = extractRuleBodies(css, selector);
        if (bodies.length === 0) {
          return;
        }
        // 최소한 하나의 규칙 블록에 mg-v2 color 토큰이 있어야 함
        // (미디어쿼리 margin-only 오버라이드는 color 생략 가능)
        const tokens = bodies.map(extractColorToken).filter(Boolean);
        if (selector === '.mg-v2-sct-lp-h' || selector === '.mg-v2-sct-cover__h') {
          expect(tokens.length).toBeGreaterThan(0);
          expect(
            tokens.some((token) => INVERSE_TEXT_TOKENS.includes(token))
          ).toBe(true);
        } else if (tokens.length > 0) {
          expect(tokens.every((token) => token.startsWith('--mg-v2-'))).toBe(true);
        }
      });
      // 파일이 스캔됐음을 기록 (lint unused 방지)
      expect(name).toMatch(/sct/i);
    });
  });
});
