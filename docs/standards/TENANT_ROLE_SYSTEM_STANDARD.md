# 테넌트 역할 시스템 정의

**작성일**: 2025-12-02 (화요일)  
**목적**: 테넌트 기반 역할 체계 단순화 및 명확화

---

## 🎯 핵심 요약

### 역할 관리 특징
1. **자동 생성**: 테넌트 생성 시 기본 4-5개 역할 자동 생성
2. **무제한 추가**: 관리자가 커스텀 역할 무제한 생성 가능
3. **자유로운 수정**: 역할명, 설명, 권한 자유롭게 수정
4. **조건부 삭제**: 사용자가 없는 역할은 삭제 가능
5. **업종 대응**: 상담소/학원/병원 등 업종별 자동 대응

### 관리자 권한
- ✅ 역할 생성 (무제한)
- ✅ 역할 수정 (역할명, 권한)
- ✅ 역할 삭제 (사용자 없는 경우)
- ✅ 권한 설정 (역할별 세부 권한)
- ✅ 대시보드 관리 (역할별 대시보드)

### 제약 사항
- ❌ 기본 역할(ADMIN, CONSULTANT, CLIENT, STAFF) 삭제 불가
- ❌ 사용자가 할당된 역할 삭제 불가
- ⚠️ 삭제 전 사용자를 다른 역할로 이동 필요

---

## 📋 핵심 역할 (기본 4-5개 + 무제한 커스텀)

테넌트가 생성되면 업종에 따라 **기본 4-5개의 역할**이 자동으로 생성됩니다. 이후 **관리자는 역할을 자유롭게 추가/수정/삭제**할 수 있습니다:

### 역할 라이프사이클
```
테넌트 생성
    ↓
기본 역할 자동 생성 (4-5개)
    ↓
관리자가 커스텀 역할 추가 ✅
    ↓
역할 수정 (권한 조정) ✅
    ↓
역할 삭제 (사용자 없는 경우) ✅
```

### 업종별 역할 매핑

| 핵심 역할 | 상담소 | 학원 | 병원 | 일반 |
|---------|-------|-----|-----|-----|
| ADMIN | 원장 | 원장 | 원장 | 관리자 |
| CONSULTANT | 상담사 | 강사 | 의사 | 전문가 |
| CLIENT | 내담자 | 학생 | 환자 | 고객 |
| PARENT | - | 학부모 | 보호자 | - |
| STAFF | 사무원 | 행정직원 | 간호사 | 직원 |
| **커스텀** | **관리자가 생성** | **관리자가 생성** | **관리자가 생성** | **관리자가 생성** |

**중요 사항**: 
- ✅ **기본 역할은 자동 생성** (테넌트 생성 시)
- ✅ **관리자는 역할을 무제한 추가 가능** (예: 부원장, 수석강사, 인턴 등)
- ✅ **역할 수정 가능** (역할명, 설명, 권한 조정)
- ✅ **역할 삭제 가능** (사용자가 없는 경우)
- ⚠️ **기본 역할(ADMIN, CONSULTANT, CLIENT, STAFF)은 삭제 불가**
- 📌 학부모(PARENT)는 학원 전용 역할 (자녀 정보만 조회)

### 1. 원장 (관리자) - ADMIN
**역할 코드**: `ADMIN`  
**권한 범위**: 모든 권한 (자동 부여)  
**설명**: 테넌트의 최고 관리자

#### 주요 권한
- ✅ 상담사 등록/수정/삭제
- ✅ 내담자 등록/수정/삭제
- ✅ 매칭 생성/수정/삭제
- ✅ 스케줄 관리
- ✅ 급여 관리
- ✅ 통계 조회
- ✅ 대시보드 관리
- ✅ 사용자 관리
- ✅ 설정 관리

#### 사용 예시
```java
User admin = User.builder()
    .username("admin001")
    .email("admin@example.com")
    .role(UserRole.ADMIN)
    .tenantId("tenant-001")
    .build();
```

---

### 2. 상담사/강사 - CONSULTANT
**역할 코드**: `CONSULTANT`  
**권한 범위**: 자신의 업무 관련 기능  
**설명**: 실제 서비스를 제공하는 전문가 (상담사, 강사, 의사 등)

#### 주요 권한
- ✅ **자신의 스케줄만** 조회/관리 (다른 전문가 스케줄 조회 불가)
- ✅ 자신의 고객 조회 (내담자/학생/환자)
- ✅ 업무 기록 작성/조회 (상담기록/수업일지/진료기록)
- ✅ 자신의 통계 조회
- ✅ 급여 조회 (자신만)
- ❌ 다른 전문가 스케줄 조회
- ❌ 다른 전문가 정보 수정
- ❌ 매칭 권한 없음 (상담소)
- ❌ 급여 설정/관리
- ❌ 사용자 등록/삭제

#### 업종별 예시
**상담소**: 자신의 상담 일정만 조회, 상담 기록 작성, 배정된 내담자 조회  
**학원**: 자신의 수업 일정만 조회, 수업 일지 작성, 담당 학생 조회, 성적 입력  
**병원**: 자신의 진료 일정만 조회, 진료 기록 작성, 담당 환자 조회

#### 사용 예시
```java
User consultant = User.builder()
    .username("consultant001")
    .email("consultant@example.com")
    .role(UserRole.CONSULTANT)
    .tenantId("tenant-001")
    .build();
```

---

### 3. 내담자/학생/환자 - CLIENT
**역할 코드**: `CLIENT`  
**권한 범위**: 자신의 정보만 조회  
**설명**: 서비스를 받는 고객 (내담자, 학생, 환자 등)

#### 주요 권한
- ✅ 자신의 일정 조회
- ✅ 자신의 기록 조회 (상담/수업/진료)
- ✅ 자신의 프로필 수정
- ✅ 전문가 평가
- ❌ 다른 고객 정보 조회
- ❌ 전문가 정보 수정
- ❌ 관리 기능 접근

