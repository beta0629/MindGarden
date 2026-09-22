/**
 * adminListFetch SSOT — page+size 강제
 *
 * @author CoreSolution
 * @since 2026-09-22
 */

import {
  ADMIN_LIST_DEFAULT_PAGE,
  ADMIN_LIST_DEFAULT_SIZE,
  ADMIN_LIST_ENDPOINTS,
  buildAdminListParams,
  isAdminListEndpoint,
  normalizeAdminListEndpoint,
  adminListGet,
  fetchClientsWithMappingInfo,
  fetchAdminMappingsList
} from '../adminListFetch';
import StandardizedApi from '../standardizedApi';
import { DEFAULTS } from '../../constants/adminDashboard';
import { API_ENDPOINTS } from '../../constants/apiEndpoints';

jest.mock('../standardizedApi', () => ({
  __esModule: true,
  default: {
    get: jest.fn()
  }
}));

describe('adminListFetch', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    StandardizedApi.get.mockResolvedValue({ clients: [], count: 0 });
  });

  test('defaults align with DEFAULTS.PAGE_SIZE / page 0', () => {
    expect(ADMIN_LIST_DEFAULT_PAGE).toBe(0);
    expect(ADMIN_LIST_DEFAULT_SIZE).toBe(DEFAULTS.PAGE_SIZE);
    expect(ADMIN_LIST_DEFAULT_SIZE).toBe(20);
  });

  test('ADMIN_LIST_ENDPOINTS paths', () => {
    expect(ADMIN_LIST_ENDPOINTS.CLIENTS_WITH_MAPPING_INFO).toBe(
      API_ENDPOINTS.ADMIN.CLIENTS.WITH_MAPPING_INFO
    );
    expect(ADMIN_LIST_ENDPOINTS.MAPPINGS_LIST).toBe(API_ENDPOINTS.ADMIN.MAPPINGS.LIST);
    expect(ADMIN_LIST_ENDPOINTS.CONSULTATION_MESSAGES_ALL).toBe(
      '/api/v1/consultation-messages/all'
    );
  });

  test('normalizeAdminListEndpoint strips query', () => {
    expect(
      normalizeAdminListEndpoint('/api/v1/admin/clients/with-mapping-info?view=summary')
    ).toBe('/api/v1/admin/clients/with-mapping-info');
  });

  test('isAdminListEndpoint — LIST yes, subpaths no', () => {
    expect(isAdminListEndpoint('/api/v1/admin/clients/with-mapping-info')).toBe(true);
    expect(isAdminListEndpoint('/api/v1/admin/clients/with-mapping-info?view=summary')).toBe(true);
    expect(isAdminListEndpoint('/api/v1/admin/mappings')).toBe(true);
    expect(isAdminListEndpoint('/api/v1/admin/mappings/stats')).toBe(false);
    expect(isAdminListEndpoint('/api/v1/admin/mappings/active')).toBe(false);
    expect(isAdminListEndpoint('/api/v1/consultation-messages/all')).toBe(true);
  });

  test('buildAdminListParams always sets page+size', () => {
    expect(buildAdminListParams()).toEqual({
      page: ADMIN_LIST_DEFAULT_PAGE,
      size: ADMIN_LIST_DEFAULT_SIZE
    });
    expect(buildAdminListParams({ view: 'summary' })).toEqual({
      view: 'summary',
      page: ADMIN_LIST_DEFAULT_PAGE,
      size: ADMIN_LIST_DEFAULT_SIZE
    });
  });

  test('buildAdminListParams allows override and coerces numbers', () => {
    expect(buildAdminListParams({ page: '2', size: '50', view: 'summary' })).toEqual({
      view: 'summary',
      page: 2,
      size: 50
    });
  });

  test('buildAdminListParams recovers from NaN', () => {
    expect(buildAdminListParams({ page: 'x', size: 'y' })).toEqual({
      page: ADMIN_LIST_DEFAULT_PAGE,
      size: ADMIN_LIST_DEFAULT_SIZE
    });
  });

  test('adminListGet forces page+size via StandardizedApi.get', async() => {
    await adminListGet(API_ENDPOINTS.ADMIN.CLIENTS.WITH_MAPPING_INFO, { view: 'summary' });
    expect(StandardizedApi.get).toHaveBeenCalledWith(
      API_ENDPOINTS.ADMIN.CLIENTS.WITH_MAPPING_INFO,
      { view: 'summary', page: 0, size: 20 },
      {}
    );
  });

  test('adminListGet strips bare query URL and merges params', async() => {
    await adminListGet(
      '/api/v1/admin/clients/with-mapping-info?view=summary',
      {}
    );
    expect(StandardizedApi.get).toHaveBeenCalledWith(
      '/api/v1/admin/clients/with-mapping-info',
      { view: 'summary', page: 0, size: 20 },
      {}
    );
  });

  test('fetchClientsWithMappingInfo / fetchAdminMappingsList wrappers', async() => {
    await fetchClientsWithMappingInfo({ view: 'summary' });
    expect(StandardizedApi.get).toHaveBeenCalledWith(
      API_ENDPOINTS.ADMIN.CLIENTS.WITH_MAPPING_INFO,
      { view: 'summary', page: 0, size: 20 },
      {}
    );
    await fetchAdminMappingsList({ page: 1 });
    expect(StandardizedApi.get).toHaveBeenCalledWith(
      API_ENDPOINTS.ADMIN.MAPPINGS.LIST,
      { page: 1, size: 20 },
      {}
    );
  });
});
