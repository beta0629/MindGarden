/**
 * 로그인 이동 직전 보관 백업(registerLoginRedirectRescue) — 공용 이동 경계 반례.
 *
 * @author CoreSolution
 * @since 2026-10-05
 */
import { LOGIN_REDIRECT_RESCUE_TIMEOUT_MS } from '../../constants/consultationLogAutosaveConstants';

const HOST = 'tenant.example.test';
const ORIGIN = `https://${HOST}`;
const PAGE = '/consultant/schedule?scheduleId=30';

let originalLocation;

const loadModule = () => {
  jest.resetModules();
  return require('../sessionRedirect');
};

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

beforeEach(() => {
  originalLocation = window.location;
  delete window.location;
  window.location = {
    hostname: HOST,
    host: HOST,
    protocol: 'https:',
    origin: ORIGIN,
    pathname: '/consultant/schedule',
    search: '?scheduleId=30',
    hash: '',
    href: `${ORIGIN}${PAGE}`
  };
});

afterEach(() => {
  jest.useRealTimers();
  window.location = originalLocation;
});

describe('redirectToLoginPageOnce — 이동 직전 보관 백업', () => {
  test('등록된 백업이 없으면 기존처럼 즉시 이동한다', () => {
    const { redirectToLoginPageOnce } = loadModule();
    expect(redirectToLoginPageOnce()).toBe(true);
    expect(window.location.href).toBe(`${ORIGIN}/login`);
  });

  test('백업이 끝난 뒤에 이동하고, 남은 백업의 returnUrl 을 붙인다', async() => {
    const { redirectToLoginPageOnce, registerLoginRedirectRescue } = loadModule();
    let resolveBackup;
    const rescue = jest.fn(() => new Promise((resolve) => { resolveBackup = resolve; }));
    registerLoginRedirectRescue(rescue);

    redirectToLoginPageOnce();
    expect(rescue).toHaveBeenCalledTimes(1);
    expect(window.location.href).toBe(`${ORIGIN}${PAGE}`);

    resolveBackup({ persisted: true, returnUrl: PAGE });
    await flush();
    expect(window.location.href).toBe(`${ORIGIN}/login?redirect=${encodeURIComponent(PAGE)}`);
  });

  test('반례: 백업이 남지 않으면 returnUrl 을 붙이지 않는다', async() => {
    const { redirectToLoginPageOnce, registerLoginRedirectRescue } = loadModule();
    registerLoginRedirectRescue(() => Promise.resolve({ persisted: false, returnUrl: PAGE }));
    redirectToLoginPageOnce();
    await flush();
    expect(window.location.href).toBe(`${ORIGIN}/login`);
  });

  test('반례: 다른 오리진·프로토콜 상대 returnUrl 은 버린다(오픈 리다이렉트)', async() => {
    const { redirectToLoginPageOnce, registerLoginRedirectRescue } = loadModule();
    registerLoginRedirectRescue(() => Promise.resolve({ persisted: true, returnUrl: '//evil.example/x' }));
    redirectToLoginPageOnce();
    await flush();
    expect(window.location.href).toBe(`${ORIGIN}/login`);
  });

  test('반례: 백업이 예외를 던져도 다른 백업과 이동은 계속된다', async() => {
    const { redirectToLoginPageOnce, registerLoginRedirectRescue } = loadModule();
    registerLoginRedirectRescue(() => { throw new Error('boom'); });
    registerLoginRedirectRescue(() => Promise.resolve({ persisted: true, returnUrl: PAGE }));
    redirectToLoginPageOnce();
    await flush();
    expect(window.location.href).toBe(`${ORIGIN}/login?redirect=${encodeURIComponent(PAGE)}`);
  });

  test('반례: 저장소가 응답하지 않아도 제한 시간 뒤에는 이동한다', () => {
    jest.useFakeTimers();
    const { redirectToLoginPageOnce, registerLoginRedirectRescue } = loadModule();
    registerLoginRedirectRescue(() => new Promise(() => {}));
    redirectToLoginPageOnce();
    expect(window.location.href).toBe(`${ORIGIN}${PAGE}`);
    jest.advanceTimersByTime(LOGIN_REDIRECT_RESCUE_TIMEOUT_MS);
    expect(window.location.href).toBe(`${ORIGIN}/login`);
  });

  test('명시 search(중복 로그인)는 유지하되 백업은 실행한다', async() => {
    const { redirectToLoginPageOnce, registerLoginRedirectRescue } = loadModule();
    const rescue = jest.fn(() => Promise.resolve({ persisted: true, returnUrl: PAGE }));
    registerLoginRedirectRescue(rescue);
    redirectToLoginPageOnce({ search: '?reason=duplicate-login' });
    await flush();
    expect(rescue).toHaveBeenCalledTimes(1);
    expect(window.location.href).toBe(`${ORIGIN}/login?reason=duplicate-login`);
  });

  test('등록 해제한 백업은 실행되지 않고, 두 번째 이동 요청은 무시된다', () => {
    const { redirectToLoginPageOnce, registerLoginRedirectRescue } = loadModule();
    const rescue = jest.fn();
    const unregister = registerLoginRedirectRescue(rescue);
    unregister();
    expect(redirectToLoginPageOnce()).toBe(true);
    expect(redirectToLoginPageOnce()).toBe(false);
    expect(rescue).not.toHaveBeenCalled();
  });
});
