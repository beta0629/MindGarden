jest.mock('expo-constants', () => ({
  __esModule: true,
  default: {
    expoConfig: {
      extra: {},
    },
  },
}));

jest.mock('@/config/apiBaseUrl', () => ({
  getApiBaseUrl: jest.fn(() => 'https://api.mindgarden.example.com/api/v1'),
}));

describe('buildAdminWebUrl', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
    delete process.env.EXPO_PUBLIC_WEB_BASE_URL;
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('combines EXPO_PUBLIC_WEB_BASE_URL with relative admin path', async () => {
    process.env.EXPO_PUBLIC_WEB_BASE_URL = 'https://mindgarden.dev.core-solution.co.kr/';
    const { buildAdminWebUrl } = await import('@/config/webBaseUrl');
    expect(buildAdminWebUrl('/admin/integrated-schedule')).toBe(
      'https://mindgarden.dev.core-solution.co.kr/admin/integrated-schedule',
    );
  });

  it('prefixes path when relativePath omits leading slash', async () => {
    process.env.EXPO_PUBLIC_WEB_BASE_URL = 'https://mindgarden.dev.core-solution.co.kr';
    const { buildAdminWebUrl } = await import('@/config/webBaseUrl');
    expect(buildAdminWebUrl('admin/mapping-management')).toBe(
      'https://mindgarden.dev.core-solution.co.kr/admin/mapping-management',
    );
  });

  it('falls back to API origin when web base env is unset', async () => {
    const { buildAdminWebUrl } = await import('@/config/webBaseUrl');
    expect(buildAdminWebUrl('/admin/integrated-schedule')).toBe(
      'https://api.mindgarden.example.com/admin/integrated-schedule',
    );
  });
});
