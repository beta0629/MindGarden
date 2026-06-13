/**
 * `useRatings` payload 직렬화·엔드포인트 컨트랙트 단위 테스트.
 *
 * 회귀 방지 대상 (2026-06-13 P1 hotfix):
 * - BE `ConsultantRatingController#createRating` 와 필드명·경로 일치
 *   - endpoint: `/api/v1/ratings/create`
 *   - body: `heartScore` (NOT `rating`), `ratingTags` (NOT `tags`)
 *   - 필수: `clientId`, `scheduleId`, `heartScore` — 누락 시 BE NumberFormatException(500)
 */
import { buildCreateRatingPayload } from '../ratingPayload';
import { RATING_API } from '../../endpoints';

describe('RATING_API endpoint contract', () => {
  it('SUBMIT_RATING points to BE-provided `/create` path', () => {
    expect(RATING_API.SUBMIT_RATING).toBe('/api/v1/ratings/create');
  });
});

describe('buildCreateRatingPayload', () => {
  const baseInput = {
    scheduleId: 101,
    consultantId: 202,
    clientId: 303,
    heartScore: 5,
    ratingTags: ['따뜻함', '경청'],
  };

  it('maps UI fields to BE field names (heartScore, ratingTags, clientId)', () => {
    const payload = buildCreateRatingPayload({
      ...baseInput,
      comment: '감사합니다',
      isAnonymous: false,
    });

    expect(payload).toEqual({
      scheduleId: 101,
      consultantId: 202,
      clientId: 303,
      heartScore: 5,
      ratingTags: ['따뜻함', '경청'],
      comment: '감사합니다',
      isAnonymous: false,
    });
  });

  it('omits optional comment when empty/undefined', () => {
    const payload = buildCreateRatingPayload(baseInput);
    expect(payload).not.toHaveProperty('comment');
    expect(payload).not.toHaveProperty('isAnonymous');
  });

  it('defaults missing ratingTags to empty array', () => {
    const payload = buildCreateRatingPayload({
      ...baseInput,
      // @ts-expect-error - ratingTags 누락 입력에 대한 방어 검증
      ratingTags: undefined,
    });
    expect(payload).toMatchObject({ ratingTags: [] });
  });

  it('throws when clientId is missing (BE NumberFormatException 사전 차단)', () => {
    expect(() =>
      buildCreateRatingPayload({
        ...baseInput,
        // @ts-expect-error - 누락 시나리오 검증
        clientId: undefined,
      }),
    ).toThrow(/clientId is required/i);
  });

  it('throws when scheduleId is missing', () => {
    expect(() =>
      buildCreateRatingPayload({
        ...baseInput,
        // @ts-expect-error - 누락 시나리오 검증
        scheduleId: undefined,
      }),
    ).toThrow(/scheduleId is required/i);
  });

  it('throws when heartScore is missing', () => {
    expect(() =>
      buildCreateRatingPayload({
        ...baseInput,
        // @ts-expect-error - 누락 시나리오 검증
        heartScore: undefined,
      }),
    ).toThrow(/heartScore is required/i);
  });

  it('does not include legacy field names (`rating`, `tags`)', () => {
    const payload = buildCreateRatingPayload(baseInput);
    expect(payload).not.toHaveProperty('rating');
    expect(payload).not.toHaveProperty('tags');
  });
});
