# Branch 시스템 사용 중단(Deprecation) 가이드

**버전**: 1.0.0
**작성일**: 2026-06-13
**상태**: 공식 표준 — Role SSOT 9-PR 시리즈(PR-1~7) 결과 정리
**우선순위**: ⭐⭐⭐⭐⭐ (최우선) — 신규 코드의 Branch 의존 추가 금지

---

## 0. 요약 (TL;DR)

- MindGarden(=Core Solution) 은 **Branch(지점) 개념을 운영에서 사용 중단**한다.
- BE Branch 클래스(서비스/리포지토리/엔티티/DTO/Enum) 는 모두
  `@Deprecated(forRemoval = true)` + `@ConditionalOnProperty` 게이트로 묶여 있다.
- FE `/admin/branches` 페이지는 **사용 중단 안내(BranchDeprecationNotice)** 로 대체되고,
  LNB Branch 메뉴는 `filterBranchAdminLnbItems` 로 트리에서 제거된다.
- DB `branches` 테이블은 **DROP 금지** — 안전망 ARCHIVE(`branches_archive_20260612`)
  + RENAME(`branches_dropped_20260612`) 으로 보존되며, 자식 11개 FK 만 제거되었다.
- 자식 테이블의 `branch_id` 컬럼은 **보존**한다 — BE 엔티티 매핑이 유지되기 때문.
  컬럼 DROP 은 BE 엔티티 매핑 제거 후 별도 PR.
- **운영 사용자 영향 0건** (2026-06-11 KST 인벤토리 결과 + Branch UI 사전 차단).
- **신규 코드는 Branch 클래스/Enum/엔티티/DTO 를 import 하지 말 것** — `tenant_id`
  기반 격리만 사용한다.

---

## 1. 배경 — 왜 Branch 를 사용하지 않는가

- Core Solution 의 데이터 격리 모델은 **테넌트 격리**(`tenant_id`) 가 SSOT 다.
  Branch(지점) 는 동일 테넌트 내부의 부분 격리/스코프로 의도되었으나, 멀티테넌트
  설계와 중첩되어 다음 부작용이 누적되었다.
  - Role 의 `BRANCH_*` 변형 7종(`BRANCH_ADMIN`, `BRANCH_SUPER_ADMIN`,
    `BRANCH_MANAGER` 등) 누적 — Role SSOT 침해
  - 자식 테이블 11개에 `branch_id` 컬럼 + FK — 테넌트 격리 위에 추가 결합도 발생
  - 운영 인벤토리상 `branches` 테이블 사용 0건, Branch 자체 가입자 0건
- 사용자(원장) 결정: **Role SSOT 4종(ADMIN/STAFF/CONSULTANT/CLIENT) 정착과 함께
  Branch 시스템 폐기**.

상세 결정 흐름은 [`ROLE_STANDARD.md`](./ROLE_STANDARD.md) 와
[`ROLE_SSOT_PR_SERIES_RETROSPECTIVE.md`](../project-management/ROLE_SSOT_PR_SERIES_RETROSPECTIVE.md)
참조.

---

## 2. PR-1 ~ PR-7 변경 요약 (BE/FE/DB)

| PR | 머지 PR# | 머지 SHA | 영역 | 핵심 변경 |
|----|----------|----------|------|-----------|
| PR-1 | #275 | `ba1afc191` | BE | `UserRole` enum 4종 SSOT — `PLAY_THERAPIST`/`SPEECH_THERAPIST` → `CONSULTANT.specialization` 흡수 + `mapLegacyRole` 매핑 추가 |
| PR-2 | #279 | `6c0b1d3a9` | BE | `@PreAuthorize` 4종 SSOT 9건 (`BrandingController`/`AdminMappingCleanup`/`AdminMaintenance`) + 테넌트 가드 |
| PR-3 | #280 | `5ccbe3be1` | BE | Branch 클래스 13개 `@Deprecated` + `@ConditionalOnProperty(name="mindgarden.branch.enabled")` 게이트 도입 (32 파일, +145/-14) |
| PR-4 | #281 | `ca4cb06d1` | FE | `frontend/src/utils/RoleUtils.js` 신규 + 위젯 가드 53개 파일 일괄 정리 + 단위 테스트 20건 |
| PR-5 | #282 | `38a7866a4` | FE | `lnbMenuUtils.filterBranchAdminLnbItems` 신규 + `/admin/branches` → `BranchDeprecationNotice` 교체 (옵션 A 점진) |
| PR-6 | #283 | `4c36ef900` | DB | `V20260612_001__role_ssot_legacy_normalize.sql` — `users.role` SSOT 4종 정규화 + `mapping_permission_procedures.sql` CASE 4종 축소 |
| PR-7 | #284 | `d75180bca` | DB | `V20260612_002__branches_archive_and_fk_drop.sql` — `branches` ARCHIVE + 자식 11개 FK DROP + 안전 RENAME (`branches_dropped_20260612`) |
| PR-8 | #285 | `6b2e8e574` | TEST | 테스트 전면 갱신 — `ops.admin.role` HQ_ADMIN→ADMIN, `SuperAdminBypass` 4종 SSOT 컨텍스트 (운영 코드 변경 0) |

