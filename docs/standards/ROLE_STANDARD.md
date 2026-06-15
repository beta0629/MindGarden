# 역할(Role) 표준 — 4종 SSOT

**버전**: 1.0.0
**작성일**: 2026-06-13
**상태**: 공식 표준 (Role SSOT 9-PR 시리즈 PR-1~9 정착 결과)
**우선순위**: ⭐⭐⭐⭐⭐ (최우선)

---

## 0. 요약 (TL;DR)

MindGarden(=Core Solution) 의 사용자 역할(Role)은 다음 **4종 SSOT(Single Source of
Truth)** 만 사용한다.

| 역할 | 코드 | 한글 표시명 | 설명 |
|------|------|-------------|------|
| 관리자 | `ADMIN` | 관리자 | 테넌트(원장/사장) — 전체 권한 + ERP 포함 |
| 사무 | `STAFF` | 사무원 | 사무·행정. ERP 제외. 원장이 추가 권한 부여 가능 |
| 전문가 | `CONSULTANT` | 상담사 | 상담·놀이·언어 등 **모든 현장 전문가**. 세부 분류는 `users.professional_provider_type_code` |
| 고객 | `CLIENT` | 내담자 | 내담자·학생 등 서비스 수요자 |

레거시 역할(`BRANCH_*`, `HQ_*`, `SUPER_*`, `TENANT_ADMIN`, `PRINCIPAL`, `OWNER`,
`PLAY_THERAPIST`, `SPEECH_THERAPIST` 등) 은 모두 **호환 매핑 계층**(`mapLegacyRole`)
에서 4종 중 하나로 정규화된 뒤 비교된다. **새로운 코드에서는 4종 외 값을 직접
비교·생성·저장하지 않는다.**

---

## 1. 배경 — SSOT 정착 이력

| 단계 | 변경 |
|------|------|
| 2025-02 | 4종(ADMIN/STAFF/CONSULTANT/CLIENT) 으로 1차 단순화 |
| 2026-02 | `BRANCH_*`, `HQ_*`, `TENANT_ADMIN` 등 레거시 enum 제거 |
| 2026-05 | 전문가 enum 임시 추가(PLAY_THERAPIST, SPEECH_THERAPIST) |
| 2026-06 | **4종 SSOT 재정립** — 전문가 subtype 은 enum 이 아니라 `users.professional_provider_type_code` 컬럼 + 공통코드 `PROFESSIONAL_PROVIDER_TYPE` 로 표현 |

자세한 9-PR 정착 과정은 [`ROLE_SSOT_PR_SERIES_RETROSPECTIVE.md`](../project-management/ROLE_SSOT_PR_SERIES_RETROSPECTIVE.md) 참조.

---

## 2. 역할별 권한·책임·경계

### 2.1 ADMIN (관리자)

- **권한 묶음**: 테넌트 전체 운영/관리 권한 + ERP(결제·정산·재무) 권한
- **책임**: 테넌트 내 사용자·매핑·결제·환불·정책 변경에 대한 최종 책임
- **경계**:
  - 운영 전체 권한(Ops Portal) 은 별도 분리 진행 중(아래 §6 후속 과제 참조).
  - 다른 테넌트 데이터에는 절대 접근할 수 없다 (테넌트 격리 + Tenant Guard).
- **백엔드 가드**: `@PreAuthorize("hasRole('ADMIN')")`
- **프론트 헬퍼**: `isAdmin(user)` / `RoleUtils.isAdmin(user)`

### 2.2 STAFF (사무·행정)

- **권한 묶음**: 사용자 등록·일정·매핑 등 운영 보조 기능. **ERP 제외**.
- **책임**: 행정/접수/일정/콜백 등 일상 운영
- **경계**:
  - 결제 확정·환불·정산·계정 변경 등 위험도 높은 작업은 STAFF 에서 제외하고 ADMIN
    전용으로 둔다. (예: `BrandingController` 의 `{tenantId}` 경로, `AdminMappingCleanup`,
    `AdminMaintenance` 등은 ADMIN 단독)
  - 추가 권한이 필요한 경우 `role_permissions` 테이블로 동적 부여 (하드코딩 금지).
