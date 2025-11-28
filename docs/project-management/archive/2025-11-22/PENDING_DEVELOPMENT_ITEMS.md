# 코어솔루션 미개발 항목 정리 및 우선순위

**작성일**: 2025-11-22  
**최종 업데이트**: 2025-11-22 (메타 시스템 도입 시작)  
**상태**: 활성 관리 중  
**소스 확인 완료**: ✅

---

## 📊 전체 진행 상황 요약

### 완료된 작업 ✅

#### 백엔드
- **표준화 Phase 0-6**: 100% 완료
- **온보딩 시스템 개선**: 완료 ✅ (2025-11-21)
  - ✅ 이메일 중복 확인 로직 개선 (멀티 테넌트 지원)
  - ✅ 테넌트 생성 시점에만 중복 체크하도록 수정
  - ✅ 활성 테넌트(`status = 'ACTIVE'`)만 중복으로 판단
  - ✅ 온보딩 승인 시 관리자 계정 자동 생성 로직 추가
  - ✅ `createTenantAdminAccount` 메서드 구현
- **멀티 테넌트 권한 체크 개선**: 완료 ✅ (2025-11-21)
  - ✅ `getAccessibleTenants` 이메일 기반으로 모든 테넌트 조회하도록 수정
  - ✅ `hasAccessToTenantByEmail` 메서드 추가 (이메일 기반 권한 확인)
  - ✅ `getAccessibleTenantsByEmail` 메서드 추가
  - ✅ 테넌트 전환 시 이메일 기반 권한 확인 추가

#### 프론트엔드
- **frontend-ops (Next.js)**: 대부분 완료
- **frontend-trinity (Next.js)**: 기본 구조 완료
  - ✅ 온보딩 등록 페이지 구현 완료
  - ✅ 이메일 인증 기능 구현 완료
  - ✅ 이메일 중복 확인 기능 구현 완료
  - ✅ 인증 코드 타이머 기능 구현 완료

---

## 🔥 즉시 조치 필요 (P0 - 높은 우선순위)

### 1. 프론트엔드: Trinity 홈페이지 PG SDK 연동 ⭐
**상태**: 온보딩 페이지는 구현 완료, PG SDK 연동 필요  
**예상 시간**: 2-3일  
**참고**: `MINDGARDEN_BASED_INTEGRATION_PLAN.md` Phase 5

**체크리스트**:
- [x] 온보딩 등록 페이지 (`frontend-trinity/app/onboarding/page.tsx`) - **구현 완료** ✅
  - [x] 테넌트 정보 입력 폼 (회사명, 업종, 연락처 등) ✅
  - [x] 요금제 선택 UI (실시간 가격 정보 표시) ✅
  - [x] 이메일 인증 기능 ✅
  - [x] 이메일 중복 확인 기능 ✅
  - [x] 관리자 비밀번호 입력 및 확인 ✅
  - [x] 결제 수단 등록 UI (테스트 모드로 구현됨) ✅
  - [x] 온보딩 요청 API 연동 ✅
  - [x] 등록 완료 페이지 및 상태 조회 링크 ✅
- [ ] 실제 PG SDK 연동 (토스페이먼츠)
  - [x] 토스페이먼츠 SDK npm 패키지 설치 (`@tosspayments/tosspayments-sdk`) ✅
  - [x] `paymentGateway.ts` 유틸리티 구현 ✅
  - [x] 카드 등록 기능 구현 (`requestBillingAuth`) ✅
  - [x] 즉시 결제 기능 구현 (`requestPayment`) ✅
  - [x] 콜백 페이지 구현 (`/onboarding/callback`) ✅
  - [ ] 실제 테스트 완료 (테스트 카드로 성공 확인)
  - [ ] 에러 처리 개선 (필요시)
- [ ] 입점사 PG사 등록 단계 (추후 구현)

**현재 상태**:
- ✅ 토스페이먼츠 SDK 연동 구조 완료
- ✅ 카드 등록 및 즉시 결제 옵션 제공
- ⚠️ 실제 테스트 환경에서 검증 필요

---

### 2. 백엔드: 온보딩 승인 시 관리자 계정 생성 검증 ⭐
**상태**: 구현 완료, 테스트 필요  
**예상 시간**: 0.5일  
**참고**: `ONBOARDING_ADMIN_ACCOUNT_PROCESS.md`

**체크리스트**:
- [x] `createTenantAdminAccount` 메서드 구현 ✅ (2025-11-21)
  - [x] `checklistJson`에서 `adminPassword` 추출 ✅
  - [x] 해당 테넌트에 ADMIN 계정이 있는지 확인 ✅
  - [x] ADMIN 역할의 사용자 계정 생성 ✅
  - [x] `tenant_id`와 함께 저장 ✅
