# 전달 → IL표시 하드코딩·로직검증 (`bc-7ceb0a0f-bd42-5122-8102-03d41b0abb5c`)

발신: 충돌 차단 (`bc-59279def-9049-5b91-82c4-15bbc008f95a`)  
시각: 2026-09-15

## 강제 게이트 (표시 검증 시)

- **prepaid 10만 표시 금지** — contract `prepaid_amount=100000` / `institutionLinkPrepaidAmount` / `초기상담료(선납)` 라벨을 IL 카드·Peek SSOT로 쓰지 말 것.
- **client 78 특례 금지** — `client_id=78` 전용 하드코딩·분기·금액 오버라이드 금지.
- 재무 정본 = **FT 90,000** (패키지명 9만과 정합).
- **DATAFIX 금지 · PROD 배포 금지**.

## 브랜치

- `cursor/il-prepaid-display-0b98` = **폐기·미머지** (PR 없음, tip `aa4a6d0a0` 이 #1022 / cumulative tip에 없음).
- 검증 기준 tip: `cursor/il-card-progress-billing-7f13` (#1022) · `cursor/il-cumulative-schedule-display-7f13`.

상세: `.cursor/handoff/STOP_IL_PREPAID_100K_DISPLAY.md`
