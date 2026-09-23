/**
 * adminListFetch — page/size SSOT 단위 테스트.
 *
 * @author CoreSolution
 * @since 2026-09-22
 */

import StandardizedApi from '../../utils/standardizedApi';
import { API_ENDPOINTS } from '../../constants/apiEndpoints';
import {
  ADMIN_DASHBOARD_LIST_PAGE,
  ADMIN_DASHBOARD_LIST_PAGE_SIZE,
  ADMIN_SCHEDULES_TENTATIVE_PENDING_QUERY,
  API_ADMIN_SCHEDULES
} from '../../constants/adminDashboardWidgetConstants';
import { STATUS } from '../../constants/schedule';
import {
  adminClientsWithMappingGet,
  adminClientsWithStatsGet,
  adminConsultantsWithStatsGet,
  adminListGet,
  adminMappingsListGet,
  adminSchedulesListGet,
  buildAdminListParams,
  buildAdminListUrl
} from '../adminListFetch';

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

  it('adminClientsWithStatsGet — page/size 강제', async() => {
    StandardizedApi.get.mockResolvedValueOnce({ clients: [] });
    await adminClientsWithStatsGet();
    expect(StandardizedApi.get).toHaveBeenCalledWith(
      API_ENDPOINTS.ADMIN.CLIENTS.WITH_STATS,
      expect.objectContaining({ page: 0, size: 20 }),
      {}
    );
  });

  it('adminConsultantsWithStatsGet — page/size 강제', async() => {
    StandardizedApi.get.mockResolvedValueOnce({ consultants: [] });
    await adminConsultantsWithStatsGet();
    expect(StandardizedApi.get).toHaveBeenCalledWith(
      API_ENDPOINTS.ADMIN.CONSULTANTS.WITH_STATS,
      expect.objectContaining({ page: 0, size: 20 }),
      {}
    );
  });

  it('adminSchedulesListGet — 가예약 status + page/size + StandardizedApi', async() => {
    StandardizedApi.get.mockResolvedValueOnce({ schedules: [] });
    await adminSchedulesListGet(ADMIN_SCHEDULES_TENTATIVE_PENDING_QUERY);
    expect(StandardizedApi.get).toHaveBeenCalledTimes(1);
    expect(StandardizedApi.get).toHaveBeenCalledWith(
      API_ADMIN_SCHEDULES,
      expect.objectContaining({
        status: STATUS.TENTATIVE_PENDING_PAYMENT,
        page: ADMIN_DASHBOARD_LIST_PAGE,
        size: ADMIN_DASHBOARD_LIST_PAGE_SIZE
      }),
      {}
    );
    expect(API_ADMIN_SCHEDULES).toBe('/api/v1/admin/schedules');
    expect(STATUS.TENTATIVE_PENDING_PAYMENT).toBe('TENTATIVE_PENDING_PAYMENT');
  });

  it('adminSchedulesListGet — 기본 호출도 TENTATIVE_PENDING_PAYMENT + page/size', async() => {
    StandardizedApi.get.mockResolvedValueOnce({ schedules: [] });
    await adminSchedulesListGet();
    expect(StandardizedApi.get).toHaveBeenCalledWith(
      '/api/v1/admin/schedules',
      expect.objectContaining({
        status: 'TENTATIVE_PENDING_PAYMENT',
        page: 0,
        size: 20
      }),
      {}
    );
  });
});
