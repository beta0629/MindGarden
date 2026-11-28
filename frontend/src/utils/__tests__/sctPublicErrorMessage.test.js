/**
 * SCT 공개 화면 오류 문구 매핑 — 영문 원문 차단, 남은 대기 시간
 *
 * @author MindGarden
 * @since 2026-11-28
 */

import { SCT_ERROR_CODE, SCT_UI } from '../../constants/sctOnline';
import {
  getSctRetryAfterSeconds,
  isSctLinkCancelledError,
  isSctLinkReissuedError,
  resolveSctPublicErrorMessage
} from '../sctPublicVerifyError';

const err = (status, errorCode, message, data) => ({
  message,
  status,
  response: { status, data: { errorCode, message, ...(data ? { data } : {}) } }
});

describe('resolveSctPublicErrorMessage', () => {
  it('영문·예외 원문은 한글 fallback 으로 대체', () => {
    const out = resolveSctPublicErrorMessage(err(400, 'ILLEGAL_STATE', 'Session was invalidated'), '실패했습니다');
    expect(out).toBe('실패했습니다');
    expect(/Session/.test(out)).toBe(false);
  });

  it('코드 → 한글 문구', () => {
    expect(resolveSctPublicErrorMessage(err(400, SCT_ERROR_CODE.SESSION_INVALIDATED, 'x')))
      .toBe(SCT_UI.ERR_SESSION_INVALIDATED);
    expect(resolveSctPublicErrorMessage(err(410, SCT_ERROR_CODE.LINK_CANCELLED, 'x')))
      .toBe(SCT_UI.CANCELLED_BODY);
    expect(resolveSctPublicErrorMessage(err(400, SCT_ERROR_CODE.OTP_INVALID, 'English')))
      .toBe(SCT_UI.ERR_OTP_INVALID);
  });

  it('429 남은 초 → 초/분 안내', () => {
    expect(resolveSctPublicErrorMessage(
      err(429, SCT_ERROR_CODE.OTP_RATE_LIMITED, 'x', { retryAfterSeconds: 30 })))
      .toContain('30초 뒤');
    expect(resolveSctPublicErrorMessage(
      err(429, SCT_ERROR_CODE.OTP_LOCKED, 'x', { retryAfterSeconds: 601 })))
      .toContain('약 11분 뒤');
    expect(getSctRetryAfterSeconds(err(429, SCT_ERROR_CODE.OTP_RATE_LIMITED, 'x'))).toBeNull();
  });

  it('재발급 코드 → 재발급 전용 한글 문구(만료 문구 아님)', () => {
    const e = err(410, SCT_ERROR_CODE.LINK_REISSUED, 'x');
    expect(isSctLinkReissuedError(e)).toBe(true);
    expect(isSctLinkReissuedError(err(410, SCT_ERROR_CODE.GONE, 'x'))).toBe(false);
    expect(resolveSctPublicErrorMessage(e)).toBe(SCT_UI.ERR_LINK_REISSUED);
  });

  it('취소 판별', () => {
    expect(isSctLinkCancelledError(err(410, SCT_ERROR_CODE.LINK_CANCELLED, 'x'))).toBe(true);
    expect(isSctLinkCancelledError(err(410, SCT_ERROR_CODE.GONE, 'x'))).toBe(false);
  });
});
