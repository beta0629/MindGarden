import { renderHook, waitFor, act } from '@testing-library/react';
import useCompositionCandidates, { COMPOSITION_FETCH_STATUS } from '../useCompositionCandidates';
import { listCompositionCandidates } from '../../services/adminShopCompositionService';
import { COMPOSITION_CANDIDATE_STATE, resolveCompositionCandidateState } from '../../utils/packageComposition';

jest.mock('../../services/adminShopCompositionService', () => ({
  listCompositionCandidates: jest.fn()
}));

describe('useCompositionCandidates', () => {
  beforeEach(() => jest.clearAllMocks());

  test('빈 검색어로도 후보 API 를 불러와 화면 후보로 바꾼다', async() => {
    listCompositionCandidates.mockResolvedValue({
      items: [{ skuId: 9, title: '개인상담 1회', catalogCategory: 'CONSULTATION', unitPriceMinor: 90000, sessionCount: 1, composed: false }],
      totalActive: 4
    });
    const { result } = renderHook(() => useCompositionCandidates({ query: '', excludePackageCode: 'PKG' }));
    await waitFor(() => expect(result.current.status).toBe(COMPOSITION_FETCH_STATUS.READY));
    expect(listCompositionCandidates).toHaveBeenCalledWith({ q: '', excludePackageCode: 'PKG' });
    expect(result.current.totalActive).toBe(4);
    expect(result.current.candidates[0]).toMatchObject({ skuId: 9, label: '개인상담 1회', unitPrice: 90000, sessions: 1 });
  });

  test('「후보 없음」은 totalActive 기준: 0 → 후보 없음, >0 이고 결과 0 → 검색 결과 없음', async() => {
    listCompositionCandidates.mockResolvedValue({ items: [], totalActive: 0 });
    const { result } = renderHook(() => useCompositionCandidates({ query: '' }));
    await waitFor(() => expect(result.current.status).toBe(COMPOSITION_FETCH_STATUS.READY));
    expect(resolveCompositionCandidateState({
      totalActive: result.current.totalActive, matchedCount: result.current.candidates.length
    })).toBe(COMPOSITION_CANDIDATE_STATE.NO_CANDIDATES);
    expect(resolveCompositionCandidateState({ totalActive: 3, matchedCount: 0 }))
      .toBe(COMPOSITION_CANDIDATE_STATE.NO_RESULTS);
  });

  test('실패하면 ERROR, retry 로 다시 부른다', async() => {
    listCompositionCandidates.mockRejectedValueOnce(new Error('x')).mockResolvedValue({ items: [], totalActive: 1 });
    const { result } = renderHook(() => useCompositionCandidates({ query: '' }));
    await waitFor(() => expect(result.current.status).toBe(COMPOSITION_FETCH_STATUS.ERROR));
    act(() => result.current.retry());
    await waitFor(() => expect(result.current.status).toBe(COMPOSITION_FETCH_STATUS.READY));
    expect(listCompositionCandidates).toHaveBeenCalledTimes(2);
  });
});