- **백엔드 가드**: `@PreAuthorize("hasAnyRole('ADMIN','STAFF')")`
- **프론트 헬퍼**: `isStaff(user)` / `RoleUtils.isStaff(user)`

#### 2.2.1 ⚠️ STAFF 자동 ADMIN/OPS 부여 제거 (Phase 1b · 2026-06-15)

`OPS_PORTAL_MIGRATION` Phase 1b P0 보안 정정. 인증 필터의 STAFF 분기에서
`ROLE_ADMIN` + `ROLE_OPS` 가 자동 부여되던 버그를 제거한다.

- **정정 대상**: `JwtAuthenticationFilter#createAuthoritiesFromUser`
  의 `case STAFF:` (이전: ROLE_ADMIN + ROLE_OPS, 이후: **ROLE_STAFF 만**)
- **정합 기준**: `SessionBasedAuthenticationFilter#case STAFF:` (이미 ROLE_STAFF
  단독 부여) 와 동일 정책으로 통일.
- **추가 권한**: 명시적 `hasAnyRole('ADMIN','STAFF')` 가드 또는
  `role_permissions` 동적 권한 시스템(§6) 으로만 부여. **인증 필터에서 자동 부여
  금지**.
- **회귀 가드**: `JwtAuthenticationFilterAuthoritiesTest` (STAFF 인증 시
  ROLE_ADMIN/ROLE_OPS 부재 검증).
- **영향**: STAFF 가 이전에 자동 ROLE_ADMIN 부여로 호출 가능했던 ADMIN-only
  엔드포인트(`PiiKeyRotationAdminController`, `MonitoringController`,
  `AdminMappingCleanupController` 등 `hasRole('ADMIN')` 단독)는 정정 후 차단된다.
  명시적 `hasAnyRole('ADMIN','STAFF')` 엔드포인트는 정합 (정상 통과).

### 2.3 CONSULTANT (전문가)

- **권한 묶음**: 본인 스케줄·상담일지·매핑된 내담자 조회. 본인 데이터 외 접근 금지.
- **책임**: 본인 상담·치료 일정 및 기록 관리
- **세부 분류(subtype)**: enum 이 아니라 `users.professional_provider_type_code` 컬럼.
  - 공통코드 그룹: `PROFESSIONAL_PROVIDER_TYPE`
  - 예: `COUNSELOR`, `PLAY_THERAPIST`, `SPEECH_THERAPIST` …
  - 표시·필터링·통계 분기는 **이 코드값으로** 한다. (역할 비교에 쓰지 않는다)
- **경계**: 다른 상담사·다른 테넌트 자료에 접근할 수 없다.
- **백엔드 가드**: `@PreAuthorize("hasRole('CONSULTANT')")`
- **프론트 헬퍼**: `isConsultant(user)` / `isProfessionalProvider(user)` (= isConsultant)

> ℹ️ `UserRole.isProfessionalProvider()` / `getProfessionalProviderRoles()` 는 4종
> SSOT 후 사실상 CONSULTANT 단일을 반환한다. **호환을 위해 헬퍼명은 유지**한다.

### 2.4 CLIENT (내담자)

- **권한 묶음**: 본인 예약·결제·상담 결과 조회. 본인 외 데이터 접근 금지.
- **책임**: 본인 일정/상담 진행. 자가 결제·문의.
- **백엔드 가드**: `@PreAuthorize("hasRole('CLIENT')")`
- **프론트 헬퍼**: `isClient(user)` / `RoleUtils.isClient(user)`

---

## 3. `@PreAuthorize` 패턴 — 백엔드 표준

PR-2/9 에서 4종 SSOT 정착. 신규 컨트롤러는 다음 패턴만 사용한다.

```java
// 단일 역할
@PreAuthorize("hasRole('ADMIN')")

// 다중 역할 (ADMIN + STAFF 등 사무 + 관리자만 허용)
@PreAuthorize("hasAnyRole('ADMIN','STAFF')")

// 본인만 접근 (예: CLIENT 본인 데이터)
@PreAuthorize("hasRole('CLIENT') and #userId == authentication.principal.id")
```

