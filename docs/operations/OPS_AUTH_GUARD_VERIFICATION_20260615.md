# OPS 권한 가드 (Phase 1~5) 자동 검증 보고서 — 2026-06-15

## 0. 메타데이터

| 항목 | 값 |
|------|------|
| 검증 일시 | 2026-06-15 13:50 ~ 13:53 KST |
| 검증자 | core-tester (자동 워커) |
| 검증 베이스 | `origin/develop` HEAD `6246675e9` (Phase 6 ROLE_STANDARD §3.3) |
| 운영 베이스 | `origin/main` HEAD `e15c40285` (PR #380 develop → main) |
| 검증 환경 | 격리 워크트리 `/Users/mind/mindGarden-ops-auth-verify` (detached HEAD) |
| 환경 변수 | `MINDGARDEN_HQ_TENANT_ID=test-hq` (fail-fast 우회용 테스트 주입) |
| 표준 참조 | `docs/standards/ROLE_STANDARD.md` §3.3, `docs/project-management/OPS_PORTAL_MIGRATION_PLAN.md` |

> **시나리오 대체 인정 근거**: 외부 테넌트 ADMIN 계정 부재로 직접 운영 토큰 발급이 불가하여, **BE 단위/통합 회귀 테스트**로 옵션 3+1 하이브리드 가드 (OPS Authority + HQ 테넌트 자체 검증) 의 6종 시나리오를 등가 검증한다. 통합 토큰 시나리오는 후속 사용자 검수 권고.

---

## 1. BE 회귀 테스트 결과 집계

### 1.1 Phase 1 — PII (PR #362, eaa2c91fc)

| 항목 | 값 |
|------|------|
| 명령 | `MINDGARDEN_HQ_TENANT_ID=test-hq mvn -B test -Dtest='PiiKeyRotationAdminControllerTest'` |
| 결과 | **Tests run: 19, Failures: 0, Errors: 0, Skipped: 0** |
| 소요 | 1.210 s |
| 결론 | **PASS** |

회귀 커버리지:

- 4 endpoints (start / progress / resume / cancel) dispatch + PII 비노출 (정규식 가드)
- 옵션 3+1 하이브리드 8건:
  - `#1` ROLE_OPS + HQ 테넌트 → 200 ✓
  - `#2` ROLE_OPS + 외부 테넌트 → 403 (`AccessDeniedException("본사 ... 외부 테넌트")`) ✓
  - `#3` ROLE_ADMIN + HQ 테넌트 → 403 (@PreAuthorize OPS 가드, reflection 검증) ✓
  - `#4` ROLE_ADMIN + 외부 테넌트 → 403 (이중 차단) ✓
  - `#5` ROLE_STAFF → 403 (Phase 1b JwtFilter STAFF→OPS 자동 부여 차단 후 활성) ✓
  - `#6` ROLE_CONSULTANT → 403 ✓
  - `#7` ROLE_CLIENT → 403 ✓
  - `#8` 무인증 → 401 (클래스 레벨 @PreAuthorize 부착 회귀) ✓
- `OpsTenantConstants` fail-fast 회귀 3건 (`null`, blank, exact-match) ✓

### 1.2 Phase 2 — 시스템 모니터링 (PR #370, f051253f8)

| 항목 | 값 |
|------|------|
| 명령 | `... -Dtest='*Monitoring*Test,*SystemMetrics*Test,*AiUsage*Test,*Observability*Test'` |
| 결과 | **Tests run: 96, Failures: 0, Errors: 0, Skipped: 0** |
| 결론 | **PASS** |

OPS 가드 핵심 테스트 (25건):

| 테스트 클래스 | 건수 | 결과 |
|---------------|------|------|
| `SystemMetricsControllerOpsGuardTest` | 6 | PASS |
| `SchedulerMonitoringControllerOpsGuardTest` | 6 | PASS |
| `MonitoringControllerOpsGuardTest` | 5 | PASS |
| `AIMonitoringControllerOpsGuardTest` | 8 | PASS |

관련 통합/단위 회귀 (71건): `NotificationBatchSendLogPushMonitoringTest`(4), `AiUsageLogTest`(5), `AdminAiUsageControllerTest`(11), `NotificationMonitoringSmsLogTest`(5), `AdminPushMonitoringControllerTest`(8), `PushMonitoringErrorCategorizationTest`(8), `AdminPushMonitoringServiceImplTest`(16), `AiUsageStatsServiceTest`(14) — 모두 PASS.

### 1.3 Phase 3 — 보안 감사 (PR #373, daee3ad74)

| 항목 | 값 |
|------|------|
| 명령 | `... -Dtest='*SecurityAudit*Test,*AdminAccessAudit*Test'` |
| 결과 | **Tests run: 7, Failures: 0, Errors: 0, Skipped: 0** |
| 소요 | 1.646 s |
| 결론 | **PASS** |

`SecurityAuditControllerOpsGuardTest` — 옵션 3+1 하이브리드 7건 (PreAuthorize OPS + HQ 가드) 모두 PASS.

### 1.4 Phase 4 — 테넌트 관리 (PR #375, 969f5e318)

| 항목 | 값 |
|------|------|
| 명령 | `... -Dtest='*Tenant*Settings*Test,*DynamicPermission*Test,*SuperAdminTenant*Test'` |
| 결과 | **Tests run: 38, Failures: 0, Errors: 0, Skipped: 0** |
| 결론 | **PASS** |

| 테스트 클래스 | 건수 | 결과 |
|---------------|------|------|
| `SuperAdminTenantComponentControllerOpsGuardTest` | 4 | PASS |
| `AdminTenantSmsSettingsControllerTest` (통합) | 6 | PASS |
| `AdminTenantKakaoAlimtalkSettingsControllerTest` (통합) | 7 | PASS |
| `TenantSmsSettingsServiceImplTest` | 6 | PASS |
| `TenantKakaoAlimtalkSettingsServiceImplTest` | 2 | PASS |
| `DynamicPermissionServiceImplStaffEqualityTest` | 8 | PASS |
| `DynamicPermissionServiceImplCanRegisterSchedulerTest` | 5 | PASS |

### 1.5 Phase 5 — FE Role 헬퍼 (PR #378, 4ee8536a3)

| 항목 | 값 |
|------|------|
| 명령 | `npm test -- --testPathPattern='RoleUtils.test.js' --watchAll=false` (worktree에 main `node_modules` 심볼릭 링크) |
| 결과 | **Tests: 24 passed, 24 total** (Test Suites: 1 passed) |
| 소요 | 0.996 s |
| 결론 | **PASS (24/24)** |

`isOps` 신규 케이스 (Phase 5 추가):

- `OPS_AWARE_LEGACY_ROLES` (`HQ_MASTER` / `HQ_ADMIN` / `SUPER_HQ_ADMIN` / `SUPER_ADMIN`) → `true`
- 일반 `ADMIN` / `STAFF` / `CONSULTANT` / `CLIENT` → `false` (BE 의 ROLE_OPS Authority 미부여 정합)
- `null` / `undefined` / 공백 → `false`
- 대소문자 무관 (toUpperCase 후 비교)

기존 SSOT (`isAdmin`, `isStaff`, `isConsultant`, `isClient`, `mapLegacyRole`, `hasRole`, `hasAnyRole`) 모두 회귀 PASS.

### 1.6 BE 총합

| Phase | 테스트 클래스 수 | 테스트 건수 | 결과 |
|-------|-----------------|-------------|------|
| Phase 1 | 1 | **19** | PASS |
| Phase 2 | 12 | **96** | PASS |
| Phase 3 | 1 | **7** | PASS |
| Phase 4 | 7 | **38** | PASS |
| **BE 소계** | **21** | **160** | **ALL PASS** |
| Phase 5 (FE) | 1 (suite) | **24** | PASS |
| **총합** | **22** | **184** | **ALL PASS** |

---

## 2. 운영 endpoint curl smoke

### 2.1 PROD endpoint 라우팅 (`https://app.core-solution.co.kr`)

토큰 없이 `X-Tenant-ID: test-smoke` 헤더만 전송하여 라우팅·인증 분기 동작 확인.

| HTTP | Endpoint |
|------|----------|
| **401** | `/api/v1/admin/security/pii-key-rotation/progress` |
| **401** | `/api/v1/admin/ai/usage` |
| **401** | `/api/v1/admin/system/metrics` |
| **401** | `/api/v1/admin/security-audit/events` |
| **401** | `/api/v1/admin/tenant-sms-settings/config` |

**판정**: 5/5 모두 `401 Unauthorized` (인증 필요) — 404 가 아니므로 라우팅·필터·@PreAuthorize 체인이 정상 적재되었음을 확인. (X-Tenant-ID 미전송 시 400 — 테넌트 헤더 필터가 먼저 동작).

### 2.2 DEV endpoint 라우팅 (`https://api-dev.core-solution.co.kr`)

> **호스트명 보정**: 작업 지시서의 `https://dev.app.core-solution.co.kr` 는 현재 TLS handshake failure (`SSL alert 40`, Cloudflare 종단). 운영 SSOT (`tests/e2e/README.md`) 의 `https://dev.core-solution.co.kr` 는 `502 Bad Gateway`. 실제 동작 중인 DEV API origin 은 `https://api-dev.core-solution.co.kr` (=`https://dev-api.core-solution.co.kr` 동일 백엔드) 로 확인되어 이로 검증.

| HTTP | Endpoint |
|------|----------|
| **401** | `/api/v1/admin/security/pii-key-rotation/progress` |
| **401** | `/api/v1/admin/ai/usage` |
| **401** | `/api/v1/admin/system/metrics` |
| **401** | `/api/v1/admin/security-audit/events` |
| **401** | `/api/v1/admin/tenant-sms-settings/config` |

**판정**: 5/5 모두 `401` — DEV 도 라우팅·가드 체인 정상.

### 2.3 actuator/health

| 호스트 | HTTP | Body |
|--------|------|------|
| `https://app.core-solution.co.kr/actuator/health` | 200 | `{"status":"UP"}` |
| `https://api-dev.core-solution.co.kr/actuator/health` | 200 | `{"status":"UP"}` |
| `https://dev-api.core-solution.co.kr/actuator/health` | 200 | `{"status":"UP"}` |
| `https://dev.core-solution.co.kr/actuator/health` | 502 | `error code: 502` (별도 인프라 이슈 — OPS 가드 무관) |
| `https://dev.app.core-solution.co.kr/actuator/health` | 000 | TLS handshake failure (별도 인프라 이슈 — OPS 가드 무관) |

**판정**: PROD `UP`, DEV (api-dev / dev-api) `UP` — OPS 가드 적재 환경 정상.

### 2.4 fail-fast 검증

- 운영/개발 양쪽 `actuator/health` 가 `{"status":"UP"}` 이므로 `OpsTenantConstants#validate()` 의 `@PostConstruct` fail-fast 가 통과한 상태로 부팅된 것이 검증됨.
- 즉, **`MINDGARDEN_HQ_TENANT_ID` 환경 변수가 정상 주입**되어 `IllegalStateException` (`Set MINDGARDEN_HQ_TENANT_ID...`) 없이 Spring 컨텍스트가 기동.

---

## 3. 옵션 3+1 하이브리드 6종 시나리오 종합 정합

| # | 시나리오 | BE 회귀 | curl smoke (직접) | 종합 판정 |
|---|---------|---------|-------------------|-----------|
| 1 | ROLE_OPS + HQ 테넌트 → 200 | ✅ Phase 1 #1 (PII), Phase 2~4 OpsGuard | (실 OPS 토큰 미보유 — 시나리오 대체) | **PASS (대체)** |
| 2 | ROLE_OPS + 외부 테넌트 → 403 | ✅ Phase 1 #2 (`AccessDeniedException`), Phase 2~4 HQ 가드 | (대체) | **PASS (대체)** |
| 3 | ROLE_ADMIN + HQ 테넌트 → 403 | ✅ Phase 1 #3 (PreAuthorize reflection) | 5 endpoints 401 → 라우팅 정합 | **PASS (대체)** |
| 4 | ROLE_ADMIN + 외부 테넌트 → 403 | ✅ Phase 1 #4 (이중 차단) | (대체) | **PASS (대체)** |
| 5 | ROLE_STAFF → 403 | ✅ Phase 1 #5 (Phase 1b JwtFilter 회귀) | (대체) | **PASS (대체)** |
| 6 | 무인증 → 401 | ✅ Phase 1 #8 | ✅ 10/10 endpoint 401 (5 prod + 5 dev) | **PASS (직접)** |

> ROLE_CONSULTANT (#6) / ROLE_CLIENT (#7) 도 Phase 1 회귀에서 함께 PASS (PreAuthorize 표현식 `hasRole('OPS')` 가 CONSULTANT/CLIENT 비포함 검증).

---

## 4. 검증 결론

### 4.1 종합 판정: **PASS** (모든 자동 검증 항목 통과)

- BE 회귀: **160/160 PASS** (4 Phases × 21 클래스)
- FE 회귀: **24/24 PASS** (Phase 5 RoleUtils — `isOps` 신규 + 기존 SSOT)
- PROD endpoint 라우팅: **5/5 401** (가드 체인 정상)
- DEV endpoint 라우팅: **5/5 401** (가드 체인 정상)
- actuator/health: PROD UP, DEV (api-dev / dev-api) UP — fail-fast 통과
- 옵션 3+1 6종 시나리오: 회귀 + 직접 smoke 정합 (1 건 직접 + 5 건 시나리오 대체)

### 4.2 보조 발견 (OPS 가드와 무관 — 운영 정보)

1. `https://dev.app.core-solution.co.kr` — TLS handshake failure (Cloudflare). 작업 지시서의 호스트 표기와 실제 DEV API origin 이 불일치.
2. `https://dev.core-solution.co.kr` — 502 Bad Gateway. e2e README SSOT (`tests/e2e/README.md`) 의 dev API URL 도 현재 정상 응답하지 않음.
3. **실 동작 DEV API origin** = `https://api-dev.core-solution.co.kr` 또는 `https://dev-api.core-solution.co.kr` (동일 백엔드, 둘 다 200 UP). DEV 호스트 SSOT 문서 정합 필요.

> 위 발견은 본 작업 (OPS 권한 가드) 의 정상 동작 판정에 영향이 없으며, 별도 운영 핸드오프로 처리 권고.

### 4.3 권장 후속 (선택)

- **사용자 직접 검수** (외부 테넌트 ADMIN 계정 보유 시): 실 토큰으로 `Authorization: Bearer ...` + `X-Tenant-ID: <외부 테넌트>` 호출하여 5 endpoint 모두 `403` 응답 직접 확인. (현재는 BE 회귀 등가 시나리오 + curl 401 라우팅 정합으로 PASS 인정.)
- DEV API 호스트 SSOT 정합 (`tests/e2e/README.md`, 핸드오프 문서) — `dev.core-solution.co.kr` 502 / `dev.app.core-solution.co.kr` TLS handshake fail 별도 트래킹.

### 4.4 금지 사항 준수

- ✅ 코드 수정 없음 (테스트 실행만)
- ✅ 운영 DB 변경 없음 (단위/통합 테스트는 H2 in-memory)
- ✅ 외부 테넌트 ADMIN 계정 생성/사칭 없음 — BE 회귀 등가 시나리오로 대체
- ✅ 메인 트랙 침범 없음 — 격리 워크트리 (`/Users/mind/mindGarden-ops-auth-verify`, detached HEAD `6246675e9`) 사용
- ✅ 디자인 v2 / PR #310 영역 비접촉

---

## 5. 부록 — 실행 로그 요약

### 5.1 워크트리 생성

```
git worktree add /Users/mind/mindGarden-ops-auth-verify --detach origin/develop
# HEAD now at 6246675e9 docs(ops-portal): Phase 6 — ROLE_STANDARD §3.3 신설 + 마이그 계획서 완료 갱신 (#379)
```

### 5.2 Maven 명령

```
# Phase 1
MINDGARDEN_HQ_TENANT_ID=test-hq mvn -B test -Dtest='PiiKeyRotationAdminControllerTest'
# Phase 2
MINDGARDEN_HQ_TENANT_ID=test-hq mvn -B test \
  -Dtest='*Monitoring*Test,*SystemMetrics*Test,*AiUsage*Test,*Observability*Test'
# Phase 3
MINDGARDEN_HQ_TENANT_ID=test-hq mvn -B test -Dtest='*SecurityAudit*Test,*AdminAccessAudit*Test'
# Phase 4
MINDGARDEN_HQ_TENANT_ID=test-hq mvn -B test \
  -Dtest='*Tenant*Settings*Test,*DynamicPermission*Test,*SuperAdminTenant*Test'
```

### 5.3 npm 명령 (worktree 의 frontend/node_modules 는 main 워크스페이스 심볼릭 링크 — 빌드 도구 인스톨 회피)

```
cd /Users/mind/mindGarden-ops-auth-verify/frontend
ln -s /Users/mind/mindGarden/frontend/node_modules node_modules
CI=true npm test -- --testPathPattern='RoleUtils.test.js' --watchAll=false
```

### 5.4 curl smoke

```
# PROD (X-Tenant-ID: test-smoke)
curl -sI -H 'X-Tenant-ID: test-smoke' https://app.core-solution.co.kr/api/v1/admin/...  → 401
curl -s https://app.core-solution.co.kr/actuator/health  → {"status":"UP"}

# DEV (api-dev origin)
curl -sI -H 'X-Tenant-ID: test-smoke' https://api-dev.core-solution.co.kr/api/v1/admin/... → 401
curl -s https://api-dev.core-solution.co.kr/actuator/health  → {"status":"UP"}
```

---

**보고서 생성**: 2026-06-15 13:53 KST · core-tester 자동 워커  
**기록 위치**: `docs/operations/OPS_AUTH_GUARD_VERIFICATION_20260615.md`  
**워크트리**: `/Users/mind/mindGarden-ops-auth-verify` (검증 종료 후 보관 — `git worktree remove` 는 사용자 결정)
