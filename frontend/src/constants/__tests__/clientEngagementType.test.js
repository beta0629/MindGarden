/**
 * 내담자 연계 유형·배정 교차 금지.
 *
 * @author CoreSolution
 * @since 2026-09-14
 */

import {
  ASSIGNMENT_PAYMENT_TIMING,
  ASSIGNMENT_PAYMENT_TIMING_LABELS,
  CLIENT_ENGAGEMENT_MESSAGES,
  CLIENT_ENGAGEMENT_TYPE,
  CLIENT_ENGAGEMENT_TYPE_LABELS,
  allowedPaymentTimingsForClient,
  formatAssignmentAmountKrw,
  isInstitutionLinkClient,
  resolveAssignmentPaymentTiming,
  validateClientEngagementForm
} from '../clientEngagementType';

describe('clientEngagementType', () => {
  test('UI 선택지 라벨은 일반·타기관 / 회기·가예약·기관연계', () => {
    expect(CLIENT_ENGAGEMENT_TYPE_LABELS[CLIENT_ENGAGEMENT_TYPE.SESSION_TICKET]).toBe('일반');
    expect(CLIENT_ENGAGEMENT_TYPE_LABELS[CLIENT_ENGAGEMENT_TYPE.INSTITUTION_LINK]).toBe('타기관');
    expect(ASSIGNMENT_PAYMENT_TIMING_LABELS[ASSIGNMENT_PAYMENT_TIMING.ADVANCE]).toBe('회기');
    expect(ASSIGNMENT_PAYMENT_TIMING_LABELS[ASSIGNMENT_PAYMENT_TIMING.SAME_DAY_CARD]).toBe('가예약');
    expect(ASSIGNMENT_PAYMENT_TIMING_LABELS[ASSIGNMENT_PAYMENT_TIMING.INSTITUTION_LINK]).toBe('기관연계');
  });

  test('일반 내담자는 회기·가예약만', () => {
    expect(allowedPaymentTimingsForClient({ engagementType: CLIENT_ENGAGEMENT_TYPE.SESSION_TICKET }))
      .toEqual([ASSIGNMENT_PAYMENT_TIMING.ADVANCE, ASSIGNMENT_PAYMENT_TIMING.SAME_DAY_CARD]);
    expect(() => resolveAssignmentPaymentTiming(
      { engagementType: CLIENT_ENGAGEMENT_TYPE.SESSION_TICKET },
      ASSIGNMENT_PAYMENT_TIMING.INSTITUTION_LINK
    )).toThrow(CLIENT_ENGAGEMENT_MESSAGES.SESSION_CLIENT_NOT_INSTITUTION);
  });

  test('타기관 내담자는 기관연계만, 가예약 교차 거부', () => {
    const client = { engagementType: CLIENT_ENGAGEMENT_TYPE.INSTITUTION_LINK };
    expect(isInstitutionLinkClient(client)).toBe(true);
    expect(allowedPaymentTimingsForClient(client)).toEqual([ASSIGNMENT_PAYMENT_TIMING.INSTITUTION_LINK]);
    expect(() => resolveAssignmentPaymentTiming(client, ASSIGNMENT_PAYMENT_TIMING.SAME_DAY_CARD))
      .toThrow(CLIENT_ENGAGEMENT_MESSAGES.INSTITUTION_CLIENT_ONLY_ASSIGNMENT);
    expect(resolveAssignmentPaymentTiming(client, null)).toBe(ASSIGNMENT_PAYMENT_TIMING.INSTITUTION_LINK);
  });

  test('타기관 등록 필수 필드', () => {
    const errors = validateClientEngagementForm({
      engagementType: CLIENT_ENGAGEMENT_TYPE.INSTITUTION_LINK
    });
    expect(errors.institutionName).toBe(CLIENT_ENGAGEMENT_MESSAGES.INSTITUTION_NAME_REQUIRED);
    expect(errors.institutionPrepaid).toBe(CLIENT_ENGAGEMENT_MESSAGES.PREPAID_REQUIRED);
  });

  test('고정 금액 tabular 표시용 KRW', () => {
    expect(formatAssignmentAmountKrw(150000)).toBe('150,000원');
  });
});
