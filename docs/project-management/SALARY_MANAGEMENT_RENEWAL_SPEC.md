# 급여 관리·급여 프로필 리뉴얼 스펙

**작성일**: 2025-03-16  
**담당**: core-planner (오케스트레이션)  
**목적**: 급여 관리(Salary Management)와 급여 프로필(Salary Profile)을 B0KlA·아토믹 디자인 기준으로 완전히 새로운 레이아웃으로 리뉴얼한다. 기존 API·데이터는 유지하고, UI·레이아웃·컴포넌트 구조만 교체한다.

---

## 1. 목표·범위

### 1.1 목표

- **급여 관리** 페이지(`/erp/salary`)와 **급여 프로필**(탭 + 모달)을 **완전히 새로운 레이아웃**으로 리뉴얼한다.
- **마인드가든 디자인**(B0KlA, 통합 토큰, 아토믹 디자인)을 적용한다.
- 환불 관리 리뉴얼과 동일한 흐름: 기획 → 구조 조사 → 디자인·마크업 스펙 → 구현 체크리스트 → core-coder 구현.

### 1.2 범위

| 포함 | 제외 |
|------|------|
| 급여 관리 메인 페이지 전면 레이아웃 재구성 | 다른 ERP 페이지 레이아웃 변경 |
| 급여 프로필 탭·카드 그리드·등급·급여 테이블·옵션 폼(모달) | API·비즈니스 로직 변경(기존 유지) |
| ContentHeader + ContentArea, KPI/필터/탭/테이블·카드 배치 | — |
| AdminCommonLayout 필수, B0KlA·unified-design-tokens·반응형 | — |

### 1.3 선행 산출물 (완료)

| 문서 | 담당 | 용도 |
|------|------|------|
| `docs/project-management/SALARY_MANAGEMENT_RENEWAL_SURVEY.md` | core-component-manager | 라우트·컴포넌트·섹션·아토믹 적용 여부·개선 포인트 |
| `docs/design-system/SALARY_MANAGEMENT_LAYOUT_DESIGN.md` | core-designer | 레이아웃·블록·토큰·클래스명·반응형 |
| `docs/design-system/SALARY_MANAGEMENT_ATOMIC_MARKUP.md` | core-publisher | Atoms/Molecules/Organisms, BEM·시맨틱·접근성 |

---

## 2. 새 레이아웃 요약

### 2.1 페이지 구조 (순서 고정)

| 순서 | 영역 | 역할 |
|------|------|------|
| 0 | **ContentHeader** | 제목 "급여 관리", 부제 "상담사 급여 프로필 및 계산 관리", 액션(급여 기산일 설정, 기간 선택) |
| 1 | **급여 KPI/통계 카드** (선택) | 프로필 수, 계산 완료 건수 등 2~4열 카드 |
| 2 | **필터·제어** | 기간, 상담사, 급여일, **급여 계산 실행** 버튼(강조) |
| 3 | **탭** | "급여 프로필" \| "급여 계산" \| "세금 관리" |
| 4 | **탭별 콘텐츠** | 급여 프로필: 카드 그리드 / 급여 계산: 미리보기·계산 내역 / 세금 관리: 세금 통계 |

### 2.2 급여 프로필

- **카드 그리드**: 상담사명, 등급, 기본급 요약, "프로필 조회"·"편집" 버튼. 클래스: `salary-profile-card`, `salary-profile-block__grid`.
- **등급·급여 테이블**: 등급별 기본급·옵션 요약. `salary-grade-table`.
- **옵션 폼(모달)**: UnifiedModal 사용 필수. `salary-profile-form`, `salary-profile-form__section`, `salary-profile-form__actions`.

### 2.3 디자인 적용 원칙

- **토큰**: `var(--mg-color-*)`, `var(--mg-spacing-*)`, `var(--ad-b0kla-*)`만 사용. hex 직접 사용 금지.
- **공통**: ContentHeader, ContentArea, AdminCommonLayout. 모달은 UnifiedModal.
- **반응형**: 모바일 375px, 태블릿 768px, 데스크톱 1280px. KPI/필터/탭/그리드 배치는 `SALARY_MANAGEMENT_LAYOUT_DESIGN.md` §5 표 준수.

