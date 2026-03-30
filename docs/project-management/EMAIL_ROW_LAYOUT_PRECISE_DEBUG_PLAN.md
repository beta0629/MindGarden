# 이메일 행 깨짐 정밀 분석·수정 분배실행 계획

**목표**: 모달 내 이메일 행에서 입력란이 보이지 않고 "이메일 * 중복확인"만 보이는 현상의 **정밀 원인 분석**을 core-debugger에 위임하고, 필요 시 디자이너/퍼블리셔 보완 후 core-coder가 수정 적용. 기획은 결과를 취합해 사용자에게 정밀 원인 요약·수정 내용 요약을 보고한다.

**범위**
- **포함**: 내담자(ClientModal)·상담사(ConsultantComprehensiveManagement)·스태프(StaffManagement) 모달의 이메일 행 레이아웃·CSS·DOM.
- **참조 파일**: AdminDashboardB0KlA.css, ClientModal.css, ClientModal.js, StaffManagement.js, ConsultantComprehensiveManagement.js, unified-design-tokens.css, _unified-modals.css, 07-utilities/_utilities.css(.u-min-w-0), emergency-design-fix.css, 기타 .mg-v2-form-email-row·.__input-wrap·.mg-v2-form-input 관련 스타일.

**의존성·순서**
- Phase 1(core-debugger) → 결과 수신 후 Phase 2(필요 시 designer/publisher) → Phase 3(core-coder)는 Phase 1 결과(및 선택적 Phase 2) 반영 후 실행.

---

## Phase 목록 및 분배실행 표

| Phase | 담당 서브에이전트 | 목표 | 의존성 |
|-------|-------------------|------|--------|
| **Phase 1** | **core-debugger** | 이메일 행 깨짐의 정밀 원인 분석(발생 위치·DOM/계산 스타일·캐스케이드·재현 경로·영향 CSS) | 없음 |
| **Phase 2** | **core-designer** 또는 **core-publisher** | 디버거 결과에서 레이아웃/마크업 추가 원인이 있을 때만 보완 분석 | Phase 1 결과 |
| **Phase 3** | **core-coder** | 정밀 분석 결과를 반영한 실제 수정만 수행(기획이 정리한 수정 명세 전달) | Phase 1(및 선택적 Phase 2) |

---

## Phase 1: core-debugger 호출용 태스크 설명 (전달할 프롬프트)

아래 블록 전체를 **core-debugger** 서브에이전트 호출 시 **프롬프트**로 전달하세요.