- [ ] 실제 온보딩 승인 플로우 테스트
  - [ ] 온보딩 요청 생성 (adminPassword 포함)
  - [ ] 온보딩 승인 처리
  - [ ] 관리자 계정 생성 확인
  - [ ] 관리자 계정으로 로그인 테스트
- [ ] 관리자 계정 생성 실패 시 처리 확인
  - [ ] 에러 로깅 확인
  - [ ] 온보딩 프로세스 중단 여부 확인 (현재는 경고만)

**참고 파일**:
- `src/main/java/com/coresolution/core/service/impl/OnboardingServiceImpl.java`
- `src/main/java/com/coresolution/core/controller/dto/OnboardingCreateRequest.java`

---

### 3. 백엔드: 이메일 중복 확인 로직 검증 ⭐
**상태**: 구현 완료, 테스트 필요  
**예상 시간**: 0.5일

**체크리스트**:
- [x] `isEmailDuplicate` 로직 수정 ✅ (2025-11-21)
  - [x] 온보딩 요청 단계에서는 PENDING 상태의 중복 요청만 체크 ✅
  - [x] 테넌트 생성 시점에만 실제 테넌트 중복 체크 ✅
- [x] `isEmailDuplicateForTenantCreation` 메서드 추가 ✅ (2025-11-21)
  - [x] 활성 테넌트(`status = 'ACTIVE'`)만 중복으로 판단 ✅
  - [x] `existsActiveByContactEmail` 메서드 사용 ✅
- [ ] 실제 테스트
  - [ ] 같은 이메일로 여러 테넌트 온보딩 요청 생성 (PENDING 상태)
  - [ ] 첫 번째 요청 승인 후 두 번째 요청 승인 시도 (중복 체크 확인)
  - [ ] 비활성 테넌트(`status = 'SUSPENDED'`)는 중복으로 판단하지 않는지 확인

**참고 파일**:
- `src/main/java/com/coresolution/core/service/impl/OnboardingServiceImpl.java`
- `src/main/java/com/coresolution/core/repository/TenantRepository.java`

---

### 4. 백엔드: 멀티 테넌트 권한 체크 검증 ⭐
**상태**: 구현 완료, 테스트 필요  
**예상 시간**: 0.5일

**체크리스트**:
- [x] `getAccessibleTenants` 이메일 기반으로 수정 ✅ (2025-11-21)
  - [x] 같은 이메일의 모든 User 조회 (`findAllByEmail`) ✅
  - [x] 모든 테넌트 접근 권한 확인 ✅
- [x] `hasAccessToTenantByEmail` 메서드 추가 ✅ (2025-11-21)
- [x] `getAccessibleTenantsByEmail` 메서드 추가 ✅ (2025-11-21)
- [x] 테넌트 전환 시 이메일 기반 권한 확인 추가 ✅ (2025-11-21)
- [ ] 실제 테스트
  - [ ] 같은 이메일로 여러 테넌트에 계정 생성 (테넌트 A: ADMIN, 테넌트 B: CLIENT)
  - [ ] 로그인 시 멀티 테넌트 사용자 감지 확인
  - [ ] 테넌트 선택 화면 표시 확인
  - [ ] 각 테넌트별로 다른 역할로 로그인 확인
  - [ ] 테넌트 전환 시 권한 확인

**참고 파일**:
- `src/main/java/com/coresolution/consultation/service/impl/MultiTenantUserServiceImpl.java`
- `src/main/java/com/coresolution/consultation/controller/MultiTenantController.java`

---

## 📋 중간 우선순위 (P1)

### 5. 동적 대시보드 Phase 3: 테스트 및 검증
**상태**: 대기 중 (시스템 재부팅 필요)  
**예상 시간**: 1일  
**참고**: `MASTER_TODO_AND_IMPROVEMENTS.md`

**체크리스트**:
- [ ] 시스템 재부팅 후 실제 환경 테스트
- [ ] 테스트 체크리스트 사용 (`DYNAMIC_DASHBOARD_TEST_CHECKLIST.md`)
- [ ] 모든 시나리오 검증
- [ ] 에러 케이스 확인

---

### 6. 표준화 Phase 1: Controller 표준화 (진행 중)
**상태**: 진행 중  
**예상 시간**: 2-3주  
**참고**: `CORESOLUTION_STANDARDIZATION_PLAN.md`

**체크리스트**:
- [x] TenantRoleController 표준화 ✅
- [x] UserRoleAssignmentController 표준화 ✅
- [x] TenantDashboardController 표준화 ✅
- [x] BillingController 표준화 ✅
- [x] OnboardingController 표준화 ✅
- [x] BusinessCategoryController 표준화 ✅
- [ ] 다른 Controller 표준화 (ErdController, SubscriptionController 등)

---

