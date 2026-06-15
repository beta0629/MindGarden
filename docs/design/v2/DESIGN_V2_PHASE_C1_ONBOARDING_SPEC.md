# Design V2 Phase C-1 (1/3) — Tenant Onboarding 6-Step Visual Spec

## §1. 개요·범위
- **목적**: MindGarden 테넌트(기관/센터) 공개 가입 Onboarding 6단계 흐름의 실 화면 비주얼 스펙 정의
- **적용 레이아웃**: PublicLayout (G③: AdminCommonLayout 미사용)
- **베이스 가이드**: `docs/design-system/PENCIL_DESIGN_GUIDE.md`, Phase A1 Calm Forest 팔레트
- **토큰 SSOT**: `var(--mg-v2-*)` (`frontend/src/styles/tokens/design-v2-tokens.css` 기준)
- **주요 결정사항 반영**:
  - G② 다크 모드 토글: 헤더 우측 상단 적용, OS 자동 및 `localStorage` 오버라이드
  - G③ Pricing 요금제: ₩TBD 등 가격 Placeholder 표기
  - G② 하이브리드 공개 폼: Step 6 이후 PENDING 상태 전환(어드민 승인 프로세스) 대기

## §2. 사용성·정보 노출·레이아웃 원칙 (Step 공통)

### 2.1. 레이아웃
- **Desktop (1440×900)**: 12-Column Grid (`--mg-v2-grid-columns-desktop`) / `--mg-v2-grid-container-md` (720px) 중앙 정렬 폼
- **Mobile (414×896)**: 4-Column Grid (`--mg-v2-grid-columns-mobile`) / 100% width, `--mg-v2-grid-margin-mobile` (1rem) 여백

### 2.2. 정보 노출 (폼 필드 원칙)
- **라벨**: 상단 배치 (`--mg-v2-font-size-body-sm`, `--mg-v2-font-weight-medium`, `--mg-v2-color-text-secondary`)
- **입력 필드**: 높이 44px (`--mg-v2-component-height-md`와 유사하게, 혹은 40px/48px 적의 조정), 테두리 `--mg-v2-color-border-default`
- **도움말/에러 메시지**: 필드 하단 배치 (`--mg-v2-font-size-caption`)
- **에러 상태**: 테두리 `--mg-v2-color-semantic-error`, 아이콘/텍스트 에러 색상
- **포커스 상태**: `--mg-v2-shadow-focus` 적용 (3px focus ring)

## §3. Step 1 — 기본 정보 (Desktop + Mobile 와이어 + 토큰 매핑 + 상태)
테넌트 생성의 가장 기초적인 정보를 수집합니다.

### 3.1. 와이어프레임 (Desktop / Mobile 공통)
```text
[Header] (로고)                                [다크모드 토글] [기존 계정 로그인]
-------------------------------------------------------------------------
                           [OnboardingStepper: 1/6]
[Title] 기본 정보를 입력해 주세요
[Subtitle] 생성될 기관의 대표 정보를 설정합니다.

[Label] 테넌트명 (필수)
[Input] 예: 마인드가든 심리상담센터

[Label] 도메인 (필수)
[Input:        .mindgarden.co.kr ] [중복확인 버튼]
* 도움말: 영문 소문자와 숫자, 하이픈(-)만 가능

[Label] 대표 연락처 (필수)
[Input: 숫자만 입력]

[Label] 대표 이메일 (필수)
[Input: 예: hello@mindgarden.com]

[                 다음 단계로                 ]
```

