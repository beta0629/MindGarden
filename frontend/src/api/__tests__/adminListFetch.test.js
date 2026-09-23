/**
 * adminListFetch — page/size SSOT 단위 테스트.
 *
 * @author CoreSolution
 * @since 2026-09-22
 */

import StandardizedApi from '../../utils/standardizedApi';
import { API_ENDPOINTS } from '../../constants/apiEndpoints';
import {
  adminClientsWithMappingGet,
  adminListGet,
  adminMappingsListGet,
  adminSchedulesListGet,
  buildAdminListParams,
  buildAdminListUrl
} from '../adminListFetch';
import {
  ADMIN_DASHBOARD_LIST_PAGE,
  ADMIN_DASHBOARD_LIST_PAGE_SIZE,
  API_ADMIN_SCHEDULES
} from '../../constants/adminDashboardWidgetConstants';
import { STATUS } from '../../constants/schedule';

jest.mock('../../utils/standardizedApi', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn()
  }
}));

describe('adminListFetch', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('buildAdminListParams — 기본값 page=0 size=20 주입', () => {
    const params = buildAdminListParams();
    expect(params.page).toBe(ADMIN_DASHBOARD_LIST_PAGE);
    expect(params.size).toBe(ADMIN_DASHBOARD_LIST_PAGE_SIZE);
    expect(params.page).toBe(0);
    expect(params.size).toBe(20);
  });

  it('buildAdminListParams — view:summary 보존 + page/size 유지', () => {
    const params = buildAdminListParams({ view: 'summary' });
    expect(params.view).toBe('summary');
    expect(params.page).toBe(0);
    expect(params.size).toBe(20);
  });

  it('buildAdminListUrl — path 의 ?view=summary 만 있어도 page+size 포함', () => {
    const url = buildAdminListUrl(
      `${API_ENDPOINTS.ADMIN.CLIENTS.WITH_MAPPING_INFO}?view=summary`
    );
    expect(url).toContain('view=summary');
    expect(url).toContain('page=0');
    expect(url).toContain('size=20');
    expect(url.startsWith(`${API_ENDPOINTS.ADMIN.CLIENTS.WITH_MAPPING_INFO}?`)).toBe(true);
  });

  it('buildAdminListUrl — page/size 절대 생략하지 않음', () => {
    const url = buildAdminListUrl(API_ENDPOINTS.ADMIN.MAPPINGS.LIST, { status: 'ACTIVE' });
    expect(url).toMatch(/[?&]page=0/);
    expect(url).toMatch(/[?&]size=20/);
    expect(url).toContain('status=ACTIVE');
  });

  it('adminListGet — path 에 ?view=summary 있으면 clean path + 병합 params', async() => {
    StandardizedApi.get.mockResolvedValueOnce({ clients: [] });
    await adminListGet(
      `${API_ENDPOINTS.ADMIN.CLIENTS.WITH_MAPPING_INFO}?view=summary`
    );
    expect(StandardizedApi.get).toHaveBeenCalledWith(
      API_ENDPOINTS.ADMIN.CLIENTS.WITH_MAPPING_INFO,
      expect.objectContaining({ view: 'summary', page: 0, size: 20 }),
      {}
    );
  });

  it('adminClientsWithMappingGet — summary + page/size', async() => {
    StandardizedApi.get.mockResolvedValueOnce({ clients: [] });
    await adminClientsWithMappingGet();
    expect(StandardizedApi.get).toHaveBeenCalledWith(
      API_ENDPOINTS.ADMIN.CLIENTS.WITH_MAPPING_INFO,
      expect.objectContaining({ view: 'summary', page: 0, size: 20 }),
      {}
    );
  });

  it('adminMappingsListGet — page/size', async() => {
    StandardizedApi.get.mockResolvedValueOnce({ mappings: [] });
    await adminMappingsListGet();
    expect(StandardizedApi.get).toHaveBeenCalledWith(
      API_ENDPOINTS.ADMIN.MAPPINGS.LIST,
      expect.objectContaining({ page: 0, size: 20 }),
      {}
    );
  });

  it('adminSchedulesListGet — TENTATIVE_PENDING_PAYMENT + page/size (never bare PENDING/TENTATIVE)', async() => {
    StandardizedApi.get.mockResolvedValueOnce({ content: [] });
    await adminSchedulesListGet();
    expect(StandardizedApi.get).toHaveBeenCalledWith(
      API_ADMIN_SCHEDULES,
      expect.objectContaining({
        status: STATUS.TENTATIVE_PENDING_PAYMENT,
        page: 0,
        size: 20
      }),
      {}
    );
    const [, params] = StandardizedApi.get.mock.calls[0];
    expect(params.status).toBe('TENTATIVE_PENDING_PAYMENT');
    expect(params.status).not.toBe('PENDING');
    expect(params.status).not.toBe('TENTATIVE');
    expect(params.status).not.toBe('BOOKED');
  });
});