### 7. Trinity 홈페이지 추가 기능 (Phase 5)
**상태**: 기본 구조만 완료, 추가 기능 미구현  
**예상 시간**: 1-2주  
**참고**: `MINDGARDEN_BASED_INTEGRATION_PLAN.md` Phase 5

**체크리스트**:

#### Week 1: Trinity 홈페이지 추가 기능
- [ ] DNS 및 SSL 설정 (`dev.e-trinity.co.kr` 개발 환경)
- [x] 회사 소개, 서비스 소개 페이지 완성 ✅
- [x] 반응형 디자인 완성 (모바일/태블릿/데스크탑) ✅
- [x] CoreSolution 브랜딩 적용 ✅

#### Week 2: 결제 시스템 및 통합
- [x] 결제 수단 토큰 저장 API ✅ (이미 구현됨)
- [x] 구독 생성 API ✅ (이미 구현됨)
- [x] BillingController 표준화 ✅
- [ ] PG 연동 (토스페이먼츠 또는 Stripe, 토큰화 기반)
  - [ ] 실제 PG SDK 연동 (현재는 테스트 모드)
- [ ] 결제 프로세스 구현
- [ ] 실시간 과금 연동
- [ ] 내부 시스템 선택적 인증 및 ERP 자동 구성 연계

---

## 📝 낮은 우선순위 (P2)

### 8. 표준화 Phase 3-6
**상태**: 미시작  
**예상 시간**: 3-4주  
**참고**: `CORESOLUTION_STANDARDIZATION_PLAN.md`

**체크리스트**:
- [ ] Phase 3: 권한 관리 표준화 (1-2주)
- [ ] Phase 4: API 경로 표준화
- [ ] Phase 5: 서비스 레이어 표준화
- [ ] Phase 6: 로깅 표준화

---

### 9. 동적 대시보드 Phase 4: 성능 최적화
**상태**: 대기 중  
**예상 시간**: 1주  
**참고**: `MASTER_TODO_AND_IMPROVEMENTS.md`

**체크리스트**:
- [ ] 대시보드 정보 캐싱
- [ ] 컴포넌트 지연 로딩

---

### 10. Phase 6: 권한 확장 시스템 특화 (2주) ⭐
**상태**: 미시작  
**예상 시간**: 2주  
**참고**: `MINDGARDEN_BASED_INTEGRATION_PLAN.md` Phase 6

**체크리스트**:
- [ ] 업종별 권한 템플릿 확장
- [ ] ABAC 정책 확장
- [ ] 권한 관리 UI/UX 개선
- [ ] 권한 감사 및 로깅

---

### 11. Phase 7: ERP 시스템 특화 및 고도화 ⭐ 핵심 특화 영역
**상태**: 미시작  
**예상 시간**: 19주 (Phase 1-6)  
**참고**: 
- `ERP_ADVANCEMENT_PLAN.md` - 전체 ERP 고도화 계획
- `ERP_CURRENT_STATUS_AND_ADVANCEMENT.md` - 현재 상태 분석 및 고도화 계획
- `ERP_PROCEDURE_BASED_ADVANCEMENT.md` - 프로시저 기반 ERP 고도화 계획
- `MINDGARDEN_BASED_INTEGRATION_PLAN.md` Phase 7

**현재 ERP 상태**:
- ✅ 재무 관리 (FinancialTransaction) - 기본 거래 기록, 통계
- ✅ 구매 관리 (PurchaseRequest, PurchaseOrder) - 구매 요청/주문, 승인 프로세스
- ✅ 예산 관리 (Budget) - 예산 생성/수정, 사용 추적
- ✅ 재고 관리 (Item) - 재고 현황, 입출고 관리
- ✅ 급여 관리 (SalaryCalculation) - PL/SQL 기반 급여 계산
- ✅ 회계 관리 (AccountingEntry) - 기본 회계 엔트리만 존재
- ❌ 완전한 분개 시스템 (차변/대변 검증, 분개 상세)
- ❌ 원장 시스템
- ❌ 재무제표 생성 (손익계산서, 재무상태표, 현금흐름표)
- ❌ 세무 관리 (부가세, 전자세금계산서, 원천징수)
- ❌ 인사 관리 (직원 정보, 근태, 휴가)
- ❌ 정산 자동화 (업종별 정산 규칙, 자동 계산)
- ❌ 외부 시스템 연동 (회계 시스템, 세무 시스템, 은행)

**체크리스트**: (상세 내용은 원본 문서 참조)
- [ ] Phase 1: 회계 관리 고도화 (4주)
- [ ] Phase 2: 세무 관리 시스템 (3주)
- [ ] Phase 3: 인사 관리 시스템 (4주)
- [ ] Phase 4: 정산 관리 고도화 (3주)
- [ ] Phase 5: 리포트 및 분석 (2주)
- [ ] Phase 6: 외부 시스템 연동 (3주)

---

