# user_social_accounts 중복 등록 전수 인벤토리 — 2026-06-09

## 1. 헤더

| 항목 | 값 |
|------|----|
| 작업일자 | 2026-06-09 (KST) |
| 데이터 스냅샷 | 2026-06-09 18:05:21 KST (MySQL `NOW()`) |
| 조사자 | 메인 어시스턴트 (read-only 운영 DB 조회) |
| 대상 환경 | 운영 (`beta74.cafe24.com` / DB `core_solution` / `mindgarden`@localhost) |
| MySQL 버전 | 8.0.43-0ubuntu0.22.04.1 |
| 대상 테이블 | `user_social_accounts` (별칭 USA) |
| 조회 범위 | SELECT 만 실행 (DML/DDL 없음) — 본 보고서의 모든 SQL 초안은 **주석 처리** 상태로 실행 금지 |
| 참고 사례 배경 | 카카오 `provider_user_id=4443586436` 가 `user_id=3`(CONSULTANT) 과 `user_id=25`(CLIENT) 에 등록된 사례 — **현재** active row 는 `user_id=3` (id=12) 단 1개, `user_id=25` 의 10개 row 는 모두 `is_deleted=1` |

> **PII 보호**: 보고서 내 email 은 첫 글자 + `***@***`, 전화번호는 `010-****-XXXX` 형태로 마스킹.

---

## 2. 요약 (한눈에 보기)

| 지표 | 값 |
|------|----|
| 전체 row 수 | **16** |
| Active row 수 (`is_deleted=0`) | **5** |
| Deleted row 수 (`is_deleted=1`) | **11** |
| Distinct `(provider, provider_user_id)` 키 수 | **6** |
| Distinct `user_id` 수 | **5** (3, 13, 20, 25, 41) |
| Distinct `tenant_id` 수 | **1** (`tenant-incheon-counseling-001`) |
| **중복 그룹 수 (전체)** | **1** (`(KAKAO, 4443586436)`) |
| **P0 — Active 중복 (`active_count >= 2`)** | **0건** |
| **P1 — Deleted+Active 혼재 (`active=1`, `deleted>=1`)** | **1건** (`(KAKAO, 4443586436)`) |
| **P2 — All Deleted (`active=0`)** | **0건** |
| 같은 `(provider, provider_user_id)` 가 **서로 다른 tenant** 에 존재 | **0건** (멀티테넌트 정상 케이스 없음) |
| 같은 `tenant_id` 내 active-only 중복 | **0건** |

> **한 줄 결론**: 운영 DB의 `user_social_accounts` 중복 인벤토리 결과 — **P0=0건, P1=1건, P2=0건**. 즉시 정리할 active-active 충돌은 없고, 단일 P1 그룹(`KAKAO 4443586436`)의 10개 soft-deleted row 에서 **데이터 무결성 결손**(`disconnected_at=NULL`, `disconnect_reason=NULL`, `is_active=1`)이 발견됨 — 권장 보강 UPDATE 초안만 §5에 제공.

---

## 3. 전수 인벤토리 (중복 그룹)

### 3.1 기본 집계 — `GROUP BY provider, provider_user_id HAVING dup_count > 1`

| # | provider | provider_user_id | dup_count | active_count | deleted_count | tenant 다중 여부 | 우선순위 |
|---|----------|------------------|-----------|--------------|---------------|------------------|----------|
| 1 | `KAKAO` | `4443586436` | **11** | 1 | 10 | 단일 (`tenant-incheon-counseling-001`) | **P1** |

> 위 1개 그룹이 운영 DB 전체의 중복 사례 총량.

### 3.2 raw SELECT 결과 (재현 가능 SQL & 출력)

```sql
SELECT provider,
       provider_user_id,
       COUNT(*) AS dup_count,
       SUM(CASE WHEN is_deleted = 0 THEN 1 ELSE 0 END) AS active_count,
       SUM(CASE WHEN is_deleted = 1 THEN 1 ELSE 0 END) AS deleted_count,
       GROUP_CONCAT(id ORDER BY created_at SEPARATOR ',') AS row_ids,
       GROUP_CONCAT(user_id ORDER BY created_at SEPARATOR ',') AS user_ids,
       GROUP_CONCAT(is_deleted ORDER BY created_at SEPARATOR ',') AS deleted_flags,
       GROUP_CONCAT(IFNULL(tenant_id,'(null)') ORDER BY created_at SEPARATOR ',') AS tenant_ids,
       MIN(created_at) AS first_created_at,
       MAX(updated_at) AS last_updated_at
  FROM user_social_accounts
 GROUP BY provider, provider_user_id
HAVING dup_count > 1
 ORDER BY active_count DESC, dup_count DESC;
```

