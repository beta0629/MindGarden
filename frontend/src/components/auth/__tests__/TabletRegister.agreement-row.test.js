/**
 * TabletRegister — agreement checkbox row layout 회귀 격리 테스트.
 *
 * <p>이용약관·개인정보 동의 행이 MGButton 대신 plain {@code button} + {@code mg-v2-link-button}
 * 를 사용하고, AuthPageCommon.css 에 checkbox-group row 레이아웃 규칙이 존재하는지
 * 정적 계약을 검증한다.</p>
 *
 * @author CoreSolution
 * @since 2026-08-27
 */

describe('TabletRegister 정적 계약 — agreement checkbox row layout', () => {
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

  test('each agreement checkbox group uses plain button with mg-v2-link-button (not MGButton).', () => {
    const checkboxGroups = [
      ...jsSource.matchAll(/<div className="mg-v2-checkbox-group">([\s\S]*?)<\/div>/g)
    ];
    expect(checkboxGroups.length).toBe(2);
    checkboxGroups.forEach((match) => {
      expect(match[1]).toMatch(
        /<button[\s\S]*?className="mg-v2-link-button"[\s\S]*?<\/button>/
      );
      expect(match[1]).not.toMatch(/<MGButton/);
    });
  });

  test('AuthPageCommon.css keeps checkbox-group as horizontal flex row.', () => {
    const scopedRow = /\.mg-v2-auth-container\s+\.mg-v2-checkbox-group\s*\{[\s\S]*?flex-direction:\s*row/;
    const baseRow = /\.mg-v2-checkbox-group\s*\{[\s\S]*?flex-direction:\s*row/;
    expect(scopedRow.test(cssSource) || baseRow.test(cssSource)).toBe(true);
  });
});
