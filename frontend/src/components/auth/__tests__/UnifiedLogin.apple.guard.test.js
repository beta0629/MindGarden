/**
 * UnifiedLogin — Apple / Google Sign In 가드 회귀 격리 테스트.
 *
 * <p>본 테스트는 세 가지 계약을 검증한다.</p>
 *
 * <ol>
 *   <li>{@code isAppleWebServiceIdConfigured} / {@code isGoogleWebClientIdConfigured} 모듈
 *       상수가 빈 문자열·placeholder·{@code your_*}·{@code local-dev-set-*} 환경에서 false,
 *       실제 Service ID / Client ID 에서 true 를 반환한다 (constants 동작 자체는 유지).</li>
 *   <li>**회귀 가드** — {@code UnifiedLogin} 소스가 Apple 버튼을 더 이상
 *       {@code isAppleWebServiceIdConfigured} 로 가드하지 않는다 (PR #211 server-side
 *       auth-code 흐름 전환 후 FE Service ID 미주입 운영 빌드에서도 버튼이 노출되어야 함).
 *       동일 회귀를 막기 위해 정적 소스 검사로 단일 {@code &&} 가드 부재를 보장한다.</li>
 *   <li>**회귀 가드** — {@code UnifiedLogin} 소스가 Google 버튼을
 *       {@code isGoogleWebClientIdConfigured} ternary 로 렌더하되, false 분기에서
 *       {@code oauth2Config?.google &&} 같은 추가 가드로 숨기지 않는다. PR #211 후 BE 가
 *       authorize URL 을 생성하므로 미주입 환경에서도 폴백 {@code MGButton} 이 보여야 한다.</li>
 * </ol>
 *
 * <p>통합 렌더 테스트는 의존성 mock 폭증으로 격리 단위 검증으로 대체한다 (Google 가드
 * 테스트와 동일 방침).</p>
 *
 * @author MindGarden
 * @since 2026-06-11
 */

const APPLE_CLIENT_ID_ENV = 'REACT_APP_APPLE_CLIENT_ID';

const reloadGuardWithEnv = (value) => {
  let guardModule;
  jest.isolateModules(() => {
    if (value === undefined) {
      delete process.env[APPLE_CLIENT_ID_ENV];
    } else {
      process.env[APPLE_CLIENT_ID_ENV] = value;
    }
    guardModule = require('../../../constants/oauth2');
  });
  return guardModule;
};

describe('constants/oauth2 — isAppleWebServiceIdConfigured 동작 (모듈 단위)', () => {
  const originalAppleClientId = process.env[APPLE_CLIENT_ID_ENV];

  afterEach(() => {
    if (originalAppleClientId === undefined) {
      delete process.env[APPLE_CLIENT_ID_ENV];
    } else {
      process.env[APPLE_CLIENT_ID_ENV] = originalAppleClientId;
    }
  });

  test('Service ID 미주입(undefined) 시 false 를 반환한다.', () => {
    const { isAppleWebServiceIdConfigured, APPLE_WEB_SERVICE_ID } =
      reloadGuardWithEnv(undefined);
    expect(APPLE_WEB_SERVICE_ID).toBe('');
    expect(isAppleWebServiceIdConfigured).toBe(false);
  });

  test('Service ID 가 빈 문자열이면 false 를 반환한다.', () => {
    const { isAppleWebServiceIdConfigured, APPLE_WEB_SERVICE_ID } =
      reloadGuardWithEnv('');
    expect(APPLE_WEB_SERVICE_ID).toBe('');
    expect(isAppleWebServiceIdConfigured).toBe(false);
  });

  test('your_* placeholder 면 false 를 반환한다.', () => {
    const { isAppleWebServiceIdConfigured } = reloadGuardWithEnv(
      'your_apple_service_id'
    );
    expect(isAppleWebServiceIdConfigured).toBe(false);
  });

  test('local-dev-set-* placeholder 면 false 를 반환한다.', () => {
    const { isAppleWebServiceIdConfigured } = reloadGuardWithEnv(
      'local-dev-set-REACT_APP_oauth-client-id'
    );
    expect(isAppleWebServiceIdConfigured).toBe(false);
  });

  test('placeholder 접두사면 false 를 반환한다.', () => {
    const { isAppleWebServiceIdConfigured } = reloadGuardWithEnv(
      'placeholder_value'
    );
    expect(isAppleWebServiceIdConfigured).toBe(false);
  });

  test('공백만 있는 값이면 false 를 반환한다.', () => {
    const { isAppleWebServiceIdConfigured } = reloadGuardWithEnv('   ');
    expect(isAppleWebServiceIdConfigured).toBe(false);
  });

  test('실제 Apple Service ID 가 주입되면 true 를 반환한다.', () => {
    const { isAppleWebServiceIdConfigured, APPLE_WEB_SERVICE_ID } =
      reloadGuardWithEnv('co.kr.coresolution.app.signin');
    expect(APPLE_WEB_SERVICE_ID).toBe('co.kr.coresolution.app.signin');
    expect(isAppleWebServiceIdConfigured).toBe(true);
  });

  test('Service ID 양 끝 공백은 trim 된 후 true 가 된다.', () => {
    const { isAppleWebServiceIdConfigured, APPLE_WEB_SERVICE_ID } =
      reloadGuardWithEnv('  co.kr.coresolution.app.signin  ');
    expect(APPLE_WEB_SERVICE_ID).toBe('co.kr.coresolution.app.signin');
    expect(isAppleWebServiceIdConfigured).toBe(true);
  });
});