출력 (1행):

```
provider          | KAKAO
provider_user_id  | 4443586436
dup_count         | 11
active_count      | 1
deleted_count     | 10
row_ids           | 2,3,4,5,6,7,8,9,10,11,12
user_ids          | 25,25,25,25,25,25,25,25,25,25,3
deleted_flags     | 1,1,1,1,1,1,1,1,1,1,0
tenant_ids        | tenant-incheon-counseling-001 (전부 동일)
first_created_at  | 2026-04-22 19:29:49.509415
last_updated_at   | 2026-06-09 15:36:33.630632
```

### 3.3 보조 집계

- **같은 tenant 내 active-only 중복** (`is_deleted=0` 만 그룹핑): **0건**
- **서로 다른 tenant 간 동일 `(provider, provider_user_id)` 등장**: **0건**

---

## 4. 카카오 `provider_user_id=4443586436` 상세 분석

### 4.1 배경

- 같은 사람(전화번호 `010-****-8570` 일치)이 동일 테넌트(`tenant-incheon-counseling-001`)에서 **CONSULTANT** 와 **CLIENT** 두 역할로 분리된 계정을 보유:
  - `user_id=3` (role=CONSULTANT, email `a***@***`, `users.is_deleted=0`)
  - `user_id=25` (role=CLIENT, email `t***@***`, `users.is_deleted=0`)
- 위임 미션 문구의 "현재 user_id=25 는 is_deleted=1" 은 **소셜 계정 row 기준**으로는 정확 (user_id=25 의 10개 USA row 가 전부 `is_deleted=1`). 단, **`users` 테이블 기준 user_id=25 본인 계정은 `is_deleted=0` (살아 있음)** — 보고서 §7 무결성 발견 사항 참조.

### 4.2 현재 상태 (`SELECT` 캡처)

```sql
SELECT id, tenant_id, user_id, provider, provider_user_id,
       CAST(is_deleted AS UNSIGNED) AS is_deleted,
       CAST(IFNULL(is_active,0) AS UNSIGNED) AS is_active,
       CAST(IFNULL(is_primary,0) AS UNSIGNED) AS is_primary,
       created_at, updated_at, disconnected_at,
       SUBSTRING(IFNULL(disconnect_reason,''), 1, 60) AS disconnect_reason_60
  FROM user_social_accounts
 WHERE provider = 'KAKAO' AND provider_user_id = '4443586436'
 ORDER BY created_at;
```

| id | tenant_id | user_id | is_deleted | is_active | is_primary | created_at | updated_at | disconnected_at | disconnect_reason |
|----|-----------|---------|------------|-----------|------------|------------|------------|-----------------|-------------------|
| 2 | tenant-incheon-counseling-001 | 25 | 1 | **1** | 0 | 2026-04-22 19:29:49 | 2026-04-23 00:05:52 | **NULL** | **NULL** |
| 3 | tenant-incheon-counseling-001 | 25 | 1 | **1** | 0 | 2026-04-23 00:05:58 | 2026-04-23 00:06:15 | **NULL** | **NULL** |
| 4 | tenant-incheon-counseling-001 | 25 | 1 | **1** | 0 | 2026-04-23 00:28:35 | 2026-04-23 00:28:49 | **NULL** | **NULL** |
| 5 | tenant-incheon-counseling-001 | 25 | 1 | **1** | 0 | 2026-04-23 00:28:59 | 2026-04-23 00:29:51 | **NULL** | **NULL** |
| 6 | tenant-incheon-counseling-001 | 25 | 1 | **1** | 0 | 2026-04-23 00:54:34 | 2026-04-23 01:09:55 | **NULL** | **NULL** |
| 7 | tenant-incheon-counseling-001 | 25 | 1 | **1** | 0 | 2026-04-23 01:09:58 | 2026-04-23 01:23:48 | **NULL** | **NULL** |
| 8 | tenant-incheon-counseling-001 | 25 | 1 | **1** | 0 | 2026-04-23 01:23:51 | 2026-04-23 01:24:14 | **NULL** | **NULL** |
| 9 | tenant-incheon-counseling-001 | 25 | 1 | **1** | 0 | 2026-04-23 01:24:20 | 2026-04-23 01:24:32 | **NULL** | **NULL** |
| 10 | tenant-incheon-counseling-001 | 25 | 1 | **1** | 0 | 2026-04-23 01:24:34 | 2026-04-23 01:42:57 | **NULL** | **NULL** |
| 11 | tenant-incheon-counseling-001 | 25 | 1 | **1** | 0 | 2026-04-23 01:43:03 | 2026-04-23 01:48:50 | **NULL** | **NULL** |
| **12** | tenant-incheon-counseling-001 | **3** | **0** | 1 | 0 | 2026-04-23 01:49:16 | **2026-06-09 15:36:33** | NULL | NULL |

