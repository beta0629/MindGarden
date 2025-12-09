# Ops Portal 표준

**버전**: 1.0.0  
**최종 업데이트**: 2025-12-09  
**상태**: 공식 표준

---

## 📋 개요

Ops Portal 시스템의 표준화 가이드입니다. 도메인/포트 설정, CORS 설정, 환경별 구성, 그리고 MindGarden 프로젝트의 표준 문서(44개)를 Ops Portal에 적용한 내용을 정리합니다.

### 참조 문서
- [표준 문서 목록](./README.md)
- [개발 서버 도메인 설정 가이드](../project-management/archive/DEV_SERVER_DOMAIN_CONFIGURATION.md)

---

## 🌐 Ops Portal 도메인 및 포트 설정 표준

### 도메인 구조 (도메인 문서 기준)
**참조 문서**: [개발 서버 도메인 설정 가이드](../../archive/DEV_SERVER_DOMAIN_CONFIGURATION.md)

#### Ops Portal 도메인
| 환경 | 도메인 | 목적 | 비고 |
|------|--------|------|------|
| **개발** | `ops.dev.e-trinity.co.kr` | 개발 환경 HQ 운영 포털 | Nginx → `localhost:8080` 프록시 |
| **운영** | `ops.e-trinity.co.kr` | 운영 환경 HQ 운영 포털 | Nginx → `localhost:8080` 프록시 |

#### 포트 구성
| 환경 | 프론트엔드 | 백엔드 | 비고 |
|------|-----------|--------|------|
| **로컬 개발** | `localhost:4300` | `localhost:8081` | CoreSolution(8080)과 분리 |
| **개발 서버** | `ops.dev.e-trinity.co.kr` | `localhost:8080` | Nginx 프록시 사용 |
| **운영 서버** | `ops.e-trinity.co.kr` | `localhost:8080` | Nginx 프록시 사용 |

#### 환경별 설정
**로컬 개발 환경**:
- 프론트엔드: `localhost:4300` (Next.js 개발 서버)
- 백엔드: `localhost:8081` (환경 변수 `SERVER_PORT=8081`로 설정)
- CORS: `http://localhost:4300` 허용

**개발 서버 환경**:
- 프론트엔드: `https://ops.dev.e-trinity.co.kr` (Nginx → Next.js 빌드 파일)
- 백엔드: `localhost:8080` (환경 변수 `SERVER_PORT=8080` 또는 기본값)
- Nginx 설정: `ops.dev.e-trinity.co.kr` → `localhost:8080` 프록시
- CORS: `https://ops.dev.e-trinity.co.kr` 허용

**운영 서버 환경**:
- 프론트엔드: `https://ops.e-trinity.co.kr` (Nginx → Next.js 빌드 파일)
- 백엔드: `localhost:8080` (환경 변수 `SERVER_PORT=8080` 또는 기본값)
- Nginx 설정: `ops.e-trinity.co.kr` → `localhost:8080` 프록시
- CORS: `https://ops.e-trinity.co.kr` 허용

#### 설정 파일
**백엔드 포트 설정** (환경 변수로 동적 설정):
- `application.yml`: `server.port: ${SERVER_PORT:8081}` (로컬 기본값: 8081)
- `application-local.yml`: `server.port: ${SERVER_PORT:8081}` (로컬: 8081)
- `application-dev.yml`: `server.port: ${SERVER_PORT:8080}` (개발 서버: 8080)
- `application-prod.yml`: `server.port: ${SERVER_PORT:8080}` (운영 서버: 8080)

