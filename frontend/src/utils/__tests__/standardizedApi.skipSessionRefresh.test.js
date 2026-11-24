/**
 * StandardizedApi — skipSessionRefresh 가 GET/PUT/DELETE 등에서도 헤더 조립에 반영되는지.
 *
 * @author MindGarden
 * @since 2026-11-24
 */

jest.mock('../ajax', () => ({
  apiGet: jest.fn().mockResolvedValue({ ok: true }),
  apiPost: jest.fn().mockResolvedValue({ ok: true }),
  apiPostFormData: jest.fn().mockResolvedValue({ ok: true }),
  apiPut: jest.fn().mockResolvedValue({ ok: true }),
  apiPatch: jest.fn().mockResolvedValue({ ok: true }),
  apiDelete: jest.fn().mockResolvedValue({ ok: true })
}));

jest.mock('../apiHeaders', () => ({
  getDefaultApiHeaders: jest.fn(() => ({ 'Content-Type': 'application/json' })),
  getDefaultApiHeadersAsync: jest.fn(async() => ({ 'Content-Type': 'application/json' }))
}));

// eslint-disable-next-line import/first
import StandardizedApi from '../standardizedApi';
// eslint-disable-next-line import/first
import { apiGet, apiPut, apiDelete, apiPatch } from '../ajax';
// eslint-disable-next-line import/first
import { getDefaultApiHeadersAsync } from '../apiHeaders';

describe('StandardizedApi skipSessionRefresh', () => {
  beforeEach(() => {
    getDefaultApiHeadersAsync.mockClear();
    getDefaultApiHeadersAsync.mockResolvedValue({ 'Content-Type': 'application/json' });
    [apiGet, apiPut, apiDelete, apiPatch].forEach((fn) => fn.mockClear());
  });

  test('GET skipSessionRefresh:true → getDefaultApiHeadersAsync forceRefresh=false', async() => {
    await StandardizedApi.get('/api/v1/public/sct/tok/meta', {}, { skipSessionRefresh: true });
    expect(getDefaultApiHeadersAsync).toHaveBeenCalledWith({}, false);
    expect(apiGet).toHaveBeenCalled();
  });

  test('GET 기본 → getDefaultApiHeadersAsync forceRefresh=true', async() => {
    await StandardizedApi.get('/api/v1/sct/invitations');
    expect(getDefaultApiHeadersAsync).toHaveBeenCalledWith({}, true);
  });

  test('PUT·PATCH·DELETE skipSessionRefresh:true → forceRefresh=false', async() => {
    await StandardizedApi.put('/api/v1/public/sct/tok/draft', {}, { skipSessionRefresh: true });
    await StandardizedApi.patch('/api/v1/public/sct/tok/x', {}, { skipSessionRefresh: true });
    await StandardizedApi.delete('/api/v1/public/sct/tok/x', { skipSessionRefresh: true });
    expect(getDefaultApiHeadersAsync).toHaveBeenNthCalledWith(1, {}, false);
    expect(getDefaultApiHeadersAsync).toHaveBeenNthCalledWith(2, {}, false);
    expect(getDefaultApiHeadersAsync).toHaveBeenNthCalledWith(3, {}, false);
  });
});
