/**
 * currentAccountDisplay — 마이페이지 배너·로그인 토스트 표시 문자열 SSOT 단위 테스트
 *
 * 컴포넌트(CurrentAccountBanner, AccountMismatchHint) 및 useAuthStore.login
 * 토스트가 모두 이 모듈을 통해 표시 문자열을 만들어내므로 본 테스트가
 * 표시 경계 회귀(React #130, PII 마스킹·fallback) 게이트 역할을 한다.
 *
 * @author MindGarden
 * @since 2026-06-09
 */
import {
  buildCurrentAccountDisplay,
  buildLoginSuccessToastBody,
  buildLoginSuccessToastPayload,
  extractUserIdSuffix,
  normalizeProviderLabel,
} from '../currentAccountDisplay';

describe('extractUserIdSuffix', () => {
  it('숫자 userId의 마지막 4자리를 반환', () => {
    expect(extractUserIdSuffix(1234567)).toBe('4567');
  });

  it('4자리 미만이면 전체 반환', () => {
    expect(extractUserIdSuffix(13)).toBe('13');
    expect(extractUserIdSuffix(20)).toBe('20');
  });

  it('문자열 userId도 처리', () => {
    expect(extractUserIdSuffix('user-9999')).toBe('9999');
    expect(extractUserIdSuffix('42')).toBe('42');
  });

  it('null/undefined/빈문자열은 null', () => {
    expect(extractUserIdSuffix(null)).toBeNull();
    expect(extractUserIdSuffix(undefined)).toBeNull();
    expect(extractUserIdSuffix('')).toBeNull();
    expect(extractUserIdSuffix('   ')).toBeNull();
  });
});

describe('normalizeProviderLabel', () => {
  it('provider 값이 있으면 대문자 (PROVIDER) 형식으로 정규화', () => {
    expect(normalizeProviderLabel('kakao')).toBe('(KAKAO)');
    expect(normalizeProviderLabel('NAVER')).toBe('(NAVER)');
    expect(normalizeProviderLabel('Apple')).toBe('(APPLE)');
  });

  it('LOCAL 또는 빈값/null이면 라벨을 표시하지 않음 (null)', () => {
    expect(normalizeProviderLabel('LOCAL')).toBeNull();
    expect(normalizeProviderLabel('local')).toBeNull();
    expect(normalizeProviderLabel('')).toBeNull();
    expect(normalizeProviderLabel('   ')).toBeNull();
    expect(normalizeProviderLabel(null)).toBeNull();
    expect(normalizeProviderLabel(undefined)).toBeNull();
  });
});

describe('buildCurrentAccountDisplay', () => {
  it('email + provider + userId 모두 있을 때 4부 결합', () => {
    const display = buildCurrentAccountDisplay({
      email: 'beta74@live.co.kr',
      socialProvider: 'KAKAO',
      userId: 20,
    });
    expect(display.email).toBe('beta74@live.co.kr');
    expect(display.providerLabel).toBe('(KAKAO)');
    expect(display.suffix).toBe('20');
    expect(display.oneLine).toBe('현재 로그인 계정 · beta74@live.co.kr · (KAKAO) · #20');
  });

  it('provider 없으면 라벨 생략', () => {
    const display = buildCurrentAccountDisplay({
      email: 'foo@bar.com',
      userId: 13579,
    });
    expect(display.providerLabel).toBeNull();
    expect(display.oneLine).toBe('현재 로그인 계정 · foo@bar.com · #3579');
  });

  it('userId 없으면 suffix 생략', () => {
    const display = buildCurrentAccountDisplay({
      email: 'a@b.com',
      socialProvider: 'naver',
    });
    expect(display.suffix).toBeNull();
    expect(display.oneLine).toBe('현재 로그인 계정 · a@b.com · (NAVER)');
  });

  it('email 누락/빈값일 때 안전 fallback', () => {
    const display = buildCurrentAccountDisplay({
      email: null,
      userId: 7,
    });
    expect(display.email).toBe('계정 정보 없음');
    expect(display.oneLine).toBe('현재 로그인 계정 · 계정 정보 없음 · #7');
  });

  it('객체가 잘못 전달돼도 React #130을 일으키지 않고 문자열만 반환', () => {
    const display = buildCurrentAccountDisplay({
      email: { value: 'evil' } as unknown as string,
      userId: 13,
    });
    expect(typeof display.email).toBe('string');
    expect(typeof display.oneLine).toBe('string');
    expect(display.oneLine.startsWith('현재 로그인 계정')).toBe(true);
  });
});

describe('buildLoginSuccessToastBody', () => {
  it('이메일이 있으면 "(으)로 로그인되었습니다" 본문', () => {
    expect(buildLoginSuccessToastBody('beta74@live.co.kr')).toBe(
      'beta74@live.co.kr (으)로 로그인되었습니다',
    );
  });

  it('이메일 없으면 fallback 표시', () => {
    expect(buildLoginSuccessToastBody(null)).toBe('계정 정보 없음 (으)로 로그인되었습니다');
    expect(buildLoginSuccessToastBody('')).toBe('계정 정보 없음 (으)로 로그인되었습니다');
    expect(buildLoginSuccessToastBody(undefined)).toBe(
      '계정 정보 없음 (으)로 로그인되었습니다',
    );
  });

  it('반환값은 항상 단순 문자열 (React #130 방지)', () => {
    expect(typeof buildLoginSuccessToastBody('x@y.z')).toBe('string');
  });
});

describe('buildLoginSuccessToastPayload', () => {
  it('useAuthStore.login 직후 호출하는 showInAppToast 페이로드를 생성', () => {
    const payload = buildLoginSuccessToastPayload(
      { id: 20, email: 'beta74@live.co.kr' },
      1717000000000,
    );
    expect(payload).toEqual({
      id: 'login-success-20-1717000000000',
      title: '로그인 완료',
      body: 'beta74@live.co.kr (으)로 로그인되었습니다',
      icon: 'CheckCircle',
    });
  });

  it('이메일이 비어 있어도 토스트는 안전 fallback 본문을 사용', () => {
    const payload = buildLoginSuccessToastPayload(
      { id: 13, email: '' },
      1717000000001,
    );
    expect(payload.id).toBe('login-success-13-1717000000001');
    expect(payload.body).toBe('계정 정보 없음 (으)로 로그인되었습니다');
    expect(payload.title).toBe('로그인 완료');
    expect(payload.icon).toBe('CheckCircle');
  });

  it('id는 매 호출마다 timestamp가 달라 중복되지 않음 (기본 Date.now 사용)', () => {
    const a = buildLoginSuccessToastPayload({ id: 1, email: 'a@b.com' });
    const b = buildLoginSuccessToastPayload({ id: 1, email: 'a@b.com' }, Date.now() + 1);
    expect(a.id).not.toBe(b.id);
  });
});
