/**
 * TabletRegister — password field mobile layout 회귀 격리 테스트.
 *
 * <p>비밀번호 표시 토글이 MGButton 대신 plain {@code button} + {@code mg-v2-password-toggle}
 * 를 사용하고, AuthPageCommon.css 에 토글 여백·터치 높이 규칙이 존재하는지 정적 계약을 검증한다.</p>
 *
 * @author CoreSolution
 * @since 2026-08-27
 */

describe('TabletRegister 정적 계약 — password field mobile layout', () => {
  const fs = require('fs');
  const path = require('path');

  const jsSource = fs.readFileSync(
    path.resolve(__dirname, '..', 'TabletRegister.js'),
    'utf8'
  );

  const cssSource = fs.readFileSync(
    path.resolve(__dirname, '..', 'AuthPageCommon.css'),
    'utf8'
  );

  test('each password wrapper uses plain button with mg-v2-password-toggle (not MGButton).', () => {
    const wrapperSections = [
      ...jsSource.matchAll(/<div className="mg-v2-password-wrapper">([\s\S]*?)<\/div>/g)
    ];
    expect(wrapperSections.length).toBeGreaterThanOrEqual(2);
    wrapperSections.forEach((match) => {
      expect(match[1]).toMatch(
        /<button[\s\S]*?className="mg-v2-password-toggle"[\s\S]*?<\/button>/
      );
      expect(match[1]).not.toMatch(/<MGButton/);
    });
  });

  test('AuthPageCommon.css contains padding-right rule for password input.', () => {
    expect(cssSource).toMatch(
      /\.mg-v2-auth-container\s+\.mg-v2-password-wrapper\s+\.mg-v2-form-input[\s\S]*?padding-right:\s*48px/
    );
  });

  test('AuthPageCommon.css auth inputs use auto height and touch-friendly min-height.', () => {
    expect(cssSource).toMatch(
      /\.mg-v2-auth-container\s+\.mg-v2-form-input\s*\{[\s\S]*?height:\s*auto;[\s\S]*?min-height:\s*44px;/
    );
    expect(cssSource).toMatch(
      /\.mg-v2-auth-container\s+\.mg-v2-form-input\s*\{[\s\S]*?padding-top:\s*11px;[\s\S]*?padding-bottom:\s*11px;/
    );
  });
});
