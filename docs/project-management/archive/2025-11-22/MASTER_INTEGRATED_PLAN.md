# 종합 마스터 계획 (2025-11-22) - 수정본

**작성일**: 2025-11-22  
**최종 업데이트**: 2025-11-22 (우선순위 재조정)  
**상태**: 활성 관리 중

**핵심 원칙**: 
> **온보딩에서 등록하면 실제 코어솔루션에서 사용 가능하게 만드는 것이 최우선**
> → 추후 서비스 개선은 온보딩 플로우가 완전히 작동한 후 진행

**참고 문서**:
- `MASTER_TODO_AND_IMPROVEMENTS.md` - 마스터 TODO
- `COMPREHENSIVE_TODO_LIST.md` - ERP 종합 TODO
- `PENDING_DEVELOPMENT_ITEMS.md` - 미개발 항목
- `TODAY_TODO_CHECKLIST.md` - 오늘 할 일
- `DEVELOPMENT_CHECKLIST.md` - 개발 체크리스트

---

## 📊 전체 작업 분류 및 우선순위 (재조정)

### 🔥 P0 - 최우선 (온보딩 플로우 완성)

**예상 시간**: 2-3주

#### 1. 온보딩 플로우 완전 작동 확인 및 수정 (1주) ⭐⭐⭐⭐⭐

**목적**: 온보딩에서 등록하면 실제 코어솔루션에서 사용 가능한 상태까지 완성

**체크리스트**:

**Day 1-2: 온보딩 승인 프로세스 검증**
- [ ] 온보딩 요청 생성 확인
  - [ ] Trinity 홈페이지에서 온보딩 요청 생성
  - [ ] 요청 데이터 저장 확인
- [ ] 온보딩 승인 프로세스 확인
  - [ ] `ProcessOnboardingApproval` 프로시저 호출 확인
  - [ ] 테넌트 생성 확인
  - [ ] 업종 카테고리 매핑 확인
  - [ ] 컴포넌트 활성화 확인
  - [ ] 구독 생성 확인
  - [ ] 역할 템플릿 적용 확인

**Day 3-4: 관리자 계정 생성 및 역할 할당**
- [ ] 관리자 계정 생성 확인
  - [ ] `createTenantAdminAccount` 메서드 동작 확인
  - [ ] 관리자 계정으로 로그인 가능한지 확인
- [ ] 역할 할당 확인
  - [ ] `UserRoleAssignment` 생성 확인
  - [ ] "관리자" `TenantRole` 찾기 확인
  - [ ] 역할 할당 실패 시 처리 확인

**Day 5: 기본 대시보드 생성 및 접근 확인**
- [ ] 기본 대시보드 생성 확인
  - [ ] 역할별 기본 대시보드 자동 생성 확인
  - [ ] `dashboard_config` JSON 생성 확인
- [ ] 관리자 로그인 후 대시보드 접근 확인
  - [ ] `/api/v1/tenant/dashboards/current` API 동작 확인
  - [ ] 대시보드 화면 표시 확인
  - [ ] 404 오류 없이 접근 가능한지 확인

**참고 문서**:
- `ONBOARDING_ADMIN_ACCOUNT_PROCESS.md`
- `TENANT_DASHBOARD_MANAGEMENT_SYSTEM.md`
- `BUSINESS_CATEGORY_ROLE_SYSTEM.md`

---

#### 2. 온보딩 플로우 문제점 수정 (1주) ⭐⭐⭐⭐⭐

**목적**: 검증 중 발견된 문제점 즉시 수정

**체크리스트**:
- [ ] 프로시저 호출 실패 시 처리
  - [ ] 에러 로깅
  - [ ] 롤백 처리
  - [ ] 사용자 알림
- [ ] 관리자 계정 생성 실패 시 처리
  - [ ] 에러 로깅
  - [ ] 재시도 로직
  - [ ] 수동 생성 가이드
- [ ] 역할 템플릿 적용 실패 시 처리
  - [ ] 기본 역할 생성
  - [ ] 에러 로깅
- [ ] 대시보드 생성 실패 시 처리
  - [ ] 기본 대시보드 생성
  - [ ] 에러 로깅