```
역할: core-debugger. /core-solution-debug 스킬과 .cursor/agents/core-debugger.md를 적용하여, 아래 이메일 행 깨짐 현상에 대한 **정밀 원인 분석**만 수행해 주세요. 코드 수정은 하지 말고, 분석·재현 절차·수정 제안·(core-coder용 태스크 초안)만 산출합니다.

## 현상
- 모달 내 이메일 행에서 입력란이 제대로 보이지 않고 "이메일 * 중복확인"만 보인다(입력란 0 너비 또는 미노출).
- 이미 적용된 수정: AdminDashboardB0KlA.css의 .__input-wrap에 min-width: 12rem 유지·min-width: 0 제거; ClientModal.css에 min-width: 12rem 및 .mg-modal__body .mg-v2-modal-body 포함 선택자; ConsultantComprehensiveManagement/StaffManagement에 htmlFor·id·data-action 등 보강. 그럼에도 깨짐이 지속됨.

## 정밀 분석 요청 항목

1. **발생 위치**
   - 어떤 모달/페이지에서 발생하는지 구분: 내담자(ClientComprehensiveManagement → ClientModal), 상담사(ConsultantComprehensiveManagement), 스태프(StaffManagement) 중 어디서 재현되는지(또는 전부인지).
   - 각 페이지에서 ClientModal.css가 import되는지, AdminDashboardB0KlA.css가 로드되는지·번들 순서는 어떻게 되는지.

2. **DOM·계산된 스타일(Computed Style)**
   - 이메일 행이 렌더된 상태에서, 해당 행의 `.mg-v2-form-email-row` 및 그 자식 `.mg-v2-form-email-row__input-wrap`, 내부 `input.mg-v2-form-input`에 대해:
     - width, min-width, max-width, display, flex, flex-grow, flex-shrink, flex-basis, box-sizing의 **계산된 값**이 무엇인지(실제 브라우저 개발자 도구 기준으로 확인 가능한 형태로 기술).
   - __input-wrap의 계산된 min-width가 0인지 12rem(192px)인지, 그 이유가 어떤 규칙에서 오는지.

3. **캐스케이드·선택자 우선순위**
   - 전역: unified-design-tokens.css, _unified-modals.css(.mg-modal__body, .mg-v2-modal-body의 min-width: 0), 07-utilities/_utilities.css(.u-min-w-0), emergency-design-fix.css.
   - B0KlA: AdminDashboardB0KlA.css의 .mg-modal.mg-v2-ad-b0kla .mg-v2-form-email-row, .mg-v2-form-email-row__input-wrap, .mg-v2-form-email-row__input-wrap .mg-v2-form-input.
   - ClientModal 전용: ClientModal.css의 .mg-modal.mg-v2-ad-b0kla .mg-modal__body .mg-v2-modal-body .mg-v2-form-email-row__input-wrap (및 input/button).
   - 위 파일·선택자에 대해 **어떤 규칙이 최종 적용되는지**(특이도·로드 순서)·**어떤 규칙이 덮어쓰여 무시되는지**를 구체적으로 정리.

4. **유틸 클래스**
   - .u-min-w-0 등이 해당 이메일 행·__input-wrap·input 노드에 **클래스로 적용되는지** 여부(코드베이스 검색 및 실제 사용처).

5. **재현 경로·영향 CSS**
   - 재현 경로: 예) [어드민 LNB] → [내담자 종합관리] → [등록/수정 버튼] → [모달 열림] → 이메일 행 확인.
   - 영향 받는 CSS 파일·라인 번호를 구체적으로 나열.

## 산출물
- 정밀 원인 분석 요약(근본 원인 1~3개).
- 재현 절차(단계별).
- 수정 제안(파일·라인·변경 방향, 코드 작성 없음).
- core-coder에게 전달할 수 있는 **태스크 설명 초안**(수정 명세).
- (선택) 추가로 core-designer 또는 core-publisher가 레이아웃/마크업 관점에서 보완 분석이 필요한지 여부와 그 이유.
```

---

## Phase 2: core-designer 또는 core-publisher 호출용 태스크 설명 (조건부)

**호출 조건**: Phase 1(core-debugger) 결과에서 레이아웃·마크업 관점의 추가 원인 분석이 필요하다고 판단된 경우에만 호출한다.

아래 블록을 **core-designer** 또는 **core-publisher** 호출 시 **프롬프트**로 전달하세요.

```
역할: core-designer(또는 core-publisher). 코드 작성 없음.

[여기에 Phase 1 core-debugger의 분석 결과 요약을 붙여넣기]

위 디버거의 정밀 분석 결과를 바탕으로, 모달 내 이메일 행 깨짐에 대해 레이아웃·마크업 관점에서 **추가 원인**이 있는지 분석해 주세요.
- flex/그리드 계층·min-width 상속·부모 min-width:0 영향.
- 시맨틱/접근성·마크업 구조가 레이아웃에 미치는 영향.
- B0KlA·unified-design-tokens와의 일관성 관점에서 권장 스펙(최소 너비·gap·래퍼 역할).
산출: 분석 요약 + (필요 시) core-coder가 참고할 수 있는 레이아웃/마크업 스펙 보완안. 코드·CSS 직접 수정은 하지 않음.
```

---

## Phase 3: core-coder 호출용 태스크 설명 (전달할 프롬프트)

Phase 1(및 선택적 Phase 2) **결과를 기획이 수정 명세로 정리한 뒤**, 그 명세를 아래 "수정 명세" 자리에 넣어 **core-coder**를 호출한다.