#### 업종별 예시
**상담소**: 상담 일정 확인, 상담 기록 열람, 상담사 평가  
**학원**: 수업 시간표 확인, 성적 조회, 과제 제출, 강사 평가  
**병원**: 진료 예약 확인, 진료 기록 열람, 처방전 조회

#### 사용 예시
```java
User client = User.builder()
    .username("client001")
    .email("client@example.com")
    .role(UserRole.CLIENT)
    .tenantId("tenant-001")
    .build();
```

---

### 4. 사무원/행정직원 (부관리자) - STAFF
**역할 코드**: `STAFF` 또는 `BRANCH_MANAGER`  
**권한 범위**: 일부 관리 기능 (ERP 제외)  
**설명**: 원장을 보조하는 행정/사무 담당자

#### 주요 권한
- ✅ 고객 등록/수정 (내담자/학생/환자)
- ✅ 스케줄 조회/생성
- ✅ 기본 통계 조회
- ✅ 업무 기록 조회
- ✅ 매칭/배정 생성 (상담소)
- ⚠️ 전문가 등록 (조건부)
- ❌ 급여 관리
- ❌ ERP 관련 기능 (재무, 회계)
- ❌ 사용자 삭제
- ❌ 설정 변경

#### 업종별 예시
**상담소**: 내담자 등록, 상담사-내담자 매칭, 상담 일정 조정  
**학원**: 학생 등록, 수업 배정, 출석 관리, 학부모 연락  
**병원**: 환자 등록, 진료 예약 관리, 접수 처리

---

### 5. 학부모 (학원 전용) - PARENT
**역할 코드**: `PARENT`  
**권한 범위**: 자녀 정보만 조회  
**설명**: 학생의 보호자 (학원 업종에서만 사용)

#### 주요 권한
- ✅ 자녀의 수업 일정 조회
- ✅ 자녀의 성적 조회
- ✅ 자녀의 출석 조회
- ✅ 강사와 메시지
- ✅ 학원 공지사항 조회
- ❌ 다른 학생 정보 조회
- ❌ 수업 변경
- ❌ 관리 기능 접근

#### 사용 예시
```java
User parent = User.builder()
    .username("parent001")
    .email("parent@example.com")
    .role(UserRole.PARENT)
    .tenantId("tenant-001")
    .build();
```

#### 사용 예시
```java
User staff = User.builder()
    .username("staff001")
    .email("staff@example.com")
    .role(UserRole.STAFF)
    .tenantId("tenant-001")
    .build();
```

---

## 🔒 권한 매트릭스

| 기능 | 원장(ADMIN) | 전문가(CONSULTANT) | 고객(CLIENT) | 사무원(STAFF) | 학부모(PARENT) |
|-----|-----------|-----------------|--------------|-------------|--------------|
| **사용자 관리** |
| 전문가 등록 | ✅ | ❌ | ❌ | ⚠️ | ❌ |
| 고객 등록 | ✅ | ✅ | ❌ | ✅ | ❌ |
| 사용자 삭제 | ✅ | ❌ | ❌ | ❌ | ❌ |
| **매칭/배정 관리** |
| 매칭 생성 | ✅ | ❌ | 📌 | ✅ | ❌ |
| 매칭 수정 | ✅ | ❌ | ❌ | ⚠️ | ❌ |
| 매칭 삭제 | ✅ | ❌ | ❌ | ❌ | ❌ |
| **스케줄 관리** |
| 전체 스케줄 조회 | ✅ | ❌ | ❌ | ✅ | ❌ |
| 자신 스케줄 조회 | ✅ | ✅ | ✅ | ✅ | ✅ (자녀) |
| 스케줄 생성 | ✅ | ✅ (자신만) | ❌ | ✅ | ❌ |
| 스케줄 수정 | ✅ | ✅ (자신만) | ❌ | ✅ | ❌ |
| 스케줄 삭제 | ✅ | ⚠️ (자신만) | ❌ | ⚠️ | ❌ |
| **업무 기록** |
| 기록 작성 | ✅ | ✅ (자신만) | ❌ | ❌ | ❌ |
| 기록 조회 | ✅ | ✅ (자신만) | ✅ (자신만) | ✅ | ✅ (자녀) |
| 기록 수정 | ✅ | ✅ (자신만) | ❌ | ❌ | ❌ |
| **급여 관리** |
| 급여 조회 | ✅ | ✅ (자신만) | ❌ | ❌ | ❌ |
| 급여 설정 | ✅ | ❌ | ❌ | ❌ | ❌ |
| 급여 지급 | ✅ | ❌ | ❌ | ❌ | ❌ |
| **ERP (재무/회계)** |
| 재무 조회 | ✅ | ❌ | ❌ | ❌ | ❌ |
| 회계 관리 | ✅ | ❌ | ❌ | ❌ | ❌ |
| **통계/보고서** |
| 전체 통계 | ✅ | ❌ | ❌ | ✅ | ❌ |
| 개인 통계 | ✅ | ✅ (자신만) | ✅ (자신만) | ✅ | ✅ (자녀) |
| **설정 관리** |
| 테넌트 설정 | ✅ | ❌ | ❌ | ❌ | ❌ |
| 대시보드 설정 | ✅ | ❌ | ❌ | ❌ | ❌ |

**범례**:
- ✅ = 전체 권한
- ⚠️ = 제한적 권한
- ❌ = 권한 없음
- 📌 = 업종별 다름 (아래 참조)

---

## 🏢 업종별 매칭/배정 규칙

### 상담소 (Consultation Center)
**매칭 규칙**: 관리자 주도 (사전 협의)

