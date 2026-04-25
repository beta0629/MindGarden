# 내담자 카드 통합 — P0/P1 디버그 클로저 (2026-04-25)

코더 머지 후 `ClientCard`·`ClientSelector`·`ClientSelectionStep` 재점검. (본 문서는 분석 기록; 구현 변경 없음.)

## P0 (#130 · 진행률 `%` / 회차 `회` 표시)

**종결.** `ClientCard`에서 진행률·세션 수는 모두 `toSafeNumber` 경유 후 JSX에 반영됨.

| 구간 | 근거 |
|------|------|
| `getProgressPercentage` | `progressPercentage` 및 `total`/`completed` 계산에 `toSafeNumber` 사용 (`ClientCard.js` 87–99행). |
| `getSessionInfo` | `total`·`completed` 모두 `toSafeNumber` 체인 (`105–111행`). |
| `%` 표시 | compact 148행, detailed `progressPct` 158·236·239행, mobile 367·370행, mobile-simple 451행 — 값 출처가 위 헬퍼. |
| `회` 표시 | compact 144행, detailed 218행, mobile 359행, mobile-simple 453행 — `getSessionInfo().total` 또는 캐시된 `sessionInfo.total`. |

`toSafeNumber`는 비유한·객체 래핑 시 fallback으로 수렴 (`frontend/src/utils/safeDisplay.js` 57–81행).

## P1 잔여 (3항)

1. **`ClientSelectionStep.js` — `...mapping.client` 잔존**  
   매핑→내담자 객체 구성 시 97–108행·171–182행에서 여전히 스프레드. API 스키마 변화 시 카드 외 필드가 그대로 전달됨(표시는 `ClientCard`에서 방어).

2. **`ClientSelectionStep.js` — `mapping.client` null/형 불일치**  
   94행 등 `mapping.client.id` 직접 접근; `client` 누락 시 런타임 예외 가능. 코더: optional chaining·가드 또는 DTO 정규화 권장.

3. **`ClientSelector.js` — 경계 숫자 정규화**  
   `ClientCard`에 넘기는 객체는 `...client` 후 `totalSessions`/`completedSessions`만 `|| 0` (394–401행). 표시 P0는 카드 내부 `toSafeNumber`로 종결되나, **선택 요약·다른 화면**과의 일관을 위해 경계에서 `toSafeNumber` 적용은 P1(방어 심화)로 남김.

## 코더 후속 권장

- `ClientSelectionStep`의 매핑→클라이언트 빌더를 한 함수로 추출하고 `mapping.client` null-safe 처리.
- `ClientSelectionStep` 292행 `(남은 세션: {selectedClient.remainingSessions}회)` — 카드와 동일 정책이면 `toSafeNumber` 정렬 검토.

---

**P0 한 줄:** 종결.