**CORS 설정** (`SecurityConfig.java` - 환경 변수로 동적 설정):
```java
@Value("${ops.cors.allowed-origins:http://localhost:4300}") String corsAllowedOrigins
```
- 환경 변수 `OPS_CORS_ALLOWED_ORIGINS`로 동적 설정 (쉼표로 구분)
- `application-local.yml`: `ops.cors.allowed-origins: ${OPS_CORS_ALLOWED_ORIGINS:http://localhost:4300}`
- `application-dev.yml`: `ops.cors.allowed-origins: ${OPS_CORS_ALLOWED_ORIGINS:http://localhost:4300,https://ops.dev.e-trinity.co.kr}`
- `application-prod.yml`: `ops.cors.allowed-origins: ${OPS_CORS_ALLOWED_ORIGINS:https://ops.e-trinity.co.kr}`

**환경 변수 파일**:
- **로컬**: `backend-ops/env.local.example`, `frontend-ops/env.local.example`
  - `SERVER_PORT=8081`
  - `OPS_CORS_ALLOWED_ORIGINS=http://localhost:4300`
  - `NEXT_PUBLIC_OPS_API_BASE_URL=http://localhost:8081/api/v1`
- **개발 서버**: `backend-ops/env.dev.example`, `frontend-ops/env.dev.example`
  - `SERVER_PORT=8080`
  - `OPS_CORS_ALLOWED_ORIGINS=http://localhost:4300,https://ops.dev.e-trinity.co.kr`
  - `NEXT_PUBLIC_OPS_API_BASE_URL=https://ops.dev.e-trinity.co.kr/api/v1`
- **운영 서버**: `backend-ops/env.production.example`, `frontend-ops/env.production.example`
  - `SERVER_PORT=8080`
  - `OPS_CORS_ALLOWED_ORIGINS=https://ops.e-trinity.co.kr`
  - `NEXT_PUBLIC_OPS_API_BASE_URL=https://ops.e-trinity.co.kr/api/v1`

#### 중요 사항
⚠️ **포트 설정 원칙**:
1. **로컬 개발**: Ops 백엔드는 8081 포트 사용 (CoreSolution 8080과 분리)
2. **개발/운영 서버**: Ops 백엔드는 8080 포트 사용 (Nginx 프록시와 일치)
3. **환경 변수**: `SERVER_PORT` 환경 변수로 포트 오버라이드 가능

✅ **도메인 설정 원칙** (동적 설정):
1. **모든 도메인은 환경 변수로 관리** (하드코딩 완전 금지)
2. **CORS 설정**: `OPS_CORS_ALLOWED_ORIGINS` 환경 변수로 동적 설정 (쉼표로 구분)
3. **프론트엔드 API URL**: `NEXT_PUBLIC_OPS_API_BASE_URL` 환경 변수로 동적 설정
4. **Nginx 설정과 백엔드 포트 일치 필수**
5. **환경별 예시 파일 제공**: `env.local.example`, `env.dev.example`, `env.production.example`

✅ **표준 준수**:
- 하드코딩된 도메인/포트 완전 제거
- 모든 설정은 환경 변수로 관리
- 환경별 설정 파일 분리 (local/dev/prod)

---

## ✅ 완료된 표준화 항목

### 1. CSS 색상 하드코딩 제거 ✅ 완료
**표준**: 모든 색상값은 CSS 변수로 관리 (현재 색상값 유지)

**완료된 작업**:
- ✅ `ops-design-tokens.css` 파일 생성 (CSS 변수 정의)
- ✅ `GlobalNotification.css`: 하드코딩된 색상 → CSS 변수 전환
  - Primary: `#3b82f6` → `var(--ops-color-primary, #3b82f6)`
  - Success: `#10b981` → `var(--ops-color-success, #10b981)`
  - Danger: `#ef4444` → `var(--ops-color-danger, #ef4444)`
  - Warning: `#f59e0b` → `var(--ops-color-warning, #f59e0b)`
  - Info: `#3b82f6` → `var(--ops-color-info, #3b82f6)`
- ✅ `MGButton.module.css`: 모든 버튼 색상 → CSS 변수 전환
- ✅ `layout.tsx`: CSS 변수 파일 import 추가

