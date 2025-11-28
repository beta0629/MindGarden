# 공통코드 관리 시스템 하드코딩 요소 분석

## 📋 개요
현재 공통코드 관리 시스템 및 관련 컴포넌트들에서 발견된 하드코딩된 요소들을 분석하고 동적 처리 방안을 제시합니다.

## 🔍 하드코딩된 요소 목록

### 1. 공통코드 관리 컴포넌트 (`CommonCodeManagement.js`)

#### 1.1 코드그룹 한글명 매핑 (라인 29-63)
```javascript
const getGroupKoreanName = (groupName) => {
    const groupNames = {
        'GENDER': '성별',
        'INCOME_CATEGORY': '수입 카테고리',
        'EXPENSE_CATEGORY': '지출 카테고리',
        'PACKAGE_TYPE': '패키지 유형',
        'PAYMENT_METHOD': '결제 방법',
        'PAYMENT_STATUS': '결제 상태',
        'SPECIALTY': '전문분야',
        'CONSULTATION_TYPE': '상담 유형',
        'CONSULTATION_STATUS': '상담 상태',
        'VACATION_TYPE': '휴가 유형',
        'CONSULTATION_DURATION': '상담 시간',
        'ADDRESS_TYPE': '주소 유형',
        'ITEM_CATEGORY': '아이템 카테고리',
        'MESSAGE_TYPE': '메시지 유형',
        'USER_ROLE': '사용자 역할',
        'NOTIFICATION_TYPE': '알림 유형',
        'CONSULTATION_FEE': '상담료',
        'REPORT_PERIOD': '보고서 기간',
        'MAPPING_STATUS': '매핑 상태',
        'CONSULTATION_SESSION': '상담 세션',
        'PRIORITY': '우선순위',
        'STATUS': '상태',
        'BRANCH_TYPE': '지점 유형',
        'WORK_STATUS': '근무 상태',
        'EMPLOYMENT_TYPE': '고용 유형',
        'EDUCATION_LEVEL': '학력',
        'MARITAL_STATUS': '결혼 상태',
        'LANGUAGE': '언어',
        'TIMEZONE': '시간대',
        'CURRENCY': '통화'
    };
    return groupNames[groupName] || groupName;
};
```

**문제점**: 새로운 코드그룹 추가 시 코드 수정 필요
**해결방안**: 데이터베이스에 그룹별 한글명 저장 후 API로 조회

#### 1.2 인라인 스타일 색상값 (라인 315-630)
```javascript
// 하드코딩된 색상값들
backgroundColor: '#007bff',  // 파란색
color: '#6c757d',           // 회색
backgroundColor: '#d4edda',  // 초록색 (활성)
backgroundColor: '#f8d7da',  // 빨간색 (비활성)
border: '2px solid #dc3545', // 빨간색 테두리
```

**문제점**: 색상 변경 시 코드 수정 필요
**해결방안**: CSS 변수 또는 테마 시스템 도입

### 2. 공통코드 폼 컴포넌트 (`CommonCodeForm.js`)

#### 2.1 코드그룹 옵션 (라인 50-61)
```javascript
setCommonCodeGroupOptions([
    { value: 'PACKAGE_TYPE', label: '패키지 유형', icon: '📦', color: '#3b82f6', description: '상담 패키지 유형' },
    { value: 'PAYMENT_METHOD', label: '결제 방법', icon: '💳', color: '#10b981', description: '결제 수단' },
    { value: 'RESPONSIBILITY', label: '책임', icon: '👤', color: '#f59e0b', description: '책임 및 역할' },
    { value: 'CONSULTATION_TYPE', label: '상담 유형', icon: '💬', color: '#8b5cf6', description: '상담의 유형' },
    { value: 'GENDER', label: '성별', icon: '⚧', color: '#ef4444', description: '사용자 성별' },
    { value: 'ROLE', label: '역할', icon: '👑', color: '#06b6d4', description: '사용자 역할' },
    { value: 'STATUS', label: '상태', icon: '🔄', color: '#f97316', description: '일반적인 상태' },
    { value: 'PRIORITY', label: '우선순위', icon: '⚡', color: '#dc2626', description: '우선순위 구분' },
    { value: 'NOTIFICATION_TYPE', label: '알림 유형', icon: '🔔', color: '#7c3aed', description: '알림의 유형' },
    { value: 'SCHEDULE_STATUS', label: '일정 상태', icon: '📅', color: '#059669', description: '일정의 상태' }
]);
```

**문제점**: 아이콘, 색상, 설명이 하드코딩됨
**해결방안**: CommonCode 테이블에 icon, color, description 필드 추가

### 3. 공통코드 필터 컴포넌트 (`CommonCodeFilters.js`)

