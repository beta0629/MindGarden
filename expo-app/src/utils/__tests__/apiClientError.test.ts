/**
 * apiClient 표준 에러 헬퍼 단위 테스트.
 *
 * <p>인터셉터 reject 값이 {@link Error} 인스턴스인지, 그리고
 * status / code / originalError / message 폴백이 정확한지 검증.</p>
 *
 * @author MindGarden
 * @since 2026-06-09
 */
import {
  buildApiClientError,
  extractErrorMeta,
  fallbackMessageForStatus,
} from '@/api/apiClientError';

describe('extractErrorMeta', () => {
  it('null/undefined/primitives — 빈 객체 반환', () => {
    expect(extractErrorMeta(null)).toEqual({});
    expect(extractErrorMeta(undefined)).toEqual({});
    expect(extractErrorMeta('string')).toEqual({});
    expect(extractErrorMeta(42)).toEqual({});
  });

  it('errorCode 우선, code 폴백', () => {
    expect(
      extractErrorMeta({
        message: '매칭된 담당 상담사가 없습니다.',
        errorCode: 'NO_ACTIVE_CONSULTANT_MAPPING',
        code: 'fallback',
      }),
    ).toEqual({
      message: '매칭된 담당 상담사가 없습니다.',
      code: 'NO_ACTIVE_CONSULTANT_MAPPING',
    });
  });

  it('errorCode 없으면 code 사용', () => {
    expect(
      extractErrorMeta({
        message: '이미 처리 중입니다.',
        code: 'MAPPING_ALREADY_PROCESSED',
      }),
    ).toEqual({
      message: '이미 처리 중입니다.',
      code: 'MAPPING_ALREADY_PROCESSED',
    });
  });

  it('숫자 code/message 무시', () => {
    expect(extractErrorMeta({ message: 1, code: 2 })).toEqual({});
  });
});

describe('fallbackMessageForStatus', () => {
  const cases: Array<[number, string]> = [
    [400, '요청이 올바르지 않습니다.'],
    [401, '인증이 필요합니다.'],
    [403, '접근 권한이 없습니다.'],
    [404, '요청한 리소스를 찾을 수 없습니다.'],
    [409, '이미 처리 중이거나 충돌이 발생했습니다.'],
    [500, '서버 오류가 발생했습니다.'],
    [0, '네트워크 연결을 확인해주세요.'],
    [502, '네트워크 연결을 확인해주세요.'],
  ];
  it.each(cases)('status=%i 시 메시지 매핑', (status, expected) => {
    expect(fallbackMessageForStatus(status)).toBe(expected);
  });
});

describe('buildApiClientError', () => {
  it('Error 인스턴스 반환 + status/code/originalError 부착', () => {
    const original = new Error('axios original');
    const err = buildApiClientError(
      400,
      {
        success: false,
        message: '매칭된 담당 상담사가 없습니다. 먼저 상담을 신청해 주세요.',
        errorCode: 'NO_ACTIVE_CONSULTANT_MAPPING',
      },
      original,
    );
    expect(err).toBeInstanceOf(Error);
    expect(err.status).toBe(400);
    expect(err.code).toBe('NO_ACTIVE_CONSULTANT_MAPPING');
    expect(err.message).toBe('매칭된 담당 상담사가 없습니다. 먼저 상담을 신청해 주세요.');
    expect(err.originalError).toBe(original);
  });

  it('응답 본문 메시지 누락 — status 폴백 메시지', () => {
    const err = buildApiClientError(500, {}, new Error('orig'));
    expect(err).toBeInstanceOf(Error);
    expect(err.message).toBe('서버 오류가 발생했습니다.');
    expect(err.status).toBe(500);
    expect(err.code).toBeUndefined();
  });

  it('네트워크 오류 — status=0 + 네트워크 메시지', () => {
    const err = buildApiClientError(0, undefined, new Error('Network Error'));
    expect(err.status).toBe(0);
    expect(err.message).toBe('네트워크 연결을 확인해주세요.');
  });

  it('공백 message 무시 → 폴백', () => {
    const err = buildApiClientError(403, { message: '   ' }, null);
    expect(err.message).toBe('접근 권한이 없습니다.');
  });

  it('throwable 로 사용 가능 (try/catch 정상 동작)', () => {
    const built = buildApiClientError(401, { message: '세션 만료' }, null);
    let caught: unknown = null;
    try {
      throw built;
    } catch (e) {
      caught = e;
    }
    expect(caught).toBeInstanceOf(Error);
    expect((caught as Error).message).toBe('세션 만료');
  });
});