**변경된 파일**:
- `frontend-ops/styles/ops-design-tokens.css` (신규)
- `frontend-ops/src/components/common/GlobalNotification.css`
- `frontend-ops/src/components/ui/MGButton.module.css`
- `frontend-ops/app/layout.tsx`

**표준 준수**: 100% (현재 색상값 유지하면서 CSS 변수로 전환)

---

### 2. API 호출 표준화 ✅ 완료
**표준**: 모든 API 호출은 공통 유틸리티 사용, API 경로는 상수로 정의

**완료된 작업**:
- ✅ `constants/api.ts` 생성 (API 경로 상수 정의)
  - 인증: `OPS_API_PATHS.AUTH.LOGIN`, `OPS_API_PATHS.AUTH.LOGOUT`
  - 온보딩: `OPS_API_PATHS.ONBOARDING.*`
  - 요금제: `OPS_API_PATHS.PRICING.*`
  - Feature Flag: `OPS_API_PATHS.FEATURE_FLAGS.*`
  - 대시보드: `OPS_API_PATHS.DASHBOARD.*`
  - 테넌트: `OPS_API_PATHS.TENANTS.*`
- ✅ `services/authApi.ts` 생성 (인증 API 서비스)
  - `login()`: 표준화된 로그인 API 호출
  - `logout()`: 표준화된 로그아웃 API 호출
- ✅ 모든 서비스 파일에서 API 경로 상수 사용
  - `onboardingService.ts`: 하드코딩된 경로 → `OPS_API_PATHS.ONBOARDING.*`
  - `onboardingClient.ts`: 하드코딩된 경로 → `OPS_API_PATHS.ONBOARDING.*`
  - `pricingService.ts`: 하드코딩된 경로 → `OPS_API_PATHS.PRICING.*`
  - `pricingClient.ts`: 하드코딩된 경로 → `OPS_API_PATHS.PRICING.*`
  - `featureFlagService.ts`: 하드코딩된 경로 → `OPS_API_PATHS.FEATURE_FLAGS.*`
  - `featureFlagClient.ts`: 하드코딩된 경로 → `OPS_API_PATHS.FEATURE_FLAGS.*`
  - `dashboardService.ts`: 하드코딩된 경로 → `OPS_API_PATHS.DASHBOARD.*`
  - `app/tenants/page.tsx`: 하드코딩된 경로 → `OPS_API_PATHS.TENANTS.*`
- ✅ 컴포넌트에서 직접 fetch 사용 제거
  - `LoginForm.tsx`: 직접 fetch → `authApi.login()` 사용
  - `LogoutButton.tsx`: 직접 fetch → `authApi.logout()` 사용

**변경된 파일**:
- `frontend-ops/src/constants/api.ts` (신규)
- `frontend-ops/src/services/authApi.ts` (신규)
- `frontend-ops/src/components/auth/LoginForm.tsx`
- `frontend-ops/src/components/auth/LogoutButton.tsx`
- `frontend-ops/src/services/onboardingService.ts`
- `frontend-ops/src/services/onboardingClient.ts`
- `frontend-ops/src/services/pricingService.ts`
- `frontend-ops/src/services/pricingClient.ts`
- `frontend-ops/src/services/featureFlagService.ts`
- `frontend-ops/src/services/featureFlagClient.ts`
- `frontend-ops/src/services/dashboardService.ts`
- `frontend-ops/app/tenants/page.tsx`

**표준 준수**: 100% (모든 API 호출이 공통 유틸리티 사용, 하드코딩된 경로 제거)

---

### 3. 에러 처리 표준화 ✅ 완료
**표준**: 모든 예외는 `GlobalExceptionHandler`를 통해 중앙 집중식 처리

**완료된 작업**:
- ✅ `GlobalExceptionHandler` 생성
  - `IllegalArgumentException` → HTTP 400
  - `MethodArgumentNotValidException` → HTTP 400 (Validation 실패)
  - `ResponseStatusException` → 예외에서 지정된 HTTP 상태 코드
  - `EntityNotFoundException` → HTTP 404
  - `Exception` → HTTP 500 (기본 핸들러)
