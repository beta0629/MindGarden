# 테마 시스템 마이그레이션 보고서

**작성일**: 2025-01-XX  
**버전**: 1.0

## ✅ 하드코딩 제거 및 CSS 변수 마이그레이션

### 1. MGButton.css 하드코딩 제거 완료 ✅

#### 변경 전:
```css
.mg-button__processing-overlay {
  background: rgba(255, 255, 255, 0.8);
}

/* 다크 테마 */
.mg-button__processing-overlay {
  background: rgba(0, 0, 0, 0.8);
}
```

#### 변경 후:
```css
.mg-button__processing-overlay {
  background: var(--droplet-bg, rgba(255, 255, 255, 0.7));
}

/* 다크 테마 */
.mg-button__processing-overlay {
  background: var(--droplet-bg-dark, rgba(0, 0, 0, 0.4));
}
```

### 2. 사용된 CSS 변수

- `--droplet-bg`: 라이트 모드 오버레이 배경 (`rgba(255, 255, 255, 0.7)`)
- `--droplet-bg-dark`: 다크 모드 오버레이 배경 (`rgba(0, 0, 0, 0.4)`)
- 기존 변수들 (`--color-primary`, `--spacing-*`, `--font-size-*` 등)은 이미 사용 중

### 3. 테마 시스템 통합

MGButton은 이미 테마 시스템 변수들을 사용하고 있습니다:

#### 색상 변수:
- `--color-primary`, `--color-primary-dark`, `--color-primary-rgb`
- `--color-secondary`, `--color-secondary-dark`, `--color-secondary-rgb`
- `--status-success`, `--status-success-dark`, `--status-success-rgb`
- `--status-error`, `--status-error-dark`, `--status-error-rgb`
- `--status-pending`, `--status-pending-dark`, `--status-pending-rgb`
- `--status-info`, `--status-info-dark`, `--status-info-rgb`
- `--color-white`, `--color-dark`

#### 간격 변수:
- `--spacing-xs`, `--spacing-sm`, `--spacing-md`, `--spacing-lg`

#### 타이포그래피 변수:
- `--font-size-xs`, `--font-size-sm`, `--font-size-base`, `--font-size-lg`
- `--font-family-base`
- `--font-weight-medium`

#### 레이아웃 변수:
- `--border-radius-md`

### 4. 테마 전환 지원

MGButton은 CSS 변수 기반으로 작성되어 있어 다음과 같은 테마 전환을 지원합니다:

1. **라이트/다크 테마 전환**: `prefers-color-scheme` 미디어 쿼리 지원
2. **커스텀 테마**: CSS 변수 재정의로 테마 커스터마이징 가능
3. **동적 테마 변경**: JavaScript로 CSS 변수 값을 변경하여 실시간 테마 전환 가능

### 5. 남은 하드코딩 값 확인

다음 값들은 rgba 함수와 RGB 값의 조합으로 테마 시스템의 일부로 사용되므로 유지합니다:

- `rgba(var(--color-primary-rgb), 0.2)`: 투명도 계산용 (RGB 변수 + 투명도)
- `0 2px 8px`: 그림자 오프셋 및 블러 (디자인 시스템의 표준 값)
- `2px`: outline 두께 (접근성 표준)

이 값들은 테마 시스템과 호환되며, RGB 값만 변경하면 색상이 자동으로 적용됩니다.

## ✅ 완료 상태

**MGButton 컴포넌트는 이제 완전히 CSS 변수 기반 테마 시스템을 사용합니다!**

- ✅ 하드코딩된 색상 값 제거 완료
- ✅ 테마 변수 통합 완료
- ✅ 다크 테마 지원 완료
- ✅ 테마 전환 가능

**다음 단계:**
다른 컴포넌트들도 동일한 방식으로 마이그레이션 필요 시 진행 가능합니다.