- [ ] 멀티 테넌트 권한 체크 문제 수정
  - [ ] 이메일 기반 권한 확인 동작 확인
  - [ ] 테넌트 전환 시 권한 확인 동작 확인

---

#### 3. 온보딩 플로우 통합 테스트 (0.5주) ⭐⭐⭐⭐⭐

**목적**: 전체 플로우가 완전히 작동하는지 확인

**체크리스트**:
- [ ] **시나리오 1: 정상 플로우**
  - [ ] Trinity 홈페이지에서 온보딩 요청 생성
  - [ ] 관리자가 온보딩 승인
  - [ ] 테넌트 생성 확인
  - [ ] 관리자 계정 생성 확인
  - [ ] 관리자 계정으로 로그인
  - [ ] 대시보드 접근 확인
  - [ ] 기본 기능 사용 가능 확인
- [ ] **시나리오 2: 이메일 중복 처리**
  - [ ] 같은 이메일로 여러 테넌트 온보딩 요청
  - [ ] 첫 번째 승인 후 두 번째 승인 시도
  - [ ] 중복 체크 동작 확인
- [ ] **시나리오 3: 멀티 테넌트 사용자**
  - [ ] 같은 이메일로 여러 테넌트에 계정 생성
  - [ ] 로그인 시 멀티 테넌트 사용자 감지
  - [ ] 테넌트 선택 화면 표시
  - [ ] 각 테넌트별로 다른 역할로 로그인

---

#### 4. Trinity 홈페이지 PG SDK 연동 테스트 (0.5주) ⭐⭐⭐⭐

**목적**: 결제 시스템 검증 (온보딩 플로우의 일부)

**체크리스트**:
- [ ] 실제 테스트 카드로 카드 등록 테스트
- [ ] 즉시 결제 테스트
- [ ] 에러 처리 확인
- [ ] 콜백 페이지 동작 확인

**참고**: `PENDING_DEVELOPMENT_ITEMS.md` #1

---

### 🚀 P1 - 중요 (온보딩 완성 후)

**예상 시간**: 8-9주

#### 5. ERP 멀티 테넌트 전환 (4주) ⭐⭐⭐
**목적**: 모든 입점사와 ERP 연동 가능하도록

**작업 내용**:
- [ ] **Week 1: ERP 엔티티 멀티 테넌트 전환**
  - [ ] `FinancialTransaction` → `BaseEntity` 상속
  - [ ] `PurchaseRequest`, `PurchaseOrder`, `Budget`, `Item` 등 모든 ERP 엔티티
  - [ ] 데이터베이스 마이그레이션 스크립트 작성 (`V40__add_tenant_id_to_erp_entities.sql`)
  - [ ] 인덱스 추가
- [ ] **Week 2: ERP 동적 쿼리 전환**
  - [ ] `FinancialTransactionSpecifications` 생성
  - [ ] 메모리 필터링 제거
  - [ ] 인덱스 최적화
  - [ ] 성능 테스트
- [ ] **Week 3: ERP 서비스 멀티 테넌트 지원**
  - [ ] 모든 ERP 서비스에서 `TenantContextHolder` 사용
  - [ ] 테넌트 필터링 자동 적용
- [ ] **Week 4: ERP 프로시저 멀티 테넌트 지원**
  - [ ] `BaseProcedureService` 생성
  - [ ] 모든 ERP 프로시저에 `tenant_id` 파라미터 추가

**참고**: `ERP_MULTI_TENANT_INTEGRATION_STRATEGY.md`

---

#### 6. 기존 ERP 컴포넌트 formatUtils 적용 (1일) ⭐
**목적**: 중복 코드 제거, 일관성 확보

**작업 내용**:
- [ ] 주요 ERP 컴포넌트에서 `formatUtils` 사용
- [ ] 중복 코드 제거

**참고**: `COMPREHENSIVE_TODO_LIST.md` #8

---

#### 7. 학원 기능 MindGarden 수준 완성 (4주) ⭐⭐⭐
**목적**: 학원도 상담소(MindGarden) 수준의 완전한 기능 제공 + ERP 연동

**작업 내용**:

**Week 1: 학원 특화 위젯 구현**
- [ ] **학원 일정 위젯** (`AcademyScheduleWidget`)
  - [ ] 수업 일정 조회
  - [ ] 시간표 표시
  - [ ] 일정 등록/수정/삭제
- [ ] **출석 관리 위젯** (`AcademyAttendanceWidget`)
  - [ ] 출석 체크
  - [ ] 출석 통계
  - [ ] 결석/지각 관리
- [ ] **학원 통계 위젯** (`AcademyStatsWidget`)
  - [ ] 수강생 수 통계
  - [ ] 수업 진행률 통계
  - [ ] 출석률 통계
- [ ] **수강생 관리 위젯** (`AcademyStudentWidget`)
  - [ ] 수강생 목록
  - [ ] 수강생 상세 정보
  - [ ] 수강 등록/취소

**Week 2: 학원 관리 기능 완성**
- [ ] **강좌 관리 기능 강화**
  - [ ] 강좌별 수강생 목록
  - [ ] 강좌별 통계
  - [ ] 강좌 일정 관리
- [ ] **반 관리 기능 강화**
  - [ ] 반별 수강생 관리
  - [ ] 반별 출석 관리
  - [ ] 반별 성적 관리 (선택적)
- [ ] **강사 관리 기능**
  - [ ] 강사별 담당 강좌/반
  - [ ] 강사별 일정 관리
  - [ ] 강사별 통계
- [ ] **수강 등록 프로세스 완성**
  - [ ] 수강 신청 → 승인 프로세스
  - [ ] 결제 연동 (ERP 연동)
  - [ ] 수강 등록 알림

**Week 3: 학원 ERP 연동 완성** ⭐
- [ ] **수강료 결제 ERP 연동**
  - [ ] 수강 등록 시 자동 결제 거래 생성
  - [ ] 수강료 수납 처리 → ERP 매출 거래 생성
  - [ ] 환불 처리 → ERP 환불 거래 생성
  - [ ] 수강료 미납 관리 → ERP 미수금 관리
- [ ] **강사 급여 ERP 연동**
  - [ ] 강사별 수업 시간 집계
  - [ ] 강사 급여 계산 (시간당/월급)
  - [ ] 강사 급여 지급 → ERP 급여 거래 생성
  - [ ] 강사 급여 통계
- [ ] **학원 운영비 ERP 연동**
  - [ ] 교재/교구 구매 → ERP 구매 요청 연동
  - [ ] 임대료/공과금 → ERP 비용 거래 생성
  - [ ] 마케팅 비용 → ERP 비용 거래 생성
  - [ ] 학원 운영비 통계
- [ ] **학원 ERP 통계 위젯**
  - [ ] `AcademyErpStatsWidget` - 학원 ERP 통계
  - [ ] 수강료 수익 통계
  - [ ] 강사 급여 지출 통계
  - [ ] 운영비 지출 통계
  - [ ] 학원 수익성 분석

**Week 4: 학원 대시보드 및 통계 완성**
- [ ] **학원 관리자 대시보드**
  - [ ] 전체 통계 요약
  - [ ] 수강생 현황
  - [ ] 강좌/반 현황
  - [ ] 출석 현황
  - [ ] **수익 현황 (ERP 연동)** ⭐
  - [ ] **강사 급여 현황 (ERP 연동)** ⭐
  - [ ] **운영비 현황 (ERP 연동)** ⭐
- [ ] **학원 강사 대시보드**
  - [ ] 담당 강좌/반 목록
  - [ ] 오늘 일정
  - [ ] 출석 체크 빠른 액션
  - [ ] 수강생 목록
  - [ ] **내 급여 현황 (ERP 연동)** ⭐
- [ ] **학원 수강생 대시보드**
  - [ ] 내 수강 강좌 목록
  - [ ] 내 일정
  - [ ] 출석 현황
  - [ ] 공지사항
  - [ ] **내 수강료 결제 내역 (ERP 연동)** ⭐
- [ ] **학원 통계 API 완성**
  - [ ] 수강생 통계 API
  - [ ] 강좌 통계 API
  - [ ] 출석 통계 API
  - [ ] **수익 통계 API (ERP 연동)** ⭐
  - [ ] **강사 급여 통계 API (ERP 연동)** ⭐
  - [ ] **운영비 통계 API (ERP 연동)** ⭐

