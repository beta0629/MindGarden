/**
 * 색상 유틸리티 함수
/**
 * Phase 2: 공통 색상 유틸리티 함수 생성
/**
 * 
/**
 * CSS 변수를 JavaScript에서 사용하기 위한 헬퍼 함수들
 */

/**
 * 상담 상태에 따른 CSS 변수 반환
/**
 * @param {string} status - 상담 상태
/**
 * @returns {string} CSS 변수명
 */
export const getStatusColor = (status) => {
  const statusMap = {
    'REQUESTED': 'var(--status-requested)',
    'ASSIGNED': 'var(--status-assigned)',
    // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
    'CONFIRMED': 'var(--status-confirmed)',
    // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
    'IN_PROGRESS': 'var(--status-in-progress)',
    // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
    'COMPLETED': 'var(--status-completed)',
    // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
    'CANCELLED': 'var(--status-cancelled)',
    'NO_SHOW': 'var(--status-no-show)'
  };
  
  return statusMap[status] || 'var(--user-inactive)';
};

/**
 * 상담 상태에 따른 배경 색상 CSS 변수 반환
/**
 * @param {string} status - 상담 상태
/**
 * @returns {string} CSS 변수명
 */
export const getStatusBgColor = (status) => {
  const statusMap = {
    'REQUESTED': 'var(--status-requested-bg)',
    'ASSIGNED': 'var(--status-assigned-bg)',
    // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
    'CONFIRMED': 'var(--status-confirmed-bg)',
    // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
    'IN_PROGRESS': 'var(--status-in-progress-bg)',
    // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
    'COMPLETED': 'var(--status-completed-bg)',
    // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
    'CANCELLED': 'var(--status-cancelled-bg)'
  };
  
  return statusMap[status] || 'var(--cs-glass-gray-light)';
};

/**
 * 결제 상태에 따른 CSS 변수 반환
/**
 * @param {string} status - 결제 상태
/**
 * @returns {string} CSS 변수명
 */
export const getPaymentColor = (status) => {
  const paymentMap = {
    // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
    'PENDING': 'var(--payment-pending)',
    // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
    'COMPLETED': 'var(--payment-completed)',
    'FAILED': 'var(--payment-failed)',
    'REFUNDED': 'var(--payment-refunded)'
  };
  
  return paymentMap[status] || 'var(--user-inactive)';
};

/**
 * 사용자 상태에 따른 CSS 변수 반환
/**
 * @param {string} status - 사용자 상태
/**
 * @returns {string} CSS 변수명
 */
export const getUserStatusColor = (status) => {
  const userMap = {
    // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
    'ACTIVE': 'var(--user-active)',
    // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
    'INACTIVE': 'var(--user-inactive)',
    // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
    'SUSPENDED': 'var(--user-suspended)',
    // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
    'PENDING': 'var(--user-pending)'
  };
  
  return userMap[status] || 'var(--user-inactive)';
};

/**
 * 상담사 등급에 따른 CSS 변수 반환
/**
 * @param {string} grade - 상담사 등급
/**
 * @returns {string} CSS 변수명
 */
export const getGradeColor = (grade) => {
  const gradeMap = {
    'JUNIOR': 'var(--grade-junior)',
    'SENIOR': 'var(--grade-senior)',
    'EXPERT': 'var(--grade-expert)',
    'MASTER': 'var(--grade-master)'
  };
  
  return gradeMap[grade] || 'var(--user-inactive)';
};

/**
 * 상담사 등급에 따른 배경 색상 CSS 변수 반환
/**
 * @param {string} grade - 상담사 등급
/**
 * @returns {string} CSS 변수명
 */
export const getGradeBgColor = (grade) => {
  const gradeMap = {
    'JUNIOR': 'var(--grade-junior-bg)',
    'SENIOR': 'var(--grade-senior-bg)',
    'EXPERT': 'var(--grade-expert-bg)',
    'MASTER': 'var(--grade-master-bg)'
  };
  
  return gradeMap[grade] || 'var(--cs-glass-gray-light)';
};

/**
 * 역할에 따른 CSS 변수 반환
/**
 * @param {string} role - 사용자 역할
/**
 * @returns {string} CSS 변수명
 */
