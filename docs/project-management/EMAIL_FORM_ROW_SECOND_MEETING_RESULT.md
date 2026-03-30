# 이메일 폼 행 깨짐 — 2차 기획·디자이너·퍼블리셔·컴포넌트 관리자 회의 결과

**일자**: 2026-03-16  
**역할**: core-planner (취합·최종 보고)  
**참여**: core-debugger, core-designer, core-publisher, core-component-manager

---

## 1. 회의 목적

- **사용자 보고**: 이메일 폼이 **여전히 깨져 있음**. DOM 상 `div.mg-v2-form-email-row` **내부가 텍스트 "중복확인"만** 있고, input·button 요소가 없음 → 레이아웃이 아닌 **마크업/구조(JSX) 문제** 가능성 재검토.
- **1차 회의**: 대안2(CSS 단일화) 적용 완료했으나 개선되지 않음.
- **2차 목표**: (1) 원인 재규명, (2) 다른 대안 2~3개 도출, (3) 권장안 1개 선정 후 **core-coder**에게만 구현 위임.

---

## 2. 서브에이전트 산출 요약

| 담당 | 산출 문서 | 요약 |
|------|-----------|------|
| **core-debugger** | `docs/debug/EMAIL_FORM_ROW_JSX_DOM_ANALYSIS.md` | 이메일 행 렌더 위치 4곳(ClientModal, StaffManagement, Consultant, TabletRegister) 모두 JSX상 **__input-wrap·input 무조건 렌더**. "중복확인"만 넣는 코드 경로 없음. DOM에 노드가 없다면 **환경/런타임**(빌드·캐시·chunk·React 트리·확인 노드 혼동) 의심. 재현 시 Elements로 직계 자식 존재 여부 확인 권장. |
| **core-designer** | `docs/design-system/ADMIN_MODAL_EMAIL_ROW_TARGET_SPEC.md` | 현재(빈 박스+텍스트) vs 목표(입력란+명확한 버튼) 정리. 이메일 행 목표 비주얼·레이아웃(한 줄, __input-wrap min-width 12rem, 버튼 테두리·패딩·호버·compact, 토큰·클래스 명시). |
| **core-publisher** | `docs/debug/EMAIL_ROW_REQUIRED_MARKUP_AND_OMISSION.md` | `.mg-v2-form-email-row` 필수 자식: __input-wrap > input, 형제 button. 노드 생성 담당 파일·라인 정리. **TabletRegister만 __input-wrap 미사용**(인라인 스타일 래퍼) → 스펙 이탈·누락 위험 구간. 코드상 __input-wrap/input 제거 분기 없음. |
| **core-component-manager** | `docs/project-management/EMAIL_ROW_COMPONENT_EXTRACTION_PROPOSAL.md`, `EMAIL_ROW_USAGE_CONSISTENCY_REVIEW.md` 보완 | 사용처 5곳(ClientModal, StaffManagement, Consultant, TabletRegister, 테스트). **공통 Molecules(EmailRowWithDuplicateCheck) 추출 가능**·수정 위치 제안. TabletRegister는 __input-wrap 미사용. |

---

## 3. 원인 재규명 요약

### 3.1 코드/JSX 관점

- **ClientModal.js, StaffManagement.js, ConsultantComprehensiveManagement.js**: `mg-v2-form-email-row` 안에 **항상** `mg-v2-form-email-row__input-wrap` > input, create 시(또는 항상) button. 조건부로 __input-wrap·input을 빼는 분기 **없음**.
- **TabletRegister.js**: 동일 row 클래스 사용하나 **`__input-wrap` 미사용**(인라인 스타일 div). input·버튼은 있으나 스펙 이탈.
- **결론**: 현재 코드만 보면 **"row 안에 input/button 없이 중복확인만"** 이 나오는 **JSX 경로는 없음**.

### 3.2 DOM에 input/button이 없다면