| 역할 | 매칭 권한 | 설명 |
|-----|---------|-----|
| 원장 (ADMIN) | ✅ 생성/수정/삭제 | 모든 매칭 관리 |
| 사무원 (STAFF) | ✅ 생성, ⚠️ 수정 | 매칭 생성 가능, 수정은 제한적 |
| 상담사 (CONSULTANT) | ❌ | 매칭 권한 없음 |
| 내담자 (CLIENT) | ❌ | 상담사 선택 불가 (관리자가 배정) |

**프로세스**:
1. 내담자가 상담 신청
2. 관리자/사무원이 상담사 상황 확인
3. 관리자/사무원이 적절한 상담사와 매칭
4. 상담사는 배정된 내담자 확인만 가능

---

### 학원 (Academy)
**매칭 규칙**: 학생 선택 가능

| 역할 | 매칭 권한 | 설명 |
|-----|---------|-----|
| 원장 (ADMIN) | ✅ 생성/수정/삭제 | 모든 배정 관리 |
| 사무원 (STAFF) | ✅ 생성, ⚠️ 수정 | 배정 생성 가능 |
| 강사 (CONSULTANT) | ❌ | 배정 권한 없음 |
| 학생 (CLIENT) | ✅ 강사 선택 | **학생이 직접 강사 선택 가능** |
| 학부모 (PARENT) | ⚠️ 조회만 | 자녀의 강사 확인만 가능 |

**프로세스**:
1. 학생이 수강 신청 시 원하는 강사 선택
2. 관리자/사무원이 승인
3. 학부모는 배정 결과 확인만 가능

---

### 병원 (Hospital)
**매칭 규칙**: 관리자 주도 (예약 기반)

| 역할 | 매칭 권한 | 설명 |
|-----|---------|-----|
| 원장 (ADMIN) | ✅ 생성/수정/삭제 | 모든 배정 관리 |
| 사무원 (STAFF) | ✅ 생성, ⚠️ 수정 | 진료 예약 배정 |
| 의사 (CONSULTANT) | ❌ | 배정 권한 없음 |
| 환자 (CLIENT) | ⚠️ 선호 의사 요청 | 요청만 가능, 최종 결정은 관리자 |

**프로세스**:
1. 환자가 진료 예약 (선호 의사 요청 가능)
2. 사무원이 의사 스케줄 확인 후 배정
3. 의사는 배정된 환자 확인

**범례**:
- ✅ : 전체 권한
- ⚠️ : 조건부 권한
- ❌ : 권한 없음

---

## 📊 기본 대시보드 자동 생성

### 개요
테넌트가 생성되면 **비즈니스 타입(업종)에 따라 기본 4-5개의 대시보드가 자동으로 생성**됩니다.

### 비즈니스 타입별 대시보드 생성

#### 상담소 (CONSULTATION) - 기본 4개
| 순번 | 역할 | 대시보드명 | 기본 위젯 |
|-----|------|----------|---------|
| 1 | ADMIN | 원장 대시보드 | 환영, 전체통계, 내담자등록, 상담사등록, 매칭관리, 일정등록, 회기관리, 상담통계, 최근활동 |
| 2 | CONSULTANT | 상담사 대시보드 | 내 일정, 상담기록, 상담통계, 내담자목록 |
| 3 | CLIENT | 내담자 대시보드 | 내 일정, 알림, 상담기록 |
| 4 | STAFF | 사무원 대시보드 | 전체 스케줄, 고객 관리, 기본 통계 |

#### 학원 (ACADEMY) - 기본 5개
| 순번 | 역할 | 대시보드명 | 기본 위젯 |
|-----|------|----------|---------|
| 1 | ADMIN | 원장 대시보드 | 환영, 전체통계, 학생등록, 강사등록, 수업배정, 일정등록, 출석관리, 수업통계, 최근활동 |
| 2 | CONSULTANT (강사) | 강사 대시보드 | 내 일정, 수업일지, 수업통계, 학생목록 |
| 3 | CLIENT (학생) | 학생 대시보드 | 내 일정, 알림, 성적조회 |
| 4 | PARENT | 학부모 대시보드 | 자녀 일정, 자녀 성적, 알림, 학원 공지 |
| 5 | STAFF | 사무원 대시보드 | 전체 스케줄, 학생 관리, 출석 관리, 기본 통계 |

#### 병원 (HOSPITAL) - 기본 4개
| 순번 | 역할 | 대시보드명 | 기본 위젯 |
|-----|------|----------|---------|
| 1 | ADMIN | 원장 대시보드 | 환영, 전체통계, 환자등록, 의사등록, 진료배정, 예약관리, 진료통계, 최근활동 |
| 2 | CONSULTANT (의사) | 의사 대시보드 | 내 일정, 진료기록, 진료통계, 환자목록 |
| 3 | CLIENT (환자) | 환자 대시보드 | 내 일정, 알림, 진료기록, 처방전 |
| 4 | STAFF (간호사) | 간호사 대시보드 | 전체 스케줄, 환자 관리, 접수 처리, 기본 통계 |

**중요**: 
- 비즈니스 타입은 온보딩 시 선택
- 기본값: `CONSULTATION` (상담소)
- 대시보드는 업종에 맞게 자동으로 생성됨
- 위젯 명칭도 업종에 맞게 자동 변경 (예: 내담자 → 학생 → 환자)

---

### 대시보드 생성 프로세스

```
온보딩 신청
    ↓
비즈니스 타입 선택 (CONSULTATION/ACADEMY/HOSPITAL)
    ↓
온보딩 승인
    ↓
테넌트 생성
    ↓
비즈니스 타입별 역할 템플릿 조회
    ↓
각 역할별 대시보드 생성 (4-5개)
    ↓
업종별 기본 위젯 설정 적용
    ↓
완료
```

