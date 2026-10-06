import {
  SCHEDULE_STATUS_LABEL_FALLBACK,
  SCHEDULE_STATUS_LABEL_I18N_PREFIX,
  resolveScheduleStatusDisplayLabel
} from '../scheduleStatusLabel';

const translate = (key, opts = {}) => {
  const table = {
    [`${SCHEDULE_STATUS_LABEL_I18N_PREFIX}COMPLETED`]: '완료',
    [`${SCHEDULE_STATUS_LABEL_I18N_PREFIX}TENTATIVE_PENDING_PAYMENT`]: '가예약'
  };
  if (table[key]) {
    return table[key];
  }
  return opts.defaultValue != null ? opts.defaultValue : key;
};

describe('resolveScheduleStatusDisplayLabel', () => {
  test('공통코드 한글명이 있으면 그 라벨을 쓴다', () => {
    expect(resolveScheduleStatusDisplayLabel('COMPLETED', {
      codes: [{ codeValue: 'COMPLETED', koreanName: '상담 완료' }],
      translate
    })).toBe('상담 완료');
  });

  test('공통코드가 없으면 i18n 라벨을 쓴다', () => {
    expect(resolveScheduleStatusDisplayLabel('TENTATIVE_PENDING_PAYMENT', {
      codes: [],
      translate
    })).toBe('가예약');
    expect(resolveScheduleStatusDisplayLabel('COMPLETED', { translate })).toBe('완료');
  });

  test('라벨이 없으면 원문 대신 공통 폴백', () => {
    expect(resolveScheduleStatusDisplayLabel('UNKNOWN_STATUS', {
      codes: [{ value: 'UNKNOWN_STATUS', label: 'UNKNOWN_STATUS' }],
      translate
    })).toBe(SCHEDULE_STATUS_LABEL_FALLBACK);
    expect(resolveScheduleStatusDisplayLabel('', { translate })).toBe(SCHEDULE_STATUS_LABEL_FALLBACK);
    expect(resolveScheduleStatusDisplayLabel(null)).toBe(SCHEDULE_STATUS_LABEL_FALLBACK);
  });
});