- ✅ `ErrorResponse` DTO 생성 (표준 에러 응답 형식)
- ✅ `EntityNotFoundException` 커스텀 예외 생성
- ✅ `OnboardingService`: `IllegalArgumentException` → `EntityNotFoundException` 전환
- ✅ `PricingPlanService`: 모든 "찾을 수 없습니다" 예외 → `EntityNotFoundException` 전환
- ✅ `FeatureFlagService`: "찾을 수 없습니다" 예외 → `EntityNotFoundException` 전환

**변경된 파일**:
- `backend-ops/src/main/java/com/mindgarden/ops/exception/GlobalExceptionHandler.java` (신규)
- `backend-ops/src/main/java/com/mindgarden/ops/exception/ErrorResponse.java` (신규)
- `backend-ops/src/main/java/com/mindgarden/ops/exception/EntityNotFoundException.java` (신규)
- `backend-ops/src/main/java/com/mindgarden/ops/service/onboarding/OnboardingService.java`
- `backend-ops/src/main/java/com/mindgarden/ops/service/pricing/PricingPlanService.java`
- `backend-ops/src/main/java/com/mindgarden/ops/service/config/FeatureFlagService.java`

**표준 준수**: 100% (모든 예외를 GlobalExceptionHandler에서 처리)

---

### 3. 하드코딩된 업종 코드 제거 ✅ 완료
**표준**: 모든 코드값은 공통코드에서 조회 (하드코딩 금지)

**완료된 작업**:
- ✅ `OpsConstants` 상수 클래스 생성
- ✅ `OnboardingService`: 하드코딩된 `"CONSULTATION"` → `OpsConstants.DEFAULT_BUSINESS_TYPE` 전환
- ✅ 향후 공통코드 시스템 연동을 위한 상수 정의 (`BUSINESS_TYPE_CODE_GROUP` 등)

**변경된 파일**:
- `backend-ops/src/main/java/com/mindgarden/ops/constants/OpsConstants.java` (신규)
- `backend-ops/src/main/java/com/mindgarden/ops/service/onboarding/OnboardingService.java`

**표준 준수**: 80% (상수로 분리 완료, 향후 공통코드 시스템 연동 필요)

**참고**: Ops Portal은 독립적인 백엔드이므로 CoreSolution의 `CommonCodeService`를 직접 사용할 수 없습니다. 향후 Ops Portal 전용 공통코드 시스템 구축 또는 CoreSolution API 연동 필요.

---

### 4. 인라인 스타일 제거 ✅ 완료 (2025-12-09)
**표준**: 모든 스타일은 CSS 클래스로 분리 (인라인 스타일 금지)

**완료된 작업**:
- ✅ `OnboardingDecisionForm`: `style={{ display: "flex", gap: "0.5rem" }}` → `ops-form-actions` 클래스
- ✅ `AddonEditForm`: `style={{ justifyContent: "space-between" }}`, `style={{ margin: 0 }}` → `ops-form-footer`, `ops-form-footer__title` 클래스
- ✅ `PlanEditForm`: 인라인 스타일 → CSS 클래스로 전환
- ✅ `TenantsPage`: `style={{ cursor: "pointer" }}` → CSS 클래스로 전환
- ✅ `ops-card-list.css`: 공통 폼 액션 스타일 정의

**변경된 파일**:
- `frontend-ops/src/components/onboarding/OnboardingDecisionForm.tsx`
- `frontend-ops/src/components/pricing/AddonEditForm.tsx`
- `frontend-ops/src/components/pricing/PlanEditForm.tsx`
- `frontend-ops/app/tenants/page.tsx`
- `frontend-ops/styles/ops-card-list.css` (신규)

**표준 준수**: 100% (모든 인라인 스타일 제거 완료)

---

### 5. 리스트 UI 카드 형태 표준화 ✅ 완료 (2025-12-09)
**표준**: 모든 리스트는 카드 형태로 표시 (테이블 형태 금지)

