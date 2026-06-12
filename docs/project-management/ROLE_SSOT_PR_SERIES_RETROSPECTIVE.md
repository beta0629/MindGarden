# Role SSOT 9-PR 시리즈 결산(Retrospective)

**작성일**: 2026-06-13
**상태**: 시리즈 종결 보고 — PR-1 ~ PR-9 모두 머지 완료
**오너**: Core Solution (MindGarden) 아키텍처/운영 팀

---

## 0. 한 줄 요약

ADMIN/STAFF/CONSULTANT/CLIENT **4종 SSOT** 와 **Branch 시스템 사용 중단**을 9개 PR
(BE → FE → DB → Test → Docs) 로 무중단(운영 영향 0건) 정착시켰다.

---

## 1. PR 시리즈 인벤토리 (PR-1 ~ PR-9)

| PR | 머지 PR# | 머지 SHA | 머지 시각 (KST) | 영역 | 목적 / 핵심 변경 |
|----|----------|----------|------------------|------|-------------------|
| PR-1 | [#275](https://github.com/beta0629/MindGarden/pull/275) | `ba1afc191` | 2026-06-12 12:50 | BE | `UserRole` enum 4종 SSOT 재정립. `PLAY_THERAPIST`/`SPEECH_THERAPIST` 제거 → `CONSULTANT` 흡수 + `users.professional_provider_type_code` 컬럼으로 specialization 분리. `mapLegacyRole` 호환 매핑 추가. 9개 인벤토리 파일 PLAY/SPEECH case 정리. |
| PR-2 | [#279](https://github.com/beta0629/MindGarden/pull/279) | `6c0b1d3a9` | 2026-06-12 15:26 | BE | `@PreAuthorize` 4종 SSOT 9건 변환 — `BrandingController` 5건(+ tenant 자체 가드), `AdminMappingCleanupController` 3건, `AdminMaintenanceController` 1건. `BrandingControllerTenantGuardTest` 신규 6건. HQ_MASTER 17건은 Ops Portal 분리(별도 후속 PR) 로 위임. |
| PR-3 | [#280](https://github.com/beta0629/MindGarden/pull/280) | `5ccbe3be1` | 2026-06-12 16:58 | BE | Branch 클래스 13개 Spring Bean 에 `@Deprecated` + `@ConditionalOnProperty(name="mindgarden.branch.enabled", matchIfMissing=true)` 게이트 도입. 비-Spring 클래스 19개 `@Deprecated(forRemoval=true)` 마커. application*.yml 4종에 토글 키 도입. 32 파일 (+145/-14). |
| PR-4 | [#281](https://github.com/beta0629/MindGarden/pull/281) | `ca4cb06d1` | 2026-06-12 19:56 | FE | `frontend/src/utils/RoleUtils.js` 신규(SSOT 엔트리) + `frontend/src/constants/roles.js` 4종 기준 재정의. 위젯 가드 53개 파일 인라인 `role === 'XXX'` 비교 일괄 헬퍼로 교체. `widgetVisibilityUtils`, `NotificationContext` 등 정규화. 단위 테스트 20건 신규. |
| PR-5 | [#282](https://github.com/beta0629/MindGarden/pull/282) | `38a7866a4` | 2026-06-12 20:47 | FE | `lnbMenuUtils.filterBranchAdminLnbItems` 신규 — BE seed 변경 없이 FE 측 LNB 에서 Branch 메뉴 제거. `AdminCommonLayout`/`AdminDashboardV2` 적용. `/admin/branches` 페이지 → `BranchDeprecationNotice` (옵션 A 점진). 테스트 7건 신규. |
| PR-6 | [#283](https://github.com/beta0629/MindGarden/pull/283) | `4c36ef900` | 2026-06-12 22:10 | DB | `V20260612_001__role_ssot_legacy_normalize.sql` 신규 — `users.role` 레거시(BRANCH_*/HQ_*/SUPER_*/TENANT_ADMIN/PRINCIPAL/OWNER) → ADMIN, PLAY/SPEECH → CONSULTANT. 사후 SSOT 외 행 0 검증 SIGNAL. `mapping_permission_procedures.sql` CASE 4종 축소. 테스트 10건 PASS. |
| PR-7 | [#284](https://github.com/beta0629/MindGarden/pull/284) | `d75180bca` | 2026-06-12 23:12 | DB | `V20260612_002__branches_archive_and_fk_drop.sql` 신규 — `branches_archive_20260612` ARCHIVE, 자식 11개 FK 동적 DROP, `branches → branches_dropped_20260612` 안전 RENAME (DROP 금지). 11개 자식 테이블의 `branch_id` 컬럼은 BE 엔티티 매핑 보존을 위해 유지. `BranchesArchiveAndFkDropMigrationTest` 5건. |
| PR-8 | [#285](https://github.com/beta0629/MindGarden/pull/285) | `6b2e8e574` | 2026-06-13 00:10 | TEST | 운영 코드 변경 0건. `application-test.yml` 의 `ops.admin.role` HQ_ADMIN → ADMIN, `StoredProcedureStandardizationIntegrationTest` / `ErpProcedureJournalEntryIntegrationTest` 동일, `SuperAdminBypassTest` 컨텍스트 4종 SSOT 명확화. `mvn test`: 2249 Tests, 0 Failure/Error. |
| PR-9 | (본 PR) | — | 2026-06-13 | DOCS | `docs/standards/ROLE_STANDARD.md` 신규, `docs/standards/BRANCH_DEPRECATION.md` 신규, 본 결산 문서 신규, `docs/standards/README.md` 인덱스 갱신. 코드/Flyway/admin override 변경 0. |

> 머지 SHA 와 시각은 `git log --format='%h %cI %s' origin/develop` (2026-06-13 검증)
> 기준이다.

---

## 2. 시리즈 KPI / 운영 영향

| 항목 | 결과 |
|------|------|
| 운영 사용자 영향 | **0건** (무중단 완료) |
| `users.role` SSOT 외 잔존 행 | 0건 (사후 검증 SIGNAL 미동작 — 정상) |
| BE 컴파일/테스트 | `mvn -B test` 2249 Tests, Failures 0, Errors 0 |
| FE 테스트 (시리즈 범위) | RoleUtils 20 + 위젯 가드/LNB/billing 6 스위트 PASS |
| ESLint(--quiet) | 56개 변경 파일 + 신규 2개 = 에러 0건 |
| BE 코드 변경 (PR-1~3) | 약 +180/-90 라인 (Branch 클래스 32 파일 deprecated 포함) |
| FE 코드 변경 (PR-4~5) | 약 60개 파일(53 위젯 + 7 라우팅/메뉴) |
| DB 마이그레이션 | 신규 2건 (V20260612_001 / V20260612_002) |
| 신규 테스트 | BE 11건(Branding 6 + RoleSsotNormalize 10 + BranchesArchive 5) + FE 27건 |
| 자식 테이블 FK 제거 | 11개 (academy 10 + user_role_assignments 1) |

---

## 3. 회고

### 3.1 효과적이었던 부분

1. **9개 PR 로의 분할** — BE → FE → DB → Test → Docs 순서. 각 PR 이 독립 머지
   가능하면서도 다음 PR 의 사전 조건을 명확히 만들었다. 회귀가 발생하면 특정 PR
   범위로 즉시 격리 가능.
2. **호환 매핑 계층(`mapLegacyRole`) 선행 도입** — PR-1 시점에 BE,
   PR-4 시점에 FE 가 동일 매핑 테이블을 가지면서, DB 정규화(PR-6) 전에도 레거시
   데이터를 안전하게 받아 처리. **DB 정규화는 마지막 단계**라는 안전 순서.
3. **운영 사용자 0건 사전 인벤토리(S2)** — 2026-06-11 KST 인벤토리에서 `users.role`
   레거시 0건을 확정한 뒤에 PR-6/PR-7 을 진행. 마이그레이션이 운영 기준 no-op 임을
   사전에 검증하여 위험을 0 으로 만들었다.
4. **Branch 클래스 비활성화 게이트(`@ConditionalOnProperty`)** — `matchIfMissing=true`
   로 기본 활성화를 유지하면서 deprecated 마커를 분리. 회귀 위험을 0 으로 만들면서
   미래 비활성화 경로를 확보.
5. **DB 테이블 DROP 금지 + ARCHIVE + RENAME 패턴** — `branches_archive_20260612` 와
   `branches_dropped_20260612` 동시 보존. 자식 컬럼은 유지(엔티티 매핑 깨짐 방지).
   1-2주 모니터링 윈도우 확보.
6. **사후 검증 SIGNAL 가드** — V20260612_001 마이그레이션이 사후 SSOT 4종 외 행을
   감지하면 `SIGNAL SQLSTATE '45000'` 으로 즉시 실패. **회귀 즉시 차단**.
7. **위젯 53개 일괄 헬퍼 치환(PR-4)** — `RoleUtils.is*` 헬퍼 도입 후 일괄
   리팩터링. 잔존 인라인 비교를 grep 으로 0건 검증.
8. **테스트만 따로 분리(PR-8)** — 운영 코드 변경 0건의 테스트 갱신 PR 로 회귀 분석
   범위를 최소화. 2249 Tests PASS 로 시리즈 종결.

### 3.2 개선점 / Lessons Learned

1. **BE 엔티티 `branch_id` 컬럼 매핑 인벤토리를 사전에 더 정확히** — PR-7 진행 중
   academy 10개 + UserRoleAssignment/RefreshToken/Payment/Account 4개 엔티티의
   `@Column(name="branch_id")` 매핑 유지 필요성이 드러나 컬럼 DROP 을 별도 PR 로
   재분할해야 했다. 다음 시리즈에서는 엔티티 인벤토리를 PR-1 단계에서 함께 잡고
   진행하면 PR 분할이 자연스러워진다.
2. **HQ_MASTER 17건은 별도 시리즈로** — `SuperAdminTenantComponent`/`AIMonitoring`/
   `SecurityAudit`/`SystemMetrics`/`SchedulerMonitoring` 의 `HQ_MASTER` 가드는 Ops
   Portal 분리(별도 PR 시리즈) 로 미룬 것은 합리적이었지만, 본 시리즈 결산 시점에
   "잔존 HQ_MASTER 17건" 가시화가 늦었다 — 다음 시리즈는 잔존 항목 인벤토리를
   PR-1 합의 시 같이 공개한다.
3. **FE `USER_ROLES` 에 PLAY_THERAPIST/SPEECH_THERAPIST 가 남아 있음** — 호환 매핑
   계층 의도(서버 보내올 때 정규화) 이지만, 신규 코드가 잘못 참조할 위험. 다음
   시리즈에서는 `USER_ROLES` 에서 제거하고 `LEGACY_USER_ROLES` 로 이전.
4. **운영 모니터링 자동화 부재** — Branch 의존 호출 0건 확인을 사람이 grep/로그로
   확인. Prometheus/Discord 알람 metric (`branch_service_calls_total`) 추가하면
   1-2주 모니터링 윈도우의 신뢰도 ↑.
5. **PR 본문에 항상 다음 PR 의 사전 조건 명시** — 일부 PR (PR-5, PR-6) 에서 사전
   조건 명시가 있었지만, 일관 템플릿이 없었다. 다음 시리즈는 PR 본문 템플릿에
   `의존성: 선행/후속` 섹션을 강제.

---

## 4. 다음 표준화 후보

본 시리즈가 종결되었으므로, 인접 영역에서 동일 패턴(9-PR 분할 + 호환 매핑 + 사후
검증 SIGNAL) 으로 진행할 후보가 있다.

| 후보 | 설명 | 우선순위 |
|------|------|----------|
| **HQ_MASTER Ops Portal 분리** | `SuperAdminTenantComponent`/`AIMonitoring`/`SecurityAudit`/`SystemMetrics`/`SchedulerMonitoring` 의 HQ_MASTER 17건 가드를 Ops Portal(`ops-portal-migration`) 로 옮기고 본체에서 제거. Role SSOT 정합 100%. | P1 |
| **B8 보안 후속** | B8 (운영 시크릿 평문 노출 정리) 핫픽스 후속 — 키 로테이션·시크릿 매니저 정착. `MONITORING_ALERTING_STANDARD.md` 와 함께. | P1 |
| **자식 테이블 `branch_id` 컬럼 DROP** | BE 엔티티 매핑 제거 PR + DB DROP PR. 1-2주 모니터링 후. | P2 |
| **`branches_dropped_20260612` 실제 DROP** | 위 동시 또는 직후. ARCHIVE 는 6개월 보존. | P2 |
| **Branch 클래스 19개 삭제** | `@Deprecated(forRemoval=true)` 가 붙은 클래스 일괄 삭제 + `mindgarden.branch.enabled` 설정 키 제거. | P3 |
| **FE `USER_ROLES` 의 PLAY/SPEECH 제거** | `USER_ROLES` → `LEGACY_USER_ROLES` 로 이동. 신규 코드 오용 방지. | P3 |
| **공통코드 `PROFESSIONAL_PROVIDER_TYPE` 명문화** | 공통코드 테이블에 `COUNSELOR`/`PLAY_THERAPIST`/`SPEECH_THERAPIST` 정식 등록 + 표준 문서화. | P2 |

상세 우선순위 갱신은 `docs/project-management/AI_MONITORING_ROADMAP.md` 또는 별도
로드맵 v6 에 반영한다.

---

## 5. 시리즈 완전 종결 선언

- 본 PR(PR-9) 머지 시점부터 **Role SSOT 9-PR 시리즈는 완전 종결**된다.
- ADMIN/STAFF/CONSULTANT/CLIENT **4종 SSOT** 가 BE/FE/DB/Test/Docs 전 계층에서 단일
  소스가 된다.
- Branch 시스템은 사용 중단되었으며, 향후 작업은 `BRANCH_DEPRECATION.md` 의 §4 향후
  DROP 절차를 따른다.
- 신규 권한 모델링은 `ROLE_STANDARD.md` 의 §6 절차를 따른다 — **4종 외 enum/문자열
  추가 금지**.

---

## 6. 참조 문서

- [`docs/standards/ROLE_STANDARD.md`](../standards/ROLE_STANDARD.md)
- [`docs/standards/BRANCH_DEPRECATION.md`](../standards/BRANCH_DEPRECATION.md)
- [`docs/standards/PERMISSION_SYSTEM_STANDARD.md`](../standards/PERMISSION_SYSTEM_STANDARD.md)
- [`docs/standards/TENANT_ROLE_SYSTEM_STANDARD.md`](../standards/TENANT_ROLE_SYSTEM_STANDARD.md)
- [`docs/standards/DATABASE_MIGRATION_STANDARD.md`](../standards/DATABASE_MIGRATION_STANDARD.md)
- [`docs/project-management/CORE_PLANNER_DELEGATION_ORDER.md`](./CORE_PLANNER_DELEGATION_ORDER.md)
- [`docs/운영반영/PRE_PRODUCTION_GO_LIVE_CHECKLIST.md`](../운영반영/PRE_PRODUCTION_GO_LIVE_CHECKLIST.md)

---

## 7. 변경 이력

| 날짜 | 버전 | 변경 | 작성자 |
|------|------|------|--------|
| 2026-06-13 | 1.0.0 | 초안 — PR-9/9 본문 결산 보고 | core-coder |
