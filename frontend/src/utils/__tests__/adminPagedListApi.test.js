/**
 * adminPagedListApi — page+size 강제 SSOT
 */

import {
  buildAdminClientsWithMappingInfoUrl,
  buildAdminMappingsListUrl,
  fetchAdminClientsWithMappingInfo,
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

describe('adminPagedListApi', () => {
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
      })
    );
  });

  test('buildAdminMappingsListUrl always includes page= and size=', () => {
    const url = buildAdminMappingsListUrl();
    expect(url).toContain('page=');
    expect(url).toContain('size=');
    expect(url).toContain(`page=${ADMIN_MAPPINGS_PAGED_LIST_QUERY.page}`);
    expect(url).toContain(`size=${ADMIN_MAPPINGS_PAGED_LIST_QUERY.size}`);
  });

  test('buildAdminMappingsListUrl keeps page+size when extra omits them', () => {
    const url = buildAdminMappingsListUrl({ status: 'ACTIVE' });
    expect(url).toContain('status=ACTIVE');
    expect(url).toContain(`page=${ADMIN_MAPPINGS_PAGED_LIST_QUERY.page}`);
    expect(url).toContain(`size=${ADMIN_MAPPINGS_PAGED_LIST_QUERY.size}`);
  });

  test('fetchAdminMappingsList bakes page+size into endpoint URL', async () => {
    await fetchAdminMappingsList();
    const [endpoint, params] = StandardizedApi.get.mock.calls[0];
    expect(endpoint).toContain('page=');
    expect(endpoint).toContain('size=');
    expect(endpoint).toContain(`page=${ADMIN_MAPPINGS_PAGED_LIST_QUERY.page}`);
    expect(endpoint).toContain(`size=${ADMIN_MAPPINGS_PAGED_LIST_QUERY.size}`);
    expect(params).toEqual({});
  });

  test('fetchAdminMappingsList extraQuery cannot drop page+size from URL', async () => {
    await fetchAdminMappingsList({ status: 'ACTIVE' });
    const [endpoint, params] = StandardizedApi.get.mock.calls[0];
    expect(endpoint).toContain('status=ACTIVE');
    expect(endpoint).toContain(`page=${ADMIN_MAPPINGS_PAGED_LIST_QUERY.page}`);
    expect(endpoint).toContain(`size=${ADMIN_MAPPINGS_PAGED_LIST_QUERY.size}`);
    expect(params).toEqual({});
  });
});
