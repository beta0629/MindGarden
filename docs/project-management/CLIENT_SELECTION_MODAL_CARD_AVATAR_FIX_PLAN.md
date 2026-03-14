# 내담자 선택 모달 카드·아바타 수정 기획서

**작성일**: 2025-03-14  
**목표**: ClientSelectionStep 모달 내 내담자 카드(`.mg-client-card.mg-client-card--detailed`) 스타일 이상 및 내담자 아바타 공통 모듈 미적용 문제를 분석·수정하기 위한 태스크 분배

---

## 1. 요구·배경

- **현상**: 내담자 선택 모달(ClientSelectionStep) 내 `.mg-client-card.mg-client-card--detailed` 카드 스타일 이상, 아바타가 공통 모듈(Avatar)과 디자인 스펙에 맞게 표시되지 않음.
- **목표**: 펜슬/Admin B0KlA 디자인 준수, 공통 Avatar 모듈 정상 적용, 카드 비주얼 일관성 확보.

---

## 2. 탐색 결과 요약

### 2.1 컴포넌트·경로

| 항목 | 경로/내용 |
|------|-----------|
| ClientSelectionStep | `frontend/src/components/schedule/steps/ClientSelectionStep.js` |
| ClientSelector | `frontend/src/components/schedule/ClientSelector.js` |
| ClientCard | `frontend/src/components/ui/Card/ClientCard.js` |
| DOM 경로 | `mg-modal-overlay` > `mg-modal` > `client-selection-step` > `client-selector` > `mg-client-cards-grid` > `mg-client-card.mg-client-card--detailed` |

- **렌더 체인**: ClientSelectionStep → ClientSelector → ClientCard (variant: `detailed` 또는 `mobile-simple`)
- ClientCard는 **이미** 공통 `Avatar` 컴포넌트(`frontend/src/components/common/Avatar.js`)를 import하여 사용함.

### 2.2 아바타 공통 모듈 클래스명 불일치 (근본 원인)

| 구분 | 현재 Avatar.js 출력 | 디자인 스펙·emergency-design-fix.css 기대 |
|------|---------------------|------------------------------------------|
| 이미지 | `mg-v2-avatar__img` | `mg-v2-avatar-img` |
| 이니셜 폴백 | `mg-v2-avatar__fallback` | `mg-v2-avatar-fallback` |

- `emergency-design-fix.css`, `ProfileCard.css`, `ConsultantClientWidget.css` 등은 `mg-v2-avatar-img`, `mg-v2-avatar-fallback` 셀렉터로 아바타 자식 스타일을 오버라이드함.
- Avatar.js는 `mg-v2-avatar__img`, `mg-v2-avatar__fallback`을 사용하므로 **셀렉터가 매칭되지 않아** 컨텍스트별 오버라이드가 적용되지 않음.
- **참조 문서**: `docs/design-system/AVATAR_COMPONENT_DESIGN_SPEC.md`, `docs/design-system/v2/AVATAR_IMAGE_OR_INITIAL_SPEC.md`.

### 2.3 카드 스타일 관련

- `unified-design-tokens.css`의 `.mg-client-card`는 글라스모피즘(backdrop-filter, rgba) 스타일 사용.
- B0KlA·펜슬(`mindgarden-design-system.pen`) 기준: `--ad-b0kla-*`, `--mg-color-*`, 섹션 블록 스타일.
- `docs/design-system/CONSULTANT_CLIENT_CARD_DESIGN_SPEC.md`는 `mg-v2-profile-card`(관리 페이지용) 스펙으로, 스케줄 모달 내 선택 카드와는 용도가 다름.
- 모달 내 카드가 B0KlA/펜슬에서 어떤 형태로 정의되어 있는지는 **Pencil 파일 직접 확인** 필요.

### 2.4 아바타 공통 모듈 위치

- **구현**: `frontend/src/components/common/Avatar.js`, `Avatar.css`
- **스펙**: `docs/design-system/AVATAR_COMPONENT_DESIGN_SPEC.md`, `docs/design-system/v2/AVATAR_IMAGE_OR_INITIAL_SPEC.md`

---

## 3. 범위

### 포함

- ClientSelectionStep 모달 내 ClientSelector → ClientCard (variant: detailed, mobile-simple)
- 아바타: Avatar 컴포넌트와 `mg-client-card__avatar` 컨텍스트 스타일 정합
- 카드: `.mg-client-card.mg-client-card--detailed` B0KlA/펜슬 디자인 준수

### 제외

