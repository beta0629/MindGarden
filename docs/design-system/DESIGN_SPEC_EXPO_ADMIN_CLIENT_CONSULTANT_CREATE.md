# 모바일 어드민 내담자/상담사 추가 (고도화) UI/UX 스펙

## 1. 개요 및 배경
- **화면명**: 모바일 어드민 내담자 추가 (`create-client.tsx`), 상담사 추가 (`create-consultant.tsx`)
- **목적**: 기존 최소 필드만 제공되던 모바일 등록 폼을 웹 어드민 수준의 풀 폼(Full Form)으로 확장합니다. 모바일 사용성에 맞게 정보 그룹을 카드 단위로 분리하여 인지 부하를 줄이고, 입력 편의성을 극대화합니다.
- **디자인 방향**: 마인드가든 웹 어드민(B0KlA)의 시각적 언어를 Expo 모바일 앱 환경에 정합성 있게 이식합니다.

## 2. 레이아웃/아이디어
- **모바일 최적화 섹션 블록 (카드형 UI)**: 웹 어드민의 '섹션 블록' 개념을 모바일의 '카드' UI로 차용하여 필수 정보와 선택(부가) 정보를 시각적으로 명확히 분리합니다.
- **고정 하단 액션 (Sticky Bottom Action)**: 폼의 길이가 길어지더라도 언제든 폼 제출이 가능하도록 '저장' 버튼을 스크롤 영역과 독립된 하단 고정 영역에 배치합니다.
- **B0KlA 비주얼 적용**: 다크 사이드바 패턴은 모바일 구조상 `AppTopBar`로 대체하되, 메인 배경(`var(--mg-color-background-main)`), 카드 서페이스(`var(--mg-color-surface-main)`), 주조색(`var(--mg-color-primary-main)`) 및 좌측 악센트 바 요소를 그대로 적용해 일관성을 유지합니다.

## 3. 세부 UI/UX 스펙