export const getRoleColor = (role) => {
  const roleMap = {
    'CLIENT': 'var(--role-client)',
    'CONSULTANT': 'var(--role-consultant)',
    'ADMIN': 'var(--role-admin)',
    'BRANCH_SUPER_ADMIN': 'var(--role-branch-admin)',
    'BRANCH_MANAGER': 'var(--role-branch-admin)',
    'HQ_ADMIN': 'var(--role-hq-admin)',
    'HQ_MASTER': 'var(--role-hq-master)'
  };
  
  return roleMap[role] || 'var(--user-inactive)';
};

/**
 * 역할에 따른 배경 색상 CSS 변수 반환
/**
 * @param {string} role - 사용자 역할
/**
 * @returns {string} CSS 변수명
 */
export const getRoleBgColor = (role) => {
  const roleMap = {
    'CLIENT': 'var(--role-client-bg)',
    'CONSULTANT': 'var(--role-consultant-bg)',
    'ADMIN': 'var(--role-admin-bg)'
  };
  
  return roleMap[role] || 'var(--cs-glass-gray-light)';
};

/**
 * 휴가 유형에 따른 CSS 변수 반환
/**
 * @param {string} type - 휴가 유형
/**
 * @returns {string} CSS 변수명
 */
export const getVacationColor = (type) => {
  const vacationMap = {
    'ANNUAL': 'var(--vacation-annual)',
    'SICK': 'var(--vacation-sick)',
    'PERSONAL': 'var(--vacation-personal)',
    'MATERNITY': 'var(--vacation-maternity)',
    'PATERNITY': 'var(--vacation-paternity)',
    'OTHER': 'var(--vacation-other)'
  };
  
  return vacationMap[type] || 'var(--user-inactive)';
};

/**
 * 휴가 유형에 따른 배경 색상 CSS 변수 반환
/**
 * @param {string} type - 휴가 유형
/**
 * @returns {string} CSS 변수명
 */
export const getVacationBgColor = (type) => {
  const vacationMap = {
    'ANNUAL': 'var(--vacation-annual-bg)',
    'SICK': 'var(--vacation-sick-bg)',
    'PERSONAL': 'var(--vacation-personal-bg)'
  };
  
  return vacationMap[type] || 'var(--cs-glass-gray-light)';
};

/**
 * 상태에 따른 한글 라벨 반환
/**
 * @param {string} status - 상태 코드
/**
 * @returns {string} 한글 라벨
 */
export const getStatusLabel = (status) => {
  const labelMap = {
    'REQUESTED': '요청됨',
    'ASSIGNED': '배정됨',
    // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
    'CONFIRMED': '확정',
    // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
    'BOOKED': '예약',
    // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
    'IN_PROGRESS': '진행중',
    // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
    'COMPLETED': '완료',
    // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
    'CANCELLED': '취소됨',
    'NO_SHOW': '노쇼',
    // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
    'PENDING': '대기중',
    // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
    'ACTIVE': '활성',
    // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
    'INACTIVE': '비활성',
    // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
    'SUSPENDED': '정지'
  };
  
  return labelMap[status] || status;
};

/**
 * 등급에 따른 한글 라벨 반환
/**
 * @param {string} grade - 등급 코드
/**
 * @returns {string} 한글 라벨
 */
export const getGradeLabel = (grade) => {
  const labelMap = {
    'JUNIOR': '주니어',
    'SENIOR': '시니어',
    'EXPERT': '전문가',
    'MASTER': '마스터'
  };
  
  return labelMap[grade] || grade;
};

/**
 * 역할에 따른 한글 라벨 반환
/**
 * @param {string} role - 역할 코드
/**
 * @returns {string} 한글 라벨
 */
export const getRoleLabel = (role) => {
  const labelMap = {
    'CLIENT': '내담자',
    'CONSULTANT': '상담사',
    'ADMIN': '관리자',
    'BRANCH_SUPER_ADMIN': '지점 슈퍼관리자',
    'BRANCH_MANAGER': '지점 관리자',
    'HQ_ADMIN': '본사 관리자',
    'HQ_MASTER': '본사 마스터'
  };
  
  return labelMap[role] || role;
};

