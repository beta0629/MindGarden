import { API_ERROR_MESSAGES } from '../../constants/api';
import { SANITIZED_INTERNAL_SERVER_ERROR_MESSAGE } from '../../constants/genericServerErrorMessages';
import { resolveUserFacingApiErrorMessage } from '../userFacingApiErrorMessage';

const FALLBACK = '상담사 등록 중 오류가 발생했습니다.';
const DUPLICATE_MESSAGE = '이미 등록된 이메일입니다.';
const PASSWORD_POLICY_MESSAGE = '비밀번호는 최소 1개의 대문자를 포함해야 합니다.';

describe('resolveUserFacingApiErrorMessage', () => {
  test('서버 본문 메시지를 일반 fallback 보다 먼저 보여 준다', () => {
    const error = new Error(API_ERROR_MESSAGES.SERVER_ERROR);
    error.status = 400;
    error.response = { data: { message: PASSWORD_POLICY_MESSAGE } };

    expect(resolveUserFacingApiErrorMessage(error, FALLBACK)).toBe(PASSWORD_POLICY_MESSAGE);
  });

  test('본문이 없으면 error.message 의 구체 문구를 보여 준다', () => {
    const error = new Error(DUPLICATE_MESSAGE);
    error.status = 409;

    expect(resolveUserFacingApiErrorMessage(error, FALLBACK)).toBe(DUPLICATE_MESSAGE);
  });

  test('409 중복 문구는 중복으로 보여 주고 등록 일반 문구로 바꾸지 않는다', () => {
    const error = new Error(API_ERROR_MESSAGES.REQUEST_FAILED);
    error.status = 409;
    error.response = { data: { message: DUPLICATE_MESSAGE } };

    expect(resolveUserFacingApiErrorMessage(error, FALLBACK)).toBe(DUPLICATE_MESSAGE);
  });

  test('일반 500 문구만 있으면 fallback 을 쓴다', () => {
    const error = new Error(SANITIZED_INTERNAL_SERVER_ERROR_MESSAGE);
    error.status = 500;
    error.response = { data: { message: SANITIZED_INTERNAL_SERVER_ERROR_MESSAGE } };

    expect(resolveUserFacingApiErrorMessage(error, FALLBACK)).toBe(FALLBACK);
  });

  test('메시지가 없으면 fallback 을 쓴다', () => {
    expect(resolveUserFacingApiErrorMessage(new Error('   '), FALLBACK)).toBe(FALLBACK);
    expect(resolveUserFacingApiErrorMessage(null, FALLBACK)).toBe(FALLBACK);
  });
});
