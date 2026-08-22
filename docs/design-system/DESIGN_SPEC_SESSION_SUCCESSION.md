# 회기 승계 UI/UX 스펙 (Design Handoff)

**문서 버전**: 2.0 (Professional Redesign)
**작성일**: 2026-08-22
**작성**: core-designer
**코드 작성**: 없음 — 구현은 core-coder
**기획**: [SESSION_SUCCESSION_PLAN.md](../project-management/SESSION_SUCCESSION_PLAN.md)
**화면설계**: [SCREEN_SPEC_SESSION_SUCCESSION.md](./SCREEN_SPEC_SESSION_SUCCESSION.md)

---

## 1. 개요 및 배경

본 스펙은 통합 스케줄 매칭 카드에서 진입하는 **회기 승계 마법사**의 UI/UX 디자인을 정의합니다. 
기존의 단순한 모달 형태를 넘어, MindGarden 어드민 대시보드 샘플(B0KlA 디자인 시스템)의 시각적 언어(다크/라이트 대비, 명확한 섹션 블록, 포인트 악센트, 일관된 타이포그래피)를 완벽히 적용하여 전문적이고 신뢰감 있는 사용자 경험을 제공합니다. Generic AI 룩(보라색 그라데이션, 과도한 glow 등)을 철저히 배제하고 정제된 어드민 UI를 구현합니다.

---

## 2. 레이아웃 및 시각적 방향성 (B0KlA)

