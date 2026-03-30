# 배지 밝은 배경 대비 개선 기획

**목표**: 상담사→내담자 매칭 목록의 상태 배지·세션 배지가 밝은 배경에서 눈에 띄도록, 어두운 색·아토믹 디자인 토큰으로 적용  
**작성**: core-planner  
**참조**: COMMON_UI_IMPLEMENTATION_SPEC.md, INTEGRATED_SCHEDULE_BUTTON_BADGE_SPEC.md, unified-design-tokens.css, dashboard-tokens-extension.css

---

## 1. 목표·배경

- **현상**: 상태 배지(활성/종료됨/대기 등)는 밝은 회색으로 저대비, 세션 배지(1회 남음 등)는 밝은 파란색이라 밝은 배경에서 눈에 띄지 않음.
- **요구**: 밝은 배경에서 눈에 띄는 **어두운 색**으로, **디자인 토큰(아토믹)** 만 사용해 배지 적용.

---

## 2. 범위

| 포함 | 제외 |
|------|------|
| StatusBadge(상태 배지), RemainingSessionsBadge(남은 회기 배지) | 다른 화면의 인라인 getStatusBadge 등 (별도 마이그레이션) |
| common 컴포넌트 2종 + 사용처(매칭 목록·카드·모달 등) | mobile, frontend-ops 전용 배지 |
| 디자인 토큰: unified-design-tokens.css, dashboard-tokens-extension.css 기반 | unified-design-tokens.css 직접 수정(자동생성 파일) |

---

## 3. 배지 사용처·토큰 현황 (파악 결과)

### 3.1 컴포넌트·경로

| 배지 | 소스 | 사용처(주요) |
|------|------|----------------|
| **StatusBadge** | `frontend/src/components/common/StatusBadge.js` + `StatusBadge.css` | CardMeta(integrated-schedule), MappingListRow, MappingCard, ClientMappingTab, MappingDetailModal, MappingEditModal 등 |
| **RemainingSessionsBadge** | `frontend/src/components/common/RemainingSessionsBadge.js` + `RemainingSessionsBadge.css` | CardMeta(integrated-schedule) |

- integrated-schedule: `molecules/CardMeta.js`에서 두 배지 모두 사용 (상담사→내담자 매칭 카드).
- Re-export: `integrated-schedule/atoms/StatusBadge.js`, `RemainingSessionsBadge.js`는 common re-export만 하므로 **수정 대상은 common 한 곳**.

### 3.2 현재 CSS(토큰)

**StatusBadge.css**

- 기본: `mg-v2-status-badge` (padding, font-size, border-radius 등).
- Modifier: `mg-v2-badge--success` ~ `mg-v2-badge--info`.
- **현재 variant별**: `background: var(--mg-*-100)`, `color: var(--mg-*-700)` (success/warning/neutral/danger/info).

**RemainingSessionsBadge.css**

- 클래스: `mg-v2-count-badge`.
- **현재**: `background: var(--mg-primary-100)`, `color: var(--mg-primary-700)`.

**결론**: 100 계열 배경 + 700 계열 텍스트는 밝은 페이지 배경과 대비가 약함. “밝은 배경에서 눈에 띄는 어두운 색”을 위해 **디자이너가 variant별 배경/텍스트 토큰(또는 기존 xxx-200/xxx-600·800 등)을 지정**하고, **코더가 해당 토큰으로 CSS만 변경**하면 됨.

### 3.3 디자인 토큰 파일

- **unified-design-tokens.css**: `--mg-*`, `--cs-*` (primary/success/warning/error/gray/info 등 50~900). **직접 수정 금지**(자동 생성).
- **dashboard-tokens-extension.css**: 대시보드·등급용 확장 변수. 배지 전용 변수는 없음.
- **ATOMIC_DESIGN_SYSTEM.md**: `--cs-badge-*-bg`, `--cs-badge-*-text` 예시(100/700 패턴).

새 **시맨틱 토큰**(예: `--mg-badge-status-success-bg`)이 필요하면 **dashboard-tokens-extension.css** 또는 프로젝트 규칙에 맞는 확장 파일에 추가하고, designer 스펙에 변수명·값(기존 --mg-* 참조 가능)을 명시.

---

## 4. 의존성·순서

1. **Phase 1 (core-designer)**: 밝은 배경 대비용 배지 토큰·스펙 설계 → 산출물 확정.
2. **Phase 2 (core-coder)**: designer 스펙 반영 — StatusBadge.css, RemainingSessionsBadge.css 수정; 필요 시 dashboard-tokens-extension.css에 변수 추가.

---

## 5. Phase 목록 및 분배실행

### Phase 1: 배지 토큰·비주얼 스펙 설계

| 항목 | 내용 |
|------|------|
| **담당** | **core-designer** |
| **목표** | 밝은 배경에서 눈에 띄는 StatusBadge·RemainingSessionsBadge용 색상 토큰 및 스펙 작성. (사용성·정보 노출·레이아웃은 기존 유지, 색상·대비만 개선.) |
| **전달할 태스크 설명** | 아래 “Phase 1 전달문” 참조. |

**Phase 1 전달문 (core-designer 호출 시 전달)**