```
역할: core-coder. /core-solution-frontend, /core-solution-atomic-design, /core-solution-standardization 적용.

## 작업
모달 내 이메일 행 깨짐 현상에 대한 **정밀 분석 결과**를 반영한 **실제 수정만** 수행해 주세요.

## 수정 명세 (기획이 Phase 1·2 결과로 채움)
[기획이 core-debugger(및 필요 시 designer/publisher) 결과를 요약한 수정 명세를 여기에 채워 넣음. 예: 적용할 CSS 파일·선택자·속성 변경, 제거할 규칙, 추가할 클래스/마크업, 대상 컴포넌트(ClientModal/ConsultantComprehensiveManagement/StaffManagement) 등]

## 제약
- 참조: docs/debug/CLIENT_MODAL_EMAIL_ROW_DEBUG_REPORT.md, docs/design-system/CLIENT_MODAL_EMAIL_ROW_LAYOUT_SPEC.md, AdminDashboardB0KlA.css, ClientModal.css, _unified-modals.css, unified-design-tokens.css.
- 수정 명세에 없는 변경은 하지 말 것.
```

---

## 리스크·제약

- 번들/캐시에 따라 로드 순서가 달라질 수 있음 → 디버거가 "어느 페이지에서 어떤 CSS가 먼저 로드되는지"를 명시하면 코더가 해당 페이지별로 선택자·import 순서를 조정할 수 있음.
- 내담자/상담사/스태프 모달이 서로 다른 컴포넌트이므로, 수정 시 세 곳 모두에서 동일하게 보이도록 공통 규칙(B0KlA)과 모달별 오버라이드(ClientModal.css 등) 정합성이 필요함.

---

## 단계별 완료 기준·체크리스트

| Phase | 완료 기준 | 체크리스트 |
|-------|-----------|------------|
| Phase 1 | 디버거가 정밀 원인·재현 경로·영향 CSS·수정 제안·core-coder용 태스크 초안을 산출 | 발생 위치(모달/페이지) 명시, 계산된 스타일·캐스케이드·.u-min-w-0 적용 여부, 재현 경로·파일·라인 나열 |
| Phase 2 | (조건부) 디자이너/퍼블이 레이아웃·마크업 보완 분석 완료 | 분석 요약 + 코더 참고용 스펙 보완안, 코드 수정 없음 |
| Phase 3 | 코더가 기획이 전달한 수정 명세만 반영해 수정 적용 | 명세 외 변경 없음, 내담자/상담사/스태프 모달에서 이메일 행 입력란 정상 노출 확인 가능 |

---

## 실행 요청문 (부모 에이전트용)

1. **Phase 1**: **core-debugger** 서브에이전트를 호출하고, 위 "Phase 1: core-debugger 호출용 태스크 설명"의 프롬프트(``` 로 둘러싼 블록 전체)를 전달하세요. 결과를 **기획에게 보고**받습니다.
2. **Phase 2**(조건부): Phase 1 결과에서 레이아웃/마크업 추가 분석이 필요하면 **core-designer** 또는 **core-publisher**를 호출하고, "Phase 2" 프롬프트에 Phase 1 요약을 붙여 전달하세요. 결과를 기획에게 보고받습니다.
3. **Phase 3**: 기획이 Phase 1(및 선택적 Phase 2) 결과를 취합해 **수정 명세**를 정리한 뒤, **core-coder**를 호출할 때 "Phase 3" 프롬프트의 "수정 명세" 자리에 해당 명세를 채워 넣고 전달하세요. 결과를 기획에게 보고받습니다.
4. **기획**: 위 서브에이전트들의 보고를 받은 후, **정밀 원인 요약**과 **수정 내용 요약**을 사용자에게 최종 보고할 수 있도록 정리합니다.

---

## 참조 문서

- `docs/debug/CLIENT_MODAL_EMAIL_ROW_DEBUG_REPORT.md`
- `docs/design-system/CLIENT_MODAL_EMAIL_ROW_LAYOUT_SPEC.md`
- `docs/standards/SUBAGENT_USAGE.md`
- `.cursor/skills/core-solution-debug/SKILL.md`
- `.cursor/skills/core-solution-planning/SKILL.md`