- **가능성**: (1) 빌드/캐시(옛 번들), (2) 코드 스플리팅(chunk 불일치), (3) React 트리 손상(에러 바운더리 등), (4) 확인한 노드가 다른 모달/인스턴스, (5) **실제로는 노드는 있는데 0 너비로 안 보여** "없다"고 인지한 경우.
- **필수 확인**: DevTools **Elements** 탭에서 해당 `div.mg-v2-form-email-row`의 **직계 자식**에 `.__input-wrap`, `input`, `button` 존재 여부 확인. 있으면 CSS/0너비 이슈, 없으면 환경/빌드/캐시 점검.

### 3.3 스펙 이탈·위험 구간

- **TabletRegister**: `mg-v2-form-email-row__input-wrap` 미사용 → 동일 블록만 복사해 쓸 때 실수로 input/래퍼를 빼고 텍스트만 넣을 수 있는 구간. **모든 사용처에서 필수 자식 구조 정렬 권장.**

---

## 4. 다른 대안 (2~3개)

### 대안 1 — DOM 검증 + 버튼 비주얼·CSS 강화 (즉시)

- **내용**: (1) 재현 환경에서 **Elements로 row 직계 자식** 확인. (2) 노드가 **있으면** → CSS/0너비 대응 유지 + **버튼이 버튼처럼 보이도록** `ADMIN_MODAL_EMAIL_ROW_TARGET_SPEC.md`, `CLIENT_MODAL_EMAIL_BUTTON_SPEC.md` 적용(테두리·패딩·호버·compact). (3) 노드가 **없으면** → 빌드 재실행·캐시 비우기·콘솔 에러 확인 후, 회귀 방지용 테스트(row 내 __input-wrap·input 존재) 추가.
- **수정 위치**: AdminDashboardB0KlA.css, ClientModal.css(버튼 스타일), 필요 시 _unified-modals.css. 테스트: ClientModal.emailForm.test.js 확장 또는 Staff/Consultant 모달 테스트 추가.
- **장점**: 변경 범위 작음, 원인(CSS vs DOM 누락)에 따라 대응 가능.  
- **단점**: DOM이 정말 없을 때는 “왜 없게 되었는지” 추가 추적 필요.

### 대안 2 — 마크업 일관성 + 회귀 테스트

- **내용**: (1) **TabletRegister**에 `mg-v2-form-email-row__input-wrap` 도입, 인라인 `minWidth: 0` 제거·스펙 정렬. (2) 모든 사용처(ClientModal, StaffManagement, Consultant, TabletRegister)에서 **필수 자식 구조** 준수 검증. (3) **회귀 테스트**: row 내부에 `.__input-wrap`·`input`이 반드시 있다는 assertion 추가(기존 ClientModal 테스트 확장, Staff/Consultant 동일 추가).
- **수정 위치**: TabletRegister.js, ClientModal.emailForm.test.js, StaffManagement·Consultant 관련 테스트. 참조: `docs/debug/EMAIL_ROW_REQUIRED_MARKUP_AND_OMISSION.md`.
- **장점**: 스펙 이탈 제거, 재발 방지.  
- **단점**: TabletRegister·테스트 작업량 있음.

### 대안 3 — 공통 Molecules + CSS 단일화

- **내용**: (1) **EmailRowWithDuplicateCheck**(또는 동일 성격) 공통 Molecules 컴포넌트 추출. (2) ClientModal, StaffManagement, ConsultantComprehensiveManagement, TabletRegister에서 해당 컴포넌트로 교체. (3) 이메일 행 CSS를 **한 곳**(B0KlA 또는 공통 스타일)으로 단일화. (4) 목표 비주얼은 `ADMIN_MODAL_EMAIL_ROW_TARGET_SPEC.md` 반영.
- **수정 위치**: `frontend/src/components/common/` 또는 `common/molecules/` 신규, 위 4개 화면 import·교체, CSS 정리. 참조: `docs/project-management/EMAIL_ROW_COMPONENT_EXTRACTION_PROPOSAL.md`.
- **장점**: 구조·스타일 일관성, 유지보수·캡슐화 강화.  
- **단점**: 작업량·테스트 범위 가장 큼.

---

## 5. 권장안

**권장: 1단계(대안 1) → 2단계(대안 2) → (선택) 3단계(대안 3)**