**참고**: 
- MindGarden 상담소 기능 수준 참고
- `CONSULTATION_ADMIN_WIDGET_LIST.md` 참고
- `WIDGET_ARCHITECTURE.md` 참고
- `ERP_MULTI_TENANT_INTEGRATION_STRATEGY.md` 참고 (ERP 연동 전략)

---

### 📋 P2 - 선택 (서비스 개선)

**예상 시간**: 10주 이상

#### 8. ERP 성능 최적화 (2주) ⭐⭐
**목적**: 시스템 부하 최소화, 실시간 ERP 연동 유지

**작업 내용**:
- [ ] **Week 1: ERP 캐싱 전략 구현**
  - [ ] `ErpStatisticsCacheService` 생성
  - [ ] 통계 데이터 캐싱 (5분 TTL)
  - [ ] 조회 결과 캐싱 (1분 TTL)
  - [ ] 선택적 캐시 무효화
- [ ] **Week 2: 배치와 실시간 연동 조화**
  - [ ] `ErpBatchCoordinator` 생성
  - [ ] 배치 실행 락 메커니즘
  - [ ] 실시간 연동 보호

**참고**: `ERP_PERFORMANCE_OPTIMIZATION_STRATEGY.md` Phase 2-3

---

#### 9. 메타 시스템 Phase 1 완성 (2주) ⭐⭐
**목적**: 기존 컴포넌트 위젯화

**작업 내용**:
- [ ] **Week 1: 기존 대시보드 컴포넌트 위젯화**
  - [ ] AdminDashboard.js → 위젯 기반으로 변환
  - [ ] CommonDashboard.js → 위젯 기반으로 변환
  - [ ] ClientDashboard.js → 위젯 기반으로 변환
- [ ] **Week 2: 기존 섹션 컴포넌트 위젯화**
  - [ ] SummaryPanels → Statistics Widget
  - [ ] RecentActivities → Table Widget
  - [ ] WelcomeSection → Custom Widget
  - [ ] QuickActions → Custom Widget

**참고**: `MASTER_TODO_AND_IMPROVEMENTS.md` 메타 시스템 Phase 1

---

#### 10. ERP 위젯 Phase 1: 회계 관리 위젯 (4주) ⭐⭐
**목적**: ERP 고도화 전략에 맞춰 위젯 구현

**작업 내용**:
- [ ] **Week 1-2: 분개 시스템 위젯**
  - [ ] `JournalEntryWidget` - 분개 목록 및 상세
  - [ ] `JournalEntryLineWidget` - 분개 상세 라인
  - [ ] `JournalEntryValidationWidget` - 분개 검증 결과
- [ ] **Week 3-4: 원장 및 재무제표 위젯**
  - [ ] `LedgerWidget` - 원장 조회
  - [ ] `IncomeStatementWidget` - 손익계산서
  - [ ] `BalanceSheetWidget` - 재무상태표
  - [ ] `CashFlowStatementWidget` - 현금흐름표

**참고**: `ERP_WIDGETIZATION_ALIGNED_WITH_ADVANCEMENT.md` Phase 1

---

#### 11. 표준화 상태 확인 완료 ✅
**상태**: 대부분 완료 (54% 완료, 핵심 Controller 모두 완료)

**확인 결과**:
- ✅ **핵심 Controller 표준화 완료** (55개)
  - `AdminController` ✅
  - `AuthController` ✅
  - `ScheduleController` ✅
  - `PaymentController` ✅
  - `ErpController` ✅ (일부 메서드만 수정 필요)
  - `CommonCodeController` ✅
  - `ConsultationController` ✅
  - `OnboardingController` ✅
  - 기타 핵심 Controller 모두 완료
- ⚠️ **일부 메서드 수정 필요**
  - `ErpController` 일부 메서드: `ResponseEntity<Map>` 직접 반환, try-catch 사용
- ❌ **표준화 미완료 Controller** (약 45개)
  - 대부분 테스트/시스템 Controller (`TestDataController`, `SystemToolsController` 등)
  - 낮은 우선순위로 처리 가능

