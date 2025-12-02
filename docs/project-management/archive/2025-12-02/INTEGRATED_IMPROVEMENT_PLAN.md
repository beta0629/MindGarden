# 통합 개선 계획서: 멀티 비즈니스 타입 + 번들 시스템

**작성일**: 2025-12-02  
**버전**: 1.0.0  
**목적**: 상담소 위젯 의존성 분석 + 멀티 비즈니스 타입 재설계 통합 실행 계획

---

## 📋 Executive Summary

### 문제 정의
1. **위젯 의존성 문제**: 독립된 기능이 거의 없고 전부 유기적으로 연결 (API 10회 중복 호출)
2. **업종 확장 문제**: 상담소만 완성, 학원/병원/요식업 등 추가 필요
3. **위젯 방식 고민**: 현재 위젯 시스템이 복잡하고 성능 문제

### 해결 방안
1. **통합 번들 시스템**: API 호출 10회 → 3회 (70% 감소)
2. **하이브리드 아키텍처**: 대시보드(위젯) + 기능 페이지(전통)
3. **공통 추상화 레이어**: 모든 업종을 동일한 구조로 지원

### 기대 효과
- **성능**: 70-75% 향상
- **확장성**: 새 업종 추가 시간 75% 단축
- **유지보수성**: 코드 중복 80% 감소
- **비즈니스**: 5개 업종 지원 → 시장 5배 확대

---

## 🎯 핵심 결정 사항

### 1. 위젯 vs 페이지? → **하이브리드** ⭐

| 영역 | 방식 | 이유 |
|-----|------|------|
| **대시보드** | 위젯 기반 | 유연성, 커스터마이징 |
| **기능 페이지** | 전통 페이지 | 단순성, 명확성 |
| **데이터 로드** | 번들 시스템 | 성능 최적화 |

### 2. 데이터베이스 구조? → **하이브리드** ⭐

```sql
-- 공통 테이블 (모든 업종)
service_providers (상담사, 강사, 의사, 직원 등)
service_receivers (내담자, 학생, 환자, 고객 등)
service_sessions (상담, 수업, 진료, 주문 등)

-- 업종별 확장 테이블
consultant_details (상담사 특화 정보)
teacher_details (강사 특화 정보)
doctor_details (의사 특화 정보)
```

### 3. 구현 순서? → **단계적 접근** ⭐

```
Phase 0: 설계 (1주)
  ↓
Phase 1: 공통 레이어 (2주)
  ↓
Phase 2: 상담소 마이그레이션 (2주) ← 기존 시스템 개선
  ↓
Phase 3-6: 학원/병원/요식업/소매업 (9주) ← 새 업종 추가
  ↓
Phase 7: 최적화 (1주)

총 15주 (3.5개월)
```

---

## 🏗️ 시스템 아키텍처

### 1. 전체 구조

```
┌─────────────────────────────────────────────────────────┐
│                   프론트엔드                              │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │         대시보드 (위젯 기반)                      │  │
│  │  - 업종별 번들 시스템                             │  │
│  │  - 단일 API 호출 (3회)                           │  │
│  │  - 위젯 간 데이터 공유                            │  │
│  └──────────────────────────────────────────────────┘  │
│                         ↓                                │
│  ┌──────────────────────────────────────────────────┐  │
│  │         기능 페이지 (전통 페이지)                 │  │
│  │  - 상담사/강사/의사 관리                          │  │
│  │  - 내담자/학생/환자 관리                          │  │
│  │  - 일정/수업/진료 관리                            │  │
│  └──────────────────────────────────────────────────┘  │
│                                                          │
└─────────────────────────────────────────────────────────┘
                         ↓ API 호출
┌─────────────────────────────────────────────────────────┐
│                   백엔드                                  │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │     BusinessBundleController (공통)              │  │
│  │  GET /api/bundle/core-stats                      │  │
│  │  GET /api/bundle/user-data                       │  │
│  │  GET /api/bundle/billing-data                    │  │
│  └──────────────────────────────────────────────────┘  │
│                         ↓                                │
│  ┌──────────────────────────────────────────────────┐  │
│  │     BusinessBundleService (인터페이스)           │  │
│  │  - ConsultationBundleService                     │  │
│  │  - AcademyBundleService                          │  │
│  │  - HospitalBundleService                         │  │
│  │  - RestaurantBundleService                       │  │
│  └──────────────────────────────────────────────────┘  │
│                         ↓                                │
│  ┌──────────────────────────────────────────────────┐  │
│  │     공통 인터페이스                               │  │
│  │  - ServiceProvider (상담사, 강사, 의사...)       │  │
│  │  - ServiceReceiver (내담자, 학생, 환자...)       │  │
│  │  - ServiceSession (상담, 수업, 진료...)          │  │
│  └──────────────────────────────────────────────────┘  │
│                         ↓                                │
│  ┌──────────────────────────────────────────────────┐  │
│  │     데이터베이스                                  │  │
│  │  - service_providers (공통)                      │  │
│  │  - service_receivers (공통)                      │  │
│  │  - service_sessions (공통)                       │  │
│  │  - consultant_details (상담소 특화)              │  │
│  │  - teacher_details (학원 특화)                   │  │
│  │  - doctor_details (병원 특화)                    │  │
│  └──────────────────────────────────────────────────┘  │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

### 2. 번들 시스템 상세

#### A. 상담소 번들 (Consultation Bundle)

**API 호출**: 3회
```
GET /api/bundle/core-stats?tenantId=xxx
  → 상담사, 내담자, 상담, 일정, 매칭 통계

