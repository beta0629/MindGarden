# 코어솔루션 개발 체크리스트

**작성일**: 2025-11-23  
**최종 업데이트**: 2025-11-23  
**상태**: 활성 관리 중

---

## ⚠️ 중요: 공통 코드 등록 필요

온보딩 시스템에서 사용하는 공통 코드를 데이터베이스에 등록해야 합니다.

**마이그레이션 파일**: `V35__insert_onboarding_common_codes.sql`

**등록할 코드 그룹**:
- [ ] RISK_LEVEL (위험도) - LOW, MEDIUM, HIGH
- [ ] ONBOARDING_STATUS (온보딩 상태) - PENDING, IN_REVIEW, APPROVED, REJECTED, ON_HOLD

**실행 방법**:
1. Spring Boot 애플리케이션 재시작 (Flyway 자동 실행)
2. 또는 수동으로 SQL 실행

**확인 방법**:
```sql
SELECT * FROM common_codes WHERE code_group IN ('RISK_LEVEL', 'ONBOARDING_STATUS');
```

**주의사항**:
- 이 코드들은 CoreSolution 공통 코드이므로 `tenant_id = NULL`로 등록됩니다.
- 코드가 등록되지 않으면 프론트엔드에서 드롭다운이 비어있거나 오류가 발생할 수 있습니다.
- 개발 환경에서 먼저 테스트 후 프로덕션에 적용하세요.

---

## 🔥 P0 - 즉시 조치 필요 (높은 우선순위)

### 1. 프론트엔드: Trinity 홈페이지 PG SDK 연동 테스트
**예상 시간**: 2-3일  
**담당자**: AI Assistant  
**완료일**: [ ]

#### 체크리스트
- [x] 온보딩 등록 페이지 구현 완료 ✅
  - [x] 테넌트 정보 입력 폼 ✅
  - [x] 요금제 선택 UI ✅
  - [x] 이메일 인증 기능 ✅
  - [x] 이메일 중복 확인 기능 ✅
  - [x] 관리자 비밀번호 입력 및 확인 ✅
  - [x] 결제 수단 등록 UI ✅
- [x] 토스페이먼츠 SDK 연동 구조 완료 ✅
  - [x] `@tosspayments/tosspayments-sdk` npm 패키지 설치 ✅
  - [x] `paymentGateway.ts` 유틸리티 구현 ✅
  - [x] 카드 등록 기능 구현 (`requestBillingAuth`) ✅
  - [x] 즉시 결제 기능 구현 (`requestPayment`) ✅
  - [x] 콜백 페이지 구현 (`/onboarding/callback`) ✅
- [ ] 실제 테스트 완료
  - [ ] 테스트 카드로 카드 등록 테스트
  - [ ] 즉시 결제 테스트
  - [ ] 에러 처리 확인
  - [ ] 콜백 페이지 동작 확인

**참고 파일**:
- `frontend-trinity/app/onboarding/page.tsx`
- `frontend-trinity/app/onboarding/callback/page.tsx`
- `frontend-trinity/utils/paymentGateway.ts`

---

### 2. 백엔드: 온보딩 승인 시 관리자 계정 생성 검증
**예상 시간**: 0.5일  
**담당자**: AI Assistant  
**완료일**: [ ]

#### 체크리스트
- [x] `createTenantAdminAccount` 메서드 구현 ✅ (2025-11-21)
  - [x] `checklistJson`에서 `adminPassword` 추출 ✅
  - [x] 해당 테넌트에 ADMIN 계정이 있는지 확인 ✅
  - [x] ADMIN 역할의 사용자 계정 생성 ✅
  - [x] `tenant_id`와 함께 저장 ✅
- [ ] 실제 온보딩 승인 플로우 테스트
  - [ ] 온보딩 요청 생성 (adminPassword 포함)
  - [ ] 온보딩 승인 처리
  - [ ] 관리자 계정 생성 확인 (users 테이블 확인)
  - [ ] 관리자 계정으로 로그인 테스트
- [ ] 관리자 계정 생성 실패 시 처리 확인
  - [ ] 에러 로깅 확인
  - [ ] 온보딩 프로세스 중단 여부 확인 (현재는 경고만)

**참고 파일**:
- `src/main/java/com/coresolution/core/service/impl/OnboardingServiceImpl.java`
- `src/main/java/com/coresolution/core/controller/dto/OnboardingCreateRequest.java`

---

### 3. 백엔드: 이메일 중복 확인 로직 검증
**예상 시간**: 0.5일  
**담당자**: AI Assistant  
**완료일**: [ ]

#### 체크리스트
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

### 4. 백엔드: 멀티 테넌트 권한 체크 검증
**예상 시간**: 0.5일  
**담당자**: AI Assistant  
**완료일**: [ ]

