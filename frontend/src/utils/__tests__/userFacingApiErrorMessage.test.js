import '../../i18n';
import i18n from 'i18next';
import { API_ERROR_MESSAGES } from '../../constants/api';
import {
  GENERIC_API_ERROR_I18N_KEY,
  SANITIZED_INTERNAL_SERVER_ERROR_MESSAGE
} from '../../constants/genericServerErrorMessages';
import { resolveUserFacingApiErrorMessage } from '../userFacingApiErrorMessage';

const FALLBACK = '상담사 등록 중 오류가 발생했습니다.';
const DUPLICATE_MESSAGE = '이미 등록된 이메일입니다.';
const PASSWORD_POLICY_MESSAGE = '비밀번호는 최소 1개의 대문자를 포함해야 합니다.';
const BUSINESS_MESSAGE = '이미 처리된 매칭입니다.';

const httpError = (status, data, message = API_ERROR_MESSAGES.REQUEST_FAILED) => {
  const error = new Error(message);
  error.status = status;
  if (data !== undefined) {
    error.response = { status, data };
  }
  return error;
};

describe('resolveUserFacingApiErrorMessage', () => {
  test('서버 본문 메시지를 일반 fallback 보다 먼저 보여 준다', () => {
    const error = httpError(400, { message: PASSWORD_POLICY_MESSAGE }, API_ERROR_MESSAGES.SERVER_ERROR);
    expect(resolveUserFacingApiErrorMessage(error, FALLBACK)).toBe(PASSWORD_POLICY_MESSAGE);
  });

  test('본문이 없으면 error.message 의 구체 문구를 보여 준다', () => {
    expect(resolveUserFacingApiErrorMessage(httpError(409, undefined, DUPLICATE_MESSAGE), FALLBACK))
      .toBe(DUPLICATE_MESSAGE);
  });

  test('409 중복 문구는 중복으로 보여 주고 등록 일반 문구로 바꾸지 않는다', () => {
    expect(resolveUserFacingApiErrorMessage(httpError(409, { message: DUPLICATE_MESSAGE }), FALLBACK))
      .toBe(DUPLICATE_MESSAGE);
  });

  test('일반 500 문구만 있으면 fallback 을 쓴다', () => {
    const error = httpError(500, { message: SANITIZED_INTERNAL_SERVER_ERROR_MESSAGE },
      SANITIZED_INTERNAL_SERVER_ERROR_MESSAGE);
    expect(resolveUserFacingApiErrorMessage(error, FALLBACK)).toBe(FALLBACK);
  });

  test('메시지가 없으면 fallback 을 쓴다', () => {
    expect(resolveUserFacingApiErrorMessage(new Error('   '), FALLBACK)).toBe(FALLBACK);
    expect(resolveUserFacingApiErrorMessage(null, FALLBACK)).toBe(FALLBACK);
  });

  describe('사용자 문구로 표시된 오류만 원문', () => {
    test('400 + 서버 정의 코드 → 원문', () => {
      const error = httpError(400, { message: PASSWORD_POLICY_MESSAGE, errorCode: 'VALIDATION_ERROR' });
      expect(resolveUserFacingApiErrorMessage(error, FALLBACK)).toBe(PASSWORD_POLICY_MESSAGE);
    });

    test('422·409 사용자 문구 → 원문', () => {
      expect(resolveUserFacingApiErrorMessage(httpError(422, { message: BUSINESS_MESSAGE }), FALLBACK))
        .toBe(BUSINESS_MESSAGE);
      expect(resolveUserFacingApiErrorMessage(
        httpError(409, { message: BUSINESS_MESSAGE, code: 'MAPPING_ALREADY_PROCESSED' }), FALLBACK
      )).toBe(BUSINESS_MESSAGE);
    });

    test('400 필드 오류 맵 → 한 줄로', () => {
      expect(resolveUserFacingApiErrorMessage(httpError(400, { errors: { a: 'A', b: 'B' } }, ''), FALLBACK))
        .toBe('A B');
    });

    test('서버 정의 코드가 있는 403 → 원문, 코드 없는 403 → 일반 문구', () => {
      expect(resolveUserFacingApiErrorMessage(
        httpError(403, { message: '본인 정보만 조회할 수 있습니다.', errorCode: 'ACCESS_DENIED' }), FALLBACK
      )).toBe('본인 정보만 조회할 수 있습니다.');
      expect(resolveUserFacingApiErrorMessage(httpError(403, { message: '거부' }, '거부'), FALLBACK))
        .toBe(FALLBACK);
    });
  });

  describe('5xx·예외 원문·네트워크 → 일반 문구', () => {
    test('500 + 구체 메시지 → 일반 문구', () => {
      const error = httpError(500, { message: '상담사 저장 실패: 중복 키' }, '상담사 저장 실패: 중복 키');
      expect(resolveUserFacingApiErrorMessage(error, FALLBACK)).toBe(FALLBACK);
    });

    test.each([
      ['Exception', 'java.lang.IllegalStateException: tenant missing'],
      ['${', '요청 값 ${password} 이(가) 올바르지 않습니다.'],
      ['RUNTIME_ERROR', 'RUNTIME_ERROR: 처리 실패'],
      ['스택', 'NullPointerException\n\tat com.coresolution.core.Foo.bar(Foo.java:10)'],
      ['내부 경로', '잘못된 요청입니다: /api/v1/admin/consultants']
    ])('400 본문에 %s → 일반 문구', (_label, raw) => {
      expect(resolveUserFacingApiErrorMessage(httpError(400, { message: raw }, raw), FALLBACK)).toBe(FALLBACK);
    });

    test('4xx 여도 서버 오류 코드(RUNTIME_ERROR)면 일반 문구', () => {
      const error = httpError(400, { message: '처리할 수 없습니다.', errorCode: 'RUNTIME_ERROR' });
      expect(resolveUserFacingApiErrorMessage(error, FALLBACK)).toBe(FALLBACK);
    });

    test('네트워크 오류 → 일반 문구', () => {
      const flagged = new Error(API_ERROR_MESSAGES.NETWORK_ERROR);
      flagged.isNetworkError = true;
      expect(resolveUserFacingApiErrorMessage(flagged, FALLBACK)).toBe(FALLBACK);
      expect(resolveUserFacingApiErrorMessage(new TypeError('Failed to fetch'), FALLBACK)).toBe(FALLBACK);
      expect(resolveUserFacingApiErrorMessage(new Error(API_ERROR_MESSAGES.NETWORK_ERROR), FALLBACK))
        .toBe(FALLBACK);
    });

    test('fallback 이 없으면 i18n 일반 문구', () => {
      const generic = i18n.t(GENERIC_API_ERROR_I18N_KEY);
      expect(generic).not.toBe(GENERIC_API_ERROR_I18N_KEY);
      expect(resolveUserFacingApiErrorMessage(httpError(500, { message: 'boom' }))).toBe(generic);
      expect(resolveUserFacingApiErrorMessage(undefined)).toBe(generic);
    });
  });

  test('HTTP 상태 없는 화면 생성 오류: 원문 검사 통과 문구만', () => {
    expect(resolveUserFacingApiErrorMessage(new Error(BUSINESS_MESSAGE), FALLBACK)).toBe(BUSINESS_MESSAGE);
    expect(resolveUserFacingApiErrorMessage(new Error('SQLException: deadlock'), FALLBACK)).toBe(FALLBACK);
  });
});