- 상담사 카드(ConsultantCard) — 별도 이슈
- ClientCard를 사용하는 다른 화면(예: 내담자 관리) — 본 이슈 해결 후 동일 패턴으로 검토 가능

---

## 4. 의존성·순서

1. **선행**: Pencil(B0KlA) 내담자 카드·아바타 스펙 확인
2. **아바타 클래스명 통일** → Avatar.js 수정 시 기존 emergency-design-fix.css 등 전역 오버라이드가 정상 적용됨
3. **카드 스타일** → 아바타 정상 적용 후 카드 비주얼(B0KlA) 조정

---

## 5. Phase 목록 및 분배실행 표

| Phase | 담당 | 목표 | 전달할 태스크 설명 |
|-------|------|------|--------------------|
| **1** | **explore** | Pencil·B0KlA에서 스케줄 모달 내담자 카드·아바타 스펙 확인 | "mindgarden-design-system.pen 또는 pencil-new.pen에서 스케줄/예약 모달 내 '내담자 선택' 단계의 내담자 카드(mg-client-card) 및 아바타 영역 디자인 스펙을 조사하라. 산출: 해당 노드/스크린의 클래스명·레이아웃·크기·색상·토큰 매핑 요약. 없으면 Admin B0KlA 또는 어드민 대시보드 샘플(https://mindgarden.dev.core-solution.co.kr/admin-dashboard-sample)의 유사 카드 스펙을 참조해 목록으로 정리." |
| **2** | **core-designer** | 내담자 카드·아바타 스펙 문서화 | "ClientSelectionStep 모달 내 `.mg-client-card.mg-client-card--detailed`와 아바타(`mg-client-card__avatar`, `--large`)에 대한 디자인 스펙을 작성하라. (1) 사용성: 관리자가 내담자를 선택할 때 최소 클릭·가독성 확보. (2) 정보 노출: 이름·상태·남은 세션·진행률 등. (3) 레이아웃: 카드 그리드·아바타 위치·텍스트·액션 배치. 참조: explore Phase 1 결과, docs/design-system/AVATAR_COMPONENT_DESIGN_SPEC.md, PENCIL_DESIGN_GUIDE.md, unified-design-tokens.css. 산출: docs/design-system/ 에 저장할 CLIENT_SELECTION_CARD_AVATAR_SPEC.md. 코드 작성 없음." |
| **3** | **core-coder** | Avatar 클래스명 스펙 통일 | "Avatar.js에서 `mg-v2-avatar__img` → `mg-v2-avatar-img`, `mg-v2-avatar__fallback` → `mg-v2-avatar-fallback`로 변경하라. Avatar.css도 동일하게 수정. docs/design-system/v2/AVATAR_IMAGE_OR_INITIAL_SPEC.md, emergency-design-fix.css의 셀렉터와 일치시키기 위함. 변경 후 ClientCard 아바타가 emergency-design-fix.css의 .mg-client-card__avatar 오버라이드를 받는지 확인." |
| **4** | **core-coder** | ClientCard·카드 스타일 B0KlA 적용 | "core-designer Phase 2 산출물(CLIENT_SELECTION_CARD_AVATAR_SPEC.md)을 참조하여 ClientCard(ClientSelector 경유)의 .mg-client-card.mg-client-card--detailed 스타일을 B0KlA/펜슬 토큰에 맞게 수정하라. 대상: unified-design-tokens.css 또는 ClientSelectionStep.css, ClientCard 관련 CSS. 아바타 크기·색·정렬도 스펙에 맞게 조정. 하드코딩 색상 금지, var(--mg-*), var(--ad-b0kla-*) 사용." |

---

## 6. 병렬/순차

- **Phase 1(explore)** → **Phase 2(core-designer)**: explore 결과를 designer 전달문에 포함. **순차**.
- **Phase 2(core-designer)** 완료 후 **Phase 3, 4(core-coder)** 실행.
- **Phase 3, 4**: Avatar 클래스명 수정(Phase 3)이 선행되면 Phase 4에서 아바타 스타일이 이미 정상 적용된 상태로 카드 스타일만 조정 가능. **Phase 3 먼저, 이어서 Phase 4** 권장.

---

## 7. 리스크·제약

- Avatar 클래스명 변경 시 `mg-v2-avatar__img`/`mg-v2-avatar__fallback`를 직접 참조하는 코드가 있으면 영향. grep으로 확인 후 수정 필요.
- `emergency-design-fix.css`는 글로벌 오버라이드이므로, Avatar 클래스명 통일 후 기존에 미적용되던 스타일이 갑자기 적용될 수 있음. 시각적 회귀 테스트 권장.