#### 체크리스트
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

## 📋 P1 - 중간 우선순위

### 5. 동적 대시보드 Phase 3: 테스트 및 검증
**예상 시간**: 1일  
**담당자**: [ ]  
**완료일**: [ ]

#### 체크리스트
- [ ] 시스템 재부팅
- [ ] 테스트 체크리스트 사용
  - [ ] `DYNAMIC_DASHBOARD_TEST_CHECKLIST.md` 참조
- [ ] 모든 시나리오 검증
  - [ ] 대시보드 생성
  - [ ] 대시보드 수정
  - [ ] 대시보드 삭제
  - [ ] 역할별 대시보드 조회
- [ ] 에러 케이스 확인
  - [ ] 권한 없는 사용자 접근
  - [ ] 존재하지 않는 대시보드 조회
  - [ ] 잘못된 데이터 입력

---

### 6. 표준화 Phase 1: Controller 표준화
**예상 시간**: 2-3주  
**담당자**: AI Assistant  
**완료일**: [ ]

#### 체크리스트
- [x] TenantRoleController 표준화 ✅
- [x] UserRoleAssignmentController 표준화 ✅
- [x] TenantDashboardController 표준화 ✅
- [x] BillingController 표준화 ✅
- [x] OnboardingController 표준화 ✅
- [x] BusinessCategoryController 표준화 ✅
- [x] 표준화 상태 확인 완료 ✅ (2025-11-22)
  - [x] 핵심 Controller 55개 표준화 완료 확인
  - [x] 표준화 진행률 54% 확인
- [ ] 표준화 미완료 Controller 점진적 처리 (낮은 우선순위)
  - [ ] ErpController 일부 메서드 수정
  - [ ] 테스트/시스템 Controller 표준화 (선택적)

---

### 7. Trinity 홈페이지 추가 기능 (Phase 5)
**예상 시간**: 1-2주  
**담당자**: [ ]  
**완료일**: [ ]

#### Week 1 체크리스트
- [ ] DNS 및 SSL 설정
  - [ ] `dev.e-trinity.co.kr` 개발 환경 설정
- [x] 회사 소개 페이지 ✅
- [x] 서비스 소개 페이지 ✅
- [x] 반응형 디자인 완성 ✅
- [x] CoreSolution 브랜딩 적용 ✅

#### Week 2 체크리스트
- [x] 결제 수단 토큰 저장 API ✅ (이미 구현됨)
- [x] 구독 생성 API ✅ (이미 구현됨)
- [x] BillingController 표준화 ✅
- [ ] PG 연동
  - [ ] 토스페이먼츠 또는 Stripe 선택
  - [ ] 실제 PG SDK 연동 (현재는 테스트 모드)
  - [ ] 토큰화 기반 구현
- [ ] 결제 프로세스 구현
- [ ] 실시간 과금 연동
- [ ] 내부 시스템 선택적 인증 및 ERP 자동 구성 연계

---

## 📝 P2 - 낮은 우선순위

### 8. 표준화 Phase 3-6
**예상 시간**: 3-4주  
**담당자**: [ ]  
**완료일**: [ ]

#### Phase 3: 권한 관리 표준화 (1-2주)
- [ ] DynamicPermissionService 표준화
- [ ] SecurityUtils, PermissionCheckUtils 통합
- [ ] 도메인별 권한 서비스 표준화

#### Phase 4: API 경로 표준화
- [ ] API 경로 규칙 정의
- [ ] 기존 API 경로 마이그레이션

#### Phase 5: 서비스 레이어 표준화
- [ ] 서비스 인터페이스 표준화
- [ ] 서비스 구현체 표준화

#### Phase 6: 로깅 표준화
- [ ] 로깅 규칙 정의
- [ ] 기존 로깅 마이그레이션

---

### 9. 동적 대시보드 Phase 4: 성능 최적화
**예상 시간**: 1주  
**담당자**: [ ]  
**완료일**: [ ]

#### 체크리스트
- [ ] 대시보드 정보 캐싱
  - [ ] Redis 또는 메모리 캐시 적용
  - [ ] 캐시 무효화 전략 수립
- [ ] 컴포넌트 지연 로딩
  - [ ] React.lazy 적용
  - [ ] 코드 스플리팅

---

### 10. Phase 6: 권한 확장 시스템 특화
**예상 시간**: 2주  
**담당자**: [ ]  
**완료일**: [ ]

#### 체크리스트
- [ ] 업종별 권한 템플릿 확장
- [ ] ABAC 정책 확장
- [ ] 권한 관리 UI/UX 개선
- [ ] 권한 감사 및 로깅

---