describe('UnifiedLogin 정적 계약 — PR #211 server-side auth-code 회귀 가드', () => {
  const fs = require('fs');
  const path = require('path');
  const source = fs.readFileSync(
    path.resolve(__dirname, '..', 'UnifiedLogin.js'),
    'utf8'
  );

  test('Apple 버튼이 isAppleWebServiceIdConfigured 단일 && 가드로 감싸이지 않는다 (PR #211 회귀 방지).', () => {
    expect(source).not.toMatch(/\{\s*isAppleWebServiceIdConfigured\s*&&/);
  });

  test('Apple 버튼은 server-side flow 기준 무조건 렌더된다 — handleAppleLogin onClick MGButton 존재.', () => {
    expect(source).toMatch(/onClick=\{\s*handleAppleLogin\s*\}/);
    expect(source).toMatch(/mg-v2-button-apple/);
  });

  test('UnifiedLogin 은 더 이상 isAppleWebServiceIdConfigured 를 import 하지 않는다 (주석 외 사용 0).', () => {
    // import 구문에 isAppleWebServiceIdConfigured 가 포함되면 안 된다.
    // (코드 주석에 회귀 가드 설명으로 등장하는 것은 허용)
    expect(source).not.toMatch(
      /import\s*\{[^}]*\bisAppleWebServiceIdConfigured\b[^}]*\}\s*from/
    );
    // JSX 가드(`{isAppleWebServiceIdConfigured && ...}`) 형태가 남아 있으면 회귀.
    expect(source).not.toMatch(/\{\s*isAppleWebServiceIdConfigured\b/);
  });

  test('Google 버튼은 isGoogleWebClientIdConfigured ternary 로 분기되며, false 분기는 폴백 MGButton 을 렌더한다.', () => {
    // 폴백 분기에서 oauth2Config?.google && 같은 추가 숨김 가드가 없어야 한다 — PR #211 후 BE 가
    // authorize URL 을 생성하므로 미주입 환경에서도 폴백 버튼이 보여야 회귀가 재발하지 않는다.
    expect(source).not.toMatch(/oauth2Config\?\.\s*google\s*&&/);
    // ternary 자체는 유지 — GIS 로고 자산 변형용.
    expect(source).toMatch(/isGoogleWebClientIdConfigured\s*\?/);
    // 폴백 MGButton 식별자 확인.
    expect(source).toMatch(/mg-v2-button-google/);
    expect(source).toMatch(/onClick=\{\s*handleGoogleLogin\s*\}/);
  });
});