### 4.3 해석

- 2026-04-22 ~ 2026-04-23 약 6시간 사이에 user_id=25 가 카카오 연동을 **10회 시도→해제** 반복한 흔적 (각 row 의 `updated_at - created_at` 시점 차이가 수 초~수십 분).
- 2026-04-23 01:49:16 에 **user_id=3 의 USA row(id=12)** 가 생성되어 현재까지 단일 active 로 유지 (마지막 갱신 2026-06-09 15:36 — 최근 로그인/토큰 갱신으로 보임).
- **현재 active 충돌(P0)은 없음.** Kakao OAuth 로그인 시 `provider_user_id=4443586436` 으로 단일 active 매칭 → `user_id=3` 으로 라우팅됨 (의도된 결과로 보임).
- 단, 과거 10개 deleted row 는 **soft-delete 처리 일관성 결손** (`disconnected_at=NULL`, `disconnect_reason=NULL`, `is_active=1`) — §7 참조.

### 4.4 권장 조치 (요약)

| 조치 | 적용 대상 | 영향 |
|------|-----------|------|
| Active row(id=12) **보존** | user_id=3 활성 연동 유지 | 사용자 영향 없음 |
| Deleted row 10개의 무결성 보강 UPDATE (`disconnected_at`, `disconnect_reason`, `is_active=0`) | id ∈ {2..11} | 사용자 영향 없음 (이미 `is_deleted=1`) |
| **물리 삭제는 비권장** | 감사·재발 추적 보존 | — |

---

## 5. P0/P1 케이스별 정리 SQL 초안 (실행 금지 · 모두 주석)

> **모든 SQL 은 주석 처리** 상태로 보고서에 포함합니다. 사용자 승인 후 **별도 단계에서 운영 DBA가 수동 실행**합니다. 운영 DB 직접 실행 시:
> 1) 백업/스냅샷 확보, 2) `BEGIN;` 후 `SELECT` 로 영향 row 재확인, 3) UPDATE 실행, 4) 다시 `SELECT` 검증, 5) `COMMIT;` 또는 이상 시 `ROLLBACK;`.

### 5.1 P0 — Active 중복

**해당 없음 (0건).**

### 5.2 P1 — Deleted+Active 혼재 무결성 보강

#### [P1 #1] `(KAKAO, 4443586436)` — tenant `tenant-incheon-counseling-001`

- 유지: `id=12` (user_id=3, is_deleted=0, 가장 최근 active, last_updated=2026-06-09 15:36:33) → **변경 없음**
- 무결성 보강: `id ∈ {2,3,4,5,6,7,8,9,10,11}` (user_id=25, is_deleted=1) → `is_active=0`, `disconnected_at`/`disconnect_reason` 누락 채움

