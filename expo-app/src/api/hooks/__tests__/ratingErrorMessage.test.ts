/**
 * `ratingErrorMessage` 유틸 단위 테스트.
 *
 * 회귀 방지 대상 (TestFlight 1.0.9 hotfix — 2026-06-15):
 * - `} catch {}` 빈 catch 로 BE 메시지를 가리지 않음
 * - axios `error.response.data.message` 또는 ApiClientError `.message` 모두 우선 노출
 * - 알려진 BE 문구는 내담자 친화 문구로 매핑
 *
 * @author MindGarden
 * @since 2026-06-15
 */
import {
  DEFAULT_RATING_ERROR_MESSAGE,
  buildRatingErrorAlertMessage,
  extractRatingErrorRawMessage,
  toFriendlyRatingErrorMessage,
} from '../ratingErrorMessage';

describe('extractRatingErrorRawMessage', () => {
  it('prefers axios `error.response.data.message`', () => {
    const err = {
      response: { status: 500, data: { message: '이미 평가한 상담입니다' } },
      message: 'Request failed with status code 500',
    };
    expect(extractRatingErrorRawMessage(err)).toBe('이미 평가한 상담입니다');
  });

  it('falls back to `error.response.data.detail` (Spring ProblemDetail)', () => {
    const err = {
      response: { status: 400, data: { detail: '완료된 상담만 평가할 수 있습니다' } },
      message: 'Request failed with status code 400',
    };
    expect(extractRatingErrorRawMessage(err)).toBe('완료된 상담만 평가할 수 있습니다');
  });

  it('falls back to `error.message` when response body has no message field', () => {
    const err = Object.assign(new Error('본인이 받은 상담만 평가할 수 있습니다'), {
      response: { status: 500, data: { foo: 'bar' } },
    });
    expect(extractRatingErrorRawMessage(err)).toBe('본인이 받은 상담만 평가할 수 있습니다');
  });

  it('returns default message when error is null/undefined or has nothing useful', () => {
    expect(extractRatingErrorRawMessage(null)).toBe(DEFAULT_RATING_ERROR_MESSAGE);
    expect(extractRatingErrorRawMessage(undefined)).toBe(DEFAULT_RATING_ERROR_MESSAGE);
    expect(extractRatingErrorRawMessage({})).toBe(DEFAULT_RATING_ERROR_MESSAGE);
    expect(extractRatingErrorRawMessage({ response: { data: {} } })).toBe(
      DEFAULT_RATING_ERROR_MESSAGE,
    );
  });

  it('ignores empty/whitespace-only message fields', () => {
    const err = {
      response: { data: { message: '   ' } },
      message: '',
    };
    expect(extractRatingErrorRawMessage(err)).toBe(DEFAULT_RATING_ERROR_MESSAGE);
  });
});

describe('toFriendlyRatingErrorMessage', () => {
  it.each([
    ['이미 평가한 상담입니다', '이미 평가하신 상담입니다.'],
    ['완료된 상담만 평가할 수 있습니다', '아직 완료되지 않은 상담입니다.'],
    ['본인이 받은 상담만 평가할 수 있습니다', '평가 권한이 없는 상담입니다.'],
    ['상담사를 찾을 수 없습니다', '상담사 정보를 불러올 수 없습니다. 잠시 후 다시 시도해주세요.'],
    ['상담 일정을 찾을 수 없습니다', '상담 일정을 찾을 수 없습니다. 잠시 후 다시 시도해주세요.'],
  ])('maps BE message %j to friendly %j', (raw, friendly) => {
    expect(toFriendlyRatingErrorMessage(raw)).toBe(friendly);
  });

  it('falls through unknown BE messages unchanged', () => {
    expect(toFriendlyRatingErrorMessage('알 수 없는 에러')).toBe('알 수 없는 에러');
  });

  it('returns default message for empty input', () => {
    expect(toFriendlyRatingErrorMessage('')).toBe(DEFAULT_RATING_ERROR_MESSAGE);
  });
});

describe('buildRatingErrorAlertMessage', () => {
  it('exposes BE message even when only ApiClientError.message is available', () => {
    const err = Object.assign(new Error('이미 평가한 상담입니다'), { status: 500 });
    expect(buildRatingErrorAlertMessage(err)).toBe('이미 평가하신 상담입니다.');
  });

  it('exposes BE message when only axios response.data.message is available', () => {
    const err = {
      response: { status: 500, data: { message: '완료된 상담만 평가할 수 있습니다' } },
    };
    expect(buildRatingErrorAlertMessage(err)).toBe('아직 완료되지 않은 상담입니다.');
  });

  it('uses default message when nothing extractable', () => {
    expect(buildRatingErrorAlertMessage(null)).toBe(DEFAULT_RATING_ERROR_MESSAGE);
  });
});