**구현 위치**: 
- `OnboardingServiceImpl.approveOnboarding()` - 온보딩 승인 및 대시보드 생성 호출
- `TenantDashboardServiceImpl.createDefaultDashboards()` - 비즈니스 타입별 대시보드 생성
- `RoleTemplateRepository.findByBusinessTypeAndActive()` - 업종별 역할 템플릿 조회

---

### 대시보드 특징

1. **비즈니스 타입 기반**: 온보딩 시 선택한 업종에 따라 자동 생성
2. **자동 생성**: 테넌트 생성 시 4-5개 대시보드 자동 생성
3. **역할 기반**: 각 역할에 맞는 위젯 자동 구성
4. **업종 대응**: 업종(상담소/학원/병원)에 따라 위젯 명칭 자동 변경
   - 상담소: 내담자, 상담사, 상담 기록
   - 학원: 학생, 강사, 수업 일지, 학부모
   - 병원: 환자, 의사, 진료 기록
5. **커스터마이징**: 관리자가 위젯 추가/삭제/배치 변경 가능
6. **삭제 불가**: 기본 대시보드는 삭제 불가 (비활성화만 가능)

### 비즈니스 타입 설정

#### 온보딩 시 선택
```json
{
  "businessType": "CONSULTATION",  // CONSULTATION, ACADEMY, HOSPITAL
  "tenantName": "마음상담소",
  "adminEmail": "admin@example.com"
}
```

#### 기본값
- 비즈니스 타입을 지정하지 않으면 `CONSULTATION` (상담소)가 기본값
- 공통 코드 테이블 (`BUSINESS_TYPE`)에서 동적으로 조회
- 시스템 상수: `OnboardingConstants.CODE_VALUE_DEFAULT_BUSINESS_TYPE`

---

### 비즈니스 타입 변경 정책

#### ⚠️ 중요: 비즈니스 타입은 변경 불가

**원칙**: 테넌트 생성 후 비즈니스 타입은 **변경할 수 없습니다**.

#### 변경 불가 이유

1. **역할 템플릿 의존성**
   - 각 비즈니스 타입마다 고유한 역할 템플릿 존재
   - 상담소: ADMIN, CONSULTANT, CLIENT, STAFF
   - 학원: ADMIN, CONSULTANT, CLIENT, PARENT, STAFF
   - 변경 시 기존 역할과 충돌 발생

2. **대시보드 구조 차이**
   - 업종별로 다른 대시보드 구조
   - 위젯 타입과 설정이 업종에 특화됨
   - 변경 시 기존 대시보드 무효화

3. **데이터 무결성**
   - 업종별 특화 데이터 구조 (예: 학원의 출석, 상담소의 회기)
   - 변경 시 기존 데이터와 호환성 문제

4. **권한 체계 차이**
   - 업종별 권한 구조가 다름
   - 변경 시 권한 재설정 필요

#### 비즈니스 타입 변경 요청 시 대응 방안

##### 방안 1: 새 테넌트 생성 (권장)
```
1. 새로운 비즈니스 타입으로 테넌트 신규 생성
2. 기존 데이터 마이그레이션 (필요 시)
3. 기존 테넌트 비활성화 또는 삭제
```

**장점**:
- ✅ 깨끗한 시작
- ✅ 데이터 무결성 보장
- ✅ 업종에 최적화된 구조

**단점**:
- ❌ 데이터 마이그레이션 필요
- ❌ 사용자 재등록 필요

##### 방안 2: 관리자 수동 조정 (비권장)
```
1. 역할 수동 추가/삭제
2. 대시보드 수동 재구성
3. 위젯 수동 변경
```

**장점**:
- ✅ 기존 테넌트 유지

**단점**:
- ❌ 수동 작업 필요
- ❌ 오류 가능성 높음
- ❌ 업종 특화 기능 미지원

##### 방안 3: 시스템 마이그레이션 (향후 개발 고려)
```
자동 마이그레이션 기능 개발 (미구현)
- 역할 자동 변환
- 대시보드 자동 재생성
- 데이터 자동 마이그레이션
```

**현재 상태**: 미구현  
**개발 우선순위**: 낮음 (실제 요구사항 발생 시 검토)

#### 실무 대응 절차

1. **요청 접수**
   - 고객이 비즈니스 타입 변경 요청

2. **사유 확인**
   - 왜 변경이 필요한지 확인
   - 실제로 다른 업종으로 전환하는지 확인

3. **대안 제시**
   - 커스텀 역할 생성으로 해결 가능한지 확인
   - 대시보드 커스터마이징으로 해결 가능한지 확인

4. **최종 결정**
   - 불가피한 경우: 새 테넌트 생성 안내
   - 가능한 경우: 기존 테넌트에서 커스터마이징

#### 예외 케이스

**케이스 1**: 온보딩 직후 (데이터 없음)
- ✅ 테넌트 삭제 후 재생성 가능
- 조건: 사용자 등록 전, 데이터 입력 전

**케이스 2**: 잘못된 업종 선택 (초기 단계)
- ✅ 새 테넌트 생성 후 기존 테넌트 삭제
- 조건: 데이터 양이 적고 마이그레이션 가능

**케이스 3**: 실제 업종 전환 (장기 운영 중)
- ⚠️ 신중한 검토 필요
- 데이터 마이그레이션 계획 수립
- 새 테넌트 생성 권장

#### 문의 시 안내 메시지

```
안녕하세요,

비즈니스 타입은 테넌트 생성 시 결정되며, 이후 변경이 불가능합니다.
이는 각 업종별로 역할, 대시보드, 권한 구조가 다르기 때문입니다.

대안:
1. 새로운 비즈니스 타입으로 테넌트를 신규 생성하시고,
   필요한 데이터를 이전하시는 것을 권장드립니다.

2. 기존 테넌트에서 커스텀 역할과 대시보드를 생성하여
   원하시는 기능을 구현하실 수 있습니다.

자세한 상담이 필요하시면 고객 지원팀으로 문의해 주세요.

감사합니다.
```