```sql
-- ============================================================================
-- [P1 #1] (KAKAO, 4443586436) — disconnected_at / disconnect_reason / is_active 무결성 보강
-- 대상 row: id IN (2,3,4,5,6,7,8,9,10,11) — user_id=25, is_deleted=1, tenant_id='tenant-incheon-counseling-001'
-- 유지 row: id=12 (user_id=3, is_deleted=0) — 변경 없음
-- 영향 범위: 운영 사용자(로그인/라우팅) 영향 없음 (이미 soft-deleted).
-- 실행 전 SELECT 로 재확인 권장.
-- ----------------------------------------------------------------------------
-- BEGIN;
--
-- -- (a) 사전 확인: 변경 대상 10건 + 유지 대상 1건이 정확히 매칭되는지 검증
-- SELECT id, user_id, is_deleted, is_active, disconnected_at, disconnect_reason
--   FROM user_social_accounts
--  WHERE provider = 'KAKAO'
--    AND provider_user_id = '4443586436'
--    AND tenant_id = 'tenant-incheon-counseling-001'
--  ORDER BY id;
--
-- -- (b) 무결성 보강 UPDATE — 소프트삭제 row 10건만 대상
-- UPDATE user_social_accounts
--    SET is_active        = 0,
--        disconnected_at  = COALESCE(disconnected_at, updated_at),
--        disconnect_reason = COALESCE(
--            NULLIF(disconnect_reason,''),
--            'Duplicate cleanup 2026-06-09 (provider_user_id collision; backfilled from inventory report)'
--        )
--  WHERE provider = 'KAKAO'
--    AND provider_user_id = '4443586436'
--    AND tenant_id = 'tenant-incheon-counseling-001'
--    AND is_deleted = 1
--    AND id IN (2,3,4,5,6,7,8,9,10,11);
--
-- -- (c) 사후 확인: 10건 모두 disconnected_at NOT NULL, disconnect_reason NOT NULL, is_active=0 인지 확인
-- SELECT id, is_active, disconnected_at, LEFT(disconnect_reason, 80) AS reason
--   FROM user_social_accounts
--  WHERE provider = 'KAKAO'
--    AND provider_user_id = '4443586436'
--    AND tenant_id = 'tenant-incheon-counseling-001'
--    AND is_deleted = 1
--  ORDER BY id;
--
-- COMMIT;  -- 또는 이상 시 ROLLBACK;
-- ============================================================================
```

> ⚠️ 위 UPDATE 는 **soft-deleted row 만 대상**으로 하고 `id=12` (유지) 는 건드리지 않습니다. **물리 삭제(DELETE)는 포함하지 않습니다** — 감사/재발 추적을 위해 보존.

### 5.3 P2 — All Deleted

**해당 없음 (0건).**

---

## 6. 멀티테넌트 정상 케이스 (서로 다른 tenant_id, 같은 `(provider, provider_user_id)`)

**해당 없음 (0건).**

운영 DB에 등록된 tenant 는 현재 `tenant-incheon-counseling-001` 단일이므로 cross-tenant 정상 케이스는 자연히 발생할 수 없습니다. 향후 다른 tenant 가 추가되면 본 보고서의 보조 쿼리(§3.3)를 재실행하여 정상/비정상 여부를 재확인하세요.

```sql
-- 재실행용 보조 쿼리
SELECT provider, provider_user_id, COUNT(DISTINCT tenant_id) AS distinct_tenants,
       GROUP_CONCAT(DISTINCT IFNULL(tenant_id,'(null)')) AS tenants
  FROM user_social_accounts
 GROUP BY provider, provider_user_id
HAVING distinct_tenants > 1;
```

---

## 7. 데이터 무결성 추가 발견 사항

### 7.1 Soft-delete 일관성 결손 (10건)

`user_social_accounts.id ∈ {2..11}` (전부 user_id=25, KAKAO/4443586436, `is_deleted=1`) 의 무결성 결손:

| 컬럼 | 기대 값 (soft-deleted 시) | 실제 값 | 영향 |
|------|----------------------------|----------|------|
| `is_active` | `0` (비활성) | **`1`** (활성) | 활성/비활성 통계 왜곡 가능 (단, 쿼리들이 `is_deleted` 만 보고 있으면 영향 적음) |
| `disconnected_at` | NOT NULL (해제 시각) | **`NULL`** | 감사 추적 불가 — 언제 연동 해제됐는지 알 수 없음 |
| `disconnect_reason` | 사유 문자열 | **`NULL`** | 해제 사유 부재 — 운영/지원 시 원인 추적 어려움 |

→ §5.2 의 보강 UPDATE 초안에서 일괄 정정.

### 7.2 user 본인 계정 상태와 social account 의 불일치

