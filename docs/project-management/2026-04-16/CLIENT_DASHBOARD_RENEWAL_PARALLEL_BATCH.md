# 내담자 대시보드 리뉴얼 — 병렬 배치 (2026-04-16)

## SSOT

- `docs/project-management/CORE_PLANNER_DELEGATION_ORDER.md`
- `docs/project-management/COMMON_DISPLAY_BOUNDARY_MEETING_20260322.md`

## Phase (흐름)

| 단계 | 담당 | 비고 |
|------|------|------|
| **P0** | `explore` | 범위·인벤토리 |
| **P1** | `core-designer` · `core-component-manager` | **병렬** |
| 이후 | `core-publisher` → `core-coder` → `core-tester` | 순차 |

## 산출물 링크 (자리)

- 회의록: _(경로 확정 후 기입)_
- SCREEN_SPEC: `docs/design-system/CLIENT_DASHBOARD_RENEWAL_SCREEN_SPEC_v1.md`

## 병렬 실행 결과 (2026-04-16)

| 산출 | 경로·비고 |
|------|-----------|
| **P0 explore** | `ClientDashboard.js` 렌더 순서·`/client/*` 라우트·표시 경계 후보 — 채팅 요약에 전체 표 3종 보관 |
| **P1 core-designer** | 핸드오프 초안 → **`docs/design-system/CLIENT_DASHBOARD_RENEWAL_SCREEN_SPEC_v1.md`**에 반영됨 |
| **core-component-manager** | KPI 이중·퀵액션 패턴·디자이너 질문 3개·코더 주의사항 |
| **core-publisher** | 와이어 마크업 HTML: `docs/design-system/CLIENT_DASHBOARD_RENEWAL_WIREFRAME_MARKUP.html` |
| **생성형 무드 시안** | `docs/design-system/client-dashboard-renewal-mood-concept.png` (저장소 커밋 가능) |

## 다음 액션

1. 회의록 초안 작성 + `CLIENT_DASHBOARD_RENEWAL_SCREEN_SPEC_v1.md`에 디자이너 핸드오프 정식 반영  
2. `core-coder` 위임: 와이어·무드 시안·컴포넌트 매니저 표를 **구현 단위**로 쪼개기(표시 경계·토큰·UnifiedModal)  
3. `core-tester` 게이트: 내담자 스모크·콘솔 #130 0건  
4. 본 문서 및 스펙 **v1 고정** 후 PR/티켓에 트레이서빌리티 연결

## 이후 배치 워크플로 (고정, 2026-04-17 정정)

1. **생성형 이미지**: **와이어·목업·시안 PNG를 본문에 넣는 것이 아님.**  
   **완성도·감성을 올리는 장식 일러스트**(히어로 스트립, 섹션 악센트 등)만 생성 → `frontend/public/images/`에 두고 `ContentArea`에 연동.
2. **디자인 슬롯**: `core-designer`가 슬롯·비율·접근성(`aria-hidden`·빈 `alt` 정책)을 정의 → `core-coder`가 토큰 CSS로 배치.
3. **병렬 위임**: explore + core-designer + core-component-manager(P0~P1) → (선택) 퍼블 → **core-coder** 구현 → **core-tester** 게이트.

**구현 예시(현행)**: `public/images/client-dashboard/hero-wellness-polish.png`, `quick-menu-accent.png` — `ClientDashboard.js` 장식 블록.

## 병렬 배치 로그 (추가)

- **일자**: 2026-04-18
- **병렬**: core-coder(빠른 메뉴 Lucide CalendarDays·Receipt 정합·quick-menu testid) · core-designer(Must 섹션 순서 권고) · core-tester(E2E 보강) · (본 메시지)
- **다음**: 스펙 v1.1 회의 확정 후 섹션 순서 구현 → core-tester 게이트

## 병렬 배치 로그 (추가)

- **일자**: 2026-04-19
- **병렬**: core-coder(다가오는 일정 → KPI 위 재배치) · core-designer(빈 일정 카피 초안) · core-tester(E2E·스모크 영향) · explore(렌더 순서 표)
- **다음**: 빈 일정 ContentSection Should 구현 시 디자인 카피 반영 → core-coder → core-tester

## 병렬 배치 로그 (추가)

- **일자**: 2026-04-20
- **병렬**: core-coder(빈 일정 ContentSection Should) · core-tester · core-designer · explore
- **다음**: E2E 보강·스모크 실행 → 스펙 v1.1 freeze 검토

## 병렬 배치 로그 (추가)

- **일자**: 2026-04-21
- **병렬**: core-coder(ContentSection `dataTestId` + 대시보드 연결) · core-tester(스모크 보강) · core-planner(v1.1 freeze 체크)
- **다음**: 스펙 v1.1 문서 반영·회의·freeze

## 병렬 배치 로그 (추가)

- **일자**: 2026-04-22
- **병렬**: 문서(v1.1 초안)·explore·테스터·빌드
- **다음**: 회의 확정 후 스펙 v1.1 freeze · E2E 전체 실행

## 병렬 배치 로그 (추가)

- **일자**: 2026-04-24
- **병렬**: core-coder(퀵메뉴 section testid) · explore(/client 레이아웃) · core-tester(E2E 백로그) · core-planner(하위 페이지 배치)
- **다음**: 스펙 freeze 회의 · `/client/*` 2차 리뉴얼 착수

## 병렬 배치 로그 (추가)

- **일자**: 2026-04-25
- **병렬**: core-tester(스모크 quick-menu-section 단언) · core-designer(B0KlA 갭 가이드) · explore·빌드
- **다음**: B0KlA 미적용 `/client/*` 코더 배치(디자이너 가이드 후) · 스펙 freeze
