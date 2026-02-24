# 상담사 및 내담자 카드 통합 디자인 스펙 (mg-v2-profile-card)

## 1. 개요
현재 다르게 구현되어 있는 상담사 관리 페이지의 카드(`ConsultantComprehensiveManagement.js`)와 내담자 관리 페이지의 카드(`ClientOverviewTab.js`) UI를 아토믹 디자인 원칙에 따라 하나의 통합된 프로필 카드(`mg-v2-profile-card`) 컴포넌트 스펙으로 통일합니다.

## 2. 통합 카드 레이아웃 구조 (mg-v2-profile-card)

두 카드 모두 아래의 동일한 DOM 구조와 CSS 클래스 체계를 사용해야 합니다.

### 2.1. DOM 구조 및 클래스명 정의

```html
<div class="mg-v2-profile-card">
  <!-- 1. Header 영역 -->
  <div class="mg-v2-profile-card__header">
    <div class="mg-v2-profile-card__avatar">
      <!-- 아바타 이미지 또는 텍스트/아이콘 -->
    </div>
    <div class="mg-v2-profile-card__info">
      <h3 class="mg-v2-profile-card__name">이름</h3>
      <div class="mg-v2-profile-card__contact">
        <span class="mg-v2-profile-card__email"><MailIcon /> email@example.com</span>
        <span class="mg-v2-profile-card__phone"><PhoneIcon /> 010-0000-0000</span>
      </div>
    </div>
    <div class="mg-v2-profile-card__badges">
      <!-- 상태 배지, 등급 배지 등 -->
      <span class="mg-v2-status-badge">활성</span>
      <span class="mg-v2-grade-badge">VIP</span>
    </div>
  </div>

  <!-- 2. Body 영역 (통계 및 상세 정보) -->
  <div class="mg-v2-profile-card__body">
    <div class="mg-v2-profile-card__stats-grid">
      <!-- Stat Items -->
      <div class="mg-v2-profile-card__stat-item">
        <span class="mg-v2-profile-card__stat-label">가입일</span>
        <span class="mg-v2-profile-card__stat-value">2024. 01. 01</span>
      </div>
      <!-- 기타 통계 항목들... -->
    </div>
    
    <!-- 특이사항이나 전문분야 등 1단으로 길게 들어가는 부가 정보 -->
    <div class="mg-v2-profile-card__extra-info">
      <span class="mg-v2-profile-card__extra-label">전문분야:</span>
      <span class="mg-v2-profile-card__extra-value">심리상담, 우울증</span>
    </div>
  </div>

  <!-- 3. Footer 영역 (액션 버튼) -->
  <div class="mg-v2-profile-card__footer">
    <div class="mg-v2-profile-card__actions">
      <!-- Buttons -->
    </div>
  </div>
</div>
```

## 3. 세부 영역별 디자인 스펙 및 토큰

모든 CSS는 반드시 `--ad-b0kla-*` 또는 `--mg-*` 형태의 통합 디자인 토큰을 사용합니다.

### 3.1. Container (`mg-v2-profile-card`)
- **Background**: `var(--color-surface)` (또는 `var(--color-background-light)`)
- **Border**: `1px solid var(--color-border-light)`
- **Border Radius**: `var(--radius-lg)` (16px)
- **Padding**: `var(--spacing-lg)` (24px)
- **Gap (내부 레이아웃)**: `var(--spacing-md)` (16px)
- **Transition**: `all 0.2s ease-in-out`
- **Hover Effect**:
  - `transform: translateY(-2px)`
  - `box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08)`
  - `border-color: var(--color-border-focus)`

### 3.2. Header (`mg-v2-profile-card__header`)
- **Layout**: `display: flex; gap: var(--spacing-md); align-items: flex-start; position: relative;`
- **Avatar (`__avatar`)**: 
  - Size: `48px x 48px`
  - Background: `var(--color-background-alt)`
  - Color: `var(--color-primary)`
  - Border Radius: `50%` (원형)
  - 내용: 상담사는 이름 첫 글자, 내담자는 `lucide-react`의 `User` 아이콘 활용 권장.
- **Info (`__info`)**: 
  - `flex: 1`
  - Name: `font-size: var(--font-size-lg); font-weight: var(--font-weight-semibold); color: var(--color-text-primary);`
  - Contact: `display: flex; flex-direction: column; gap: 4px; font-size: var(--font-size-sm); color: var(--color-text-secondary);`
  - 이메일/전화번호 앞에는 직관적인 아이콘(`Mail`, `Phone`)을 `12px` 사이즈로 배치.
