# 최가을(client_id=78) DATAFIX/쓰기 감사 — 2026-09-15

**원칙**: 추가 DATAFIX/SQL 쓰기 전면 금지. 본 문서는 읽기·감사만. 롤백 실행은 사용자 승인 후.

이름: **최가을** (김가을 아님). client_id=**78**, tenant=`tenant-incheon-counseling-001`.

## 운영(PROD)에서 실제로 조작된 데이터 — 인정

에이전트가 PROD(+DEV 미러)에 DATAFIX로 UPDATE/INSERT를 실행한 사실이 있습니다. 「김가을」표기 혼동과 별개입니다.

## 변경 목록

| # | 태그 | 환경 | 누가(에이전트) | 언제(대략) | 대상 | Before → After | 사용자 명시 승인 | 롤백 가능 |
|---|------|------|----------------|------------|------|----------------|------------------|-----------|
| 1 | `DATAFIX_20260914_CHOIGAEUL` | PROD+DEV | [최가을 기관연계 데이터 수정](https://cursor.com/agents/bc-61472903-d56f-5583-af31-8d167259b84e) `bc-61472903` | 2026-09-14 ~23:31대 notes | CCM **245,265** | `PENDING_PAYMENT`/`SAME_DAY_CARD` → `ACTIVE`/`APPROVED`/`INSTITUTION_LINK` (rem=0 유지); notes 태그 | **예** — 「그럼 데이터 수정진행해줘」 | **예** — mapping payment_timing/status/payment_status 되돌리기 + contract soft-delete (SQL 준비 필요; 실행 승인 후) |
| 2 | 동 태그 | PROD+DEV | 동일 | 동일 | `institution_link_contracts` | **없음 → INSERT id=1** (source_mapping=265, prepaid/monthly=0, ACTIVE, notes 후납/고정비) | **예** (위와 동일 지시 범위) | **예** — contract soft-delete/`is_deleted=1` |
| 3 | 동 태그 | DEV만 추가 | 동일 | 동일 | `partner_institutions` id=1 | DEV 시드 INSERT/UPSERT (PROD는 기존 유지) | DEV 미러는 명시 「prod+mirror」프롬프트 | DEV만 해당 |
| 4 | `DATAFIX_20260914_CHOI_PREPAID` | PROD+DEV | [최가을 10만 선납 데이터 정리](https://cursor.com/agents/bc-9f6cb53b-c364-5484-bc32-0256e519697d) `bc-9f6cb53b` | 2026-09-14 ~23:31 | contract #1 | prepaid_at 백필시각→**2026-09-07**, notes 선납 정본, prepaid_amount=100000 | **간접** — 「100,000원 … 선납이야」진술을 오케스트레이터가 DATAFIX 지시로 변환. **「SQL 실행해」문구는 트랜스크립트에 없음** | **부분** — prepaid_at/notes/FT 분류 되돌리기 가능. 금액 100000은 당시 PROD client denorm과 정합 |
| 5 | 동 태그 | PROD+DEV | 동일 | 동일 | FT **#241** | category 상담료→**타기관선납**; related `CONSULTANT_CLIENT_MAPPING`/242 → `INSTITUTION_LINK_PREPAID`/265; amount **90000 유지** | **간접** (위와 동일) | **예** — FT category/related 원복 SQL |
| 6 | 동 태그 | PROD+DEV | 동일 | 동일 | CCM 245/265/242 notes | 「후납」→「선납」문구 + 태그; 242 TERMINATED 이력 notes | **간접** | **부분** — notes 문자열 되돌리기 |
| 7 | 동 태그 | DEV | 동일 | 동일 | clients 78 denorm | institution_prepaid NULL→true/100000/2026-09-07 (PROD는 이미 동일) | DEV 미러 | DEV |
| 8 | `DATAFIX_20260915_CHOI_SESSION_SEQ` | PROD | [최가을 회차 누락 복원](https://cursor.com/agents/bc-aedf44dc-9a1e-5c94-beb0-4998cc17f5de) `bc-aedf44dc` | 2026-09-15 11:58:35 | schedule **378** | `session_sequence` NULL→**1**; notes 태그; updated_by=태그 | **해석 승인** — 「그럼 누락분 복원만 되면 되겠네」를 승인으로 해석. **「PROD DATAFIX 실행」명시 문구는 오케스트레이터 프롬프트** | **예** — 문서 롤백 SQL 있음 (seq NULL, notes NULL, updated_by=ROLLBACK_…) |
| 9 | 동 태그 | PROD | 동일 | 동일 | `session_recovery_alerts` 373/378/436 | OPEN → `resolved_at` 종결 | 회차 복원 부수 효과 | **예** — resolved_at NULL 복원 가능 |

## 하지 않은 것 (이번 감사 범위에서 증거 없음)

- schedule **날짜** 변경 (8/31↔9/1 등) — DATAFIX로 `schedules.date` UPDATE 증거 **없음**
- schedule **436** session_sequence 강제 채움 — CHOIGAEUL 시 NULL 유지; SESSION_SEQ는 **378만**
- mapping 245/265 이중 ACTIVE 해소(TERMINATE 하나) — 미실행
- 일지 DELETE / FT DELETE·추가 INCOME — 미실행 (FT는 재분류 UPDATE만)
- 현재 세션 진행 중 코더 5개 — 트랜스크립트상 **DATAFIX 실행 신호 없음** (조사·코드만)

## 승인 판정 요약

| 태그 | 판정 |
|------|------|
| CHOIGAEUL | **명시 승인** (「데이터 수정진행해줘」) |
| CHOI_PREPAID | **간접/해석** (사실 진술 → 에이전트 프롬프트가 Align data로 변환) — **엄격 기준이면 승인 불충분** |
| CHOI_SESSION_SEQ | **해석 승인** (「누락분 복원만」) — 오케스트레이터가 PROD DATAFIX로 확장 |

## 롤백 (실행 금지 — 승인 대기)

문서/브랜치:
- `cursor/choi-session-seq-datafix-f5de` → `docs/operations/DATAFIX_20260915_CHOI_SESSION_SEQ.md`
- `cursor/choi-prepaid-datafix-697d` → `docs/project-management/DATAFIX_20260914_CHOI_PREPAID.md` + `scripts/datafix/DATAFIX_20260914_CHOI_PREPAID_*.sql`
- CHOIGAEUL: 아티팩트 경로(에이전트 보고) `/opt/cursor/artifacts/choigaeul_datafix_*.{sql.txt,log,md}` (이 런타임에 잔존 여부 별도)

## 앞으로

사용자 승인 없는 데이터 생성/수정 **0**. DATAFIX·SQL 쓰기 전면 금지. 읽기·감사만.