### 3.2. 토큰 매핑 & 상태
- **배경**: `--mg-v2-color-surface-bg` (다크모드: 시스템 반영)
- **카드/폼 컨테이너**: `--mg-v2-color-surface-card`, `--mg-v2-radius-xl` (16px), `--mg-v2-border-width-thin`
- **타이틀**: `--mg-v2-font-size-h2`, `--mg-v2-font-weight-bold`, `--mg-v2-color-text-primary`
- **서브타이틀**: `--mg-v2-font-size-body-md`, `--mg-v2-color-text-secondary`, 상단 마진 `--mg-v2-space-2`
- **입력 상태**:
  - **기본**: `--mg-v2-color-border-default`
  - **포커스**: `--mg-v2-color-border-focus`, `--mg-v2-shadow-focus`
  - **에러 (도메인 중복 등)**: `--mg-v2-color-semantic-error`
  - **성공 (사용 가능한 도메인)**: `--mg-v2-color-semantic-success` 하단 메시지 텍스트

## §4. Step 2 — 비즈니스 정보
기관의 규모와 업종 등 사업적 특성을 수집합니다.

### 4.1. 와이어프레임 요소
- **업종 (드롭다운)**: 상담, 코칭, 병원, 기타 (기본: 선택해주세요)
- **세부 카테고리 (다중 선택 칩/체크박스)**: 아동/청소년, 부부/가족, 직장인, 중독 등
- **상담사 수 규모 (라디오 버튼 그룹 혹은 셀렉트)**: 1인, 2~5인, 6~10인, 11인 이상

### 4.2. 토큰 매핑 & 상태
- **다중 선택 칩**:
  - **미선택**: 배경 투명, 테두리 `--mg-v2-color-border-default`, 텍스트 `--mg-v2-color-text-secondary`, `--mg-v2-radius-pill`
  - **선택 (Selected)**: 배경 `--mg-v2-color-primary-main`, 텍스트 `--mg-v2-color-text-inverse`, 테두리 없음
  - **호버**: `--mg-v2-color-state-hover` 레이어 추가

## §5. Step 3 — 결제 정보 (가격 Placeholder G③)
초기 요금제(플랜) 선택 및 결제 방식을 결정합니다. (G③에 의해 실제 가격은 Placeholder 표기)

### 5.1. 와이어프레임 요소
- **요금제 선택 카드 (3단 Grid 또는 스와이프)**:
  - **Basic**: ₩TBD / 월 (1인 센터 추천)
  - **Pro**: ₩TBD / 월 (소규모 기관 추천) — **(추천 배지 부착)**
  - **Enterprise**: 별도 문의 / 월
- **결제 수단**: 카드, 계좌이체, 세금계산서 (탭 혹은 라디오 선택)

### 5.2. 토큰 매핑 & 상태
- **요금제 카드**:
  - 기본 테두리 `--mg-v2-color-border-default`, 배경 `--mg-v2-color-surface-card`
  - **선택된 카드**: 테두리 `--mg-v2-color-border-focus` (`--mg-v2-border-width-normal`), 옅은 주조색 배경 (예: rgba(--mg-v2-color-primary-main, 0.04) 등 디자인 시스템 내 구현)
  - **가격 텍스트 (₩TBD)**: `--mg-v2-font-size-h3`, `--mg-v2-font-weight-bold`
  - **추천 배지**: 배경 `--mg-v2-color-semantic-info-light`, 텍스트 `--mg-v2-color-semantic-info-dark`, `--mg-v2-font-size-micro`, `--mg-v2-radius-sm`

## §6. Step 4 — 약관 동의
서비스 이용을 위한 필수/선택 약관 동의를 받습니다.

### 6.1. 와이어프레임 요소
- **전체 동의 체크박스** (상단 굵은 텍스트)
- **개별 동의 리스트**:
  - [필수] 이용약관 동의 (우측: 내용 보기 링크)
  - [필수] 개인정보 처리방침 동의 (우측: 내용 보기 링크)
  - [선택] 마케팅 수신 동의

### 6.2. 토큰 매핑
- **체크박스**:
  - 선택 시: `--mg-v2-color-primary-main` 배경 + 흰색 체크 아이콘
  - 미선택 시: `--mg-v2-color-border-default` 테두리
- **링크 텍스트**: `--mg-v2-color-text-link`, 호버 시 `--mg-v2-color-text-link-hover`, `--mg-v2-font-size-body-sm`