**결론**: 표준화는 대부분 완료되었으므로 우선순위 낮음. 온보딩 플로우 완성이 최우선.

**참고**: `STANDARDIZATION_STATUS_CHECK.md`

---

#### 12. 기타 장기 작업
- [ ] 메타 시스템 Phase 3-5 (4주)
- [ ] ERP 위젯 Phase 2-6 (15주)
- [ ] 표준화 미완료 Controller 처리 (낮은 우선순위, 점진적 처리)
  - `ErpController` 일부 메서드 수정
  - 테스트/시스템 Controller 표준화 (선택적)
- [ ] QueryDSL 도입 (1주)
- [ ] 성능 모니터링 (선택적)
- [ ] 브랜딩 시스템 구현 (1주)
- [ ] 사용성 강화 및 모바일 앱 준비 (2주)

---

## 🎯 우선순위별 작업 일정 (재조정)

### Month 1 (Week 1-3): 온보딩 플로우 완성 (최우선)

**Week 1: 온보딩 플로우 완전 작동 확인 및 수정**
- Day 1-2: 온보딩 승인 프로세스 검증
- Day 3-4: 관리자 계정 생성 및 역할 할당 확인
- Day 5: 기본 대시보드 생성 및 접근 확인

**Week 2: 온보딩 플로우 문제점 수정**
- Day 1-2: 프로시저 호출 실패 처리
- Day 3: 관리자 계정 생성 실패 처리
- Day 4: 역할 템플릿 적용 실패 처리
- Day 5: 대시보드 생성 실패 처리

**Week 3: 온보딩 플로우 통합 테스트 + PG SDK 테스트**
- Day 1-2: 정상 플로우 테스트
- Day 3: 이메일 중복 처리 테스트
- Day 4: 멀티 테넌트 사용자 테스트
- Day 5: Trinity PG SDK 연동 테스트

---

### Month 2 (Week 4-7): ERP 멀티 테넌트 전환

**Week 4: ERP 엔티티 멀티 테넌트 전환**
- Day 1-5: 모든 ERP 엔티티를 `BaseEntity` 상속

**Week 5: ERP 동적 쿼리 전환**
- Day 1-5: Specification 패턴 도입, 메모리 필터링 제거

**Week 6: ERP 서비스 멀티 테넌트 지원**
- Day 1-5: 모든 ERP 서비스에서 `TenantContextHolder` 사용

**Week 7: ERP 프로시저 멀티 테넌트 지원**
- Day 1-5: 모든 ERP 프로시저에 `tenant_id` 파라미터 추가

---

### Month 2-3 (Week 8-11): 학원 기능 MindGarden 수준 완성 + ERP 연동

**Week 8: 학원 특화 위젯 구현**
- Day 1-2: `AcademyScheduleWidget` 구현
- Day 3-4: `AcademyAttendanceWidget` 구현
- Day 5: `AcademyStatsWidget`, `AcademyStudentWidget` 구현

**Week 9: 학원 관리 기능 완성**
- Day 1-2: 강좌/반 관리 기능 강화
- Day 3: 강사 관리 기능
- Day 4-5: 수강 등록 프로세스 완성 (결제 연동 포함)

**Week 10: 학원 ERP 연동 완성** ⭐
- Day 1-2: 수강료 결제 ERP 연동
  - 수강 등록 시 자동 결제 거래 생성
  - 수강료 수납 처리 → ERP 매출 거래
  - 환불 처리 → ERP 환불 거래
- Day 3: 강사 급여 ERP 연동
  - 강사별 수업 시간 집계
  - 강사 급여 계산 및 지급 → ERP 급여 거래
- Day 4: 학원 운영비 ERP 연동
  - 교재/교구 구매 → ERP 구매 요청
  - 임대료/공과금 → ERP 비용 거래
- Day 5: 학원 ERP 통계 위젯 (`AcademyErpStatsWidget`)

**Week 11: 학원 대시보드 및 통계 완성**
- Day 1-2: 학원 관리자 대시보드 (ERP 통계 포함)
- Day 3: 학원 강사 대시보드 (급여 현황 포함)
- Day 4: 학원 수강생 대시보드 (결제 내역 포함)
- Day 5: 학원 통계 API 완성 (ERP 연동)

