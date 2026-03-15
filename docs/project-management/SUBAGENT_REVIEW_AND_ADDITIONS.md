# 서브에이전트 검토 결과 — 누락·보완 사항

**검토일**: 2026-02-12  
**목적**: 서브에이전트 정의·스킬·문서 간 일관성 확인, 누락·보완 사항 반영

---

## 1. 검토 범위

- `.cursor/agents/*.md` (core-planner, core-designer, core-publisher, core-coder, core-debugger, core-tester, core-component-manager)
- `.cursor/skills/core-solution-rules/SKILL.md` (서브에이전트 매핑·스킬 목록)
- `docs/standards/SUBAGENT_USAGE.md`
- 캡슐화·모듈화 스킬 및 컴포넌트 관리 에이전트 협업 흐름

---

## 2. 발견된 누락·보완 사항

### 2.1 core-solution-rules/SKILL.md

| 구분 | 내용 | 조치 |
|------|------|------|
| **서브에이전트 매핑 테이블** | **core-debugger** 단독 행 없음. (에러·500 원인 분석·수정 제안은 shell→debugger→coder 조합만 있음) | **에러·500 원인 분석·수정 제안** → core-debugger 행 추가 |
| **서브에이전트 매핑 테이블** | **core-component-manager** 행 없음 | **화면·서버 컴포넌트 중복·적재적소 배치 제안**(코더와 한 팀) → core-component-manager 행 추가 |
| **core-planner 설명** | 분배실행 시 나열에 core-component-manager 없음 | "컴포넌트 정리 Phase 시 core-component-manager 포함" 문구 추가 |
| **사용할 스킬 테이블** | `/core-solution-encapsulation-modularization` 없음 | 캡슐화·모듈화 스킬 행 추가 |
| **사용할 스킬 테이블** | `/core-solution-debug` 없음 (core-debugger 전용) | 디버깅·원인 분석 시 적용 스킬 행 추가 |

### 2.2 core-planner.md

| 구분 | 내용 | 조치 |
|------|------|------|
| **실행 위임 규칙** | core-component-manager 호출 규칙 없음 | 컴포넌트 정리·중복·적재적소 배치 Phase 시 **core-component-manager** 호출(목록·중복·배치 분석 의뢰), Phase에 **component-manager + core-coder** 함께 배정 권장 문구 추가 |

### 2.3 SUBAGENT_USAGE.md

| 구분 | 내용 | 조치 |
|------|------|------|
| **서브에이전트 검토 요약 표** | **core-planner** 행 없음 (기획·분배실행 담당) | 전반 기획·Phase 설계·분배실행 시 **core-planner** 사용한다는 행 추가 시 일관성 확보 (선택) |

### 2.4 core-component-manager.md

| 구분 | 내용 | 조치 |
|------|------|------|
| **generalPurpose 대체 호출 프롬프트** | "목록·중복·제안·문서"만 명시, "적재적소 배치 제안" 누락 | fallback 프롬프트에 **적재적소 배치 제안** 포함하도록 수정 |

### 2.5 기타 (이미 반영된 항목)

- 각 코어 에이전트에 캡슐화·모듈화 스킬 참조 반영됨.
- core-component-manager ↔ core-coder 한 팀·적재적소 배치 제안 반영됨.
- SUBAGENT_USAGE 작업 유형별 매핑에 core-component-manager·캡슐화 원칙 반영됨.

---

## 3. 적용한 보완 (완료)

- **core-solution-rules/SKILL.md**: (1) **에러·500 원인 분석·수정 제안** → core-debugger 행 추가, (2) **화면·서버 컴포넌트 중복·적재적소 배치 제안** → core-component-manager 행 추가, (3) core-planner 설명에 "컴포넌트관리(core-component-manager)" 및 "컴포넌트 정리 Phase 시 component-manager + core-coder 함께 배정 권장" 반영, (4) 사용할 스킬 테이블에 `/core-solution-encapsulation-modularization`, `/core-solution-debug` 추가.
- **core-planner.md**: 실행 위임 규칙에 **core-component-manager** 호출 규칙 추가(컴포넌트 정리·중복·적재적소 배치 Phase, Phase에 component-manager + core-coder 함께 배정 권장).
- **core-component-manager.md**: generalPurpose 대체 호출 프롬프트에 **적재적소 배치 제안** 문구 추가.
- **SUBAGENT_USAGE.md**: 서브에이전트 검토 요약 표에 **core-planner** 행 추가(전반 기획·Phase 설계·분배실행).

---

## 4. 참조

- 서브에이전트 활용: `docs/standards/SUBAGENT_USAGE.md`
- 코어 에이전트 회의: `docs/project-management/CORE_AGENTS_ENCAPSULATION_COMPONENT_MEETING.md`
- 룰 인덱스: `.cursor/skills/core-solution-rules/SKILL.md`