GET /api/bundle/user-data?tenantId=xxx&userId=xxx&userRole=CONSULTANT
  → 사용자별 데이터 (내 일정, 내 상담, 내 내담자)

GET /api/bundle/billing-data?tenantId=xxx
  → ERP 통합 (수수료, 결제, 예산)
```

**제공 데이터**:
```javascript
{
  coreStats: {
    totalConsultants: 10,
    totalClients: 50,
    totalConsultations: 200,
    todaySchedules: 5,
    completedSessions: 180,
    activeMappings: 45
  },
  userData: {
    mySchedules: [...],
    myConsultations: [...],
    myClients: [...]
  },
  billingData: {
    totalRevenue: 5000000,
    pendingPayments: 500000,
    budgetUsage: 75,
    recentTransactions: [...]
  }
}
```

**위젯 목록**: 7개
1. WelcomeWidget
2. SummaryPanelsWidget
3. StatisticsGridWidget
4. ConsultationSummaryWidget
5. SessionManagementWidget
6. RecentActivitiesWidget
7. ErpManagementWidget

#### B. 학원 번들 (Academy Bundle)

**API 호출**: 3회 (동일 구조)
```
GET /api/bundle/core-stats?tenantId=xxx
  → 강사, 학생, 수업, 출석, 성적 통계

GET /api/bundle/user-data?tenantId=xxx&userId=xxx&userRole=TEACHER
  → 사용자별 데이터 (내 수업, 내 학생, 내 출석)

GET /api/bundle/billing-data?tenantId=xxx
  → 수강료, 청구, 정산
```

**제공 데이터**:
```javascript
{
  coreStats: {
    totalTeachers: 15,
    totalStudents: 100,
    totalClasses: 50,
    todayClasses: 8,
    attendanceRate: 95,
    totalParents: 80
  },
  userData: {
    myClasses: [...],
    myStudents: [...],
    myAttendance: [...]
  },
  billingData: {
    tuitionRevenue: 10000000,
    pendingPayments: 1000000,
    settlementStatus: {...}
  }
}
```

**위젯 목록**: 8개
1. WelcomeWidget
2. SummaryPanelsWidget
3. StatisticsGridWidget
4. ClassSummaryWidget
5. AttendanceManagementWidget
6. GradeManagementWidget
7. RecentActivitiesWidget
8. BillingManagementWidget

#### C. 병원 번들 (Hospital Bundle)

**API 호출**: 3회 (동일 구조)
```
GET /api/bundle/core-stats?tenantId=xxx
  → 의사, 환자, 진료, 예약 통계

GET /api/bundle/user-data?tenantId=xxx&userId=xxx&userRole=DOCTOR
  → 사용자별 데이터 (내 진료, 내 환자, 내 처방)

GET /api/bundle/billing-data?tenantId=xxx
  → 진료비, 보험청구, 수납
```

#### D. 요식업 번들 (Restaurant Bundle)

**API 호출**: 3회 (동일 구조)
```
GET /api/bundle/core-stats?tenantId=xxx
  → 직원, 고객, 주문, 테이블 통계

