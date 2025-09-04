/**
 * 스케줄 관련 상수
 * 시간 슬롯, 상담 시간, 업무 시간 등 스케줄 관련 설정
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2024-12-19
 */

// 업무 시간 설정
export const BUSINESS_HOURS = {
  START_HOUR: 9,
  END_HOUR: 18
};

// 시간 슬롯 간격 (분)
export const TIME_SLOT_INTERVAL = 30;

// 상담 타입별 기본 시간 설정 (분)
export const CONSULTATION_DURATIONS = {
  '초기상담': 60,
  '진행상담': 50,
  '종결상담': 50,
  '가족상담': 100,
  '부부상담': 80,
  '그룹상담': 90,
  '긴급상담': 30,
  '사후관리': 40,
  '평가상담': 120
};

// 기본 상담 시간 (분)
export const DEFAULT_CONSULTATION_DURATION = 50;

// 휴식시간 (분)
export const BREAK_TIME_MINUTES = 10;

// 시간 포맷팅 상수
export const TIME_FORMAT = {
  HOUR_MINUTE: 'HH:mm',
  FULL_DATETIME: 'YYYY-MM-DD HH:mm:ss'
};

// 스케줄 상태
export const SCHEDULE_STATUS = {
  PENDING: 'PENDING',
  CONFIRMED: 'CONFIRMED',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
  NO_SHOW: 'NO_SHOW'
};

// 스케줄 타입
export const SCHEDULE_TYPES = {
  CONSULTATION: 'CONSULTATION',
  SUPERVISION: 'SUPERVISION',
  TRAINING: 'TRAINING',
  MEETING: 'MEETING'
};