#### 3.1 상태 옵션 기본값 (라인 42-46)
```javascript
setActiveStatusOptions([
    { value: '', label: '전체 상태', icon: '📋', color: '#6b7280', description: '모든 상태' },
    { value: 'true', label: '활성', icon: '✅', color: '#10b981', description: '활성 상태' },
    { value: 'false', label: '비활성', icon: '❌', color: '#ef4444', description: '비활성 상태' }
]);
```

**문제점**: 상태값과 아이콘이 하드코딩됨
**해결방안**: STATUS 그룹 코드에서 동적으로 로드

### 4. 스케줄 캘린더 컴포넌트 (`ScheduleCalendar.js`)

#### 4.1 상태별 색상 매핑 (라인 62-73)
```javascript
const colorMap = {
    'AVAILABLE': '#e5e7eb',      // 연한 회색
    'BOOKED': '#3b82f6',         // 파란색
    'CONFIRMED': '#8b5cf6',      // 보라색
    'IN_PROGRESS': '#f59e0b',    // 주황색
    'COMPLETED': '#10b981',      // 초록색
    'CANCELLED': '#ef4444',      // 빨간색
    'BLOCKED': '#6b7280',        // 회색
    'UNDER_REVIEW': '#f97316',   // 주황색
    'VACATION': '#06b6d4',       // 청록색
    'NO_SHOW': '#dc2626'         // 진한 빨간색
};
```

#### 4.2 상태별 아이콘 매핑 (라인 86-97)
```javascript
const iconMap = {
    'AVAILABLE': '⚪',
    'BOOKED': '📅',
    'CONFIRMED': '✅',
    'IN_PROGRESS': '🔄',
    'COMPLETED': '🎉',
    'CANCELLED': '❌',
    'BLOCKED': '🚫',
    'UNDER_REVIEW': '🔍',
    'VACATION': '🏖️',
    'NO_SHOW': '👻'
};
```

**문제점**: 상태별 색상과 아이콘이 하드코딩됨
**해결방안**: CommonCode의 extraData 필드에 JSON 형태로 저장

### 5. 시스템 상태 컴포넌트 (`SystemStatus.js`)

#### 5.1 상태별 색상 및 텍스트 (라인 5-19)
```javascript
const getStatusColor = (status) => {
    switch (status) {
        case 'healthy': return '#28a745';
        case 'error': return '#dc3545';
        default: return '#ffc107';
    }
};

const getStatusText = (status) => {
    switch (status) {
        case 'healthy': return '정상';
        case 'error': return '오류';
        default: return '미확인';
    }
};
```

**문제점**: 시스템 상태별 색상과 텍스트가 하드코딩됨
**해결방안**: SYSTEM_STATUS 그룹 코드로 관리

### 6. 상담사 상태 컴포넌트 (`ConsultantStatus.js`)

#### 6.1 상태별 아이콘 매핑 (라인 141-152)
```javascript
const getStatusIcon = (status) => {
    switch (status.type) {
        case 'available':
            return '🟢';
        case 'busy':
            return '🟡';
        case 'unavailable':
            return '🔴';
        default:
            return '⚪';
    }
};
```

**문제점**: 상담사 상태별 아이콘이 하드코딩됨
**해결방안**: CONSULTANT_STATUS 그룹 코드로 관리

### 7. 통계 대시보드 컴포넌트 (`StatisticsDashboard.js`)

#### 7.1 일정 상태 기본값 (라인 82-88)
```javascript
setScheduleStatusOptions([
    { value: 'all', label: '전체', icon: '📋', color: '#6b7280', description: '모든 상태' },
    { value: 'AVAILABLE', label: '사용가능', icon: '✅', color: '#10b981', description: '사용 가능한 일정' },
    { value: 'BOOKED', label: '예약됨', icon: '📅', color: '#3b82f6', description: '예약된 일정' },
    { value: 'BLOCKED', label: '차단됨', icon: '🚫', color: '#ef4444', description: '차단된 일정' },
    { value: 'MAINTENANCE', label: '점검중', icon: '🔧', color: '#f59e0b', description: '점검 중인 일정' }
]);
```

**문제점**: 일정 상태별 옵션이 하드코딩됨
**해결방안**: SCHEDULE_STATUS 그룹에서 동적 로드

### 8. 클라이언트 관리 컴포넌트 (`ClientComprehensiveManagement.js`)

#### 8.1 사용자 상태 기본값 (라인 62-67)
```javascript
setUserStatusOptions([
    { value: 'ACTIVE', label: '활성', icon: '🟢', color: '#10b981', description: '활성 사용자' },
    { value: 'INACTIVE', label: '비활성', icon: '🔴', color: '#6b7280', description: '비활성 사용자' },
    { value: 'SUSPENDED', label: '일시정지', icon: '⏸️', color: '#f59e0b', description: '일시정지된 사용자' },
    { value: 'COMPLETED', label: '완료', icon: '✅', color: '#8b5cf6', description: '완료된 사용자' }
]);
```

