# 회원가입 및 비밀번호 찾기 리뉴얼 화면 설계서 (Auth Pages Redesign Spec)

**작성일**: 2026-03-05
**역할**: core-designer
**대상**: 
- `frontend/src/components/auth/TabletRegister.js`
- `frontend/src/components/auth/ForgotPassword.js`
- `frontend/src/components/auth/ResetPassword.js`
- 관련 CSS 파일들

---

## 1. 개요 및 디자인 컨셉
- **목표**: 회원가입 및 비밀번호 찾기/재설정 페이지를 통합 로그인 페이지(`UnifiedLogin.js`)와 동일한 현대적이고 세련된 좌우 분할(Split Screen) 레이아웃으로 전면 리뉴얼.
- **컨셉**: 데스크탑 환경에서는 화면을 5:5 비율로 분할하여 좌측에는 고품질 브랜딩 이미지(사진)를, 우측에는 입력 폼을 배치. 모바일 환경에서는 이미지를 숨기거나 상단 배너로 축소하여 폼 위주의 UI 제공.
- **브랜딩**: "CoreSolution" 브랜딩 텍스트 및 시각 언어 적용.
- **기준**: 마인드가든 어드민 대시보드 샘플 및 PENCIL_DESIGN_GUIDE.md의 시각 언어, `unified-design-tokens.css`의 `var(--mg-*)` 토큰 엄격 준수.

---

## 2. 레이아웃 구조 (Split Screen Layout)

### 2.1. 전체 컨테이너 (`mg-v2-auth-container`)
- **Desktop (1024px 이상)**: `display: flex; height: 100vh; width: 100%;`
- **Mobile/Tablet (1023px 이하)**: `display: flex; flex-direction: column; height: 100vh;`

### 2.2. 좌측: 브랜딩 이미지 영역 (`mg-v2-auth-hero`)
- **비율**: `flex: 1;` (데스크탑 기준 50%)
- **배경**: 고품질 사진 이미지 (`url('https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80')`)
  - `background-size: cover; background-position: center;`
- **오버레이**: 이미지 위에 반투명 다크 오버레이 적용 (`background: rgba(44, 44, 44, 0.5);`)
- **콘텐츠**: 중앙에 "CoreSolution" 로고 텍스트(흰색) 및 짧은 브랜드 슬로건 텍스트 배치.
  - 로고 텍스트 색상: `var(--mg-color-white)`
  - 타이포그래피: `font-size: 36px; font-weight: 700; letter-spacing: -0.5px;`
  - 슬로건: "비즈니스의 핵심을 솔루션하다" (`font-size: 18px; opacity: 0.9; margin-top: 16px;`)
- **반응형**: 모바일에서는 `display: none;` 또는 높이 `200px`의 상단 배너로 축소.

