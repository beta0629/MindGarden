/**
 * SCT 본인확인 필요 오류 판별
 *
 * @author MindGarden
 * @since 2026-03-27
 */

import { isSctVerifyRequiredError } from '../sctPublicVerifyError';
import { SCT_ERROR_CODE } from '../../constants/sctOnline';

describe('isSctVerifyRequiredError', () => {
  it('detects errorCode SCT_VERIFY_REQUIRED', () => {
    const error = {
      status: 401,
      response: {
        data: {
          errorCode: SCT_ERROR_CODE.VERIFY_REQUIRED,
          message: '본인 확인이 필요합니다.'
        }
      }
    };
    expect(isSctVerifyRequiredError(error)).toBe(true);
  });

  it('detects message hint', () => {
    expect(isSctVerifyRequiredError({
      message: '본인 확인이 필요합니다.'
    })).toBe(true);
  });

  it('rejects unrelated errors', () => {
    expect(isSctVerifyRequiredError(null)).toBe(false);
    expect(isSctVerifyRequiredError({
      status: 400,
      response: { data: { errorCode: 'ILLEGAL_ARGUMENT', message: '잘못된 요청' } }
    })).toBe(false);
  });
});
