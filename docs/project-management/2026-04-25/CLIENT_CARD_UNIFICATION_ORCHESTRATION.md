# 내담자 카드 UI 통일 — B0KlA 관리자 스케줄 · 내담자 선택 모달

**작성일**: 2026-04-25  
**주관**: core-planner  
**범위**: 관리자 스케줄 B0KlA 플로우 내 **내담자 선택 모달**(`client-selection-step` / `client-selector`)에서 보이는 **내담자 카드**의 정보 밀도·상태 배지·타이포·간격의 **시각·정보 구조 통일**  
**금지**: 본 배치에서 일반 대화형 어시스턴트의 **소스 직접 수정** — 구현은 **core-coder**만.

---

## 0. 필수 참조 요약 (준수)

### 0.1 `CORE_PLANNER_DELEGATION_ORDER.md`

- **직접 수정 금지**: 일반 대화형 어시스턴트는 소스 코드를 직접 수정하지 않는다. 구현은 **core-planner → core-coder**(또는 명시된 서브에이전트)에만 위임한다.
- **검증 게이트**: 코드 변경이 수반된 배치는 반드시 **core-tester**로 검증(스모크·회귀·콘솔 오류 0건 등). 테스터 통과 전 작업 완료로 보지 않는다.
- 착수 전: 필요 시 **explore**로 인벤토리 갱신, **core-component-manager**와 공통 컴포넌트·중복 배치 합의(회의/요약 문서화 권장).
- 구현: **core-coder**에만 패치 — 파일 경로·완료 조건·회귀 체크리스트를 명시.
- 사용자 보고: 스캔 요약 / PR 범위 / 잔여 리스크 / 다음 배치를 한 장으로 취합.

### 0.2 `COMMON_DISPLAY_BOUNDARY_MEETING_20260322.md`

- **표시 경계(분층)**: ① 데이터 경계(mapper에서 스칼라·DTO), ② **렌더 경계** — JSX 직전은 스칼라·안전 자식; SSOT는 **`frontend/src/utils/safeDisplay.js`**.
- **코더 규칙 요지**: API 원본 필드를 JSX에 직접 넣지 않음; 텍스트 **`toDisplayString`**, 수치 **`toSafeNumber`**, 에러 **`toErrorMessage` / `SafeErrorDisplay`**; 임의 `String(x)`·로컬 `safeXxx` 신규 남발 금지.
- 카드 내 **동적 필드**(최근 상담 문구, 진행률, 회차, 담당자명 등)는 통일 작업 시 **표시 경계** 적용 여부를 **explore + component-manager + 코더**가 점검한다.

---

## 1. 목표 (1~2문장)

B0KlA 관리자 스케줄의 내담자 선택 모달에서 **내담자 카드**가 다른 화면의 클라이언트 카드·동일 플로우 내 인접 UI와 **어색하지 않게** 정보 계층·배지·버튼·여백을 **단일 패턴**으로 맞춘다. **접근성·멀티라인 안전 표시**(React 자식 안전)를 훼손하지 않는다.

---

## 2. 현재 스크린·앵커

| 항목 | 내용 |
|------|------|
| 오버레이 | `div.mg-modal-overlay.mg-modal-overlay--visible.mg-v2-ad-b0kla` → `mg-modal--large` |
| 본문 | `… > div.client-selection-step.mg-v2-ad-client-step > div.client-selector` |
| 스크린샷(참고) | `/Users/mind/.cursor/projects/Users-mind-mindGarden/assets/design-element-0d423701-8653-457a-8893-3a008985e781.png` |
| 코드 앵커 | `frontend/src/components/schedule/steps/ClientSelectionStep.js`, `frontend/src/components/schedule/ClientSelector.js` — `ClientCard` from `frontend/src/components/ui/Card/ClientCard.js` |
| 스타일 | `frontend/src/components/schedule/steps/ClientSelectionStep.css`, `frontend/src/components/schedule/ScheduleB0KlA.css` (`.client-selector` 등) |

카드에 노출되는 정보 예(사용자 관찰): 상태(진행중/대기중), 이니셜 원형, 이름, 최근 상담, 총 N회, 진행률 %, 담당 상담사, 선택하기.

---

## 3. 가설 (검증 대상)

