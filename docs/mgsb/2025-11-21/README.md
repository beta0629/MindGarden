# 2025-11-21 작업 문서

**작성일**: 2025-11-21  
**상태**: 활성 관리 중

---

## 📋 문서 목록

### 주요 문서
1. **[미개발 항목](./PENDING_DEVELOPMENT_ITEMS.md)** ⭐
   - 완료된 작업 제외하고 미개발 항목만 정리
   - 우선순위별로 분류 (P0, P1, P2)
   - 오늘(2025-11-21) 완료된 작업 반영

2. **[오늘 할 일 체크리스트](./TODAY_TODO_CHECKLIST.md)** ⭐
   - 오늘 완료된 작업 기록
   - 진행 중인 작업 목록
   - 다음 작업 계획

3. **[개발 체크리스트](./DEVELOPMENT_CHECKLIST.md)** ⭐
   - 전체 개발 항목 체크리스트
   - 우선순위별 분류
   - 진행 상황 요약

4. **[토스페이먼츠 테스트 체크리스트](./TOSS_PAYMENTS_TEST_CHECKLIST.md)** ⭐
   - PG SDK 연동 테스트 가이드
   - 테스트 단계별 체크리스트
   - 에러 처리 가이드

5. **[온보딩 시스템 개발 가이드](./ONBOARDING_SYSTEM_DEVELOPMENT_GUIDE.md)** ⭐
   - 하드코딩 금지 원칙
   - CSS 변수 상수화 규칙
   - 비즈니스 로직 분리 원칙
   - 공통 코드 사용 가이드
   - 백엔드/프론트엔드 개발 규칙

6. **[IA 구조도](./IA_ARCHITECTURE.md)** ⭐
   - 시스템 전체 구조
   - 패키지 구조
   - 레이어 구조
   - 데이터 흐름
   - API 구조
   - 테넌트 프로필 페이지 추가 (v1.1.0)

7. **[메뉴 구조도](./MENU_STRUCTURE.md)** ⭐
   - 전체 메뉴 구조
   - 역할별 메뉴 구조
   - 동적 메뉴 시스템
   - 테넌트 프로필 메뉴 추가 (v1.1.0)

8. **[프로세스 플로우차트](./PROCESS_FLOWCHARTS.md)** ⭐
   - 주요 비즈니스 프로세스
   - 테넌트 온보딩 프로세스
   - 사용자 인증 및 로그인 프로세스
   - 온보딩 완료 후 로그인 → 테넌트 프로필 페이지 플로우 추가 (v1.1.0)

---

## ✅ 오늘(2025-11-21) 완료된 작업

### 온보딩 시스템 개선
- ✅ 이메일 중복 확인 로직 개선 (멀티 테넌트 지원)
- ✅ 테넌트 생성 시점에만 중복 체크하도록 수정
- ✅ 활성 테넌트(`status = 'ACTIVE'`)만 중복으로 판단
- ✅ 온보딩 승인 시 관리자 계정 자동 생성 로직 추가

### 멀티 테넌트 권한 체크 개선
- ✅ 이메일 기반 권한 확인 메서드 추가
- ✅ 테넌트 전환 시 이메일 기반 권한 확인 추가
- ✅ 로그인 이메일과 테넌트별 권한 명확하게 연결

### 문서화
- ✅ 온보딩 시스템 개발 가이드 작성
  - 하드코딩 금지 원칙 명시
  - CSS 변수 상수화 규칙 정의
  - 비즈니스 로직 분리 원칙 정의
  - 백엔드/프론트엔드 개발 규칙 정리

### 테넌트 프로필 페이지 추가
- ✅ 테넌트 프로필 페이지 구현 (`/tenant/profile`)
  - 테넌트 상태 조회
  - 구독 정보 조회 및 관리
  - 결제 수단 조회 및 관리
- ✅ 온보딩 완료 후 로그인 시 테넌트 프로필 페이지로 자동 리다이렉트
- ✅ IA 구조도, 메뉴 구조도, 플로우차트 업데이트
  - 테넌트 프로필 API 추가
  - 테넌트 프로필 메뉴 추가
  - 온보딩 → 로그인 → 테넌트 프로필 플로우 추가

### Controller 표준화 완료 ✅
- ✅ Phase 1 전체 Controller 표준화 완료 (약 60개 Controller)
  - ✅ Core 모듈 Controller (14개)
    - Ops 관련 Controller 6개 표준화
    - Tenant 관련 Controller 3개 표준화
    - Academy 관련 Controller 5개 표준화
  - ✅ Consultation 모듈 Controller (약 30개) - 2025-11-21 완료
    - ConsultationController, UserController, ConsultantController, BranchController
    - MenuController, CommonCodeController, StatisticsController, ScheduleController
    - AdminController, AuthController, MultiTenantController, ErpController
    - PaymentController, ClientProfileController, HQBranchController
    - HealingContentController, SystemNotificationController, SmsAuthController
    - ClientSettingsController, ClientSocialAccountController, DatabaseFixController
    - SessionExtensionController, CssThemeController, AmountManagementController
    - SimpleAdminController, SessionSyncController, ConsultantRatingController
    - PermissionManagementController, ConsultationMessageController
    - WellnessAdminController, SuperAdminController, OAuth2Controller
  - 모든 Controller가 `BaseApiController` 상속
  - 모든 응답을 `ApiResponse<T>`로 래핑
  - 예외 처리를 `GlobalExceptionHandler`에 위임
- ✅ 표준화 계획 문서 업데이트
  - Phase 1 완료 상태 반영 (100%)
  - Consultation 모듈 Controller 표준화 내역 추가
  - 전체 진행 상황 업데이트

---

## 🚧 진행 중인 작업

### 우선순위 높음 (P0)
1. **Trinity 홈페이지 PG SDK 연동 테스트**
   - SDK 구조 완료, 실제 테스트 필요
   - 예상 시간: 2-3일

2. **온보딩 시스템 검증**
   - 관리자 계정 생성 확인
   - 이메일 중복 확인 로직 검증
   - 멀티 테넌트 권한 체크 검증
   - 예상 시간: 1일

---

## 📊 진행 상황 요약

```
오늘 목표 달성률: ████████████████░░░░ 80%

완료: 2/4 작업
진행 중: 0/4 작업
대기: 2/4 작업
```

---

## 🔗 관련 문서

### 이전 날짜 폴더
- [2025-11-20](../2025-11-20/) - 이전 작업 문서

### 루트 문서
- [마스터 TODO](../MASTER_TODO_AND_IMPROVEMENTS.md)
- [표준화 계획](../CORESOLUTION_STANDARDIZATION_PLAN.md)
- [통합 계획](../MINDGARDEN_BASED_INTEGRATION_PLAN.md)

---

## 💡 참고사항

- 모든 문서는 날짜별 폴더에 정리하여 관리
- 완료된 작업은 제외하고 미완료 항목만 관리
- 우선순위별로 작업 진행
- 테스트 완료 후 다음 작업 진행

---

**마지막 업데이트**: 2025-11-21