### 2.1 BE — 게이트 및 옵셔널화 토글

- 게이트 키: `mindgarden.branch.enabled` (env: `MINDGARDEN_BRANCH_ENABLED`)
- 현재 값: 모든 환경(`application.yml`, `application-dev.yml`, `application-prod.yml`,
  `application-local.yml`) 에서 `true` (현행 유지 — 회귀 위험 최소화)
- 미래(Branch 컬럼 DROP 후): `false` 로 전환 + 의존 클래스(11개) `Optional<...>` /
  `@Autowired(required = false)` 옵셔널화.

### 2.2 FE — Branch UI 차단 인벤토리

- LNB Branch 메뉴: `filterBranchAdminLnbItems` 가 `/admin/branches`,
  `/admin/branches/:id`(prefix) 항목을 트리에서 제거. `/admin/branding` 등 유사 경로는
  보존.
- `/admin/branches` 라우트: 페이지/라우트는 유지하되 `BranchDeprecationNotice` 안내
  배너로 교체.
- `/admin/branch-*` 하위: 기존처럼 `/admin/branches` 로 redirect.
- 적용 위치: `AdminCommonLayout`, `AdminDashboardV2` (DB seed 응답 + 폴백 모두).

### 2.3 DB — 자식 테이블 FK DROP 인벤토리 (총 11개)

| 자식 테이블 | 제거된 FK 이름 |
|-------------|----------------|
| `courses` | `fk_courses_branches` |
| `classes` | `fk_classes_branches` |
| `class_schedules` | `fk_class_schedules_branches` |
| `class_enrollments` | `fk_class_enrollments_branches` |
| `attendances` | `fk_attendances_branches` |
| `academy_billing_schedules` | `fk_academy_billing_schedules_branches` |
| `academy_invoices` | `fk_academy_invoices_branches` |
| `academy_tuition_payments` | `fk_academy_tuition_payments_branches` |
| `academy_settlements` | `fk_academy_settlements_branches` |
| `academy_settlement_items` | `fk_academy_settlement_items_branches` |
| `user_role_assignments` | `fk_user_role_branch` |

> ℹ️ 모두 `INFORMATION_SCHEMA.TABLE_CONSTRAINTS` 가드로 idempotent DROP — 재실행/
> 부재 환경에서도 noop.

### 2.4 코드 변경 0 / 표준만

- PR-9(본 PR): **docs only** — `ROLE_STANDARD.md` + 본 문서 +
  `ROLE_SSOT_PR_SERIES_RETROSPECTIVE.md` + `docs/standards/README.md` 인덱스 갱신.

---

## 3. 회수(Archive) 절차

### 3.1 ARCHIVE 테이블

- `branches_archive_20260612` — V20260612_002 마이그레이션 1) 단계에서 생성.
  - DDL: `CREATE TABLE IF NOT EXISTS branches_archive_20260612 AS SELECT * FROM branches`
  - 위치: 운영 RDS / dev RDS / 로컬 H2 — Flyway 마이그레이션 결과에 따라.
- 보존 기간: **DROP 전 최소 1-2주 모니터링**. 별도 PR 로 명시적으로 DROP 한다.
- 회수 SQL 예 (필요 시):
  ```sql
  SELECT * FROM branches_archive_20260612;
  -- 또는 특정 테넌트의 branch 인벤토리
  SELECT tenant_id, COUNT(*) FROM branches_archive_20260612 GROUP BY tenant_id;
  ```

