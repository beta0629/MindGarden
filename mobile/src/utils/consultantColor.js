/**
 * 상담사별 색상 유틸리티
 * 웹 버전의 통합 상담사 조회 API에서 받아온 gradeColor 활용
 */

/**
 * 상담사 ID를 기반으로 DB에서 가져온 색상 반환
 * @param {number|string} consultantId - 상담사 ID
 * @param {Array} consultants - 상담사 데이터 배열 (gradeColor 필드 포함)
 * @returns {string} 색상 값 (hex)
 */
export const getConsultantColor = (consultantId, consultants = []) => {
  if (!consultantId) return '#6b7280';
  
  // 상담사 데이터 배열에서 해당 ID의 상담사 찾기
  const consultant = consultants.find(c => c.id === consultantId || c.id?.toString() === consultantId?.toString());
  
  // DB에서 가져온 gradeColor가 있으면 우선 사용
  if (consultant && consultant.gradeColor) {
    return consultant.gradeColor;
  }
  
  // gradeColor가 없으면 fallback: ID 기반 해시 색상 생성
  const colors = [
    '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6',
    '#06b6d4', '#84cc16', '#f97316', '#ec4899', '#6366f1',
    '#14b8a6', '#a855f7', '#22c55e', '#eab308', '#ef4444'
  ];
  
  // 간단한 해시 함수로 일관된 색상 선택
  let hash = 0;
  for (let i = 0; i < consultantId.toString().length; i++) {
    const char = consultantId.toString().charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // 32비트 정수로 변환
  }
  
  return colors[Math.abs(hash) % colors.length];
};

/**
 * 상태별 이벤트 색상
 * @param {string} status - 스케줄 상태
 * @returns {string} 색상 값 (hex)
 */
export const getEventColor = (status) => {
  const statusColors = {
    'SCHEDULED': '#3b82f6',
    'BOOKED': '#3b82f6',
    'COMPLETED': '#10b981',
    'CANCELLED': '#ef4444',
    'PENDING': '#f59e0b',
    'VACATION': '#fbbf24'
  };
  
  return statusColors[status] || '#6b7280';
};