### 3.1 금지 사항

- ❌ `hasRole('BRANCH_ADMIN')`, `hasRole('HQ_MASTER')` 등 레거시 역할 비교
- ❌ `hasAuthority('ROLE_…')` 접두사 비교 (Spring 의 `hasRole` 사용)
- ❌ Controller 내부에서 인라인 `if (role.equals("ADMIN"))` 분기
- ❌ 다른 테넌트 데이터 접근 시 권한 가드만 의존 (반드시 `TenantContextHolder` 자체
  검증 병행)

### 3.2 테넌트 가드 병행 패턴 (BrandingController 표본)

```java
@PreAuthorize("hasRole('ADMIN')")
@GetMapping("/branding/{tenantId}")
public ResponseEntity<...> getBrandingInfoByTenantId(@PathVariable String tenantId) {
    String currentTenant = TenantContextHolder.getRequiredTenantId();
    if (!currentTenant.equals(tenantId)) {
        log.warn("다른 테넌트 접근 차단 — current={}, requested={}", currentTenant, tenantId);
        throw new AccessDeniedException("다른 테넌트 접근 권한 없음");
    }
    // ...
}
```

### 3.3 Ops Portal — `ROLE_OPS` Authority + HQ 테넌트 가드 (옵션 3+1 하이브리드)

