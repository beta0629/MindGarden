/**
 * 색상 유틸리티 함수
 * Phase 2: 공통 색상 유틸리티 함수 생성
 * 
 * CSS 변수를 JavaScript에서 사용하기 위한 헬퍼 함수들
 */

/**
 * 상담 상태에 따른 CSS 변수 반환
 * @param {string} status - 상담 상태
 * @returns {string} CSS 변수명
 */
export const getStatusColor = (status) => {
  const statusMap = {
    'REQUESTED': 'var(--status-requested)',
    'ASSIGNED': 'var(--status-assigned)',
    'CONFIRMED': 'var(--status-confirmed)',
    'IN_PROGRESS': 'var(--status-in-progress)',
    'COMPLETED': 'var(--status-completed)',
    'CANCELLED': 'var(--status-cancelled)',
    'NO_SHOW': 'var(--status-no-show)'
  };
  
  return statusMap[status] || 'var(--user-inactive)';
};

/**
 * 상담 상태에 따른 배경 색상 CSS 변수 반환
 * @param {string} status - 상담 상태
 * @returns {string} CSS 변수명
 */
export const getStatusBgColor = (status) => {
  const statusMap = {
    'REQUESTED': 'var(--status-requested-bg)',
    'ASSIGNED': 'var(--status-assigned-bg)',
    'CONFIRMED': 'var(--status-confirmed-bg)',
    'IN_PROGRESS': 'var(--status-in-progress-bg)',
    'COMPLETED': 'var(--status-completed-bg)',
    'CANCELLED': 'var(--status-cancelled-bg)'
  };
  
  return statusMap[status] || 'rgba(107, 114, 128, 0.1)';
};

/**
 * 결제 상태에 따른 CSS 변수 반환
 * @param {string} status - 결제 상태
 * @returns {string} CSS 변수명
 */
export const getPaymentColor = (status) => {
  const paymentMap = {
    'PENDING': 'var(--payment-pending)',
    'COMPLETED': 'var(--payment-completed)',
    'FAILED': 'var(--payment-failed)',
    'REFUNDED': 'var(--payment-refunded)'
  };
  
  return paymentMap[status] || 'var(--user-inactive)';
};

/**
 * 사용자 상태에 따른 CSS 변수 반환
 * @param {string} status - 사용자 상태
 * @returns {string} CSS 변수명
 */
export const getUserStatusColor = (status) => {
  const userMap = {
    'ACTIVE': 'var(--user-active)',
    'INACTIVE': 'var(--user-inactive)',
    'SUSPENDED': 'var(--user-suspended)',
    'PENDING': 'var(--user-pending)'
  };
  
  return userMap[status] || 'var(--user-inactive)';
};

/**
 * 상담사 등급에 따른 CSS 변수 반환
 * @param {string} grade - 상담사 등급
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
 * @param {string} grade - 상담사 등급
 * @returns {string} CSS 변수명
 */
export const getGradeBgColor = (grade) => {
  const gradeMap = {
    'JUNIOR': 'var(--grade-junior-bg)',
    'SENIOR': 'var(--grade-senior-bg)',
    'EXPERT': 'var(--grade-expert-bg)',
    'MASTER': 'var(--grade-master-bg)'
  };
  
  return gradeMap[grade] || 'rgba(107, 114, 128, 0.1)';
};

/**
 * 역할에 따른 CSS 변수 반환
 * @param {string} role - 사용자 역할
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
 * @param {string} role - 사용자 역할
 * @returns {string} CSS 변수명
 */
export const getRoleBgColor = (role) => {
  const roleMap = {
    'CLIENT': 'var(--role-client-bg)',
    'CONSULTANT': 'var(--role-consultant-bg)',
    'ADMIN': 'var(--role-admin-bg)'
  };
  
  return roleMap[role] || 'rgba(107, 114, 128, 0.1)';
};

/**
 * 휴가 유형에 따른 CSS 변수 반환
 * @param {string} type - 휴가 유형
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
 * @param {string} type - 휴가 유형
 * @returns {string} CSS 변수명
 */
export const getVacationBgColor = (type) => {
  const vacationMap = {
    'ANNUAL': 'var(--vacation-annual-bg)',
    'SICK': 'var(--vacation-sick-bg)',
    'PERSONAL': 'var(--vacation-personal-bg)'
  };
  
  return vacationMap[type] || 'rgba(107, 114, 128, 0.1)';
};

/**
 * 상태에 따른 한글 라벨 반환
 * @param {string} status - 상태 코드
 * @returns {string} 한글 라벨
 */
export const getStatusLabel = (status) => {
  const labelMap = {
    'REQUESTED': '요청됨',
    'ASSIGNED': '배정됨',
    'CONFIRMED': '확인됨',
    'IN_PROGRESS': '진행중',
    'COMPLETED': '완료',
    'CANCELLED': '취소됨',
    'NO_SHOW': '노쇼',
    'PENDING': '대기중',
    'ACTIVE': '활성',
    'INACTIVE': '비활성',
    'SUSPENDED': '정지'
  };
  
  return labelMap[status] || status;
};

/**
 * 등급에 따른 한글 라벨 반환
 * @param {string} grade - 등급 코드
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
 * @param {string} role - 역할 코드
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