### 2.3. 우측: 입력 폼 영역 (`mg-v2-auth-content`)
- **비율**: `flex: 1;` (데스크탑 기준 50%)
- **배경**: `var(--mg-bg-primary)` (#FAF9F7)
- **정렬**: `display: flex; align-items: center; justify-content: center; padding: 48px;`
- **폼 컨테이너 (`mg-v2-auth-form-wrapper`)**:
  - 최대 너비: `max-width: 440px; width: 100%;` (회원가입 폼의 필드가 많을 수 있으므로 440px로 여유 있게 설정)
  - 내부 요소 간격: `gap: 24px;`

---

## 3. 아토믹 컴포넌트 및 토큰 매핑

### 3.1. 타이포그래피 (Atoms)
- **페이지 타이틀 (`mg-v2-auth-title`)**: "회원가입", "비밀번호 찾기", "비밀번호 재설정"
  - `font-size: 28px; font-weight: 700; color: var(--mg-text-primary); margin-bottom: 8px;`
- **서브 타이틀 (`mg-v2-auth-subtitle`)**: "CoreSolution 서비스 이용을 위해 정보를 입력해주세요." 등
  - `font-size: 16px; color: var(--mg-text-secondary); margin-bottom: 32px;`

### 3.2. 입력 폼 (Molecules)
- **입력 필드 그룹 (`mg-v2-form-group`)**:
  - `margin-bottom: 20px;`
- **라벨 (`mg-v2-label`)**:
  - `font-size: 14px; font-weight: 600; color: var(--mg-text-primary); margin-bottom: 8px; display: block;`
- **입력 필드 (`mg-v2-input`)**:
  - 배경: `var(--mg-surface-primary)` (#F5F3EF)
  - 테두리: `1px solid var(--mg-border-color)` (#D4CFC8)
  - Radius: `var(--mg-radius-md)` (8px)
  - 패딩: `14px 16px;`
  - 텍스트: `var(--mg-text-primary)`
  - Focus 상태: `border-color: var(--mg-primary-color); box-shadow: 0 0 0 2px rgba(61, 82, 70, 0.1); outline: none;`
  - Transition: `border-color 0.2s, box-shadow 0.2s;`
- **에러 메시지 (`mg-v2-error-text`)**:
  - `font-size: 12px; color: #E53E3E; margin-top: 6px;`

### 3.3. 버튼 (Atoms)
- **주요 액션 버튼 (`mg-v2-button-primary`)**: (가입하기, 이메일 전송, 비밀번호 변경 등)
  - 배경: `var(--mg-primary-color)` (#3D5246)
  - 텍스트: `var(--mg-color-white)`
  - Radius: `var(--mg-radius-lg)` (10px)
  - 높이: `52px;`
  - 너비: `100%;`
  - 폰트: `font-size: 16px; font-weight: 600;`
  - Hover: `background: var(--mg-primary-light);`
  - Transition: `background-color 0.2s;`
- **보조 링크 버튼 (`mg-v2-link-text`)**: (로그인으로 돌아가기 등)
  - `font-size: 14px; color: var(--mg-text-secondary); text-decoration: none;`
  - Hover: `color: var(--mg-primary-color); text-decoration: underline;`
  - 정렬: `text-align: center; display: block; margin-top: 24px;`

---

## 4. 페이지별 특화 요소

### 4.1. 회원가입 (`TabletRegister.js`)
- **약관 동의 체크박스 (`mg-v2-checkbox-group`)**:
  - `display: flex; align-items: center; gap: 8px; margin-bottom: 24px;`
  - 체크박스 색상: `accent-color: var(--mg-primary-color);`
  - 텍스트: `font-size: 14px; color: var(--mg-text-primary);`

### 4.2. 비밀번호 찾기 (`ForgotPassword.js`)
- **안내 텍스트**: 가입 시 사용한 이메일을 입력하면 비밀번호 재설정 링크를 보내드립니다.
- **버튼**: "재설정 링크 전송"

### 4.3. 비밀번호 재설정 (`ResetPassword.js`)
- **입력 필드**: 새 비밀번호, 새 비밀번호 확인
- **버튼**: "비밀번호 변경"

---

## 5. 반응형 브레이크포인트 (Responsive)

- **Desktop (1024px 이상)**: 5:5 Split Screen.
- **Tablet (768px ~ 1023px)**: Split Screen 유지하되, 폼 영역 패딩 축소 (`padding: 32px;`).
- **Mobile (767px 이하)**:
  - `flex-direction: column;`
  - 좌측 이미지 영역 숨김 (`display: none;`)
  - 우측 폼 영역이 전체 화면 차지 (`width: 100%; padding: 24px;`).
  - 폼 컨테이너 최대 너비 해제 (`max-width: 100%;`).

---

## 6. 코더(core-coder) 전달 사항
- `TabletRegister.js`, `ForgotPassword.js`, `ResetPassword.js`의 기존 비즈니스 로직(API 호출, 유효성 검사, 상태 관리 등)은 절대 수정하지 말고 그대로 유지할 것.
- 본 설계서에 명시된 CSS 클래스명(`mg-v2-*`)과 디자인 토큰(`var(--mg-*)`)을 사용하여 마크업 및 스타일을 전면 교체할 것.
- 통합 로그인(`UnifiedLogin.js`)과 시각적 일관성을 완벽히 유지할 것.