- **Badges (`__badges`)**:
  - `position: absolute; top: 0; right: 0; display: flex; gap: var(--spacing-xs);`

### 3.3. Body (`mg-v2-profile-card__body`)
- **Stats Grid (`__stats-grid`)**: 
  - `display: grid; grid-template-columns: repeat(3, 1fr); gap: var(--spacing-sm);`
  - 배경색 없이 깔끔하게 텍스트로만 정보 제공하거나, 필요 시 아주 연한 백그라운드(`var(--color-background-alt)`)와 `radius-md`, `padding-sm` 적용.
- **Stat Item (`__stat-item`)**:
  - `display: flex; flex-direction: column; gap: 4px;`
  - Label: `font-size: var(--font-size-xs); color: var(--color-text-secondary);`
  - Value: `font-size: var(--font-size-md); font-weight: var(--font-weight-medium); color: var(--color-text-primary);`
- **Extra Info (`__extra-info`)**:
  - `margin-top: var(--spacing-sm); padding-top: var(--spacing-sm); border-top: 1px dashed var(--color-border-light);`
  - 긴 텍스트(특이사항 등) 처리: `line-height: 1.5; font-size: var(--font-size-sm); color: var(--color-text-secondary);`

### 3.4. Footer & Actions (`mg-v2-profile-card__footer`)
- **Layout**: `margin-top: var(--spacing-md); display: flex; justify-content: flex-end; align-items: center;`
- **Actions (`__actions`)**: `display: flex; gap: var(--spacing-sm); flex-wrap: wrap; justify-content: flex-end; width: 100%;`

#### 3.4.1. 버튼 디자인 규칙 (Button 컴포넌트 사용)
모든 버튼은 공통 아토믹 컴포넌트인 `<Button>` (또는 `.mg-v2-button`)을 사용하며, **반드시 `size="small"`** 을 적용합니다. 아이콘은 좌측에 배치합니다.

**버튼 배치 순서 (우측 정렬 시 시각적 흐름)**:
1. `상세보기` (variant="secondary" / icon: `<Eye size={14}/>`)
2. `수정` (variant="primary" / icon: `<Edit size={14}/>`)
3. `비밀번호 초기화` (variant="secondary" / icon: `<Key size={14}/>`)
4. `삭제` (variant="danger" / icon: `<Trash2 size={14}/>`)

*(해당 카드에 없는 기능의 버튼은 생략하며, 존재하는 버튼들끼리는 위 순서를 유지합니다)*

## 4. core-coder를 위한 체크리스트 (구현 시 주의사항)

- [ ] **클래스명 마이그레이션**:
  - 기존 상담사 카드: `mg-v2-consultant-card` ➔ `mg-v2-profile-card`
  - 기존 내담자 카드: `mg-v2-client-card mg-v2-card` ➔ `mg-v2-profile-card`
  - 구조 전체를 위 `2.1. DOM 구조` 스펙에 맞게 개편
- [ ] **아이콘 통일**:
  - 기존 `react-icons` (FaUser, FaEdit 등) ➔ `lucide-react` (User, Edit, Trash2, Eye, Key, Mail, Phone)로 통일 (프로젝트 표준에 맞춰 통일성 부여)
- [ ] **버튼 컴포넌트 속성 통일**:
  - 기존에 제각각이던 버튼의 `variant`를 스펙에 맞게 조정 (특히 내담자 삭제 버튼은 기존 `secondary`에서 `danger`로 수정 필수)
  - 모든 카드 내 버튼에 `size="small"` 속성 부여 확인
- [ ] **정보 표시 매핑 (상담사)**:
  - 통계 3단 그리드: 가입일 / 총 클라이언트 / (빈 칸 혹은 기타 지표)
  - Extra Info: 전문분야 (`specialty`)
- [ ] **정보 표시 매핑 (내담자)**:
  - 통계 3단 그리드: 등록일 / 매칭 수 / 상담 수
  - Extra Info: 특이사항 (`notes`)
- [ ] **스타일 구현**: CSS 모듈이나 글로벌 스타일 파일에 `.mg-v2-profile-card` 관련 스타일 블록을 새로 작성하고 하드코딩된 색상 대신 `var(--color-...)` 토큰만 사용해 구현.