### 3.2 RENAME 테이블

- `branches_dropped_20260612` — V20260612_002 마이그레이션 3) 단계에서 RENAME.
  - DDL: `RENAME TABLE branches TO branches_dropped_20260612`
  - idempotent — `branches_dropped_20260612` 가 이미 존재하면 RENAME 생략.
- 자식 테이블의 `branch_id` 컬럼은 보존 → 데이터 조인이 필요한 회수 작업도 가능.

### 3.3 자식 테이블 `branch_id` 회수

- 모든 자식 테이블의 `branch_id` 컬럼은 보존됨 (DROP 금지).
- 통계/감사 목적 조회 예:
  ```sql
  SELECT b.id AS branch_id, b.name, COUNT(c.id) AS courses_count
    FROM branches_dropped_20260612 b
    LEFT JOIN courses c ON c.branch_id = b.id
   GROUP BY b.id, b.name;
  ```

---

## 4. 향후 DROP 절차 (1-2주 모니터링 후)

본 PR(시리즈 PR-7) 시점 기준 **1-2주 운영 모니터링** 후 별도 PR 로 진행한다.

### 4.1 사전 점검 (Gate)

- [ ] 운영/장애복구 복원본/스테이징에 `users.role` SSOT 외 값 잔존 0건 (Flyway
  V20260612_001 사후 검증 통과)
- [ ] 운영 로그에 `BranchService`/`BranchRepository` 호출 0건 (PR-3 `@ConditionalOnProperty`
  가 비활성화돼도 무관)
- [ ] 운영 API 통신에서 `branchId`/`branchCode` 요청 0건
- [ ] 운영 BI/감사 쿼리에서 `branches`/`branches_dropped_20260612` 의존 0건
- [ ] BE 엔티티의 `@Column(name="branch_id")` 매핑 제거 완료 (별도 PR — 인벤토리 14개)

### 4.2 DROP 절차 (PR 단위)

1. **BE 엔티티 매핑 제거 PR**: `academy` 10개 + `UserRoleAssignment`/`RefreshToken`/
   `Payment`/`Account` 4개에서 `branch_id` 컬럼 매핑/필드 제거.
2. **DB DROP PR**:
   ```sql
   -- 1) 자식 테이블 branch_id 컬럼 DROP
   ALTER TABLE courses DROP COLUMN branch_id;
   -- (11개 자식 테이블 동일)

   -- 2) branches_dropped_20260612 DROP
   DROP TABLE branches_dropped_20260612;

   -- 3) 안전망 ARCHIVE 도 동시 보존(별도 더 긴 기간) 또는 같이 DROP
   -- DROP TABLE branches_archive_20260612;  -- 최소 6개월 보존 권장
   ```
3. **클래스 삭제 PR**: `@Deprecated(forRemoval = true)` 가 붙은 Branch 클래스 19개
   (서비스 13 + 비-Spring 6) 일괄 삭제. `mindgarden.branch.enabled` 설정 키 제거.
4. **FE 정리 PR**: `BranchDeprecationNotice`, `filterBranchAdminLnbItems`,
   `/admin/branches` 라우트 자체 제거. 레거시 redirect 정리.

### 4.3 게이트 (운영 반영 전)

- [ ] `docs/운영반영/PRE_PRODUCTION_GO_LIVE_CHECKLIST.md` 통과
- [ ] BE/FE/DB 통합 테스트 PASS — 회귀 0건
- [ ] 1-2주 모니터링 보고 첨부 (Branch 의존 호출 0건 증빙)

---

## 5. Rollback 가이드

운영 모니터링 1-2주 중 문제가 발견되면 다음 절차로 회수한다.

### 5.1 DB Rollback (V20260612_002 역방향)

```sql
-- 1) branches 테이블 복원 (RENAME 역방향)
RENAME TABLE branches_dropped_20260612 TO branches;

-- 2) 필요 시 자식 11개 FK 복원 — V20260612_002 의 DDL 역방향
ALTER TABLE courses
    ADD CONSTRAINT fk_courses_branches
    FOREIGN KEY (branch_id) REFERENCES branches(id);
-- (11개 동일 패턴)
```

> ℹ️ `branches_archive_20260612` 는 별도 보존 안전망 — RENAME 복원만으로 데이터는
> 복귀. ARCHIVE 는 비교/감사 용도로 유지.

