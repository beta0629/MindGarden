# 서브에이전트·스킬 전체 점검 (2026-03)

**점검일**: 2026-03-17  
**목적**: 스킬(SKILL.md)·에이전트 정의(.cursor/agents/core-*.md) 전수 점검, 공통 모듈 참조·문서 경로·역할 경계 보강

---

## 점검 범위

1. **스킬** (`.cursor/skills/` 하위 23개 SKILL.md) — 설명·참조 문서·다른 스킬과의 관계, **공통 모듈 스킬** 크로스레퍼런스
2. **에이전트** (`.cursor/agents/core-*.md` 7개) — "반드시 참조할 스킬"에 common-modules·COMMON_MODULES_USAGE_GUIDE 반영, 공통 모듈 우선 원칙
3. **core-solution-rules** — 사용할 스킬 테이블·서브에이전트 매핑, 표준 문서 목록
4. **docs/standards/** — SUBAGENT_USAGE.md와 스킬·에이전트 정의 정합성

---

## 보강 원칙

- **공통 모듈 사용**: 새 기능·UI 구현 시 공통 모듈 우선 — **core-designer, core-publisher, core-coder, core-component-manager** 모두에서 참조되도록 스킬·에이전트 문구 보강
- **문서 경로**: docs/standards/, docs/design-system/ 등 실제 존재하는 경로만 참조
- **역할 경계**: 디자이너는 코드 작성 안 함, 퍼블리셔는 HTML만, 코더는 구현만 — 에이전트 정의와 일치 확인

---

## 변경 사항 요약

### 1. 스킬 파일 보강

| 스킬 | 변경 내용 |
|------|-----------|
| **core-solution-common-modules** | "참조하는 에이전트" 섹션 추가(designer, publisher, coder, component-manager). Reference에 encapsulation-modularization 크로스레퍼런스 추가 |
| **core-solution-design-handoff** | 산출물 필수 항목에 "공통 모듈 검토" 행 추가. Reference에 /core-solution-common-modules 함께 사용 명시 |
| **core-solution-frontend** | Reference에 "공통 모듈 우선" 항목 추가(COMMON_MODULES_USAGE_GUIDE, /core-solution-common-modules) |
| **core-solution-atomic-design** | 참조 문서에 /core-solution-common-modules 추가 |
| **core-solution-encapsulation-modularization** | 참조에 /core-solution-common-modules 추가 |
| **core-solution-publisher** | 6. 참조 문서에 공통 모듈·COMMON_MODULES_USAGE_GUIDE 추가 |
| **core-solution-unified-modal** | Reference에 공통 모듈 스킬·COMMON_MODULES_USAGE_GUIDE·MODAL_STANDARD 추가 |

### 2. 에이전트 정의 보강

| 에이전트 | 변경 내용 |
|----------|-----------|
| **core-planner** | "반드시 참조할 스킬·문서"에 공통 모듈(/core-solution-common-modules, COMMON_MODULES_USAGE_GUIDE) 추가. UI·공통 컴포넌트 Phase 시 참조·분배 시 원칙 전달 명시 |
| **core-designer** | "디자인·개발 일관성"에 "공통 모듈 우선" 문단 추가(새 컴포넌트 설계 시 기존 공통 모듈 검토) |
| **core-publisher** | "필수 참조"에 공통 모듈 스킬·COMMON_MODULES_USAGE_GUIDE 추가 |
| **core-coder** | "반드시 참조할 표준 문서" 최상단에 COMMON_MODULES_USAGE_GUIDE 추가. "공통 모듈 우선" 스킬 참조 문단 추가 |
| **core-component-manager** | "반드시 참조할 스킬·문서"에 공통 모듈·COMMON_MODULES_USAGE_GUIDE 최상단 추가 |
| **core-debugger**, **core-tester** | 변경 없음(역할상 공통 모듈 참조는 선택 사항) |

### 3. core-solution-rules

- "서브에이전트 활용 매핑" 앞에 **"공통 모듈 우선"** 문단 추가: UI·컴포넌트·마크업·구현 시 designer, publisher, coder, component-manager가 common-modules·COMMON_MODULES_USAGE_GUIDE 참조

### 4. SUBAGENT_USAGE.md

- **원칙** 섹션에 "공통 모듈 우선" 항목 추가
- 서브에이전트 검토 표에서 core-designer, core-publisher, core-coder, core-component-manager의 "적용 스킬"에 `/core-solution-common-modules` 추가 및 비고 보강

---

## 변경한 파일 경로 목록

- `.cursor/skills/core-solution-common-modules/SKILL.md`
- `.cursor/skills/core-solution-design-handoff/SKILL.md`
- `.cursor/skills/core-solution-frontend/SKILL.md`
- `.cursor/skills/core-solution-atomic-design/SKILL.md`
- `.cursor/skills/core-solution-encapsulation-modularization/SKILL.md`
- `.cursor/skills/core-solution-publisher/SKILL.md`
- `.cursor/skills/core-solution-unified-modal/SKILL.md`
- `.cursor/skills/core-solution-rules/SKILL.md`
- `.cursor/agents/core-planner.md`
- `.cursor/agents/core-designer.md`
- `.cursor/agents/core-publisher.md`
- `.cursor/agents/core-coder.md`
- `.cursor/agents/core-component-manager.md`
- `docs/standards/SUBAGENT_USAGE.md`
- `docs/standards/SKILL_REVIEW_ADDITIONS.md` (다음 단계에서 섹션 추가)
- `docs/standards/SUBAGENT_SKILL_AUDIT_202603.md` (본 문서 신규)

---

## 정합성 확인

- **표준 문서 목록**: core-solution-rules의 "표준 문서 위치(docs/standards/)"에 COMMON_MODULES_USAGE_GUIDE.md 이미 포함됨. 추가 수정 없음.
- **문서 경로**: COMMON_MODULES_USAGE_GUIDE.md, SUBAGENT_USAGE.md, docs/layout/ADMIN_COMMON_LAYOUT.md, docs/project-management/COMPONENT_COMMONIZATION_CANDIDATES.md 존재 확인됨.
- **역할 경계**: 에이전트별 "할 일 / 하지 말 것"은 기존 정의와 일치하며, 코드·디자인·문서 작성 역할이 명확히 구분됨.

이 문서는 점검 결과 기록용이며, 상세 내용은 `docs/standards/SKILL_REVIEW_ADDITIONS.md`의 "전체 점검 (2026-03)" 섹션과 연계합니다.