### 12. Phase 8: 브랜딩 시스템 구현 (1주)
**상태**: 미시작  
**예상 시간**: 1주  
**참고**: `MINDGARDEN_BASED_INTEGRATION_PLAN.md` Phase 8

**체크리스트**:
- [ ] 로고 업로드 및 관리 API
- [ ] 상호(회사명) 관리
- [ ] 브랜딩 정보 저장 (branding_json)
- [ ] 헤더에 로고 및 상호 표시 (모든 페이지)
- [ ] 대시보드에 로고 및 상호 표시
- [ ] Fallback 로직 구현 (코어시스템 로고/상호로 대체)
- [ ] 브랜딩 커스터마이징 UI

---

### 13. Phase 9: 사용성 강화 및 모바일 앱 준비 (2주)
**상태**: 미시작  
**예상 시간**: 2주  
**참고**: `MINDGARDEN_BASED_INTEGRATION_PLAN.md` Phase 9

**체크리스트**:
- [ ] 사용성 테스트 (실제 소상공인 대상)
- [ ] 자동화 검증 (입력 최소화 확인)
- [ ] 모바일 반응형 UI 완성
- [ ] 모바일 앱 개발 환경 구축
- [ ] 전체 시스템 통합 테스트
- [ ] 성능 벤치마크
- [ ] 문서화

---

## 📊 우선순위 매트릭스

| 우선순위 | 항목 | 예상 시간 | 상태 | 비고 |
|---------|------|----------|------|------|
| **P0** | 1. Trinity 홈페이지 PG SDK 연동 | 2-3일 | 🚧 진행 필요 | SDK 구조 완료, 테스트 필요 |
| **P0** | 2. 온보딩 승인 시 관리자 계정 생성 검증 | 0.5일 | 🚧 테스트 필요 | 구현 완료 |
| **P0** | 3. 이메일 중복 확인 로직 검증 | 0.5일 | 🚧 테스트 필요 | 구현 완료 |
| **P0** | 4. 멀티 테넌트 권한 체크 검증 | 0.5일 | 🚧 테스트 필요 | 구현 완료 |
| **P1** | 5. 동적 대시보드 Phase 3: 테스트 및 검증 | 1일 | ⏳ 대기 중 | 시스템 재부팅 필요 |
| **P1** | 6. Controller 표준화 (진행 중) | 2-3주 | 🚧 진행 중 | 일부 완료 |
| **P1** | 7. Trinity 홈페이지 추가 기능 | 1-2주 | ⏳ 대기 중 | 기본 구조만 완료 |
| **P2** | 8. 표준화 Phase 3-6 | 3-4주 | ⏳ 대기 중 | |
| **P2** | 9. 동적 대시보드 Phase 4: 성능 최적화 | 1주 | ⏳ 대기 중 | |
| **P2** | 10. 권한 확장 시스템 특화 | 2주 | ⏳ 대기 중 | |
| **P2** | 11. ERP 시스템 특화 및 고도화 | 19주 | ⏳ 대기 중 | Phase 1-6 상세 계획 있음 |
| **P2** | 12. 브랜딩 시스템 구현 | 1주 | ⏳ 대기 중 | |
| **P2** | 13. 사용성 강화 및 모바일 앱 준비 | 2주 | ⏳ 대기 중 | |

---

## 🎯 다음 주 작업 계획 (권장)

### Week 1 (즉시 시작)
1. **Trinity 홈페이지 PG SDK 연동 테스트** (2-3일)
   - 실제 테스트 카드로 카드 등록 테스트
   - 즉시 결제 테스트
   - 에러 처리 확인

2. **온보딩 시스템 검증** (1일)
   - 온보딩 승인 시 관리자 계정 생성 확인
   - 이메일 중복 확인 로직 검증
   - 멀티 테넌트 권한 체크 검증

### Week 2
3. **동적 대시보드 Phase 3: 테스트 및 검증** (1일)
4. **Controller 표준화 계속** (진행 중)

---

## 📌 중요 참고사항

### 작업 원칙
1. **하위 호환성 유지**: 모든 변경은 기존 기능과 호환되어야 함
2. **점진적 마이그레이션**: 한 번에 모든 것을 변경하지 않음
3. **문서화 필수**: 모든 표준 규칙과 변경사항 문서화
4. **테스트 우선**: 변경 전후 테스트 필수

### 우선순위 결정 기준
1. **보안 관련**: 즉시 조치 (P0)
2. **API 일관성**: 높은 우선순위 (P0-P1)
3. **개발자 경험**: 중간 우선순위 (P1-P2)
4. **운영 효율성**: 낮은 우선순위 (P2-P3)

---

**마지막 업데이트**: 2025-11-21  
**소스 확인 완료**: ✅  
**다음 리뷰 예정일**: 2025-11-28 (주간 회의)