1. **1단계(즉시)**  
   - **DOM 검증**: 재현 시 Elements에서 `div.mg-v2-form-email-row` 직계 자식에 `.__input-wrap`, `input`, `button` 존재 여부 확인.  
   - **버튼 비주얼**: "중복확인"이 **버튼처럼 보이도록** `docs/design-system/ADMIN_MODAL_EMAIL_ROW_TARGET_SPEC.md`, `CLIENT_MODAL_EMAIL_BUTTON_SPEC.md` 적용(테두리·패딩·min-height·호버, compact·토큰).  
   - **CSS**: 기존 대안2(B0KlA 단일화·min-width 12rem) 유지. 필요 시 ClientModal.css에서 버튼만 선택자 강화.  
   - 노드가 **실제로 없을 때**: 빌드·캐시·콘솔 점검 후, **회귀 테스트**로 row 내 __input-wrap·input 존재 assertion 추가(대안 2의 테스트 부분 선행 적용 가능).

2. **2단계(단기)**  
   - **TabletRegister**에 `mg-v2-form-email-row__input-wrap` 도입, 인라인 스타일 제거·스펙 정렬.  
   - **회귀 테스트**: ClientModal·StaffManagement·Consultant(및 필요 시 TabletRegister)에서 이메일 row 내부 __input-wrap·input 필수 존재 검증.

3. **3단계(선택)**  
   - 공통 Molecules 추출은 리팩터링 여유 있을 때 `EMAIL_ROW_COMPONENT_EXTRACTION_PROPOSAL.md` 기준으로 진행.

---

## 6. core-coder 위임 요약

- **담당**: core-coder  
- **참조 문서**  
  - `docs/debug/EMAIL_FORM_ROW_JSX_DOM_ANALYSIS.md` (재현·확인 포인트)  
  - `docs/design-system/ADMIN_MODAL_EMAIL_ROW_TARGET_SPEC.md` (목표 비주얼·레이아웃)  
  - `docs/design-system/CLIENT_MODAL_EMAIL_BUTTON_SPEC.md` (중복확인 버튼)  
  - `docs/debug/EMAIL_ROW_REQUIRED_MARKUP_AND_OMISSION.md` (필수 자식 구조)  
  - `docs/project-management/EMAIL_ROW_COMPONENT_EXTRACTION_PROPOSAL.md` (공통 컴포넌트 시 수정 위치)

- **1단계 요청 사항**  
  1. **버튼 비주얼**: `.mg-modal.mg-v2-ad-b0kla .mg-v2-form-email-row` 내 중복확인 버튼이 **버튼처럼 보이도록** ADMIN_MODAL_EMAIL_ROW_TARGET_SPEC·CLIENT_MODAL_EMAIL_BUTTON_SPEC 반영(테두리 2px, 패딩, min-height, border-radius, 호버·포커스, 토큰 사용). 대상: AdminDashboardB0KlA.css, ClientModal.css.  
  2. **CSS 유지**: `.mg-v2-form-email-row__input-wrap`에 `min-width: 12rem`(또는 토큰) 유지, B0KlA 단일화 규칙 유지.  
  3. **검증**: 내담자/스태프/상담사 모달에서 이메일 행이 한 줄로 보이고, **중복확인 버튼이 명확한 버튼 형태**로 보이는지 확인.  
  4. **재현 시**: 사용자 환경에서 Elements로 `mg-v2-form-email-row` 직계 자식(.__input-wrap, input, button) 존재 여부 확인. 없으면 빌드·캐시·콘솔 점검 후, 회귀 테스트(row 내 __input-wrap·input 존재) 추가 검토.

- **2단계(별도 태스크 가능)**  
  - TabletRegister에 `mg-v2-form-email-row__input-wrap` 도입 및 인라인 스타일 제거.  
  - ClientModal·StaffManagement·Consultant(및 필요 시 TabletRegister)에 이메일 row 내부 __input-wrap·input 필수 존재 테스트 추가.

- **3단계(선택)**  
  - 공통 Molecules 추출 시 `EMAIL_ROW_COMPONENT_EXTRACTION_PROPOSAL.md` §3 수정 위치 요약 참고.

---

**문서 끝.**