GET /api/bundle/user-data?tenantId=xxx&userId=xxx&userRole=STAFF
  → 사용자별 데이터 (내 주문, 내 테이블)

GET /api/bundle/billing-data?tenantId=xxx
  → 매출, POS 연동, 재고
```

---

## 📊 성능 비교

### Before (현재 - 상담소만)

```
대시보드 로딩 시:
  WelcomeWidget → API 1회
  SummaryPanelsWidget → API 1회
  StatisticsGridWidget → API 5회 (consultants, clients, mappings, schedules, finance)
  ErpManagementWidget → API 3회 (items, requests, budgets)
  
총 10회 API 호출
네트워크 트래픽: 약 500KB
로딩 시간: 약 2초
```

### After (개선 - 모든 업종)

```
대시보드 로딩 시:
  BusinessBundle → API 3회 (core-stats, user-data, billing-data)
  모든 위젯 → 번들 데이터 공유 (추가 API 호출 없음)
  
총 3회 API 호출
네트워크 트래픽: 약 150KB
로딩 시간: 약 0.5초
```

### 개선 효과

| 지표 | Before | After | 개선율 |
|-----|--------|-------|--------|
| **API 호출 수** | 10회 | 3회 | **70% 감소** |
| **네트워크 트래픽** | 500KB | 150KB | **70% 감소** |
| **로딩 시간** | 2초 | 0.5초 | **75% 단축** |
| **데이터 동기화** | 수동 | 자동 | **100% 개선** |
| **테넌트 격리** | 불완전 | 완전 | **100% 개선** |
| **코드 중복** | 높음 | 낮음 | **80% 감소** |

---

## 🚀 구현 로드맵 (15주)

### Phase 0: 설계 및 합의 (1주)

**목표**: 아키텍처 최종 확정 및 팀 합의

**작업 항목**:
- [ ] 데이터베이스 스키마 최종 설계
  - [ ] 공통 테이블 (service_providers, service_receivers, service_sessions)
  - [ ] 업종별 확장 테이블 (consultant_details, teacher_details 등)
  - [ ] 마이그레이션 전략 확정
- [ ] API 명세 작성
  - [ ] `/api/bundle/core-stats` 스펙
  - [ ] `/api/bundle/user-data` 스펙
  - [ ] `/api/bundle/billing-data` 스펙
- [ ] 프론트엔드 컴포넌트 구조 설계
  - [ ] BundleRegistry 구조
  - [ ] useBusinessBundle 훅 인터페이스
  - [ ] 범용 위젯 템플릿
- [ ] 팀 리뷰 및 승인
- [ ] 문서화

**산출물**:
- 데이터베이스 ERD
- API 명세서
- 컴포넌트 다이어그램
- 구현 가이드

---

### Phase 1: 공통 추상화 레이어 구축 (2주)

**목표**: 모든 업종이 공유하는 기반 구축

#### 1.1 백엔드 (1주)

**작업 항목**:
- [ ] **공통 인터페이스 생성**
  ```java
  // src/main/java/com/coresolution/core/domain/common/
  ServiceProvider.java
  ServiceReceiver.java
  ServiceSession.java
  ```
- [ ] **번들 서비스 인터페이스**
  ```java
  // src/main/java/com/coresolution/core/service/bundle/
  BusinessBundleService.java
  CoreStatsDTO.java
  UserDataDTO.java
  BillingDataDTO.java
  ```
- [ ] **공통 컨트롤러**
  ```java
  // src/main/java/com/coresolution/core/controller/
  BusinessBundleController.java
  ```
- [ ] **데이터베이스 마이그레이션**
  ```sql
  // src/main/resources/db/migration/
  V100__create_common_service_tables.sql
  V101__create_business_specific_tables.sql
  ```

#### 1.2 프론트엔드 (1주)

**작업 항목**:
- [ ] **번들 레지스트리**
  ```javascript
  // frontend/src/bundles/
  BundleRegistry.js
  ConsultationBundle.js
  AcademyBundle.js
  HospitalBundle.js
  RestaurantBundle.js
  ```
- [ ] **번들 훅**
  ```javascript
  // frontend/src/hooks/
  useBusinessBundle.js
  ```
- [ ] **범용 위젯 템플릿**
  ```javascript
  // frontend/src/components/dashboard/widgets/universal/
  UniversalWelcomeWidget.js
  UniversalSummaryPanelsWidget.js
  UniversalStatisticsGridWidget.js
  ```

**산출물**:
- 공통 인터페이스 구현
- 번들 시스템 기반
- 단위 테스트

---

### Phase 2: 상담소 번들 마이그레이션 (2주)

**목표**: 기존 상담소 시스템을 번들 시스템으로 전환

#### 2.1 백엔드 (1주)

**작업 항목**:
- [ ] **ConsultationBundleService 구현**
  ```java
  @Service
  public class ConsultationBundleService implements BusinessBundleService {
      @Override
      public CoreStatsDTO getCoreStats(String tenantId) { ... }
      
      @Override
      public UserDataDTO getUserData(String tenantId, Long userId, String userRole) { ... }
      
      @Override
      public BillingDataDTO getBillingData(String tenantId) { ... }
  }
  ```
- [ ] **기존 엔티티 마이그레이션**
  - [ ] Consultant → ServiceProvider + ConsultantDetails
  - [ ] Client → ServiceReceiver + ClientDetails
  - [ ] Consultation → ServiceSession + ConsultationDetails
- [ ] **데이터 마이그레이션 스크립트**
  ```sql
  V102__migrate_consultants_to_service_providers.sql
  V103__migrate_clients_to_service_receivers.sql
  V104__migrate_consultations_to_service_sessions.sql
  ```

#### 2.2 프론트엔드 (1주)

**작업 항목**:
- [ ] **7개 위젯 마이그레이션**
  - [ ] WelcomeWidget → useBusinessBundle 사용
  - [ ] SummaryPanelsWidget → useBusinessBundle 사용
  - [ ] StatisticsGridWidget → useBusinessBundle 사용
  - [ ] ConsultationSummaryWidget → useBusinessBundle 사용
  - [ ] SessionManagementWidget → useBusinessBundle 사용
  - [ ] RecentActivitiesWidget → useBusinessBundle 사용
  - [ ] ErpManagementWidget → useBusinessBundle 사용
- [ ] **기능 페이지 업데이트**
  - [ ] /consultants
  - [ ] /clients
  - [ ] /consultations
  - [ ] /sessions

**산출물**:
- 상담소 번들 완성
- 기존 기능 100% 호환
- 성능 개선 검증 (API 10회 → 3회)

---

### Phase 3: 학원 번들 완성 (2주)

**목표**: 학원 시스템 완전 구현

#### 3.1 백엔드 (1주)

**작업 항목**:
- [ ] **AcademyBundleService 구현**
- [ ] **학원 엔티티**
  - [ ] Teacher (ServiceProvider)
  - [ ] Student (ServiceReceiver)
  - [ ] Class (ServiceSession)
  - [ ] Parent (추가 엔티티)
  - [ ] Attendance (추가 엔티티)
  - [ ] Grade (추가 엔티티)
- [ ] **학원 API**
  - [ ] /api/academy/teachers
  - [ ] /api/academy/students
  - [ ] /api/academy/classes
  - [ ] /api/academy/attendance
  - [ ] /api/academy/grades

#### 3.2 프론트엔드 (1주)

**작업 항목**:
- [ ] **8개 위젯 구현**
  - [ ] WelcomeWidget (학원 버전)
  - [ ] SummaryPanelsWidget (학원 버전)
  - [ ] StatisticsGridWidget (학원 버전)
  - [ ] ClassSummaryWidget
  - [ ] AttendanceManagementWidget
  - [ ] GradeManagementWidget
  - [ ] RecentActivitiesWidget (학원 버전)
  - [ ] BillingManagementWidget
- [ ] **기능 페이지**
  - [ ] /teachers
  - [ ] /students
  - [ ] /classes
  - [ ] /attendance
  - [ ] /grades
  - [ ] /parents

**산출물**:
- 학원 번들 완성
- 학부모 기능 추가
- 출석/성적 관리 기능

---

### Phase 4: 병원 번들 구현 (3주)

**목표**: 병원 시스템 신규 구현

#### 4.1 백엔드 (1.5주)

**작업 항목**:
- [ ] **HospitalBundleService 구현**
- [ ] **병원 엔티티**
  - [ ] Doctor (ServiceProvider)
  - [ ] Patient (ServiceReceiver)
  - [ ] Appointment (ServiceSession)
  - [ ] Treatment (추가 엔티티)
  - [ ] Prescription (추가 엔티티)
  - [ ] MedicalRecord (추가 엔티티)
- [ ] **병원 API**
  - [ ] /api/hospital/doctors
  - [ ] /api/hospital/patients
  - [ ] /api/hospital/appointments
  - [ ] /api/hospital/treatments
  - [ ] /api/hospital/prescriptions

#### 4.2 프론트엔드 (1.5주)

**작업 항목**:
- [ ] **8개 위젯 구현**
  - [ ] WelcomeWidget (병원 버전)
  - [ ] SummaryPanelsWidget (병원 버전)
  - [ ] StatisticsGridWidget (병원 버전)
  - [ ] AppointmentSummaryWidget
  - [ ] TreatmentManagementWidget
  - [ ] PrescriptionManagementWidget
  - [ ] RecentActivitiesWidget (병원 버전)
  - [ ] MedicalBillingWidget
- [ ] **기능 페이지**
  - [ ] /doctors
  - [ ] /patients
  - [ ] /appointments
  - [ ] /treatments
  - [ ] /prescriptions
  - [ ] /medical-records

**산출물**:
- 병원 번들 완성
- 진료기록 관리
- 처방전 기능
- 의료보험 청구

---

### Phase 5: 요식업 번들 구현 (2주)

**목표**: 요식업 시스템 신규 구현

#### 5.1 백엔드 (1주)

**작업 항목**:
- [ ] **RestaurantBundleService 구현**
- [ ] **요식업 엔티티**
  - [ ] Staff (ServiceProvider)
  - [ ] Customer (ServiceReceiver)
  - [ ] Order (ServiceSession)
  - [ ] Menu (추가 엔티티)
  - [ ] Table (추가 엔티티)
  - [ ] Inventory (추가 엔티티)

#### 5.2 프론트엔드 (1주)

**작업 항목**:
- [ ] **7개 위젯 구현**
  - [ ] OrderSummaryWidget
  - [ ] TableManagementWidget
  - [ ] MenuManagementWidget
  - [ ] InventoryWidget
  - [ ] POSIntegrationWidget
- [ ] **기능 페이지**
  - [ ] /staff
  - [ ] /menus
  - [ ] /orders
  - [ ] /tables
  - [ ] /inventory

**산출물**:
- 요식업 번들 완성
- 메뉴 관리
- 테이블 관리
- POS 연동

---

### Phase 6: 소매업 번들 구현 (2주)

**목표**: 소매업 시스템 신규 구현

**작업 항목**:
- [ ] RetailBundleService 구현
- [ ] 소매업 엔티티 (Staff, Customer, Sale, Product, Inventory)
- [ ] 소매업 위젯 및 페이지

**산출물**:
- 소매업 번들 완성
- 재고 관리
- 상품 관리
- POS 연동

---

### Phase 7: 최적화 및 문서화 (1주)

**목표**: 전체 시스템 최적화 및 문서 완성

**작업 항목**:
- [ ] **성능 최적화**
  - [ ] API 응답 시간 최적화
  - [ ] 데이터베이스 인덱스 최적화
  - [ ] 프론트엔드 번들 크기 최적화
- [ ] **전체 통합 테스트**
  - [ ] 5개 업종 동시 테스트
  - [ ] 테넌트 간 격리 검증
  - [ ] 성능 벤치마크
- [ ] **사용자 가이드 작성**
  - [ ] 업종별 사용 가이드
  - [ ] 관리자 가이드
  - [ ] API 문서
- [ ] **개발자 문서 업데이트**
  - [ ] 아키텍처 문서
  - [ ] 번들 시스템 가이드
  - [ ] 새 업종 추가 가이드

**산출물**:
- 성능 보고서
- 사용자 가이드
- 개발자 문서
- 배포 준비 완료

---

## 📊 최종 비교표

### 시스템 비교

| 항목 | 현재 (Before) | 개선 (After) | 개선율 |
|-----|--------------|-------------|--------|
| **지원 업종** | 1개 (상담소) | 5개 | **400% 증가** |
| **API 호출** | 10회 | 3회 | **70% 감소** |
| **로딩 시간** | 2초 | 0.5초 | **75% 단축** |
| **코드 중복** | 높음 | 낮음 | **80% 감소** |
| **새 업종 추가** | 4주 | 1주 | **75% 단축** |
| **유지보수성** | 낮음 | 높음 | **대폭 개선** |

### 비용 효과

| 항목 | 현재 | 개선 | 절감 |
|-----|------|------|------|
| **개발 비용** (새 업종) | 4주 × 4명 = 16인주 | 1주 × 2명 = 2인주 | **87.5% 절감** |
| **서버 비용** (API 호출) | 월 $500 | 월 $150 | **70% 절감** |
| **유지보수 비용** | 월 8인일 | 월 2인일 | **75% 절감** |

---

## 🎯 성공 지표 (KPI)

### 기술 지표

| 지표 | 목표 | 측정 방법 |
|-----|------|----------|
| API 호출 수 | 3회 이하 | 브라우저 네트워크 탭 |
| 로딩 시간 | 0.5초 이하 | Lighthouse 성능 점수 |
| 코드 커버리지 | 80% 이상 | Jest/JUnit 테스트 |
| 번들 크기 | 500KB 이하 | Webpack Bundle Analyzer |

### 비즈니스 지표

| 지표 | 목표 | 측정 방법 |
|-----|------|----------|
| 지원 업종 수 | 5개 | 시스템 설정 |
| 신규 업종 추가 시간 | 1주 이하 | 실제 구현 시간 |
| 고객 만족도 | 4.5/5 이상 | 사용자 설문 |
| 시장 점유율 | 5배 증가 | 업종별 가입자 수 |

---

## 🚨 리스크 관리

### 주요 리스크

| 리스크 | 영향도 | 발생 가능성 | 대응 방안 |
|--------|--------|------------|----------|
| **기존 데이터 마이그레이션 실패** | 높음 | 중간 | 롤백 계획, 단계적 마이그레이션 |
| **성능 저하** | 중간 | 낮음 | 성능 테스트, 캐싱 전략 |
| **업종별 요구사항 차이** | 중간 | 높음 | 유연한 확장 구조 |
| **일정 지연** | 중간 | 중간 | 버퍼 기간 확보, 우선순위 조정 |

### 롤백 계획

1. **Phase별 체크포인트**: 각 Phase 완료 시 롤백 포인트 생성
2. **데이터베이스 백업**: 마이그레이션 전 전체 백업
3. **기능 플래그**: 새 기능을 점진적으로 활성화
4. **병렬 운영**: 구 시스템과 신 시스템 병렬 운영 기간 확보

---

## 📝 결론

### 핵심 결정

1. ✅ **하이브리드 아키텍처**: 대시보드(위젯) + 기능 페이지(전통)
2. ✅ **통합 번들 시스템**: API 호출 70% 감소
3. ✅ **공통 추상화 레이어**: 모든 업종 동일 구조
4. ✅ **단계적 구현**: 15주 (3.5개월)

### 즉시 시작 가능

**Phase 0 (설계 및 합의)**부터 시작하여 팀 리뷰 후 본격 구현을 권장합니다.

### 기대 효과

- ✅ **성능**: 70-75% 향상
- ✅ **확장성**: 새 업종 추가 시간 75% 단축
- ✅ **유지보수성**: 코드 중복 80% 감소
- ✅ **비즈니스**: 5개 업종 지원 → 시장 5배 확대
- ✅ **비용**: 개발/서버/유지보수 비용 70-87% 절감

---

**최종 업데이트**: 2025-12-02  
**작성자**: CoreSolution Team  
**상태**: ✅ 통합 계획 완료, 팀 리뷰 대기

---

## 📎 관련 문서

1. [상담소 위젯 의존성 분석](./CONSULTATION_CENTER_WIDGET_DEPENDENCY_ANALYSIS.md)
2. [멀티 비즈니스 타입 시스템 재설계](./MULTI_BUSINESS_TYPE_SYSTEM_REDESIGN.md)
3. [비즈니스 타입 시스템](../../architecture/BUSINESS_TYPE_SYSTEM.md)
4. [업종별 컴포넌트 분리](../2025-11-26/BUSINESS_TYPE_COMPONENT_SEPARATION.md)