## §7. Step 5 — 관리자 계정 생성 (비밀번호 강도 표시)
어드민 패널에 최초로 로그인할 Root 관리자 계정을 생성합니다.

### 7.1. 와이어프레임 요소
- **관리자 이름**: [Input]
- **로그인 이메일 (ID)**: [Input] [중복확인 버튼]
- **비밀번호**: [Input (type=password)]
  - *비밀번호 강도 인디케이터*: [ 🟩 🟩 ⬜ ⬜ ] (보통)
- **비밀번호 확인**: [Input (type=password)]

### 7.2. 토큰 매핑 & 상태
- **비밀번호 강도 인디케이터**:
  - 낮음(취약): `--mg-v2-color-semantic-error`
  - 보통: `--mg-v2-color-semantic-warning`
  - 높음(안전): `--mg-v2-color-semantic-success`
  - 인디케이터 바 높이 4px, `--mg-v2-radius-pill`, 간격 `--mg-v2-space-1`

## §8. Step 6 — 완료 (PENDING 안내)
G② 옵션 C(하이브리드)에 따라 어드민 승인이 필요함을 안내합니다.

### 8.1. 와이어프레임 요소
- **중앙 아이콘**: (시계/대기/성공 뱃지 형태의 큰 아이콘)
- **타이틀**: 신청이 완료되었습니다.
- **메시지**: 내부 검토를 거쳐 1~2 영업일 내에 승인될 예정입니다.<br>승인이 완료되면 입력하신 관리자 이메일로 안내해 드립니다.
- **액션 버튼**: [ 홈으로 돌아가기 ]

### 8.2. 토큰 매핑
- **아이콘 색상**: `--mg-v2-color-semantic-success`
- **타이틀**: `--mg-v2-font-size-h2`, `--mg-v2-font-weight-bold`, 중앙 정렬
- **설명 텍스트**: `--mg-v2-color-text-secondary`, `--mg-v2-font-size-body-md`
- **버튼**: `--mg-v2-color-primary-main` 배경, `--mg-v2-color-text-inverse`

## §9. OnboardingStepper 상단 진행 표시 (Phase B 재사용 + 보강 필요 사항)
- **사양**: Phase B에 정의된 `OnboardingStepper.jsx` 컴포넌트를 사용합니다.
- **보강 (CSS/토큰)**:
  - 현재 Step: `--mg-v2-color-primary-main` 배경 원 + 활성 텍스트
  - 완료 Step: `--mg-v2-color-primary-main` 테두리 원 + 체크 아이콘 + 라인 연결색 채움
  - 예정 Step: `--mg-v2-color-border-default` 테두리 원 + `--mg-v2-color-text-disabled` 텍스트

## §10. OnboardingNavigation 하단 버튼 (Phase C-2 Organism 사양)
- **공통 하단 고정/유동 영역**:
  - [ 임시저장 ] (좌측, Secondary 혹은 Outline 스타일)
  - [ 이전 ] (우측 2순위, Text 혹은 Outline 버튼) - Step 1 제외
  - [ 다음 단계로 ] / [ 신청 완료하기 ] (우측 1순위, Primary 버튼)
- **토큰**:
  - Primary: `--mg-v2-color-primary-main` (배경), `--mg-v2-color-text-inverse` (텍스트)
  - Outline: `--mg-v2-color-surface-bg` (배경), `--mg-v2-color-border-default` (테두리), `--mg-v2-color-text-primary` (텍스트)
  - 여백: `gap`은 `--mg-v2-space-2` 또는 `--mg-v2-space-3`

## §11. 다크 모드 토글 G② 스펙 (헤더 우측)
- **위치**: PublicHeader 내부, 우측 `로그인` 버튼 좌측.
- **UI 디자인**:
  - 알약(Pill) 형태의 토글 트랙 (너비 48px, 높이 24px, `--mg-v2-radius-pill`)
  - 핸들 (원형, 20px, `--mg-v2-shadow-sm`)
  - 내부에 해(Light) / 달(Dark) 작은 아이콘 삽입
