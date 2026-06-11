/**
 * UnifiedLogin — Apple Sign In 버튼 가드 격리 테스트.
 *
 * <p>본 테스트는 두 가지 계약을 검증한다.</p>
 *
 * <ol>
 *   <li>{@code isAppleWebServiceIdConfigured} 모듈 가드가 빈 문자열·placeholder·
 *       {@code your_*}·{@code local-dev-set-*} 환경에서 false 를, 실제 Service ID
 *       (예: {@code co.kr.coresolution.app.signin}) 에서 true 를 반환한다.</li>
 *   <li>{@code UnifiedLogin} 모듈이 해당 가드를 import 한다(=Apple 버튼이 가드 분기로
 *       감싸졌는지 정적 계약). 통합 렌더 테스트는 의존성 mock 폭증으로 인해
 *       격리 단위 검증으로 대체한다 (Google 가드 테스트와 동일 방침).</li>
 * </ol>
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

describe('UnifiedLogin — Apple Sign In 가드 (isAppleWebServiceIdConfigured)', () => {
  const originalAppleClientId = process.env[APPLE_CLIENT_ID_ENV];

  afterEach(() => {
    if (originalAppleClientId === undefined) {
      delete process.env[APPLE_CLIENT_ID_ENV];
    } else {
      process.env[APPLE_CLIENT_ID_ENV] = originalAppleClientId;
    }
  });

  test('Service ID 미주입(undefined) 시 false 를 반환한다 — Apple 버튼 미렌더.', () => {
    const { isAppleWebServiceIdConfigured, APPLE_WEB_SERVICE_ID } =
      reloadGuardWithEnv(undefined);
    expect(APPLE_WEB_SERVICE_ID).toBe('');
    expect(isAppleWebServiceIdConfigured).toBe(false);
  });

  test('Service ID 가 빈 문자열이면 false 를 반환한다 — Apple 버튼 미렌더.', () => {
    const { isAppleWebServiceIdConfigured, APPLE_WEB_SERVICE_ID } =
      reloadGuardWithEnv('');
    expect(APPLE_WEB_SERVICE_ID).toBe('');
    expect(isAppleWebServiceIdConfigured).toBe(false);
  });

  test('your_* placeholder 면 false 를 반환한다 — Apple 버튼 미렌더.', () => {
    const { isAppleWebServiceIdConfigured } = reloadGuardWithEnv(
      'your_apple_service_id'
    );
    expect(isAppleWebServiceIdConfigured).toBe(false);
  });

  test('local-dev-set-* placeholder 면 false 를 반환한다 — Apple 버튼 미렌더.', () => {
    const { isAppleWebServiceIdConfigured } = reloadGuardWithEnv(
      'local-dev-set-REACT_APP_oauth-client-id'
    );
    expect(isAppleWebServiceIdConfigured).toBe(false);
  });

  test('placeholder 접두사면 false 를 반환한다 — Apple 버튼 미렌더.', () => {
    const { isAppleWebServiceIdConfigured } = reloadGuardWithEnv(
      'placeholder_value'
    );
    expect(isAppleWebServiceIdConfigured).toBe(false);
  });

  test('공백만 있는 값이면 false 를 반환한다 — Apple 버튼 미렌더.', () => {
    const { isAppleWebServiceIdConfigured } = reloadGuardWithEnv('   ');
    expect(isAppleWebServiceIdConfigured).toBe(false);
  });

  test('실제 Apple Service ID 가 주입되면 true 를 반환한다 — Apple 버튼 렌더.', () => {
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

describe('UnifiedLogin 정적 계약 — Apple 버튼 가드 import 사용', () => {
  test('UnifiedLogin 소스가 isAppleWebServiceIdConfigured 를 import 하여 가드 분기로 사용한다.', () => {
    const fs = require('fs');
    const path = require('path');
    const source = fs.readFileSync(
      path.resolve(__dirname, '..', 'UnifiedLogin.js'),
      'utf8'
    );
    // oauth2 모듈에서 가드 import
    expect(source).toMatch(
      /isAppleWebServiceIdConfigured[\s\S]*from\s+['"]\.\.\/\.\.\/constants\/oauth2['"]/
    );
    // 가드 분기(JSX 조건부 렌더)
    expect(source).toMatch(/\{\s*isAppleWebServiceIdConfigured\s*&&/);
  });
});