ops-portal-migration (PR #362 ~ #378) 에서 정착된 **본사 운영 전용** 엔드포인트 표준
패턴이다. 4종 SSOT 외에 새 역할을 만들지 않고, **JWT actorRole 기반의 추가 Authority**
(`ROLE_OPS`) 와 **HQ 테넌트 식별 가드** 두 층으로 차단한다.

#### 패턴 (방어 in depth)

1. **`@PreAuthorize("hasRole('OPS')")`** — 클래스 레벨에서 ROLE_OPS Authority 보유자만
   진입. (Spring Security 층)
2. **`assertHqTenant()`** — 각 메서드 시작점에서 `TenantContextHolder.getRequiredTenantId()`
   가 `OpsTenantConstants.HQ_TENANT_ID` 와 일치하지 않으면 `AccessDeniedException` 발생.
   (운영 컨텍스트 층)
3. **외부 테넌트 ADMIN/STAFF 차단** — JwtAuthenticationFilter 의 `actorRole` 매핑은
   HQ_MASTER / HQ_ADMIN / SUPER_HQ_ADMIN / SUPER_ADMIN 만 ROLE_OPS Authority 를
   부여 (Phase 1b PR #361 정정 이후). 일반 ADMIN/STAFF 는 ROLE_OPS 없음 → @PreAuthorize
   단계에서 차단.

#### 표본 코드 (PiiKeyRotationAdminController — Phase 1)

```java
@RestController
@RequestMapping("/api/v1/admin/security/pii-key")
@PreAuthorize("hasRole('OPS')")
@RequiredArgsConstructor
public class PiiKeyRotationAdminController extends BaseApiController {

    private static final String HQ_GUARD_DENY_MESSAGE =
            "Ops 전용 — 본사 테넌트만 호출 가능";

    private final OpsTenantConstants opsTenantConstants;
    private final PersonalDataKeyRotationService rotationService;

    @PostMapping("/rotate")
    public ResponseEntity<...> rotate(@RequestBody RotateRequest request) {
        assertHqTenant();
        // 핵심 로직
    }

    private void assertHqTenant() {
        String currentTenant = TenantContextHolder.getRequiredTenantId();
        if (!opsTenantConstants.isHqTenant(currentTenant)) {
            log.warn("Ops 엔드포인트 외부 테넌트 차단 — tenant={}", currentTenant);
            throw new AccessDeniedException(HQ_GUARD_DENY_MESSAGE);
        }
    }
}
```

#### `OpsTenantConstants` SSOT

```java
@Component
public class OpsTenantConstants {

    @Value("${mindgarden.hq.tenant-id:#{null}}")
    private String hqTenantId;

    @PostConstruct
    public void validate() {
        if (hqTenantId == null || hqTenantId.isBlank()) {
            throw new IllegalStateException(
                "MINDGARDEN_HQ_TENANT_ID 환경변수가 필수입니다. " +
                "운영/개발 환경에 fail-fast 로 설정하세요.");
        }
    }

    public boolean isHqTenant(String tenantId) {
        return hqTenantId.equals(tenantId);
    }
}
```

#### 적용 대상 (ops-portal-migration 완료 인벤토리)

| Phase | 컨트롤러 | PR |
|-------|----------|----|
| 1 | `PiiKeyRotationAdminController` | #362 |
| 2 | `AIMonitoringController`, `SystemMetricsController`, `SchedulerMonitoringController`, `MonitoringController` | #370 |
| 3 | `SecurityAuditController` | #373 |
| 4 | `SuperAdminTenantComponentController` | #375 |

#### 회귀 테스트 표본 (필수 6종)

각 Ops 컨트롤러에는 `*ControllerOpsGuardTest` 를 작성한다.

1. **클래스 레벨 `@PreAuthorize("hasRole('OPS')")` 어노테이션 존재 검증** (리플렉션)
2. **OPS + HQ 테넌트** → 200 OK
3. **OPS + 외부 테넌트** → 403 (`AccessDeniedException` "Ops 전용 — 본사 테넌트만 호출 가능")
4. **ADMIN / STAFF / CONSULTANT / CLIENT** → 403 (ROLE_OPS 없음 — Spring Security 차단)
5. **무인증** → 401
6. **`@PreAuthorize` 표현식에 `HQ_MASTER` / `SUPER_ADMIN` 잔존 없음** (주석 제외 정적 검증)

#### 금지 사항

- ❌ ROLE_OPS 만 적용 (HQ 테넌트 가드 누락) — 외부 테넌트 운영자가 본사 데이터 접근 가능
- ❌ HQ 테넌트 가드만 적용 (`@PreAuthorize` 누락) — 일반 ADMIN 도 통과
- ❌ ROLE_OPS 를 일반 ADMIN/STAFF 에 부여 — Phase 1b 결정 위반
- ❌ `OpsTenantConstants.HQ_TENANT_ID` 를 하드코딩 (반드시 `MINDGARDEN_HQ_TENANT_ID` 환경변수)
- ❌ 4종 SSOT 외 `OPS` 역할 enum 신설 — ROLE_OPS 는 **Authority 만** (UserRole enum 추가 금지)

#### 프론트엔드 짝 헬퍼 — `RoleUtils.isOps(user)` (Phase 5)

FE 에서는 BE actorRole 을 직접 받지 못하므로 `user.role` 의 **원본 문자열**을 사용한다.

```js
import { isOps } from '@/utils/RoleUtils';

// Ops Portal 전용 메뉴/위젯 가드
if (isOps(user)) {
    // HQ_MASTER / HQ_ADMIN / SUPER_HQ_ADMIN / SUPER_ADMIN 만 노출
}
```

향후 BE 응답에 `actorRole` 을 포함하게 되면 `isOps` 를 actorRole 기반으로 확장한다.

---

## 4. 프론트엔드 사용 가이드 — `RoleUtils`

PR-4/9 에서 도입. 프론트엔드의 모든 역할 분기는 `frontend/src/utils/RoleUtils.js` 의
헬퍼만 사용한다.

### 4.1 핵심 API

```12:46:frontend/src/utils/RoleUtils.js
import { USER_ROLES, LEGACY_USER_ROLES } from '../constants/roles';

export const ROLE_ADMIN = USER_ROLES.ADMIN;
export const ROLE_STAFF = USER_ROLES.STAFF;
export const ROLE_CONSULTANT = USER_ROLES.CONSULTANT;
export const ROLE_CLIENT = USER_ROLES.CLIENT;

export const SSOT_ROLES = Object.freeze([
  ROLE_ADMIN,
  ROLE_STAFF,
  ROLE_CONSULTANT,
  ROLE_CLIENT
]);
```

```98:188:frontend/src/utils/RoleUtils.js
export const mapLegacyRole = (role) => { /* 레거시 → 4종 SSOT */ };
export const getNormalizedRole = (user) => mapLegacyRole(extractRole(user));
export const isAdmin = (user) => getNormalizedRole(user) === ROLE_ADMIN;
export const isStaff = (user) => getNormalizedRole(user) === ROLE_STAFF;
export const isConsultant = (user) => getNormalizedRole(user) === ROLE_CONSULTANT;
export const isClient = (user) => getNormalizedRole(user) === ROLE_CLIENT;
export const isOps = (user) => { /* OPS_AWARE_LEGACY_ROLES 비교 (Phase 5) */ };
export const isProfessionalProvider = (user) => isConsultant(user);
export const hasRole = (user, role) => { /* mapLegacyRole 자동 정규화 */ };
export const hasAnyRole = (user, roles) => { /* mapLegacyRole 자동 정규화 */ };
```

### 4.2 사용 예

```js
import RoleUtils, { isAdmin, isConsultant, hasAnyRole } from '@/utils/RoleUtils';

// 단일 분기
if (isAdmin(user)) { /* 관리자만 보이는 위젯 */ }

// 다중 역할 (레거시 값 자동 정규화 — BRANCH_ADMIN 전달해도 ADMIN 로 비교)
if (hasAnyRole(user, ['ADMIN', 'STAFF'])) { /* 사무·관리자 */ }

// 전문가 subtype 별도 분기 (역할이 아니라 컬럼)
if (isConsultant(user) && user.professionalProviderTypeCode === 'PLAY_THERAPIST') { ... }
```

### 4.3 금지 사항

- ❌ `user.role === 'ADMIN'` 직접 문자열 비교 → `isAdmin(user)` 사용
- ❌ `user.role === 'BRANCH_ADMIN'` 등 레거시 값 비교 → `mapLegacyRole` 호출 또는
  헬퍼 사용
- ❌ `PLAY_THERAPIST` / `SPEECH_THERAPIST` 를 별도 역할로 분기 → `isConsultant(user)`
  + `professional_provider_type_code` 컬럼으로 분기
- ❌ 위젯·LNB 가시성 판단에 인라인 `role === ...` 비교 (53개 파일 일괄 정리 완료)

---

## 5. 레거시 역할 호환 매핑 — `mapLegacyRole`

데이터·외부 시스템(SSO, 운영 백업) 등으로 인해 레거시 역할 문자열이 유입될 수 있다.
이 경우 비교/저장 전에 반드시 `mapLegacyRole` 로 정규화한다.

### 5.1 매핑 표

| 레거시 입력 | SSOT 결과 |
|-------------|-----------|
| `SUPER_ADMIN`, `HQ_ADMIN`, `HQ_MASTER`, `SUPER_HQ_ADMIN`, `HQ_SUPER_ADMIN` | `ADMIN` |
| `BRANCH_ADMIN`, `BRANCH_SUPER_ADMIN`, `BRANCH_MANAGER` | `ADMIN` |
| `TENANT_ADMIN`, `TENANTADMIN`, `PRINCIPAL`, `OWNER`, `SUPERADMIN`, `ROOT` | `ADMIN` |
| `원장`, `사장`, `테넌트관리자` (한글) | `ADMIN` |
| `COUNSELOR`, `PLAY_THERAPIST`, `SPEECH_THERAPIST` | `CONSULTANT` |
| `놀이치료선생님`, `언어치료선생님` (한글) | `CONSULTANT` |
| `OFFICE_STAFF`, `OFFICESTAFF`, `PARENT`, `학부모` | `STAFF` |
| `USER`, `CUSTOMER` | `CLIENT` |
| 그 외(null/공백/미정의) | BE: `CLIENT` (안전 기본값) / FE: `null` (엄격) |

### 5.2 BE 구현 — `UserRole.fromString` / `UserRole.mapLegacyRole`

```28:39:src/main/java/com/coresolution/consultation/constant/UserRole.java
public enum UserRole {
    /** 테넌트 관리자 (원장/사장 등, ERP 포함 전체 권한) */
    ADMIN("관리자"),

    /** 전문가 (상담사/놀이치료/언어치료 등 모든 현장 전문가 — 세부 분류는 users.professional_provider_type_code) */
    CONSULTANT("상담사"),

    /** 고객 (내담자/학생 등) */
    CLIENT("내담자"),

    /** 사무원/행정 (ERP 제외 관리 기능, 원장이 추가 권한 부여 가능) */
    STAFF("사무원");
```

```131:195:src/main/java/com/coresolution/consultation/constant/UserRole.java
public static UserRole fromString(String role) {
    if (role == null || role.trim().isEmpty()) {
        return CLIENT;
    }
    String normalizedRole = role.trim().toUpperCase();
    if (normalizedRole.startsWith("ROLE_")) {
        normalizedRole = normalizedRole.substring(5);
    }
    try {
        return UserRole.valueOf(normalizedRole);
    } catch (IllegalArgumentException e) {
        return mapLegacyRole(normalizedRole);
    }
}
```

### 5.3 FE 구현 — `RoleUtils.mapLegacyRole`

`frontend/src/utils/RoleUtils.js` 의 `LEGACY_ROLE_TO_SSOT` 테이블 + `mapLegacyRole`
함수가 동일 매핑을 수행하며, 이미 4종 SSOT 인 입력은 그대로 반환한다 (idempotent).

### 5.4 DB 정규화 — Flyway

레거시 `users.role` 값은 Flyway `V20260612_001__role_ssot_legacy_normalize.sql` 로
4종 SSOT 로 정규화되며, 정규화 후 SSOT 외 값이 남으면 `SIGNAL SQLSTATE '45000'` 으로
마이그레이션이 실패한다(회귀 방지).

---

## 6. 신규 권한 추가 시 절차

### 6.1 SSOT 외 새 역할을 추가하지 않는다

4종(ADMIN/STAFF/CONSULTANT/CLIENT) 외의 새 역할 enum/문자열은 **추가하지 않는다.**
새로운 권한 묶음이 필요하면 다음 중 하나로 처리한다.

1. **공통 권한 시스템(`role_permissions`)** 에 권한 코드 추가 (예: `BILLING_VIEW`,
   `MAPPING_MANAGE` 등) — STAFF 에 동적 부여
2. **전문가 subtype** 이 새로 필요한 경우 `users.professional_provider_type_code`
   공통코드(`PROFESSIONAL_PROVIDER_TYPE`) 에 코드값 추가
3. **운영(Ops Portal) 전용 권한** 은 별도 시스템(`ops-portal-migration`) 으로
   분리한다 — 현재 HQ_MASTER 17건이 이 후속 PR 범위 (`SuperAdminTenantComponent`,
   `AIMonitoring`, `SecurityAudit`, `SystemMetrics`, `SchedulerMonitoring`)

### 6.2 PR 게이트 (Role SSOT 시리즈 합의)

신규 권한 코드/엔드포인트 추가 PR 은 다음을 만족해야 한다.

- [ ] **4종 SSOT 외 enum/문자열 추가 0건** (`UserRole.java`, `USER_ROLES`)
- [ ] `@PreAuthorize` 표현식이 `hasRole('ADMIN'|'STAFF'|'CONSULTANT'|'CLIENT')`
  또는 `hasAnyRole(...)` 만 사용
- [ ] 프론트 권한 분기가 `RoleUtils` 헬퍼만 호출 (인라인 비교 0건)
- [ ] 레거시 역할 문자열이 비교 경로에 등장한다면 반드시 `mapLegacyRole` 후 비교
- [ ] DB 마이그레이션에 새로운 role 값을 직접 INSERT 하지 않음(공통코드 또는
  `role_permissions` 사용)
- [ ] 운영 검색: `rg "BRANCH_|HQ_MASTER|HQ_SUPER" --type ts --type js --type java`
  결과가 0 또는 호환 매핑 테이블 안에서만 등장

### 6.3 표준 문서 갱신

본 문서(`docs/standards/ROLE_STANDARD.md`) 의 §2 (역할별 권한·책임·경계) §5 (매핑 표)
는 권한 모델이 바뀔 때 동시에 갱신한다. 변경 이력은 §9 에 기록한다.

---

## 7. 체크리스트

### 7.1 백엔드 코드 작성 시

- [ ] `@PreAuthorize` 가 4종 SSOT (`ADMIN`/`STAFF`/`CONSULTANT`/`CLIENT`) 만 비교
- [ ] 인라인 `role.equals("…")` 분기 없음
- [ ] 다른 테넌트 데이터 접근 위험이 있으면 `TenantContextHolder` 자체 검증 병행
- [ ] 레거시 역할 문자열을 받는 경계(SSO/외부 API) 는 `UserRole.fromString` 으로
  정규화 후 처리
- [ ] 새 enum 값 추가가 아니라 `professional_provider_type_code` 컬럼 또는
  `role_permissions` 권한 코드로 모델링

### 7.2 프론트엔드 코드 작성 시

- [ ] 역할 비교는 `RoleUtils.isAdmin/isStaff/isConsultant/isClient/hasRole/hasAnyRole`
  헬퍼만 사용
- [ ] 위젯·메뉴 가시성 판단에 인라인 `role === 'XXX'` 없음
- [ ] 전문가 subtype 은 `professional_provider_type_code` 로 분기 (역할 비교 X)
- [ ] 새 위젯 가드는 PR-4/9 패턴을 따른다 (53개 표본 참조)

### 7.3 DB / 마이그레이션 작성 시

- [ ] `users.role` INSERT/UPDATE 값이 4종 SSOT 내
- [ ] 신규 레거시 역할 문자열을 직접 저장하지 않음
- [ ] 마이그레이션이 idempotent + 사후 검증(SSOT 4종 외 잔존 시 SIGNAL) 포함
- [ ] PL/SQL CASE 절도 4종 SSOT 만 사용 (PR-6 표본:
  `mapping_permission_procedures.sql`)

---

## 8. 관련 문서 / 코드 인용

### 8.1 코드 SSOT

- `src/main/java/com/coresolution/consultation/constant/UserRole.java` — BE 4종 enum + `fromString` + `mapLegacyRole`
- `frontend/src/utils/RoleUtils.js` — FE 4종 SSOT 헬퍼 (PR-4/9)
- `frontend/src/constants/roles.js` — `USER_ROLES`, `LEGACY_USER_ROLES`
- `src/main/resources/db/migration/V20260612_001__role_ssot_legacy_normalize.sql` —
  레거시 `users.role` 정규화 + 사후 검증 가드

### 8.2 표준·기획 문서

- [`PERMISSION_SYSTEM_STANDARD.md`](./PERMISSION_SYSTEM_STANDARD.md) — 권한 코드·동적 부여 (role_permissions)
- [`TENANT_ROLE_SYSTEM_STANDARD.md`](./TENANT_ROLE_SYSTEM_STANDARD.md) — 테넌트별 역할 운영
- [`BRANCH_DEPRECATION.md`](./BRANCH_DEPRECATION.md) — Branch 시스템 사용 중단(본 시리즈 부산물)
- [`ROLE_SSOT_PR_SERIES_RETROSPECTIVE.md`](../project-management/ROLE_SSOT_PR_SERIES_RETROSPECTIVE.md) — Role SSOT 9-PR 결산
- [`CORE_PLANNER_DELEGATION_ORDER.md`](../project-management/CORE_PLANNER_DELEGATION_ORDER.md) — PR 시리즈 위임 순서 및 게이트

---

## 9. 변경 이력

| 날짜 | 버전 | 변경 | 작성자 |
|------|------|------|--------|
| 2026-06-13 | 1.0.0 | 초안 — Role SSOT 9-PR 시리즈 PR-9/9 표준 확정 | core-coder |
| 2026-06-15 | 1.1.0 | §3.3 신설 — `ROLE_OPS` Authority + HQ 테넌트 가드 표본 패턴 (ops-portal-migration Phase 1~5 정착) | core-coder |
