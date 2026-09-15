# STOP — IL 카드 초기상담료 100,000 표시 금지 (폐기·미머지)

재무 정본 = **FT 90,000** (FT #241). 계약 `prepaid_amount=100000` 은 DATAFIX 잔존이며 **표시 SSOT 아님**.

## 브랜치 상태 (2026-09-15 검증)

| 브랜치 | 상태 |
|--------|------|
| `cursor/il-prepaid-display-0b98` | **폐기·미머지** — tip `aa4a6d0a0` restore prepaid 10만 표시. **PR 없음**. IL tip에 ancestor **아님**. |
| `cursor/il-card-progress-billing-7f13` (#1022) | tip `f1ac9d05f` — prepaid 10만 SSOT **금지** 커밋. `aa4a6d0a0` **미포함**. |
| `cursor/il-cumulative-schedule-display-7f13` | tip `1e589ac46` — 동일 금지. `aa4a6d0a0` **미포함**. |
| `cursor/il-ft90k-no-prepaid-ssot-b4f1` | FT9만 정정 방향. |

**결론:** 10만 표시 브랜치는 **폐기/미머지**. tip에 머지된 적 없음 → 제거 불필요.

## 금지 (검증 에이전트 전달용)

수신: [IL표시 하드코딩·로직검증](https://cursor.com/agents/bc-7ceb0a0f-bd42-5122-8102-03d41b0abb5c) (`bc-7ceb0a0f-bd42-5122-8102-03d41b0abb5c`)

1. **prepaid 10만 표시 금지** — `institutionLinkPrepaidAmount` / `contract.prepaid_amount` / `초기상담료(선납) 100,000` 를 IL 카드·Peek 정본으로 쓰지 말 것.
2. **client 78 특례 금지** — `client_id=78`(최가을) 전용 하드코딩·분기·금액 오버라이드 금지. 공통 FT/packageName 9만 경로만.
3. **DATAFIX 금지** — UPDATE/INSERT/DELETE/SSH DB 쓰기 0.
4. **PROD 배포 금지**.

## 표시 정본

- 금액: FT/전표 **90,000** 또는 정합 `packageName`(패키지 9만)
- 일자: `schedules.date` (lifetime MIN 등 SELECT)
- 회귀 금지: `feat(schedule): restore IL 초기상담료(선납) prepaid_amount display` (`aa4a6d0a0`) 및 동계열을 tip에 머지하지 말 것

## 증거 명령

```bash
git merge-base --is-ancestor aa4a6d0a0 origin/cursor/il-card-progress-billing-7f13; echo $?
# 기대: 1 (미포함)
git merge-base --is-ancestor aa4a6d0a0 origin/cursor/il-cumulative-schedule-display-7f13; echo $?
# 기대: 1 (미포함)
gh pr list --head cursor/il-prepaid-display-0b98
# 기대: []
```

출처 에이전트: [충돌 차단](https://cursor.com/agents/bc-59279def-9049-5b91-82c4-15bbc008f95a)
관련: [IL카드 초기상담료10만 표시](https://cursor.com/agents/bc-851f9348-0059-557d-93fe-d589bb930b98) · [FT9만 정정](https://cursor.com/agents/bc-e85abc9f-15e6-5aac-8c99-703881b5b4f1)