**문제점**: 사용자 상태별 옵션이 하드코딩됨
**해결방안**: USER_STATUS 그룹에서 동적 로드

## 🎯 동적 처리 우선순위

### 높은 우선순위 (즉시 처리 필요)
1. **코드그룹 한글명 매핑** - 새로운 그룹 추가 시 코드 수정 필요
2. **상태별 색상 매핑** - UI 일관성을 위해 중요
3. **상태별 아이콘 매핑** - 사용자 경험에 직접 영향

### 중간 우선순위 (단계적 처리)
4. **코드그룹 옵션** - 폼에서 사용되는 기본 옵션들
5. **시스템 상태** - 시스템 모니터링 관련
6. **상담사 상태** - 실시간 상태 표시

### 낮은 우선순위 (장기적 개선)
7. **통계 대시보드 옵션** - 필터링 관련
8. **클라이언트 상태** - 관리 기능 관련

## 💡 해결 방안

### 1. 데이터베이스 스키마 개선
```sql
-- CommonCode 테이블에 추가 필드
ALTER TABLE common_codes ADD COLUMN icon VARCHAR(10);
ALTER TABLE common_codes ADD COLUMN color_code VARCHAR(7);
ALTER TABLE common_codes ADD COLUMN korean_name VARCHAR(100);
ALTER TABLE common_codes ADD COLUMN display_order INT DEFAULT 0;

-- 코드그룹별 메타데이터 테이블 생성
CREATE TABLE code_group_metadata (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    group_name VARCHAR(50) NOT NULL UNIQUE,
    korean_name VARCHAR(100) NOT NULL,
    description TEXT,
    icon VARCHAR(10),
    color_code VARCHAR(7),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### 2. API 엔드포인트 추가
```javascript
// 코드그룹 메타데이터 조회
GET /api/admin/common-codes/group-metadata

// 코드그룹별 한글명 조회
GET /api/admin/common-codes/group/{groupName}/korean-name

// 상태별 색상/아이콘 조회
GET /api/admin/common-codes/group/{groupName}/display-options
```

### 3. 공통 유틸리티 함수 생성
```javascript
// utils/codeHelper.js
export const getCodeGroupKoreanName = async (groupName) => {
    // API 호출로 동적 조회
};

export const getStatusColor = (codeValue, groupName) => {
    // extraData에서 색상 정보 추출
};

export const getStatusIcon = (codeValue, groupName) => {
    // extraData에서 아이콘 정보 추출
};
```

### 4. CSS 변수 시스템 도입
```css
:root {
    --color-primary: #007bff;
    --color-success: #10b981;
    --color-danger: #ef4444;
    --color-warning: #f59e0b;
    --color-info: #06b6d4;
}
```

## 📝 구현 계획

### Phase 1: 데이터베이스 스키마 개선
- [ ] CommonCode 테이블에 icon, color_code, korean_name 필드 추가
- [ ] code_group_metadata 테이블 생성
- [ ] 기존 데이터 마이그레이션

### Phase 2: API 엔드포인트 개발
- [ ] 코드그룹 메타데이터 조회 API
- [ ] 상태별 표시 옵션 조회 API
- [ ] 코드그룹별 한글명 조회 API

### Phase 3: 프론트엔드 리팩토링
- [ ] 하드코딩된 매핑 함수들을 API 호출로 변경
- [ ] 공통 유틸리티 함수 생성
- [ ] CSS 변수 시스템 도입

### Phase 4: 테스트 및 검증
- [ ] 모든 컴포넌트에서 동적 로딩 테스트
- [ ] 새로운 코드그룹 추가 시 자동 반영 확인
- [ ] 성능 최적화 및 캐싱 적용

## 🔧 즉시 적용 가능한 임시 해결책

### 1. 상수 파일 분리
```javascript
// constants/codeGroups.js
export const CODE_GROUP_NAMES = {
    'GENDER': '성별',
    'INCOME_CATEGORY': '수입 카테고리',
    // ... 기타 그룹들
};

// constants/colors.js
export const STATUS_COLORS = {
    'AVAILABLE': '#e5e7eb',
    'BOOKED': '#3b82f6',
    // ... 기타 색상들
};
```

### 2. 설정 파일로 분리
```javascript
// config/codeConfig.js
export const codeGroupConfig = {
    groups: {
        'GENDER': {
            koreanName: '성별',
            icon: '⚧',
            color: '#ef4444'
        }
        // ... 기타 설정들
    }
};
```

이렇게 하드코딩된 요소들을 체계적으로 분석하고 동적 처리 방안을 제시했습니다. 우선순위에 따라 단계적으로 구현하면 시스템의 유지보수성과 확장성이 크게 향상될 것입니다.
