/**
 * 자격 증명 변경 필요 응답 판별과 모달 오픈 이벤트.
 *
 * @author CoreSolution
 * @since 2026-10-19
 */

import {
  PASSWORD_CHANGE_REQUIRED_CODE,
  PASSWORD_CHANGE_REQUIRED_EVENT,
  bodyRequiresCredentialChange,
  dispatchPasswordChangeRequired
} from '../passwordChangeRequired';

describe('bodyRequiresCredentialChange', () => {
  test('errorCode 가 PASSWORD_CHANGE_REQUIRED 일 때만 true', () => {
    expect(bodyRequiresCredentialChange({
      errorCode: PASSWORD_CHANGE_REQUIRED_CODE
    })).toBe(true);
  });

  test('null, 비객체, 다른 코드, 메시지만 있는 본문은 false', () => {
    expect(bodyRequiresCredentialChange(null)).toBe(false);
    expect(bodyRequiresCredentialChange(undefined)).toBe(false);
    expect(bodyRequiresCredentialChange(PASSWORD_CHANGE_REQUIRED_CODE)).toBe(false);
    expect(bodyRequiresCredentialChange(0)).toBe(false);
    expect(bodyRequiresCredentialChange(true)).toBe(false);
    expect(bodyRequiresCredentialChange({ errorCode: 'OTHER_CODE' })).toBe(false);
    expect(bodyRequiresCredentialChange({ message: 'required' })).toBe(false);
  });
});

describe('dispatchPasswordChangeRequired', () => {
  test('window 에 PASSWORD_CHANGE_REQUIRED_EVENT 를 보낸다', () => {
    const handler = jest.fn();
    window.addEventListener(PASSWORD_CHANGE_REQUIRED_EVENT, handler);
    try {
      dispatchPasswordChangeRequired();
      expect(handler).toHaveBeenCalledTimes(1);
    } finally {
      window.removeEventListener(PASSWORD_CHANGE_REQUIRED_EVENT, handler);
    }
  });

  test('window 가 없으면 예외 없이 반환한다', () => {
    const originalWindow = global.window;
    delete global.window;
    try {
      expect(typeof dispatchPasswordChangeRequired).toBe('function');
      expect(() => dispatchPasswordChangeRequired()).not.toThrow();
    } finally {
      global.window = originalWindow;
    }
  });
});
