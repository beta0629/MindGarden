# 운영 DB 정리 — `user_social_accounts` P1 #1 무결성 보강

> 본 문서는 `docs/project-management/20260609/SOCIAL_ACCOUNT_DUPLICATE_INVENTORY_20260609.md` §5.2 (P1 #1) 의 SQL 절차 운영 실행 결과 로그입니다.

## 1. 작업 개요

| 항목 | 내용 |
|------|------|
| 작업 일시 (KST) | 2026-06-10 (수) 00:17 ~ 00:18 |
| 작업자 | core-planner (운영 SSH, 사용자 승인 위임 실행) |
| 작업 대상 호스트 | `root@beta74.cafe24.com` (운영) |
| 작업 대상 DB | `core_solution` (mindgarden-core-green 활성 슬롯) |
| 작업 대상 테이블 | `user_social_accounts` |
| 작업 대상 row | `provider='KAKAO' AND provider_user_id='4443586436' AND tenant_id='tenant-incheon-counseling-001'` 의 `is_deleted=1` 10건 (id ∈ {2,3,4,5,6,7,8,9,10,11}) |
| 유지 row | `id=12` (user_id=3, is_deleted=0) — 변경 없음 |
| 작업 사유 | OAuth 휴대폰 매칭 SSOT 일원화 (PR #183) 운영 반영 완료 후속 정합성 보강. soft-deleted row 10건의 `disconnected_at`/`disconnect_reason`/`is_active` 결손 정정 |
| 영향 범위 | 운영 사용자 0 영향 — 이미 soft-deleted row 만 대상, 로그인/라우팅 영향 없음 |
| 사전 승인 | 사용자 명시 ("OAuth 운영 반영 완료 후 실행 조건. soft-delete 10 row UPDATE 만, 사용자 무영향.") |

## 2. 사전 배포 의존성 검증 (PASS)

| # | 항목 | 결과 |
|---|------|------|
| 1 | PR #183 (OAuth 휴대폰 매칭 SSOT) develop 머지 | ✅ commit `515d0e512` (14:52:07Z) |
| 2 | release PR #184 main 머지 | ✅ commit `b6d6dfc93` (15:01:35Z) |
| 3 | BE prod 배포 (run 27215339175) | ✅ SUCCESS (15:01:39 → 15:10:26Z, 8m47s) |
| 4 | FE prod 배포 | ✅ SUCCESS, last-modified 15:05:13Z |
| 5 | Flyway `V20260609_003__phone_otp_attempts_oauth_provider_index` | ✅ installed_rank=267, success=1, installed_on=2026-06-10 00:04:35 KST |
| 6 | BE prod health | ✅ `{"status":"UP"}` |
| 7 | FE prod homepage | ✅ HTTP 200 |
| 8 | OPS backend health | ✅ `{"status":"UP"}` |

## 3. 사전 백업

```
Backup file : /var/www/mindgarden/backups/user_social_accounts_KAKAO_4443586436_20260609T151740Z.sql
Backup size : 27 lines (mysqldump --no-create-info, 대상 11 row 의 INSERT 명령 + 부속 메타)
Backup 명령 : sudo mysqldump -h localhost -u mindgarden -p*** \
                --skip-comments --no-create-info \
                --where="provider='KAKAO' AND provider_user_id='4443586436' AND tenant_id='tenant-incheon-counseling-001'" \
                core_solution user_social_accounts
```

> `mysqldump: Error: 'Access denied; you need (at least one of) the PROCESS privilege(s) for this operation' when trying to dump tablespaces` 경고가 보이지만, 이는 tablespace 메타 덤프 권한 결손이며 **실제 row 데이터는 정상 덤프**됨. mindgarden 계정 권한 정책에 부합.

## 4. 트랜잭션 실행 결과

### 4.1 (a) BEFORE UPDATE — 11 row 정합 확인

```
id   user_id  is_deleted  is_active  disconnected_at  disconnect_reason
2    25       1           (blank=0)  NULL             NULL
3    25       1           (blank=0)  NULL             NULL
4    25       1           (blank=0)  NULL             NULL
5    25       1           (blank=0)  NULL             NULL
6    25       1           (blank=0)  NULL             NULL
7    25       1           (blank=0)  NULL             NULL
8    25       1           (blank=0)  NULL             NULL
9    25       1           (blank=0)  NULL             NULL
10   25       1           (blank=0)  NULL             NULL
11   25       1           (blank=0)  NULL             NULL
12   3        0 (\0)       (blank=0)  NULL             NULL  <- control
```

> 인벤토리 §5.2 의 기대 11 row (10 soft-deleted + 1 active control) 정확히 매칭.

### 4.2 (b) UPDATE 결과

```
ROW_COUNT() = 10
```

> 의도한 10 row 정확히 갱신 (id=12 미포함, WHERE `is_deleted=1 AND id IN (2,...,11)` 으로 격리됨).

### 4.3 (c) AFTER UPDATE — 10 soft-deleted row 정합

| id | is_active | disconnected_at | disconnect_reason (요약) |
|---|---|---|---|
| 2 | 0 | 2026-04-23 00:05:52.932246 | Duplicate cleanup 2026-06-09 (provider_user_id collision; backfilled from inventory ... |
| 3 | 0 | 2026-04-23 00:06:15.568398 | (동일) |
| 4 | 0 | 2026-04-23 00:28:49.108082 | (동일) |
| 5 | 0 | 2026-04-23 00:29:51.973617 | (동일) |
| 6 | 0 | 2026-04-23 01:09:55.407344 | (동일) |
| 7 | 0 | 2026-04-23 01:23:48.696519 | (동일) |
| 8 | 0 | 2026-04-23 01:24:14.999497 | (동일) |
| 9 | 0 | 2026-04-23 01:24:32.454275 | (동일) |
| 10 | 0 | 2026-04-23 01:42:57.854192 | (동일) |
| 11 | 0 | 2026-04-23 01:48:50.184490 | (동일) |

> `disconnected_at` 은 각 row 의 기존 `updated_at` (2026-04-23 시간대) 으로 백필 — 실제 비활성화 시점 추정값으로 합리적.

### 4.4 (d) id=12 UNCHANGED (control)

```
id  user_id  is_deleted  is_active  disconnected_at  disconnect_reason
12  3        0           (blank=0)  NULL             NULL
```

> 의도대로 변경 없음. active row 보존.

### 4.5 COMMIT

```
===== COMMITTED =====
```

## 5. 사후 검증

```
id  is_active  has_disconnected_at  has_reason
2   0          1                    1
3   0          1                    1
4   0          1                    1
5   0          1                    1
6   0          1                    1
7   0          1                    1
8   0          1                    1
9   0          1                    1
10  0          1                    1
11  0          1                    1
12  (blank)    0                    0   <- control unchanged
```

→ 모든 soft-deleted 10 row 에서 `is_active=0`, `disconnected_at NOT NULL`, `disconnect_reason NOT NULL` 만족. P1 #1 정합성 결손 해소.

## 6. 정합 검증 체크리스트

- [x] 백업 파일 생성 (`/var/www/mindgarden/backups/user_social_accounts_KAKAO_4443586436_20260609T151740Z.sql`)
- [x] (a) SELECT 사전 확인: 11 row (10 soft-deleted + 1 active)
- [x] (b) UPDATE ROW_COUNT = 10
- [x] (c) SELECT 사후 확인: 10 row 모두 `is_active=0`, `disconnected_at NOT NULL`, `disconnect_reason NOT NULL`
- [x] (d) id=12 control row 변경 없음
- [x] COMMIT 완료
- [x] 운영 사용자 로그인·매칭 영향 없음 (soft-deleted row 만 변경)

## 7. 후속 액션

- 인벤토리 문서 §6 의 향후 트랙 (UNIQUE 인덱스 추가, ASSERT_NO_DUPLICATE 가드 등) 은 별도 follow-up.
- 운영 로그 정기 모니터링 (`core-shell` 운영 헬스 스냅샷) 에서 동일 KAKAO provider_user_id 재발 여부 추적.

## 8. 변경 이력

| 일시 (KST) | 작성자 | 내용 |
|---|---|---|
| 2026-06-10 00:18 | core-planner | 운영 SQL 실행 결과 초기 작성 (사용자 위임 실행). |
