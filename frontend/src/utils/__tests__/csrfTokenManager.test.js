/**
 * CSRF 비활성화(dev) 환경에서 multipart 업로드가 클라이언트에서 중단되지 않는지 검증
 */
jest.mock('../apiHeaders', () => ({
  getTenantId: jest.fn().mockResolvedValue(null)
}));

jest.mock('../../constants/api', () => ({
  API_BASE_URL: 'http://test.local'
}));

import csrfTokenManager from '../csrfTokenManager';

const CSRF_DISABLED_RESPONSE = {
  ok: true,
  json: async() => ({
    success: true,
    data: { token: '', disabled: true }
  })
};

const CSRF_ENABLED_RESPONSE = {
  ok: true,
  json: async() => ({
    success: true,
    data: { token: 'valid-csrf-token', disabled: false }
  })
};

describe('csrfTokenManager', () => {
  beforeEach(() => {
    csrfTokenManager.clearToken();
    csrfTokenManager.csrfDisabled = false;
    global.fetch = jest.fn();
  });

  test('fetchWithCsrfMultipart: CSRF disabled 시 throw 없이 fetch 진행', async() => {
    global.fetch
      .mockResolvedValueOnce(CSRF_DISABLED_RESPONSE)
      .mockResolvedValueOnce({ ok: true, status: 200 });

    const formData = new FormData();
    formData.append('file', new Blob(['x']), 'thumb.png');

    await expect(
      csrfTokenManager.fetchWithCsrfMultipart('/api/v1/admin/shop/catalog-skus/1/thumbnail', {
        method: 'POST',
        body: formData
      })
    ).resolves.toEqual({ ok: true, status: 200 });

    expect(csrfTokenManager.csrfDisabled).toBe(true);

    const uploadCall = global.fetch.mock.calls[1];
    expect(uploadCall[0]).toBe(
      'http://test.local/api/v1/admin/shop/catalog-skus/1/thumbnail'
    );
    expect(uploadCall[1].credentials).toBe('include');
    expect(uploadCall[1].headers['X-XSRF-TOKEN']).toBeUndefined();
  });

  test('fetchWithCsrfMultipart: CSRF enabled + token 없으면 throw', async() => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async() => ({
        success: true,
        data: { token: '', disabled: false }
      })
    });

    const formData = new FormData();
    formData.append('file', new Blob(['x']), 'thumb.png');

    await expect(
      csrfTokenManager.fetchWithCsrfMultipart('/api/v1/upload', {
        method: 'POST',
        body: formData
      })
    ).rejects.toThrow('보안 토큰을 확인할 수 없습니다');
  });

  test('fetchWithCsrfMultipart: CSRF enabled + 유효 token이면 X-XSRF-TOKEN 헤더 설정', async() => {
    global.fetch
      .mockResolvedValueOnce(CSRF_ENABLED_RESPONSE)
      .mockResolvedValueOnce({ ok: true, status: 200 });

    const formData = new FormData();
    formData.append('file', new Blob(['x']), 'thumb.png');

    await csrfTokenManager.fetchWithCsrfMultipart('/api/v1/upload', {
      method: 'POST',
      body: formData
    });

    const uploadCall = global.fetch.mock.calls[1];
    expect(uploadCall[1].headers['X-XSRF-TOKEN']).toBe('valid-csrf-token');
  });

  test('_fetchToken: disabled 응답 시 객체 전체를 token으로 캐시하지 않음', async() => {
    global.fetch.mockResolvedValueOnce(CSRF_DISABLED_RESPONSE);

    const token = await csrfTokenManager.refreshToken();

    expect(token).toBeNull();
    expect(csrfTokenManager.token).toBeNull();
    expect(csrfTokenManager.csrfDisabled).toBe(true);
  });
});
