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
  API_ADMIN_SCHEDULES,
  API_SCHEDULE_CONTROLLER_ADMIN
} from '../../constants/adminDashboardWidgetConstants';
import { STATUS } from '../../constants/schedule';
import {
  ADMIN_LIST_FETCH_MARKER,
  adminClientsWithMappingGet,
  adminClientsWithMappingGetAll,
  adminClientsWithStatsGet,
  adminConsultantsWithStatsGet,
  adminListGet,
  adminListGetAllPages,
  adminMappingsListGet,
  adminMappingsListGetAll,
  adminSchedulesListGet,
  adminSchedulesListGetAll,
  adminScheduleControllerListGetAll,
  buildAdminListParams,
  buildAdminListUrl,
  ADMIN_LIST_DRAIN_PAGE_SIZE,
  adminPendingPaymentMappingsGetAll,
  adminPendingDepositMappingsGet,
  adminPendingDepositMappingsGetAll,
  adminSessionExtensionPendingPaymentGetAll
} from '../adminListFetch';

const pendingFns = {
  adminPendingPaymentMappingsGetAll,
  adminPendingDepositMappingsGet,
  adminPendingDepositMappingsGetAll,
  adminSessionExtensionPendingPaymentGetAll
};

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

  it('ADMIN_LIST_FETCH_MARKER — P0 schedules/admin page+size harden', () => {
    expect(ADMIN_LIST_FETCH_MARKER).toBe('p0-schedules-admin-page-size-20260924');
  });

  it('buildAdminListParams — 기본값 page=0 size=20 주입', () => {
    const params = buildAdminListParams();
    expect(params.page).toBe(ADMIN_DASHBOARD_LIST_PAGE);
    expect(params.size).toBe(ADMIN_DASHBOARD_LIST_PAGE_SIZE);
    expect(params.page).toBe(0);
    expect(params.size).toBe(20);
    expect(typeof params.page).toBe('number');
    expect(typeof params.size).toBe('number');
  });

  it('buildAdminListParams — null/empty/NaN page·size → numeric 기본값', () => {
    expect(buildAdminListParams({ page: null, size: '' })).toEqual(
      expect.objectContaining({ page: 0, size: 20 })
    );
    expect(buildAdminListParams({ page: 'abc', size: NaN })).toEqual(
      expect.objectContaining({ page: 0, size: 20 })
    );
    const coerced = buildAdminListParams({ page: '2', size: '50' });
    expect(coerced.page).toBe(2);
    expect(coerced.size).toBe(50);
    expect(typeof coerced.page).toBe('number');
    expect(typeof coerced.size).toBe('number');
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

  it('adminListGet — schedules/admin 첫 요청 params 에 numeric page+size 보장', async() => {
    StandardizedApi.get.mockResolvedValueOnce({ schedules: [] });
    await adminListGet(API_SCHEDULE_CONTROLLER_ADMIN, {
      startDate: '2026-09-01',
      endDate: '2026-09-30',
      _t: 'k1'
    });
    expect(StandardizedApi.get).toHaveBeenCalledTimes(1);
    const [path, params] = StandardizedApi.get.mock.calls[0];
    expect(path).toBe(API_SCHEDULE_CONTROLLER_ADMIN);
    expect(params.page).toBe(0);
    expect(params.size).toBe(20);
    expect(typeof params.page).toBe('number');
    expect(typeof params.size).toBe('number');
    expect(Object.prototype.hasOwnProperty.call(params, 'page')).toBe(true);
    expect(Object.prototype.hasOwnProperty.call(params, 'size')).toBe(true);
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

  describe('adminListGetAllPages / adminMappingsListGetAll / adminSchedulesListGetAll / adminClientsWithMappingGetAll', () => {
    const mappingId = (n) => ({ id: n, mappingId: n });
    const scheduleId = (n) => ({ id: n, scheduleId: n, status: 'TENTATIVE_PENDING_PAYMENT' });
    const clientId = (n) => ({ id: n, name: `client-${n}` });

    it('adminMappingsListGetAll — page 단위 drain (size=total 단일 전체 조회 금지)', async() => {
      const total = ADMIN_LIST_DRAIN_PAGE_SIZE + 45;
      const page0 = Array.from({ length: ADMIN_LIST_DRAIN_PAGE_SIZE }, (_, i) => mappingId(i + 1));
      const page1 = Array.from({ length: 45 }, (_, i) => mappingId(ADMIN_LIST_DRAIN_PAGE_SIZE + i + 1));
      StandardizedApi.get
        .mockResolvedValueOnce({ mappings: page0, count: total, page: 0, size: ADMIN_LIST_DRAIN_PAGE_SIZE })
        .mockResolvedValueOnce({ mappings: page1, count: total, page: 1, size: ADMIN_LIST_DRAIN_PAGE_SIZE });

      const result = await adminMappingsListGetAll();

      expect(result.mappings).toHaveLength(total);
      expect(result.count).toBe(total);
      expect(StandardizedApi.get).toHaveBeenCalledTimes(2);
      expect(StandardizedApi.get).toHaveBeenNthCalledWith(
        2,
        API_ENDPOINTS.ADMIN.MAPPINGS.LIST,
        expect.objectContaining({ page: 1, size: ADMIN_LIST_DRAIN_PAGE_SIZE }),
        {}
      );
      StandardizedApi.get.mock.calls.forEach(([, params]) => {
        expect(params.size).toBeLessThanOrEqual(ADMIN_LIST_DRAIN_PAGE_SIZE);
        expect(params.size).not.toBe(total);
      });
    });

    it('adminMappingsListGetAll — size always forced even if extra omits size', async() => {
      StandardizedApi.get.mockResolvedValueOnce({
        mappings: Array.from({ length: 3 }, (_, i) => mappingId(i + 1)),
        count: 3,
        page: 0,
        size: ADMIN_LIST_DRAIN_PAGE_SIZE
      });

      await adminMappingsListGetAll({ page: 0 });

      expect(StandardizedApi.get).toHaveBeenCalledTimes(1);
      const params = StandardizedApi.get.mock.calls[0][1];
      expect(params.size).toBe(ADMIN_LIST_DRAIN_PAGE_SIZE);
      expect(params.page).toBe(0);
      expect(Object.prototype.hasOwnProperty.call(params, 'size')).toBe(true);
      expect(Object.prototype.hasOwnProperty.call(params, 'page')).toBe(true);
    });

    it('adminMappingsListGetAll — single page short-circuit when count fits one page', async() => {
      const items = Array.from({ length: 5 }, (_, i) => mappingId(i + 1));
      StandardizedApi.get.mockResolvedValueOnce({
        mappings: items,
        count: 5,
        page: 0,
        size: ADMIN_LIST_DRAIN_PAGE_SIZE
      });

      const result = await adminMappingsListGetAll();

      expect(result.mappings).toHaveLength(5);
      expect(result.count).toBe(5);
      expect(StandardizedApi.get).toHaveBeenCalledTimes(1);
      expect(StandardizedApi.get).toHaveBeenCalledWith(
        API_ENDPOINTS.ADMIN.MAPPINGS.LIST,
        expect.objectContaining({ page: 0, size: ADMIN_LIST_DRAIN_PAGE_SIZE }),
        {}
      );
    });

    it('adminSchedulesListGetAll — page 단위 drain (size=total 단일 전체 조회 금지)', async() => {
      const total = ADMIN_LIST_DRAIN_PAGE_SIZE + 45;
      const page0 = Array.from({ length: ADMIN_LIST_DRAIN_PAGE_SIZE }, (_, i) => scheduleId(i + 1));
      const page1 = Array.from({ length: 45 }, (_, i) => scheduleId(ADMIN_LIST_DRAIN_PAGE_SIZE + i + 1));
      StandardizedApi.get
        .mockResolvedValueOnce({ schedules: page0, count: total, page: 0, size: ADMIN_LIST_DRAIN_PAGE_SIZE })
        .mockResolvedValueOnce({ schedules: page1, count: total, page: 1, size: ADMIN_LIST_DRAIN_PAGE_SIZE });

      const result = await adminSchedulesListGetAll();

      expect(result.schedules).toHaveLength(total);
      expect(result.count).toBe(total);
      expect(StandardizedApi.get).toHaveBeenCalledTimes(2);
      expect(StandardizedApi.get).toHaveBeenNthCalledWith(
        1,
        API_ADMIN_SCHEDULES,
        expect.objectContaining({
          status: STATUS.TENTATIVE_PENDING_PAYMENT,
          page: 0,
          size: ADMIN_LIST_DRAIN_PAGE_SIZE
        }),
        {}
      );
      expect(StandardizedApi.get).toHaveBeenNthCalledWith(
        2,
        API_ADMIN_SCHEDULES,
        expect.objectContaining({ page: 1, size: ADMIN_LIST_DRAIN_PAGE_SIZE }),
        {}
      );
    });

    it('adminSchedulesListGetAll — size always forced even if extra omits size', async() => {
      StandardizedApi.get.mockResolvedValueOnce({
        schedules: Array.from({ length: 3 }, (_, i) => scheduleId(i + 1)),
        count: 3,
        page: 0,
        size: ADMIN_LIST_DRAIN_PAGE_SIZE
      });

      await adminSchedulesListGetAll({ page: 0 });

      expect(StandardizedApi.get).toHaveBeenCalledTimes(1);
      const params = StandardizedApi.get.mock.calls[0][1];
      expect(params.size).toBe(ADMIN_LIST_DRAIN_PAGE_SIZE);
      expect(params.page).toBe(0);
      expect(Object.prototype.hasOwnProperty.call(params, 'size')).toBe(true);
      expect(Object.prototype.hasOwnProperty.call(params, 'page')).toBe(true);
    });

    it('adminSchedulesListGetAll — forwards startDate/endDate extras (IMS month scope)', async() => {
      StandardizedApi.get.mockResolvedValueOnce({
        schedules: Array.from({ length: 2 }, (_, i) => scheduleId(i + 1)),
        count: 2,
        page: 0,
        size: ADMIN_LIST_DRAIN_PAGE_SIZE
      });

      await adminSchedulesListGetAll({
        startDate: '2026-09-01',
        endDate: '2026-09-30'
      });

      expect(StandardizedApi.get).toHaveBeenCalledTimes(1);
      expect(StandardizedApi.get).toHaveBeenCalledWith(
        API_ADMIN_SCHEDULES,
        expect.objectContaining({
          status: STATUS.TENTATIVE_PENDING_PAYMENT,
          page: 0,
          size: ADMIN_LIST_DRAIN_PAGE_SIZE,
          startDate: '2026-09-01',
          endDate: '2026-09-30'
        }),
        {}
      );
    });

    it('ADMIN_LIST_FETCH_MARKER — P0 schedules/admin page+size harden', () => {
      expect(ADMIN_LIST_FETCH_MARKER).toBe('p0-schedules-admin-page-size-20260924');
    });

    it('adminClientsWithMappingGetAll — first request size=ADMIN_LIST_DRAIN_PAGE_SIZE when caller omits size', async() => {
      StandardizedApi.get.mockResolvedValueOnce({
        clients: Array.from({ length: 3 }, (_, i) => clientId(i + 1)),
        count: 3,
        page: 0,
        size: ADMIN_LIST_DRAIN_PAGE_SIZE
      });

      await adminClientsWithMappingGetAll();

      expect(StandardizedApi.get).toHaveBeenNthCalledWith(
        1,
        API_ENDPOINTS.ADMIN.CLIENTS.WITH_MAPPING_INFO,
        expect.objectContaining({ view: 'summary', page: 0, size: ADMIN_LIST_DRAIN_PAGE_SIZE }),
        {}
      );
      expect(StandardizedApi.get.mock.calls[0][1].size).not.toBe(20);
    });

    it('adminClientsWithMappingGetAll — BE truncate(20/73) 이어도 size=total 요청 없이 page drain', async() => {
      const page0 = Array.from({ length: 20 }, (_, i) => clientId(i + 1));
      const page1 = Array.from({ length: 20 }, (_, i) => clientId(i + 21));
      const page2 = Array.from({ length: 20 }, (_, i) => clientId(i + 41));
      const page3 = Array.from({ length: 13 }, (_, i) => clientId(i + 61));
      StandardizedApi.get
        .mockResolvedValueOnce({ clients: page0, count: 73, page: 0, size: 20 })
        .mockResolvedValueOnce({ clients: page1, count: 73, page: 1, size: 20 })
        .mockResolvedValueOnce({ clients: page2, count: 73, page: 2, size: 20 })
        .mockResolvedValueOnce({ clients: page3, count: 73, page: 3, size: 20 });

      const result = await adminClientsWithMappingGetAll();

      expect(result.clients).toHaveLength(73);
      expect(result.clients.length).toBe(result.count);
      expect(StandardizedApi.get).toHaveBeenCalledTimes(4);
      StandardizedApi.get.mock.calls.forEach(([, params]) => {
        expect(params.size).not.toBe(73);
        expect(params.size).toBeLessThanOrEqual(ADMIN_LIST_DRAIN_PAGE_SIZE);
      });
    });

    it('adminClientsWithMappingGetAll — nested data.clients + prefer count over wrong totalElements', async() => {
      const page0 = Array.from({ length: 20 }, (_, i) => clientId(i + 1));
      const page1 = Array.from({ length: 20 }, (_, i) => clientId(i + 21));
      StandardizedApi.get
        .mockResolvedValueOnce({ data: { clients: page0, count: 40 }, totalElements: 20, page: 0, size: 20 })
        .mockResolvedValueOnce({ data: { clients: page1, count: 40 }, totalElements: 20, page: 1, size: 20 });

      const result = await adminClientsWithMappingGetAll();

      expect(result.clients).toHaveLength(40);
      expect(result.count).toBe(40);
      expect(StandardizedApi.get).toHaveBeenCalledTimes(2);
      expect(StandardizedApi.get).toHaveBeenNthCalledWith(
        2,
        API_ENDPOINTS.ADMIN.CLIENTS.WITH_MAPPING_INFO,
        expect.objectContaining({ page: 1, size: 20 }),
        {}
      );
    });

    it('adminClientsWithMappingGetAll — 45건 page drain (마지막 짧은 페이지에서 종료)', async() => {
      const page0 = Array.from({ length: 20 }, (_, i) => clientId(i + 1));
      const page1 = Array.from({ length: 20 }, (_, i) => clientId(i + 21));
      const page2 = Array.from({ length: 5 }, (_, i) => clientId(i + 41));
      StandardizedApi.get
        .mockResolvedValueOnce({ clients: page0, count: 45, page: 0, size: 20 })
        .mockResolvedValueOnce({ clients: page1, count: 45, page: 1, size: 20 })
        .mockResolvedValueOnce({ clients: page2, count: 45, page: 2, size: 20 });

      const result = await adminClientsWithMappingGetAll();

      expect(result.clients).toHaveLength(45);
      expect(result.count).toBe(45);
      expect(StandardizedApi.get).toHaveBeenCalledTimes(3);
      expect(StandardizedApi.get).toHaveBeenNthCalledWith(
        3,
        API_ENDPOINTS.ADMIN.CLIENTS.WITH_MAPPING_INFO,
        expect.objectContaining({ page: 2, size: 20 }),
        {}
      );
    });

    it('adminClientsWithMappingGetAll — explicit extra.size is respected (not force-overwritten)', async() => {
      StandardizedApi.get.mockResolvedValueOnce({
        clients: Array.from({ length: 3 }, (_, i) => clientId(i + 1)),
        count: 3,
        page: 0,
        size: 100
      });

      await adminClientsWithMappingGetAll({ size: 100 });

      expect(StandardizedApi.get).toHaveBeenCalledTimes(1);
      const params = StandardizedApi.get.mock.calls[0][1];
      expect(params.size).toBe(100);
      expect(params.size).not.toBe(ADMIN_LIST_DRAIN_PAGE_SIZE);
      expect(params.page).toBe(0);
      expect(params.view).toBe('summary');
    });

    it('adminClientsWithMappingGetAll — size always forced even if extra omits size', async() => {
      StandardizedApi.get.mockResolvedValueOnce({
        clients: Array.from({ length: 3 }, (_, i) => clientId(i + 1)),
        count: 3,
        page: 0,
        size: 500
      });

      await adminClientsWithMappingGetAll({ page: 0 });

      expect(StandardizedApi.get).toHaveBeenCalledTimes(1);
      const params = StandardizedApi.get.mock.calls[0][1];
      expect(params.size).toBe(ADMIN_LIST_DRAIN_PAGE_SIZE);
      expect(params.page).toBe(0);
      expect(params.view).toBe('summary');
      expect(Object.prototype.hasOwnProperty.call(params, 'size')).toBe(true);
      expect(Object.prototype.hasOwnProperty.call(params, 'page')).toBe(true);
    });


    it('adminScheduleControllerListGetAll — drains /api/v1/schedules/admin (not AdminController)', async() => {
      const total = ADMIN_LIST_DRAIN_PAGE_SIZE + 23;
      const page0 = Array.from({ length: ADMIN_LIST_DRAIN_PAGE_SIZE }, (_, i) => scheduleId(i + 1));
      const page1 = Array.from({ length: 23 }, (_, i) => scheduleId(ADMIN_LIST_DRAIN_PAGE_SIZE + i + 1));
      StandardizedApi.get
        .mockResolvedValueOnce({
          schedules: page0,
          count: total,
          page: 0,
          size: ADMIN_LIST_DRAIN_PAGE_SIZE
        })
        .mockResolvedValueOnce({
          schedules: page1,
          count: total,
          page: 1,
          size: ADMIN_LIST_DRAIN_PAGE_SIZE
        });

      const result = await adminScheduleControllerListGetAll({
        startDate: '2026-09-01',
        endDate: '2026-09-30',
        _t: 'c1_2026-09-01_2026-09-30_0'
      });

      expect(result.schedules).toHaveLength(total);
      expect(result.count).toBe(total);
      expect(StandardizedApi.get).toHaveBeenCalledTimes(2);
      expect(StandardizedApi.get).toHaveBeenNthCalledWith(
        1,
        API_SCHEDULE_CONTROLLER_ADMIN,
        expect.objectContaining({
          page: 0,
          size: ADMIN_LIST_DRAIN_PAGE_SIZE,
          startDate: '2026-09-01',
          endDate: '2026-09-30',
          _t: 'c1_2026-09-01_2026-09-30_0'
        }),
        {}
      );
      expect(StandardizedApi.get).toHaveBeenNthCalledWith(
        2,
        API_SCHEDULE_CONTROLLER_ADMIN,
        expect.objectContaining({
          page: 1,
          size: ADMIN_LIST_DRAIN_PAGE_SIZE
        }),
        {}
      );
      const firstParams = StandardizedApi.get.mock.calls[0][1];
      expect(typeof firstParams.page).toBe('number');
      expect(typeof firstParams.size).toBe('number');
      expect(Object.prototype.hasOwnProperty.call(firstParams, 'page')).toBe(true);
      expect(Object.prototype.hasOwnProperty.call(firstParams, 'size')).toBe(true);
      expect(StandardizedApi.get.mock.calls[0][0]).toBe('/api/v1/schedules/admin');
      expect(StandardizedApi.get.mock.calls[0][0]).not.toBe(API_ADMIN_SCHEDULES);
      expect(Object.prototype.hasOwnProperty.call(
        StandardizedApi.get.mock.calls[0][1],
        'status'
      )).toBe(false);
    });

    it('adminScheduleControllerListGetAll — size always forced to drain 200', async() => {
      StandardizedApi.get.mockResolvedValueOnce({
        schedules: Array.from({ length: 2 }, (_, i) => scheduleId(i + 1)),
        count: 2,
        page: 0,
        size: ADMIN_LIST_DRAIN_PAGE_SIZE
      });

      await adminScheduleControllerListGetAll({ page: 0 });

      expect(StandardizedApi.get).toHaveBeenCalledTimes(1);
      const params = StandardizedApi.get.mock.calls[0][1];
      expect(params.size).toBe(ADMIN_LIST_DRAIN_PAGE_SIZE);
      expect(params.page).toBe(0);
      expect(Object.prototype.hasOwnProperty.call(params, 'size')).toBe(true);
      expect(Object.prototype.hasOwnProperty.call(params, 'page')).toBe(true);
    });

    it('adminScheduleControllerListGetAll — extra.size omitted still size=200', async() => {
      StandardizedApi.get.mockResolvedValueOnce({
        schedules: Array.from({ length: 1 }, (_, i) => scheduleId(i + 1)),
        count: 1,
        page: 0,
        size: ADMIN_LIST_DRAIN_PAGE_SIZE
      });

      await adminScheduleControllerListGetAll({
        startDate: '2026-09-01',
        endDate: '2026-09-30',
        _t: 'omit-size'
      });

      expect(StandardizedApi.get).toHaveBeenCalledTimes(1);
      const params = StandardizedApi.get.mock.calls[0][1];
      expect(params.size).toBe(ADMIN_LIST_DRAIN_PAGE_SIZE);
      expect(params.page).toBe(0);
      expect(Object.prototype.hasOwnProperty.call(params, 'size')).toBe(true);
      expect(Object.prototype.hasOwnProperty.call(params, 'page')).toBe(true);
    });

    it('adminScheduleControllerListGetAll — extra.size overridden to drain 200', async() => {
      StandardizedApi.get.mockResolvedValueOnce({
        schedules: Array.from({ length: 1 }, (_, i) => scheduleId(i + 1)),
        count: 1,
        page: 0,
        size: ADMIN_LIST_DRAIN_PAGE_SIZE
      });

      await adminScheduleControllerListGetAll({ page: 0, size: 20 });

      expect(StandardizedApi.get).toHaveBeenCalledTimes(1);
      expect(StandardizedApi.get.mock.calls[0][1].size).toBe(ADMIN_LIST_DRAIN_PAGE_SIZE);
      expect(StandardizedApi.get.mock.calls[0][1].size).not.toBe(20);
    });

    it('adminScheduleControllerListGetAll — invalid extra.page falls back to 0', async() => {
      StandardizedApi.get.mockResolvedValueOnce({
        schedules: [],
        count: 0,
        page: 0,
        size: ADMIN_LIST_DRAIN_PAGE_SIZE
      });

      await adminScheduleControllerListGetAll({ page: '', size: null });

      expect(StandardizedApi.get).toHaveBeenCalledTimes(1);
      const params = StandardizedApi.get.mock.calls[0][1];
      expect(params.page).toBe(0);
      expect(params.size).toBe(ADMIN_LIST_DRAIN_PAGE_SIZE);
    });

    it('adminClientsWithMappingGetAll — single page short-circuit when count fits one page', async() => {
      const items = Array.from({ length: 5 }, (_, i) => clientId(i + 1));
      StandardizedApi.get.mockResolvedValueOnce({
        clients: items,
        count: 5,
        page: 0,
        size: ADMIN_LIST_DRAIN_PAGE_SIZE
      });

      const result = await adminClientsWithMappingGetAll();

      expect(result.clients).toHaveLength(5);
      expect(result.count).toBe(5);
      expect(StandardizedApi.get).toHaveBeenCalledTimes(1);
      expect(StandardizedApi.get).toHaveBeenCalledWith(
        API_ENDPOINTS.ADMIN.CLIENTS.WITH_MAPPING_INFO,
        expect.objectContaining({
          view: 'summary',
          page: 0,
          size: ADMIN_LIST_DRAIN_PAGE_SIZE
        }),
        {}
      );
    });

    it('adminListGetAllPages — empty page stops without further requests', async() => {
      StandardizedApi.get.mockResolvedValueOnce({
        mappings: [],
        count: 0,
        page: 0,
        size: ADMIN_LIST_DRAIN_PAGE_SIZE
      });

      const result = await adminListGetAllPages(
        API_ENDPOINTS.ADMIN.MAPPINGS.LIST,
        {},
        {},
        {
          listKey: 'mappings',
          getItems: (r) => (r && Array.isArray(r.mappings) ? r.mappings : []),
          getTotal: (r) => (r == null ? undefined : (r.totalElements ?? r.count))
        }
      );

      expect(result.mappings).toEqual([]);
      expect(result.count).toBe(0);
      expect(StandardizedApi.get).toHaveBeenCalledTimes(1);
      expect(StandardizedApi.get).toHaveBeenCalledWith(
        API_ENDPOINTS.ADMIN.MAPPINGS.LIST,
        expect.objectContaining({ size: ADMIN_LIST_DRAIN_PAGE_SIZE }),
        {}
      );
    });
  });

  describe('size 상한·pending 목록 공통 모듈', () => {
    it('buildAdminListParams — size 는 ADMIN_LIST_DRAIN_PAGE_SIZE 로 캡, 음수 page 는 0', () => {
      expect(buildAdminListParams({ page: -1, size: 100000 })).toEqual(
        expect.objectContaining({ page: 0, size: ADMIN_LIST_DRAIN_PAGE_SIZE })
      );
      expect(buildAdminListParams({ size: 0 }).size).toBe(1);
    });

    it.each([
      ['adminPendingPaymentMappingsGetAll', API_ENDPOINTS.ADMIN.MAPPINGS.PENDING_PAYMENT, 'mappings'],
      ['adminPendingDepositMappingsGetAll', API_ENDPOINTS.ADMIN.MAPPINGS.PENDING_DEPOSIT, 'mappings'],
      ['adminSessionExtensionPendingPaymentGetAll', API_ENDPOINTS.ADMIN.SESSION_EXTENSIONS.PENDING_PAYMENT, 'requests']
    ])('%s — page/size drain, count=전체', async(fnName, endpoint, key) => {
      const page0 = Array.from({ length: ADMIN_LIST_DRAIN_PAGE_SIZE }, (_, i) => ({ id: i + 1 }));
      const page1 = [{ id: ADMIN_LIST_DRAIN_PAGE_SIZE + 1 }];
      StandardizedApi.get
        .mockResolvedValueOnce({ [key]: page0, count: page0.length + 1, page: 0, size: ADMIN_LIST_DRAIN_PAGE_SIZE })
        .mockResolvedValueOnce({ [key]: page1, count: page0.length + 1, page: 1, size: ADMIN_LIST_DRAIN_PAGE_SIZE });

      const result = await pendingFns[fnName]();

      expect(result[key]).toHaveLength(page0.length + 1);
      expect(StandardizedApi.get).toHaveBeenNthCalledWith(1, endpoint,
        expect.objectContaining({ page: 0, size: ADMIN_LIST_DRAIN_PAGE_SIZE }), {});
      expect(StandardizedApi.get).toHaveBeenNthCalledWith(2, endpoint,
        expect.objectContaining({ page: 1, size: ADMIN_LIST_DRAIN_PAGE_SIZE }), {});
    });

    it('pending 한 페이지 조회도 page/size 포함', async() => {
      StandardizedApi.get.mockResolvedValueOnce({ mappings: [], count: 0 });
      await pendingFns.adminPendingDepositMappingsGet();
      expect(StandardizedApi.get).toHaveBeenCalledWith(
        API_ENDPOINTS.ADMIN.MAPPINGS.PENDING_DEPOSIT,
        expect.objectContaining({ page: 0, size: ADMIN_DASHBOARD_LIST_PAGE_SIZE }),
        {}
      );
    });
  });
});