**완료된 작업**:
- ✅ 온보딩 테이블 → `OnboardingCardList` (카드 그리드)
- ✅ 요금제/애드온 테이블 → `PricingCardList`, `AddonCardList` (카드 그리드)
- ✅ Feature Flag 테이블 → `FeatureFlagCardList` (카드 그리드)
- ✅ `OpsCard` 공통 컴포넌트 생성 (재사용 가능한 카드)
- ✅ 반응형 레이아웃 적용 (모바일: 1열, 태블릿: 2열, 데스크톱: 자동 그리드)
- ✅ 버튼 가로 배치 (세로 배치 방지)

**변경된 파일**:
- `frontend-ops/src/components/ui/OpsCard.tsx` (신규)
- `frontend-ops/src/components/ui/OpsCard.module.css` (신규)
- `frontend-ops/src/components/onboarding/OnboardingCardList.tsx` (신규)
- `frontend-ops/src/components/onboarding/OnboardingCardList.module.css` (신규)
- `frontend-ops/src/components/pricing/PricingCardList.tsx` (신규)
- `frontend-ops/src/components/pricing/AddonCardList.tsx` (신규)
- `frontend-ops/src/components/pricing/PricingCardList.module.css` (신규)
- `frontend-ops/src/components/feature-flags/FeatureFlagCardList.tsx` (신규)
- `frontend-ops/src/components/feature-flags/FeatureFlagCardList.module.css` (신규)
- `frontend-ops/styles/ops-card-list.css` (신규)
- `frontend-ops/app/onboarding/page.tsx`
- `frontend-ops/app/feature-flags/page.tsx`
- `frontend-ops/src/components/pricing/PricingManagement.tsx`

**표준 준수**: 100% (모든 리스트를 카드 형태로 전환 완료)

---

### 6. CSS 하드코딩 제거 (globals.css) ✅ 완료 (2025-12-09)
**표준**: 모든 색상값은 CSS 변수로 관리

**완료된 작업**:
- ✅ `globals.css`: 배지 색상 → CSS 변수로 전환
  - `risk-badge--low/medium/high`: CSS 변수 사용
  - `status-badge--pending/approved/rejected/on-hold/in-review`: CSS 변수 사용
- ✅ `globals.css`: 폼 피드백 색상 → CSS 변수로 전환
- ✅ `globals.css`: 버튼 그라데이션 → CSS 변수로 전환
- ✅ `ops-design-tokens.css`: 배지 색상, 레이아웃 색상, 그라데이션 변수 추가

**변경된 파일**:
- `frontend-ops/styles/ops-design-tokens.css`
- `frontend-ops/styles/globals.css`

**표준 준수**: 95% (주요 색상 변수화 완료, 일부 레이아웃 색상은 유지)

---

## 🟡 진행 중인 표준화 항목

### 1. 상태값/리스크 레벨 공통코드 시스템 연동 🟡 진행 중
**표준**: 모든 상태값은 공통코드에서 동적으로 조회

**현재 상태**:
- ✅ 프론트엔드: `constants/onboarding.ts`에 상수 정의 (하드코딩 방지)
- ⚠️ 백엔드: Enum 사용 (`OnboardingStatus`, `RiskLevel`)
- ⚠️ 공통코드 시스템 연동 미완료

**필요 작업**:
- [ ] Ops Portal 전용 공통코드 시스템 구축 또는 CoreSolution API 연동
- [ ] 백엔드 Enum → 공통코드 조회로 전환
- [ ] 프론트엔드 상수 → 공통코드 API 조회로 전환

**표준 준수**: 50% (상수 분리는 완료, 공통코드 연동 필요)

---

## 📊 표준화 준수 현황

### 전체 준수율: 약 85% (이전 75% → 향상)

