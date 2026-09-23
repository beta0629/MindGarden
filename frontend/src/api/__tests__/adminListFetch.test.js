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
  ADMIN_LIST_FETCH_MARKER,
  ADMIN_LIST_GET_ALL_SIZE_EQ_COUNT_MAX,
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
  buildAdminListParams,
  buildAdminListUrl,
  ADMIN_LIST_DRAIN_PAGE_SIZE
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

  describe('adminListGetAllPages / adminMappingsListGetAll / adminSchedulesListGetAll / adminClientsWithMappingGetAll', () => {
    const mappingId = (n) => ({ id: n, mappingId: n });
    const scheduleId = (n) => ({ id: n, scheduleId: n, status: 'TENTATIVE_PENDING_PAYMENT' });
    const clientId = (n) => ({ id: n, name: `client-${n}` });

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

    it('ADMIN_LIST_FETCH_MARKER — P0 size-cap bundle marker', () => {
      expect(ADMIN_LIST_FETCH_MARKER).toBe('p0-clients-getall-size-cap-20260923b');
    });

    it('adminClientsWithMappingGetAll — first request size=cap (500) when caller omits size', async() => {
      const page0 = Array.from({ length: 20 }, (_, i) => clientId(i + 1));
      const all73 = Array.from({ length: 73 }, (_, i) => clientId(i + 1));
      StandardizedApi.get
        .mockResolvedValueOnce({ clients: page0, count: 73, page: 0, size: 500 })
        .mockResolvedValueOnce({ clients: all73, count: 73, page: 0, size: 73 });

      const result = await adminClientsWithMappingGetAll();

      expect(result.clients).toHaveLength(73);
      expect(result.count).toBe(73);
      expect(ADMIN_LIST_GET_ALL_SIZE_EQ_COUNT_MAX).toBe(500);
      expect(StandardizedApi.get).toHaveBeenNthCalledWith(
        1,
        API_ENDPOINTS.ADMIN.CLIENTS.WITH_MAPPING_INFO,
        expect.objectContaining({
          view: 'summary',
          page: 0,
          size: ADMIN_LIST_GET_ALL_SIZE_EQ_COUNT_MAX
        }),
        {}
      );
      expect(StandardizedApi.get.mock.calls[0][1].size).toBe(500);
      expect(StandardizedApi.get.mock.calls[0][1].size).not.toBe(20);
    });

    it('adminClientsWithMappingGetAll — size=total fast-path after size=cap truncate (73 total)', async() => {
      const page0 = Array.from({ length: 20 }, (_, i) => clientId(i + 1));
      const all73 = Array.from({ length: 73 }, (_, i) => clientId(i + 1));
      StandardizedApi.get
        .mockResolvedValueOnce({ clients: page0, count: 73, page: 0, size: 500 })
        .mockResolvedValueOnce({ clients: all73, count: 73, page: 0, size: 73 });

      const result = await adminClientsWithMappingGetAll();

      expect(result.clients).toHaveLength(73);
      expect(result.count).toBe(73);
      expect(result.clients.length).toBe(result.count);
      expect(StandardizedApi.get).toHaveBeenCalledTimes(2);
      expect(StandardizedApi.get).toHaveBeenNthCalledWith(
        1,
        API_ENDPOINTS.ADMIN.CLIENTS.WITH_MAPPING_INFO,
        expect.objectContaining({ view: 'summary', page: 0, size: 500 }),
        {}
      );
      expect(StandardizedApi.get).toHaveBeenNthCalledWith(
        2,
        API_ENDPOINTS.ADMIN.CLIENTS.WITH_MAPPING_INFO,
        expect.objectContaining({ page: 0, size: 73 }),
        {}
      );
    });

    it('adminClientsWithMappingGetAll — nested data.clients + prefer count over wrong totalElements', async() => {
      const page0 = Array.from({ length: 20 }, (_, i) => clientId(i + 1));
      const all40 = Array.from({ length: 40 }, (_, i) => clientId(i + 1));
      StandardizedApi.get
        .mockResolvedValueOnce({
          data: { clients: page0, count: 40 },
          totalElements: 20,
          page: 0,
          size: 500
        })
        .mockResolvedValueOnce({
          data: { clients: all40, count: 40 },
          totalElements: 20,
          page: 0,
          size: 40
        });

      const result = await adminClientsWithMappingGetAll();

      expect(result.clients).toHaveLength(40);
      expect(result.count).toBe(40);
      expect(StandardizedApi.get).toHaveBeenCalledTimes(2);
      expect(StandardizedApi.get).toHaveBeenNthCalledWith(
        1,
        API_ENDPOINTS.ADMIN.CLIENTS.WITH_MAPPING_INFO,
        expect.objectContaining({ page: 0, size: 500 }),
        {}
      );
      expect(StandardizedApi.get).toHaveBeenNthCalledWith(
        2,
        API_ENDPOINTS.ADMIN.CLIENTS.WITH_MAPPING_INFO,
        expect.objectContaining({ page: 0, size: 40 }),
        {}
      );
    });

    it('adminClientsWithMappingGetAll — size=cap truncated + size=count ignored → multi-page drain', async() => {
      const page0 = Array.from({ length: 20 }, (_, i) => clientId(i + 1));
      const page1 = Array.from({ length: 20 }, (_, i) => clientId(i + 21));
      const page2 = Array.from({ length: 20 }, (_, i) => clientId(i + 41));
      const page3 = Array.from({ length: 13 }, (_, i) => clientId(i + 61));
      StandardizedApi.get
        .mockResolvedValueOnce({ clients: page0, count: 73, page: 0, size: 500 })
        .mockResolvedValueOnce({ clients: page0, count: 73, page: 0, size: 73 })
        .mockResolvedValueOnce({ clients: page1, count: 73, page: 1, size: 20 })
        .mockResolvedValueOnce({ clients: page2, count: 73, page: 2, size: 20 })
        .mockResolvedValueOnce({ clients: page3, count: 73, page: 3, size: 20 });

      const result = await adminClientsWithMappingGetAll();

      expect(result.clients).toHaveLength(73);
      expect(result.count).toBe(73);
      expect(StandardizedApi.get).toHaveBeenCalledTimes(5);
      expect(StandardizedApi.get).toHaveBeenNthCalledWith(
        1,
        API_ENDPOINTS.ADMIN.CLIENTS.WITH_MAPPING_INFO,
        expect.objectContaining({ page: 0, size: 500 }),
        {}
      );
      expect(StandardizedApi.get).toHaveBeenNthCalledWith(
        2,
        API_ENDPOINTS.ADMIN.CLIENTS.WITH_MAPPING_INFO,
        expect.objectContaining({ page: 0, size: 73 }),
        {}
      );
      expect(StandardizedApi.get).toHaveBeenNthCalledWith(
        3,
        API_ENDPOINTS.ADMIN.CLIENTS.WITH_MAPPING_INFO,
        expect.objectContaining({ page: 1, size: 20 }),
        {}
      );
      expect(StandardizedApi.get).toHaveBeenNthCalledWith(
        4,
        API_ENDPOINTS.ADMIN.CLIENTS.WITH_MAPPING_INFO,
        expect.objectContaining({ page: 2, size: 20 }),
        {}
      );
      expect(StandardizedApi.get).toHaveBeenNthCalledWith(
        5,
        API_ENDPOINTS.ADMIN.CLIENTS.WITH_MAPPING_INFO,
        expect.objectContaining({ page: 3, size: 20 }),
        {}
      );
    });

    it('adminClientsWithMappingGetAll — size=total ignored falls back to multi-page drain', async() => {
      const page0 = Array.from({ length: 20 }, (_, i) => clientId(i + 1));
      const page1 = Array.from({ length: 20 }, (_, i) => clientId(i + 21));
      const page2 = Array.from({ length: 5 }, (_, i) => clientId(i + 41));
      StandardizedApi.get
        .mockResolvedValueOnce({ clients: page0, count: 45, page: 0, size: 500 })
        .mockResolvedValueOnce({ clients: page0, count: 45, page: 0, size: 45 })
        .mockResolvedValueOnce({ clients: page1, count: 45, page: 1, size: 20 })
        .mockResolvedValueOnce({ clients: page2, count: 45, page: 2, size: 20 });

      const result = await adminClientsWithMappingGetAll();

      expect(result.clients).toHaveLength(45);
      expect(result.count).toBe(45);
      expect(StandardizedApi.get).toHaveBeenCalledTimes(4);
      expect(StandardizedApi.get).toHaveBeenNthCalledWith(
        2,
        API_ENDPOINTS.ADMIN.CLIENTS.WITH_MAPPING_INFO,
        expect.objectContaining({ page: 0, size: 45 }),
        {}
      );
      expect(StandardizedApi.get).toHaveBeenNthCalledWith(
        3,
        API_ENDPOINTS.ADMIN.CLIENTS.WITH_MAPPING_INFO,
        expect.objectContaining({ page: 1, size: 20 }),
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
      expect(params.size).not.toBe(ADMIN_LIST_GET_ALL_SIZE_EQ_COUNT_MAX);
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
      expect(params.size).toBe(ADMIN_LIST_GET_ALL_SIZE_EQ_COUNT_MAX);
      expect(params.size).toBe(500);
      expect(params.page).toBe(0);
      expect(params.view).toBe('summary');
      expect(Object.prototype.hasOwnProperty.call(params, 'size')).toBe(true);
      expect(Object.prototype.hasOwnProperty.call(params, 'page')).toBe(true);
    });

    it('adminClientsWithMappingGetAll — single page short-circuit when count fits one page', async() => {
      const items = Array.from({ length: 5 }, (_, i) => clientId(i + 1));
      StandardizedApi.get.mockResolvedValueOnce({
        clients: items,
        count: 5,
        page: 0,
        size: 500
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
          size: ADMIN_LIST_GET_ALL_SIZE_EQ_COUNT_MAX
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
});
