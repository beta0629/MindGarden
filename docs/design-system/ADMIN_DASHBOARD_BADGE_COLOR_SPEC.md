# 관리자 대시보드 성장 배지(Growth Badge) 색상 UI/UX 스펙

## 1. 개요 및 배경
- **목적**: 어드민 대시보드 KPI, 상담 현황, 추이 비교 영역의 성장 지표(증가/감소/신규) 배지가 눈에 띄지 않고 이전 피드백(테두리 제거)이 반영되지 않은 이슈 해결
- **개선 방향**:
  - 증가 = 붉은색 계열 (주식 상승 색상)
  - 감소 = 파란색 계열 (주식 하락 색상)
  - 공통 속성 = 명확한 파스텔톤 배경, 테두리 없음, WCAG 접근성을 고려한 텍스트 명도 대비 적용

## 2. 레이아웃/아이디어 (선정된 안과 이유)
- 주식 UI에서 흔히 쓰이는 **적상승/청하락** 멘탈 모델을 차용하여 관리자가 성장 지표의 긍정/부정 변화를 직관적으로 인지하도록 변경.
- 이전 피드백을 수용하여 `border`는 제거하고 배경의 면적만으로 캡슐 형태를 인지하도록 **파스텔 톤 배경 + 진한 톤의 텍스트** 조합을 채택.

## 3. 세부 UI/UX 스펙

### 공통 스타일
- **Border**: `none` (테두리 완전 제거)
- **Border Radius**: 캡슐형 또는 모서리가 둥근 형태 (기존 배지 라운딩 값 유지, 예: `var(--mg-radius-4)` 또는 디자인 시스템 기존 토큰 적용)
- **Font Weight**: `600` (텍스트 가독성 확보)

### 타입별 색상 스펙 (WCAG 대비 고려)

| 타입 | 배경 (Background) | 텍스트 (Text) |
|---|---|---|
| **증가 (Increase / Up)** | `var(--mg-color-error-bg)` 또는 `var(--mg-color-error-50)`<br>*(파스텔 레드/핑크 톤)* | `var(--mg-color-error-dark)`<br>*(진한 레드, 가독성 확보)* |
| **감소 (Decrease / Down)** | `var(--mg-color-info-bg)`<br>*(파스텔 스카이블루 톤)* | `var(--mg-color-info-dark)`<br>*(진한 블루, 가독성 확보)* |
| **신규 (New)** | `var(--mg-color-success-50)`<br>*(파스텔 그린 톤)* | `var(--mg-color-success-800)`<br>*(진한 그린)* |
| **동일/변동없음 (Neutral)** | `var(--mg-color-surface-main)` 또는 `#F5F3EF`<br>*(기본 표면 색상)* | `var(--mg-color-text-secondary)`<br>*(기본 보조 텍스트)* |

> *참고*: 기존의 `error` 토큰 명칭이 시스템상 오류를 의미하나 시각적으로는 레드/상승의 의미를 나타내므로 이를 재사용하거나 아래 제안하는 신규 시맨틱 토큰명으로 매핑하여 사용합니다.

### 추천 CSS 변수명 (토큰명 제안)

해당 배지들은 범용적인 에러/정보 상태가 아니므로 `AdminDashboardVisualizationGroup.css` 및 `KpiSparkline.css` 내에서 아래와 같은 **시맨틱 토큰명**으로 변수를 매핑/추가하여 사용하는 것을 권장합니다.

```css
/* 성장 배지용 (신규 토큰 제안) */
--mg-badge-growth-increase-bg: var(--mg-color-error-50);
--mg-badge-growth-increase-text: var(--mg-color-error-dark);

--mg-badge-growth-decrease-bg: var(--mg-color-info-bg);
--mg-badge-growth-decrease-text: var(--mg-color-info-dark);

--mg-badge-growth-new-bg: var(--mg-color-success-50);
--mg-badge-growth-new-text: var(--mg-color-success-800);

--mg-badge-growth-neutral-bg: var(--mg-color-surface-main);
--mg-badge-growth-neutral-text: var(--mg-color-text-secondary);
```

## 4. 상호작용·상태
- 해당 배지는 데이터를 시각적으로 보여주는 읽기 전용 컴포넌트이므로 Hover, Click 등 추가 상호작용은 없음.

## 5. 참조 문서 및 대상 파일
- **디자인 기준 참조**: `docs/design-system/PENCIL_DESIGN_GUIDE.md`
- **사용 토큰 소스**: `frontend/src/styles/unified-design-tokens.css`
- **구현 대상 컴포넌트 스타일 파일**:
  - `frontend/src/components/dashboard-v2/organisms/AdminDashboardVisualizationGroup.css`
  - `frontend/src/components/dashboard-v2/atoms/KpiSparkline.css`