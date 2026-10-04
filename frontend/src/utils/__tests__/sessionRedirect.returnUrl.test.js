/**
 * 로그인 복귀 경로(returnUrl) — 같은 오리진 상대 경로만 허용(오픈 리다이렉트 반례).
 *
 * @author CoreSolution
 * @since 2026-10-04
 */

const HOST = 'tenant.example.test';
const ORIGIN = `https://${HOST}`;

let originalLocation;

const loadModule = () => {
  jest.resetModules();
  return require('../sessionRedirect');
};

beforeEach(() => {
  originalLocation = window.location;
  delete window.location;
  window.location = {
    hostname: HOST,
    host: HOST,
    protocol: 'https:',
    origin: ORIGIN,
    pathname: '/consultant/schedule',
    search: '',
    hash: '',
    href: `${ORIGIN}/consultant/schedule`
  };
});

afterEach(() => {
  window.location = originalLocation;
});

describe('sanitizeSameOriginReturnPath / buildLoginReturnSearch', () => {
  test('같은 오리진 상대 경로는 쿼리를 포함해 통과한다', () => {
    const { sanitizeSameOriginReturnPath, buildLoginReturnSearch } = loadModule();
    expect(sanitizeSameOriginReturnPath('/consultant/schedule?scheduleId=30')).toBe('/consultant/schedule?scheduleId=30');
    expect(buildLoginReturnSearch('/consultant/schedule?scheduleId=30'))
      .toBe(`?redirect=${encodeURIComponent('/consultant/schedule?scheduleId=30')}`);
  });

  test.each([
    ['프로토콜 상대', '//evil.example'],
    ['역슬래시 우회', '/\\evil.example'],
    ['탭 삽입 우회', '/\t/evil.example'],
    ['개행 삽입 우회', '/\n/evil.example'],
    ['절대 URL', 'https://evil.example/path'],
    ['javascript 스킴', 'javascript:alert(1)'],
    ['상대 경로(슬래시 없음)', 'evil.example'],
    ['빈 값', ''],
    ['문자열 아님', { href: '/x' }]
  ])('반례 %s 은(는) 거부한다', (_label, value) => {
    const { sanitizeSameOriginReturnPath, buildLoginReturnSearch } = loadModule();
    expect(sanitizeSameOriginReturnPath(value)).toBe('');
    expect(buildLoginReturnSearch(value)).toBe('');
  });
});

describe('redirectToLoginPageOnce + 예약 복귀 경로', () => {
  test('예약한 복귀 경로는 인자 없는 이동(다른 경로의 세션 만료 처리)에도 붙는다', () => {
    const { setPendingLoginReturnUrl, redirectToLoginPageOnce } = loadModule();
    setPendingLoginReturnUrl('/consultant/schedule?scheduleId=30');

    redirectToLoginPageOnce();

    expect(window.location.href)
      .toBe(`${ORIGIN}/login?redirect=${encodeURIComponent('/consultant/schedule?scheduleId=30')}`);
  });

  test('반례: 외부 주소는 예약되지 않는다', () => {
    const { setPendingLoginReturnUrl, redirectToLoginPageOnce } = loadModule();
    setPendingLoginReturnUrl('//evil.example');

    redirectToLoginPageOnce();

    expect(window.location.href).toBe(`${ORIGIN}/login`);
  });

  test('예약을 지우면 붙지 않고, 명시 search(중복 로그인 등)는 예약보다 우선한다', () => {
    const first = loadModule();
    first.setPendingLoginReturnUrl('/consultant/schedule');
    first.clearPendingLoginReturnUrl();
    first.redirectToLoginPageOnce();
    expect(window.location.href).toBe(`${ORIGIN}/login`);

    const second = loadModule();
    second.setPendingLoginReturnUrl('/consultant/schedule');
    second.redirectToLoginPageOnce({ search: '?reason=duplicate-login' });
    expect(window.location.href).toBe(`${ORIGIN}/login?reason=duplicate-login`);
  });
});