### 11. Phase 7: ERP 시스템 특화 및 고도화 ⭐ 핵심 특화 영역
**예상 시간**: 19주 (Phase 1-6)  
**담당자**: [ ]  
**완료일**: [ ]  
**참고**: 
- `ERP_ADVANCEMENT_PLAN.md` - 전체 ERP 고도화 계획
- `ERP_CURRENT_STATUS_AND_ADVANCEMENT.md` - 현재 상태 분석 및 고도화 계획
- `ERP_PROCEDURE_BASED_ADVANCEMENT.md` - 프로시저 기반 ERP 고도화 계획
- `MINDGARDEN_BASED_INTEGRATION_PLAN.md` Phase 7

#### Phase 1: 회계 관리 고도화 (4주)
**Week 1-2: 계정과목 및 분개 시스템**
- [ ] 계정과목 마스터 관리
- [ ] 분개 (Journal Entry) 시스템
- [ ] PL/SQL 프로시저 작성

**Week 3-4: 원장 및 재무제표**
- [ ] 원장 (Ledger) 시스템
- [ ] 재무제표 생성
- [ ] 결산 처리

#### Phase 2: 세무 관리 시스템 (3주)
- [ ] 부가세 관리
- [ ] 전자세금계산서
- [ ] 원천징수 및 연말정산

#### Phase 3: 인사 관리 시스템 (4주)
- [ ] 직원 관리
- [ ] 급여 관리

#### Phase 4: 정산 관리 고도화 (3주)
- [ ] 업종별 정산 자동화
- [ ] 정산 계산 엔진
- [ ] 정산 리포트 및 승인

#### Phase 5: 리포트 및 분석 (2주)
- [ ] 재무 리포트
- [ ] 분석 대시보드

#### Phase 6: 외부 시스템 연동 (3주)
- [ ] 회계 시스템 연동
- [ ] 세무 시스템 연동
- [ ] 은행 연동

#### 공통 작업
- [ ] ERP 서비스 BaseTenantService 패턴 적용
- [ ] BaseProcedureService 생성 (프로시저 호출 표준화)
- [ ] Java 서비스 레이어 구조 개선
- [ ] ERP 통합 테스트
- [ ] ERP 대시보드 및 리포트 UI

---

### 12. Phase 8: 브랜딩 시스템 구현
**예상 시간**: 1주  
**담당자**: [ ]  
**완료일**: [ ]

#### 체크리스트
- [ ] 로고 업로드 및 관리 API
- [ ] 상호(회사명) 관리
- [ ] 브랜딩 정보 저장 (branding_json)
- [ ] 헤더에 로고 및 상호 표시 (모든 페이지)
- [ ] 대시보드에 로고 및 상호 표시
- [ ] Fallback 로직 구현 (코어시스템 로고/상호로 대체)
- [ ] 브랜딩 커스터마이징 UI

---

### 13. Phase 9: 사용성 강화 및 모바일 앱 준비
**예상 시간**: 2주  
**담당자**: [ ]  
**완료일**: [ ]

#### 체크리스트
- [ ] 사용성 테스트 (실제 소상공인 대상)
- [ ] 자동화 검증 (입력 최소화 확인)
- [ ] 모바일 반응형 UI 완성
- [ ] 모바일 앱 개발 환경 구축
- [ ] 전체 시스템 통합 테스트
- [ ] 성능 벤치마크
- [ ] 문서화

---

## 📊 진행 상황 요약

### P0 (즉시 조치 필요)
- [x] 1. 온보딩 시스템 개선 (이메일 중복 확인, 관리자 계정 생성) ✅ (2025-11-21)
- [x] 2. 멀티 테넌트 권한 체크 개선 ✅ (2025-11-21)
- [x] 3. 표준화 상태 확인 완료 ✅ (2025-11-22)
- [ ] 4. Trinity 홈페이지 PG SDK 연동 테스트 (2-3일)
- [ ] 5. 온보딩 시스템 검증 (1일)

**P0 총 예상 시간**: 약 3-4일

### P1 (중간 우선순위)
- [ ] 6. 동적 대시보드 Phase 3: 테스트 및 검증 (1일)
- [ ] 7. Controller 표준화 계속 (2-3주) - 대부분 완료, 점진적 처리
- [ ] 8. Trinity 홈페이지 추가 기능 (1-2주)

### P2 (낮은 우선순위)
- [ ] 9. 표준화 Phase 3-6 (3-4주)
- [ ] 10. 동적 대시보드 Phase 4: 성능 최적화 (1주)
- [ ] 11. 권한 확장 시스템 특화 (2주)
- [ ] 12. ERP 시스템 특화 및 고도화 (19주)
- [ ] 13. 브랜딩 시스템 구현 (1주)
- [ ] 14. 사용성 강화 및 모바일 앱 준비 (2주)

---

**마지막 업데이트**: 2025-11-23  
**다음 리뷰 예정일**: 2025-11-30 (주간 회의)

