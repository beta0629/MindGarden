import {
  MAPPING_ENGAGEMENT_TYPE,
  MAPPING_ENGAGEMENT_TYPE_LABELS,
  isInstitutionLinkEngagement,
  isVoucherEngagement,
  normalizeEngagementTypeValue,
  resolveMappingEngagementType,
  shouldRenderEngagementTypeBadge,
  stampPaymentTimingOnScheduleEvents
} from '../mappingEngagementType';

describe('mappingEngagementType', () => {
  it('정규화는 INSTITUTION_LINK / VOUCHER 만 배지 유형으로 인정한다', () => {
    expect(normalizeEngagementTypeValue('institution_link')).toBe(
      MAPPING_ENGAGEMENT_TYPE.INSTITUTION_LINK
    );
    expect(normalizeEngagementTypeValue('VOUCHER')).toBe(MAPPING_ENGAGEMENT_TYPE.VOUCHER);
    expect(normalizeEngagementTypeValue('SAME_DAY_CARD')).toBeNull();
    expect(normalizeEngagementTypeValue('ADVANCE')).toBeNull();
    expect(normalizeEngagementTypeValue(null)).toBeNull();
  });

  it('remainingSessions=0 만으로는 타기관·바우처가 아니다', () => {
    const mapping = {
      remainingSessions: 0,
      sessionSequence: null,
      paymentTiming: 'ADVANCE'
    };
    expect(resolveMappingEngagementType(mapping)).toBeNull();
    expect(shouldRenderEngagementTypeBadge(mapping)).toBe(false);
    expect(isInstitutionLinkEngagement(mapping.paymentTiming)).toBe(false);
  });

  it('paymentTiming=INSTITUTION_LINK 이면 기관연동이고 바우처가 아니다', () => {
    const mapping = { paymentTiming: 'INSTITUTION_LINK', remainingSessions: 0 };
    expect(resolveMappingEngagementType(mapping)).toBe(MAPPING_ENGAGEMENT_TYPE.INSTITUTION_LINK);
    expect(shouldRenderEngagementTypeBadge(mapping)).toBe(true);
    expect(isVoucherEngagement(mapping.paymentTiming)).toBe(false);
    expect(MAPPING_ENGAGEMENT_TYPE_LABELS[MAPPING_ENGAGEMENT_TYPE.INSTITUTION_LINK]).toBe('기관연동');
  });

  it('engagementType 이 paymentTiming 보다 우선하고 VOUCHER 는 타기관이 아니다', () => {
    const mapping = {
      engagementType: 'VOUCHER',
      paymentTiming: 'INSTITUTION_LINK',
      remainingSessions: 9
    };
    expect(resolveMappingEngagementType(mapping)).toBe(MAPPING_ENGAGEMENT_TYPE.VOUCHER);
    expect(isInstitutionLinkEngagement(mapping.engagementType)).toBe(false);
    expect(isVoucherEngagement(mapping.engagementType)).toBe(true);
    expect(MAPPING_ENGAGEMENT_TYPE_LABELS[MAPPING_ENGAGEMENT_TYPE.VOUCHER]).toBe('바우처');
  });

  it('바우처 데이터가 없으면 배지를 그리지 않는다', () => {
    expect(shouldRenderEngagementTypeBadge({})).toBe(false);
    expect(shouldRenderEngagementTypeBadge({ paymentTiming: 'SAME_DAY_CARD' })).toBe(false);
    expect(shouldRenderEngagementTypeBadge(MAPPING_ENGAGEMENT_TYPE.SESSION_TICKET)).toBe(false);
  });

  it('캘린더 이벤트에 paymentTiming 만 복사하고 remaining 은 그대로 둔다', () => {
    const events = [{
      id: 1,
      extendedProps: {
        mappingId: 77,
        remainingSessions: 4
      }
    }];
    const stamped = stampPaymentTimingOnScheduleEvents(
      events,
      { 77: MAPPING_ENGAGEMENT_TYPE.INSTITUTION_LINK }
    );
    expect(stamped[0].extendedProps.paymentTiming).toBe(MAPPING_ENGAGEMENT_TYPE.INSTITUTION_LINK);
    expect(stamped[0].extendedProps.remainingSessions).toBe(4);
    expect(events[0].extendedProps.paymentTiming).toBeUndefined();
  });
});
