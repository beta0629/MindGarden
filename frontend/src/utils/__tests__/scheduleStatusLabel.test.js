import {
  SCHEDULE_STATUS_LABEL_FALLBACK,
  SCHEDULE_STATUS_LABEL_I18N_PREFIX,
  SCHEDULE_STATUS_UNKNOWN_I18N_KEY,
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

  test('라벨이 없으면 unknown i18n, translate 가 없으면 defaultValue 상수', () => {
    const translateSpy = jest.fn((key, opts = {}) => {
      if (key === SCHEDULE_STATUS_UNKNOWN_I18N_KEY) {
        return '상태 없음';
      }
      return translate(key, opts);
    });

    expect(resolveScheduleStatusDisplayLabel('UNKNOWN_STATUS', {
      codes: [{ value: 'UNKNOWN_STATUS', label: 'UNKNOWN_STATUS' }],
      translate: translateSpy
    })).toBe('상태 없음');
    expect(translateSpy).toHaveBeenCalledWith(SCHEDULE_STATUS_UNKNOWN_I18N_KEY, {
      defaultValue: SCHEDULE_STATUS_LABEL_FALLBACK
    });
    expect(resolveScheduleStatusDisplayLabel('', { translate: translateSpy })).toBe('상태 없음');
    expect(resolveScheduleStatusDisplayLabel(null)).toBe(SCHEDULE_STATUS_LABEL_FALLBACK);
  });
});
