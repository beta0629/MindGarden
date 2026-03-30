# MindGarden 디자인 시스템 v2.0 - CSS 클래스 레퍼런스

**작성일**: 2025-01-XX  
**버전**: 1.0

## 📚 목차

1. [클래스 네이밍 규칙](#클래스-네이밍-규칙)
2. [주요 클래스 그룹](#주요-클래스-그룹)
3. [디자인 토큰](#디자인-토큰)
4. [유틸리티 클래스](#유틸리티-클래스)

---

## 클래스 네이밍 규칙

### 네이밍 패턴
- **v2 클래스**: `.mg-v2-*` 접두사 사용
- **레거시 클래스**: `.mg-*` 접두사 (점진적 마이그레이션 중)
- **BEM 형식**: `.mg-v2-component--modifier` 형식 권장

### 예시
```css
/* ✅ 올바른 형식 */
.mg-v2-button
.mg-v2-button--primary
.mg-v2-button--small
.mg-v2-dashboard-stat-card

/* ⚠️ 레거시 (마이그레이션 예정) */
.mg-button
.mg-button-primary
```

---

## 주요 클래스 그룹

### 1. 대시보드 레이아웃

#### 레이아웃 컨테이너
- `.mg-dashboard-layout` - 메인 대시보드 레이아웃
- `.mg-v2-dashboard-layout` - v2 대시보드 레이아웃

#### 헤더
- `.mg-dashboard-header` - 대시보드 헤더
- `.mg-v2-dashboard-header` - v2 헤더
- `.mg-dashboard-header-content` - 헤더 내용 영역
- `.mg-dashboard-header-left` - 헤더 왼쪽 영역
- `.mg-dashboard-header-right` - 헤더 오른쪽 영역
- `.mg-dashboard-title` - 대시보드 제목
- `.mg-dashboard-subtitle` - 대시보드 부제목

#### 통계 영역
- `.mg-dashboard-stats` - 통계 카드 그리드
- `.mg-dashboard-stat-card` - 통계 카드
- `.mg-v2-dashboard-stat-card` - v2 통계 카드
- `.mg-dashboard-stat-icon` - 통계 아이콘
- `.mg-dashboard-stat-content` - 통계 내용
- `.mg-dashboard-stat-value` - 통계 값
- `.mg-dashboard-stat-label` - 통계 라벨

### 2. 버튼 클래스

#### 기본 버튼
- `.mg-v2-button` - v2 기본 버튼 (권장)
- `.mg-button` - 레거시 버튼 (마이그레이션 예정)

#### Variant
- `.mg-v2-button--primary` - 주요 버튼
- `.mg-v2-button--secondary` - 보조 버튼
- `.mg-v2-button--success` - 성공 버튼
- `.mg-v2-button--danger` - 위험 버튼
- `.mg-v2-button--warning` - 경고 버튼
- `.mg-v2-button--outline` - 아웃라인 버튼
- `.mg-v2-button--ghost` - 고스트 버튼

#### 크기
- `.mg-v2-button--small` 또는 `.mg-v2-button-sm` - 작은 버튼
- `.mg-v2-button--medium` - 중간 버튼 (기본)
- `.mg-v2-button--large` 또는 `.mg-v2-button-lg` - 큰 버튼

#### 상태
- `.mg-v2-button:disabled` - 비활성화 상태
- `.mg-v2-button--full-width` - 전체 너비 버튼

### 3. 카드 클래스

#### 기본 카드
- `.mg-v2-card` - v2 기본 카드
- `.mg-card` - 레거시 카드
- `.mg-stat-card` - 통계 카드 (레거시)
- `.mg-dashboard-stat-card` - 대시보드 통계 카드

#### 카드 변형
- `.mg-v2-card-glass` - 글래스 효과 카드
- `.mg-v2-card--clickable` - 클릭 가능한 카드
- `.mg-card-border` - 테두리 강조 카드
- `.mg-card-floating` - 플로팅 효과 카드

#### 카드 구조
- `.mg-v2-card-header` - 카드 헤더
- `.mg-v2-card-content` - 카드 내용
- `.mg-v2-card-footer` - 카드 푸터

### 4. 폼 클래스

#### 입력 필드
- `.mg-v2-form-input` - 입력 필드
- `.mg-v2-form-select` - 셀렉트 박스
- `.mg-v2-form-textarea` - 텍스트 영역
- `.mg-v2-form-label` - 라벨
- `.mg-v2-form-group` - 폼 그룹
- `.mg-v2-form-error` - 에러 메시지

### 5. 섹션 클래스

#### 섹션
- `.dashboard-section` - 대시보드 섹션
- `.dashboard-section-header` - 섹션 헤더
- `.dashboard-section-content` - 섹션 내용
- `.mg-v2-section` - v2 섹션

### 6. 그리드 클래스

#### 그리드 레이아웃
- `.mg-v2-stats-grid` - 통계 그리드
- `.mg-management-grid` - 관리 카드 그리드
- `.mg-stats-grid` - 통계 그리드 (레거시)

### 7. 모달 클래스

#### 모달
- `.mg-v2-modal` - v2 모달
- `.mg-v2-modal-overlay` - 모달 오버레이
- `.mg-v2-modal-header` - 모달 헤더
- `.mg-v2-modal-title` - 모달 제목
- `.mg-v2-modal-body` - 모달 본문
- `.mg-v2-modal-close` - 모달 닫기 버튼
- `.mg-v2-modal-large` - 큰 모달

### 8. 상태 클래스

#### 빈 상태
- `.mg-empty-state` - 빈 상태 컨테이너
- `.mg-empty-state__icon` - 빈 상태 아이콘
- `.mg-empty-state__text` - 빈 상태 텍스트

### 9. 시스템 도구

#### 시스템 도구 카드
- `.mg-system-tool-card` - 시스템 도구 카드
- `.mg-system-tool-button` - 시스템 도구 버튼
- `.mg-system-tool-icon` - 시스템 도구 아이콘
- `.mg-system-tool-content` - 시스템 도구 내용
- `.mg-system-tool-label` - 시스템 도구 라벨
- `.mg-system-tool-description` - 시스템 도구 설명

---

## 디자인 토큰

### CSS 변수 사용

모든 스타일은 CSS 변수를 사용해야 합니다:

```css
/* ✅ 올바른 방법 */
.my-component {
  color: var(--color-primary);
  padding: var(--spacing-md);
  border-radius: var(--radius-md);
  background: var(--color-bg-primary);
}

/* ❌ 잘못된 방법 */
.my-component {
  color: #007bff;
  padding: 16px;
  border-radius: 8px;
  background: #ffffff;
}
```

### 주요 디자인 토큰

#### 색상
- `--color-primary` - 주요 색상
- `--color-secondary` - 보조 색상
- `--status-success` - 성공 색상
- `--status-error` - 에러 색상
- `--status-warning` - 경고 색상
- `--status-info` - 정보 색상

#### 간격 (Spacing)
- `--spacing-xs` - 매우 작은 간격
- `--spacing-sm` - 작은 간격
- `--spacing-md` - 중간 간격 (기본)
- `--spacing-lg` - 큰 간격
- `--spacing-xl` - 매우 큰 간격

#### 반경 (Border Radius)
- `--radius-sm` - 작은 반경
- `--radius-md` - 중간 반경
- `--radius-lg` - 큰 반경
- `--radius-xl` - 매우 큰 반경

#### 폰트 크기
- `--font-size-xs` - 매우 작은 텍스트
- `--font-size-sm` - 작은 텍스트
- `--font-size-base` - 기본 텍스트
- `--font-size-lg` - 큰 텍스트
- `--font-size-xl` - 매우 큰 텍스트

---

## 유틸리티 클래스

### 간격 (Margin)
- `.mg-mt-xs`, `.mg-mt-sm`, `.mg-mt-md`, `.mg-mt-lg`, `.mg-mt-xl` - 상단 마진
- `.mg-mb-xs`, `.mg-mb-sm`, `.mg-mb-md`, `.mg-mb-lg`, `.mg-mb-xl` - 하단 마진
- `.mg-p-xs`, `.mg-p-sm`, `.mg-p-md`, `.mg-p-lg`, `.mg-p-xl` - 패딩

### 텍스트 정렬
- `.mg-text-center` - 중앙 정렬
- `.mg-text-left` - 왼쪽 정렬
- `.mg-text-right` - 오른쪽 정렬

### 텍스트 크기
- `.mg-text-xs` - 매우 작은 텍스트
- `.mg-text-sm` - 작은 텍스트
- `.mg-text-lg` - 큰 텍스트

### 폰트 굵기
- `.mg-font-medium` - 중간 굵기 (500)
- `.mg-font-semibold` - 세미볼드 (600)
- `.mg-font-bold` - 볼드 (700)

### 색상
- `.mg-color-text-primary` - 주요 텍스트 색상
- `.mg-color-text-secondary` - 보조 텍스트 색상

---

## 🔗 관련 문서

- [컴포넌트 사용 가이드](./COMPONENT_USAGE_GUIDE.md)
- [디자인 시스템 가이드](./MINDGARDEN_DESIGN_SYSTEM_GUIDE.md)
- [중복 클래스 통합 계획](./DUPLICATE_CSS_CLASSES.md)

---

**마지막 업데이트**: 2025-01-XX

**참고**: 이 문서는 자동 생성된 것이 아닙니다. 클래스가 추가되거나 변경될 때 수동으로 업데이트해야 합니다.

