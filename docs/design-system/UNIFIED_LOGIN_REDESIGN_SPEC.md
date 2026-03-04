# 통합 로그인 페이지 리뉴얼 화면 설계서 (UnifiedLogin Redesign Spec)

**작성일**: 2026-03-04
**역할**: core-designer
**대상**: `frontend/src/components/auth/UnifiedLogin.js` 및 관련 CSS

---

## 1. 개요 및 디자인 컨셉
- **목표**: 기존 단순 폼 형태의 통합 로그인 페이지를 현대적이고 세련된 좌우 분할(Split Screen) 레이아웃으로 전면 리뉴얼.
- **컨셉**: 데스크탑 환경에서는 화면을 5:5 비율로 분할하여 좌측에는 고품질 브랜딩 이미지(사진)를, 우측에는 로그인 폼을 배치. 모바일 환경에서는 이미지를 숨기거나 상단 배너로 축소하여 폼 위주의 UI 제공.
- **기준**: 마인드가든 어드민 대시보드 샘플 및 PENCIL_DESIGN_GUIDE.md의 시각 언어, `unified-design-tokens.css`의 `var(--mg-*)` 토큰 엄격 준수.

---

## 2. 레이아웃 구조 (Split Screen Layout)

### 2.1. 전체 컨테이너 (`mg-v2-login-container`)
- **Desktop (1024px 이상)**: `display: flex; height: 100vh; width: 100%;`
- **Mobile/Tablet (1023px 이하)**: `display: flex; flex-direction: column; height: 100vh;`

### 2.2. 좌측: 브랜딩 이미지 영역 (`mg-v2-login-hero`)
- **비율**: `flex: 1;` (데스크탑 기준 50%)
- **배경**: 고품질 사진 이미지 (예: `url('https://images.unsplash.com/photo-1542435503-956c469947f6?auto=format&fit=crop&q=80')`)
  - `background-size: cover; background-position: center;`
- **오버레이**: 이미지 위에 반투명 다크 오버레이 적용 (`background: rgba(44, 44, 44, 0.4);`)
- **콘텐츠**: 중앙에 마인드가든 로고(흰색) 및 짧은 브랜드 슬로건 텍스트 배치.
  - 텍스트 색상: `var(--mg-color-white)`
  - 타이포그래피: `font-size: 32px; font-weight: 700;`
- **반응형**: 모바일에서는 `display: none;` 또는 높이 `200px`의 상단 배너로 축소.

### 2.3. 우측: 로그인 폼 영역 (`mg-v2-login-content`)
- **비율**: `flex: 1;` (데스크탑 기준 50%)
- **배경**: `var(--mg-bg-primary)` (#FAF9F7)
- **정렬**: `display: flex; align-items: center; justify-content: center; padding: 48px;`
- **폼 컨테이너 (`mg-v2-login-form-wrapper`)**:
  - 최대 너비: `max-width: 400px; width: 100%;`
  - 내부 요소 간격: `gap: 24px;`

---

## 3. 아토믹 컴포넌트 및 토큰 매핑

### 3.1. 타이포그래피 (Atoms)
- **페이지 타이틀**: "환영합니다"
  - `font-size: 28px; font-weight: 700; color: var(--mg-text-primary); margin-bottom: 8px;`
- **서브 타이틀**: "마인드가든 서비스에 로그인하세요."
  - `font-size: 16px; color: var(--mg-text-secondary); margin-bottom: 32px;`

### 3.2. 입력 폼 (Molecules)
- **이메일/비밀번호 입력 필드 (`mg-v2-input`)**:
  - 배경: `var(--mg-surface-primary)` (#F5F3EF)
  - 테두리: `1px solid var(--mg-border-color)` (#D4CFC8)
  - Radius: `var(--mg-radius-md)` (8px)
  - 패딩: `12px 16px;`
  - 텍스트: `var(--mg-text-primary)`
  - Focus 상태: `border-color: var(--mg-primary-color); box-shadow: 0 0 0 2px rgba(61, 82, 70, 0.1);`
- **라벨 (`mg-v2-label`)**:
  - `font-size: 14px; font-weight: 500; color: var(--mg-text-primary); margin-bottom: 8px; display: block;`

### 3.3. 버튼 (Atoms)
- **기본 로그인 버튼 (`mg-v2-button-primary`)**:
  - 배경: `var(--mg-primary-color)` (#3D5246)
  - 텍스트: `var(--mg-color-white)`
  - Radius: `var(--mg-radius-lg)` (10px)
  - 높이: `48px;`
  - 너비: `100%;`
  - Hover: `background: var(--mg-primary-light);`

### 3.4. 소셜 로그인 (Molecules)
- **구분선 (`mg-v2-divider`)**:
  - "또는 다음으로 로그인" 텍스트 양옆에 1px 선 배치.
  - 텍스트 색상: `var(--mg-text-secondary)`
  - 선 색상: `var(--mg-border-color)`
- **카카오 로그인 버튼 (`mg-v2-button-kakao`)**:
  - 배경: `#FEE500`
  - 텍스트: `#000000` (85% opacity)
  - Radius: `var(--mg-radius-lg)` (10px)
  - 높이: `48px;`
  - 너비: `100%;`
  - 아이콘: 좌측에 카카오 심볼 아이콘 배치, 텍스트 중앙 정렬.
- **네이버 로그인 버튼 (`mg-v2-button-naver`)**:
  - 배경: `#03C75A`
  - 텍스트: `#FFFFFF`
  - Radius: `var(--mg-radius-lg)` (10px)
  - 높이: `48px;`
  - 너비: `100%;`
  - 아이콘: 좌측에 네이버 심볼 아이콘 배치, 텍스트 중앙 정렬.

---

## 4. 반응형 브레이크포인트 (Responsive)

- **Desktop (1024px 이상)**: 5:5 Split Screen.
- **Tablet (768px ~ 1023px)**: Split Screen 유지하되, 폼 영역 패딩 축소 (`padding: 32px;`).
- **Mobile (767px 이하)**:
  - `flex-direction: column;`
  - 좌측 이미지 영역 숨김 (`display: none;`) 또는 상단 로고 영역으로 대체.
  - 우측 폼 영역이 전체 화면 차지 (`width: 100%; padding: 24px;`).

---

## 5. 코더(core-coder) 전달 사항
- `UnifiedLogin.js`의 기존 비즈니스 로직(API 호출, 세션 체크, `kakaoLogin`, `naverLogin` 함수 등)은 절대 수정하지 말고 그대로 유지할 것.
- 본 설계서에 명시된 CSS 클래스명(`mg-v2-*`)과 디자인 토큰(`var(--mg-*)`)을 사용하여 마크업 및 스타일을 전면 교체할 것.
- 소셜 로그인 버튼은 기존 기능을 유지하면서 스타일만 본 설계서에 맞게 세련되게 업데이트할 것.
