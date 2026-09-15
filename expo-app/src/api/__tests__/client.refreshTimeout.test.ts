/**
 * apiClient — refresh timeout 전달·실패 시 큐 해제·performSignOut 호출.
 *
 * @author MindGarden
 * @since 2026-05-12
 */

(globalThis as unknown as { __DEV__: boolean }).__DEV__ = false;

const axiosPostMock = jest.fn();
const axiosCreateMock = jest.fn();

jest.mock('axios', () => {
  const actual = jest.requireActual<typeof import('axios')>('axios');
  return {
    __esModule: true,
    ...actual,
    default: {
      ...actual.default,
      post: (...args: unknown[]) => axiosPostMock(...args),
      create: (...args: unknown[]) => axiosCreateMock(...args),
      isAxiosError: actual.isAxiosError,
    },
    create: (...args: unknown[]) => axiosCreateMock(...args),
    post: (...args: unknown[]) => axiosPostMock(...args),
  };
});

jest.mock('react-native', () => ({
  Platform: { OS: 'ios' },
}));

jest.mock('@/config/apiBaseUrl', () => ({
  getApiBaseUrl: () => 'https://api.test.mindgarden',
}));

jest.mock('@/utils/sessionCookie', () => ({
  formatJsessionCookieHeader: jest.fn().mockReturnValue(null),
  hydrateJsessionCacheFromSecureStore: jest.fn().mockResolvedValue(undefined),
  peekCachedJsessionId: jest.fn().mockReturnValue(null),
}));

jest.mock('@/utils/resolveTenantIdForApi', () => ({
  resolveTenantIdForApi: jest.fn().mockReturnValue('tenant-test'),
}));

jest.mock('@/utils/syncTenantFromAccessToken', () => ({
  syncTenantFromAccessToken: jest.fn(),
}));

const updateTokensMock = jest.fn().mockResolvedValue(undefined);
let mockRefreshToken: string | null = 'refresh-token-1';
let mockAccessToken: string | null = 'access-token-1';

jest.mock('@/stores/useAuthStore', () => ({
  useAuthStore: {
    getState: () => ({
      accessToken: mockAccessToken,
      refreshToken: mockRefreshToken,
      updateTokens: updateTokensMock,
      logout: jest.fn().mockResolvedValue(undefined),
    }),
  },
}));

const performSignOutMock = jest.fn().mockResolvedValue(undefined);
jest.mock('@/services/auth/performSignOut', () => ({
  performSignOut: (...args: unknown[]) => performSignOutMock(...args),
}));

import { AxiosHeaders, type InternalAxiosRequestConfig } from 'axios';
import { REFRESH_TOKEN_TIMEOUT_MS } from '@/constants/apiClientTimeout';

type InterceptorErrorHandler = (error: unknown) => Promise<unknown>;

type ClientTestModule = {
  extractTokensFromRefreshBody: (body: unknown) => {
    accessToken?: string;
    refreshToken?: string;
  };
  __getRefreshGateStateForTests: () => { isRefreshing: boolean; queueLength: number };
  __resetRefreshGateForTests: () => void;
  REFRESH_TOKEN_TIMEOUT_MS: number;
};

function buildUnauthorizedError(url = '/api/v1/schedules') {
  const config = {
    url,
    baseURL: 'https://api.test.mindgarden',
    headers: new AxiosHeaders(),
  } as InternalAxiosRequestConfig & { _retry?: boolean };

  return {
    isAxiosError: true,
    config,
    response: { status: 401, data: { message: 'unauthorized' } },
    message: 'Request failed with status code 401',
    name: 'AxiosError',
    toJSON: () => ({}),
  };
}

