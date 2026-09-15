import {
  buildInstitutionLinkLatestLogUrl,
  buildInstitutionLinkLogRoutingFields,
  hasInstitutionLinkLatestLog,
  isInstitutionLinkConsultationLogContext,
  mapInstitutionLinkLogToConsultationRecord,
  resolveConsultationLogActionVisibility,
  resolveConsultationScheduleId
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

  test('latest URL uses scheduleId and mappingId', () => {
    expect(buildInstitutionLinkLatestLogUrl({
      id: 'schedule-436',
      mappingId: 265
    })).toBe(
      '/api/v1/institution-link/consultation-records/latest?scheduleId=436&mappingId=265'
    );
  });

  test('hasInstitutionLinkLatestLog — id 있으면 true, null/empty 는 false', () => {
    expect(hasInstitutionLinkLatestLog({ id: 2, scheduleId: 436 })).toBe(true);
    expect(hasInstitutionLinkLatestLog({ data: { id: 9 } })).toBe(true);
    expect(hasInstitutionLinkLatestLog(null)).toBe(false);
    expect(hasInstitutionLinkLatestLog({})).toBe(false);
  });

  test('resolveConsultationLogActionVisibility — 작성/보기 상호배타', () => {
    expect(resolveConsultationLogActionVisibility(true)).toEqual({
      showWrite: false,
      showView: true
    });
    expect(resolveConsultationLogActionVisibility(false)).toEqual({
      showWrite: true,
      showView: false
    });
    expect(resolveConsultationLogActionVisibility(null)).toEqual({
      showWrite: false,
      showView: false
    });
  });

  test('map institution log keeps body fields for reopen', () => {
    const mapped = mapInstitutionLinkLogToConsultationRecord({
      id: 2,
      scheduleId: 436,
      mappingId: 265,
      monthlyOccurrence: 1,
      clientCondition: '상태A',
      mainIssues: '이슈B',
      interventionMethods: '개입C',
      clientResponse: '반응D',
      progressEvaluation: '평가E',
      isSessionCompleted: true
    });
    expect(mapped).toMatchObject({
      id: 2,
      consultationId: 436,
      sessionNumber: 1,
      clientCondition: '상태A',
      mainIssues: '이슈B',
      interventionMethods: '개입C',
      clientResponse: '반응D',
      progressEvaluation: '평가E',
      _institutionLinkLog: true
    });
    expect(resolveConsultationScheduleId({ id: 'schedule-436' })).toBe(436);
  });
});