---

## 🗑️ 테넌트 삭제 정책

### 개요
테넌트 삭제는 **소프트 삭제(Soft Delete)** 방식으로 처리되며, 실제 데이터는 보관됩니다.

### 테넌트 상태 (TenantStatus)

| 상태 | 코드 | 설명 | 접근 가능 |
|-----|------|------|----------|
| 대기중 | PENDING | 온보딩 승인 대기 | ❌ |
| 활성 | ACTIVE | 정상 운영 중 | ✅ |
| 일시정지 | SUSPENDED | 일시적 서비스 중단 | ⚠️ (읽기 전용) |
| 종료 | CLOSED | 서비스 종료 | ❌ |
| 삭제됨 | (is_deleted=true) | 소프트 삭제 | ❌ |

---

### 삭제 방식

#### 1. 소프트 삭제 (Soft Delete) - 기본 방식
```java
tenant.setIsDeleted(true);
tenant.setDeletedAt(LocalDateTime.now());
tenant.setStatus(TenantStatus.CLOSED);
tenantRepository.save(tenant);
```

**특징**:
- ✅ 데이터 보관 (복구 가능)
- ✅ 법적 요구사항 충족 (데이터 보존 의무)
- ✅ 감사 추적 가능
- ✅ 통계 분석 가능
- ⚠️ 데이터베이스 용량 차지

#### 2. 하드 삭제 (Hard Delete) - 예외적 사용
```java
tenantRepository.delete(tenant);
```

**특징**:
- ❌ 데이터 완전 삭제 (복구 불가)
- ❌ 관련 데이터 모두 삭제
- ⚠️ GDPR 등 법적 요구 시에만 사용

---

### 삭제 요청 시 대응 절차

#### 1단계: 요청 확인
```
고객 삭제 요청 접수
    ↓
삭제 사유 확인
    ↓
데이터 백업 필요 여부 확인
    ↓
법적 보존 의무 확인
```

#### 2단계: 사전 조치
1. **데이터 백업**
   - 고객이 데이터 백업을 원하는 경우
   - 데이터 추출 및 제공 (CSV, JSON 등)

2. **구독 해지**
   - 활성 구독이 있는 경우 먼저 해지
   - 환불 처리 (필요 시)

3. **사용자 통지**
   - 테넌트의 모든 사용자에게 서비스 종료 안내
   - 데이터 백업 기한 안내

#### 3단계: 삭제 실행

**방법 1: 일시정지 → 종료 (권장)**
```
1. 테넌트 상태를 SUSPENDED로 변경 (7일간 유예)
2. 사용자 접근 차단 (읽기 전용)
3. 유예 기간 후 CLOSED로 변경
4. 30일 후 소프트 삭제 (is_deleted=true)
```

**방법 2: 즉시 종료 (긴급)**
```
1. 테넌트 상태를 CLOSED로 변경
2. 사용자 접근 차단
3. 소프트 삭제 (is_deleted=true)
```

#### 4단계: 후속 조치
1. **관련 데이터 처리**
   - 사용자 계정: 비활성화
   - 구독: 해지 처리
   - 결제 정보: 암호화 보관 (법적 의무)

2. **로그 기록**
   - 삭제 요청자
   - 삭제 사유
   - 삭제 일시
   - 데이터 백업 여부

3. **통계 업데이트**
   - 활성 테넌트 수 감소
   - 이탈 사유 분석

---

### 삭제 영향 범위

#### 직접 영향
- ✅ 테넌트 정보 (소프트 삭제)
- ✅ 사용자 계정 (비활성화)
- ✅ 역할 및 권한 (비활성화)
- ✅ 대시보드 (비활성화)
- ✅ 구독 정보 (해지)

#### 보관되는 데이터
- 📦 상담/수업 기록 (법적 보존 의무)
- 📦 결제 내역 (세무 보존 의무)
- 📦 사용자 활동 로그 (감사 추적)
- 📦 통계 데이터 (분석용)

#### 완전 삭제 가능 데이터
- 🗑️ 임시 파일
- 🗑️ 캐시 데이터
- 🗑️ 세션 정보

---

### 복구 절차

#### 소프트 삭제된 테넌트 복구
```java
// 삭제된 테넌트 조회
Tenant deletedTenant = tenantRepository.findDeletedByContactEmail(email);

// 복구
deletedTenant.setIsDeleted(false);
deletedTenant.setDeletedAt(null);
deletedTenant.setStatus(TenantStatus.ACTIVE);
tenantRepository.save(deletedTenant);
```

**복구 가능 기간**:
- 소프트 삭제 후 **90일 이내**
- 90일 경과 시 하드 삭제 고려

**복구 시 확인 사항**:
1. 구독 재활성화
2. 사용자 계정 재활성화
3. 역할 및 권한 복원
4. 대시보드 복원

---

### 법적 고려사항

#### 1. 개인정보보호법 (PIPA)
- 보존 의무 기간: **3년** (상담 기록)
- 즉시 삭제 요청 시: 법적 보존 의무 설명 필요

#### 2. GDPR (유럽)
- 삭제 요청 시 **30일 이내** 처리
- 법적 보존 의무가 있는 경우 예외 인정

#### 3. 전자상거래법
- 결제 내역: **5년** 보존 의무
- 세금계산서: **5년** 보존 의무

---

### 삭제 요청 대응 체크리스트

#### 삭제 전
- [ ] 삭제 사유 확인
- [ ] 고객 데이터 백업 제공 (요청 시)
- [ ] 활성 구독 해지
- [ ] 환불 처리 (필요 시)
- [ ] 사용자 통지 (7일 전)
- [ ] 법적 보존 의무 확인

#### 삭제 실행
- [ ] 테넌트 상태 변경 (SUSPENDED → CLOSED)
- [ ] 사용자 접근 차단
- [ ] 소프트 삭제 실행
- [ ] 관련 데이터 비활성화

