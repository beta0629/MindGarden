# 디자인 v2 진입 전 표준화 잔여 로드맵 v3 (4영역 통합)

> 본 문서는 디자인 v2 전체 재디자인 진입 **직전** 의 표준화 게이트 단일 진입 문서이다.
> 코드 변경은 0 — 위임·계획·체크리스트만 다룬다.

## §0 메타

| 항목 | 값 |
|---|---|
| 작성일 | 2026-06-14 (KST) |
| 작성자 | core-coder (분배실행 산출물) |
| 목적 | 디자인 v2 전체 재디자인 진입 전 **표준화 잔여 마무리** — P0 게이트 식별 및 위임 chain 권고 |
| 입력 | 4영역 explore read-only 보고 (A 프론트엔드 / B 백엔드 / C 인프라 / D 문서) |
| 격리 워크트리 | `/Users/mind/mindGarden-standardization-roadmap-v3` (브랜치 `docs/standardization-roadmap-v3-pre-design-v2`, 베이스 `develop` 최신) |
| 메인 워크트리 점유 | 없음 |
| 기존 v5 ROADMAP | `docs/project-management/2026-06-11/STANDARDIZATION_ROADMAP.md` v5 (2026-06-12) — 보안·SMS/OTP·테스트 격리 중심 47개 항목 |
| v3 와 v5 의 관계 | v5 는 **운영 시급(B8 시크릿·E1' 솔라피·CI 큐)** 진행 트래커, v3 는 **디자인 v2 진입 전용 게이트** — 중복 항목은 §5 정합 표에 인용. v3 는 v5 의 머지 결과(#296/#299/#300/#301/#302/#303)를 전제로 한다. |

## §1 영역별 인벤토리 요약

### A. 프론트엔드 (10 카테고리, 입력 8b7bdbe3)

| ID | 카테고리 | 핵심 카운트 (occ / files) |
|---|---|---|
| A1 | API 호출 SSOT | `StandardizedApi.x()` 373/120 (정상) ↔ 우회 `apiGet/apiPost…` **328/92**, `axios.x()` 직접 29/6, `fetch(` ~140/70. expo-app 우회 0건 |
| A2 | 모달 SSOT | `<UnifiedModal` 163/129 (정상). 인라인 `position:fixed` 12 파일, `createPortal` 7 파일 (대부분 드롭다운) |
| A3 | 버튼 SSOT | `MGButton` 3155/424, `ActionBarButton` 248/42. raw `<button>` **35/21** (테스트·데모 多) |
| A4 | 레이아웃·헤더 | `AdminCommonLayout` 193/107, `ContentHeader` 118/102. 페이지 자체 헤더 ~7 |
| A5 | 디자인 토큰 | CSS `var(--mg-*)` 12,762 vs hex 1,329 + rgb 1,170 (≈84% 토큰화). JS 인라인 hex ~31, padding 85, margin 139 |
| A6 | 상수화 | constants 112(frontend)/40(expo-app). `frontend/.eslintrc.js` 의 `no-magic-numbers: off` + `no-restricted-syntax: off` 게이트 부재 |
| A7 | Role 체크 SSOT | `RoleUtils.*` 220+ / 70+ files (정상) ↔ 인라인 `role === 'X'` **9 / 4 파일** |
| A8 | i18n | frontend `useTranslation()` 331 files + locales 18, **한글 인라인 20,718 라인**. expo-app **i18n 미도입** + 한글 인라인 2,500 라인 |
| A9 | ErrorBoundary | frontend **0건**, expo-app 1건 (`app/_layout.tsx`). `try { }` frontend 1,267 / expo 117 |
| A10 | 로깅 | frontend `console.*` **2,258 / 120 files**, logger SSOT 0건, ESLint `no-console: off`. expo-app `console.*` 29 + `no-console` 정책 |

### B. 백엔드 (10 카테고리, 입력 e22dc5eb)

| ID | 카테고리 | 핵심 카운트 |
|---|---|---|
| B1 | Controller try-catch / 직접 `ResponseEntity` | `catch(Exception)` 35 파일, `ApiResponse<>` 적용 90/187 컨트롤러 |
| B2 | Service `@Transactional` / `readOnly` 부적절 혼재 | `@Transactional` 660 occ / `readOnly=true` 386 occ. 클래스 단위 혼재 5종 (Branch/Erp/CommonCode/FinancialTransaction/Onboarding) |
| B3 | Repository — JPA + native 혼용 / Service JdbcTemplate | `@Query` 1,077 / `nativeQuery=true` 413 (38%). `JdbcTemplate` 18 파일 (비-PL/SQL 9 포함) |
| B4 | Entity↔DTO 매퍼 SSOT | **MapStruct/ModelMapper 0건**. 수동 `new XxxDto(...)` 15+ occ + 정적 `from/of` 산재 |
| B5 | Exception 체계 | 커스텀 도메인 예외 17 파일 + `RuntimeException` 슈퍼타입 부재 — `throw new RuntimeException("…")` **90 파일** |
| B6 | TenantContext 헤더 직파싱 | `TenantContextHolder.` 1,500+ occ (정상) ↔ `request.getHeader("X-Tenant-Id")` 직접 파싱 **2 파일** (`TenantCommonCodeController`, `ScheduleController`) |
| B7 | LogSanitizer 미적용 | SSOT 존재, 실제 적용 **0건**. PII/userInput 직접 로그 ≈ 350+ occ |
| B8 | `@PreAuthorize` & `SecurityConfig` permitAll | 187 컨트롤러 중 `@PreAuthorize` 적용 53 (28%). `anyRequest().permitAll()` **2 FilterChain 모두 L192·L272** |
| B9 | PII `@Convert(AttributeConverter)` | 엔티티 `@Convert` 단 1건 (`User.role` enum). email/name/phone 평문 컬럼 `length=500`. Service 수동 암복호화 58 파일 |
| B10 | `SimpleJdbcCall` `withCatalogName/SchemaName` | 4 PL/SQL Service 중 적용 **1건만** (`PlSqlStatisticsServiceImpl` hotfix). `prepareCall()` 29 occ / 6 파일 SSOT 미일관 |

### C. 인프라 (6 카테고리, 입력 2ab26e82)

| ID | 카테고리 | 핵심 카운트 |
|---|---|---|
| C1 | secrets-sync composite | **PR #303 머지 완료 (2026-06-14)** — `.github/actions/secrets-sync/` 신설. 잔여 적용 후보 ~12 워크플로 |
| C2 | DB env SSOT (`prod.env` vs `prod-from-dev.env`) | 워크플로 참조 9개, `deploy-production.yml` 58건. PR #296 가드 100건 중복(DRY 위배). systemd `Environment=` 가 unit 우선순위로 덮어씀 |
| C3 | systemd unit `Environment=` 평문 secret 잔존 | 운영 unit `Environment=` **평문 secret 6종** 잔존 (`JWT_SECRET` 등). `*.example` 은 `SERVER_PORT` 1행만. 충돌 키 15건 |
| C4 | Flyway naming convention | 총 297 V*.sql. 신표준 `V<yyyymmdd>_<NNN>__` 209, 레거시 87, 위반 1건 (`V12_1__`) |
| C5 | Discord 알림 / 모니터링 격차 | webhook 5건 정상. **누락 알람 4종** — ① 자정 cron 실패 (4일 누적 운영 영향) ② NTP drift > 60s ③ 상시 헬스 DOWN ④ BE 부트 실패·재시작 루프 |
| C6 | CI 워크플로 — `actions/cache@v3` outdated | 9건 잔존 (deploy-backend-dev/dev/production/onboarding-dev, code-quality-check ×3, codeql). self-hosted runner 미도입 (v5 C8 검토 중) |

### D. 문서 (4 카테고리, 입력 4349c074)

| ID | 카테고리 | 핵심 카운트 |
|---|---|---|
| D1 | `docs/standards/` 완전성 | 94개 표준 인벤토리. **신규 권고 6종**: SECRET_ROTATION_POLICY / SYSTEMD_FALLBACK_DB_ENV_POLICY / NTP_MONITORING_POLICY / LOG_INJECTION_GUARD_POLICY / FEATURE_TOGGLE_POLICY / AB_TEST_POLICY |
| D2 | `docs/운영반영/` 인계 | **결정적 부재 3건** — OPS_P1_BCD_ACTION_TRACKER (체크리스트 ☐ 잔존) / CRON_SQL_HOTFIX_HANDOFF (4일 누적 실패) / DB_ENV_SSOT_REMEDIATION_HANDOFF |
| D3 | `project-management/` 회고록 | 누락 4종 — MGBUTTON_SSOT_PHASE_1_6 / BRANCH_DEPRECATION_MONITORING / DESIGN_SYSTEM_V2_PHASE_1_4 / HQ_MASTER_OPS_PORTAL_SEPARATION_PLAN |
| D4 | SSOT 충돌·메타 정합 | 3대 충돌 — DB env (3 문서 분산), OAuth callback URL (표준 부재), 로깅·알람 (5 문서 분산). 갱신 4종 |

## §2 P0/P1/P2/P3 분류표

> **차단?** 컬럼 = "디자인 v2 진입 차단? (Y/N)". Y 는 디자인 v2 머지 게이트 이전에 반드시 정리해야 하는 항목.
> **소요** = s(≤0.5d) / m(0.5~2d) / l(2d+).

| ID | 카테고리 | 우선순위 | 담당 | 의존성 | 소요 | 차단? |
|---|---|---|---|---|---|---|
| **A8** | expo-app i18n 정책 신설 | **P0** | core-planner → core-coder | — | l | Y |
| **A9** | frontend ErrorBoundary SSOT 신설 + App 래핑 | **P0** | core-coder | — | m | Y |
| **B6** | TenantContext 헤더 직파싱 제거 (2 파일) | **P0** | core-coder | — | s | Y |
| **B7** | LogSanitizer Aspect 도입 + 350+ 라인 일괄 치환 | **P0** | core-planner → core-coder + core-tester | — | l | Y |
| **B8** | SecurityConfig `anyRequest().permitAll()` 제거 + 134 무가드 컨트롤러 `@PreAuthorize` 일괄 | **P0** | core-planner → core-coder + core-tester | — | l | Y |
| **B9** | PII `AttributeConverter` 3종(email/name/phone) + 엔티티 일괄 `@Convert` | **P0** | core-planner → core-coder + core-tester | DB 백업 | l | Y |
| **B10** | PL/SQL 3 파일 `withCatalogName/SchemaName` 보강 (9 호출지점) | **P0** | core-coder | v5 C2 머지 후 | m | Y |
| **C2** | DB env SSOT 통합 (`prod.env` 단일화 + 4 sync job DRY) | **P0** | core-coder | v5 #300 머지 | l | Y |
| **C3** | systemd unit `Environment=` 평문 secret 6종 제거 + `EnvironmentFile=` 단일화 | **P0** | core-deployer | 운영 윈도우 | m | Y |
| **C5** | Discord 알람 4종 격차 — 자정 cron / NTP / 헬스 / 부트 실패 | **P0** | core-coder + core-deployer | v5 C9 | l | Y |
| **D1-1** | `SECRET_ROTATION_POLICY.md` 신규 (JWT 90d/AES 180d) | **P0** | generalPurpose(문서) | v5 B8 인계 | s | Y |
| **D1-2** | `SYSTEMD_FALLBACK_DB_ENV_POLICY.md` 신규 (3-tier 명문화) | **P0** | generalPurpose(문서) | C2/C3 | s | Y |
| **D1-4** | `LOG_INJECTION_GUARD_POLICY.md` 신규 (CodeQL/CRLF 가드) | **P0** | generalPurpose(문서) | B7 | s | Y |
| **D2-①** | `OPS_P1_BCD_ACTION_TRACKER_20260611.md` 신규 (sign-off) | **P0** | generalPurpose(문서) | 운영팀 회신 | s | Y |
| **D2-②** | `CRON_SQL_HOTFIX_HANDOFF_20260614.md` 신규 (B10 위임용) | **P0** | generalPurpose(문서) | — | s | Y |
| **D2-③** | `DB_ENV_SSOT_REMEDIATION_HANDOFF.md` 신규 | **P0** | generalPurpose(문서) | C2/C3 | s | Y |
| A1 | API 호출 우회 ~360 호출 정리 | P1 | core-coder | — | l | N |
| A5 | JS 인라인 hex 31 + padding 85 + margin 139 + CSS hex 1,329 토큰화 | P1 | core-coder + core-designer | 토큰 인벤토리 | l | N |
| A10 | frontend logger SSOT 신설 + console 2,258 제거 + ESLint `no-console` 활성화 | P1 | core-coder | — | l | N |
| B1 | Controller `ApiResponse<>` 일관화 + try-catch 제거 (~100 파일) | P1 | core-coder | — | l | N |
| B2 | `@Transactional` readOnly 분리 (5 ServiceImpl 클러스터) | P1 | core-coder + core-tester | — | m | N |
| B3 | 비-PL/SQL JdbcTemplate 9 파일 정리 | P1 | core-coder | — | m | N |
| B5 | `ApiException` 슈퍼타입 도입 + `RuntimeException` 90 파일 치환 | P1 | core-coder | — | l | N |
| C6 | `actions/cache@v3` 9건 → v4 일괄 치환 (Dependabot 자동 PR 대기 가능) | P1 | core-deployer | — | s | N |
| D1-3 | `NTP_MONITORING_POLICY.md` 신규 | P1 | generalPurpose(문서) | C5 ② | s | N |
| D1-5 | `FEATURE_TOGGLE_POLICY.md` 신규 (`@ConditionalOnProperty` 가이드) | P1 | generalPurpose(문서) | — | s | N |
| D3-1 | `MGBUTTON_SSOT_PHASE_1_6_RETROSPECTIVE.md` 신규 | P1 | generalPurpose(문서) | — | m | N (v2 입력값으로 사전 권장) |
| D4-1~4 | 표준 4종 갱신 (ENVIRONMENT_VARIABLE / SECURITY_AUTHENTICATION / LOGGING / CORE_PLANNER_DELEGATION_ORDER) | P1 | generalPurpose(문서) | D1 신규 4종 | m | N |
| A2 | 모달 잔존 드롭다운 포털 정리 (12 파일) | P2 | core-coder | — | s | N |
| A3 | raw `<button>` 21 파일 정리 | P2 | core-coder | — | s | N |
| A4 | 페이지 자체 헤더 ~7 ContentHeader 마이그레이션 | P2 | core-coder | — | s | N |
| A6 | `frontend/.eslintrc.js` 게이트 강화 (`no-magic-numbers` warn) | P2 | core-coder | — | s | N |
| A7 | 인라인 role 4 파일 → RoleUtils 치환 | P2 | core-coder | — | s | N |
| B4 | MapStruct 도입 + 매퍼 SSOT 30종 신설 | P2 | core-planner → core-coder | — | l | N |
| C4 | Flyway naming pre-commit 정규식 lint 추가 | P2 | core-tester | — | s | N |
| D1-6 | `AB_TEST_POLICY.md` 신규 | P2 | generalPurpose(문서) | — | s | N |
| D3-2 | `BRANCH_DEPRECATION_MONITORING_RETROSPECTIVE.md` | P2 | generalPurpose(문서) | 모니터링 윈도우 종료 | s | N |
| D3-3 | `DESIGN_SYSTEM_V2_PHASE_1_4_RETROSPECTIVE.md` | P2 | generalPurpose(문서) | — | m | N |
| D3-4 | `HQ_MASTER_OPS_PORTAL_SEPARATION_PLAN.md` | P2 | core-planner → generalPurpose(문서) | Role SSOT 회고 §4 | m | N |

**P0 = 16건**, **P1 = 12건**, **P2 = 11건**. (총 39건)

## §3 디자인 v2 진입 게이트 체크리스트

> 아래 체크박스가 모두 ✅ 되어야 디자인 v2 전체 재디자인 진입 가능.

- [ ] **P0 16건** 모두 완료 (운영팀 회신 포함)
  - [ ] A8 (expo-app i18n) · A9 (FE ErrorBoundary)
  - [ ] B6 · B7 · B8 · B9 · B10 (백엔드 보안 5종)
  - [ ] C2 · C3 · C5 (인프라 운영 3종)
  - [ ] D1-1 · D1-2 · D1-4 (표준 신규 3종)
  - [ ] D2-① · D2-② · D2-③ (운영 인계 3종)
- [ ] **P1 중 임계 4종 완료 (선택)**
  - [ ] A1 (API 우회) — 디자인 v2 신규 페이지가 SSOT 강제 시 사전 정리 권장
  - [ ] A10 (logger SSOT) — v2 QA 노이즈 차단
  - [ ] B1 (Controller ApiResponse) — v2 신규 BE 엔드포인트 일관성
  - [ ] D4-3 (LOGGING_STANDARD 갱신) — B7·D1-4 결과 흡수
- [ ] **운영팀 인계 P1-B/C/D 처리 또는 인계 문서 작성**
  - [ ] D2-① 트래커 sign-off 회신 수령
  - [ ] v5 ROADMAP §4 사용자 외부 액션 8건 중 미완료분 인수인계
- [ ] **D 문서 신규 13건 중 P0 5건 작성 완료**
  - [ ] SECRET_ROTATION_POLICY / SYSTEMD_FALLBACK_DB_ENV_POLICY / LOG_INJECTION_GUARD_POLICY
  - [ ] OPS_P1_BCD_ACTION_TRACKER / CRON_SQL_HOTFIX_HANDOFF

## §4 추천 chain (디자인 v2 진입 전 권장 순서)

> 의존성 그래프 기반. 동일 순위 내부는 병렬 가능.

1. **1순위 (즉시 — 운영 P0 묶음, 1.5~3d)**
   - **C2 + C3 + C5(자정 cron)** — 단일 운영 윈도우에서 통합. `core-deployer` + `core-coder` 병렬.
   - 산출물: `prod.env` 단일화, systemd unit `Environment=` 6 secret 제거, `log_watcher.sh` v1 + cron 실패 webhook.
2. **2순위 (보안 P0 묶음, 2~3d)**
   - **B7 + B8 + B9 + B6 + B10** — `core-planner` 1차 배치.
   - B6(2 파일) → B10(9 호출지점) 선행, B7(Aspect)·B8(SecurityConfig + 134 컨트롤러)·B9(`AttributeConverter` 3종 + 엔티티 일괄) 병렬.
3. **3순위 (FE P0, 1~2d)**
   - **A9 (ErrorBoundary SSOT)** → **A8 (expo-app i18n 정책)**.
   - A9 는 단일 컴포넌트 + App.js 래핑. A8 은 `expo-app/src/i18n/` 신설 + `locales/ko/*.json` SSOT.
4. **4순위 (D 문서 P0 5종, 1d)**
   - `generalPurpose(문서)` 병렬 5건.
   - D1-1·D1-2·D1-4 (표준 신규 3종) + D2-② · D2-③ (운영 인계 2종).
   - D2-① 은 운영팀 회신 시점에 즉시 sign-off 갱신.
5. **5순위 ~ (P1 후속, 디자인 v2 와 병렬 가능)**
   - A1 / A10 / B1 / B5 / C6 / D1-3·5 / D3-1 / D4-1~4.
   - A1·A10·B1 은 디자인 v2 신규 페이지 작성과 충돌 가능 → **v2 착수 직전 머지 권장**.

## §5 v5 ROADMAP 과의 정합

| v5 ID | v5 카테고리 | v3 대응 | 정합 메모 |
|---|---|---|---|
| v5 B1 | SessionFilter clear() 가드 | (v3 무관) | v5 Phase 1 머지 후 v3 B6 와 무관 (별개 영역) |
| v5 B4 | OTP body 평문 제거 | (v3 무관) | v5 Phase 1 솔라피 SSOT 진행 중 |
| v5 **B8** | systemd 평문 비밀번호 정리 | **v3 C3** (확장) | **중복** — v5 B8 은 DB 비밀번호 단일, v3 C3 은 6종 secret 전체. v3 C3 가 v5 B8 을 흡수 |
| v5 C9 | CI 큐 모니터링 알람 | **v3 C5 ④** (확장) | v3 C5 ④ "BE 부트 실패" 와 v5 C9 "CI 큐 정체" 알람 — Discord webhook 채널 공유 |
| v5 C8 | self-hosted runner PoC | (v3 무관, 의존성) | v3 C6 (`cache@v3` 9건) 정리 후 self-hosted PoC 가 안정적 |
| v5 E1' / E1'' | 솔라피 SSOT 검증 | (v3 무관) | v5 Phase 1 진행 중. 디자인 v2 가 OTP 화면 재디자인 포함 시 v3 후속 추가 검토 |
| v5 A4 | SecurityContext leak 정리 | (v3 무관, 테스트 격리) | v5 Phase 1 진행 중 |
| v5 B6/B7 | FE dedup + BE `/auth/current-user` | **v3 A1** (간접 관련) | v3 A1 은 SSOT 우회 전반, v5 B6 은 특정 endpoint dedup. v3 진행 시 v5 B6 결과 인용 |
| v5 H5/H6 | 하드코딩 게이트 강화 | (v3 무관) | v5 Phase 1 완료. v3 의 A6 (eslint 게이트) 가 frontend 측 후속 |
| v5 D1/D2 | OAuth REGISTERED_URLS | **v3 D4-2** | v3 D4-2 (`SECURITY_AUTHENTICATION_STANDARD.md` §OAuth 신설) 는 v5 D1/D2 사용자 외부 액션 완료 후 SSOT 흡수 |
| v5 G1/G2/G4 | 모니터링 알람 | **v3 C5** (확장) | v3 C5 의 4종 격차 매트릭스가 v5 G1·G2·G4 의 사용자 외부 액션을 흡수 |

**원칙**: v5 진행 중 항목은 v3 에 별도 표기 없이 **의존성으로만 인용**. v3 는 디자인 v2 게이트 전용이며, v5 의 운영 시급(P0) 머지 결과를 입력으로 받는다.

## §6 작업량 종합

| 구분 | 항목 수 | man-day 추정 (s=0.5 / m=1.5 / l=3 기준) |
|---|---|---|
| P0 총합 | 16건 | **약 23.5 man-day** (s=7건 × 0.5 + m=4건 × 1.5 + l=5건 × 3 = 3.5 + 6 + 15) |
| P1 총합 | 12건 | **약 19 man-day** (s=3건 × 0.5 + m=4건 × 1.5 + l=5건 × 3 = 1.5 + 6 + 15 + 보정) |
| P2 총합 | 11건 | **약 10.5 man-day** (s=7건 × 0.5 + m=2건 × 1.5 + l=2건 × 3 = 3.5 + 3 + 6 보정) |

> 위 추정은 단일 워커 산정. 실제로는 §4 추천 chain 의 1·2·3·4 순위가 병렬화 가능하여 **digital working day 기준 디자인 v2 진입까지 약 7~10 영업일** 예상.
>
> - **1·2·3 순위 P0 묶음 (실병렬, 3~4영업일)**: C2+C3+C5 (운영 윈도우) + B6·B7·B8·B9·B10 (백엔드 보안) + A8·A9 (FE).
> - **4 순위 D 문서 (병렬, 1영업일)**: P0 5종.
> - **5 순위 P1 후속 (v2 착수 직전 머지, 3~5영업일)**: A1·A10·B1 우선.
>
> **디자인 v2 진입 게이트 통과 예상**: 2026-06-24 ± 2영업일 (P0 16건 완료 가정).

## §7 다음 단계 (사용자 검수 후 권고)

1. 사용자 본 문서 검수 → 1·2·3·4 순위 chain 위임 승인.
2. `core-planner` Task 위임 (모델: `gemini-3.1-pro` 권고는 v3 의 디자인 사전 정리 성격 적합) — 분배실행 표 생성.
3. P0 chain 1순위 (C2+C3+C5) 부터 `core-deployer` + `core-coder` 병렬 위임.
4. 진행 중 각 P0 종결 시점에 본 문서 §3 체크리스트 갱신 (별도 PR 또는 inline 갱신).
5. P0 16건 완료 → 디자인 v2 전체 재디자인 진입 게이트 통과 회신.

---

**문서 끝.** (코드 변경 0 — 본 문서는 분배·계획만)