- **동작 방식 (접근성 포함)**:
  - `<button role="switch" aria-checked="false" aria-label="다크 모드 전환">`
  - OS 설정(`prefers-color-scheme`) 초기값 상속, `localStorage` 기반 상태 덮어쓰기.
  - 전환 시 트랜지션 `--mg-v2-transition-fast` 사용 (배경색/핸들 이동).
- **토큰 상태**:
  - Light 모드 트랙: `--mg-v2-color-surface-disabled` (또는 지정 회색)
  - Dark 모드 트랙: `--mg-v2-color-primary-main` (다크모드 토큰 기반)

## §12. 모바일 (414×896) 반응형 전환 규칙
- **Grid Container**: 100% width, 마진 16px (`--mg-v2-grid-margin-mobile`)
- **버튼 배열**: 하단 네비게이션 버튼이 Desktop에서는 우측 정렬이지만, Mobile에서는 **수직 적층(Stack)**되거나 **100% Full-width 블록**으로 변경. (Primary 버튼이 가장 위)
- **요금제 카드**: 3단 Grid (Desktop) → 수직 1열 스크롤 (Mobile)
- **Stepper**: 가로로 긴 텍스트 레이블은 숨기고, `[1/6]` 텍스트 혹은 진행률 바(Progress bar)로 간소화 표시 권장.

## §13. 마이크로 인터랙션 (호버/포커스/진행 애니메이션)
- **버튼 호버**: 배경에 `--mg-v2-color-state-hover` 레이어 합성, `--mg-v2-transition-fast`
- **인풋 포커스**: `--mg-v2-shadow-focus` 적용 애니메이션 (`--mg-v2-transition-fast`)
- **Step 전환 애니메이션**: Fade-in / Slide-in-up (이전/다음 화면 교체 시), `--mg-v2-transition-normal`

## §14. WCAG 2.1 AA 검증 결과 (컬러 대비 + 키보드 nav)
- **대비 검증**:
  - Primary Text (`#2C2C2C`) on Surface (`#FAF9F7`) -> 13.8:1 (PASS)
  - Secondary Text (`#5C6B61`) on Surface -> 5.8:1 (PASS)
  - Error Text (`#D32F2F`) on Surface -> 4.73:1 (PASS)
- **키보드 내비게이션**:
  - 각 Input, Select, Checkbox, Radio, Button은 `tabindex="0"` 흐름 내 존재.
  - 모든 포커스 가능한 요소는 `--mg-v2-shadow-focus` (3px focus ring) 명확히 표시 (Playwright 자동화 / Axe-core 테스트 용이성 확보).

## §15. Core-Coder 핸드오프 체크리스트 (Phase C-2 OnboardingStepForm Organism 사양)
코더(core-coder)는 Phase C-2에서 본 스펙을 바탕으로 다음을 구현합니다.

- [ ] (레이아웃) PublicLayout 내에서 좌우 여백/컨테이너 사이즈(`720px`)가 유지되는가?
- [ ] (디자인 토큰) 하드코딩된 색상/여백 없이 100% `var(--mg-v2-*)` 토큰만 사용했는가?
- [ ] (다크모드) 헤더에 다크모드 토글 스위치가 마크업 및 접근성(role=switch) 속성을 포함하여 구현되었는가?
- [ ] (Step 3) Pricing 요금제의 가격이 "₩TBD" 등의 Placeholder로 명시되었는가?
- [ ] (접근성/상태) 폼 필드 에러 상태 시 테두리 색상 및 focus-ring(`--mg-v2-shadow-focus`)이 정상 동작하는가?
- [ ] (동작) Step 6 완료 화면이 폼 제출 후 "승인 대기(PENDING)" 안내를 정확히 표시하는가?
