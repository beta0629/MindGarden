/**
 * UnifiedLogin — 식별자 필드 힌트 클리핑 회귀 격리 테스트.
 *
 * <p>LOGIN_IDENTIFIER_FIELD_HINT SSOT 문구·마크업·CSS 래핑 규칙이
 * 중간 폭에서도 잘리지 않도록 유지되는지 정적 계약을 검증한다.</p>
 *
 * @author CoreSolution
 * @since 2026-09-08
 */

describe('UnifiedLogin 정적 계약 — identifier field hint', () => {
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

  const loginDisplaySource = fs.readFileSync(
    path.resolve(__dirname, '../../../constants/loginDisplay.js'),
    'utf8'
  );

  test('UnifiedLogin.js imports and uses identifier label/hint/placeholder with hint id.', () => {
    expect(jsSource).toMatch(/LOGIN_IDENTIFIER_FIELD_HINT/);
    expect(jsSource).toMatch(/LOGIN_IDENTIFIER_LABEL/);
    expect(jsSource).toMatch(/LOGIN_IDENTIFIER_PLACEHOLDER/);
    expect(jsSource).toMatch(/id="login-identifier-hint"/);
    expect(jsSource).toMatch(/\{LOGIN_IDENTIFIER_FIELD_HINT\}/);
    expect(jsSource).toMatch(/\{LOGIN_IDENTIFIER_LABEL\}/);
    expect(jsSource).toMatch(/placeholder=\{LOGIN_IDENTIFIER_PLACEHOLDER\}/);
  });

  test('loginDisplay.js keeps full LOGIN_IDENTIFIER_FIELD_HINT sentence.', () => {
    expect(loginDisplaySource).toMatch(
      /LOGIN_IDENTIFIER_FIELD_HINT\s*=\s*[\s\S]*?같은 칸에[\s\S]*?있습니다\./
    );
    expect(loginDisplaySource).toContain(
      '같은 칸에 이메일 또는 휴대폰 번호(숫자)를 입력할 수 있습니다.'
    );
  });

  test('UnifiedLogin.css keeps identifier hint visible and wrappable.', () => {
    expect(cssSource).toMatch(/#login-identifier-hint/);
    expect(cssSource).toMatch(
      /\.mg-v2-login-container\s+\.mg-v2-field\s+#login-identifier-hint[\s\S]*?overflow:\s*visible/
    );
    expect(cssSource).toMatch(
      /\.mg-v2-login-container\s+\.mg-v2-field\s+#login-identifier-hint[\s\S]*?white-space:\s*normal/
    );
    expect(cssSource).toMatch(
      /\.mg-v2-login-container\s+\.mg-v2-field\s+#login-identifier-hint[\s\S]*?max-height:\s*none/
    );
    expect(cssSource).toMatch(
      /\.mg-v2-login-content\s*\{[\s\S]*?min-width:\s*0;[\s\S]*?overflow-y:\s*auto/
    );
    expect(cssSource).toMatch(
      /\.mg-v2-login-form-wrapper\s*\{[\s\S]*?overflow:\s*visible/
    );
  });
});
