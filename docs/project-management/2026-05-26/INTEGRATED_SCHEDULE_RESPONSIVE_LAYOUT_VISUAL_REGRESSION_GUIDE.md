# 통합 스케줄링 반응형 레이아웃 시각 회귀 검수 가이드 (옵션 A)

- **대상 PR**: feat/integrated-schedule-responsive-layout
- **시안 핸드오프**: `docs/project-management/2026-05-26/INTEGRATED_SCHEDULE_RESPONSIVE_LAYOUT_DESIGN_HANDOFF.md`
- **시안 권고**: 옵션 A (좌측 패널 collapse 토글 + 상단 안내 아코디언, Q2=A 기본 접힘)
- **검수 라우트**: `/admin/integrated-schedule` (또는 통합 스케줄링 진입 메뉴)

---

## 1. 회귀 검수 매트릭스 (4 break point)

| Break point | 최소 가정 폭 | 기본 사이드바 상태 | 기본 안내 상태 | 확인 사항 |
| --- | --- | --- | --- | --- |
| Desktop | **1920px** | 펼침 (320px) | 접힘 (Q2=A) | 캘린더가 가용 폭 전부 차지, 안내 토글 헤더 1줄 노출 |
| Laptop | **1440px** | 펼침 (320px) | 접힘 | 사이드바·캘린더 균형, 신규 매칭 + month/week/day 토글 위치 유지 |
| Low-res PC | **1280px** | 자동 접힘 (48px) | 접힘 | 사이드바가 자동 접힘되어 캘린더 풀 폭, 토글 chevron 으로 펼침 가능 |
| Tablet edge | **1024px** | 자동 접힘 (48px) | 접힘 | min-width 0 (가로 스크롤 허용), 좌측 토글 + 안내 헤더 모두 1줄 |

> 768px 이하(모바일)는 본 PR 범위 외. 시안 §3 후속.

---

## 2. 스크린샷 캡처 가이드

각 폭에서 다음 5가지 상태를 캡처:

1. **기본 진입 상태** — 첫 로드 직후 (안내 접힘 + 사이드바 자동 토글)
2. **안내 펼친 상태** — `안내 ▼` 클릭 후 (공휴일·회기·상담사·주요 상태 4종 모두 노출)
3. **사이드바 접힌 상태** — chevron 클릭 후 좌측 48px 폭 + 카운트 뱃지
4. **사이드바 펼친 상태** — chevron 다시 클릭하여 320px 복귀
5. **localStorage 보존 확인** — 새로고침 후 마지막 토글 상태 유지되는지 검증

---

## 3. 회귀 체크리스트

### 3.1 옵션 A 합의 정합
- [ ] 좌측 매칭 패널이 320px ↔ 48px 토글된다 (CSS transition 0.2s 부드럽게).
- [ ] 사이드바 접힘 시 매칭 카드 카운트 뱃지가 chevron 위/아래에 노출된다.
- [ ] 상단 안내 영역은 기본 접힘 상태이며 단일 1줄(40-48px) 헤더만 보인다.
- [ ] 안내 펼침 시 공휴일·회기 표기·상담사·주요 상태 4섹션이 모두 노출된다.
- [ ] 캘린더는 `flex: 1`로 가용 공간을 모두 차지한다 (`min-width: 700px` 보장, 1024px 이하만 0).

### 3.2 보존되어야 할 기존 UX
- [ ] 우측 상단 **"신규 매칭"** 버튼 위치/스타일 동일.
- [ ] 우측 상단 month / week / day 토글 위치 동일 (캘린더 내부 헤더).
- [ ] 새로고침 버튼 / 전체 상담사 셀렉터 위치 동일.
- [ ] 매칭 카드 드래그 → 캘린더 드롭 동선 유지 (사이드바 펼침 상태에서).
- [ ] 매칭 카드 시각 디자인 (CardContainer, 패딩, 색상) 변경 없음.
- [ ] 캘린더 내부 셀(이벤트 dot, 회기 표기 등) 변경 없음.

### 3.3 a11y / 키보드
- [ ] 사이드바 토글 버튼 `aria-expanded` 가 펼침/접힘 상태에 따라 정확히 갱신.
- [ ] 사이드바 토글 버튼 `aria-controls` 가 사이드바 본문 `id` 와 일치.
- [ ] 안내 토글 버튼 `aria-expanded`, `aria-controls` 동일하게 동작.
- [ ] 토글 버튼이 Tab 으로 포커스 가능, Enter/Space 로 동작.
- [ ] 포커스 outline 이 디자인 토큰 색상으로 정상 노출.

### 3.4 localStorage 보존
- [ ] `mg.integratedSchedule.sidebarCollapsed` 값이 토글 시 저장된다.
- [ ] `mg.integratedSchedule.legendCollapsed` 값이 토글 시 저장된다.
- [ ] 새로고침 후 동일 폭에서 사용자 선호 상태가 복원된다.
- [ ] 다른 폭(1280px→1920px)으로 변경해도 사용자 명시적 토글 후에는 자동 접힘이 강제되지 않는다.

### 3.5 디자인 토큰 / 하드코딩
- [ ] CSS 신규 영역에 hex 컬러 직접 사용 없음 (모두 `var(--mg-color-*)` 또는 `var(--ad-b0kla-*)`).
- [ ] 간격은 `var(--mg-spacing-*)` 사용.
- [ ] 신규 텍스트 ("매칭 목록 토글", "안내", "공휴일 · 회기 표기 · 상담사", "매칭 N건") 모두 i18n 키 (`admin.integratedSchedule.*`) 사용.

### 3.6 게이트 PASS 확인
- [ ] `npm --prefix frontend run check:i18n-seed` → PASS.
- [ ] `npm --prefix frontend run build:ci` → PASS.
- [ ] `npm run lint:codemod-mappings` (D11) → PASS.
- [ ] `frontend/src/components/ui/Schedule/__tests__/ScheduleLegend.test.js` → PASS (7건).

---

## 4. 회귀 우려 영역 (특별 점검)

- **다른 라우트의 ScheduleLegend 사용처**:
  `calendarSkin !== 'integrated'` (상담사 마이 캘린더 등) 경로에서는 기존과 동일하게 collapsible 미적용·인라인 렌더링 유지되어야 함.
- **드래그 앤 드롭 회귀**:
  사이드바 접힌 상태에서는 매칭 카드가 hidden 영역에 존재 → 드래그 불가 (의도된 동작). 펼친 상태에서만 드래그 가능. 사용자가 접힌 상태로 드래그를 시도할 가능성에 대비해 chevron 토글 동선 명확화 필요.
- **로컬 스토리지 도메인 격리**:
  키 `mg.integratedSchedule.*` 는 통합 스케줄링 한정 (다른 기능과 충돌 없음).

---

## 5. 검수 후 후속 위임 권고

1. **시각 검수 통과 시**: deployer 위임 (PR 머지 + dev/stage 배포 검증).
2. **회귀 발견 시**: 본 가이드 §3 의 어느 체크리스트가 실패했는지 명시하여 core-coder 재위임.
3. **모바일 (768px↓) 별도 검토 필요 시**: 시안 §3 후속 위임 (현재 PR 범위 외).
