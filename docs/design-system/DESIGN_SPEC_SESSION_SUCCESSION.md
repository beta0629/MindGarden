# 회기 승계 UI/UX 스펙 (Design Handoff)

**문서 버전**: 1.0  
**작성일**: 2026-08-22  
**작성**: core-planner (핸드오프 수준; 시각 시안 보강 시 core-designer `gemini-3.1-pro`)  
**코드 작성**: 없음 — 구현은 core-coder  
**기획**: [SESSION_SUCCESSION_PLAN.md](../project-management/SESSION_SUCCESSION_PLAN.md)  
**화면설계**: [SCREEN_SPEC_SESSION_SUCCESSION.md](./SCREEN_SPEC_SESSION_SUCCESSION.md)

---

## 1. 개요 및 배경

통합 스케줄 매칭 카드에서 **회기 승계** 마법사를 열어, 스케줄에 묶이지 않은 잔여 회기를 수혜자 CLIENT의 타깃 매핑으로 전량·부분 이전한다. 회기 추가 모달과 톤을 맞추되, **상담사 선택·수혜자·점유 제외 안내**가 차별점이다.

---

## 2. 레이아웃 아이디어

- **페이지 변경 최소화**: 기존 통합 스케줄 스플릿(사이드바 카드 + 캘린더) 유지.
- **기능 표면**: `UnifiedModal` 3스텝(+완료). 풀페이지 신설 금지.
- **카드 CTA**: ACTIVE 매핑의 `CardActionGroup`에 outline/secondary **「회기 승계」** — 「회기 추가」바로 옆(시각적 군집).

---

## 3. 세부 UI/UX 스펙

### 3.1 매칭 카드 액션

- 라벨: `회기 승계`
- 컴포넌트: `MGButton` (회기 추가와 동일 위계 또는 text/outline)
- 비활성: `transferableSessions === 0` (미리보기 로드 전엔 remaining만으로 낙관 활성 가능하나, 모달 오픈 직후 preview로 재검증)
- 토큰: 기존 카드 액션과 동일 `var(--mg-*)` — **새 HEX 금지**

### 3.2 모달 셸

- `UnifiedModal` + `className`에 B0KlA(`mg-v2-ad-b0kla` 계열, 회기 추가 스펙과 동일 계열)
- `size`: `large` 권장(신규 내담자 폼 여유)
- 헤더: 제목 `회기 승계` · 부제 `이전 당사자명 — 소스 상담사명`
- 스텝 인디케이터: 1 수혜자 / 2 상담사·회기 / 3 확인 (Atoms: 텍스트 스텝 또는 기존 위저드 패턴 재사용)

### 3.3 스텝 1 — 수혜자

**섹션 A — 소스 요약(읽기 전용)**  
- 표면: `var(--mg-color-surface-elevated)` · border `var(--mg-color-border-main)` · radius 토큰  
- 내용: 패키지명, `사용 / 남은 / 총`, **점유 스케줄 n건**, **승계가능 m회**

**섹션 B — 수혜자**  
- 세그먼트/탭: `기존 내담자` | `신규 등록`  
- 기존: 검색 `CustomSelect`(내담자) — 소스 CLIENT와 동일인 선택 시 인라인 에러  
- 신규: 이름·연락처 등 **기존 Client 등록 최소 필드**(공통 모듈) — 타이핑 최소화·필수만

**액션**: 취소 | 다음(수혜자 유효 시)

### 3.4 스텝 2 — 상담사·회기

- **타깃 상담사**: `CustomSelect`, 기본값 = 소스 상담사, **변경 가능** 명시 헬퍼 텍스트  
- **이전 횟수 N**: number stepper, min 1, max = 승계가능  
- **전량 적용** 버튼 → N = 승계가능  
- Projection: `소스 남은 a → a−N` / `타깃 +N`  
- 경고 배너(항상): 스케줄 등록분은 제외된다는 문구 — `var(--mg-color-warning-*)` 토큰만

**액션**: 이전 | 다음

### 3.5 스텝 3 — 확인

- 요약 리스트: 수혜자, 타깃 상담사, N, 승계가능, 점유 제외 건수, 결제 비이전 안내  
- 사유: Textarea 선택  
- Primary: `승계 실행` (`MGButton` preventDoubleClick)  
- 실행 중 로딩·중복 방지

### 3.6 완료·에러

- 성공: 짧은 결과(소스/타깃 remaining) → 닫기 → 사이드바/목록 invalidate  
- 에러: `SafeErrorDisplay` / 공통 에러 경계 — 객체 직접 렌더 금지(#130)  
- 빈 승계가능: 스텝 2에서 막지 말고 카드 또는 스텝1 요약에서 차단

---

## 4. 아토믹 계층·공통 모듈

| 계층 | 제안명 | 재사용 |
|------|--------|--------|
| Organism | `SessionSuccessionWizardModal` | `UnifiedModal` |
| Molecules | `SuccessionSourceSummary`, `BeneficiaryPickerStep`, `SuccessionCountStep`, `SuccessionConfirmStep` | 회기 추가 요약 카드 패턴 |
| Atoms | `MGButton`, FormInput, `CustomSelect`, Badge | 기존 |

공통 모듈 우선: `docs/standards/COMMON_MODULES_USAGE_GUIDE.md`, `/core-solution-common-modules`.  
신규 오버레이·독자 모달 래퍼 **금지**.

---

## 5. 사용 토큰 (예시 — 변수명만)

- `var(--mg-color-primary-main)` / `var(--mg-primary-*)`
- `var(--mg-color-text-main)`, `var(--mg-color-text-secondary)`
- `var(--mg-color-border-main)`, `var(--mg-color-surface-elevated)`
- `var(--mg-color-background-main)`
- `var(--mg-color-warning-main)`, `var(--mg-color-error-main)`
- `var(--mg-spacing-16)`, `var(--mg-spacing-24)`

하드코딩 `#hex`·`px` 리터럴 스펙 기입 금지. 회기 추가 스펙에 HEX가 있어도 **본 기능은 토큰만**.

---

## 6. 상호작용·상태

| 상태 | 동작 |
|------|------|
| Preview 로딩 | 요약 스켈레톤/스피너 |
| Preview 실패 | 에러 + 재시도, 실행 버튼 비활성 |
| N 초과 입력 | 즉시 max로 클램프 또는 인라인 에러 |
| 실행 중 | Primary 로딩, 닫기 확인 |
| 성공 | 토스트 또는 완료 패널 |

---

## 7. 코더 전달 체크리스트

- [ ] 진입: `CardActionGroup` ACTIVE 슬롯  
- [ ] API: PLAN §5 preview + execute  
- [ ] 산식: PLAN §3.2 (COMPLETED 비포함)  
- [ ] 스케줄 row 미변경 UI/카피  
- [ ] ERP 비이전 카피  
- [ ] `safeDisplay` 등 동적 필드 안전 표시  

---

## 8. 참조

- `docs/design-system/SCREEN_SPEC_SESSION_EXTENSION_MODAL.md`
- `docs/design-system/ATOMIC_DESIGN_SYSTEM.md`
- `docs/design-system/PENCIL_DESIGN_GUIDE.md`
- `frontend/src/styles/unified-design-tokens.css`
- `/core-solution-design-handoff`, `/core-solution-unified-modal`
