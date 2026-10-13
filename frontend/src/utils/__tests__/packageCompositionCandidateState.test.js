import {
  COMPOSITION_CANDIDATE_STATE,
  filterCompositionOptions,
  resolveCompositionCandidateState
} from '../packageComposition';

describe('resolveCompositionCandidateState', () => {
  test('totalActive 0 이면 후보 없음', () => {
    expect(resolveCompositionCandidateState({ totalActive: 0, matchedCount: 0 }))
      .toBe(COMPOSITION_CANDIDATE_STATE.NO_CANDIDATES);
  });
  test('후보는 있으나 맞는 것이 없으면 검색 결과 없음', () => {
    expect(resolveCompositionCandidateState({ totalActive: 3, matchedCount: 0 }))
      .toBe(COMPOSITION_CANDIDATE_STATE.NO_RESULTS);
  });
  test('맞는 후보가 있으면 READY', () => {
    expect(resolveCompositionCandidateState({ totalActive: 3, matchedCount: 2 }))
      .toBe(COMPOSITION_CANDIDATE_STATE.READY);
  });
});

describe('filterCompositionOptions', () => {
  const options = [{ label: '개인상담 4회' }, { label: '마음일기 노트' }];
  test('빈 검색어는 전체', () => {
    expect(filterCompositionOptions(options, '  ')).toHaveLength(2);
  });
  test('상품명 일부로 거른다', () => {
    expect(filterCompositionOptions(options, '노트')).toEqual([{ label: '마음일기 노트' }]);
  });
});
