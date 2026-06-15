# Ops Portal Migration Plan — HQ_MASTER 18건 가드 분리 종합 계획서

**버전**: 1.1.0
**작성일**: 2026-06-15 (v1.1 갱신: Phase 1~5 완료)
**작성자**: core-planner (오케스트레이터)
**상태**: ✅ **Phase 1~5 머지 완료** (Phase 6 = 본 갱신 PR)
**우선순위**: ⭐⭐⭐⭐⭐ (보안 핵심 — 외부 테넌트 ADMIN 의 HQ 전용 엔드포인트 침범 차단)

---

## 0.1 진행 현황 (2026-06-15 기준)

| Phase | 영역 | PR | Merge SHA | 상태 |
|-------|------|----|-----------|------|
| **1** | PII 회전 (`PiiKeyRotationAdminController`) | #362 / #363 | (Phase 1) | ✅ 머지 |
| **1b** | `JwtAuthenticationFilter` STAFF 정정 (P0) | #361 / #374 | (Phase 1b) | ✅ 머지 |
| **2** | 시스템 모니터링 (AIMonitoring / SystemMetrics / SchedulerMonitoring / Monitoring) | #370 | (Phase 2) | ✅ 머지 |
| **3** | 보안 감사 (`SecurityAuditController`) | #373 | `daee3ad74` | ✅ 머지 |
| **4** | 테넌트 관리 (`SuperAdminTenantComponentController` + DynamicPermission/PermissionMatrix 주석 정리) | #375 | `969f5e318` | ✅ 머지 |
| **5** | FE Role 헬퍼 `isOps` + 위젯/QuickAction HQ_MASTER 정리 | #378 | `4ee8536a3` | ✅ 머지 |
| **6** | 표준·런북·SSOT 갱신 (`ROLE_STANDARD.md` §3.3 신설, 본 계획서 갱신) | (이 PR) | — | 🟢 진행 중 |

### 회귀 테스트 합계
- 신규 `*OpsGuardTest` 5종 (Phase 2~4) — 모두 PASS
- `RoleUtils.test.js` 24건 (Phase 5) — 모두 PASS
- 표본 패턴 (필수 6종) 모두 충족: `@PreAuthorize` 검증 / OPS+HQ 200 / OPS+외부 403 / ADMIN-STAFF-CONSULTANT-CLIENT 403 / 무인증 401 / 잔존 HQ_MASTER·SUPER_ADMIN 표현식 0건 정적 검증

### 정착된 패턴 (`ROLE_STANDARD.md` §3.3 신설)
**옵션 3+1 하이브리드** (방어 in depth)
1. 클래스 레벨 `@PreAuthorize("hasRole('OPS')")`
2. 메서드 시작점 `assertHqTenant()` — `OpsTenantConstants.isHqTenant()` 검증
3. FE 짝 헬퍼 `RoleUtils.isOps(user)` (Phase 5 신설)

> **본 문서의 성격**: 본 문서는 **계획서(docs only)** 이며, 코드 수정은 **각 Phase 별 core-coder 위임 PR** 로 진행한다. 본 계획서 PR 자체는 운영 영향 0 — 표준·체크리스트·분배실행 표만 추가한다.

---

## 0. TL;DR

- PR #344 / #358 에서 **PII 회전 컨트롤러** 권한을 `HQ_MASTER` → `ADMIN` 단일로 통합했으나, 이는 4종 SSOT 호환만 맞춘 것이며 **본래의 "본사 운영팀만" 보안 의도는 충족하지 못한다**. 외부 테넌트(예: 상담 센터) ADMIN 계정으로도 호출 가능한 상태가 됨.
- 동일 패턴이 **`AIMonitoring` / `SecurityAudit` / `SystemMetrics` / `SchedulerMonitoring` / `SuperAdminTenantComponent` 등 총 18건** 에서 발견되며, [`ROLE_STANDARD.md`](../standards/ROLE_STANDARD.md) §6.1 §3 가 명시한 "Ops Portal 분리" 후속 PR 의 대상 범위와 정확히 일치한다.
- 사용자 결정(옵션 B) 에 따라 **`ops-portal-migration` 일괄 마이그** 로 진행하되, **개별 PR Phase 분리** 권장. Phase 1 (PII 회전) 가 가장 보안 민감하므로 단독 PR 로 선행.
- **권한 표현 SSOT**: 기존 인프라(`ROLE_OPS` Spring Security authority + `OpsPermissionUtils` + 별도 `backend-ops` MVP) 가 **이미 존재**한다. **신규 enum / `UserRole` 값 추가 0건** 으로 정책 §6.1 §3 위반 없이 마이그 가능 (옵션 1 권장 — §3 비교 표).
- **부수적 발견(P0)**: `JwtAuthenticationFilter#createAuthoritiesFromUser` 가 **`UserRole.STAFF` 에게 `ROLE_ADMIN` + `ROLE_OPS` 두 권한을 부여** 중 — Ops Portal 분리 시 STAFF 의 OPS 침범 차단 필수. 별도 Phase 1b 로 격리.

---

## 1. 배경 / 표준 인용

### 1.1 직접적인 발단 — PR #344 / #358 정정

| PR | 날짜 | 변경 | 결과 |
|----|------|------|------|
| **#344** | 2026-06-15 | `PiiKeyRotationAdminController` 신설, `@PreAuthorize("hasRole('HQ_MASTER')")` 사용 | 4종 SSOT(`ROLE_STANDARD.md` §3) 위반 — `HQ_MASTER` 는 SSOT 외 enum |
| **#358** | 2026-06-15 | 정정: `HQ_MASTER` → `ADMIN` 단일 매핑 | 호환은 맞으나 **보안 의도(본사 운영팀 전용) 미흡** — 외부 테넌트 ADMIN 도 호출 가능 |

#### 1.1.1 #358 의 한계

```54:54:src/main/java/com/coresolution/core/controller/PiiKeyRotationAdminController.java
@PreAuthorize("hasRole('ADMIN')")
```

이 표현은 다음 모두를 통과시킨다.

1. ✅ 본사 운영팀(HQ_ADMIN / SUPER_HQ_ADMIN) — 의도된 호출자
2. ❌ **외부 테넌트의 ADMIN(예: 상담 센터 원장)** — 비의도, 보안 위반
3. ❌ Ops Portal MVP 의 `OPS` actor — **현재는 미통과** (별도 Phase 에서 결정 필요)

`TenantContextHolder` 자체 검증도 없어, 다른 테넌트의 사용자가 토큰을 가져오는 즉시 회전 인프라 전체에 접근 가능.

### 1.2 표준 인용 — `ROLE_STANDARD.md`

#### 1.2.1 §3 — `@PreAuthorize` 패턴 표준 (인용)

> PR-2/9 에서 4종 SSOT 정착. 신규 컨트롤러는 다음 패턴만 사용한다.
>
> ```java
> @PreAuthorize("hasRole('ADMIN')")
> @PreAuthorize("hasAnyRole('ADMIN','STAFF')")
> @PreAuthorize("hasRole('CLIENT') and #userId == authentication.principal.id")
> ```

#### 1.2.2 §3.1 금지 사항 (인용)

> - ❌ `hasRole('BRANCH_ADMIN')`, `hasRole('HQ_MASTER')` 등 레거시 역할 비교
> - ❌ `hasAuthority('ROLE_…')` 접두사 비교 (Spring 의 `hasRole` 사용)
> - ❌ Controller 내부에서 인라인 `if (role.equals("ADMIN"))` 분기
> - ❌ 다른 테넌트 데이터 접근 시 권한 가드만 의존 (반드시 `TenantContextHolder` 자체 검증 병행)

#### 1.2.3 §6.1 — 신규 권한 추가 금지 (인용)

> 4종(ADMIN/STAFF/CONSULTANT/CLIENT) 외의 새 역할 enum/문자열은 **추가하지 않는다.** 새로운 권한 묶음이 필요하면 다음 중 하나로 처리한다.
>
> 1. 공통 권한 시스템(`role_permissions`) 에 권한 코드 추가
> 2. 전문가 subtype 이 새로 필요한 경우 `users.professional_provider_type_code` 공통코드
> 3. **운영(Ops Portal) 전용 권한** 은 별도 시스템(`ops-portal-migration`) 으로 분리한다 — 현재 HQ_MASTER 17건이 이 후속 PR 범위 (`SuperAdminTenantComponent`, `AIMonitoring`, `SecurityAudit`, `SystemMetrics`, `SchedulerMonitoring`)

#### 1.2.4 §2.1 ADMIN 의 경계 (인용)

> - 다른 테넌트 데이터에는 절대 접근할 수 없다 (테넌트 격리 + Tenant Guard).
> - **운영 전체 권한(Ops Portal) 은 별도 분리 진행 중(아래 §6 후속 과제 참조).**

### 1.3 사용자 권한 구조 (사용자 결정 — 본 계획의 전제)

| 권한 영역 | 대상 사용자 | 도메인 | 주 사용 시나리오 |
|-----------|-------------|--------|------------------|
| **테넌트 어드민** | 테넌트(상담 센터/학원) 원장·사장 | `*.e-trinity.co.kr` 등 본 서비스 | 본인 테넌트 운영 (사용자·결제·예약·일정) |
| **온보딩 어드민** | 신규 테넌트 가입·계약 담당 | `onboarding.*` (별도 도메인) | 신규 테넌트 자가 가입·계약 검토 |
| **Ops 어드민** | 코어솔루션 본사 운영팀 (SRE·보안·CS·SR) | `ops.e-trinity.co.kr` (별도) | 다중 테넌트 모니터링·운영 키 회전·보안 감사 |

본 계획서는 위 3종 중 **Ops 어드민** 의 권한 표현을 SSOT 화하고, "테넌트 어드민" 이 Ops 영역에 침범하지 못하도록 일괄 가드 보강한다.

### 1.4 어제 PR #358 의 보안 의도 미흡 — 사용자 인지

사용자는 PR #358 머지 직후 "**ADMIN 단일로는 외부 테넌트도 통과한다 — 본래 보안 의도가 다르다**" 라고 지적함. 본 계획서가 그 후속 조치 (옵션 B = ops-portal-migration 일괄) 의 산출물이다.

---

## 2. 인벤토리 (전체 영역)

본 절은 `docs/standards/ROLE_STANDARD.md` §6.1 §3 가 인용한 5개 영역 + PII 회전 + 검색 결과로 발견된 추가분을 모두 포함한다. 영역별 **파일 경로 + 라인 + 현 가드** 를 제시한다.

### 2.1 BE — `src/main/java/com/coresolution/core/controller/` (Ops 영역 컨트롤러)

> **검색 명령**: `rg -n "@PreAuthorize" src/main/java/com/coresolution/core/controller`