async function loadClientModule(): Promise<{
  mod: ClientTestModule;
  responseErrorHandler: InterceptorErrorHandler;
}> {
  let responseErrorHandler: InterceptorErrorHandler = async () => undefined;

  axiosCreateMock.mockImplementation(() => {
    const inst = {
      get: jest.fn(),
      post: jest.fn(),
      interceptors: {
        request: { use: jest.fn() },
        response: {
          use: jest.fn((_ok: unknown, onRejected: InterceptorErrorHandler) => {
            responseErrorHandler = onRejected;
            return 0;
          }),
        },
      },
      defaults: {},
    };
    return Object.assign(jest.fn().mockResolvedValue({ ok: true }), inst);
  });

  let mod!: ClientTestModule;
  await jest.isolateModulesAsync(async () => {
    mod = (await import('../client')) as ClientTestModule;
  });

  return { mod, responseErrorHandler };
}

describe('apiClient refresh hang / timeout', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRefreshToken = 'refresh-token-1';
    mockAccessToken = 'access-token-1';
    performSignOutMock.mockResolvedValue(undefined);
    updateTokensMock.mockResolvedValue(undefined);
  });

  it('extractTokensFromRefreshBody — data 래핑·token 폴백', async () => {
    const { mod } = await loadClientModule();
    expect(
      mod.extractTokensFromRefreshBody({
        data: { accessToken: 'a', refreshToken: 'r' },
      }),
    ).toEqual({ accessToken: 'a', refreshToken: 'r' });

    expect(
      mod.extractTokensFromRefreshBody({
        token: 't',
        refreshToken: 'r2',
      }),
    ).toEqual({ accessToken: 't', refreshToken: 'r2' });
  });

  it('REFRESH_TOKEN_TIMEOUT_MS 상수가 apiClientTimeout 과 일치한다', async () => {
    const { mod } = await loadClientModule();
    expect(mod.REFRESH_TOKEN_TIMEOUT_MS).toBe(REFRESH_TOKEN_TIMEOUT_MS);
  });

  it('refresh axios.post 에 timeout 옵션을 전달한다', async () => {
    const { responseErrorHandler } = await loadClientModule();

    axiosPostMock.mockResolvedValue({
      data: { accessToken: 'new-a', refreshToken: 'new-r' },
    });

    await responseErrorHandler(buildUnauthorizedError()).catch(() => undefined);

    expect(axiosPostMock).toHaveBeenCalled();
    const refreshConfig = axiosPostMock.mock.calls[0]?.[2] as { timeout?: number };
    expect(refreshConfig?.timeout).toBe(REFRESH_TOKEN_TIMEOUT_MS);
  });

  it('refresh 실패 시 failedQueue 를 비우고 performSignOut 을 호출한다', async () => {
    const { mod, responseErrorHandler } = await loadClientModule();

    let rejectRefresh!: (err: Error) => void;
    axiosPostMock.mockImplementation(
      () =>
        new Promise((_, reject) => {
          rejectRefresh = reject as (err: Error) => void;
        }),
    );

    const first = responseErrorHandler(buildUnauthorizedError('/api/v1/schedules/paged'));
    const queued = responseErrorHandler(
      buildUnauthorizedError('/api/v1/admin/clients/mappings'),
    );

    expect(mod.__getRefreshGateStateForTests().isRefreshing).toBe(true);
    expect(mod.__getRefreshGateStateForTests().queueLength).toBe(1);

    rejectRefresh(Object.assign(new Error('timeout of 30000ms exceeded'), {
      code: 'ECONNABORTED',
    }));

    await expect(first).rejects.toBeTruthy();
    await expect(queued).rejects.toBeTruthy();

    expect(performSignOutMock).toHaveBeenCalled();
    expect(mod.__getRefreshGateStateForTests()).toEqual({
      isRefreshing: false,
      queueLength: 0,
    });
  });

  it('refreshToken 부재 시 POST 없이 큐 해제·signOut', async () => {
    mockRefreshToken = null;
    const { mod, responseErrorHandler } = await loadClientModule();

    await expect(responseErrorHandler(buildUnauthorizedError())).rejects.toBeTruthy();

    expect(axiosPostMock).not.toHaveBeenCalled();
    expect(performSignOutMock).toHaveBeenCalled();
    expect(mod.__getRefreshGateStateForTests()).toEqual({
      isRefreshing: false,
      queueLength: 0,
    });
  });
});
