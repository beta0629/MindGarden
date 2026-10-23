import {
  buildInstitutionLinkLogRoutingFields,
  isInstitutionLinkConsultationLogContext
} from '../consultationLogInstitutionContext';

describe('consultationLogInstitutionContext', () => {
  test('schedule paymentTiming INSTITUTION_LINK → true', () => {
    expect(isInstitutionLinkConsultationLogContext(
      { paymentTiming: 'INSTITUTION_LINK', sessionSequence: null },
      null,
      null
    )).toBe(true);
  });

  test('client engagementType 만으로 true (매핑 SAME_DAY 오배정 대비)', () => {
    expect(isInstitutionLinkConsultationLogContext(
      { paymentTiming: 'SAME_DAY_CARD', sessionSequence: null, mappingId: 265 },
      { id: 78, engagementType: 'INSTITUTION_LINK' },
      null
    )).toBe(true);
  });

  test('일반 회기 내담자 → false (rem=0 으로 추정 금지)', () => {
    expect(isInstitutionLinkConsultationLogContext(
      { remainingSessions: 0, sessionSequence: null },
      { engagementType: 'SESSION_TICKET' },
      null
    )).toBe(false);
  });

  test('routing fields include engagementType + mappingId', () => {
    expect(buildInstitutionLinkLogRoutingFields(
      { mappingId: '265', paymentTiming: 'SAME_DAY_CARD' },
      { engagementType: 'INSTITUTION_LINK' }
    )).toEqual({
      mappingId: 265,
      paymentTiming: 'SAME_DAY_CARD',
      engagementType: 'INSTITUTION_LINK'
    });
  });
});
