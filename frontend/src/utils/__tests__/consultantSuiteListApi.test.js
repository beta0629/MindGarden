/**
 * fetchConsultantSuitePagedList — unwrapApiEnvelope:false 로 totalElements 보존
 */
import { fetchConsultantSuitePagedList } from '../consultantSuiteListApi';
import StandardizedApi from '../standardizedApi';

jest.mock('../standardizedApi', () => ({
  __esModule: true,
  default: {
    get: jest.fn()
  }
}));

describe('fetchConsultantSuitePagedList', () => {
  beforeEach(() => {
    StandardizedApi.get.mockReset();
  });

  test('unwrapApiEnvelope:false 로 호출하고 엔벨로프 totalElements 를 보존한다', async() => {
    StandardizedApi.get.mockResolvedValue({
      success: true,
      data: [{ id: 1 }, { id: 2 }],
      totalElements: 25,
      totalPages: 2
    });

    const result = await fetchConsultantSuitePagedList('/api/v1/consultant/records', { q: 'x' }, {
      page: 0,
      size: 20
    });

    expect(StandardizedApi.get).toHaveBeenCalledWith(
      '/api/v1/consultant/records',
      { q: 'x', page: 0, size: 20 },
      { unwrapApiEnvelope: false }
    );
    expect(result.items).toHaveLength(2);
    expect(result.totalElements).toBe(25);
    expect(result.totalPages).toBe(2);
  });

  test('중첩 { data: { messages, totalElements } } 도 동작한다', async() => {
    StandardizedApi.get.mockResolvedValue({
      success: true,
      data: { messages: [{ id: 'm1' }], totalElements: 3, totalPages: 1 }
    });

    const result = await fetchConsultantSuitePagedList('/api/v1/consultant/messages');
    expect(result.items).toEqual([{ id: 'm1' }]);
    expect(result.totalElements).toBe(3);
  });

  test('statusCounts 를 중첩 data 에서 표면화한다', async() => {
    StandardizedApi.get.mockResolvedValue({
      success: true,
      data: {
        mappings: [{ id: 1 }],
        totalElements: 1,
        statusCounts: { ALL: 9, ACTIVE: 7 }
      }
    });

    const result = await fetchConsultantSuitePagedList(
      '/api/v1/admin/mappings/consultant/1/clients',
      {},
      { itemKeys: ['mappings'] }
    );
    expect(result.statusCounts).toEqual({ ALL: 9, ACTIVE: 7 });
  });
});