### 5.2 DB Rollback (V20260612_001 — `users.role`)

레거시 role 정규화는 데이터 손실 없는 UPDATE 다. 운영 인벤토리상 0건이었기 때문에
운영 환경에서 사실상 no-op. 만약 dev/스테이징/장애복구 복원본에서 레거시 role 이
변경되어 회복이 필요하면, 마이그 직전의 백업/덤프에서 복원하는 것이 권장 절차.
(별도 `_undo_` 파일은 정책상 작성하지 않는다 — 데이터 정규화 마이그는 일방향.)

### 5.3 BE Rollback (PR-3 게이트)

- `application.yml` (해당 환경) 의 `mindgarden.branch.enabled` 를 `true` 로 (기본값
  유지 상태) 두거나, env `MINDGARDEN_BRANCH_ENABLED=true` 로 명시.
- `@Deprecated` 가 붙어 있어도 Spring 빈은 그대로 등록되므로 회귀 위험 없음.

### 5.4 FE Rollback (PR-5 게이트)

- `lnbMenuUtils.filterBranchAdminLnbItems` 적용 위치를 일시 비활성화 (PR revert).
- `/admin/branches` 라우트의 `BranchDeprecationNotice` 를 원래 페이지로 되돌림.

### 5.5 Flyway Rollback 원칙

- 본 표준에서는 **Flyway undo** 사용을 권장하지 않는다 (Community 무지원).
- 대신 본 §5.1 / §5.2 패턴처럼 **별도 보정 마이그레이션** 또는 **백업 복원** 으로
  처리한다.

---

## 6. 신규 코드 작성 시 금지 사항 (재확인)

- ❌ `Branch`, `BranchService`, `BranchRepository`, `BranchCode`, `BranchResponse`
  등 Branch 클래스 import / 신규 호출
- ❌ `branchId`, `branchCode` 변수 사용 (DB 컬럼 보존과는 별도로 비즈니스 로직에서
  사용 금지)
- ❌ FE 에서 `/admin/branches` 또는 `/admin/branch-*` 신규 라우트 추가
- ❌ DB 마이그레이션에서 `branches_dropped_20260612` 또는
  `branches_archive_20260612` 에 의존하는 신규 비즈니스 로직(감사/정리 용도는 OK)
- ❌ 새 자식 테이블에 `branch_id` 컬럼 / FK 추가

> Branch 가 필요해 보이는 요구사항이 들어오면 **`tenant_id` 기반 격리**
> 또는 **공통 권한 시스템(`role_permissions`)** 으로 모델링한다.

---

## 7. 관련 문서 / 코드 인용

### 7.1 마이그레이션

- `src/main/resources/db/migration/V20260612_001__role_ssot_legacy_normalize.sql` — `users.role` SSOT 정규화
- `src/main/resources/db/migration/V20260612_002__branches_archive_and_fk_drop.sql` — branches ARCHIVE + FK DROP + RENAME

### 7.2 표준·기획

- [`ROLE_STANDARD.md`](./ROLE_STANDARD.md) — 4종 SSOT 표준
- [`PERMISSION_SYSTEM_STANDARD.md`](./PERMISSION_SYSTEM_STANDARD.md) — 동적 권한
- [`DATABASE_MIGRATION_STANDARD.md`](./DATABASE_MIGRATION_STANDARD.md) — Flyway 패턴
- [`MIGRATION_GUIDE.md`](./MIGRATION_GUIDE.md) — 브랜치 → 테넌트 1차 마이그레이션
- [`ROLE_SSOT_PR_SERIES_RETROSPECTIVE.md`](../project-management/ROLE_SSOT_PR_SERIES_RETROSPECTIVE.md) — 9-PR 결산
- [`CORE_PLANNER_DELEGATION_ORDER.md`](../project-management/CORE_PLANNER_DELEGATION_ORDER.md) — 위임 순서
- [`PRE_PRODUCTION_GO_LIVE_CHECKLIST.md`](../운영반영/PRE_PRODUCTION_GO_LIVE_CHECKLIST.md) — 운영 게이트

---

## 8. 변경 이력

| 날짜 | 버전 | 변경 | 작성자 |
|------|------|------|--------|
| 2026-06-13 | 1.0.0 | 초안 — Role SSOT 9-PR 시리즈 PR-1~7 결과 정리 | core-coder |