#### 삭제 후
- [ ] 삭제 로그 기록
- [ ] 고객 확인 메일 발송
- [ ] 통계 업데이트
- [ ] 이탈 사유 분석

---

### 고객 안내 메시지

#### 삭제 요청 접수 시
```
안녕하세요,

테넌트 삭제 요청을 접수하였습니다.

삭제 절차:
1. 7일간 일시정지 상태로 전환 (데이터 백업 기간)
2. 유예 기간 후 서비스 종료
3. 30일 후 완전 삭제

데이터 백업:
- 백업이 필요하신 경우 7일 이내에 요청해 주세요.
- CSV, JSON 형식으로 제공 가능합니다.

법적 보존:
- 상담 기록: 3년간 보존 (법적 의무)
- 결제 내역: 5년간 보존 (법적 의무)

복구:
- 삭제 후 90일 이내 복구 가능합니다.

문의사항이 있으시면 고객 지원팀으로 연락 주세요.

감사합니다.
```

#### 삭제 완료 시
```
안녕하세요,

테넌트 삭제가 완료되었습니다.

처리 내역:
- 테넌트 상태: 종료
- 사용자 계정: 비활성화
- 데이터: 소프트 삭제 (90일간 복구 가능)

법적 보존 데이터:
- 상담 기록: 3년간 보존
- 결제 내역: 5년간 보존

복구 문의:
- 90일 이내 복구 가능합니다.
- 복구를 원하시면 고객 지원팀으로 연락 주세요.

그동안 서비스를 이용해 주셔서 감사합니다.
```

---

### API 엔드포인트

```bash
# 기본 대시보드 생성 (온보딩 시 자동 호출)
POST /api/tenants/{tenantId}/dashboards/default

# 대시보드 목록 조회
GET /api/v1/tenant/dashboards

# 대시보드 수정
PUT /api/v1/tenant/dashboards/{dashboardId}
```

---

## 🎨 역할 동적 관리 (생성/수정/삭제)

### 개요
테넌트가 생성되면 기본 4-5개의 역할이 자동으로 생성되지만, **관리자(원장)는 역할을 자유롭게 추가/수정/삭제**할 수 있습니다.

### 핵심 특징
- ✅ **역할 추가**: 무제한 커스텀 역할 생성 가능
- ✅ **역할 수정**: 역할명, 설명, 권한 수정 가능
- ✅ **역할 삭제**: 사용자가 없는 역할은 삭제 가능
- ✅ **권한 관리**: 역할별 세부 권한 설정 가능
- ✅ **템플릿 기반**: 기존 역할을 복제하여 새 역할 생성 가능

### 역할 생성 방법

#### 1. 템플릿 기반 역할 생성
기존 역할 템플릿을 복제하여 새 역할 생성:

```bash
POST /api/tenants/{tenantId}/roles/from-template/{roleTemplateId}
```

**예시**:
```json
{
  "roleTemplateId": "template-consultant-001"
}
```

**결과**: "상담사" 템플릿을 복제하여 "수석 상담사" 역할 생성

---

#### 2. 커스텀 역할 생성
처음부터 새로운 역할 생성:

```bash
POST /api/tenants/{tenantId}/roles
```

**요청 예시**:
```json
{
  "nameKo": "부원장",
  "nameEn": "Vice Principal",
  "descriptionKo": "원장을 보조하며 일부 관리 권한을 가진 역할",
  "isActive": true,
  "displayOrder": 2,
  "permissions": [
    {
      "permissionCode": "USER_READ",
      "scope": "TENANT"
    },
    {
      "permissionCode": "SCHEDULE_MANAGE",
      "scope": "TENANT"
    },
    {
      "permissionCode": "REPORT_VIEW",
      "scope": "TENANT"
    }
  ]
}
```

---

### 역할 관리 API

| API | 메서드 | 설명 | 권한 | 비고 |
|-----|--------|------|------|------|
| `/api/tenants/{tenantId}/roles` | GET | 역할 목록 조회 | ADMIN | 테넌트의 모든 역할 조회 |
| `/api/tenants/{tenantId}/roles/{roleId}` | GET | 역할 상세 조회 | ADMIN | 권한 목록, 사용자 수 포함 |
| `/api/tenants/{tenantId}/roles` | POST | 역할 생성 | ADMIN | **커스텀 역할 생성** |
| `/api/tenants/{tenantId}/roles/from-template/{templateId}` | POST | 템플릿 기반 역할 생성 | ADMIN | 기존 역할 복제 |
| `/api/tenants/{tenantId}/roles/{roleId}` | PUT | 역할 수정 | ADMIN | 역할명, 권한 수정 |
| `/api/tenants/{tenantId}/roles/{roleId}` | DELETE | 역할 삭제 | ADMIN | **사용자 없는 역할만 삭제 가능** |

---

### 커스텀 역할 예시

#### 상담소
- **부원장**: 원장 권한의 80% (급여 관리 제외)
- **수석 상담사**: 일반 상담사 + 신입 상담사 멘토링
- **인턴 상담사**: 제한적 상담 권한 (슈퍼비전 필수)

#### 학원
- **부원장**: 원장 권한의 80% (재무 관리 제외)
- **수석 강사**: 일반 강사 + 커리큘럼 관리
- **학습 매니저**: 학생 관리 + 학부모 상담 전담
- **시간제 강사**: 제한적 권한 (자신의 수업만)

#### 병원
- **부원장**: 원장 권한의 80% (재무 관리 제외)
- **수석 의사**: 일반 의사 + 인턴 교육
- **간호팀장**: 간호사 관리 + 스케줄 조정
- **의료 코디네이터**: 환자 상담 + 예약 관리

---

### 역할 삭제

