# 디자인 중앙화 표준 (Design Centralization Standard)

**버전**: 2.0.0 (Premium Edition)
**최종 업데이트**: 2025-12-14
**상태**: 공식 표준 (Official Standard)

---

## 📌 개요

MindGarden Core Solution의 사용자 경험을 **"Digital Luxury"** 수준으로 끌어올리기 위한 차세대 디자인 표준입니다.
기존의 플랫한 디자인을 넘어, 깊이감(Depth), 유동성(Fluidity), 그리고 빛(Light)을 활용한 프리미엄 인터페이스 구축을 목표로 합니다.

### 참조 문서
- **구현 계획**: `docs/plans/2025-12-14_PREMIUM_DESIGN_OVERHAUL.md`
- **토큰 정의**: `frontend/src/styles/unified-design-tokens.css`

### 핵심 원칙
1.  **Glass & Gradient**: 투명도와 그라디언트를 활용하여 현대적이고 고급스러운 느낌을 전달합니다.
2.  **Motion First**: 모든 상호작용은 부드러운 물리 기반 애니메이션을 동반해야 합니다.
3.  **Strict Centralization**: 모든 색상, 간격, 폰트는 반드시 `var(--mg-...)` 형태의 CSS 변수만 사용합니다.

---

## 🎨 디자인 토큰 시스템 (Design Tokens)

모든 스타일링은 아래 정의된 CSS 변수를 통해서만 이루어져야 합니다. 하드코딩된 값 사용은 **엄격히 금지**됩니다.

### 1. 색상 시스템 (HSL & Gradients)
단색 대신 HSL 기반의 동적 색상과 그라디언트를 사용합니다.

```css
/* ✅ 권장 (Premium Token 사용) */
.primary-button {
  background: var(--mg-gradient-primary); /* 인디고-퍼플 그라디언트 */
  color: var(--mg-color-text-primary);
}

/* ❌ 금지 (Legacy/Hardcoded) */
.primary-button {
  background: #3b82f6;
  background: var(--mg-primary-500); /* 구버전 토큰 */
}
```

*   **Primary Gradient**: `var(--mg-gradient-primary)`
*   **Background Deep**: `var(--mg-color-bg-deep)` (메인 배경)
*   **Glass Surface**: `var(--mg-glass-bg-medium)` (카드/패널 배경)

### 2. 글래스모피즘 (Glassmorphism)
유리 질감을 구현하기 위한 표준 유틸리티입니다.

```css
.glass-panel {
  background: var(--mg-glass-bg-medium);
  backdrop-filter: var(--mg-glass-blur);
  border: var(--mg-glass-border);
  box-shadow: var(--mg-glass-shadow);
}
```

### 3. 타이포그래피 (Typography)
프리미엄 가변 폰트(**Inter** & **Outfit**)를 사용합니다.

*   **본문 (Body)**: `var(--mg-font-family-body)` (Inter)
*   **제목 (Heading)**: `var(--mg-font-family-heading)` (Outfit)
*   **크기**: `var(--mg-font-size-...)` (xs ~ 4xl)

---

## 💻 컴포넌트 구현 표준

### 1. 버튼 (Button)
버튼은 단순한 클릭 요소를 넘어, 앱의 "에너지"를 표현해야 합니다.

*   **인터랙션**:
    *   Hover: `transform: translateY(-2px)` (살짝 떠오름)
    *   Active: `transform: scale(0.98)` (눌림 효과)
    *   Focus: `box-shadow: var(--mg-gradient-glow)` (발광 효과)
*   **스타일링**:
    *   `primary`: 그라디언트 배경 + 내부 그림자 없음
    *   `secondary`: 투명 배경 + 글래스모피즘 테두리

### 2. 카드 (Card)
카드는 컨텐츠를 담는 유리 용기(Vessel)처럼 보여야 합니다.

*   **기본 스타일**:
    *   배경: `var(--mg-glass-bg-medium)`
    *   테두리: `var(--mg-glass-border)`
    *   모서리: `var(--mg-radius-lg)` (16px 이상)
*   **Depth**: 호버 시 그림자와 불투명도가 증가하여 앞으로 나오는 느낌을 주어야 합니다.

### 3. 레이아웃 (Layout)
*   **Spacing**: `var(--mg-spacing-...)` 단위를 사용하며, 여백을 넉넉하게 주어 "Luxury"한 느낌을 연출합니다.
*   **Z-Index**:
    *   `100`: 기본 컨텐츠
    *   `200`: 글래스 오버레이
    *   `300`: 스티키 헤더/네비게이션
    *   `400`: 모달/팝업

---

## 🚫 금지 사항 (Anti-Patterns)
1.  **Hex 코드 직접 사용**: `#ffffff`, `#000000` 등 직접적인 색상 코드 사용 금지.
2.  **시스템 폰트 사용**: 특별한 사유 없이 시스템 기본 폰트(Arial 등) 사용 금지.
3.  **Flat Design**: 그림자나 깊이감 없는 완전한 2D 플랫 디자인 지양.
4.  **즉각적인 상태 변화**: `transition` 없이 색상이 뚝 바뀌는 인터랙션 금지. (항상 `var(--mg-transition-normal)` 사용)