---

## 8. 단계별 완료 기준·체크리스트

| Phase | 완료 기준 | 체크리스트 |
|-------|-----------|------------|
| 1 | Pencil/B0KlA 내담자 카드·아바타 스펙 파악 | [ ] .pen 파일 또는 B0KlA 문서에서 해당 영역 확인 [ ] 클래스명·토큰·레이아웃 요약 산출 |
| 2 | 스펙 문서 작성 완료 | [ ] CLIENT_SELECTION_CARD_AVATAR_SPEC.md 저장 [ ] 사용성·정보 노출·레이아웃 명시 [ ] 코더가 구현 가능한 수준의 상세 |
| 3 | Avatar 클래스명 통일 | [ ] Avatar.js, Avatar.css 수정 [ ] mg-v2-avatar-img, mg-v2-avatar-fallback 적용 [ ] ClientCard 아바타에 emergency-design-fix 스타일 적용 확인 |
| 4 | 카드 스타일 B0KlA 적용 | [ ] .mg-client-card--detailed 토큰 기반 수정 [ ] 아바타 크기·색 B0KlA 준수 [ ] 하드코딩 제거 [ ] 모달 내 시각적 검증 |

---

## 9. 실행 요청문

다음 순서로 서브에이전트를 호출하세요.

1. **Phase 1 — explore**  
   - **subagent_type**: `explore`  
   - **전달 프롬프트**: "mindgarden-design-system.pen 또는 pencil-new.pen에서 스케줄/예약 모달의 '내담자 선택' 단계 내담자 카드(mg-client-card) 및 아바타 영역 디자인 스펙을 조사하라. 클래스명·레이아웃·크기·색상·토큰 요약을 산출. 없으면 Admin B0KlA/어드민 대시보드 샘플 유사 카드 스펙을 정리."  
   - **산출**: 스펙 요약(마크다운 또는 목록)

2. **Phase 2 — core-designer**  
   - **subagent_type**: `core-designer`  
   - **전달 프롬프트**: "Phase 1(explore) 결과를 참고하여 ClientSelectionStep 모달 내 .mg-client-card.mg-client-card--detailed 및 아바타(mg-client-card__avatar, --large)에 대한 디자인 스펙을 작성하라. 사용성·정보 노출·레이아웃을 명시. 참조: docs/design-system/AVATAR_COMPONENT_DESIGN_SPEC.md, PENCIL_DESIGN_GUIDE.md. 산출: docs/design-system/CLIENT_SELECTION_CARD_AVATAR_SPEC.md 저장. 코드 작성 없음."  
   - **의존성**: Phase 1 완료 후

3. **Phase 3 — core-coder**  
   - **subagent_type**: `core-coder`  
   - **전달 프롬프트**: "Avatar.js와 Avatar.css에서 mg-v2-avatar__img → mg-v2-avatar-img, mg-v2-avatar__fallback → mg-v2-avatar-fallback로 클래스명을 변경하라. docs/design-system/v2/AVATAR_IMAGE_OR_INITIAL_SPEC.md 및 emergency-design-fix.css와 일치시키기 위함. mg-v2-avatar__*를 참조하는 다른 파일이 있으면 함께 수정."  
   - **적용 스킬**: /core-solution-frontend, /core-solution-atomic-design

4. **Phase 4 — core-coder**  
   - **subagent_type**: `core-coder`  
   - **전달 프롬프트**: "docs/design-system/CLIENT_SELECTION_CARD_AVATAR_SPEC.md를 참고하여 ClientCard의 .mg-client-card.mg-client-card--detailed 및 .mg-client-card__avatar--large 스타일을 B0KlA/디자인 토큰에 맞게 수정하라. unified-design-tokens.css 또는 관련 CSS 파일 수정. 하드코딩 색상 금지, var(--mg-*), var(--ad-b0kla-*) 사용."  
   - **적용 스킬**: /core-solution-frontend, /core-solution-design-system-css  
   - **의존성**: Phase 2, 3 완료 후

---

## 10. 참조 문서

- `docs/design-system/AVATAR_COMPONENT_DESIGN_SPEC.md`
- `docs/design-system/v2/AVATAR_IMAGE_OR_INITIAL_SPEC.md`
- `docs/design-system/PENCIL_DESIGN_GUIDE.md`
- `docs/design-system/CONSULTANT_CLIENT_CARD_DESIGN_SPEC.md`
- `docs/standards/SUBAGENT_USAGE.md`
- `frontend/src/styles/unified-design-tokens.css`
- `frontend/src/styles/emergency-design-fix.css`