#### 삭제 가능 조건
- ✅ 해당 역할에 할당된 사용자가 없는 경우
- ✅ 커스텀 역할 (관리자가 생성한 역할)

#### 삭제 불가 조건
- ❌ 사용자가 할당된 역할
- ❌ 시스템 기본 역할 (ADMIN, CONSULTANT, CLIENT, STAFF, PARENT)

#### 삭제 프로세스
```bash
# 1. 역할에 할당된 사용자 확인
GET /api/tenants/{tenantId}/roles/{roleId}
# Response: { "userCount": 5 }

# 2. 사용자가 있으면 다른 역할로 이동
PUT /api/users/{userId}/role
{ "newRoleId": "other-role-id" }

# 3. 사용자가 없으면 역할 삭제
DELETE /api/tenants/{tenantId}/roles/{roleId}
```

**참고**: 
- 기본 역할(ADMIN, CONSULTANT, CLIENT, STAFF)은 테넌트 운영에 필수이므로 삭제 불가
- 삭제된 역할은 소프트 삭제되어 데이터베이스에 보관됨 (복구 가능)

---

## 🔒 권한 구현 방법

### 1. 스케줄 조회 제한 (CONSULTANT)

상담사/강사는 **자신의 스케줄만** 조회 가능:

```java
@GetMapping("/api/schedules")
public ResponseEntity<?> getSchedules(@AuthenticationPrincipal User user) {
    if (user.getRole() == UserRole.CONSULTANT) {
        // 상담사는 자신의 스케줄만 조회
        List<Schedule> schedules = scheduleService.getSchedulesByConsultantId(user.getId());
        return ResponseEntity.ok(schedules);
    } else if (user.getRole() == UserRole.ADMIN || user.getRole() == UserRole.STAFF) {
        // 관리자/사무원은 전체 스케줄 조회
        List<Schedule> schedules = scheduleService.getAllSchedules(user.getTenantId());
        return ResponseEntity.ok(schedules);
    } else {
        throw new AccessDeniedException("스케줄 조회 권한이 없습니다.");
    }
}
```

---

### 2. ERP 권한 제한 (STAFF 제외)

사무원은 ERP 관련 기능 접근 불가:

```java
@GetMapping("/api/erp/financial")
@PreAuthorize("hasRole('ADMIN')")
public ResponseEntity<?> getFinancialData() {
    // ADMIN만 접근 가능
    // STAFF는 접근 불가
    return ResponseEntity.ok(erpService.getFinancialData());
}
```

---

### 3. 매칭 권한 (업종별 분기)

```java
@PostMapping("/api/mappings")
public ResponseEntity<?> createMapping(
    @RequestBody MappingRequest request,
    @AuthenticationPrincipal User user
) {
    String tenantType = tenantService.getTenantType(user.getTenantId());
    
    if (tenantType.equals("CONSULTATION")) {
        // 상담소: 관리자/사무원만 매칭 가능
        if (user.getRole() != UserRole.ADMIN && user.getRole() != UserRole.STAFF) {
            throw new AccessDeniedException("매칭 권한이 없습니다.");
        }
    } else if (tenantType.equals("ACADEMY")) {
        // 학원: 학생도 강사 선택 가능
        if (user.getRole() == UserRole.CLIENT) {
            // 학생이 강사 선택
            request.setRequestedByStudent(true);
            request.setStatus("PENDING_APPROVAL"); // 승인 대기
        }
    }
    
    return ResponseEntity.ok(mappingService.createMapping(request));
}
```

---

### 4. 학부모 권한 (자녀 정보만)

```java
@GetMapping("/api/students/{studentId}/grades")
public ResponseEntity<?> getStudentGrades(
    @PathVariable Long studentId,
    @AuthenticationPrincipal User user
) {
    if (user.getRole() == UserRole.PARENT) {
        // 학부모는 자녀 정보만 조회 가능
        if (!parentService.isMyChild(user.getId(), studentId)) {
            throw new AccessDeniedException("자녀의 정보만 조회할 수 있습니다.");
        }
    }
    
    return ResponseEntity.ok(gradeService.getGrades(studentId));
}
```

---

## 🎯 권한 체크 구조

### 1. ADMIN 역할 (자동 권한)
```java
// PermissionCheckUtils.java
boolean isAdmin = AdminRoleUtils.isAdmin(currentUser);
if (isAdmin) {
    return null; // 모든 권한 자동 부여
}
```

### 2. 일반 역할 (동적 권한)
```java
// 데이터베이스 기반 권한 체크
boolean hasPermission = dynamicPermissionService.hasPermission(currentUser, permissionCode);
if (!hasPermission) {
    return 403; // 권한 없음
}
```

---

## 📊 레거시 역할 매핑

### 제거된 역할 (지점 기반)
다음 역할들은 테넌트 시스템에서 사용하지 않습니다:

| 레거시 역할 | 새 역할 | 비고 |
|-----------|--------|------|
| BRANCH_ADMIN | ADMIN | 테넌트 관리자로 통합 |
| BRANCH_SUPER_ADMIN | ADMIN | 테넌트 관리자로 통합 |
| BRANCH_MANAGER | STAFF | 사무원으로 변경 |
| HQ_ADMIN | ADMIN | 본사 개념 제거 |
| SUPER_HQ_ADMIN | ADMIN | 본사 개념 제거 |
| HQ_MASTER | ADMIN | 본사 개념 제거 |

### 중요: 브랜치 개념 완전 제거

**브랜치 관련 역할은 더 이상 사용되지 않으며, 모든 코드에서 제거되어야 합니다.**

**표준 관리자 역할만 사용**:
- `ADMIN`: 기본 관리자
- `TENANT_ADMIN`: 테넌트 관리자  
- `PRINCIPAL`: 원장
- `OWNER`: 사장

