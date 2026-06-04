import {
  DUPLICATE_LOGIN_FALLBACK_MESSAGE,
  detectDuplicateLoginConfirmation,
} from '@/utils/duplicateLoginSignal';

describe('detectDuplicateLoginConfirmation', () => {
  it('returns null for nullish input', () => {
    expect(detectDuplicateLoginConfirmation(null)).toBeNull();
    expect(detectDuplicateLoginConfirmation(undefined)).toBeNull();
  });

  it('returns null for unrelated payloads', () => {
    expect(detectDuplicateLoginConfirmation({ success: true, user: {} })).toBeNull();
    expect(detectDuplicateLoginConfirmation({ status: 401, message: '인증 실패' })).toBeNull();
  });

  it('detects top-level responseType signal with explicit message', () => {
    const result = detectDuplicateLoginConfirmation({
      responseType: 'duplicate_login_confirmation',
      message: '다른 곳에서 로그인되어 있습니다. 기존 세션을 종료하고 새로 로그인하시겠습니까?',
    });
    expect(result).not.toBeNull();
    expect(result?.message).toBe(
      '다른 곳에서 로그인되어 있습니다. 기존 세션을 종료하고 새로 로그인하시겠습니까?',
    );
  });

  it('detects top-level requiresConfirmation boolean with fallback message', () => {
    const result = detectDuplicateLoginConfirmation({ requiresConfirmation: true });
    expect(result).not.toBeNull();
    expect(result?.message).toBe(DUPLICATE_LOGIN_FALLBACK_MESSAGE);
  });

  it('detects ApiResponse wrapper (data.responseType)', () => {
    const wrapper = {
      success: false,
      message: '중복 로그인이 감지되었습니다.',
      data: {
        responseType: 'duplicate_login_confirmation',
        requiresConfirmation: true,
      },
    };
    const result = detectDuplicateLoginConfirmation(wrapper);
    expect(result).not.toBeNull();
    expect(result?.message).toBe('중복 로그인이 감지되었습니다.');
  });

  it('falls back to nested data.message when root message missing', () => {
    const result = detectDuplicateLoginConfirmation({
      data: {
        requiresConfirmation: true,
        message: '기존 세션을 종료하시겠습니까?',
      },
    });
    expect(result?.message).toBe('기존 세션을 종료하시겠습니까?');
  });

  it('detects signal from axios reject originalError.response.data', () => {
    const axiosLikeError = {
      status: 400,
      message: '중복 로그인',
      originalError: {
        response: {
          status: 400,
          data: {
            success: false,
            message: '다른 곳에서 로그인되어 있습니다.',
            data: {
              requiresConfirmation: true,
              responseType: 'duplicate_login_confirmation',
            },
          },
        },
      },
    };
    const result = detectDuplicateLoginConfirmation(axiosLikeError);
    expect(result).not.toBeNull();
    expect(result?.message).toBe('다른 곳에서 로그인되어 있습니다.');
  });

  it('returns null when wrapper signals failure but lacks duplicate-login flags', () => {
    expect(
      detectDuplicateLoginConfirmation({
        success: false,
        message: '아이디 또는 비밀번호가 올바르지 않습니다.',
        data: { responseType: 'normal' },
      }),
    ).toBeNull();
  });
});
