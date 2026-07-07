# 내담자 대시보드·`/client` 리뉴얼 — 화면 스펙 v1.1

**상태**: v1.1 Freeze (병렬 배치 P1 `core-designer` 핸드오프 완료)  
**SSOT**: `COMMON_DISPLAY_BOUNDARY_MEETING_20260322.md`, B0KlA·`unified-design-tokens.css`, `ContentHeader`, `MGButton`  
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
2. 둥근 카드·부드러운 서페이스 (`var(--mg-color-surface-main)`)
3. 파스텔·세컨더리 악센트  
4. 단일 흐름(위→아래 서사)  
5. 휴먼 톤 카피(내부 용어·코드값 비노출)

---

## 5. 코더·퍼블 인수인계 체크 (요약)

- `ClientDashboard.js`: `ContentHeader` → 히어로 → `ContentKpiRow` → `ContentSection` 와이어 고정  
- `safeDisplay`·`ContentKpiRow.safeKpiChild` 등 표시 경계 준수  
- 토큰 `var(--mg-*)`·B0KlA; 민감 필드 비표시  
- 버튼은 공통 `MGButton` (또는 B0KlA 버튼 클래스) SSOT 준수
- 와이어 HTML: `CLIENT_DASHBOARD_RENEWAL_WIREFRAME_MARKUP.html`  
- 무드 참고 이미지(저장소): `docs/design-system/client-dashboard-renewal-mood-concept.png`

---

## 6. 버전 이력

| 버전 | 일자 | 비고 |
|------|------|------|
| v1 | 2026-04-16 | 디자이너 핸드오프 초안 반영 |
| v1.1 | 2026-04-22 | 구현 반영 초안 |
| v1.1 Freeze | 2026-07-07 | v1.1 스펙 프리즈, Dark Cascade 토큰 및 1280/768 와이어프레임 추가 |

---

## 7. v1.1 구현 반영 (Freeze)

> **상태**: v1.1 Freeze — 구현 진행 가능

- 본문 순서: `ContentHeader`(내 대시보드) → **환영 카드** → **다음 액션·일정**(최대 2카드 / 빈 상태 CTA) → **KPI 3종** → **핵심 블록**(2카드 + `ClientPersonalizedMessages`) → **결제 요약** → **빠른 메뉴 5항목** — 평가·힐링·단독 메시지 섹션은 대시보드에서 제외 *(장식 PNG 없음)*.
- 일정 섹션 루트: `data-testid="client-dashboard-upcoming-schedule"` · 빠른 메뉴: `client-dashboard-quick-menu` / `client-dashboard-quick-menu-section`
- E2E: `tests/e2e/tests/client/client-dashboard-smoke.spec.ts` 동일 testid·「일정」버튼 단언

---

## 8. 다크 모드 (Dark Cascade) 토큰 매핑

내담자 대시보드 다크 모드 적용 시 아래 Cascade 토큰을 우선 적용하여 부드러운 서페이스와 가독성을 보장한다.

| 속성 | Light (기본) | Dark (Cascade) | 비고 |
|------|--------------|----------------|------|
| **배경** | `var(--mg-color-background-main)` (#FAF9F7) | `var(--mg-dark-bg-900)` (#1a1a1a) | 가장 깊은 배경 |
| **서페이스** | `var(--mg-color-surface-main)` (#F5F3EF) | `var(--mg-dark-bg-800)` (#2c2c2c) | 카드, 섹션 블록 배경 |
| **텍스트(주)** | `var(--mg-color-text-main)` (#2C2C2C) | `#E5E5E5` (또는 `var(--mg-color-text-main)` 다크) | 12.3:1 명도비 확보 |
| **텍스트(보조)** | `var(--mg-color-text-secondary)` (#5C6B61) | `var(--mg-color-text-secondary-dark)` (#d1d5db) | 부가 설명, 라벨 |
| **테두리** | `var(--mg-color-border-main)` (#D4CFC8) | `var(--mg-border_dark)` (#d1d5db / #495057) | 카드 테두리, 구분선 |
| **주조색(Primary)** | `var(--mg-color-primary-main)` (#3D5246) | `var(--mg-color-primary-dark)` (#4F6B5A) | 버튼, 주요 악센트 |
| **보조색(Accent)** | `var(--mg-color-accent-main)` (#8B7355) | `#A68A6A` (Accent 다크 톤) | 강조 포인트 |

---

## 9. 1280 / 768 와이어프레임 (반응형 레이아웃)

`mindgarden-design-system.pen`의 반응형 브레이크포인트에 따른 레이아웃 스펙.

### 9.1 Desktop (1280px 이상)
- **최대 너비**: `1200px` (중앙 정렬)
- **그리드**: 12 컬럼 시스템
- **배치**:
  - `ContentHeader`: 좌측 정렬, 우측에 주요 액션 버튼 (`MGButton`)
  - **환영 카드 & KPI**: 상단 1 Row에 병렬 배치 (환영 카드 8-col, KPI 4-col) 또는 전체 폭 사용 시 KPI 3종 가로 배열
  - **핵심 블록 (일정/메시지)**: 2단 분할 (좌측 8-col: 일정/세션, 우측 4-col: 알림/메시지)
  - **빠른 메뉴**: 우측 하단 플로팅(FAB) 또는 헤더 네비게이션 통합

### 9.2 Tablet / Mobile (768px 이하)
- **최대 너비**: `100%` (좌우 패딩 `24px`, 모바일은 `16px`)
- **그리드**: 1 단일 컬럼 (위→아래 수직 흐름)
- **배치**:
  - `ContentHeader`: 텍스트 크기 축소, 버튼은 아이콘화 또는 하단 배치
  - **환영 카드 & KPI**: 수직 스태킹. 환영 카드 아래 KPI Row (가로 스크롤 또는 2x2 그리드)
  - **핵심 블록**: 일정 → 메시지 순으로 수직 스태킹
  - **빠른 메뉴**: 하단 고정 바(Bottom Navigation) 형태로 4~5개 아이콘 균등 배치 (터치 영역 44px 이상 확보)
  - **카드 내부**: 좌측 악센트 바 유지, 텍스트 크기 모바일 최적화 (본문 14px)
