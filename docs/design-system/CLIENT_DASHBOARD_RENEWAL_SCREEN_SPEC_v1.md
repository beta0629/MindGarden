# 내담자 대시보드·`/client` 리뉴얼 — 화면 스펙 v1

**상태**: 초안 (병렬 배치 P1 `core-designer` 핸드오프 반영)  
**SSOT**: `COMMON_DISPLAY_BOUNDARY_MEETING_20260322.md`, B0KlA·`unified-design-tokens.css`  
**관련**: `docs/project-management/2026-04-16/CLIENT_DASHBOARD_RENEWAL_PARALLEL_BATCH.md`

---

## 1. 사용성 · 정보 노출 · 레이아웃

| 요소 | 요약 |
|------|------|
| 사용성 | 다음 일정·미완료 액션·알림을 최우선; 짧은 경로·명확한 CTA |
| 정보 노출 | 운영·내부 KPI 숨김; 나와 직접 관련된 상태만; 숫자·날짜·금액은 한 줄 요약 + 드릴다운 |
| 레이아웃 | 단일 컬럼 우선·필요 시 KPI만 2열; 히어로 요약 → KPI 스트립 → `ContentSection` 블록 |

---

## 2. 섹션 순서 (상→하)

**Must**: 환영·컨텍스트 → 다음 액션·일정 요약 → KPI(`ContentKpiRow`) → 핵심 블록(일정 또는 세션) → 핵심 블록(메시지·알림)  

**Should**: 결제·이용권 요약 → 설정·도움말 → 빠른 메뉴(하단 또는 고정)

---

## 3. 빠른 메뉴 (4~5개)

| 라벨 예시 | Lucide 방향 |
|-----------|-------------|
| 일정 | `Calendar` / `CalendarDays` |
| 메시지 | `MessageCircle` |
| 결제·이용 내역 | `CreditCard` / `Receipt` |
| 내 정보 | `User` / `Settings` |
| (선택) 도움말 | `HelpCircle` |

선(line) 아이콘 통일; 채움 아이콘 지양.

---

## 4. 관리자·상담사 대비 차별화 키워드

1. 여백 중심  
2. 둥근 카드·부드러운 서페이스  
3. 파스텔·세컨더리 악센트  
4. 단일 흐름(위→아래 서사)  
5. 휴먼 톤 카피(내부 용어·코드값 비노출)

---

## 5. 코더·퍼블 인수인계 체크 (요약)

- `ClientDashboard.js`: 히어로 → `ContentKpiRow` → `ContentSection` 와이어 고정  
- `safeDisplay`·`ContentKpiRow.safeKpiChild` 등 표시 경계 준수  
- 토큰 `var(--mg-*)`·B0KlA; 민감 필드 비표시  
- 와이어 HTML: `CLIENT_DASHBOARD_RENEWAL_WIREFRAME_MARKUP.html`  
- 무드 참고 이미지(저장소): `docs/design-system/client-dashboard-renewal-mood-concept.png`

---

## 6. 버전 이력

| 버전 | 일자 | 비고 |
|------|------|------|
| v1 | 2026-04-16 | 디자이너 핸드오프 초안 반영 |
| v1.1 | 2026-04-22 | 구현 반영 초안 |

---

## 7. v1.1 구현 반영 (초안, 2026-04-22)

> **상태**: v1.1 초안 — freeze 전 회의 대기

- 본문 순서: `ContentHeader`(내 대시보드) → **환영 카드** → **다음 액션·일정**(최대 2카드 / 빈 상태 CTA) → **KPI 3종** → **핵심 블록**(2카드 + `ClientPersonalizedMessages`) → **결제 요약** → **빠른 메뉴 5항목** — 평가·힐링·단독 메시지 섹션은 대시보드에서 제외 *(장식 PNG 없음)*.
- 일정 섹션 루트: `data-testid="client-dashboard-upcoming-schedule"` · 빠른 메뉴: `client-dashboard-quick-menu` / `client-dashboard-quick-menu-section`
- E2E: `tests/e2e/tests/client/client-dashboard-smoke.spec.ts` 동일 testid·「일정」버튼 단언
