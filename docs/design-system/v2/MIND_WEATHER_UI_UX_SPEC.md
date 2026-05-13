# 마음 날씨 (MindWeather) UI/UX 스펙

> **작성일**: 2026-05-13
> **작성자**: core-designer
> **설명**: AI 감정 분석 및 상담사 옵트인(Opt-in) 공유 기능에 대한 시각 스펙 및 와이어프레임. `core-coder`의 Phase 4 구현 기준.

## 1. 디자인 원칙 및 테마
- **내담자 앱**: 따뜻한 코랄(`var(--mg-client-primary)`) + 크림(`var(--mg-client-bg-main)`)
- **상담사 앱**: 차분한 그린(`var(--mg-consultant-primary)`) + 민트 배경
- **입력 최소화**: 키보드 노출 최소화, 태그/칩 기반.
- **거버넌스**: 진단이 아님을 명시(UI 고정 텍스트), 프라이버시 우선(명시적 옵트인).

## 2. 화면 IA (Information Architecture)

### 2.1 내담자 (Client)
```text
웰니스 (탭)
└── 마음 날씨
    ├── 감정 기록 폼 (텍스트 메모, 음성녹음 버튼, 감정 이모지)
    ├── AI 분석 로딩 (스켈레톤 / Lottie)
    ├── 마음 날씨 결과 카드 (키워드 칩, 한줄 요약, [진단 아님] 문구)
    └── 상담사 공유 제안 모달 (바텀 시트)
        ├── 공유할 항목 선택 (요약/키워드 vs 원문)
        └── 동의 및 제출
```

### 2.2 상담사 (Consultant)
```text
홈 (대시보드) / 내담자 상세 (탭)
└── 마음 날씨 알림 위젯 / 인사이트 카드
    ├── 내담자 이름 + 전송 날짜
    ├── AI 분석 한줄 요약
    ├── 주요 키워드 (다중)
    └── 원문 보기 (내담자가 원문 공유 동의 시에만 활성화)
```

## 3. 컴포넌트 스펙 (Atomic Design)

### 3.1 Molecules
- **`EmotionChip`**: 선택된 감정을 나타내는 둥근 칩.
  - 배경: `var(--mg-client-primary-light)`
  - 텍스트: `var(--mg-color-text-main)`, 14px
- **`VoiceRecordButton`**: 마이크 아이콘(Lucide `Mic`) 플로팅 버튼. 탭 시 녹음 중 애니메이션(Pulse).
- **`OptInToggle`**: 프라이버시 공유 토글. (Switch UI)

### 3.2 Organisms
- **`WeatherResultCard`**
  - **배경**: `var(--mg-client-surface)`
  - **테두리**: 1px `var(--mg-gray-300)`, 반경 16px (`var(--mg-radius-lg)`)
  - **헤더**: 날씨/감정 일러스트 아이콘 + "AI가 분석한 오늘의 마음"
  - **본문**: 
    - 키워드 그룹 (`EmotionChip` 목록)
    - 한줄 요약 (`var(--mg-color-text-main)`, 16px, 1.5 lineHeight)
  - **푸터**: "[참고용] 진단 결과가 아닙니다." (`var(--mg-color-text-secondary)`, 12px)
- **`ShareProposalBottomSheet`**
  - 바텀 시트 구조 (`@gorhom/bottom-sheet` 또는 `UnifiedModal` 바텀 타입)
  - 배경 블러 처리 (`expo-blur` / CSS backdrop-filter)
  - 일러스트 + 공유 안내 카피
  - 권한 토글 리스트 (1. 요약/키워드 공유 [기본 ON], 2. 원문 공유 [기본 OFF])
  - "상담사에게 공유하기" / "나만 보기" CTA

## 4. 와이어프레임 및 상태별 화면

### 4.1 Empty State (기록 전)
- **비주얼**: 흐린 구름 일러스트 (`var(--mg-gray-300)` 톤)
- **카피**: "오늘 하루 어떤 일이 있었나요? 짧게 남겨주시면 마음 날씨를 분석해 드려요."
- **액션**: "기록 시작하기" CTA (`var(--mg-client-primary)` 배경)

### 4.2 Loading State (AI 분석 중)
- **비주얼**: `react-native-skeleton-placeholder` 또는 CSS Pulse 애니메이션이 적용된 카드. 구름이 걷히고 해가 뜨는 형태의 부드러운 Lottie 애니메이션(선택).
- **카피**: "마음의 날씨를 읽고 있어요..."

### 4.3 Filled State (분석 완료 및 트렌드)
- **결과 카드**: `WeatherResultCard` 표시.
- **트렌드 알림**: 주간 대비 특정 키워드(예: 불안) 상승 시, 결과 카드 상단에 연한 경고 배경(`var(--mg-color-error)` 투명도 10%)으로 "최근 '불안' 키워드가 자주 나타나요. 상담사님과 이야기해볼까요?" 표시.

## 5. 카피 초안 (법무 검토 필요 ⚠️)

- **AI 분석 하단 고지**: 
  - "이 분석은 기록을 돕기 위한 참고용으로, 의학적 진단이 아닙니다."
- **공유 옵트인 모달 제목**: 
  - "분석된 마음 날씨를 상담사님과 공유할까요?"
- **공유 항목 동의 카피**:
  - [필수] "상담 진행을 위한 AI 요약 및 감정 키워드 제공에 동의합니다."
  - [선택] "작성한 일기/메모 원문을 함께 제공하는 것에 동의합니다."
- **정보 보관/철회 안내**:
  - "공유된 정보는 상담 목적 외에 사용되지 않으며, 언제든 설정에서 공유를 철회할 수 있습니다."

## 6. Expo (모바일) & 웹 공통 원칙
- **접근성(A11y)**: `accessibilityLabel` 필수. "음성 녹음 시작 버튼", "공유 동의 체크박스".
- **안전 경계**: 웹앱의 경우 `safeDisplay` 함수로 AI 응답 텍스트 렌더링.
- **인터랙션**: 바텀 시트는 드래그(스와이프 다운)로 닫을 수 있어야 함. 터치 타겟은 최소 44x44px 유지.