**제거된 레거시 역할** (사용 금지):
- ❌ `BRANCH_ADMIN`, `BRANCH_SUPER_ADMIN`, `BRANCH_MANAGER` (브랜치 개념 제거)
- ❌ `HQ_ADMIN`, `SUPER_HQ_ADMIN`, `HQ_MASTER`, `HQ_SUPER_ADMIN` (본사 개념 제거)

**코드 작성 시**:
```java
// ✅ 올바른 예시: 표준 관리자 역할만 사용
if (SessionUtils.isAdmin(session)) {
    // 관리자 권한 처리
}

// ❌ 잘못된 예시: 레거시 브랜치 역할 체크 금지
if (roleName.equals("BRANCH_SUPER_ADMIN")) {
    // 사용 금지
}
```

---

## 💡 권한 설정 가이드

### 신규 테넌트 생성 시
```java
// 1. 테넌트 생성
Tenant tenant = createTenant("상담소 A");

// 2. 원장(관리자) 계정 생성
User admin = User.builder()
    .username("admin")
    .email("admin@example.com")
    .role(UserRole.ADMIN)  // ✅ ADMIN 역할만 설정
    .tenantId(tenant.getId())
    .isActive(true)
    .build();

// 3. 권한 설정 불필요 (자동 부여)
// ADMIN 역할은 PermissionCheckUtils에서 자동으로 모든 권한 부여
```

### 상담사 등록 시
```java
User consultant = User.builder()
    .username("consultant001")
    .email("consultant@example.com")
    .role(UserRole.CONSULTANT)  // ✅ CONSULTANT 역할
    .tenantId(tenant.getId())
    .isActive(true)
    .build();

// 필요시 추가 권한 부여
dynamicPermissionService.grantPermission("CONSULTANT", "CLIENT_MANAGE", "admin");
```

### 사무원 등록 시
```java
User staff = User.builder()
    .username("staff001")
    .email("staff@example.com")
    .role(UserRole.STAFF)  // ✅ STAFF 역할
    .tenantId(tenant.getId())
    .isActive(true)
    .build();

// 사무원 기본 권한 설정
List<String> staffPermissions = Arrays.asList(
    "CLIENT_MANAGE",      // 내담자 관리
    "MAPPING_VIEW",       // 매칭 조회
    "SCHEDULE_CREATE",    // 스케줄 생성
    "STATISTICS_VIEW"     // 통계 조회
);
dynamicPermissionService.setRolePermissions("STAFF", staffPermissions);
```

---

## 🚨 주의사항

### 1. ADMIN 역할 부여 주의
- ✅ 테넌트 소유자에게만 부여
- ✅ 신뢰할 수 있는 사용자만
- ❌ 일반 직원에게 부여 금지

### 2. 역할 변경 시 주의
```java
// ❌ 잘못된 예: 직접 역할 변경
user.setRole(UserRole.ADMIN);  // 위험!

// ✅ 올바른 예: 검증 후 변경
if (currentUser.getRole() == UserRole.ADMIN) {
    user.setRole(newRole);
    userRepository.save(user);
}
```

### 3. 권한 체크 누락 방지
```java
// ✅ 모든 관리 API에 권한 체크 추가
@PostMapping("/admin/important-action")
public ResponseEntity<?> importantAction(HttpSession session) {
    ResponseEntity<?> check = PermissionCheckUtils.checkPermission(
        session, "IMPORTANT_ACTION", dynamicPermissionService);
    if (check != null) return check;
    
    // 비즈니스 로직
}
```

---

## 📈 마이그레이션 가이드

### 기존 사용자 역할 변경
```sql
-- 1. 지점 관리자 → 테넌트 관리자
UPDATE users 
SET role = 'ADMIN' 
WHERE role IN ('BRANCH_ADMIN', 'BRANCH_SUPER_ADMIN', 'HQ_ADMIN');

-- 2. 지점 매니저 → 사무원
UPDATE users 
SET role = 'STAFF' 
WHERE role = 'BRANCH_MANAGER';

-- 3. 상담사, 내담자는 유지
-- (변경 불필요)
```

### 권한 데이터 정리
```sql
-- 1. ADMIN 역할 권한 삭제 (자동 부여되므로 불필요)
DELETE FROM role_permissions 
WHERE role_name = 'ADMIN';

-- 2. 레거시 역할 권한 삭제
DELETE FROM role_permissions 
WHERE role_name IN ('BRANCH_ADMIN', 'BRANCH_SUPER_ADMIN', 'HQ_ADMIN');

-- 3. STAFF 역할 기본 권한 추가
INSERT INTO role_permissions (tenant_id, role_name, permission_code, is_active, created_at, updated_at)
VALUES 
  ('tenant-001', 'STAFF', 'CLIENT_MANAGE', 1, NOW(), NOW()),
  ('tenant-001', 'STAFF', 'MAPPING_VIEW', 1, NOW(), NOW()),
  ('tenant-001', 'STAFF', 'SCHEDULE_CREATE', 1, NOW(), NOW()),
  ('tenant-001', 'STAFF', 'STATISTICS_VIEW', 1, NOW(), NOW());
```

---

## 🎯 결론

### 장점
1. **단순성**: 4가지 역할로 명확한 구조
2. **확장성**: 필요시 동적 권한으로 세밀한 제어
3. **보안성**: ADMIN 역할 자동 권한으로 설정 오류 방지
4. **유지보수**: 역할 체계가 명확하여 관리 용이

### 권장사항
- ✅ 신규 테넌트는 4가지 역할만 사용
- ✅ ADMIN 역할은 최소한으로 부여
- ✅ STAFF 역할로 부관리자 기능 구현
- ✅ 세밀한 권한 제어는 동적 권한 시스템 활용

---

**작성자**: AI Assistant  
**검토 완료**: 역할 체계 단순화 완료  
**다음 단계**: 프론트엔드 역할 기반 UI 구현