- `users.id=25` 본인 레코드는 `is_deleted=0` (살아 있음, role=CLIENT) 인데, 해당 사용자의 모든 USA row 가 `is_deleted=1`.
  - 해석: user 본인은 활성이나 카카오 연동을 모두 해제한 상태. **정상적인 상태**이며 정정 불필요.
- `users.id=3` 본인 레코드도 `is_deleted=0` (살아 있음, role=CONSULTANT), USA row id=12 (active) 유지. **정상**.

### 7.3 `is_primary` 다중 / 부재 검사

전체 active row 5건 모두 `is_primary=0` — 단일 user 가 같은 provider 로 여러 active 연동을 보유한 경우가 없으므로 현재 데이터에서는 문제 없음. (다만 BE 정책상 첫 연동을 `is_primary=1` 로 자동 설정할지 여부는 별도 결정.)

### 7.4 동일 전화번호로 분리된 user 계정

`users.id=3` (CONSULTANT) 과 `users.id=25` (CLIENT) 가 같은 전화번호 `010-****-8570` 을 공유 — 정상 운영 정책(같은 사람이 상담사 + 내담자 역할 동시 보유) 인지, 정리 대상인지 별도 검토 필요. **본 위임 범위 밖**이므로 보고만 함.

---

## 8. BE 재발 방지 권장 (코어 코더 후속 위임용)

### 8.1 엔티티 점검 결과

`src/main/java/com/coresolution/consultation/entity/UserSocialAccount.java` 의 `@Table(... indexes=...)` 정의:

```java
@Table(name = "user_social_accounts", indexes = {
    @Index(name = "idx_user_social_accounts_user_id", columnList = "user_id"),
    @Index(name = "idx_user_social_accounts_provider", columnList = "provider"),
    @Index(name = "idx_user_social_accounts_provider_user_id", columnList = "provider_user_id"),
    @Index(name = "idx_user_social_accounts_is_deleted", columnList = "is_deleted")
})
```

- **(`provider`, `provider_user_id`) 또는 (`tenant_id`, `provider`, `provider_user_id`) 에 대한 UNIQUE 제약 없음.** 인덱스만 존재.
- 운영 DB `SHOW INDEX FROM user_social_accounts` 로 검증: **5개 인덱스 중 PRIMARY 만 unique**, 나머지 4개는 `Non_unique=1`.

### 8.2 Option A — DB-level UNIQUE (1차 권장)

**전제**: §5 정리 UPDATE 가 먼저 적용되어 운영 DB가 일관 상태가 된 뒤에만 추가 가능.

```sql
-- (참고용 Flyway 마이그레이션 초안 — 실행 금지)
-- soft-delete 와 호환되려면 is_deleted 를 키에 포함해야 함.
-- 단, MySQL UNIQUE 는 NULL 을 unique 로 취급하지 않으므로 is_deleted (NOT NULL bit) 포함이 안전.
--
-- ALTER TABLE user_social_accounts
--   ADD CONSTRAINT uq_usa_tenant_provider_pid_softdel
--   UNIQUE (tenant_id, provider, provider_user_id, is_deleted);
```

| 장점 | 단점 |
|------|------|
| DB 차원 race condition 차단 | `is_deleted=1` row 여러 개 허용 ↔ 충돌 없음 (위 정의는 같은 키 + 같은 is_deleted 조합 중복만 금지) — 의도와 차이 있을 수 있음 |
| Flyway 마이그레이션 1회로 끝 | 운영 데이터가 미정리 상태이면 추가 실패 (Duplicate key error) |

**대안**: `is_deleted=0` 만 unique 보장하려면 MySQL 8.0 의 **함수형 인덱스** 또는 **생성 컬럼(generated column)** 활용:

```sql
-- ALTER TABLE user_social_accounts
--   ADD COLUMN active_key VARCHAR(64) GENERATED ALWAYS AS
--       (IF(is_deleted = 0, CONCAT(tenant_id,':',provider,':',provider_user_id), NULL)) STORED,
--   ADD UNIQUE KEY uq_usa_active_tenant_provider_pid (active_key);
-- -- active row 만 unique, soft-deleted row 는 NULL → 충돌 없음.
```

### 8.3 Option B — App-level reactivate-or-insert + DB UNIQUE 병행 (권장)