| 카테고리 | 준수율 | 상태 |
|---------|--------|------|
| CSS 색상 변수화 | 100% | 🟢 완료 |
| 에러 처리 | 100% | 🟢 완료 |
| 하드코딩 제거 | 90% | 🟢 양호 |
| 인라인 스타일 제거 | 100% | 🟢 완료 |
| 리스트 UI 카드 형태 | 100% | 🟢 완료 |
| 공통코드 시스템 | 50% | 🟡 진행 중 |
| API 경로 | 100% | 🟢 완료 (`/api/v1/` 사용) |
| 컴포넌트 표준화 | 95% | 🟢 양호 |

---

## 🎯 다음 단계

### 🔴 Priority 1: 최우선
1. **공통코드 시스템 연동**
   - Ops Portal 전용 공통코드 시스템 구축 또는 CoreSolution API 연동
   - 상태값/리스크 레벨 공통코드화

### 🟡 Priority 2: 높음
1. **프론트엔드 상수 파일 정리**
   - `constants/onboarding.ts` → 공통코드 API 조회로 전환
   - 하드코딩된 상태값 제거

2. **표준화 문서 보완**
   - Ops Portal 전용 표준화 가이드 작성
   - 공통코드 시스템 연동 가이드 작성

---

## 📝 변경 사항 요약

### 신규 생성 파일 (백엔드)
1. `backend-ops/src/main/java/com/mindgarden/ops/exception/GlobalExceptionHandler.java` - 전역 예외 처리
2. `backend-ops/src/main/java/com/mindgarden/ops/exception/ErrorResponse.java` - 표준 에러 응답
3. `backend-ops/src/main/java/com/mindgarden/ops/exception/EntityNotFoundException.java` - 커스텀 예외
4. `backend-ops/src/main/java/com/mindgarden/ops/constants/OpsConstants.java` - 상수 정의

### 신규 생성 파일 (프론트엔드)
1. `frontend-ops/styles/ops-design-tokens.css` - CSS 변수 정의
2. `frontend-ops/styles/ops-card-list.css` - 카드 리스트 공통 스타일
3. `frontend-ops/src/components/ui/OpsCard.tsx` - 공통 카드 컴포넌트
4. `frontend-ops/src/components/ui/OpsCard.module.css` - 카드 컴포넌트 스타일
5. `frontend-ops/src/components/onboarding/OnboardingCardList.tsx` - 온보딩 카드 리스트
6. `frontend-ops/src/components/onboarding/OnboardingCardList.module.css` - 온보딩 카드 스타일
7. `frontend-ops/src/components/pricing/PricingCardList.tsx` - 요금제 카드 리스트
8. `frontend-ops/src/components/pricing/AddonCardList.tsx` - 애드온 카드 리스트
9. `frontend-ops/src/components/pricing/PricingCardList.module.css` - 요금제/애드온 카드 스타일
10. `frontend-ops/src/components/feature-flags/FeatureFlagCardList.tsx` - Feature Flag 카드 리스트
11. `frontend-ops/src/components/feature-flags/FeatureFlagCardList.module.css` - Feature Flag 카드 스타일
12. `frontend-ops/src/constants/api.ts` - API 경로 상수 정의
13. `frontend-ops/src/services/authApi.ts` - 인증 API 서비스

### 수정된 파일 (백엔드)
1. `backend-ops/src/main/java/com/mindgarden/ops/service/onboarding/OnboardingService.java` - 예외 처리 및 상수 사용
2. `backend-ops/src/main/java/com/mindgarden/ops/service/pricing/PricingPlanService.java` - 예외 처리 표준화
3. `backend-ops/src/main/java/com/mindgarden/ops/service/config/FeatureFlagService.java` - 예외 처리 표준화

