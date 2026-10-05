import {
  buildInstitutionLinkLatestLogUrl,
  buildInstitutionLinkLogRoutingFields,
  hasInstitutionLinkLatestLog,
  isInstitutionLinkConsultationLogContext,
  mapInstitutionLinkLogToConsultationRecord,
  resolveConsultationScheduleId,
  resolveScheduleConsultationLogEntry,
  CONSULTATION_LOG_ENTRY_MODE
} from '../consultationLogInstitutionContext';

const entry = (statusCode, hasConsultationRecord, extra = {}) => resolveScheduleConsultationLogEntry({
  statusCode,
  hasConsultationRecord,
  canAccessBody: true,
  ...extra
});

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

  test('hasInstitutionLinkLatestLog — 동일 mapping·다른 schedule 이면 false', () => {
    expect(hasInstitutionLinkLatestLog(
      { id: 2, scheduleId: 436, mappingId: 265 },
      { id: 453, mappingId: 265 }
    )).toBe(false);
    expect(hasInstitutionLinkLatestLog(
      { data: { id: 2, scheduleId: 436, mappingId: 265 } },
      { id: 'schedule-453', mappingId: 265 }
    )).toBe(false);
  });

  test('hasInstitutionLinkLatestLog — 동일 scheduleId 매치면 true', () => {
    expect(hasInstitutionLinkLatestLog(
      { id: 10, scheduleId: 453, mappingId: 265 },
      { id: 453, mappingId: 265 }
    )).toBe(true);
    expect(hasInstitutionLinkLatestLog(
      { id: 10, scheduleId: 453, mappingId: 265 },
      { id: 'schedule-453', mappingId: 265 }
    )).toBe(true);
  });

  test('CONFIRMED + IL + records empty(미스매치 latest) → write visible', () => {
    const hasRecord = hasInstitutionLinkLatestLog(
      { id: 2, scheduleId: 436, mappingId: 265 },
      { id: 453, mappingId: 265, paymentTiming: 'INSTITUTION_LINK', status: 'CONFIRMED' }
    );
    expect(hasRecord).toBe(false);
    expect(entry('CONFIRMED', hasRecord)).toEqual({ visible: true, mode: CONSULTATION_LOG_ENTRY_MODE.WRITE });
  });

  test('resolveScheduleConsultationLogEntry — 일지 있으면 CONFIRMED·IN_PROGRESS·COMPLETED 모두 보기/수정', () => {
    ['CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'TENTATIVE_PENDING_PAYMENT'].forEach((status) => {
      expect(entry(status, true)).toEqual({ visible: true, mode: CONSULTATION_LOG_ENTRY_MODE.VIEW });
      expect(entry(status, false)).toEqual({ visible: true, mode: CONSULTATION_LOG_ENTRY_MODE.WRITE });
      expect(entry(status, null)).toEqual({ visible: true, mode: CONSULTATION_LOG_ENTRY_MODE.WRITE });
    });
  });

  test('resolveScheduleConsultationLogEntry — 본문 권한 없음(사무원·내담자)·휴가·BOOKED·CANCELLED 는 숨김', () => {
    const hidden = { visible: false, mode: null };
    expect(entry('CONFIRMED', true, { canAccessBody: false })).toEqual(hidden);
    expect(entry('COMPLETED', true, { isVacation: true })).toEqual(hidden);
    expect(entry('BOOKED', true)).toEqual(hidden);
    expect(entry('CANCELLED', true)).toEqual(hidden);
    expect(entry(null, true)).toEqual(hidden);
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