`AbstractOAuth2Service` / `*OAuth2ServiceImpl` 의 USA 저장 경로(`createUserFromSocial`, 토큰 갱신 등) 에서:

1. `repository.findByTenantIdAndProviderAndProviderUserId(...)` 로 **soft-deleted 포함 조회**
2. 결과가 있으면:
   - active(`is_deleted=0`) 이고 동일 user → 토큰만 갱신
   - active 이고 다른 user → **예외 throw** (이미 다른 user 가 점유 중)
   - deleted(`is_deleted=1`) → `reactivate()` + user_id 재할당
3. 없으면 INSERT

> **동시성 보강**: 위 로직만으로는 동시 요청 race condition 을 막을 수 없으므로 Option A 의 DB UNIQUE 와 **반드시 병행**. 동시 INSERT 시 `DuplicateKeyException` 을 catch → 재조회 후 reactivate 분기로 fallback.

### 8.4 진행 순서 (의존성)

```
① 본 보고서(§5) 사용자 승인
   ↓
② 운영 DBA 가 §5.2 UPDATE 수동 실행 (백업 후)
   ↓
③ §3 의 중복 인벤토리 쿼리 재실행 → 0건 확인
   ↓
④ core-coder 위임: Option A (Flyway V20260610_xxx) + Option B (Service 가드) PR
   ↓
⑤ 개발 → 운영 배포 (core-deployer)
```

---

## 9. 사용자 액션 항목 (승인 필요)

| # | 항목 | 승인 단위 | 영향 | 실행 주체 | 예상 소요 |
|---|------|-----------|------|-----------|-----------|
| 1 | §5.2 P1 #1 — `(KAKAO, 4443586436)` 무결성 보강 UPDATE | **1개 SQL 블록 (UPDATE 1건, 영향 row 10건)** | 운영 사용자 무영향 (soft-deleted row 만 보강) | 운영 DBA / 사용자 수동 | < 1초 |

> **실행 가이드 한 줄**: 백업 → `BEGIN;` → §5.2 (a) SELECT 재확인 → (b) UPDATE → (c) SELECT 검증 → `COMMIT;`. (이상 시 `ROLLBACK;`)

---

## 10. 부록 — 재현용 SELECT 쿼리 모음 (READ-ONLY)

```sql
-- 1) 전체 중복 그룹
SELECT provider, provider_user_id,
       COUNT(*) AS dup_count,
       SUM(CASE WHEN is_deleted=0 THEN 1 ELSE 0 END) AS active_count,
       SUM(CASE WHEN is_deleted=1 THEN 1 ELSE 0 END) AS deleted_count,
       GROUP_CONCAT(id ORDER BY created_at) AS row_ids,
       GROUP_CONCAT(user_id ORDER BY created_at) AS user_ids,
       GROUP_CONCAT(is_deleted ORDER BY created_at) AS deleted_flags,
       GROUP_CONCAT(IFNULL(tenant_id,'(null)') ORDER BY created_at) AS tenant_ids,
       MIN(created_at) AS first_created_at,
       MAX(updated_at) AS last_updated_at
  FROM user_social_accounts
 GROUP BY provider, provider_user_id
HAVING dup_count > 1
 ORDER BY active_count DESC, dup_count DESC;

-- 2) tenant 내 active-only 중복
SELECT tenant_id, provider, provider_user_id, COUNT(*) AS dup_count
  FROM user_social_accounts
 WHERE is_deleted = 0
 GROUP BY tenant_id, provider, provider_user_id
HAVING dup_count > 1;

-- 3) 카카오 4443586436 상세
SELECT id, tenant_id, user_id, provider, provider_user_id,
       CAST(is_deleted AS UNSIGNED) AS is_deleted,
       CAST(IFNULL(is_active,0) AS UNSIGNED) AS is_active,
       CAST(IFNULL(is_primary,0) AS UNSIGNED) AS is_primary,
       created_at, updated_at, disconnected_at,
       SUBSTRING(IFNULL(disconnect_reason,''), 1, 60) AS disconnect_reason_60
  FROM user_social_accounts
 WHERE provider = 'KAKAO' AND provider_user_id = '4443586436'
 ORDER BY created_at;

-- 4) 인덱스/제약 검사 (UNIQUE 없음 확인)
SHOW INDEX FROM user_social_accounts;
```

---

**보고서 끝.**