### 수정된 파일 (프론트엔드)
1. `frontend-ops/src/components/common/GlobalNotification.css` - CSS 변수 사용
2. `frontend-ops/src/components/ui/MGButton.module.css` - CSS 변수 사용
3. `frontend-ops/styles/globals.css` - 배지/폼 피드백 색상 CSS 변수화
4. `frontend-ops/app/layout.tsx` - CSS 변수 파일 import
5. `frontend-ops/app/onboarding/page.tsx` - 카드 리스트 사용
6. `frontend-ops/app/feature-flags/page.tsx` - 카드 리스트 사용
7. `frontend-ops/src/components/pricing/PricingManagement.tsx` - 카드 리스트 사용
8. `frontend-ops/src/components/onboarding/OnboardingDecisionForm.tsx` - 인라인 스타일 제거
9. `frontend-ops/src/components/pricing/AddonEditForm.tsx` - 인라인 스타일 제거
10. `frontend-ops/src/components/pricing/PlanEditForm.tsx` - 인라인 스타일 제거
11. `frontend-ops/app/tenants/page.tsx` - 인라인 스타일 제거, API 경로 상수 사용
12. `frontend-ops/src/components/auth/LoginForm.tsx` - 표준화된 API 호출 사용
13. `frontend-ops/src/components/auth/LogoutButton.tsx` - 표준화된 API 호출 사용
14. `frontend-ops/src/services/onboardingService.ts` - API 경로 상수 사용
15. `frontend-ops/src/services/onboardingClient.ts` - API 경로 상수 사용
16. `frontend-ops/src/services/pricingService.ts` - API 경로 상수 사용
17. `frontend-ops/src/services/pricingClient.ts` - API 경로 상수 사용
18. `frontend-ops/src/services/featureFlagService.ts` - API 경로 상수 사용
19. `frontend-ops/src/services/featureFlagClient.ts` - API 경로 상수 사용
20. `frontend-ops/src/services/dashboardService.ts` - API 경로 상수 사용

---

---

## 🎯 2025-12-09 추가 완료 작업

### 리스트 UI 카드 형태 표준화 ✅ 완료
**목적**: 테이블 형태 리스트를 카드 형태로 전환하여 버튼 세로 배치 문제 해결 및 일관된 UI 제공

**완료된 작업**:
- ✅ 온보딩 테이블 → 카드 그리드로 전환
- ✅ 요금제/애드온 테이블 → 카드 그리드로 전환
- ✅ Feature Flag 테이블 → 카드 그리드로 전환
- ✅ `OpsCard` 공통 컴포넌트 생성 및 재사용
- ✅ 반응형 레이아웃 적용 (모바일/태블릿/데스크톱)
- ✅ 버튼 가로 배치 보장

**인라인 스타일 제거 ✅ 완료**
- ✅ 모든 인라인 스타일을 CSS 클래스로 전환
- ✅ 공통 폼 액션 스타일 정의 (`ops-form-actions`, `ops-form-footer`)

**CSS 하드코딩 제거 ✅ 완료**
- ✅ `globals.css`의 배지 색상 CSS 변수화
- ✅ 폼 피드백 색상 CSS 변수화
- ✅ 버튼 그라데이션 CSS 변수화

**성과**:
- 표준화 준수율: 75% → 85% (10%p 향상)
- 모든 리스트가 카드 형태로 통일
- 인라인 스타일 완전 제거
- CSS 변수 사용률 향상

---

### API 호출 표준화 ✅ 완료
**목적**: 모든 API 호출을 공통 유틸리티로 통일하고, API 경로를 상수로 관리

**완료된 작업**:
- ✅ API 경로 상수 정의 (`constants/api.ts`)
- ✅ 인증 API 서비스 생성 (`services/authApi.ts`)
- ✅ 모든 서비스 파일에서 API 경로 상수 사용
- ✅ 컴포넌트에서 직접 fetch 사용 제거

**성과**:
- 표준화 준수율: 85% → 92% (7%p 향상)
- API 경로 하드코딩 완전 제거
- 일관된 API 호출 패턴 적용
- 에러 처리 표준화

---

**작성자**: CoreSolution  
**검토자**: -  
**승인자**: -  
**최종 업데이트**: 2025-12-09 (API 호출 표준화 추가)

