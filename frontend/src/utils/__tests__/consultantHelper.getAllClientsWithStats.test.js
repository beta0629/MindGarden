/**
 * getAllClientsWithStats — adminClientsWithStatsGetAll drain 결과를 배열로 반환.
 *
 * @author CoreSolution
 * @since 2026-11-10
 */

import StandardizedApi from '../standardizedApi';
import { API_ENDPOINTS } from '../../constants/apiEndpoints';
import { ADMIN_LIST_DRAIN_PAGE_SIZE } from '../../api/adminListFetch';
import { getAllClientsWithStats } from '../consultantHelper';

jest.mock('../ajax', () => ({
  apiGet: jest.fn()
}));

jest.mock('../standardizedApi', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn()
  }
}));

const WITH_STATS_PATH = API_ENDPOINTS.ADMIN.CLIENTS.WITH_STATS;
const SINGLE_FULL_COUNT = 21;

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

describe('getAllClientsWithStats', () => {
  beforeEach(() => {
    StandardizedApi.get.mockReset();
  });

  test('서버가 clients+count 한 번에 21건을 주면 그 배열을 반환한다', async() => {
    const clients = buildClients(SINGLE_FULL_COUNT);
    StandardizedApi.get.mockResolvedValueOnce({
      clients,
      count: SINGLE_FULL_COUNT
    });

    const result = await getAllClientsWithStats();

    expect(Array.isArray(result)).toBe(true);
    expect(result).toHaveLength(SINGLE_FULL_COUNT);
    expect(result[SINGLE_FULL_COUNT - 1]).toEqual(clients[SINGLE_FULL_COUNT - 1]);
    expect(StandardizedApi.get).toHaveBeenCalledTimes(1);
    expect(StandardizedApi.get).toHaveBeenCalledWith(
      WITH_STATS_PATH,
      expect.objectContaining({
        page: 0,
        size: ADMIN_LIST_DRAIN_PAGE_SIZE
      }),
      {}
    );
    expect(StandardizedApi.get.mock.calls[0][1].size).not.toBe(20);
    expect(StandardizedApi.get.mock.calls[0][1].size).not.toBe(SINGLE_FULL_COUNT);
  });

  test('서버가 drain size 다음 나머지를 주면 첫 페이지가 아닌 합친 배열을 반환한다', async() => {
    const total = ADMIN_LIST_DRAIN_PAGE_SIZE + 1;
    const page0 = buildClients(ADMIN_LIST_DRAIN_PAGE_SIZE);
    const remainder = buildClients(1, ADMIN_LIST_DRAIN_PAGE_SIZE + 1);
    StandardizedApi.get
      .mockResolvedValueOnce({ clients: page0, count: total })
      .mockResolvedValueOnce({ clients: remainder, count: total });

    const result = await getAllClientsWithStats();

    expect(result).toHaveLength(total);
    expect(result.length).toBeGreaterThan(SINGLE_FULL_COUNT);
    expect(result).not.toHaveLength(page0.length);
    expect(result[result.length - 1]).toEqual(remainder[0]);
    expect(StandardizedApi.get).toHaveBeenCalledTimes(2);
  });
});
