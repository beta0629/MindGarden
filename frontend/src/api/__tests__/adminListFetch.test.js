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
  adminListGetAllPages,
  adminMappingsListGet,
  adminMappingsListGetAll,
  adminSchedulesListGet,
  adminSchedulesListGetAll,
  adminScheduleControllerListGetAll,
  buildAdminListParams,
  buildAdminListUrl,
  ADMIN_LIST_DRAIN_PAGE_SIZE,
  ADMIN_LIST_FETCH_MARKER
} from '../adminListFetch';
import {
  ADMIN_DASHBOARD_LIST_PAGE,
  ADMIN_DASHBOARD_LIST_PAGE_SIZE,
  API_ADMIN_SCHEDULES,
  API_SCHEDULE_CONTROLLER_ADMIN
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

  describe('adminListGetAllPages / drain helpers', () => {
    const mappingId = (n) => ({ id: n, mappingId: n });
    const scheduleId = (n) => ({ id: n, scheduleId: n, status: 'TENTATIVE_PENDING_PAYMENT' });

    it('adminMappingsListGetAll — multi-page merge with drain size 200', async() => {
      const page0 = Array.from({ length: ADMIN_LIST_DRAIN_PAGE_SIZE }, (_, i) => mappingId(i + 1));
      const page1 = Array.from({ length: 45 }, (_, i) => mappingId(i + ADMIN_LIST_DRAIN_PAGE_SIZE + 1));
      StandardizedApi.get
        .mockResolvedValueOnce({
          mappings: page0,
          count: ADMIN_LIST_DRAIN_PAGE_SIZE + 45,
          page: 0,
          size: ADMIN_LIST_DRAIN_PAGE_SIZE
        })
        .mockResolvedValueOnce({
          mappings: page1,
          count: ADMIN_LIST_DRAIN_PAGE_SIZE + 45,
          page: 1,
          size: ADMIN_LIST_DRAIN_PAGE_SIZE
        });

      const result = await adminMappingsListGetAll();

      expect(result.mappings).toHaveLength(ADMIN_LIST_DRAIN_PAGE_SIZE + 45);
      expect(result.count).toBe(ADMIN_LIST_DRAIN_PAGE_SIZE + 45);
      expect(StandardizedApi.get).toHaveBeenCalledTimes(2);
      expect(StandardizedApi.get).toHaveBeenNthCalledWith(
        1,
        API_ENDPOINTS.ADMIN.MAPPINGS.LIST,
        expect.objectContaining({ page: 0, size: ADMIN_LIST_DRAIN_PAGE_SIZE }),
        {}
      );
      expect(StandardizedApi.get).toHaveBeenNthCalledWith(
        2,
        API_ENDPOINTS.ADMIN.MAPPINGS.LIST,
        expect.objectContaining({ page: 1, size: ADMIN_LIST_DRAIN_PAGE_SIZE }),
        {}
      );
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

    it('adminSchedulesListGetAll — multi-page merge with drain size 200', async() => {
      const page0 = Array.from({ length: ADMIN_LIST_DRAIN_PAGE_SIZE }, (_, i) => scheduleId(i + 1));
      const page1 = Array.from({ length: 45 }, (_, i) => scheduleId(i + ADMIN_LIST_DRAIN_PAGE_SIZE + 1));
      StandardizedApi.get
        .mockResolvedValueOnce({
          schedules: page0,
          count: ADMIN_LIST_DRAIN_PAGE_SIZE + 45,
          page: 0,
          size: ADMIN_LIST_DRAIN_PAGE_SIZE
        })
        .mockResolvedValueOnce({
          schedules: page1,
          count: ADMIN_LIST_DRAIN_PAGE_SIZE + 45,
          page: 1,
          size: ADMIN_LIST_DRAIN_PAGE_SIZE
        });

      const result = await adminSchedulesListGetAll();

      expect(result.schedules).toHaveLength(ADMIN_LIST_DRAIN_PAGE_SIZE + 45);
      expect(result.count).toBe(ADMIN_LIST_DRAIN_PAGE_SIZE + 45);
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

    it('adminScheduleControllerListGetAll — drains /api/v1/schedules/admin (not AdminController)', async() => {
      const page0 = Array.from({ length: ADMIN_LIST_DRAIN_PAGE_SIZE }, (_, i) => scheduleId(i + 1));
      const page1 = Array.from({ length: 23 }, (_, i) => scheduleId(i + ADMIN_LIST_DRAIN_PAGE_SIZE + 1));
      StandardizedApi.get
        .mockResolvedValueOnce({
          schedules: page0,
          count: ADMIN_LIST_DRAIN_PAGE_SIZE + 23,
          page: 0,
          size: ADMIN_LIST_DRAIN_PAGE_SIZE
        })
        .mockResolvedValueOnce({
          schedules: page1,
          count: ADMIN_LIST_DRAIN_PAGE_SIZE + 23,
          page: 1,
          size: ADMIN_LIST_DRAIN_PAGE_SIZE
        });

      const result = await adminScheduleControllerListGetAll({
        startDate: '2026-09-01',
        endDate: '2026-09-30',
        _t: 'c1_2026-09-01_2026-09-30_0'
      });

      expect(result.schedules).toHaveLength(ADMIN_LIST_DRAIN_PAGE_SIZE + 23);
      expect(result.count).toBe(ADMIN_LIST_DRAIN_PAGE_SIZE + 23);
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
});
