/**
 * StandardizedApi.handleError — HTTP 5xx 메시지·status 유지
 *
 * @author CoreSolution
 * @since 2026-09-26
 */

import { API_ERROR_MESSAGES, API_STATUS } from '../../constants/api';
import StandardizedApi from '../standardizedApi';

describe('StandardizedApi.handleError 5xx', () => {
  test('status 500 은 SERVER_ERROR 메시지를 유지하고 status 를 붙인다', () => {
    const src = new Error(API_ERROR_MESSAGES.SERVER_ERROR);
    src.status = API_STATUS.INTERNAL_SERVER_ERROR;

    const out = StandardizedApi.handleError(src, '/api/v1/clients/settings', 'GET');

    expect(out).toBeInstanceOf(Error);
    expect(out.status).toBe(API_STATUS.INTERNAL_SERVER_ERROR);
    expect(out.message).toBe(API_ERROR_MESSAGES.SERVER_ERROR);
    expect(out.message).not.toBe(API_ERROR_MESSAGES.NETWORK_ERROR);
  });

  test('status 502/503 도 5xx 분기로 status 를 유지한다', () => {
    const src502 = new Error(API_ERROR_MESSAGES.SERVER_ERROR);
    src502.status = 502;
    const out502 = StandardizedApi.handleError(src502, '/api/v1/clients/settings', 'GET');
    expect(out502.status).toBe(502);
    expect(out502.message).toBe(API_ERROR_MESSAGES.SERVER_ERROR);

    const src503 = new Error(API_ERROR_MESSAGES.SERVER_ERROR);
    src503.status = 503;
    const out503 = StandardizedApi.handleError(src503, '/api/v1/clients/settings', 'PUT');
    expect(out503.status).toBe(503);
    expect(out503.message).toBe(API_ERROR_MESSAGES.SERVER_ERROR);
  });
});
