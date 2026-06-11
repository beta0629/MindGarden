/**
 * appleOAuth2Service — Apple JS SDK mock 단위 테스트.
 *
 * Apple App Store 4.8 (T1) 대응. SDK 로더는 모듈 레벨 캐시를 사용하므로,
 * 매 테스트마다 `jest.isolateModules` 로 신선한 인스턴스를 사용한다.
 */

describe('appleOAuth2Service', () => {
  let originalAppleID;
  let appendedScripts;

  const installAppendChildMock = () => {
    jest.spyOn(document.head, 'appendChild').mockImplementation((node) => {
      appendedScripts.push(node);
      window.AppleID = {
        auth: {
          init: jest.fn(),
          signIn: jest.fn().mockResolvedValue({
            authorization: {
              id_token: 'id-token-xyz',
              code: 'auth-code-xyz',
              state: 'state-from-apple',
            },
            user: {
              email: 'user@example.com',
              name: { firstName: '길동', lastName: '홍' },
            },
          }),
        },
      };
      // 동기 dispatch — addEventListener 콜백을 즉시 발화시켜 promise 가 resolve 되도록 한다.
      Promise.resolve().then(() => {
        node.dispatchEvent(new Event('load'));
      });
      return node;
    });
  };

  beforeEach(() => {
    originalAppleID = window.AppleID;
    delete window.AppleID;
    appendedScripts = [];
    jest.resetModules();
    installAppendChildMock();
  });

  afterEach(() => {
    if (originalAppleID === undefined) {
      delete window.AppleID;
    } else {
      window.AppleID = originalAppleID;
    }
    jest.restoreAllMocks();
  });

  test('ensureAppleSdkLoaded: AppleID 가 없으면 SDK script 를 한 번만 주입한다', async () => {
    const { ensureAppleSdkLoaded } = require('../appleOAuth2Service');
    await ensureAppleSdkLoaded();
    expect(appendedScripts).toHaveLength(1);
    expect(appendedScripts[0].src).toMatch(/appleid\.cdn-apple\.com/);
    expect(window.AppleID).toBeDefined();
  });

  test('requestAppleSignIn: AppleID.auth.init 에 nonce·state 를 전달하고 identityToken 반환', async () => {
    const { requestAppleSignIn } = require('../appleOAuth2Service');
    const payload = await requestAppleSignIn();

    expect(window.AppleID.auth.init).toHaveBeenCalledTimes(1);
    const initOpts = window.AppleID.auth.init.mock.calls[0][0];
    expect(initOpts.nonce).toEqual(expect.any(String));
    expect(initOpts.state).toEqual(expect.any(String));
    expect(initOpts.nonce.length).toBeGreaterThanOrEqual(32);
    // 2026-06-11 Google PR #204 패턴 정합 — server-side auth-code 흐름으로 전환되어
    // 웹은 더 이상 popup 을 사용하지 않는다 (멀티테넌트 와일드카드에서 거절 회귀 방지).
    // 본 함수 자체는 모바일 webview fallback 호환을 위해 유지되며 usePopup=false 로 init.
    expect(initOpts.usePopup).toBe(false);

    expect(payload.identityToken).toBe('id-token-xyz');
    expect(payload.authorizationCode).toBe('auth-code-xyz');
    expect(payload.email).toBe('user@example.com');
    expect(payload.givenName).toBe('길동');
    expect(payload.familyName).toBe('홍');
    expect(payload.nonce).toBe(initOpts.nonce);
  });

  test('requestAppleSignIn: 호출마다 새 nonce 가 생성된다', async () => {
    const { requestAppleSignIn } = require('../appleOAuth2Service');
    const a = await requestAppleSignIn();
    const b = await requestAppleSignIn();
    expect(a.nonce).not.toEqual(b.nonce);
  });
});