### 3.1. 전체 레이아웃 (Template)
- **상단**: `AppTopBar` (뒤로가기 아이콘, 화면 타이틀 중앙 정렬)
- **본문 (ScrollView)**
  - **배경색**: `var(--mg-color-background-main)` (#FAF9F7)
  - **패딩**: 좌우 16px, 상하 24px
  - **간격**: 카드 간 gap 16px (`var(--mg-spacing-16)`)
- **하단 고정 영역 (Fixed Bottom Bar)**
  - **패딩**: 좌우 16px, 상하 12px (하단 SafeArea 고려)
  - **배경색**: 모바일 특성상 배경과 동일한 `var(--mg-color-background-main)` 적용 (필요시 블러 처리)
  - **상단 테두리**: 1px solid `var(--mg-color-border-main)` (#D4CFC8)

### 3.2. 섹션 블록 / 카드 공통 스타일 (Organisms)
웹 어드민의 섹션 블록 구조를 모바일에 맞춰 리사이징한 공통 폼 컨테이너입니다.
- **배경색**: `var(--mg-color-surface-main)` (#F5F3EF)
- **테두리**: 1px solid `var(--mg-color-border-main)` (#D4CFC8)
- **Border Radius**: 16px (`var(--mg-radius-16)`)
- **패딩**: 20px
- **섹션 타이틀 영역**:
  - **좌측 악센트 바**: width 4px, height 16px, radius 2px, 색상 `var(--mg-color-primary-main)` (#3D5246)
  - **타이틀 텍스트**: 16px, Noto Sans KR, fontWeight 600, 색상 `var(--mg-color-text-main)` (#2C2C2C)
  - **배치**: 악센트 바와 타이틀 간 간격 8px, 수직 중앙 정렬(align-items: center)
  - **폼 필드와의 간격**: 타이틀 하단 gap 16px

### 3.3. 화면별 구성 및 필드

#### A. 내담자 추가 폼 (`create-client.tsx`)
- **[카드 1] 기본 정보 (필수)**
  - 이름: Text Input (FormInput)
  - 연락처: 이메일 또는 휴대폰 번호 입력 (필수)
  - 비밀번호: Password Input (선택, 미입력 시 자동 생성 안내 문구 추가)
- **[카드 2] 부가 정보 (선택)**
  - 주민등록번호: Text Input (마스킹 처리: 앞 6자리 + 뒤 1자리 형식)
  - 주소: Text Input (텍스트 직접 입력)
  - 상담 목적/이력: Multiline Text Input (최대 3줄 노출, 초과 시 스크롤 또는 자동 높이 조절)

#### B. 상담사 추가 폼 (`create-consultant.tsx`)
- **[카드 1] 계정 정보 (필수)**
  - 이메일: Email Input (입력 완료 후 `onBlur` 검증 안내 텍스트 표시)
  - 휴대폰: Phone Input (숫자 키패드 활성화)
- **[카드 2] 전문 정보 (선택)**
  - 전문 분야: Tag/Chip 다중 선택 UI
    - 선택된 Chip 스타일: 배경 `var(--mg-color-primary-light)` (#4A6354), 텍스트 `#FAF9F7`, radius 100px
  - 자격 및 경력: Multiline Text Input
  - 등급: Select/Dropdown (Native Picker 또는 Bottom Sheet 형태)

### 3.4. 단위 컴포넌트 스타일 (Atoms / Molecules)
- **Form Input (텍스트 입력창)**:
  - 라벨: 12px, `var(--mg-color-text-secondary)` (#5C6B61), 입력창 상단에 위치 (gap: 4px)
  - 입력 영역: 배경 흰색(#FFFFFF), 테두리 1px solid `var(--mg-color-border-main)`, Radius 8px, 높이 44px
  - 입력 텍스트: 14px, `var(--mg-color-text-main)` (#2C2C2C)
- **Primary Action Button (저장 버튼)**:
  - 버튼 높이: 48px (모바일 터치 44px 이상 규격 만족)
  - 배경색: `var(--mg-color-primary-main)` (#3D5246)
  - 텍스트: 16px, fontWeight 600, 색상 `#FAF9F7`
  - Border Radius: 10px (`var(--mg-radius-10)`)

### 3.5. 사용 토큰 목록 (CSS / Theme Mapping)
Expo 앱 내 `theme.colors`에 매핑할 때, 아래의 B0KlA 기준 토큰명을 주석/기준으로 명시합니다.
- `var(--mg-color-background-main)` : `#FAF9F7` (전체 뷰 배경)
- `var(--mg-color-surface-main)` : `#F5F3EF` (카드 내부 배경)
- `var(--mg-color-primary-main)` : `#3D5246` (저장 버튼, 액센트 바, 선택된 상태)
- `var(--mg-color-primary-light)` : `#4A6354` (Chip 다중 선택 등 보조 주조색)
- `var(--mg-color-border-main)` : `#D4CFC8` (카드 외곽선, 인풋 테두리)
- `var(--mg-color-text-main)` : `#2C2C2C` (타이틀, 본문 내용)
- `var(--mg-color-text-secondary)` : `#5C6B61` (라벨, 플레이스홀더, 서브 텍스트)

## 4. 상호작용·상태 (States)
- **이메일 중복 확인 (Validation / onBlur)**:
  - 입력 중/검증 중: Input 우측에 ActivityIndicator(스피너) 노출
  - 사용 가능: Input 하단에 `theme.colors.success` 색상의 텍스트("사용 가능한 이메일입니다.")
  - 중복/실패: Input 하단 및 테두리에 시스템 에러 색상(Red) 적용 ("이미 사용 중인 이메일입니다.")
- **에러 처리**: 필수 값 누락 시 필드 테두리를 에러 색상으로 렌더링하고, 하단에 에러 문구를 표시합니다.
- **모바일 키보드 대응**: `KeyboardAvoidingView` 적용 시, 하단 고정 '저장' 버튼이 키보드 위로 밀려 올라가 가려지지 않고 탭할 수 있도록 구현합니다.
- **저장 완료 / 팝업**: 성공 또는 네트워크 실패 시, 공통 모듈인 `UnifiedModal`을 호출하여 사용자에게 명확히 인지시킵니다.

## 5. 참조 문서
- 화면설계서: `docs/design-system/SCREEN_SPEC_EXPO_ADMIN_CLIENT_CONSULTANT_CREATE.md`
- 펜슬 가이드 (B0KlA): `docs/design-system/PENCIL_DESIGN_GUIDE.md`
- 디자인 시스템 단일 소스: `mindgarden-design-system.pen`, `pencil-new.pen`
- 아토믹 공통 모듈 가이드: `docs/standards/COMMON_MODULES_USAGE_GUIDE.md`
- 팝업/알림 모듈: `UnifiedModal` (재사용)