---

### Month 3 이후: 서비스 개선 작업

**Week 8-9**: ERP 성능 최적화
**Week 10-11**: 메타 시스템 Phase 1 완성
**Week 12-15**: ERP 위젯 Phase 1
**Week 16**: 표준화 미완료 Controller 점진적 처리 (낮은 우선순위)

---

## 📊 작업 의존성 및 순서 (재조정)

### 필수 순서 (의존성)

1. **온보딩 플로우 완성** → **모든 후속 작업**
   - 이유: 온보딩이 작동해야 테넌트가 생성되고, 이후 모든 작업이 의미 있음

2. **온보딩 플로우 검증** → **온보딩 플로우 문제점 수정**
   - 이유: 검증 중 발견된 문제를 수정

3. **온보딩 플로우 문제점 수정** → **온보딩 플로우 통합 테스트**
   - 이유: 문제 수정 후 통합 테스트

4. **온보딩 플로우 완성** → **ERP 멀티 테넌트 전환**
   - 이유: 온보딩이 완성된 후 ERP 개선 작업 진행

5. **온보딩 플로우 완성** → **학원 기능 MindGarden 수준 완성**
   - 이유: 온보딩이 완성된 후 학원 기능 완성 작업 진행

6. **ERP 멀티 테넌트 전환** → **학원 ERP 연동**
   - 이유: ERP 멀티 테넌트 전환이 완료되어야 학원 ERP 연동 가능

### 병렬 가능 작업

- **온보딩 플로우 통합 테스트** ↔ **Trinity PG SDK 연동 테스트**
- **ERP 멀티 테넌트 전환** ↔ **기존 ERP 컴포넌트 formatUtils 적용**
- **학원 기능 완성** ↔ **ERP 멀티 테넌트 전환** (서로 독립적)

---

## 🎯 핵심 원칙 (재조정)

### 1. 온보딩 플로우 완성이 최우선 ⭐⭐⭐⭐⭐
- 온보딩에서 등록하면 실제 코어솔루션에서 사용 가능한 상태까지 완성
- 모든 후속 작업은 온보딩 플로우가 완성된 후 진행

### 2. 실시간 ERP 연동 유지 (시스템의 강점)
- 실시간 연동은 계속 진행
- 배치와 충돌하지 않도록 최소한의 락만 사용
- PL/SQL 프로시저 우선 사용

### 3. 시스템 부하 최소화
- 동적 쿼리로 메모리 필터링 제거
- 인덱스 최적화
- 캐싱 활용

### 4. 멀티 테넌트 지원
- 모든 입점사와 ERP 연동 가능
- 테넌트별 데이터 완전 격리

### 5. 점진적 전환
- 기존 기능 유지하면서 단계적으로 전환
- 하위 호환성 보장

### 6. 메타 시스템 기반 자동화
- 데이터로 프로그래밍하는 아키텍처
- 코드 수정 없이 DB 설정만으로 시스템 동작

---

## 📈 진행 상황 추적 (재조정)

### P0 작업 진행률 (최우선)
```
온보딩 플로우 완전 작동 확인:  ░░░░░░░░░░░░░░░░░░░░   0% ⏳
온보딩 플로우 문제점 수정:     ░░░░░░░░░░░░░░░░░░░░   0% ⏳
온보딩 플로우 통합 테스트:     ░░░░░░░░░░░░░░░░░░░░   0% ⏳
Trinity PG SDK 테스트:        ░░░░░░░░░░░░░░░░░░░░   0% ⏳
```

### P1 작업 진행률
```
ERP 멀티 테넌트 전환:          ░░░░░░░░░░░░░░░░░░░░   0% ⏳
formatUtils 적용:             ░░░░░░░░░░░░░░░░░░░░   0% ⏳
학원 기능 MindGarden 수준 완성: ░░░░░░░░░░░░░░░░░░░░   0% ⏳
```

