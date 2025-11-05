/**
 * 세션 검증 유틸리티
 * 
 * 중앙화된 세션 시스템을 활용하여 스케줄 생성 가능 여부 검증
 */

/**
 * 매칭이 스케줄 생성 가능한지 검증
 * 
 * @param {Object} mapping - 매칭 정보
 * @param {string} mapping.status - 매칭 상태 (ACTIVE, PENDING_PAYMENT 등)
 * @param {number} mapping.remainingSessions - 남은 세션 수
 * @returns {boolean} 스케줄 생성 가능 여부
 */
export const canCreateSchedule = (mapping) => {
  if (!mapping) return false;
  
  // 활성 상태이고 세션이 남아있어야 함
  // 상태 필터 완화: 더 많은 상태 허용
  const isActive = mapping.status === 'ACTIVE' || 
                   mapping.status === 'PENDING_PAYMENT' || 
                   mapping.status === 'PAYMENT_CONFIRMED' ||
                   mapping.status === 'ACTIVE_PENDING';
  
  const hasRemainingSessions = (mapping.remainingSessions || 0) > 0;
  
  // 세션이 없어도 매핑은 표시 (비활성화된 상태로)
  // return isActive && hasRemainingSessions;
  
  // 활성 상태이거나 세션이 있으면 표시 (더 관대한 조건)
  return isActive || hasRemainingSessions;
};

/**
 * 매칭의 세션 상태 메시지 반환
 * 
 * @param {Object} mapping - 매칭 정보
 * @returns {Object} { status: 'available' | 'low' | 'none', message: string }
 */
export const getSessionStatus = (mapping) => {
  if (!mapping) {
    return { status: 'none', message: '매칭 정보가 없습니다.' };
  }
  
  const remainingSessions = mapping.remainingSessions || 0;
  
  if (remainingSessions === 0) {
    return { 
      status: 'none', 
      message: '사용 가능한 세션이 없습니다. 세션을 추가해주세요.' 
    };
  }
  
  if (remainingSessions <= 2) {
    return { 
      status: 'low', 
      message: `세션이 부족합니다. (${remainingSessions}회 남음)` 
    };
  }
  
  return { 
    status: 'available', 
    message: `${remainingSessions}회 남음` 
  };
};

/**
 * 활성 매칭만 필터링
 * 
 * @param {Array} mappings - 매칭 목록
 * @returns {Array} 활성 매칭 목록
 */
export const filterActiveMappings = (mappings) => {
  if (!Array.isArray(mappings)) return [];
  
  return mappings.filter(m => 
    m.status === 'ACTIVE' || 
    m.status === 'PENDING_PAYMENT' || 
    m.status === 'PAYMENT_CONFIRMED'
  );
};

/**
 * 스케줄 생성 가능한 매칭만 필터링
 * 
 * @param {Array} mappings - 매칭 목록
 * @returns {Array} 스케줄 생성 가능한 매칭 목록
 */
export const filterSchedulableMappings = (mappings) => {
  return filterActiveMappings(mappings).filter(canCreateSchedule);
};

