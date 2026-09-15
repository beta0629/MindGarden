/**
 * 내담자 연계 유형 — 배정이 rem 으로 추정하지 않는다.
 */
import {
  CLIENT_ENGAGEMENT_TYPE,
  isInstitutionLinkClient,
  isInstitutionLinkEngagement,
  shouldRenderInstitutionLinkBadge
} from '../clientEngagementType';

describe('clientEngagementType', () => {
  it('INSTITUTION_LINK 만 타기관으로 본다', () => {
    expect(isInstitutionLinkEngagement(CLIENT_ENGAGEMENT_TYPE.INSTITUTION_LINK)).toBe(true);
    expect(isInstitutionLinkEngagement(CLIENT_ENGAGEMENT_TYPE.SESSION_TICKET)).toBe(false);
    expect(isInstitutionLinkEngagement('VOUCHER')).toBe(false);
  });

  it('내담자 engagementType 으로 타기관을 판별한다', () => {
    expect(isInstitutionLinkClient({ engagementType: 'INSTITUTION_LINK' })).toBe(true);
    expect(isInstitutionLinkClient({ remainingSessions: 0 })).toBe(false);
  });

  it('배지: rem=0 만으로는 그리지 않고 유형/타이밍으로 그린다', () => {
    expect(shouldRenderInstitutionLinkBadge({ remainingSessions: 0 })).toBe(false);
    expect(shouldRenderInstitutionLinkBadge({ clientEngagementType: 'INSTITUTION_LINK' })).toBe(true);
    expect(shouldRenderInstitutionLinkBadge({ paymentTiming: 'INSTITUTION_LINK' })).toBe(true);
  });
});