### P2 작업 진행률
```
ERP 성능 최적화:              ░░░░░░░░░░░░░░░░░░░░   0% ⏳
메타 시스템 Phase 1:          ████████░░░░░░░░░░░░  40% 🚧
ERP 위젯 Phase 1:             ░░░░░░░░░░░░░░░░░░░░   0% ⏳
표준화 상태:                  ████████████████░░░░  54% ✅ (핵심 Controller 완료)
```

---

## 🔗 관련 문서

### 오늘 날짜 폴더 (2025-11-22)
- [ERP 멀티 테넌트 연동 전략](./ERP_MULTI_TENANT_INTEGRATION_STRATEGY.md)
- [ERP 동적 쿼리 사용 여부 판단](./ERP_DYNAMIC_QUERY_DECISION.md)
- [ERP 성능 최적화 전략](./ERP_PERFORMANCE_OPTIMIZATION_STRATEGY.md)
- [ERP 위젯화 계획](./ERP_WIDGETIZATION_ALIGNED_WITH_ADVANCEMENT.md)
- [종합 TODO 리스트](./COMPREHENSIVE_TODO_LIST.md)
- [미개발 항목](./PENDING_DEVELOPMENT_ITEMS.md)

### 루트 문서
- [마스터 TODO](../MASTER_TODO_AND_IMPROVEMENTS.md)
- [온보딩 관리자 계정 프로세스](../ONBOARDING_ADMIN_ACCOUNT_PROCESS.md)
- [테넌트 대시보드 관리 시스템](../TENANT_DASHBOARD_MANAGEMENT_SYSTEM.md)
- [비즈니스 카테고리 역할 시스템](../BUSINESS_CATEGORY_ROLE_SYSTEM.md)
- [ERP 고도화 계획](../ERP_ADVANCEMENT_PLAN.md)

### 오늘 날짜 폴더 (2025-11-22)
- [표준화 상태 확인](./STANDARDIZATION_STATUS_CHECK.md) ⭐

---

## 📝 주간 진행 계획 (권장) - 재조정

### Week 1 (즉시 시작): 온보딩 플로우 완전 작동 확인

**Day 1-2: 온보딩 승인 프로세스 검증**
- [ ] Trinity 홈페이지에서 온보딩 요청 생성
- [ ] `ProcessOnboardingApproval` 프로시저 호출 확인
- [ ] 테넌트 생성 확인
- [ ] 업종 카테고리 매핑 확인
- [ ] 역할 템플릿 적용 확인

**Day 3-4: 관리자 계정 생성 및 역할 할당**
- [ ] `createTenantAdminAccount` 메서드 동작 확인
- [ ] 관리자 계정으로 로그인 가능한지 확인
- [ ] `UserRoleAssignment` 생성 확인

**Day 5: 기본 대시보드 생성 및 접근 확인**
- [ ] 역할별 기본 대시보드 자동 생성 확인
- [ ] 관리자 로그인 후 대시보드 접근 확인
- [ ] 404 오류 없이 접근 가능한지 확인

---

## 🎯 성공 지표 (재조정)

### Week 1-3 목표 (최우선)
- ✅ 온보딩 요청 생성 → 승인 → 테넌트 생성 → 관리자 계정 생성 → 로그인 → 대시보드 접근까지 완전히 작동
- ✅ 모든 에러 케이스 처리 완료
- ✅ 통합 테스트 완료
- ✅ Trinity PG SDK 연동 테스트 완료

### Month 2-3 목표
- ✅ ERP 멀티 테넌트 전환 완료
- ✅ 기존 ERP 컴포넌트 formatUtils 적용 완료
- ✅ 학원 기능 MindGarden 수준 완성 완료
- ✅ 학원 ERP 연동 완료 (수강료, 강사 급여, 운영비)

### Month 3 이후 목표
- ✅ ERP 성능 최적화 완료
- ✅ 메타 시스템 Phase 1 완성
- ✅ ERP 위젯 Phase 1 시작
- ✅ 표준화 미완료 Controller 점진적 처리 (낮은 우선순위)

---

**마지막 업데이트**: 2025-11-22 (우선순위 재조정: 온보딩 플로우 완성이 최우선)  
**다음 리뷰 예정일**: 주간 회의 (매주 금요일)
