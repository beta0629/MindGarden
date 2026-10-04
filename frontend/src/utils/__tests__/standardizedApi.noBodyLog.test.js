/**
 * StandardizedApi — POST·PUT·PATCH 요청 본문(비밀번호·주민번호·카드번호)을 콘솔에 남기지 않는다.
 *
 * @author CoreSolution
 * @since 2026-10-04
 */

import { inspect } from 'util';

jest.mock('../ajax', () => ({
  apiGet: jest.fn(),
  apiPost: jest.fn().mockResolvedValue({ ok: true }),
  apiPostFormData: jest.fn(),
  apiPut: jest.fn().mockResolvedValue({ ok: true }),
  apiPatch: jest.fn().mockResolvedValue({ ok: true }),
  apiDelete: jest.fn()
}));

jest.mock('../apiHeaders', () => ({
  getDefaultApiHeaders: jest.fn(() => ({ 'Content-Type': 'application/json' })),
  getDefaultApiHeadersAsync: jest.fn(async() => ({ 'Content-Type': 'application/json' }))
}));

// eslint-disable-next-line import/first
import StandardizedApi from '../standardizedApi';
// eslint-disable-next-line import/first
import { apiPost, apiPut, apiPatch } from '../ajax';
// eslint-disable-next-line import/first
import { getDefaultApiHeadersAsync } from '../apiHeaders';

const SENSITIVE_BODY = {
  password: 'pw-body-L-55e1!',
  rrnFirst6: '900101',
  rrnLast1: '7',
  cardNumber: '4111222233334444'
};
const CONSOLE_LEVELS = ['log', 'debug', 'info', 'warn', 'error'];

describe('StandardizedApi 요청 본문 비로깅', () => {
  let spies;

  beforeEach(() => {
    getDefaultApiHeadersAsync.mockResolvedValue({ 'Content-Type': 'application/json' });
    [apiPost, apiPut, apiPatch].forEach((transport) => transport.mockResolvedValue({ ok: true }));
    spies = CONSOLE_LEVELS.map((level) => jest.spyOn(console, level).mockImplementation(() => {}));
  });

  afterEach(() => {
    spies.forEach((spy) => spy.mockRestore());
  });

  test.each([
    ['post', apiPost],
    ['put', apiPut],
    ['patch', apiPatch]
  ])('%s — 본문은 그대로 전송하고 콘솔에는 남기지 않는다', async(method, transport) => {
    await StandardizedApi[method]('/api/v1/admin/clients', SENSITIVE_BODY);

    expect(transport).toHaveBeenCalledWith('/api/v1/admin/clients', SENSITIVE_BODY, expect.any(Object));
    const output = spies
      .flatMap((spy) => spy.mock.calls)
      .map((args) => args.map((arg) => (typeof arg === 'string' ? arg : inspect(arg, { depth: 6 }))).join(' '))
      .join('\n');
    Object.values(SENSITIVE_BODY).filter((value) => value.length > 1).forEach((value) => {
      expect(output).not.toContain(value);
    });
  });
});
