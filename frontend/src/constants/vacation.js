// 휴무 관련 공통 코드
export const VACATION_TYPES = {
  MORNING: 'MORNING',           // 오전 휴무 (반차)
  AFTERNOON: 'AFTERNOON',       // 오후 휴무 (반차)
  ALL_DAY: 'ALL_DAY',           // 하루 종일 휴무
  MORNING_HALF: 'MORNING_HALF', // 오전 반반차 (2시간)
  AFTERNOON_HALF: 'AFTERNOON_HALF', // 오후 반반차 (2시간)
  CUSTOM_TIME: 'CUSTOM_TIME'    // 사용자 정의 시간
};

export const VACATION_TYPE_LABELS = {
  [VACATION_TYPES.MORNING]: '오전 휴무 (반차)',
  [VACATION_TYPES.AFTERNOON]: '오후 휴무 (반차)',
  [VACATION_TYPES.ALL_DAY]: '하루 종일 휴무',
  [VACATION_TYPES.MORNING_HALF]: '오전 반반차 (2시간)',
  [VACATION_TYPES.AFTERNOON_HALF]: '오후 반반차 (2시간)',
  [VACATION_TYPES.CUSTOM_TIME]: '사용자 정의 시간'
};

export const VACATION_TYPE_ICONS = {
  [VACATION_TYPES.MORNING]: '🌅',
  [VACATION_TYPES.AFTERNOON]: '🌇',
  [VACATION_TYPES.ALL_DAY]: '🏖️',
  [VACATION_TYPES.MORNING_HALF]: '🌄',
  [VACATION_TYPES.AFTERNOON_HALF]: '🌆',
  [VACATION_TYPES.CUSTOM_TIME]: '⏰'
};

export const VACATION_TYPE_COLORS = {
  [VACATION_TYPES.MORNING]: '#FF9800',      // 오렌지
  [VACATION_TYPES.AFTERNOON]: '#FF5722',    // 딥오렌지
  [VACATION_TYPES.ALL_DAY]: '#F44336',      // 빨간색
  [VACATION_TYPES.MORNING_HALF]: '#FFC107', // 앰버
  [VACATION_TYPES.AFTERNOON_HALF]: '#FF7043', // 딥오렌지
  [VACATION_TYPES.CUSTOM_TIME]: '#9C27B0'   // 퍼플
};

// 시간대별 기본 설정
export const TIME_SLOTS = {
  MORNING: {
    start: '09:00',
    end: '12:00',
    label: '오전 (09:00-12:00)'
  },
  AFTERNOON: {
    start: '13:00',
    end: '18:00',
    label: '오후 (13:00-18:00)'
  },
  MORNING_HALF: {
    start: '09:00',
    end: '11:00',
    label: '오전 반반차 (09:00-11:00)'
  },
  AFTERNOON_HALF: {
    start: '14:00',
    end: '16:00',
    label: '오후 반반차 (14:00-16:00)'
  }
};

// 휴무 사유 기본값
export const DEFAULT_VACATION_REASONS = [
  '개인 사정',
  '건강상의 이유',
  '가족 행사',
  '교육/연수',
  '기타'
];