| ID | 가설 |
|----|------|
| **H1** | `ClientCard`가 B0KlA 모달에서만 **다른 variant/props/CSS 래퍼**로 쓰여 다른 목록과 밀도·배지가 어긋난다. |
| **H2** | `ClientCard`는 공통이나, **스케줄 전용 CSS**가 카드 내부/그리드를 덮어 **배지·정렬이 불균형**하다. |
| **H3** | 동일 도메인이지만 **대시보드·매핑·클라이언트 관리** 등에 **별도 카드 컴포넌트**가 있어 시각 언어가 분기된다 — SSOT 후보는 `ClientCard` 또는 **토큰·Molecule** 수준. |
| **H4** | 일부 필드가 **객체/미정형 API** 그대로 가까이 오면, 통일 과정에서 **표시 경계**(`safeDisplay`) 미적용 구간이 드러난다. |
| **H5** | **상태 배지** 색·라벨·위치가 디자인 토큰/다른 화면의 `Badge` 패턴과 불일치한다. |

explore는 위 가설을 **증거(파일·클래스·props 테이블)** 로 정리한다.

---

## 4. 의존성·순서

1. **인벤토리(explore)** 없이 component-manager만 호출하면 근거 부족으로 합의 품질이 떨어짐.  
2. **component-manager** 제안 후 **core-designer**가 화면설계서에 반영 가능한 **카드 IA·토큰·상태 표**를 고정.  
3. **core-coder**는 설계서 + component-manager 합의(또는 명시적 예외)에 따라만 구현.  
4. **core-tester**는 변경 병합 후 게이트.

**병렬 불가 구간**: A → B → C(설계) → D(구현) → E(검증). (A 완료 전 B 시작은 비권장.)

---

## 5. Phase A~E · 목표 · 산출물

| Phase | 서브에이전트 | 목표 | 산출물 |
|-------|----------------|------|--------|
| **A** | **explore** | `ClientCard` 정의·사용처, B0KlA 모달 경로 전용 스타일, 유사 카드 컴포넌트 인벤토리 | 마크다운 또는 표: 파일 경로, props, CSS 선택자, 중복 후보 |
| **B** | **core-component-manager** | 단일 소스·배치 제안, `ClientCard` 확장 vs 래퍼 vs 분리 카드 정리 | 1페이지 요약: 권장 SSOT, 비권장 패턴, 코더 전달 체크리스트 |
| **C** | **core-designer** | 카드 통일 **비주얼·레이아웃·토큰·상태 배지·접근성** 명세 | `docs/design-system/SCREEN_SPEC_CLIENT_CARD_UNIFICATION_v1.md` (초안) |
| **D** | **core-coder** | 설계서 + A/B 반영하여 프론트 구현, `safeDisplay` 등 표시 경계 준수 | PR 단위 변경, 관련 CSS/컴포넌트 |
| **E** | **core-tester** | 회귀·스모크·콘솔 0건·역할별 B0KlA 모달 | 테스트 결과 요약, 미통과 시 이슈 목록 |

**조건부**: H4가 성립하면 **core-debugger**를 소규모 Phase에 끼워 **#130 재현 여부·스택**만 확인(코드 수정 없이 보고). 기본 경로에서는 필수 아님.

---

## 6. 분배실행 표 (호출 시 전달할 태스크 초안)

### Phase A — explore

```
목적: 내담자 카드 통일을 위한 코드 인벤토리.

수행:
1) ClientCard: frontend/src/components/ui/Card/ClientCard.js — props, 내부 구조, export.
2) B0KlA 내담자 선택: ClientSelectionStep.js, ClientSelector.js에서 ClientCard 사용 방식·className·래퍼.
3) ClientSelectionStep.css, ScheduleB0KlA.css에서 .client-selector 및 카드에 닿는 규칙 grep.
4) repo 전역에서 ClientCard·유사 이름(ClientRow, ClientListCard 등) 패턴 검색해 표로 정리(경로, 용도, 디자인 차이 요약).

산출: 위 H1~H5에 대해 각각 근거 한 줄씩. core-component-manager가 쓸 표 형식 권장.
```

### Phase B — core-component-manager

```
입력: Phase A 인벤토리 표 + 스크린샷 경로(사용자 제공 asset).

수행:
- SSOT 후보( ClientCard 중심 vs 분리 )와 비권장 중복 명시.
- B0KlA 모달만의 예외(있다면)와 그 이유.
- core-coder에게 넘길 "하지 말 것 / 반드시 할 것" 5줄 이내.

산출: 1페이지 제안서(코드 직수정 없음).
```