```
[배지 밝은 배경 대비 스펙 의뢰]

목표: 상담사→내담자 매칭 목록의 상태 배지(StatusBadge)와 세션 배지(RemainingSessionsBadge)가 밝은 배경(#FAF9F7, #F2EDE8 등)에서 눈에 띄도록, 어두운 색으로 디자인 토큰만 사용해 적용하고 싶습니다.

현재:
- StatusBadge: variant별 background var(--mg-*-100), color var(--mg-*-700) (success/warning/neutral/danger/info).
- RemainingSessionsBadge: background var(--mg-primary-100), color var(--mg-primary-700).

요구:
- 밝은 배경에서 가독성·시인성 확보(어두운 색 위주).
- 아토믹 디자인: 기존 unified-design-tokens.css의 --mg-*, --cs-* 또는 dashboard-tokens-extension.css에 추가할 시맨틱 변수만 사용. (unified-design-tokens.css는 자동생성이라 직접 수정하지 않음.)

산출 요청:
1) StatusBadge: variant(success/warning/neutral/danger/info)별 배경·텍스트에 쓸 CSS 변수명(밝은 배경 대비용) 명시.
2) RemainingSessionsBadge: 배경·텍스트에 쓸 CSS 변수명 명시.
3) 필요 시 dashboard-tokens-extension.css에 추가할 변수 정의(이름·값, 기존 --mg-* 참조 가능).
4) docs/design-system/v2/ 또는 docs/project-management/에 저장할 “배지 밝은 배경 대비 스펙” 문서 초안(코더가 CSS만 수정해 적용 가능한 수준).

참조: docs/design-system/v2/COMMON_UI_IMPLEMENTATION_SPEC.md §2·§3, INTEGRATED_SCHEDULE_BUTTON_BADGE_SPEC.md, frontend/src/styles/unified-design-tokens.css, dashboard-tokens-extension.css. B0KlA·어드민 대시보드 샘플 톤 유지.
```

---

### Phase 2: 배지 CSS 적용

| 항목 | 내용 |
|------|------|
| **담당** | **core-coder** |
| **목표** | Phase 1 designer 산출물(배지 토큰·스펙)을 반영해 StatusBadge.css, RemainingSessionsBadge.css 수정. 필요 시 dashboard-tokens-extension.css에 변수 추가. |
| **전달할 태스크 설명** | 아래 “Phase 2 전달문” 참조. |

**Phase 2 전달문 (core-coder 호출 시 전달)**

```
[배지 밝은 배경 대비 CSS 적용]

Phase 1 core-designer가 작성한 “배지 밝은 배경 대비 스펙” 문서와 토큰 명세를 따라 다음을 적용해 주세요.

1) StatusBadge.css: variant별(mg-v2-badge--success, --warning, --neutral, --danger, --info) background-color, color를 스펙에 명시된 CSS 변수로 변경. (기존 레이아웃·padding·font-size·border-radius 등 유지.)
2) RemainingSessionsBadge.css: mg-v2-count-badge의 background-color, color를 스펙에 명시된 CSS 변수로 변경.
3) 스펙에서 dashboard-tokens-extension.css 등에 새 변수 추가를 요청한 경우, 해당 파일에 변수 정의 추가.

참조: /core-solution-frontend, /core-solution-design-system-css. 수정 파일: frontend/src/components/common/StatusBadge.css, RemainingSessionsBadge.css, 필요 시 frontend/src/styles/dashboard-tokens-extension.css. COMMON_UI_IMPLEMENTATION_SPEC.md §2.5·§3.3를 스펙 문서와 맞게 갱신해도 됨.
```

---

## 6. 리스크·제약

- **unified-design-tokens.css**: 자동 생성 파일이므로 배지용 새 변수는 **확장 파일**(예: dashboard-tokens-extension.css)에 두거나, 기존 --mg-* 200/600/800 등으로 해결하는 쪽 권장.
- **다른 화면**: PgConfigurationList, TenantProfile, ConsultationHistory 등 자체 `getStatusBadge`/인라인 스타일은 이번 범위 제외. 필요 시 추후 동일 토큰으로 통일 검토.

---

## 7. 단계별 완료 기준·체크리스트

| Phase | 완료 기준 | 체크리스트 |
|-------|-----------|------------|
| **Phase 1 (designer)** | 코더가 CSS만 수정해 적용 가능한 스펙·토큰 목록 확정 | [ ] variant별 StatusBadge 배경/텍스트 변수명 명시 [ ] RemainingSessionsBadge 배경/텍스트 변수명 명시 [ ] 필요 시 확장 토큰 정의 [ ] 스펙 문서 저장 경로·이름 명시 |
| **Phase 2 (coder)** | 밝은 배경에서 배지 가시성 개선 적용 완료 | [ ] StatusBadge.css 토큰 반영 [ ] RemainingSessionsBadge.css 토큰 반영 [ ] 확장 토큰 추가 시 dashboard-tokens-extension.css 반영 [ ] (선택) COMMON_UI_IMPLEMENTATION_SPEC.md §2.5·§3.3 갱신 |

---

## 8. 실행 요청문

다음 순서로 서브에이전트를 호출해 주세요.

1. **Phase 1**: **core-designer** — 위 “Phase 1 전달문” 전체를 프롬프트로 전달. 산출물(배지 밝은 배경 대비 스펙 문서·토큰 명세)을 확정할 때까지 진행.
2. **Phase 2**: **core-coder** — Phase 1 산출물을 첨부한 뒤, 위 “Phase 2 전달문”을 프롬프트로 전달. StatusBadge.css, RemainingSessionsBadge.css 및 필요 시 dashboard-tokens-extension.css 수정.

Phase 2는 Phase 1 완료 후 진행합니다.
