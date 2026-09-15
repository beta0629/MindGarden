# BINDING — 스킬 추측금지 재확인 → 금액·날짜 표시 정본

출처: [스킬 추측금지 재확인](https://cursor.com/agents/bc-4f521075-21b3-5b3d-8648-528ec5efbcb5) (`bc-4f521075`)  
바인딩 대상: [금액·날짜 표시 정본 고정](https://cursor.com/agents/bc-4251ce40-29b1-59d2-a2fe-51b3b0c8b751), [FT9만 정정](https://cursor.com/agents/bc-e85abc9f-15e6-5aac-8c99-703881b5b4f1), IL 누적 표시 브랜치 작업자.

작업 전 스킬 확인 필수. 추측·추정 문구 금지. DATAFIX/SQL/PROD 배포 **0**.

## 대상 고정

- 이름: **최가을** (김가을 아님)
- `client_id=78`

## 강제 정본 (표시만)

| 항목 | 정본 | 금지 |
|------|------|------|
| **금액** | 재무 **FT SELECT** — FT `#241` amount **90,000** (`/opt/cursor/artifacts/choi_prepaid_prod_verify.txt`) | `prepaid_amount=100000` 를 초기상담료·패키지 정본으로 표시 |
| **일자** | `schedules.date` (lifetime MIN 등 SELECT) | `mapping.startDate`를 최초 상담일로 위장 |
| **DATAFIX** | 없음 | UPDATE/INSERT/DELETE/SSH DB 실행 |
| **카피** | API/DB 필드만 | 증거 없는 「준비 중」「아마」「~로 보임」 |

contract/denorm **100000** 과 FT **90000** 은 병존 사실. UI는 FT(및 정합 `packageName`)만 정본 표시.

## 스킬·핸드오프

- `core-solution-standardization` — 추측 금지
- `core-solution-debug` — DB 읽기 전용
- `core-solution-database-first` — 조회 전 가정 UI 금지
- `.cursor/handoff/HANDOFF_DATAFIX_SQL_WRITE_BAN.md` — 승인 없는 쓰기 0
- `.cursor/handoff/CHOI78_DATAFIX_AUDIT_20260915.md` — 추가 DATAFIX 금지

## 회귀 금지

`restore IL 초기상담료(선납) prepaid_amount display` 류 커밋으로 contract 10만을 다시 정본화하지 말 것.