### Phase C — core-designer

```
입력: 스크린샷, Phase A 요약, core-component-manager SSOT 제안, core-solution-planning §0(사용성·정보 노출·레이아웃).

수행:
- docs/design-system/SCREEN_SPEC_CLIENT_CARD_UNIFICATION_v1.md 초안 작성.
- 포함: 역할(관리자), 정보 노출 순서, 상태 배지 색·토큰, 이니셜·이름·부가 메타, CTA "선택하기", 포커스 링, 반응형(모달 large).
- 접근성: 대비, 키보드 순서, 스크린리더 라벨 권고.

코드 작성 금지.
```

### Phase D — core-coder

```
입력: SCREEN_SPEC_CLIENT_CARD_UNIFICATION_v1.md 확정본, component-manager 체크리스트, explore 파일 목록.

수행:
- ClientSelectionStep / ClientSelector / ClientCard / 관련 CSS만 필요 최소 범위로 수정.
- COMMON_DISPLAY_BOUNDARY: 동적 필드는 toDisplayString / toSafeNumber 등 SSOT 준수.
- UnifiedModal·B0KlA 토큰 클래스와 충돌 없게.

금지: 무관한 리팩터, 다른 화면 대량 치환(별 배치로 분리).
```

### Phase E — core-tester

```
수행:
- 관리자 B0KlA 플로우: 내담자 선택 모달 오픈 → 카드 목록 스크롤 → 선택 → 콘솔 오류 0.
- 회귀: 다른 경로에서 ClientCard 사용 화면 스모크(인벤토리 기준 최소 1~2화면).
- React #130 / 객체 자식 이슈 회귀 체크.

산출: 통과/실패 표, 실패 시 재현 경로.
```

---

## 7. 완료 조건 (게이트)

- [ ] Phase A 인벤토리가 **파일 단위**로 H1~H5에 답한다.  
- [ ] Phase B **1페이지 제안**이 있고, Phase D 코더가 그에 **정면 위배 없이** 구현했다(예외는 문서화).  
- [ ] `SCREEN_SPEC_CLIENT_CARD_UNIFICATION_v1.md`가 저장소에 있고 디자이너·코더 간 **스펙 드리프트 없음**.  
- [ ] Phase E **core-tester 통과**(콘솔 0건·스모크·회귀 최소 범위).  
- [ ] 사용자용 한 장 요약: 변경 범위, 잔여 리스크, 다음 배치(있다면).

---

## 8. 회귀 체크리스트 (테스터·수동 공통)

- [ ] B0KlA 모달: 카드 **상태 배지** 가독성·일관성  
- [ ] 이름·이니셜·메타 텍스트 **ellipsis/줄바꿈** 깨짐 없음  
- [ ] 진행률·회차 등 **숫자** 표기 일관(로케일 정책은 기존 제품과 동일)  
- [ ] "선택하기" 포커스·호버·disabled 일관  
- [ ] 모달 `mg-modal--large` 내 **스크롤·키보드** 탭 순서  
- [ ] **다른 ClientCard 소비 화면** 최소 1곳: 레이아웃 붕괴 없음  
- [ ] 브라우저 콘솔: **에러 0**, **React #130 없음**  
- [ ] (해당 시) `safeDisplay` 미적용 필드 없음 — 코더·테스터 교차 확인  

---

## 9. 실행 요청문 (부모 에이전트용)

다음 **순차**로 서브에이전트를 호출하고, 각 결과를 **core-planner(기획)** 에게 반환한 뒤 사용자에게 한 장으로 보고하세요.

1. **explore** — §6 Phase A 프롬프트 전문  
2. **core-component-manager** — §6 Phase B (A 산출 첨부)  
3. **core-designer** — §6 Phase C (A 요약 + B 제안 + 스크린샷 경로)  
4. **core-coder** — §6 Phase D (확정 스펙 + 체크리스트)  
5. **core-tester** — §6 Phase E (코드 머지 후)

**적용 스킬**: `/core-solution-planning`, `/core-solution-encapsulation-modularization`, `/core-solution-common-modules`, `/core-solution-atomic-design`, `/core-solution-frontend`, `/core-solution-testing` (역할별).

---

*본 문서는 오케스트레이션 전용이며 소스 수정을 포함하지 않는다.*