---

## 3. 아토믹 디자인 목표 구조

| 계층 | 내용 (목표) |
|------|-------------|
| **Atoms** | 버튼(`mg-v2-button--primary/secondary/outline`), 라벨(`mg-v2-form-label`), 아이콘, 배지, select/input(`mg-v2-select`). |
| **Molecules** | KPI 카드 1장, 필터 그룹(기간+상담사+급여일), 테이블 행, 탭 버튼, 프로필 카드, 계산 카드, 세금 통계 카드, 미리보기 행. |
| **Organisms** | 급여 KPI 블록, 필터+액션 블록, 급여 프로필 탭 콘텐츠(카드 그리드), 급여 계산 탭 콘텐츠(컨트롤+미리보기+내역), 세금 관리 탭 콘텐츠(통계 블록). |
| **Template** | AdminCommonLayout + ContentHeader + 탭 + 본문(Organisms 배치 순서). |
| **Page** | SalaryManagement: 데이터·필터·API·이벤트 연동. |

상세 블록명·BEM 클래스는 `SALARY_MANAGEMENT_ATOMIC_MARKUP.md` §2·§3·§6 참고.

---

## 4. 구현 체크리스트 (Phase 3 — core-coder)

구현 시 아래를 충족한다.

- [ ] **레이아웃**: 본문은 AdminCommonLayout children. ContentHeader(제목, 부제, 기산일 설정, 기간 선택) + ContentArea 사용.
- [ ] **본문 순서**: (1) KPI 블록(선택), (2) 필터·제어(기간, 상담사, 급여일, 급여 계산 실행 버튼), (3) 탭 "급여 프로필" \| "급여 계산" \| "세금 관리", (4) 탭별 블록.
- [ ] **급여 프로필 탭**: `salary-profile-block`, `salary-profile-block__grid`, 빈 상태 `salary-profile-block__empty`. 카드: `salary-profile-card`, `salary-profile-card__name`, `salary-profile-card__meta`, `salary-profile-card__grade`, `salary-profile-card__base`, `salary-profile-card__actions`.
- [ ] **급여 계산 탭**: `salary-calc-block`, `salary-calc-block__preview`, `salary-calc-block__list`, `salary-calc-block__card`, `salary-calc-block__actions`.
- [ ] **세금 관리 탭**: `salary-tax-block`, `salary-tax-block__card`, `salary-tax-block__empty`.
- [ ] **필터/KPI**: `salary-filter-block`, `salary-kpi-block`(선택). 디자인 문서 §3.2, §3.3 클래스명 준수.
- [ ] **토큰**: 색·간격·radius는 `var(--mg-*)` 또는 `var(--ad-b0kla-*)`만 사용.
- [ ] **모달**: SalaryProfileFormModal, SalaryConfigModal, ConsultantProfileModal 등 기존 모달은 UnifiedModal 래퍼 사용. 내부 폼 클래스: `salary-profile-form`, `salary-profile-form__section`, `salary-profile-form__actions`.
- [ ] **API·데이터**: 기존 API·상태·이벤트 유지. UI·마크업·클래스·스타일만 스펙에 맞게 교체.
- [ ] **반응형**: 375/768/1280px에서 KPI/필터/탭/그리드 배치가 `SALARY_MANAGEMENT_LAYOUT_DESIGN.md` §5와 일치.

---

## 5. 분배실행 표