| # | 파일 | 라인 | 현 가드 | 비고 |
|---|------|------|---------|------|
| 1 | `PiiKeyRotationAdminController.java` | 54 (class) | `hasRole('ADMIN')` | ✅ **Phase 1 완료** (PR #362) — KEY/IV 회전 |
| 2 | `SystemMetricsController.java` | 52, 118, 146 | `hasAnyRole('ADMIN','HQ_MASTER')` × 3 | ✅ **Phase 2 완료** (PR #370) |
| 3 | `SecurityAuditController.java` | 51, 96, 165, 241 | `hasAnyRole('ADMIN','HQ_MASTER')` × 4 | ✅ **Phase 3 완료** (PR #373) |
| 4 | `SchedulerMonitoringController.java` | 51, 96, 159, 238 | `hasAnyRole('ADMIN','HQ_MASTER')` × 4 | ✅ **Phase 2 완료** (PR #370) |
| 5 | `AIMonitoringController.java` | 56, 102, 147, 196, 253, 311 | `hasAnyRole('ADMIN','HQ_MASTER')` × 6 | ✅ **Phase 2 완료** (PR #370) |
| 6 | `SuperAdminTenantComponentController.java` | 31 (class) | `hasRole('SUPER_ADMIN')` | ✅ **Phase 4 완료** (PR #375) |
| 7 | `BrandingController.java` | 81, 139, 168 (특정 테넌트 변형) | `hasRole('ADMIN')` + `TenantContextHolder` 자체 검증 | **이미 PR-2/9 패턴 적용** — 표본·참고 (변경 대상 아님) |
| 8 | `MonitoringController.java` | 32 (class) | `hasRole('ADMIN')` | Phase 2 — 검토 후 OPS 로 격상 여부 결정 |
| 9 | `TenantDisplayNameController.java` | 60 | `hasRole('ADMIN') or hasRole('OPS')` | **이미 OPS 동시 가드 적용 — 기존 패턴 표본** |
| 10 | `TenantPgConfigurationController.java` | 39 (class) | `isAuthenticated()` | Phase 검토 — 가드 위치 재정의 필요 |
| 11 | `TenantComponentController.java` | 29 (class) | `isAuthenticated()` | Phase 검토 — 가드 위치 재정의 필요 |
| 12 | `ErdController.java` | 37 (class) | `isAuthenticated()` | Phase 검토 (ERD = 운영용?) |

**소계**: PII 1건 + HQ_MASTER 잔존 17 표현식 (4 컨트롤러) + SUPER_ADMIN 1건 + 검토 4건 = **8 파일, 표현식 ~22건**.

### 2.2 BE — Ops Portal 기존 영역 (`controller/ops/` — Ops Portal MVP)

> 이미 분리되어 있는 Ops Portal 전용 컨트롤러 — 본 마이그의 **참고 표본** (변경 대상 아님)

```
src/main/java/com/coresolution/core/controller/ops/
├─ DashboardOpsController.java
├─ ErdOpsController.java
├─ FeatureFlagOpsController.java
├─ PricingPlanOpsController.java
├─ TenantOpsController.java
└─ TenantPgConfigurationOpsController.java
```

이들은 `OpsPermissionUtils.requireAdminOrOps()` 패턴 + `/api/v1/ops/...` 경로 사용. **Phase 5 (별도 도메인 옵션 채택 시)** 이 영역과 합쳐서 운영하는 것을 검토.

### 2.3 BE — Service / Filter / Util / Constant 레이어

> **검색 명령**: `rg -n "HQ_MASTER|ROLE_HQ|isHqMaster" src/main/java`

| # | 파일 | 라인 | 내용 | 처리 |
|---|------|------|------|------|
| 1 | `core/context/TenantContext.java` | 108 | 주석 — `HQ_MASTER` 본사 관리자 설명 | ⏸ Phase 6 보류 — 주석 잔존 무영향 (실코드 0건) |
| 2 | `core/constants/SecurityRoleConstants.java` | 26, 34 | `ROLE_HQ_ADMIN`, `ACTOR_ROLE_HQ_ADMIN` 상수 | **유지** — 인프라 SSOT |
| 3 | `consultation/util/AdminRoleUtils.java` | 12, 102 | `isHqMaster(User user)` 메서드 | ✅ **Phase 4 확인** — 이미 deprecated + 사용처 0건 (PR #375) |
| 4 | `consultation/service/impl/UserProfileServiceImpl.java` | 833 | 주석만 | 주석 정리 (Phase 6) |
| 5 | `consultation/service/impl/SuperAdminServiceImpl.java` | 69, 108 | 주석만 | 주석 정리 (Phase 6) |
| 6 | `consultation/service/impl/SecurityAlertServiceImpl.java` | 174 | 주석만 | 주석 정리 (Phase 6) |
| 7 | `consultation/service/impl/PermissionInitializationServiceImpl.java` | 147 | 주석만 | 주석 정리 (Phase 6) |
| 8 | `consultation/service/impl/ErpServiceImpl.java` | 315, 352, 403, 1183, 1190, 1197, 1239 | 주석만 (`HQ_MASTER_APPROVED → ADMIN_APPROVED` 통합 기록) | **유지** (이력 가치) |
| 9 | `consultation/service/impl/DynamicPermissionServiceImpl.java` | 861-863 | **HQ_MASTER 분기 실코드 (모든 API 접근 허용)** | ✅ **Phase 4 완료** (PR #375) — `API_ACCESS_ALL` 권한 코드 기반으로 명확화, 주석 정리 |
| 12-bis | `consultation/constant/PermissionMatrix.java` | 260 | 주석 + 분기 | ✅ **Phase 4 완료** (PR #375) — 와일드카드 `/api/**` 패턴으로 명확화, 주석 정리 |
| 10 | `consultation/controller/SuperAdminController.java` | 149 | 주석만 | 주석 정리 (Phase 6) |
| 11 | `consultation/constant/UserRole.java` | 161 | `fromString` 에서 `case "HQ_MASTER"` 매핑 | **유지** — `mapLegacyRole` 호환 |
| 12 | `consultation/constant/PermissionMatrix.java` | 260 | 주석 + 분기 | **Phase 4 검토** |
| 13 | `consultation/config/filter/JwtAuthenticationFilter.java` | 257, 290-294 | **STAFF → ROLE_ADMIN + ROLE_OPS** (P0 발견), HQ actorRole → ROLE_OPS | ✅ **Phase 1b 완료** (PR #361 / #374) — STAFF 의 ROLE_OPS 부여 제거, actorRole 기반만 유지 |

### 2.4 FE — `frontend/src` (역할 가드 직접 비교)

> **검색 명령**: `rg -n "HQ_MASTER|ROLE_HQ|SUPER_ADMIN" frontend/src --type js --type ts`

#### 2.4.1 핵심 SSOT 헬퍼 (변경 대상 아님 — 호환 매핑 유지)

| # | 파일 | 라인 | 비고 |
|---|------|------|------|
| 1 | `frontend/src/utils/RoleUtils.js` | 56-61 | `LEGACY_ROLE_TO_SSOT` 테이블 (HQ_MASTER → ADMIN) — **유지** |
| 2 | `frontend/src/constants/roles.js` | 31-86 | `USER_ROLES` / `LEGACY_USER_ROLES` — **유지** |
| 3 | `frontend/src/utils/scheduleRoleGuards.js` | 7-22 | 레거시 호환 — 유지 |
| 4 | `frontend/src/utils/__tests__/RoleUtils.test.js` | 47-178 | 호환 매핑 테스트 — **유지** (강제 회귀 방어) |

#### 2.4.2 위젯 가드 — **인라인 비교** 잔존 (정리 대상)

| # | 파일 | 라인 | 현 패턴 | 처리 |
|---|------|------|---------|------|
| 1 | `dashboard/widgets/erp/ErpManagementGridWidget.js` | 125, 135, 145, 155, 165, 175, 185, 195 | `roles: [..., LEGACY_USER_ROLES.HQ_MASTER]` × 8 | ✅ **Phase 5 완료** (PR #378) — HQ_MASTER 제거 + RoleUtils 정규화 위임 |
| 2 | `constants/quickActionsConfig.js` | 120, 128, 136, 166 | `roles: [..., LEGACY_USER_ROLES.HQ_MASTER]` × 4 | ✅ **Phase 5 완료** (PR #378) |
| 3 | `utils/lnbMenuUtils.js` | 21-26 | LEGACY 역할 배열 (HQ_MASTER 포함) | ⏸ 보류 — CONSULTANT 폴백 차단 의도로 유지 (Phase 5 결정) |
| 4 | `utils/session.js` | 262-267 | 대시보드 라우팅 매핑 (HQ_MASTER) | ⏸ 보류 — 캐시된 세션 호환 위해 유지 (Phase 5 결정) |
| 5 | `utils/dashboardUtils.js` | 178-183 | 동일 매핑 | ⏸ 보류 — 캐시된 세션 호환 위해 유지 (Phase 5 결정) |
| 6 | `components/dashboard/widgets/admin/*Widget.js` | 주석만 (5 파일) | "레거시 HQ_MASTER 도 매핑됨" 주석 | 주석 갱신 (Phase 6) |

#### 2.4.3 Ops Portal 진입점 (현 FE)

| # | 파일 | 라인 | 비고 |
|---|------|------|------|
| 1 | `components/super-admin/SuperAdminTenantComponentPage.js` | 137 | `user?.role !== SUPER_ADMIN_ROLE` 인라인 비교 | **Phase 4 — `frontend-ops`(별도) 로 이관 검토** |
| 2 | `components/erp/SuperAdminApprovalDashboard.js` | — | ERP Super Admin 승인 화면 | Phase 4 분석 필요 |
| 3 | `components/layout/SimpleHamburgerMenu.js` | 303-304 | 햄버거 메뉴 표시명 (i18n) | Phase 5 |
| 4 | `App.js` | 149, 518, 520 | `SUPER_ADMIN_ROUTES.TENANT_COMPONENTS` 라우트 | Phase 4 |
| 5 | `constants/superAdminRoutes.js` | 10-13 | `SUPER_ADMIN_ROUTES` SSOT | Phase 4 |

### 2.5 FE — `frontend-ops/` (Ops Portal MVP 별도 앱)

> 이미 별도 Next.js 앱으로 분리되어 있음. **마이그 후 PII 회전 / 보안 감사 / 시스템 모니터링 UI 를 이 앱으로 이관** 하는 것이 옵션 3 의 핵심.

```
frontend-ops/
├─ app/                    # Next.js App Router
├─ src/components/
│  ├─ auth/                # LoginForm, LogoutButton
│  ├─ onboarding/          # 온보딩 카드
│  ├─ pricing/             # 요금제·애드온
│  └─ feature-flags/       # Feature Flag
└─ src/services/           # OPS_API_PATHS, authApi
```

### 2.6 BE — `backend-ops/` (Ops Portal MVP 별도 앱)

```
backend-ops/src/main/java/com/mindgarden/ops/
├─ OpsPortalApplication.java   # SpringBoot main (port 8081 local, 8080 dev/prod)
├─ config/                     # SecurityConfig (CORS)
├─ constants/                  # OpsConstants
├─ controller/                 # 온보딩·요금제·Feature Flag·테넌트
├─ domain/                     # Onboarding·Pricing·FeatureFlag·Tenant
├─ exception/                  # GlobalExceptionHandler, ErrorResponse
├─ repository/                 # JPA
└─ service/                    # Onboarding·Pricing·FeatureFlag
```

**중요**: 이 앱은 현재 PII 회전 / 보안 감사 / 시스템 메트릭 / 스케줄러 / AI 모니터링 컨트롤러를 **포함하지 않는다**. 옵션 3(별도 도메인) 또는 옵션 4(별도 BE 서비스) 채택 시 이쪽으로 이관해야 함.

### 2.7 합계

| 영역 | 변경 대상 표현식 수 | 변경 대상 파일 수 |
|------|---------------------|-------------------|
| BE 컨트롤러 `@PreAuthorize` | 22 표현식 (4컨트롤러 OPS 격상 + PII 1 + SuperAdmin 1) | 6 |
| BE 서비스·필터·유틸 (실코드) | 2 (DynamicPermission, JwtAuthenticationFilter STAFF P0) | 2 |
| BE 주석·문서 정리 | 7 (주석/상수 — 운영 무영향) | 7 |
| FE 위젯·메뉴·세션 가드 | 16 (LEGACY 배열 / 라우팅 매핑) | 6 |
| FE Ops Portal 이관 (옵션 3) | 4 (SuperAdmin 컴포넌트군) | 4 |
| DB / Flyway | 0 (스키마 무변경) | 0 |
| 표준 / 런북 / 문서 | 4 (`ROLE_STANDARD.md`, `OPS_PORTAL_STANDARD.md`, `SECRET_ROTATION_POLICY.md`, 본 계획서) | 4 |
| **합계** | **~55** | **~29** |

> 위 수치는 단순 검색 기반 1차 추정 — 각 Phase core-coder 위임 시 정밀 검증으로 갱신.

---

## 3. Ops 권한 표현 옵션 (3종 비교 + 권장안)

본 절은 §1.3 사용자 권한 구조(테넌트 / 온보딩 / Ops 3종) 을 코드로 표현하는 SSOT 후보 3종을 비교한다. **사용자 결정 게이트 §7** 에서 최종 선택.

### 3.1 옵션 1 — 테넌트 가드 (HQ_TENANT_ID 일치 검증)

**개요**: `@PreAuthorize("hasRole('ADMIN')")` 유지 + 컨트롤러 메서드 진입부에 `TenantContextHolder.getRequiredTenantId().equals(HQ_TENANT_ID)` 검증을 명시. `BrandingController` 의 `getBrandingInfoByTenantId` 패턴(§3.2 표본)을 그대로 차용.

**예시**:

```java
@PostMapping("/start")
@PreAuthorize("hasRole('ADMIN')")
public ResponseEntity<...> start(...) {
    String currentTenant = TenantContextHolder.getRequiredTenantId();
    if (!OpsTenantConstants.HQ_TENANT_ID.equals(currentTenant)) {
        log.warn("[PII-ROTATE] 외부 테넌트 접근 차단 — current={}", LogSanitizer.forLog(currentTenant));
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(ApiResponse.error("Ops 권한 없음"));
    }
    // ... 기존 로직
}
```

**장점**:
- ✅ **`ROLE_STANDARD.md` §3 만 사용** — 신규 `hasRole('OPS')` 또는 enum 추가 0건
- ✅ 코드 변경 최소 (메서드별 가드 추가만)
- ✅ HQ 테넌트 ID 가 SSOT → 운영 환경별 환경변수로 분리 가능
- ✅ 기존 `BrandingController` 표본과 동일 (학습 비용 0)

**단점**:
- ❌ 모든 Ops 컨트롤러에 가드 분기를 **반복 작성** 해야 함 (DRY 위반)
- ❌ AOP 또는 어노테이션 없이 검증 누락 위험 (회귀 PR 마다 리뷰 필수)
- ❌ HQ 테넌트 ID 가 환경변수 미설정 시 fail-open 위험

**리스크**:
- HQ_TENANT_ID 의 운영 DB·dev DB·local DB 값이 일치해야 함 (테스트 환경마다 다를 수 있음)
- 다중 본사(HQ Korea + HQ Japan 등) 확장 시 List<String> 으로 SSOT 확장 필요

### 3.2 옵션 2 — 권한 코드 (`role_permissions`) — `OPS_PII_ROTATE`, `OPS_SECURITY_AUDIT` 등

**개요**: 기존 `role_permissions` 테이블에 `OPS_*` 권한 코드를 추가하고, 컨트롤러에서 `@PreAuthorize("hasAuthority('OPS_PII_ROTATE')")` 형태로 가드. 권한 코드는 DB·관리 UI 로 동적 부여.

**예시**:

```java
@PostMapping("/start")
@PreAuthorize("hasAuthority('OPS_PII_ROTATE')")
public ResponseEntity<...> start(...) { ... }
```

```sql
-- role_permissions seed (HQ_TENANT_ID 에만 부여)
INSERT INTO role_permissions (tenant_id, role, permission_code)
VALUES ('mindgarden-hq-tenant-id', 'ADMIN', 'OPS_PII_ROTATE');
```

**장점**:
- ✅ 권한 묶음을 DB 로 관리 → 코드 변경 없이 권한 부여·박탈 가능
- ✅ 세밀한 권한 (예: PII 회전만 / 보안 감사만) 분리 가능
- ✅ 기존 `role_permissions` 인프라 재사용
- ✅ `ROLE_STANDARD.md` §6.1 §1 의 "권한 코드 추가" 패턴과 정합

**단점**:
- ❌ `hasAuthority(...)` 사용 — `ROLE_STANDARD.md` §3.1 의 "`hasAuthority('ROLE_…')` 금지" 와 미묘하게 충돌 (단, 금지는 `ROLE_` 접두사 한정 → 권한 코드는 허용 영역)
- ❌ 권한 부여 UI / 운영 절차가 추가로 필요
- ❌ DB seed 실수 시 fail-open 위험 (외부 테넌트 ADMIN 에게 OPS_* 부여 사고)
- ❌ 권한 18종 (Phase 1~Phase 5) 을 일일이 seed 해야 함

**리스크**:
- Spring Security `hasAuthority` vs `hasRole` 의 미묘한 차이 — 운영자 교육 필요
- 권한 코드 네이밍 SSOT (`OPS_PII_ROTATE` 표기) 의 일관성 강제 필요

### 3.3 옵션 3 — 별도 도메인 (`ops.e-trinity.co.kr`) + `ROLE_OPS` Authority

**개요**: 기존 인프라(`SecurityRoleConstants.ROLE_OPS` + `OpsPermissionUtils.requireAdminOrOps()` + `frontend-ops` / `backend-ops` 별도 앱) 를 활용. JWT 의 `actorRole` 이 `HQ_ADMIN` / `SUPER_HQ_ADMIN` / `OPS` 일 때만 `ROLE_OPS` Authority 부여 (`JwtAuthenticationFilter#createAuthoritiesFromActorRole` §289-313). 컨트롤러는 `@PreAuthorize("hasRole('OPS')")` 사용.

**예시**:

```java
@PostMapping("/start")
@PreAuthorize("hasRole('OPS')")
public ResponseEntity<...> start(...) { ... }
```

**핵심 인프라 — 이미 구축됨**:

```26:34:src/main/java/com/coresolution/core/constants/SecurityRoleConstants.java
public static final String ROLE_HQ_ADMIN = "ROLE_HQ_ADMIN";
public static final String ROLE_OPS = "ROLE_OPS";

public static final String ACTOR_ROLE_HQ_ADMIN = "HQ_ADMIN";
public static final String ACTOR_ROLE_SUPER_HQ_ADMIN = "SUPER_HQ_ADMIN";
public static final String ACTOR_ROLE_OPS = "OPS";
```

```289-313:src/main/java/com/coresolution/consultation/config/filter/JwtAuthenticationFilter.java
if (SecurityRoleConstants.ACTOR_ROLE_HQ_ADMIN.equals(normalizedRole)
        || SecurityRoleConstants.ACTOR_ROLE_SUPER_HQ_ADMIN.equals(normalizedRole)) {
    authorities.add(new SimpleGrantedAuthority(SecurityRoleConstants.ROLE_ADMIN));
    authorities.add(new SimpleGrantedAuthority(SecurityRoleConstants.ROLE_OPS));
    authorities.add(new SimpleGrantedAuthority(SecurityRoleConstants.ROLE_HQ_ADMIN));
}
```

**장점**:
- ✅ **인프라 0 추가** — `ROLE_OPS`, `OpsPermissionUtils`, `frontend-ops`/`backend-ops` 모두 이미 존재
- ✅ `ROLE_STANDARD.md` §6.1 §3 가 정확히 가리키는 "Ops Portal 분리" 표준
- ✅ JWT `actorRole` 기반 → 외부 테넌트 ADMIN 토큰은 자동 차단 (actorRole 이 `ADMIN` 일 뿐 `HQ_ADMIN` 이 아님)
- ✅ `frontend-ops` 별도 앱으로 권한 침범 표면 자체가 다름 (CORS·도메인 분리)
- ✅ Ops 운영팀 계정은 **`users` 테이블에 없을 수도** 있는 별도 Ops 계정으로 운영 가능 (`createAuthoritiesFromActorRole` 분기)

**단점**:
- ⚠️ **`ROLE_STANDARD.md` §3 가 4종 SSOT (`ADMIN/STAFF/CONSULTANT/CLIENT`) 만 `hasRole` 인자 허용** → `hasRole('OPS')` 는 표준 갱신 필요 (§6.3 절차)
- ⚠️ STAFF 가 `ROLE_OPS` 를 갖는 **기존 버그(JwtAuthenticationFilter:257)** 가 옵션 3 채택 시 즉시 노출 — Phase 1b 필수
- ⚠️ Ops Portal 별도 도메인 진입점 / 로그인 / 세션 분리 — UX 동선 별도 설계 필요
- ⚠️ 마이그 기간 동안 본 서비스(`*.e-trinity.co.kr`) 에서 호출하던 HQ 사용자가 `ops.e-trinity.co.kr` 로 이동 필요

**리스크**:
- 도메인 분리 후 본 서비스 URL 즐겨찾기·Discord 알림 링크 등의 마이그 일정 관리
- `frontend-ops` 가 Next.js / `frontend/` 가 Webpack CRA → 디자인 토큰·공통 컴포넌트 동기화 비용

### 3.4 옵션 4 — 별도 BE 서비스 (`ops-portal-service` 마이크로서비스)

**개요**: 옵션 3 + 백엔드도 **물리적으로 분리** (별도 JVM, 별도 DB read-replica). 본 서비스(`coresolution`) 의 모든 Ops 컨트롤러를 `backend-ops` 로 이관하고 본 서비스는 더 이상 Ops API 를 노출하지 않음.

**장점**:
- ✅ 물리적 격리 — 본 서비스 침해 시 Ops API 가 따로 동작
- ✅ Ops 만의 종속성·라이브러리 분리 가능 (예: PII 회전 라이브러리)
- ✅ 운영 모니터링·알람을 Ops 만 별도 채널로 분리 가능

**단점**:
- ❌ **이관 비용 큼** — PII 회전 / 보안 감사 / 시스템 메트릭 / 스케줄러 모두 본 서비스 DB·Bean·Scheduler 와 강결합
- ❌ 트랜잭션·DB 접근 SSOT 가 깨짐 (cross-service 호출 필요)
- ❌ 기존 `backend-ops` MVP 가 가벼운 온보딩·요금제 위주로 설계됨 → PII 회전급 무거운 컨트롤러 이관 시 재설계 필요
- ❌ 운영 인프라(ArgoCD·systemd·CI) 2배 부담

**리스크**:
- 마이그 일정 수개월 + 운영 영향 큼
- 본 계획서 범위(HQ_MASTER 18건 가드 분리) 와 스코프 불일치 (별도 프로젝트화 필요)

### 3.5 비교 표 + 권장안

| 항목 | 옵션 1 (테넌트 가드) | 옵션 2 (권한 코드) | **옵션 3 (별도 도메인 + ROLE_OPS)** ⭐ | 옵션 4 (별도 BE 서비스) |
|------|----------------------|--------------------|----------------------------------------|--------------------------|
| 표준 정합 (`ROLE_STANDARD.md`) | ✅ §3 100% | ⚠️ §3.1 미묘 충돌 | ⚠️ §3 갱신 필요 (§6.1 §3 가 명시 — 인정 범위) | ✅ (별도 도메인) |
| 기존 인프라 재사용 | ✅ `TenantContextHolder` | ⚠️ `role_permissions` 확장 | ✅ **`ROLE_OPS` + Ops 앱 모두 존재** | ❌ 신규 BE 필요 |
| 신규 enum / `UserRole` 추가 | 0 | 0 | 0 (Authority 만 — enum 아님) | 0 |
| 외부 테넌트 ADMIN 차단 | ✅ (가드 누락 안 했을 때) | ✅ (seed 정확할 때) | ✅ **자동** (actorRole 분기) | ✅ (도메인 차단) |
| Phase 분리 / 운영 영향 | 소 (메서드별 가드) | 중 (DB seed + 가드) | **중 (가드 + 도메인 이관)** | 대 (재설계) |
| 권한 부여 운영 | 코드 변경 | DB 변경 | **계정 발급 (HQ_ADMIN 추가)** | 별도 시스템 |
| 사고 시 영향 범위 (fail-open) | 메서드 단위 | 컨트롤러 단위 | **도메인 단위 (격리 강함)** | 서비스 단위 |
| 마이그 기간 | 1주 (Phase 1~6) | 2~3주 | **2주 (Phase 1~5 + 도메인 이관)** | 1~2개월 |

#### 3.5.1 권장안 — **옵션 3 (별도 도메인 + `ROLE_OPS` Authority)** ⭐

근거:

1. **인프라 0 추가** — `SecurityRoleConstants.ROLE_OPS`, `OpsPermissionUtils`, `frontend-ops`, `backend-ops` 모두 이미 운영 중. `ROLE_STANDARD.md` §6.1 §3 가 정확히 가리키는 표준.
2. **자동 차단** — JWT `actorRole=ADMIN` (외부 테넌트) 은 `ROLE_OPS` 를 받지 못함 (`JwtAuthenticationFilter:296` 참조 — 단, **STAFF P0 버그 §5 별도 해결 필수**).
3. **격리 강함** — 도메인 분리(`ops.e-trinity.co.kr`) + CORS 분리 → 본 서비스 침해와 무관하게 Ops 영역 보호.
4. **§6.1 §3 표준 명시** — 표준 자체가 "ops-portal-migration" 키워드로 본 작업을 후속 PR 로 지정함.
5. **하이브리드 가능** — 옵션 1(테넌트 가드) 를 **추가 안전망** 으로 병행하면 fail-safe 두 겹.

#### 3.5.2 보조 권장 — **옵션 1 하이브리드 (Defense in Depth)**

옵션 3 (`hasRole('OPS')`) + 옵션 1 (`HQ_TENANT_ID` 검증) 를 **AND** 로 적용. 컨트롤러 베이스 클래스 `OpsBaseController` 에 자체 검증을 두면 DRY 위반 없이 두 겹 가드 가능.

### 3.6 ROLE_STANDARD.md §3 표준 갱신 제안

옵션 3 채택 시 `ROLE_STANDARD.md` §3 에 다음 한 줄 추가:

> #### 3.3 Ops Portal 전용 가드
>
> `hasRole('OPS')` 는 4종 SSOT 의 **확장 Authority** 이며, **`UserRole` enum 이 아니다**. `JwtAuthenticationFilter#createAuthoritiesFromActorRole` 가 JWT `actorRole=HQ_ADMIN|SUPER_HQ_ADMIN|OPS` 일 때만 부여한다. **테넌트 ADMIN/STAFF 의 JWT 에는 부여되지 않음을 보장한다** (Phase 1b 회귀 테스트).

---

## 4. 분배실행 — Phase 별 PR

각 Phase 는 **단일 PR 권장** (변경 영향 격리 + 회귀 격리). Phase 의존성 그래프:

```
Phase 1  ─┬─ Phase 2 ─┐
         │            ├─ Phase 5 ─ Phase 6
         └─ Phase 1b ─┤
              Phase 3 ┤
              Phase 4 ┘
```

| Phase | 우선순위 | 범위 | 담당 | PR 단독 여부 |
|-------|----------|------|------|--------------|
| **1** | P0 | PII 회전 컨트롤러 (1 파일) | core-coder | ✅ 단독 PR |
| **1b** | P0 | JwtAuthenticationFilter STAFF → ROLE_OPS 버그 정정 | core-coder | ✅ 단독 PR (보안 P0) |
| **2** | P1 | 시스템 모니터링 (AIMonitoring, SystemMetrics, SchedulerMonitoring) | core-coder | ✅ 단독 PR |
| **3** | P1 | 보안·감사 (SecurityAudit) | core-coder | ✅ 단독 PR |
| **4** | P2 | 테넌트 관리 (SuperAdminTenantComponent, DynamicPermission HQ_MASTER 분기) | core-coder | ✅ 단독 PR |
| **5** | P2 | FE 메뉴·라우트 정리 (위젯·세션·LNB) | core-coder | ✅ 단독 PR |
| **6** | P3 | 문서 / 런북 / 표준 SSOT 갱신 (`ROLE_STANDARD.md` §3.3 추가 등) | core-coder | ✅ 단독 PR |

### 4.1 Phase 1 — PII 회전 컨트롤러 단독 (P0)

**담당**: `core-coder`
**브랜치 예시**: `fix/ops-portal-phase1-pii-rotation-ops-guard`

**범위**:

| 파일 | 라인 | 변경 |
|------|------|------|
| `src/main/java/com/coresolution/core/controller/PiiKeyRotationAdminController.java` | 54 | `@PreAuthorize("hasRole('ADMIN')")` → `@PreAuthorize("hasRole('OPS')")` + 메서드별 `TenantContextHolder` HQ 검증 |
| `src/test/java/com/coresolution/core/controller/PiiKeyRotationAdminControllerTest.java` | 전체 | OPS 가드 회귀 테스트 추가 (ADMIN 단독 토큰 → 403, HQ_ADMIN actorRole 토큰 → 200) |
| `docs/standards/PII_KEY_ROTATION_REENCRYPTION_DESIGN.md` | §3.2.4 | 가드 변경 반영 |
| `docs/standards/SECRET_ROTATION_POLICY.md` | §3.4 | 동일 |

**완료 조건**:

- [ ] `@PreAuthorize` 가 `hasRole('OPS')` 단일 사용
- [ ] 메서드 진입부 `TenantContextHolder.getRequiredTenantId().equals(HQ_TENANT_ID)` 자체 검증 (옵션 3 + 옵션 1 하이브리드)
- [ ] 테스트: ADMIN actorRole 토큰 → 403, HQ_ADMIN/SUPER_HQ_ADMIN actorRole 토큰 → 200
- [ ] `frontend/src/components/admin/PiiKeyRotationManagement*.js` 등 호출자 영향 0 (호출자 자체가 Ops 전용 영역)
- [ ] 로컬 빌드·테스트 OK
- [ ] 기존 `core-coder` 작업 흐름: 표준 인용 + `core-tester` 게이트

**테스트 항목**:

| # | 시나리오 | 기대 |
|---|---------|------|
| 1 | 외부 테넌트 ADMIN 토큰 → POST /api/v1/admin/pii-rotation/start | 403 (ROLE_OPS 없음) |
| 2 | 외부 테넌트 STAFF 토큰 → POST /api/v1/admin/pii-rotation/start | 403 (Phase 1b 후) |
| 3 | HQ_ADMIN actorRole 토큰 + HQ tenantId → POST /api/v1/admin/pii-rotation/start | 200 |
| 4 | SUPER_HQ_ADMIN actorRole 토큰 + HQ tenantId → POST /api/v1/admin/pii-rotation/start | 200 |
| 5 | HQ_ADMIN actorRole 토큰 + **외부** tenantId → POST /api/v1/admin/pii-rotation/start | 403 (옵션 1 하이브리드 검증) |
| 6 | 무인증 토큰 → POST /api/v1/admin/pii-rotation/start | 401 |
| 7 | OPS actorRole 토큰 (Ops Portal 전용 계정) → progress 조회 | 200 |
| 8 | 4종 SSOT 회귀: `hasRole('OPS')` 표현식이 `UserRole.java` enum 에 추가되지 않음 확인 (CI grep 게이트) | 0건 |

**검증 체크리스트**:

- [ ] `rg "hasRole.*ADMIN" src/main/java/com/coresolution/core/controller/PiiKeyRotationAdminController.java` → 0 (또는 명시적 OPS 만)
- [ ] `rg "@PreAuthorize" src/main/java/com/coresolution/core/controller/PiiKeyRotationAdminController.java` → 1 (class 레벨 + 메서드 레벨 추가 가능)
- [ ] 단위 테스트 회귀 8건 통과
- [ ] `docs/standards/PII_KEY_ROTATION_REENCRYPTION_DESIGN.md` 변경 반영
- [ ] 운영 영향: PII 회전 호출자 = HQ 운영팀 한정 (현재 호출 이력 없음 — `pii_reencryption_progress` 테이블 0 row 확인)

### 4.2 Phase 1b — JwtAuthenticationFilter STAFF P0 정정 (P0)

**담당**: `core-coder`
**브랜치 예시**: `hotfix/jwt-filter-staff-ops-leak-p0`

**핵심 발견**:

```247-258:src/main/java/com/coresolution/consultation/config/filter/JwtAuthenticationFilter.java
case ADMIN:
    authorities.add(new SimpleGrantedAuthority(SecurityRoleConstants.ROLE_ADMIN));
    if (Boolean.TRUE.equals(user.getCounselingEnabled())) {
        authorities.add(new SimpleGrantedAuthority(
                SecurityRoleConstants.ROLE_PREFIX + com.coresolution.consultation.constant.UserRole.CONSULTANT.name()));
    }
    break;
case STAFF:
    authorities.add(new SimpleGrantedAuthority(SecurityRoleConstants.ROLE_ADMIN));   // ← P0: STAFF 가 ROLE_ADMIN 받음
    authorities.add(new SimpleGrantedAuthority(SecurityRoleConstants.ROLE_OPS));     // ← P0: STAFF 가 ROLE_OPS 받음
    break;
```

**문제**:

1. STAFF 가 `ROLE_ADMIN` 을 자동 부여받음 → ADMIN 전용 컨트롤러를 호출 가능 (`BrandingController#updateBrandingInfo` 등은 `hasAnyRole('ADMIN','STAFF')` 이지만, `hasRole('ADMIN')` 단독 가드는 통과됨)
2. STAFF 가 `ROLE_OPS` 를 자동 부여받음 → 옵션 3 채택 시 STAFF 가 Ops 전용 컨트롤러를 호출 가능
3. ADMIN 케이스에는 정상적으로 `ROLE_ADMIN` 만 부여됨 — STAFF 케이스가 의도와 다르게 ADMIN 권한을 가져옴

**범위**:

| 파일 | 라인 | 변경 |
|------|------|------|
| `src/main/java/com/coresolution/consultation/config/filter/JwtAuthenticationFilter.java` | 255-258 | `case STAFF:` 에서 `ROLE_ADMIN` 제거. `ROLE_OPS` 도 제거 (Ops 권한은 actorRole 분기로만). `ROLE_STAFF` 단독 부여로 변경 |
| 테스트 | 신규 | STAFF 토큰이 ADMIN 전용 컨트롤러 403, OPS 전용 컨트롤러 403 회귀 |

**완료 조건**:

- [ ] STAFF user → ROLE_STAFF only (또는 명시적으로 보조 권한 시 별도 검토)
- [ ] BrandingController#getBrandingInfo (`hasAnyRole('ADMIN','STAFF')`) 는 정상 작동
- [ ] BrandingController#getBrandingInfoByTenantId (`hasRole('ADMIN')`) 는 STAFF 토큰 시 403
- [ ] PII 회전 (`hasRole('OPS')`) 는 STAFF 토큰 시 403
- [ ] 기존 STAFF 사용자의 일반 운영 시나리오 회귀 테스트 (예약·일정·매핑) 통과

**리스크**:

- STAFF 가 ADMIN 권한으로 동작하던 기능이 실제로 있다면 회귀 발생 가능 — Phase 1b 시작 전 **운영 로그에서 STAFF actor 의 ADMIN 전용 API 호출 이력 분석** 선행
- `core-debugger` 위임으로 사전 분석 1일 권장 (§4.2.1)

#### 4.2.1 Phase 1b 선행 분석 (core-debugger 위임)

**프롬프트 요지**:

```
대상: src/main/java/com/coresolution/consultation/config/filter/JwtAuthenticationFilter.java#255-258
질문 1: STAFF user 가 ROLE_ADMIN 을 받아야 하는 비즈니스 정당성이 있는가?
질문 2: STAFF user 가 ROLE_OPS 를 받아야 하는 비즈니스 정당성이 있는가?
질문 3: 운영 로그에서 STAFF user 가 ADMIN 전용 API (`hasRole('ADMIN')` 단독 가드) 를 호출한 이력이 있는가? 있다면 어떤 API 인가?
참조: docs/standards/ROLE_STANDARD.md §2.2, §3
```

### 4.3 Phase 2 — 시스템 모니터링 (P1)

**담당**: `core-coder`
**브랜치 예시**: `chore/ops-portal-phase2-monitoring-ops-guard`

**범위**:

| 파일 | 라인 | 변경 (옵션 3 + 옵션 1 하이브리드) |
|------|------|-------------------------------------|
| `core/controller/AIMonitoringController.java` | 56, 102, 147, 196, 253, 311 | `hasAnyRole('ADMIN','HQ_MASTER')` → `hasRole('OPS')` (×6) |
| `core/controller/SystemMetricsController.java` | 52, 118, 146 | 동일 (×3) |
| `core/controller/SchedulerMonitoringController.java` | 51, 96, 159, 238 | 동일 (×4) |
| `core/controller/MonitoringController.java` | 32 (class) | `hasRole('ADMIN')` → `hasRole('OPS')` (검토 후 결정) |
| 테스트 | 회귀 | 외부 ADMIN/STAFF 토큰 → 403, HQ_ADMIN actorRole → 200 |

**완료 조건**:

- [ ] 4 컨트롤러에서 `HQ_MASTER` 표현식 0건 (총 17개 → 0)
- [ ] `hasRole('OPS')` 단일 사용
- [ ] 회귀 테스트: 컨트롤러별 4 시나리오 × 4 컨트롤러 = 16건
- [ ] `frontend/src/components/dashboard/widgets/admin/AIMonitoringWidget.js` 등 호출자 영향 0 또는 별도 위젯 가드 갱신 (Phase 5 로 이관)

### 4.4 Phase 3 — 보안·감사 (P1)

**담당**: `core-coder`
**브랜치 예시**: `chore/ops-portal-phase3-security-audit-ops-guard`

**범위**:

| 파일 | 라인 | 변경 |
|------|------|------|
| `core/controller/SecurityAuditController.java` | 51, 96, 165, 241 | `hasAnyRole('ADMIN','HQ_MASTER')` → `hasRole('OPS')` (×4) |
| 테스트 | 회귀 | 동일 패턴 |

### 4.5 Phase 4 — 테넌트 관리 + Dynamic Permission 정리 (P2)

**담당**: `core-coder`
**브랜치 예시**: `chore/ops-portal-phase4-super-admin-tenant-component`

**범위**:

| 파일 | 라인 | 변경 |
|------|------|------|
| `core/controller/SuperAdminTenantComponentController.java` | 31 | `hasRole('SUPER_ADMIN')` → `hasRole('OPS')` |
| `consultation/service/impl/DynamicPermissionServiceImpl.java` | 861-863 | `HQ_MASTER` 분기 제거 (deprecated) |
| `consultation/util/AdminRoleUtils.java` | 102 | `isHqMaster(User user)` deprecated 처리 + 사용처 grep 정리 |
| `consultation/constant/PermissionMatrix.java` | 260 | 검토 후 결정 (HQ_MASTER 분기) |
| `frontend/src/components/super-admin/SuperAdminTenantComponentPage.js` | 137 | `user?.role !== SUPER_ADMIN_ROLE` → Ops Portal 이관 검토 OR `isOps` 헬퍼 신설 |
| 테스트 | 회귀 | SUPER_ADMIN → OPS 매핑 회귀 |

### 4.6 Phase 5 — FE 메뉴·라우트·세션 정리 (P2)

**담당**: `core-coder`
**브랜치 예시**: `chore/ops-portal-phase5-fe-menu-route-cleanup`

**범위**:

| 파일 | 라인 | 변경 |
|------|------|------|
| `frontend/src/components/dashboard/widgets/erp/ErpManagementGridWidget.js` | 125-195 | `LEGACY_USER_ROLES.HQ_MASTER` 직접 비교 → `isAdmin` 헬퍼 (×8) |
| `frontend/src/constants/quickActionsConfig.js` | 120-166 | 동일 (×4) |
| `frontend/src/utils/lnbMenuUtils.js` | 21-26 | LEGACY 역할 배열 정리 |
| `frontend/src/utils/session.js` | 262-267 | HQ_MASTER 라우팅 매핑 → ADMIN 매핑 일관화 |
| `frontend/src/utils/dashboardUtils.js` | 178-183 | 동일 |
| 테스트 | 회귀 | 위젯·메뉴 가시성 단위 테스트 |

### 4.7 Phase 6 — 문서 / 런북 / 표준 SSOT (P3)

**담당**: `core-coder` + `generalPurpose` (문서)
**브랜치 예시**: `docs/ops-portal-migration-standards-update`

**범위**:

| 파일 | 변경 |
|------|------|
| `docs/standards/ROLE_STANDARD.md` | §3.3 Ops Portal 전용 가드 추가 (본 계획서 §3.6) |
| `docs/standards/OPS_PORTAL_STANDARD.md` | §1.4 권한 표준 확장 (`ROLE_OPS` 부여 규칙) |
| `docs/standards/SECRET_ROTATION_POLICY.md` | §3.4 호출자 표준 갱신 (`OPS` 단독) |
| `docs/standards/PII_KEY_ROTATION_REENCRYPTION_DESIGN.md` | §3.2.4 가드 표준 갱신 |
| `docs/project-management/ROLE_SSOT_PR_SERIES_RETROSPECTIVE.md` | PR-10 (ops-portal-migration) 항목 추가 |
| `docs/운영반영/PRE_PRODUCTION_GO_LIVE_CHECKLIST.md` | Ops Portal 가드 회귀 항목 추가 |
| 본 계획서 | 진행 상황 업데이트 (Phase 별 PR URL 머지 SHA 기록) |

---

## 5. 마이그 패턴 (SSOT) — 표준 가드 패턴 코드

### 5.1 컨트롤러 가드 표준 (옵션 3 + 옵션 1 하이브리드)

```java
package com.coresolution.core.controller;

import com.coresolution.core.constants.OpsTenantConstants;
import com.coresolution.core.context.TenantContextHolder;
import com.coresolution.core.util.LogSanitizer;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/admin/ops-something")
@PreAuthorize("hasRole('OPS')")    // ← Layer 1: Spring Security
public class OpsSomethingController extends BaseApiController {

    @PostMapping("/action")
    public ResponseEntity<ApiResponse<Result>> action(@RequestParam String param) {
        // ← Layer 2: 테넌트 가드 (Defense in Depth)
        String currentTenant = TenantContextHolder.getRequiredTenantId();
        if (!OpsTenantConstants.HQ_TENANT_ID.equals(currentTenant)) {
            log.warn("[OPS] 외부 테넌트 차단 — current={}, action=ops-something",
                LogSanitizer.forLog(currentTenant));
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(ApiResponse.error("Ops 권한 없음"));
        }
        // 정상 로직
        return success(result);
    }
}
```

### 5.2 회귀 테스트 표준 패턴

```java
@WebMvcTest(controllers = OpsSomethingController.class)
class OpsSomethingControllerTest {

    @Test
    @WithMockUser(roles = {"ADMIN"})    // 외부 테넌트 ADMIN
    void externalAdminBlocked() throws Exception {
        mockMvc.perform(post("/api/v1/admin/ops-something/action"))
            .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(roles = {"STAFF"})    // 외부 테넌트 STAFF (Phase 1b 후)
    void externalStaffBlocked() throws Exception {
        mockMvc.perform(post("/api/v1/admin/ops-something/action"))
            .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(roles = {"OPS"})    // Ops Portal 운영자
    void opsAllowed_whenHqTenant() throws Exception {
        TenantContextHolder.setTenantId(OpsTenantConstants.HQ_TENANT_ID);
        mockMvc.perform(post("/api/v1/admin/ops-something/action"))
            .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(roles = {"OPS"})    // Ops Portal 운영자가 외부 테넌트로 호출 — fail-safe
    void opsBlocked_whenExternalTenant() throws Exception {
        TenantContextHolder.setTenantId("external-tenant-id");
        mockMvc.perform(post("/api/v1/admin/ops-something/action"))
            .andExpect(status().isForbidden());
    }
}
```

### 5.3 로깅·감사 표준 패턴

- 차단 시: `log.warn("[OPS][BLOCK] reason=external-tenant tenantId={} actorRole={}", ...)`
- 정상 시: `log.info("[OPS][ALLOW] action=pii-rotation-start table={} key={} ...")`
- **민감 값 (PII / token / key) 은 절대 평문 로그 금지** — `LogSanitizer.forLog()` 필수
- 감사 로그(`security_audit_log`) 에 `OPS_*` action 추가 시 Phase 3 (Security Audit) 와 일관성 검토

---

## 6. 테넌트 SSOT — `HQ_TENANT_ID` 식별

### 6.1 현재 마인드가든 본사 테넌트 ID 후보

> ⚠️ **사용자 확인 필요** — 본 계획서가 운영 DB 의 실제 HQ 테넌트 ID 를 직접 알 수 없음

| 후보 | 위치 | 검증 방법 |
|------|------|----------|
| 환경변수 `MINDGARDEN_HQ_TENANT_ID` | application-{env}.yml | 운영 secrets 에 등록 후 주입 (**권장**) |
| DB 조회 `tenants WHERE is_hq = TRUE` | `tenants` 테이블 (스키마 검증 필요) | 시작 시 1회 캐싱 |
| 하드코딩 (`OpsTenantConstants.HQ_TENANT_ID = "mindgarden-hq"`) | `OpsTenantConstants.java` | ❌ 환경별 다른 ID 위험 — 권장하지 않음 |

### 6.2 권장 — `OpsTenantConstants` + 환경변수 주입

```java
package com.coresolution.core.constants;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class OpsTenantConstants {

    /** 본사(코어솔루션) 테넌트 ID — 환경변수 MINDGARDEN_HQ_TENANT_ID 로 주입 */
    public static String HQ_TENANT_ID;

    @Value("${mindgarden.hq.tenant-id}")
    public void setHqTenantId(String hqTenantId) {
        if (hqTenantId == null || hqTenantId.isBlank()) {
            throw new IllegalStateException(
                "mindgarden.hq.tenant-id 환경변수가 설정되지 않음 — Ops Portal 가드 fail-open 위험");
        }
        OpsTenantConstants.HQ_TENANT_ID = hqTenantId;
    }
}
```

```yaml
# application-prod.yml
mindgarden:
  hq:
    tenant-id: ${MINDGARDEN_HQ_TENANT_ID:?MINDGARDEN_HQ_TENANT_ID 환경변수 필수}
```

### 6.3 DB 조회 vs 환경변수 vs 하드코딩 비교

| 항목 | 환경변수 (권장) | DB 조회 (`tenants.is_hq`) | 하드코딩 |
|------|----------------|--------------------------|----------|
| 환경별 분리 | ✅ env 파일 분리 | ⚠️ 동일 DB 사용 시 위험 | ❌ |
| 부팅 fail-fast | ✅ 미설정 시 즉시 fail | ⚠️ schema 의존 | ✅ |
| 운영 변경 | ⚠️ 재배포 필요 | ✅ 즉시 반영 | ❌ |
| 사고 시 영향 | ⚠️ env 누락 시 fail-open | ✅ DB 자체 검증 가능 | ❌ |
| 권장도 | ⭐⭐⭐ | ⭐⭐ | ❌ |

**Phase 1 채택 권장**: 환경변수 + fail-fast (위 §6.2 코드). Phase 4 후속에서 DB 보조 검증 추가 검토.

---

## 7. 사용자 결정 게이트

> 본 계획서가 진행되기 전 **사용자가 다음 5개 결정을 내려야 한다**. core-planner 는 결정을 받은 뒤 Phase 1 위임 트리거.

### 7.1 결정 1 — 권한 표현 옵션

| 옵션 | 권장도 |
|------|--------|
| 옵션 1 — 테넌트 가드 (HQ_TENANT_ID 단독) | ⭐⭐ |
| 옵션 2 — 권한 코드 (`role_permissions`) | ⭐ |
| **옵션 3 — 별도 도메인 + `ROLE_OPS` Authority** ⭐ (**기본 권장**) | ⭐⭐⭐ |
| 옵션 4 — 별도 BE 서비스 (마이크로서비스) | (별도 프로젝트화 필요) |
| **옵션 3 + 옵션 1 하이브리드** (Defense in Depth) ⭐ (**최우선 권장**) | ⭐⭐⭐⭐ |

### 7.2 결정 2 — Phase 분리 vs 일괄

| 방식 | 권장도 | 비고 |
|------|--------|------|
| **개별 PR Phase 분리** (1 → 1b → 2 → 3 → 4 → 5 → 6) ⭐ | ⭐⭐⭐ | 회귀 격리·롤백 용이 |
| 일괄 PR (Phase 1~6 동시) | ⭐ | 변경 영향 큼 |

### 7.3 결정 3 — Phase 1b STAFF P0 정정 일정

- (a) Phase 1 과 **동시 진행** (병렬 PR) ⭐ (**권장**)
- (b) Phase 1 머지 후 즉시 (순차)
- (c) Phase 2~6 와 함께 일괄

### 7.4 결정 4 — HQ_TENANT_ID SSOT

- (a) **환경변수 `MINDGARDEN_HQ_TENANT_ID` + fail-fast** ⭐ (**권장**)
- (b) DB 조회 `tenants.is_hq`
- (c) 하드코딩 (비권장)

### 7.5 결정 5 — `ROLE_STANDARD.md` §3.3 갱신 시점

- (a) Phase 1 PR 에 표준 갱신도 포함 (1 PR)
- (b) **Phase 6 별도 PR 로 표준 갱신** ⭐ (**권장**) — Phase 1 의 실제 적용 결과를 반영한 표준 작성 가능

---

## 8. 회귀 방지

### 8.1 회귀 테스트 작성 표준

| 테스트 종류 | 위치 | 게이트 |
|-------------|------|--------|
| `*PreAuthorizeRegressionTest.java` | `src/test/java/com/coresolution/consultation/controller/` | 컨트롤러 가드 매트릭스 (역할 × 엔드포인트) |
| `JwtAuthenticationFilterTest.java` (Phase 1b) | `src/test/java/com/coresolution/consultation/config/filter/` | STAFF/ADMIN actorRole 매핑 회귀 |
| FE `*.test.js` (RoleUtils) | `frontend/src/utils/__tests__/` | 호환 매핑 회귀 + 위젯 가드 |
| Integration (`@SpringBootTest`) | `src/test/java/com/coresolution/integrationtest/` | TenantContextHolder + 가드 통합 |

### 8.2 CI / 정적 게이트

| 게이트 | 명령 | 기대 |
|--------|------|------|
| HQ_MASTER 잔존 검색 (BE) | `rg "HQ_MASTER" src/main/java --type java` | 호환 매핑 / 주석만 (실코드 0) |
| HQ_MASTER 잔존 검색 (FE) | `rg "HQ_MASTER" frontend/src --type js --type jsx --type ts` | LEGACY_USER_ROLES 매핑 테이블만 |
| `hasRole('OPS')` 사용처 검색 | `rg "hasRole\(['\"]\\s*OPS" src/main/java` | Ops 영역만 (Phase 별 인벤토리와 일치) |
| `hasRole('ADMIN')` 사용처 검색 | `rg "hasRole\(['\"]\\s*ADMIN" src/main/java/com/coresolution/core/controller` | Ops 영역 0 (Phase 완료 후) |
| `UserRole.java` 신규 enum 추가 | `git diff develop -- src/main/java/com/coresolution/consultation/constant/UserRole.java` | 변경 0건 |
| 운영 게이트 `check-hardcode.sh` | 저장소 스크립트 | 통과 |

### 8.3 모니터링·알람

| 항목 | 위치 | 알람 임계 |
|------|------|----------|
| 외부 테넌트 ADMIN 의 Ops API 호출 시도 | `security_audit_log` | 1건/시간 이상 → Discord 알람 |
| STAFF 의 ROLE_OPS / ROLE_ADMIN 사용 시도 | log warn | 1건이라도 발생 시 즉시 알람 (Phase 1b 회귀 감지) |
| PII 회전 API 호출 빈도 | `pii_reencryption_progress` insert rate | 1회/일 초과 시 알람 |

### 8.4 PR 리뷰 체크리스트 (Phase 별 공통)

- [ ] `@PreAuthorize` 표현식이 Phase 표준과 일치 (옵션 3 채택 시 `hasRole('OPS')`)
- [ ] `TenantContextHolder` 자체 검증 메서드별 적용 (옵션 1 하이브리드)
- [ ] 회귀 테스트 (역할 매트릭스 4건 이상) 포함
- [ ] 로깅 `LogSanitizer` 적용
- [ ] FE 영향: 위젯·메뉴 가드가 인라인 비교 없이 `isAdmin`/`isOps` 헬퍼 사용
- [ ] 표준 인용: 본 계획서 + `ROLE_STANDARD.md` §6.1 §3 + (Phase 6 후) §3.3
- [ ] 운영 게이트 통과: `check-hardcode.sh`, lint, test

---

## 9. 운영 영향 분석

### 9.1 현재 외부 테넌트 ADMIN 의 호출 시도 이력 분석

**선행 분석 위임** (Phase 1 시작 전 `core-debugger` 1일):

```
대상 로그: production access log (nginx + spring) 최근 30일
검색 패턴:
  - GET /api/v1/admin/pii-rotation/progress
  - POST /api/v1/admin/pii-rotation/start
  - GET /api/v1/admin/ai-monitoring/**
  - GET /api/v1/admin/security-audit/**
  - GET /api/v1/admin/system-metrics/**
  - GET /api/v1/admin/scheduler-monitoring/**

결과 기대:
  - 호출자 tenantId 분포 (HQ vs 외부 테넌트)
  - 외부 테넌트 호출 시도 건수 + 시점 + IP
  - 성공 / 실패 (4xx/5xx) 비율
```

### 9.2 마이그 중 무중단 보장 방법

| Phase | 다운타임 | 영향 |
|-------|----------|------|
| Phase 1 | 0 (가드 강화는 트래픽 0인 PII 회전) | 운영 영향 0 |
| Phase 1b | 0 (다음 요청부터 JWT 권한 변경 적용) | STAFF 가 ADMIN 권한으로 동작하던 기능 회귀 가능 — §4.2.1 선행 분석 필수 |
| Phase 2 | 0 (모니터링 가드 강화) | 외부 테넌트 ADMIN 의 호출 시도 차단 — 이미 비의도 호출이므로 정상화 |
| Phase 3 | 0 | 동일 |
| Phase 4 | 0~1 (FE 라우트 변경 시) | SUPER_ADMIN 라우트 사용자가 OPS 권한 없을 경우 일시적 차단 — 사전 공지 |
| Phase 5 | 0 | FE 메뉴 가시성 변경 — 비기능적 |
| Phase 6 | 0 | 문서 |

### 9.3 롤백 절차

| Phase | 롤백 방식 |
|-------|----------|
| 1 / 1b / 2 / 3 / 4 | `git revert <SHA>` + `develop`/`main` 동기 PR + 즉시 머지 |
| 5 | 동일 (FE 위젯 가드만) |
| 6 | 문서 revert |

각 Phase PR 의 머지 SHA 는 본 계획서 §10 의 진행 상황 표에 기록.

---

## 10. 다음 단계 분배 — Phase 별 core-coder 위임 프롬프트

### 10.1 진행 상황 추적

| Phase | 상태 | 위임 | PR | 머지 SHA | 비고 |
|-------|------|------|----|---------:|------|
| 1 — PII 회전 | 대기 (사용자 결정 후) | core-coder | - | - | §10.2 프롬프트 |
| 1b — JwtAuthenticationFilter STAFF P0 | 대기 (§4.2.1 선행 분석 후) | core-debugger → core-coder | - | - | §10.3 프롬프트 |
| 2 — 시스템 모니터링 | 대기 | core-coder | - | - | §10.4 프롬프트 |
| 3 — 보안 감사 | 대기 | core-coder | - | - | §10.5 프롬프트 |
| 4 — 테넌트 관리 | 대기 | core-coder | - | - | §10.6 프롬프트 |
| 5 — FE 메뉴·라우트 | 대기 | core-coder | - | - | §10.7 프롬프트 |
| 6 — 문서·런북·표준 | 대기 | core-coder + generalPurpose | - | - | §10.8 프롬프트 |

### 10.2 Phase 1 위임 프롬프트 — core-coder (P0 단독)

```
[Task] Phase 1 — PiiKeyRotationAdminController 가드를 ROLE_OPS 로 격상 + TenantContextHolder HQ 검증 추가 (옵션 3 + 옵션 1 하이브리드)

[배경]
- PR #344/#358 에서 PII 회전 가드를 hasRole('ADMIN') 단일로 통합했으나 외부 테넌트 ADMIN 도 통과하는 보안 미흡 발견
- 사용자 결정: ops-portal-migration 옵션 B(일괄), 권한 표현 = 옵션 3+1 하이브리드 (사용자 확정 후 진행)
- 본 Phase 는 가장 보안 민감 (PII KEY/IV 회전) 영역으로 단독 PR 진행

[참조 문서 — 모두 읽고 인용]
- docs/project-management/OPS_PORTAL_MIGRATION_PLAN.md §4.1, §5, §6, §10.2
- docs/standards/ROLE_STANDARD.md §2.1, §3, §3.1, §6.1 §3
- docs/standards/PII_KEY_ROTATION_REENCRYPTION_DESIGN.md §3.2.4
- docs/standards/SECRET_ROTATION_POLICY.md §3.4
- 표본: src/main/java/com/coresolution/core/controller/BrandingController.java (`getBrandingInfoByTenantId` — TenantContextHolder 자체 검증 표본)

[변경 대상 파일]
1. src/main/java/com/coresolution/core/controller/PiiKeyRotationAdminController.java
   - @PreAuthorize("hasRole('ADMIN')") → @PreAuthorize("hasRole('OPS')") (class 레벨)
   - 각 메서드(start/progress/resume/cancel) 진입부에 TenantContextHolder.getRequiredTenantId().equals(OpsTenantConstants.HQ_TENANT_ID) 자체 검증 추가
   - 불일치 시: HTTP 403 + log.warn (LogSanitizer 적용)

2. src/main/java/com/coresolution/core/constants/OpsTenantConstants.java (신규)
   - @Component + @Value("${mindgarden.hq.tenant-id}") + fail-fast 검증
   - 본 계획서 §6.2 코드 그대로 채용

3. config/application-prod.yml / application-dev.yml / application-local.yml
   - mindgarden.hq.tenant-id: ${MINDGARDEN_HQ_TENANT_ID:?...} 추가
   - local/dev 는 placeholder (사용자에게 실제 ID 확인 요청)

4. src/test/java/com/coresolution/core/controller/PiiKeyRotationAdminControllerTest.java
   - 회귀 테스트 8건 (본 계획서 §4.1 테스트 항목 표 그대로)
   - 외부 ADMIN/STAFF 403, HQ_ADMIN/SUPER_HQ_ADMIN 200, 외부 tenantId 403, 무인증 401

5. docs/standards/PII_KEY_ROTATION_REENCRYPTION_DESIGN.md §3.2.4
   - 가드 표준 갱신 (ROLE_OPS + TenantContextHolder)

[완료 조건 (체크리스트)]
- [ ] @PreAuthorize 표현식: hasRole('OPS') 단일 (HQ_MASTER/ADMIN 잔존 0)
- [ ] 메서드별 TenantContextHolder HQ_TENANT_ID 검증 적용 (4 메서드)
- [ ] OpsTenantConstants 신설 + 환경변수 주입 + fail-fast
- [ ] 회귀 테스트 8건 모두 통과
- [ ] mvn test 로컬 통과
- [ ] docs/standards/PII_KEY_ROTATION_REENCRYPTION_DESIGN.md §3.2.4 갱신
- [ ] check-hardcode.sh 통과
- [ ] frontend/ 영향 0 (호출자 없음 확인 grep)

[브랜치·PR 표준]
- 브랜치: fix/ops-portal-phase1-pii-rotation-ops-guard
- PR 베이스: develop
- 머지 후 develop→main 동기 PR 별도 (배포)
- PR 본문에 본 계획서 §4.1 인용

[게이트]
- core-tester 게이트 통과 후 사용자 검수
- CI 통과
- 운영 영향 0 (PII 회전 호출 이력 없음 — pii_reencryption_progress 0 row 확인)

[금지]
- UserRole.java enum 추가 (4종 SSOT 위반)
- HQ_MASTER 표현식 신규 추가
- hardcoding된 HQ tenantId (반드시 환경변수)
```

### 10.3 Phase 1b 선행 분석 위임 프롬프트 — core-debugger

```
[Task] Phase 1b 선행 분석 — JwtAuthenticationFilter#createAuthoritiesFromUser case STAFF 의 ROLE_ADMIN+ROLE_OPS 자동 부여가 의도적인지, 운영 영향이 있는지 분석

[배경]
- ops-portal-migration Phase 1 (PII 회전 ROLE_OPS 격상) 준비 중 발견
- JwtAuthenticationFilter:255-258 에서 STAFF 사용자가 ROLE_ADMIN + ROLE_OPS 두 권한을 자동 부여받고 있음 → ADMIN 단독 가드와 OPS 가드 양쪽 모두 통과 가능
- 옵션 3 (ROLE_OPS) 채택 시 STAFF 가 PII 회전 등 Ops 전용 영역에 접근 가능 — 보안 위반
- 본 분석은 코드 수정 없음. 분석 결과만 보고 (수정은 core-coder Phase 1b 에 위임)

[참조 문서]
- docs/standards/ROLE_STANDARD.md §2.2 (STAFF 권한 경계)
- docs/project-management/OPS_PORTAL_MIGRATION_PLAN.md §4.2, §4.2.1
- src/main/java/com/coresolution/consultation/config/filter/JwtAuthenticationFilter.java:247-313

[분석 질문]
질문 1 — 비즈니스 정당성
- STAFF 가 ROLE_ADMIN 을 받아야 하는 비즈니스 시나리오가 실제로 존재하는가?
- ROLE_STANDARD.md §2.2 (STAFF=사무·행정, ERP 제외) 와 모순되지 않는가?
- 만약 정당성이 있다면, 어떤 컨트롤러/엔드포인트가 의존하는가?

질문 2 — ROLE_OPS 부여 정당성
- STAFF 가 ROLE_OPS 를 받아야 하는 시나리오가 실제로 존재하는가?
- ROLE_OPS 는 Ops Portal(본사 운영팀) 전용 권한인데 테넌트 STAFF 에게 부여하는 게 적절한가?
- 만약 STAFF 가 Ops 권한이 필요하다면 그 시나리오는 어떤가? (Ops Portal 사용자 = 본사 직원이므로 비정상으로 보임)

질문 3 — 운영 로그 분석
- 최근 30일 운영 access log 에서 STAFF actor 의 다음 API 호출 이력:
  * hasRole('ADMIN') 단독 가드 컨트롤러 (예: BrandingController#getBrandingInfoByTenantId, AdminMaintenance 등)
  * hasRole('OPS') 가드 컨트롤러 (현재 없음 — 추후 Phase 1+ 이후)
- 호출 빈도·tenant 분포·성공 여부

질문 4 — 호환 패턴 분석
- ADMIN case 와 STAFF case 의 권한 부여 차이가 의도적인 설계인가, 실수인가?
- ADMIN: ROLE_ADMIN only (단, counselingEnabled 시 ROLE_CONSULTANT 추가)
- STAFF: ROLE_ADMIN + ROLE_OPS — 왜 STAFF 가 ADMIN+OPS 두 권한을 받는가?
- 코드 히스토리(git log -p src/main/java/com/coresolution/consultation/config/filter/JwtAuthenticationFilter.java) 에서 STAFF 케이스가 추가된 시점과 PR 배경 확인

[산출물 — 분석 보고서]
docs/debug/ 디렉터리에 JWT_FILTER_STAFF_ROLE_LEAK_ANALYSIS_20260615.md 작성:
1. 결론 (STAFF→ADMIN+OPS 가 의도/실수/레거시 호환 중 어느 쪽인지)
2. 운영 로그 통계
3. 권장 조치 (Phase 1b core-coder 에게 전달할 정확한 수정 범위)
4. 회귀 위험 (수정 시 영향받는 STAFF 사용자 시나리오)
5. 테스트 매트릭스 (수정 후 검증할 시나리오)

[금지]
- 코드 수정
- 운영 DB 직접 변경
- 별도 PR 생성 (분석 보고서만 작성)
```

### 10.4 Phase 1b 수정 위임 프롬프트 — core-coder

```
[Task] Phase 1b — JwtAuthenticationFilter#createAuthoritiesFromUser case STAFF 의 ROLE_ADMIN+ROLE_OPS 자동 부여 P0 정정

[전제]
- core-debugger Phase 1b 선행 분석 보고서(docs/debug/JWT_FILTER_STAFF_ROLE_LEAK_ANALYSIS_20260615.md) 의 결론 + 권장 조치를 따른다
- 분석 결과가 "STAFF 의 ROLE_ADMIN+ROLE_OPS 부여는 의도되지 않은 누락 수정" 또는 "레거시 호환 - 더 이상 필요 없음" 일 때만 진행

[배경 — 본 PR 미진행 시 위험]
- Phase 1 (PII 회전 ROLE_OPS) 머지 후 STAFF 가 PII 회전 호출 가능 — 보안 위반
- Phase 2 (모니터링 ROLE_OPS) 머지 후 STAFF 가 시스템 메트릭·AI 모니터링·스케줄러 모니터링·보안 감사 조회 가능 — 정보 유출 위험
- 본 Phase 1b 는 Phase 1 과 동시 진행 권장 (병렬 PR)

[참조 문서]
- docs/debug/JWT_FILTER_STAFF_ROLE_LEAK_ANALYSIS_20260615.md (분석 보고서 — 필수)
- docs/standards/ROLE_STANDARD.md §2.2
- docs/project-management/OPS_PORTAL_MIGRATION_PLAN.md §4.2
- src/main/java/com/coresolution/consultation/config/filter/JwtAuthenticationFilter.java:247-313

[변경 대상 파일]
1. src/main/java/com/coresolution/consultation/config/filter/JwtAuthenticationFilter.java
   - case STAFF: 의 권한 부여 변경 (분석 보고서 권장안 그대로)
   - 권장 방향: ROLE_STAFF only (또는 ROLE_STAFF + counselingEnabled 시 ROLE_CONSULTANT 추가, ROLE_ADMIN/ROLE_OPS 제거)

2. src/test/java/com/coresolution/consultation/config/filter/JwtAuthenticationFilterTest.java (신규 또는 갱신)
   - STAFF user → ROLE_STAFF only 검증
   - STAFF + counselingEnabled → ROLE_STAFF + ROLE_CONSULTANT
   - STAFF token → @PreAuthorize("hasRole('ADMIN')") 컨트롤러 403
   - STAFF token → @PreAuthorize("hasRole('OPS')") 컨트롤러 403
   - STAFF token → @PreAuthorize("hasAnyRole('ADMIN','STAFF')") 컨트롤러 200 (회귀 방지)
   - HQ_ADMIN actorRole → ROLE_ADMIN + ROLE_OPS + ROLE_HQ_ADMIN (회귀)
   - ADMIN user → ROLE_ADMIN only (회귀)

3. 통합 테스트 (선택)
   - src/test/java/com/coresolution/consultation/controller/ConsultantAreaPreAuthorizeRegressionTest.java 회귀 확인

[완료 조건]
- [ ] STAFF user 가 ROLE_ADMIN 받지 않음 (단위 테스트)
- [ ] STAFF user 가 ROLE_OPS 받지 않음 (단위 테스트)
- [ ] STAFF user 가 hasAnyRole('ADMIN','STAFF') 컨트롤러는 정상 호출 가능 (회귀 방지)
- [ ] mvn test 전체 통과
- [ ] check-hardcode.sh 통과
- [ ] 분석 보고서의 회귀 위험 시나리오 모두 검증

[브랜치·PR]
- 브랜치: hotfix/jwt-filter-staff-ops-leak-p0
- 베이스: develop
- 라벨: security, p0, hotfix
- 핫픽스이므로 develop → main 동기 PR 즉시 생성

[금지]
- 분석 보고서 없이 수정 진행
- ADMIN case 의 권한 부여 변경 (Phase 1b 범위 밖)
- actorRole 매핑(createAuthoritiesFromActorRole) 변경 (Phase 1b 범위 밖)
```

### 10.5 Phase 2 위임 프롬프트 — core-coder (시스템 모니터링)

```
[Task] Phase 2 — 시스템 모니터링 컨트롤러 4종의 가드를 ROLE_OPS + HQ_TENANT_ID 검증으로 마이그

[전제]
- Phase 1 + Phase 1b 머지 완료 (OpsTenantConstants 인프라 + STAFF 권한 정상화)

[참조 문서]
- docs/project-management/OPS_PORTAL_MIGRATION_PLAN.md §2.1, §4.3, §5
- docs/standards/ROLE_STANDARD.md §3, §6.1 §3
- Phase 1 표본: PiiKeyRotationAdminController (가드 패턴)
- 표본 컨트롤러: BrandingController (TenantContextHolder 자체 검증)

[변경 대상 파일]
1. src/main/java/com/coresolution/core/controller/AIMonitoringController.java
   - @PreAuthorize("hasAnyRole('ADMIN','HQ_MASTER')") → @PreAuthorize("hasRole('OPS')") (6 메서드: 라인 56, 102, 147, 196, 253, 311)
   - 각 메서드 진입부 OpsTenantConstants.HQ_TENANT_ID 검증
   - class-level @PreAuthorize 통합 검토 (모든 메서드 동일 가드라면)

2. src/main/java/com/coresolution/core/controller/SystemMetricsController.java
   - @PreAuthorize("hasAnyRole('ADMIN','HQ_MASTER')") → @PreAuthorize("hasRole('OPS')") (3 메서드)
   - 자체 검증 추가

3. src/main/java/com/coresolution/core/controller/SchedulerMonitoringController.java
   - 동일 (4 메서드)

4. src/main/java/com/coresolution/core/controller/MonitoringController.java
   - @PreAuthorize("hasRole('ADMIN')") → @PreAuthorize("hasRole('OPS')") (검토 후 결정 — 실제로 Ops 전용인지 확인 필요)

5. 회귀 테스트 4 파일 (컨트롤러별)
   - 시나리오: 외부 ADMIN 403, 외부 STAFF 403, HQ_ADMIN/SUPER_HQ_ADMIN 200, 외부 tenantId 403, 무인증 401 — 각 컨트롤러의 주요 엔드포인트마다

6. 호출자 측 영향 분석
   - frontend/src/components/dashboard/widgets/admin/AIMonitoringWidget.js
   - SystemMetricsWidget.js, SchedulerStatusWidget.js
   - 위젯이 외부 테넌트 ADMIN 에게 노출되어 있는지 확인 (Phase 5 와 연계)

[완료 조건]
- [ ] HQ_MASTER 표현식 제거 (4 컨트롤러 합계 17건 → 0)
- [ ] @PreAuthorize 표준 일관성 (모두 hasRole('OPS'))
- [ ] HQ_TENANT_ID 자체 검증 메서드별 적용
- [ ] 회귀 테스트 ~16건 통과
- [ ] mvn test, check-hardcode.sh 통과
- [ ] FE 위젯 회귀 0 (Phase 5 에서 위젯 가드 정리 예정)

[브랜치·PR]
- 브랜치: chore/ops-portal-phase2-monitoring-ops-guard
- 베이스: develop
- 사이즈: 중 (4 컨트롤러 + 4 테스트)

[금지]
- Phase 1/1b 머지 전 진행
- enum 추가
- FE 위젯 함께 변경 (Phase 5 범위)
```

### 10.6 Phase 3 위임 프롬프트 — core-coder (보안 감사)

```
[Task] Phase 3 — SecurityAuditController 가드를 ROLE_OPS + HQ_TENANT_ID 검증으로 마이그

[전제]
- Phase 1 + 1b + 2 머지 완료

[참조 문서]
- docs/project-management/OPS_PORTAL_MIGRATION_PLAN.md §2.1, §4.4, §5
- Phase 2 표본 (동일 패턴)

[변경 대상]
1. src/main/java/com/coresolution/core/controller/SecurityAuditController.java
   - 4 메서드(라인 51, 96, 165, 241): hasAnyRole('ADMIN','HQ_MASTER') → hasRole('OPS')
   - 자체 검증 추가

2. 회귀 테스트
3. 보안 감사 로그(security_audit_log) 본인 영역도 OPS 권한 부여 정합성 확인

[완료 조건]
- [ ] HQ_MASTER 표현식 0
- [ ] 회귀 테스트 통과
- [ ] 보안 감사 로그에 OPS_SECURITY_AUDIT_VIEW 등 action 추가 검토 (선택)

[브랜치·PR]
- 브랜치: chore/ops-portal-phase3-security-audit-ops-guard
```

### 10.7 Phase 4 위임 프롬프트 — core-coder (테넌트 관리 + DynamicPermission)

```
[Task] Phase 4 — SuperAdminTenantComponentController 가드 마이그 + DynamicPermission HQ_MASTER 분기 제거 + AdminRoleUtils#isHqMaster deprecated

[전제]
- Phase 1~3 머지 완료

[참조 문서]
- docs/project-management/OPS_PORTAL_MIGRATION_PLAN.md §2.3, §4.5

[변경 대상]
1. src/main/java/com/coresolution/core/controller/SuperAdminTenantComponentController.java
   - @PreAuthorize("hasRole('SUPER_ADMIN')") → @PreAuthorize("hasRole('OPS')")
   - 자체 검증 추가
   - 라우트(/api/v1/super-admin/...) 유지 또는 /api/v1/ops/tenant-components/ 로 이관 검토

2. src/main/java/com/coresolution/consultation/service/impl/DynamicPermissionServiceImpl.java:861-863
   - "HQ_MASTER 는 모든 API 접근 가능" 분기 제거 (deprecated — Phase 1~3 후 더 이상 호환 불필요)
   - 단, 호환 매핑 mapLegacyRole 은 유지 (HQ_MASTER → ADMIN 정규화)

3. src/main/java/com/coresolution/consultation/util/AdminRoleUtils.java:102
   - isHqMaster(User user) @Deprecated 처리
   - 사용처 grep: rg "isHqMaster" src/main/java 결과 0 또는 호환 경로만

4. src/main/java/com/coresolution/consultation/constant/PermissionMatrix.java:260
   - HQ_MASTER 분기 검토 후 제거 (Phase 1~3 후 더 이상 필요 없음)

5. frontend/src/components/super-admin/SuperAdminTenantComponentPage.js:137
   - user?.role !== SUPER_ADMIN_ROLE 인라인 비교 → RoleUtils.isOps(user) 헬퍼 신설하여 사용
   - 또는 frontend-ops/ 별도 앱으로 이관 검토 (사용자 결정 게이트)

6. frontend/src/constants/superAdminRoutes.js
   - SUPER_ADMIN_ROLE = LEGACY_USER_ROLES.SUPER_ADMIN → USER_ROLES.OPS (또는 별도 OPS_ROLE 상수)
   - SUPER_ADMIN_ROUTES → OPS_ROUTES 로 점진 마이그 (호환 alias 유지)

7. 회귀 테스트
   - SUPER_ADMIN/HQ_MASTER 토큰의 컨트롤러 접근 패턴 회귀
   - FE: isOps 헬퍼 단위 테스트 신설

[완료 조건]
- [ ] HQ_MASTER 실코드 분기 0 (호환 매핑 mapLegacyRole 만 유지)
- [ ] isHqMaster deprecated + 사용처 0
- [ ] PermissionMatrix HQ_MASTER 분기 0
- [ ] FE SUPER_ADMIN 인라인 비교 0 (헬퍼만)
- [ ] 회귀 테스트 통과

[브랜치·PR]
- 브랜치: chore/ops-portal-phase4-super-admin-tenant-component
```

### 10.8 Phase 5 위임 프롬프트 — core-coder (FE 메뉴·라우트·세션)

```
[Task] Phase 5 — FE 위젯·세션·LNB·라우트의 LEGACY HQ_MASTER 직접 비교 정리

[전제]
- Phase 1~4 머지 완료
- ROLE_OPS Authority 가 BE 표준으로 정착
- FE 헬퍼(isAdmin, isOps) 안정

[참조 문서]
- docs/project-management/OPS_PORTAL_MIGRATION_PLAN.md §2.4, §4.6
- docs/standards/ROLE_STANDARD.md §4 (FE RoleUtils 표준)

[변경 대상]
1. frontend/src/components/dashboard/widgets/erp/ErpManagementGridWidget.js:125-195
   - roles: [..., LEGACY_USER_ROLES.HQ_MASTER] (8건) → roles 배열에서 HQ_MASTER 제거
   - RoleUtils.hasAnyRole(user, roles) 사용 (이미 LEGACY → SSOT 자동 매핑)

2. frontend/src/constants/quickActionsConfig.js:120-166
   - 동일 (4건)

3. frontend/src/utils/lnbMenuUtils.js:21-26
   - LEGACY 역할 배열에서 HQ_MASTER 제거 (RoleUtils 가 자동 정규화)

4. frontend/src/utils/session.js:262-267
   - HQ_MASTER → ADMIN 라우팅 매핑 정리 (호환 매핑 테이블만 유지하거나 ADMIN 단일 매핑)

5. frontend/src/utils/dashboardUtils.js:178-183
   - 동일

6. frontend/src/components/layout/SimpleHamburgerMenu.js:303-304
   - 햄버거 메뉴 표시명 BRANCH_SUPER_ADMIN/SUPER_ADMIN i18n 정리

7. frontend/src/components/erp/SuperAdminApprovalDashboard.js
   - 진단 후 ERP Super Admin 승인 화면 가드 정리

8. 단위 테스트
   - 위젯 가시성 회귀 (RoleUtils.test.js, lnbMenuUtils.test.js 의 HQ_MASTER 케이스 갱신)

[완료 조건]
- [ ] HQ_MASTER 직접 비교 0 (호환 매핑 mapLegacyRole 만 유지)
- [ ] 위젯 가시성 회귀 0 (테스트 통과)
- [ ] npm test (frontend) 통과
- [ ] LNB 메뉴 가시성 시각적 검증 (스크린샷)

[브랜치·PR]
- 브랜치: chore/ops-portal-phase5-fe-menu-route-cleanup
```

### 10.9 Phase 6 위임 프롬프트 — core-coder + generalPurpose (문서·표준)

```
[Task] Phase 6 — 표준·런북·SSOT 문서 갱신 (ops-portal-migration 결산)

[전제]
- Phase 1~5 모두 머지 완료
- 운영 검증 (외부 테넌트 접근 차단 알람·로그 확인) 통과

[참조 문서]
- docs/project-management/OPS_PORTAL_MIGRATION_PLAN.md §4.7, §3.6

[변경 대상 — core-coder]
1. docs/standards/ROLE_STANDARD.md
   - §3.3 Ops Portal 전용 가드 추가 (본 계획서 §3.6 코드 그대로)
   - §6.1 §3 의 "ops-portal-migration" 항목을 "✅ 완료 (Phase 1~5)" 로 갱신
   - §9 변경 이력 추가

2. docs/standards/OPS_PORTAL_STANDARD.md
   - §1.4 권한 표준 신설 (ROLE_OPS Authority + actorRole 매핑)
   - §1.5 호출자 매트릭스 (HQ_ADMIN/SUPER_HQ_ADMIN/OPS actor → ROLE_OPS)

3. docs/standards/SECRET_ROTATION_POLICY.md §3.4
   - 호출자 표준 갱신 (ROLE_OPS 단독, ROLE_ADMIN 제거)

4. docs/standards/PII_KEY_ROTATION_REENCRYPTION_DESIGN.md §3.2.4
   - 가드 표준 갱신 (ROLE_OPS + HQ_TENANT_ID 자체 검증)

5. docs/운영반영/PRE_PRODUCTION_GO_LIVE_CHECKLIST.md
   - Ops Portal 가드 회귀 항목 추가:
     * rg "hasRole.*HQ_MASTER" src/main/java → 0
     * STAFF 토큰의 OPS API 호출 403 확인
     * 외부 테넌트 ADMIN 의 OPS API 호출 403 확인

[변경 대상 — generalPurpose (/core-solution-documentation)]
1. docs/project-management/ROLE_SSOT_PR_SERIES_RETROSPECTIVE.md
   - PR-10 (ops-portal-migration) 결산 항목 추가
   - Phase 1~5 머지 SHA, PR URL, 영향 범위 기록

2. docs/project-management/OPS_PORTAL_MIGRATION_PLAN.md (본 계획서)
   - §10.1 진행 상황 표 갱신 (모든 Phase 머지 SHA·PR URL 기록)
   - §11.4 Changelog 1.1.0 추가

3. docs/project-management/2026-06-15/ 디렉터리 생성 (선택)
   - ops-portal-migration 결산 메모 + 다음 단계 (옵션 3 도메인 이관 등)

[완료 조건]
- [ ] ROLE_STANDARD.md §3.3 추가
- [ ] 표준 4개 문서 갱신
- [ ] 운영 체크리스트 갱신
- [ ] 결산 retrospective 추가

[브랜치·PR]
- 브랜치: docs/ops-portal-migration-standards-update
- 베이스: develop
- 사이즈: 중 (다중 문서)
```

---

## 11. 부록

### 11.1 인벤토리 검색 명령 모음 (재현용)

```bash
# BE — HQ_MASTER 잔존 + @PreAuthorize
rg -n "HQ_MASTER|ROLE_HQ|isHqMaster" src/main/java --type java
rg -n "@PreAuthorize" src/main/java/com/coresolution/core/controller

# FE — HQ_MASTER / SUPER_ADMIN 잔존
rg -n "HQ_MASTER|ROLE_HQ|SUPER_ADMIN" frontend/src --type js --type ts

# Ops Portal 별도 영역
rg -n "@PreAuthorize" src/main/java/com/coresolution/core/controller/ops
ls -la backend-ops/src/main/java/com/mindgarden/ops/
ls -la frontend-ops/

# 표준
cat docs/standards/ROLE_STANDARD.md
cat docs/standards/OPS_PORTAL_STANDARD.md
cat docs/standards/SECRET_ROTATION_POLICY.md
```

### 11.2 핵심 참조 문서

- `docs/standards/ROLE_STANDARD.md` — 4종 SSOT 표준 (본 계획의 정합 기준)
- `docs/standards/OPS_PORTAL_STANDARD.md` — Ops Portal 도메인·포트 표준
- `docs/standards/SECRET_ROTATION_POLICY.md` §3.4 — PII 회전 호출자 표준
- `docs/standards/PII_KEY_ROTATION_REENCRYPTION_DESIGN.md` §3.2.4 — PII 회전 가드 표준
- `docs/standards/TENANT_ROLE_SYSTEM_STANDARD.md` — 테넌트별 역할 운영
- `docs/project-management/ROLE_SSOT_PR_SERIES_RETROSPECTIVE.md` — PR-1~9 결산
- `docs/project-management/archive/2025-11-23/OPS_PORTAL_AUTH_FIX.md` — Ops Portal 인증 이력
- `docs/project-management/archive/OPERATOR_PORTAL_DEV_PLAN.md` — Ops Portal 최초 기획

### 11.3 핵심 코드 SSOT

- `src/main/java/com/coresolution/core/constants/SecurityRoleConstants.java` — ROLE_OPS Authority
- `src/main/java/com/coresolution/core/util/OpsPermissionUtils.java` — requireAdminOrOps()
- `src/main/java/com/coresolution/consultation/config/filter/JwtAuthenticationFilter.java#247-313` — actorRole 매핑
- `src/main/java/com/coresolution/consultation/constant/UserRole.java` — 4종 SSOT enum
- `frontend/src/utils/RoleUtils.js` — FE 헬퍼
- `backend-ops/`, `frontend-ops/` — Ops Portal MVP

### 11.4 JWT actorRole → Spring Security Authority 매핑 표 (현황)

> 본 매핑은 `JwtAuthenticationFilter#createAuthoritiesFromUser` (DB 사용자) 와 `#createAuthoritiesFromActorRole` (Ops 전용 계정) 두 경로에서 결정된다.

#### 11.4.1 DB 사용자 경로 (`createAuthoritiesFromUser`)

| `UserRole` enum | 부여되는 Spring Security Authorities | 현 상태 |
|-----------------|--------------------------------------|---------|
| `ADMIN` | `ROLE_ADMIN` (+ `ROLE_CONSULTANT` if `counselingEnabled=true`) | ✅ 정상 |
| `STAFF` | **`ROLE_ADMIN` + `ROLE_OPS`** | ❌ **P0 — Phase 1b 정정 대상** (의도: `ROLE_STAFF` only) |
| `CONSULTANT` | `ROLE_CONSULTANT` | ✅ 정상 |
| `CLIENT` | `ROLE_CLIENT` | ✅ 정상 |

#### 11.4.2 Ops 전용 계정 경로 (`createAuthoritiesFromActorRole` — DB 에 user row 없을 때)

| JWT `actorRole` | 부여되는 Spring Security Authorities | 비고 |
|-----------------|--------------------------------------|------|
| `HQ_ADMIN` | `ROLE_ADMIN` + `ROLE_OPS` + `ROLE_HQ_ADMIN` | ✅ 본사 슈퍼 운영자 |
| `SUPER_HQ_ADMIN` | `ROLE_ADMIN` + `ROLE_OPS` + `ROLE_HQ_ADMIN` | ✅ 본사 슈퍼 운영자 |
| `ADMIN` | `ROLE_ADMIN` + `ROLE_OPS` | ⚠️ Ops 전용 계정의 `ADMIN` actorRole — Ops Portal 운영자 |
| `OPS` | `ROLE_OPS` | ✅ Ops Portal 일반 운영자 |
| 기타 | `ROLE_<UPPER>` | 기본 패턴 |

#### 11.4.3 마이그 후 기대 매트릭스 (Phase 1b 완료 후)

| `UserRole` (DB) | actorRole (JWT) | Authorities | Phase 1 가드(`hasRole('OPS')`) 통과 여부 |
|-----------------|-----------------|-------------|-------------------------------------------|
| `ADMIN` (외부 테넌트) | `ADMIN` | `ROLE_ADMIN` | ❌ (차단) |
| `STAFF` (외부 테넌트) | `STAFF` | `ROLE_STAFF` | ❌ (차단) |
| `CONSULTANT` | `CONSULTANT` | `ROLE_CONSULTANT` | ❌ |
| `CLIENT` | `CLIENT` | `ROLE_CLIENT` | ❌ |
| (DB 없음) | `HQ_ADMIN` | `ROLE_ADMIN` + `ROLE_OPS` + `ROLE_HQ_ADMIN` | ✅ |
| (DB 없음) | `SUPER_HQ_ADMIN` | `ROLE_ADMIN` + `ROLE_OPS` + `ROLE_HQ_ADMIN` | ✅ |
| (DB 없음) | `OPS` | `ROLE_OPS` | ✅ |

### 11.5 Spring Security `hasRole` vs `hasAuthority` 정리

| 표현식 | 의미 | 본 계획서 채택 여부 |
|--------|------|---------------------|
| `hasRole('OPS')` | Authority 중 `ROLE_OPS` 가 있으면 통과 (자동으로 `ROLE_` 접두사 추가) | ✅ Phase 1+ 표준 |
| `hasAuthority('ROLE_OPS')` | Authority 중 `ROLE_OPS` 가 있으면 통과 (접두사 명시 필요) | ❌ ROLE_STANDARD.md §3.1 금지 |
| `hasAuthority('OPS_PII_ROTATE')` | 권한 코드 (Spring Security ROLE_ 아닌 일반 Authority) | ❌ 옵션 2 미채택 |
| `hasAnyRole('ADMIN','OPS')` | `ROLE_ADMIN` 또는 `ROLE_OPS` 중 하나라도 있으면 통과 | ⚠️ Phase 일부에서 사용 가능 (예: 점진 마이그 중간 상태) |

### 11.6 옵션 3 채택 후 보호 매트릭스 (호출자 × 컨트롤러)

| 호출자 | PII 회전 | AI 모니터링 | 시스템 메트릭 | 스케줄러 | 보안 감사 | Branding | ERP | 일반 스케줄 |
|--------|----------|-------------|---------------|----------|-----------|----------|-----|-------------|
| HQ_ADMIN actor | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| SUPER_HQ_ADMIN actor | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| OPS actor (DB 없음) | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ (테넌트 미보유) | ❌ | ❌ |
| ADMIN actor (외부 테넌트) | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ (본인 테넌트) | ✅ | ✅ |
| STAFF actor (외부 테넌트, Phase 1b 후) | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ (본인 테넌트 일부) | ❌ | ✅ |
| CONSULTANT | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ (본인) |
| CLIENT | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ (본인) |
| 무인증 | ❌ (401) | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |

> Ops Portal 별도 도메인(`ops.e-trinity.co.kr`) 사용 시 CORS·세션·쿠키 격리로 ✅ 영역의 호출자도 도메인이 다르면 차단됨.

---

## 12. FAQ

### Q1. ROLE_STANDARD.md §3 이 4종 SSOT 만 `hasRole` 인자 허용하는데, `hasRole('OPS')` 는 위반 아닌가?

**A**. 형식적으로는 §3 표현식 예시에 `OPS` 가 없어 갱신이 필요하다. 그러나 §6.1 §3 가 "**운영(Ops Portal) 전용 권한 은 별도 시스템(`ops-portal-migration`) 으로 분리한다**" 라고 명시하고 있어, `ROLE_OPS` 는 SSOT 4종의 **확장 Authority** 로 합법이다.

**조치**: Phase 6 에서 `ROLE_STANDARD.md` §3.3 절을 신설하여 `hasRole('OPS')` 를 표준에 명시한다 (본 계획서 §3.6).

### Q2. `UserRole` enum 에 `OPS` 를 추가하면 안 되는가?

**A**. **절대 금지**. `ROLE_STANDARD.md` §6.1 §1 이 "4종(ADMIN/STAFF/CONSULTANT/CLIENT) 외의 새 역할 enum/문자열은 추가하지 않는다" 라고 명시. `ROLE_OPS` 는 **Spring Security Authority** 이며 `UserRole` enum 과 별개 layer 다.

### Q3. 옵션 4 (별도 BE 마이크로서비스) 는 왜 권장하지 않는가?

**A**. 본 계획서 범위(HQ_MASTER 18건 가드 분리) 와 스코프 불일치. 별도 BE 서비스 분리는 수개월 단위 프로젝트로, 본 보안 개선과 분리하여 추후 진행. 본 마이그는 옵션 3 (별도 도메인) 로 충분히 보안 목표 달성.

### Q4. Phase 1b (JwtFilter STAFF 정정) 가 정말 필요한가? Phase 1 만 머지하면 안 되나?

**A**. 필요하다. Phase 1 만 머지하면:
- Phase 1 가드: `hasRole('OPS')` — STAFF token 은 `ROLE_OPS` 받음 (JwtFilter:257) → **통과**
- 외부 테넌트 STAFF → PII 회전 호출 가능 — 보안 위반

따라서 Phase 1 과 Phase 1b 는 **동시 진행** 필수. 또는 Phase 1b 가 Phase 1 보다 먼저 머지되어야 함.

### Q5. HQ_TENANT_ID 환경변수 미설정 시 어떻게 되는가?

**A**. `OpsTenantConstants#setHqTenantId` 의 fail-fast 에 의해 **Spring 부트 자체가 실패**한다. 운영 배포 전 환경변수 확인이 강제됨 (fail-safe).

### Q6. 마이그 진행 중 일부 Phase 만 머지된 상태에서 외부 테넌트가 API 호출 시도하면?

**A**. Phase 별 영향:

| 단계 | 외부 테넌트 ADMIN | 외부 테넌트 STAFF | HQ 운영자 |
|------|-------------------|-------------------|-----------|
| 현재 (Phase 0) | ✅ 통과 (보안 위반) | ✅ 통과 (이중 위반) | ✅ 통과 |
| Phase 1 머지 후 (Phase 1b 미머지) | ❌ 차단 | ✅ 통과 (보안 위반 잔존) | ✅ 통과 |
| Phase 1 + 1b 머지 후 | ❌ 차단 | ❌ 차단 | ✅ 통과 |
| Phase 1~3 머지 후 | ❌ 차단 (모든 Ops API) | ❌ 차단 | ✅ 통과 |
| Phase 1~6 머지 후 | ❌ 차단 (모든 Ops API + FE 메뉴 미노출) | ❌ 차단 | ✅ 통과 |

### Q7. Ops Portal 별도 도메인(`ops.e-trinity.co.kr`) 으로 옮긴 후 본 서비스(`*.e-trinity.co.kr`) 에서 호출하면?

**A**. CORS 정책 + JWT actorRole 검증 으로 차단. 본 마이그 Phase 1~6 은 **API 가드 강화** 이고, 별도 도메인 이관은 후속 옵션 (옵션 3 의 도메인 분리 부분). API 자체는 본 서비스 백엔드(`coresolution`) 에 유지하되 가드만 `ROLE_OPS` 로 격상.

### Q8. PR 머지 후 운영에서 외부 테넌트 ADMIN 이 시도하면 어떻게 감지하나?

**A**. §8.3 모니터링 항목 — `security_audit_log` 에 `OPS_*` action 차단 이벤트 1건 이상 시 Discord 알람.

---

## 13. 리스크 등록부

| ID | 리스크 | 가능성 | 영향 | 대응 |
|----|--------|--------|------|------|
| R-01 | Phase 1b 누락 시 STAFF 가 ROLE_OPS 통과 | 중 | 높음 | Phase 1 과 동시 머지 강제, 결정 게이트 §7.3 |
| R-02 | HQ_TENANT_ID 환경변수 미설정 | 중 | 중 | fail-fast (`OpsTenantConstants`) — 부트 실패 |
| R-03 | STAFF 가 ADMIN 권한으로 동작하던 기능 회귀 | 중 | 중 | Phase 1b 선행 분석 (`core-debugger` §4.2.1) |
| R-04 | Ops 운영자가 Ops Portal 별도 도메인 사용 미숙 | 높음 | 낮음 | 운영팀 사전 공지·교육, 도메인 이관은 옵션 3 채택 시만 |
| R-05 | 외부 테넌트 ADMIN 의 호출 이력이 실제로 있을 가능성 | 낮음 | 중 | §9.1 운영 로그 사전 분석 |
| R-06 | `hasRole('OPS')` 표준 갱신 누락 (ROLE_STANDARD.md) | 중 | 낮음 | Phase 6 게이트 — §10.9 |
| R-07 | DynamicPermission HQ_MASTER 분기 제거 시 의외 회귀 | 낮음 | 중 | Phase 4 단독 PR + 운영 1일 모니터링 |
| R-08 | FE 위젯 가드 정리 시 사용자 시각적 회귀 | 중 | 낮음 | Phase 5 머지 전 스크린샷 회귀, QA 1일 |
| R-09 | 본 계획서 인벤토리 누락 영역이 있을 가능성 | 낮음 | 중 | Phase 1 머지 후 1일 모니터링, 추가 grep 결과로 보정 |
| R-10 | 별도 도메인 채택 시 SSO·로그인 흐름 변경 | 중 | 중 | 옵션 3 채택 시 별도 설계 PR (본 계획서 범위 밖) |

---

## 14. 마이그 후 메트릭

### 14.1 보안 메트릭

- 외부 테넌트 ADMIN/STAFF 의 Ops API 호출 시도 차단 수 (Phase 1~6 머지 후 30일)
- STAFF 의 ROLE_ADMIN 사용 시도 차단 수 (Phase 1b 머지 후 7일)
- PII 회전 호출자 분포 (HQ tenant only 검증)

### 14.2 운영 메트릭

- Phase 별 PR 머지 → 운영 반영 평균 시간
- 회귀 테스트 수행 시간 (Phase 별)
- 마이그 중 외부 테넌트 사용자 문의·이슈 수

### 14.3 표준 정합 메트릭

- `rg "HQ_MASTER" src/main/java` 잔존 표현식 수 (목표: 호환 매핑 + 주석만)
- `rg "hasAuthority\('ROLE_" src/main/java` 잔존 (목표: 0)
- 4종 SSOT 외 `UserRole.values()` 추가 (목표: 0)

---

## 15. 결론

본 계획서는 사용자 옵션 B (ops-portal-migration 일괄 마이그) 결정에 따라 작성되었으며, 다음을 제공한다:

1. **인벤토리** — HQ_MASTER 18건 + 부수적 발견 (JwtFilter STAFF P0) 의 전체 영역 정리
2. **3+1 옵션 비교** — 권한 표현 4종 (테넌트 가드 / 권한 코드 / 별도 도메인 + ROLE_OPS / 마이크로서비스) 비교 및 권장 (옵션 3+1 하이브리드)
3. **Phase 분배** — Phase 1~6 의 단독 PR 권장 + 위임 프롬프트
4. **표준 정합** — ROLE_STANDARD.md §3 §6.1 §3 의 명시적 후속 PR 로서 표준 갱신 절차 포함
5. **회귀 방지** — 테스트 패턴, CI 게이트, 모니터링·알람, PR 리뷰 체크리스트
6. **운영 영향 분석** — 외부 호출 이력 분석, 무중단 보장, 롤백 절차

**사용자 결정 게이트 §7** 의 5개 결정 후 core-planner 가 Phase 1 위임을 트리거한다. 본 계획서 자체는 **docs only** 로 운영 영향 0 이며, 사용자 정책에 따라 즉시 admin override 머지 가능.

---

## 16. 변경 이력 (Changelog)

| 날짜 | 버전 | 변경 | 작성자 |
|------|------|------|--------|
| 2026-06-15 | 1.0.0 | 초안 — 사용자 옵션 B 채택 후 종합 계획서 작성 (PR #358 보안 의도 정정 + ops-portal-migration 18건 분배실행 + JwtFilter STAFF P0 발견 + Phase 1~6 위임 프롬프트) | core-planner |

