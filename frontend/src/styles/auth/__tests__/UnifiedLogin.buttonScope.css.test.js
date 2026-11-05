/**
 * 회귀 가드: UnifiedLogin.css 의 .mg-v2-button-primary 규칙은 로그인 컨테이너 스코프여야 한다.
 * 전역으로 두면 MGButton primary(통계 시각화 토글·집계 기간·내담자 탭)에 width:100% 등이 누수된다.
 */
const fs = require('fs');
const path = require('path');

const css = fs.readFileSync(path.resolve(__dirname, '..', 'UnifiedLogin.css'), 'utf8')
  .replace(/\/\*[\s\S]*?\*\//g, '');

describe('UnifiedLogin.css — mg-v2-button-primary scope', () => {
  test('모든 .mg-v2-button-primary 셀렉터는 .mg-v2-login-container 하위', () => {
    const selectors = css.split('}').map((b) => b.split('{')[0]).join(',').split(',')
      .map((s) => s.trim()).filter((s) => s.includes('.mg-v2-button-primary'));
    expect(selectors.length).toBeGreaterThan(0);
    selectors.forEach((s) => expect(s.startsWith('.mg-v2-login-container ')).toBe(true));
  });
});
