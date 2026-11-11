/**
 * adminClientsWithStatsGetAll — with-stats 전체 페이지 drain.
 * size 는 drain 상수이며 total/count 를 size 로 넘기지 않는다.
 *
 * @author CoreSolution
 * @since 2026-11-10
 */

import StandardizedApi from '../../utils/standardizedApi';
import { API_ENDPOINTS } from '../../constants/apiEndpoints';
import {
  ADMIN_LIST_DRAIN_PAGE_SIZE,
  adminClientsWithStatsGetAll
} from '../adminListFetch';
import { fetchAdminClientsWithStatsAll } from '../../utils/adminPagedListApi';

jest.mock('../../utils/standardizedApi', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn()
  }
}));

const WITH_STATS_PATH = API_ENDPOINTS.ADMIN.CLIENTS.WITH_STATS;
const SINGLE_FULL_COUNT = 21;
const SHORT_PAGE_COUNT = 21;
const TRUNCATED_TOTAL = 100;

/**
 * @param {number} count
 * @param {number} [startId]
 * @returns {Array<{ id: number, name: string }>}
 */
function buildClients(count, startId = 1) {
  return Array.from({ length: count }, (_, index) => ({
    id: startId + index,
    name: `내담자${startId + index}`
  }));
}

describe('adminClientsWithStatsGetAll', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('pages until total with drain size on every request', async() => {
    const total = ADMIN_LIST_DRAIN_PAGE_SIZE + 1;
    expect(total).toBeGreaterThanOrEqual(SINGLE_FULL_COUNT);
    const page0 = buildClients(ADMIN_LIST_DRAIN_PAGE_SIZE);
    const page1 = buildClients(1, ADMIN_LIST_DRAIN_PAGE_SIZE + 1);
    StandardizedApi.get
      .mockResolvedValueOnce({
        clients: page0,
        count: total,
        page: 0,
        size: ADMIN_LIST_DRAIN_PAGE_SIZE
      })
      .mockResolvedValueOnce({
        clients: page1,
        count: total,
        page: 1,
        size: ADMIN_LIST_DRAIN_PAGE_SIZE
      });

    const result = await adminClientsWithStatsGetAll();

    expect(result.clients).toHaveLength(total);
    expect(result.count).toBe(total);
    expect(StandardizedApi.get).toHaveBeenCalledTimes(2);
    StandardizedApi.get.mock.calls.forEach((call, index) => {
      const [path, params] = call;
      expect(path).toBe(WITH_STATS_PATH);
      expect(Object.prototype.hasOwnProperty.call(params, 'page')).toBe(true);
      expect(Object.prototype.hasOwnProperty.call(params, 'size')).toBe(true);
      expect(params.page).toBe(index);
      expect(params.size).toBe(ADMIN_LIST_DRAIN_PAGE_SIZE);
      expect(params.size).not.toBe(total);
      expect(params.size).not.toBe(20);
    });
  });

  it('stops after one request when the payload already holds the full count', async() => {
    const clients = buildClients(SINGLE_FULL_COUNT);
    StandardizedApi.get.mockResolvedValueOnce({
      clients,
      count: SINGLE_FULL_COUNT
    });

    const result = await adminClientsWithStatsGetAll();

    expect(result.clients).toHaveLength(SINGLE_FULL_COUNT);
    expect(result.count).toBe(SINGLE_FULL_COUNT);
    expect(StandardizedApi.get).toHaveBeenCalledTimes(1);
    const [path, params] = StandardizedApi.get.mock.calls[0];
    expect(path).toBe(WITH_STATS_PATH);
    expect(params.page).toBe(0);
    expect(params.size).toBe(ADMIN_LIST_DRAIN_PAGE_SIZE);
    expect(params.size).not.toBe(SINGLE_FULL_COUNT);
    expect(params.size).not.toBe(20);
  });

  it('stops when a short page is followed by an empty page', async() => {
    StandardizedApi.get
      .mockResolvedValueOnce({
        clients: buildClients(SHORT_PAGE_COUNT),
        count: TRUNCATED_TOTAL
      })
      .mockResolvedValueOnce({
        clients: [],
        count: TRUNCATED_TOTAL
      });

    const result = await adminClientsWithStatsGetAll();

    expect(result.clients).toHaveLength(SHORT_PAGE_COUNT);
    expect(StandardizedApi.get).toHaveBeenCalledTimes(2);
    const [path0, params0] = StandardizedApi.get.mock.calls[0];
    const [path1, params1] = StandardizedApi.get.mock.calls[1];
    expect(path0).toBe(WITH_STATS_PATH);
    expect(path1).toBe(WITH_STATS_PATH);
    expect(params0.page).toBe(0);
    expect(params0.size).toBe(ADMIN_LIST_DRAIN_PAGE_SIZE);
    expect(params0.size).not.toBe(TRUNCATED_TOTAL);
    expect(params0.size).not.toBe(20);
    expect(params1.page).toBe(1);
    expect(params1.size).toBe(SHORT_PAGE_COUNT);
    expect(params1.size).not.toBe(TRUNCATED_TOTAL);
    expect(params1.size).not.toBe(20);
  });

  it('fetchAdminClientsWithStatsAll uses the same single-payload drain', async() => {
    const clients = buildClients(SINGLE_FULL_COUNT);
    StandardizedApi.get.mockResolvedValueOnce({
      clients,
      count: SINGLE_FULL_COUNT
    });

    const result = await fetchAdminClientsWithStatsAll();

    expect(result.clients).toHaveLength(SINGLE_FULL_COUNT);
    expect(result.count).toBe(SINGLE_FULL_COUNT);
    expect(StandardizedApi.get).toHaveBeenCalledTimes(1);
    expect(StandardizedApi.get).toHaveBeenCalledWith(
      WITH_STATS_PATH,
      expect.objectContaining({
        page: 0,
        size: ADMIN_LIST_DRAIN_PAGE_SIZE
      }),
      {}
    );
    const size = StandardizedApi.get.mock.calls[0][1].size;
    expect(size).not.toBe(SINGLE_FULL_COUNT);
    expect(size).not.toBe(20);
  });
});
