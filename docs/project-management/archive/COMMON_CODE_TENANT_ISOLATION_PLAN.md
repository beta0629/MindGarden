# 공통 코드 테넌트 독립성 보장 계획

**작성일**: 2025-11-25  
**버전**: 1.0.0  
**상태**: 제안

---

## 📋 문제점

### 현재 구조의 문제

1. **통합 조회 API의 폴백 메커니즘**
   - `/api/v1/common-codes?codeGroup=XXX` API가 테넌트 코드 우선, 없으면 코어 코드를 반환
   - 이로 인해 테넌트별 독립성이 보장되지 않음

2. **요금 체계 공유 문제**
   - `CONSULTATION_PACKAGE`, `PACKAGE_TYPE`, `PAYMENT_METHOD` 등이 코어 코드로 폴백되면
   - 테넌트 A와 테넌트 B가 서로 다른 요금 체계를 가져야 하는데 공유하게 됨

3. **독립성 부족**
   - 각 테넌트가 완전히 독립된 시스템처럼 동작해야 하는데, 코어 코드 폴백으로 인해 의존성 발생

---

## 🎯 목표

1. **테넌트별 완전 독립성 보장**
   - 각 테넌트는 자신의 공통 코드만 사용
   - 다른 테넌트의 코드에 접근 불가

2. **요금 체계 독립성**
   - 각 테넌트는 자신만의 요금 체계, 패키지 타입, 결제 방법을 가짐
   - 코어 코드 폴백 없이 테넌트별 코드만 사용

3. **시스템 전역 코드 분리**
   - `USER_STATUS`, `ROLE`, `CODE_GROUP_TYPE` 등만 코어 코드로 관리
   - 비즈니스 로직 관련 코드는 모두 테넌트별로 관리

---

## 🏗️ 개선 방안

### 1. 코드 그룹 분류 명확화

#### 코어 코드 (CORE) - 시스템 전역
- `USER_STATUS`: 사용자 상태 (ACTIVE, INACTIVE 등)
- `USER_ROLE`: 사용자 역할 (CLIENT, CONSULTANT 등)
- `CODE_GROUP_TYPE`: 코드 그룹 타입 (CORE, TENANT)
- `SYSTEM_STATUS`: 시스템 상태 코드

#### 테넌트 코드 (TENANT) - 비즈니스 로직
- `CONSULTATION_PACKAGE`: 상담 패키지 (테넌트별 요금 체계)
- `PACKAGE_TYPE`: 패키지 타입 (테넌트별)
- `PAYMENT_METHOD`: 결제 방법 (테넌트별)
- `SPECIALTY`: 전문분야 (테넌트별)
- `CONSULTATION_TYPE`: 상담 유형 (테넌트별)
- `MAPPING_STATUS`: 매칭 상태 (테넌트별)
- 기타 비즈니스 로직 관련 코드

### 2. API 엔드포인트 분리

#### 현재 API 구조
```
GET /api/v1/common-codes?codeGroup=XXX
→ 테넌트 코드 우선, 없으면 코어 코드 (폴백)
```

#### 개선된 API 구조

**테넌트 코드 전용 API (독립성 보장)**
```
GET /api/v1/common-codes/tenant?codeGroup=XXX
→ 현재 테넌트의 코드만 조회 (코어 코드 폴백 없음)
→ 요금 체계, 패키지 등 비즈니스 로직 코드에 사용
```

**코어 코드 전용 API**
```
GET /api/v1/common-codes/core?codeGroup=XXX
→ 코어 코드만 조회 (시스템 전역 코드)
→ USER_STATUS, ROLE 등에 사용
```

**통합 조회 API (하위 호환성, 제한적 사용)**
```
GET /api/v1/common-codes?codeGroup=XXX
→ 테넌트 코드 우선, 없으면 코어 코드
→ 시스템 전역 코드(USER_STATUS 등)에만 사용
→ 비즈니스 로직 코드에는 사용 금지
```

### 3. 코드 그룹별 사용 규칙

#### 테넌트 코드 전용 API 사용 필수
- `CONSULTATION_PACKAGE`
- `PACKAGE_TYPE`
- `PAYMENT_METHOD`
- `SPECIALTY`
- `CONSULTATION_TYPE`
- `MAPPING_STATUS`
- 기타 테넌트별 커스터마이징이 필요한 코드

#### 코어 코드 전용 API 사용
- `USER_STATUS`
- `USER_ROLE`
- `CODE_GROUP_TYPE`
- `SYSTEM_STATUS`

---

## 🔧 구현 계획

### Phase 1: API 엔드포인트 추가
1. 테넌트 코드 전용 API 추가
   - `GET /api/v1/common-codes/tenant?codeGroup=XXX`
   - 현재 테넌트의 코드만 반환 (코어 코드 폴백 없음)

2. 코어 코드 전용 API 추가
   - `GET /api/v1/common-codes/core?codeGroup=XXX`
   - 코어 코드만 반환

### Phase 2: 프론트엔드 수정
1. 요금 체계 관련 코드 조회 시 테넌트 코드 전용 API 사용
2. 시스템 전역 코드 조회 시 코어 코드 전용 API 사용
3. 통합 조회 API는 하위 호환성용으로만 유지

### Phase 3: 코드 그룹 메타데이터 설정
1. 각 코드 그룹의 타입(CORE/TENANT) 명확히 설정
2. 테넌트 코드 그룹은 폴백 없이 테넌트 코드만 조회하도록 강제

---

## ⚠️ 주의사항

1. **하위 호환성**
   - 기존 통합 조회 API는 유지하되, 비즈니스 로직 코드에는 사용 금지
   - 시스템 전역 코드(USER_STATUS 등)에만 사용

2. **테넌트 컨텍스트 필수**
   - 테넌트 코드 조회 시 반드시 테넌트 컨텍스트가 설정되어 있어야 함
   - 없으면 빈 배열 반환 (코어 코드 폴백 없음)

3. **데이터 마이그레이션**
   - 기존 코어 코드로 관리되던 비즈니스 로직 코드를 테넌트별로 분리
   - 각 테넌트에 기본 코드 세트 생성

---

## 📊 예시

### 요금 체계 코드 조회 (테넌트별 독립)

**테넌트 A (서울 상담소)**
```json
GET /api/v1/common-codes/tenant?codeGroup=CONSULTATION_PACKAGE
→ [
  { "codeValue": "BASIC_10", "codeLabel": "기본 10회기", "price": 500000 },
  { "codeValue": "PREMIUM_20", "codeLabel": "프리미엄 20회기", "price": 900000 }
]
```

**테넌트 B (부산 상담소)**
```json
GET /api/v1/common-codes/tenant?codeGroup=CONSULTATION_PACKAGE
→ [
  { "codeValue": "BASIC_5", "codeLabel": "기본 5회기", "price": 300000 },
  { "codeValue": "STANDARD_10", "codeLabel": "표준 10회기", "price": 600000 }
]
```

→ **완전히 독립된 요금 체계 보장**

---

**마지막 업데이트**: 2025-11-25