| Phase | 담당 | 목표 | 전달할 태스크 설명 |
|-------|------|------|---------------------|
| **Phase 1** | core-component-manager | 급여 관리·급여 프로필 라우트, 컴포넌트 구조, 섹션, 아토믹 적용 여부, 개선 포인트 조사 | "급여 관리·급여 프로필 페이지의 라우트, 컴포넌트 구조, 섹션 구성을 조사하고, 아토믹 계층 적용 여부·공통 컴포넌트·개선 포인트를 정리해 SALARY_MANAGEMENT_RENEWAL_SURVEY.md 작성" |
| **Phase 2a** | core-designer | B0KlA 기준 급여 관리·급여 프로필 새 레이아웃 제안 | "SALARY_MANAGEMENT_RENEWAL_SURVEY.md 참조하여 B0KlA·어드민 대시보드 스타일로 급여 관리·급여 프로필 새 레이아웃 설계. KPI/필터/탭/카드·테이블·모달 배치, 토큰·클래스명, 반응형. SALARY_MANAGEMENT_LAYOUT_DESIGN.md 산출" |
| **Phase 2b** | core-publisher | 아토믹 마크업 구조 제안 | "조사 문서·환불 관리 아토믹 패턴 참고하여 급여 관리·급여 프로필용 Atoms/Molecules/Organisms, BEM·시맨틱·접근성 제안. SALARY_MANAGEMENT_ATOMIC_MARKUP.md 산출" |
| **Phase 2** | — | 2a·2b **병렬** 실행 가능 | 의존성 없음 |
| **Phase 3** | core-coder | 스펙·디자인·마크업 문서 기준으로 급여 관리·급여 프로필 페이지 새 레이아웃 구현 | "SALARY_MANAGEMENT_RENEWAL_SPEC.md 및 SALARY_MANAGEMENT_LAYOUT_DESIGN.md, SALARY_MANAGEMENT_ATOMIC_MARKUP.md, SALARY_MANAGEMENT_RENEWAL_SURVEY.md를 기준으로 SalaryManagement·급여 프로필 영역을 새 레이아웃+B0KlA·아토믹 구조로 구현. 기존 API·데이터 유지, UI·레이아웃·컴포넌트 구조만 교체" |

---

## 6. 검증 체크리스트 (리뉴얼 완료 후)

- [ ] `/erp/salary` 접근 시 AdminCommonLayout + ContentHeader + ContentArea로 렌더링된다.
- [ ] 상단에 "급여 관리" 제목, 부제, 기산일 설정 버튼, 기간 선택이 노출된다.
- [ ] KPI 영역(선택 구현 시) 프로필 수·계산 완료 건수 등이 카드 형태로 표시된다.
- [ ] 필터(기간, 상담사, 급여일)와 "급여 계산 실행" 버튼이 배치되어 동작한다.
- [ ] 탭 "급여 프로필" \| "급여 계산" \| "세금 관리" 전환 시 해당 콘텐츠만 표시된다.
- [ ] 급여 프로필 탭: 프로필 카드 그리드(또는 빈 상태), "새 프로필 생성"·"프로필 조회" 동작한다.
- [ ] 급여 계산 탭: 상담사 선택·기간·급여일·계산 실행 후 미리보기·계산 내역 목록이 스펙 클래스로 표시된다.
- [ ] 세금 관리 탭: 세금 통계(또는 빈 상태)가 스펙대로 표시된다.
- [ ] 모달(SalaryProfileFormModal, SalaryConfigModal 등)은 UnifiedModal 사용, 내부 폼 클래스명이 스펙과 일치한다.
- [ ] 색·간격은 디자인 토큰(`var(--mg-*)`)만 사용하며, 반응형(375/768/1280)에서 레이아웃이 설계서와 일치한다.

---

## 7. 참조 문서

| 문서 | 용도 |
|------|------|
| `docs/project-management/SALARY_MANAGEMENT_RENEWAL_SURVEY.md` | 현재 구조·개선 포인트 |
| `docs/design-system/SALARY_MANAGEMENT_LAYOUT_DESIGN.md` | 레이아웃·블록·토큰·클래스·반응형 |
| `docs/design-system/SALARY_MANAGEMENT_ATOMIC_MARKUP.md` | 아토믹 계층·BEM·시맨틱 |
| `docs/project-management/REFUND_MANAGEMENT_NEW_LAYOUT_SPEC.md` | 환불 관리 리뉴얼 패턴 참고 |
| `docs/standards/SUBAGENT_USAGE.md` | 서브에이전트 매핑 |
| `.cursor/skills/core-solution-planning/SKILL.md` | 기획 절차 |

---

**문서 끝.**  
Phase 3 구현은 core-coder가 본 스펙과 위 참조 문서를 기준으로 수행한다.
