/**
 * UnifiedLogin — password field mobile layout 회귀 격리 테스트.
 *
 * <p>비밀번호 표시 토글이 MGButton 대신 plain {@code button} + {@code mg-v2-password-toggle}
 * 를 사용하고, CSS 에 토글 여백(padding-right) 규칙이 존재하는지 정적 계약을 검증한다.</p>
 *
 * @author CoreSolution
 * @since 2026-08-27
 */

describe('UnifiedLogin 정적 계약 — password field mobile layout', () => {
  const fs = require('fs');
  const path = require('path');

  const jsSource = fs.readFileSync(
    path.resolve(__dirname, '..', 'UnifiedLogin.js'),
    'utf8'
  );

  const cssSource = fs.readFileSync(
    path.resolve(__dirname, '../../../styles/auth/UnifiedLogin.css'),
    'utf8'
  );

  test('password toggle uses plain button with mg-v2-password-toggle (not MGButton).', () => {
    const wrapperSection = jsSource.match(
      /<div className="mg-v2-password-wrapper">([\s\S]*?)<\/div>/
    );
    expect(wrapperSection).not.toBeNull();
    expect(wrapperSection[1]).toMatch(
      /<button[\s\S]*?className="mg-v2-password-toggle"[\s\S]*?<\/button>/
    );
    expect(wrapperSection[1]).not.toMatch(/<MGButton/);
  });

  test('UnifiedLogin.css contains padding-right rule for password input.', () => {
    expect(cssSource).toMatch(/\.mg-v2-password-wrapper\s+\.mg-v2-input[\s\S]*?padding-right:\s*48px/);
  });
});
