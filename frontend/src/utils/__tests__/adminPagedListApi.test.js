/**
 * adminPagedListApi — thin shim re-exporting adminListFetch SSOT
 */

import {
  buildAdminClientsWithMappingInfoUrl,
  fetchAdminClientsWithMappingInfo,
  fetchAdminClientsWithMappingInfoAll,
  fetchAdminClientsWithStats,
  fetchAdminConsultantsWithStats,
  fetchAdminMappingsList
} from '../adminPagedListApi';
import {
  ADMIN_DASHBOARD_CLIENTS_WITH_MAPPING_QUERY,
  ADMIN_MAPPINGS_PAGED_LIST_QUERY
} from '../../constants/adminDashboardWidgetConstants';
import StandardizedApi from '../standardizedApi';

jest.mock('../standardizedApi', () => ({
  __esModule: true,
  default: {
    get: jest.fn()
  }
}));

describe('adminPagedListApi (shim → adminListFetch)', () => {
  beforeEach(() => {
    StandardizedApi.get.mockReset();
    StandardizedApi.get.mockResolvedValue({});
  });

  test('buildAdminClientsWithMappingInfoUrl always includes view+page+size', () => {
    const url = buildAdminClientsWithMappingInfoUrl();
    expect(url).toContain('view=summary');
    expect(url).toContain(`page=${ADMIN_DASHBOARD_CLIENTS_WITH_MAPPING_QUERY.page}`);
    expect(url).toContain(`size=${ADMIN_DASHBOARD_CLIENTS_WITH_MAPPING_QUERY.size}`);
  });

  test('buildAdminClientsWithMappingInfoUrl keeps page+size when extra omits them', () => {
    const url = buildAdminClientsWithMappingInfoUrl({ status: 'ACTIVE' });
    expect(url).toContain('status=ACTIVE');
    expect(url).toContain(`page=${ADMIN_DASHBOARD_CLIENTS_WITH_MAPPING_QUERY.page}`);
    expect(url).toContain(`size=${ADMIN_DASHBOARD_CLIENTS_WITH_MAPPING_QUERY.size}`);
  });

  test('fetchAdminClientsWithMappingInfo always passes page+size', async () => {
    await fetchAdminClientsWithMappingInfo();
    expect(StandardizedApi.get).toHaveBeenCalledWith(
      '/api/v1/admin/clients/with-mapping-info',
      expect.objectContaining({
        view: ADMIN_DASHBOARD_CLIENTS_WITH_MAPPING_QUERY.view,
        page: ADMIN_DASHBOARD_CLIENTS_WITH_MAPPING_QUERY.page,
        size: ADMIN_DASHBOARD_CLIENTS_WITH_MAPPING_QUERY.size
      }),
      {}
    );
  });

  test('fetchAdminClientsWithMappingInfoAll drains pages via shared GetAll', async () => {
    const page0 = Array.from({ length: 20 }, (_, i) => ({ id: i + 1 }));
    const page1 = Array.from({ length: 5 }, (_, i) => ({ id: i + 21 }));
    StandardizedApi.get
      .mockResolvedValueOnce({ clients: page0, count: 25, page: 0, size: 20 })
      .mockResolvedValueOnce({ clients: page1, count: 25, page: 1, size: 20 });

    const result = await fetchAdminClientsWithMappingInfoAll();

    expect(result.clients).toHaveLength(25);
    expect(result.count).toBe(25);
    expect(StandardizedApi.get).toHaveBeenCalledTimes(2);
    expect(StandardizedApi.get).toHaveBeenNthCalledWith(
      1,
      '/api/v1/admin/clients/with-mapping-info',
      expect.objectContaining({
        view: ADMIN_DASHBOARD_CLIENTS_WITH_MAPPING_QUERY.view,
        page: 0,
        size: ADMIN_DASHBOARD_CLIENTS_WITH_MAPPING_QUERY.size
      }),
      {}
    );
  });

  test('fetchAdminMappingsList always passes page+size', async () => {
    await fetchAdminMappingsList();
    expect(StandardizedApi.get).toHaveBeenCalledWith(
      '/api/v1/admin/mappings',
      expect.objectContaining({
        page: ADMIN_MAPPINGS_PAGED_LIST_QUERY.page,
        size: ADMIN_MAPPINGS_PAGED_LIST_QUERY.size
      }),
      {}
    );
  });

  test('fetchAdminMappingsList extraQuery cannot drop page+size', async () => {
    await fetchAdminMappingsList({ status: 'ACTIVE' });
    const [, query] = StandardizedApi.get.mock.calls[0];
    expect(query.page).toBe(ADMIN_MAPPINGS_PAGED_LIST_QUERY.page);
    expect(query.size).toBe(ADMIN_MAPPINGS_PAGED_LIST_QUERY.size);
    expect(query.status).toBe('ACTIVE');
  });

  test('fetchAdminClientsWithStats always passes page+size', async () => {
    await fetchAdminClientsWithStats();
    expect(StandardizedApi.get).toHaveBeenCalledWith(
      '/api/v1/admin/clients/with-stats',
      expect.objectContaining({
        page: ADMIN_MAPPINGS_PAGED_LIST_QUERY.page,
        size: ADMIN_MAPPINGS_PAGED_LIST_QUERY.size
      }),
      {}
    );
  });

  test('fetchAdminConsultantsWithStats always passes page+size', async () => {
    await fetchAdminConsultantsWithStats();
    expect(StandardizedApi.get).toHaveBeenCalledWith(
      '/api/v1/admin/consultants/with-stats',
      expect.objectContaining({
        page: ADMIN_MAPPINGS_PAGED_LIST_QUERY.page,
        size: ADMIN_MAPPINGS_PAGED_LIST_QUERY.size
      }),
      {}
    );
  });
});