- **톤앤매너**: 어드민 대시보드 샘플(https://mindgarden.dev.core-solution.co.kr/admin-dashboard-sample)의 정제된 룩앤필.
- **모달 셸**: `UnifiedModal`을 사용하되, 내부 콘텐츠는 섹션 블록(배경 `var(--mg-color-surface-elevated)`, 테두리 `1px solid var(--mg-color-border-main)`, 코너 라운드 `var(--mg-radius-16)`)으로 감싸 정보의 위계를 명확히 합니다.
- **포인트 악센트**: 각 스텝의 주요 정보(소스 요약 등) 좌측에 세로 악센트 바(폭 4px, `var(--mg-color-primary-main)`, radius 2px)를 배치하여 시선을 유도합니다.
- **타이포그래피 위계**: Noto Sans KR 기반, 제목은 20-24px(SemiBold), 본문은 14-16px(Regular), 메타 정보는 12px(Medium, 보조 텍스트 색상)로 엄격히 구분합니다.

---

## 3. 세부 UI/UX 스펙

### 3.1 진입 CTA: 통합 스케줄 매칭 카드 액션

- **위치**: ACTIVE 상태 매핑 카드의 `CardActionGroup` 내 「회기 추가」 버튼 인근.
- **시각적 위계**: 보조 액션(Secondary). 과도한 시선 분산을 막기 위해 Outline 스타일 적용.
- **컴포넌트**: `MGButton` (variant: `outline` 또는 `secondary`)
- **토큰**: 
  - Text/Border: `var(--mg-color-primary-main)`
  - Hover Background: `var(--mg-color-primary-light)` (또는 투명도 적용된 primary)
- **비활성 상태**: `transferableSessions === 0`일 경우 `disabled` 처리 및 툴팁(Tooltip)으로 "승계 가능한 잔여 회기가 없습니다" 안내.

### 3.2 모달 셸 (`SessionSuccessionWizardModal`)

- **컴포넌트**: `UnifiedModal` (size: `large` - 800px 권장, 신규 내담자 폼 및 요약 정보 가독성 확보)
- **클래스명**: `mg-v2-ad-b0kla__modal` (B0KlA 테마 강제 적용)
- **헤더 영역**:
  - 타이틀: "회기 승계" (24px, 600, `var(--mg-color-text-main)`)
  - 서브타이틀: "이전 당사자명 — 소스 상담사명" (14px, 400, `var(--mg-color-text-secondary)`)
- **스텝 인디케이터**: 상단에 가로형 스텝 진행바 배치 (1. 수혜자 선택 → 2. 상담사 및 회기 → 3. 최종 확인). 활성 스텝은 `var(--mg-color-primary-main)`, 비활성은 `var(--mg-color-border-main)` 사용.

### 3.3 스텝 1: 수혜자 선택 (`BeneficiaryPickerStep`)

**[섹션 A] 소스 요약 블록 (읽기 전용)**
- **컨테이너**: 배경 `var(--mg-color-surface-elevated)`, 테두리 `1px solid var(--mg-color-border-main)`, `border-radius: var(--mg-radius-16)`, `padding: var(--mg-spacing-24)`.
- **좌측 악센트**: 블록 좌측에 4px 너비의 `var(--mg-color-primary-main)` 세로 바 적용.
- **내용**: 
  - 패키지명 (16px, 600)
  - 사용 / 남은 / 총 회기 (14px, 숫자 강조 600)
  - **승계 가능 회기**: `var(--mg-color-primary-main)` 색상 텍스트로 강조 (예: "승계 가능: 5회")
  - **점유 스케줄**: `var(--mg-color-warning-main)` 텍스트로 안내 (예: "스케줄 등록 2건 제외")

**[섹션 B] 수혜자 입력 블록**
- **탭/세그먼트**: `기존 내담자` | `신규 등록` (B0KlA 스타일 세그먼트 컨트롤)
- **기존 내담자 뷰**: `CustomSelect`를 이용한 검색. 소스 CLIENT와 동일인 선택 시 하단에 `var(--mg-color-error-main)` 인라인 에러 노출.
- **신규 등록 뷰**: 공통 모듈의 `ClientRegistrationForm` 최소 필드 재사용. (이름, 연락처 등). 레이블은 12px `var(--mg-color-text-secondary)`.

**액션**: `[취소]`, `[다음]` (수혜자 유효 시 활성화, Primary Button)

### 3.4 스텝 2: 상담사 및 회기 설정 (`SuccessionCountStep`)

**[섹션 A] 타깃 상담사 설정**
- **입력**: `CustomSelect` (기본값: 소스 상담사).
- **헬퍼 텍스트**: "상담사를 변경하여 승계할 수 있습니다." (12px, `var(--mg-color-text-secondary)`).

**[섹션 B] 승계 회기 수 설정**
- **입력**: Number Stepper (최소 1, 최대 승계가능 횟수).
- **빠른 액션**: `[전량 적용]` 버튼 (Outline, 클릭 시 max 값으로 설정).
- **시각적 프로젝션 (Before & After)**:
  - 소스: `남은 회기 A → A - N`
  - 타깃: `신규 N회`
  - 화살표(`→`) 아이콘을 사용하여 직관적인 흐름 표현.
- **경고 배너**: 
  - 배경 `var(--mg-color-warning-light)`, 텍스트 `var(--mg-color-warning-dark)`, 좌측 아이콘.
  - 문구: "스케줄에 이미 등록된 회기는 승계되지 않고 기존 당사자에게 남습니다."

**액션**: `[이전]`, `[다음]`

### 3.5 스텝 3: 최종 확인 (`SuccessionConfirmStep`)

**[섹션 A] 승계 요약 영수증 (Receipt Style)**
- **컨테이너**: 배경 `var(--mg-color-surface-elevated)`, 점선 테두리(dashed) 적용하여 영수증 메타포 부여.
- **항목**: 
  - 수혜자 (타깃 내담자)
  - 담당 상담사
  - 승계 회기 수 (크고 굵게 강조, 24px, `var(--mg-color-primary-main)`)
- **안내 문구**: "결제·입금·영수증 정보는 원 매핑에 남습니다." (12px, `var(--mg-color-text-secondary)`)

**[섹션 B] 승계 사유 (선택)**
- **입력**: Textarea (`var(--mg-color-surface-main)` 배경, Focus 시 `var(--mg-color-primary-main)` 테두리 하이라이트).

**액션**: `[이전]`, `[승계 실행]` (`MGButton`, `preventDoubleClick` 필수, 클릭 시 로딩 스피너)

### 3.6 상태 및 예외 처리 (States & Empty/Error)

- **로딩 (Preview/Submit)**: 
  - 데이터 로딩 시 Skeleton UI 적용 (단순 스피너 지양, 레이아웃 유지).
  - 버튼 내 로딩은 텍스트 숨김 + 원형 스피너.
- **에러 (API 실패 등)**: 
  - `SafeErrorDisplay` 사용. 모달 내부에 인라인으로 에러 메시지 및 `[재시도]` 버튼 노출.
  - 모달 전체가 깨지지 않도록 Error Boundary 필수 적용.
- **빈 상태 (승계 가능 0)**: 
  - 진입 전 카드 CTA에서 차단. 
  - 만약 진입 후 데이터 동기화로 0이 된 경우, 스텝 1 요약 블록에 `var(--mg-color-error-main)` 배너 노출 및 `[다음]` 버튼 비활성화.

---

## 4. 아토믹 계층 및 컴포넌트 매핑

| 계층 | 컴포넌트명 | 재사용/신규 | 설명 |
|------|------------|-------------|------|
| **Organism** | `SessionSuccessionWizardModal` | 신규 (조합) | `UnifiedModal` 기반 마법사 컨테이너 |
| **Molecule** | `SuccessionSourceSummary` | 신규 | 좌측 악센트 바가 포함된 소스 요약 블록 |
| **Molecule** | `BeneficiaryPickerStep` | 신규 | 기존/신규 탭 및 입력 폼 조합 |
| **Molecule** | `SuccessionCountStep` | 신규 | 상담사 선택 및 회기 Stepper, 프로젝션 뷰 |
| **Molecule** | `SuccessionConfirmStep` | 신규 | 영수증 스타일 요약 및 사유 입력 |
| **Atom** | `MGButton`, `CustomSelect`, `FormInput`, `Badge` | **기존 재사용** | 공통 모듈 엄수 |

*주의: 신규 오버레이나 독자적인 모달 래퍼 작성은 절대 금지합니다. 반드시 `UnifiedModal`을 사용하세요.*

---

## 5. 디자인 토큰 (Design Tokens)

본 스펙은 하드코딩된 HEX 값이나 px(반경, 여백 등) 리터럴을 엄격히 금지합니다. 반드시 아래의 `var(--mg-*)` 토큰을 사용하십시오.

**Colors**
- 주조색 (Primary): `var(--mg-color-primary-main)` (어드민 기준 #3D5246 매핑)
- 배경 (Background): `var(--mg-color-background-main)` (#FAF9F7 매핑)
- 서페이스 (Surface): `var(--mg-color-surface-elevated)` (#F5F3EF 매핑)
- 텍스트 (Text): `var(--mg-color-text-main)` (본문), `var(--mg-color-text-secondary)` (보조/라벨)
- 테두리 (Border): `var(--mg-color-border-main)` (#D4CFC8 매핑)
- 상태 (Status): `var(--mg-color-warning-main)`, `var(--mg-color-warning-light)`, `var(--mg-color-error-main)`

**Spacing & Radius**
- 여백: `var(--mg-spacing-16)`, `var(--mg-spacing-24)` (섹션 블록 내부 패딩)
- 라운드: `var(--mg-radius-16)` (섹션 블록), `var(--mg-radius-8)` (버튼/인풋)

---

## 6. 반응형 (Responsive)

- **Desktop (1024px 이상)**: 모달 너비 800px 고정, 내부 2단 분할(좌측 요약, 우측 입력) 가능.
- **Tablet/Mobile (768px 이하)**: 모달 너비 100px~95% 유동적, 내부 1단 세로 스크롤로 전환. 스텝 인디케이터는 텍스트 축약형(예: "1/3 수혜자")으로 변경.

---

## 7. 참조 문서

- `docs/design-system/PENCIL_DESIGN_GUIDE.md` (어드민 대시보드 샘플 기준)
- `docs/standards/COMMON_MODULES_USAGE_GUIDE.md`
- `frontend/src/styles/unified-design-tokens.css`
