# KPI Flip Card (3D) 디자인 스펙 (Phase 3 Handoff)

> **Status**: Active (Phase 3 구현 대기)  
> **Scope**: 어드민 메인 허브(`/`) KPI 카드 3종  
> **Component**: `KpiFlipCard` (또는 `mg-v2-kpi-flip-card`)
> **Note**: Phase 3에서 Core Flow Pipeline(전체 너비 균등 분배) 레이아웃 개편과 함께 일괄 구현됩니다.

이 문서는 Phase 3에서 `core-coder`가 React/CSS로 3D Flip KPI 카드를 구현하기 위한 디자인 스펙 및 가이드라인입니다.

## 1. 인터랙션 및 애니메이션 스펙

- **트리거**: Click / Tap (키보드 접근성: Enter / Space)
- **애니메이션 속성**:
  - `transform`: Y축 회전 (`rotateY(180deg)`)
  - `perspective`: `1000px`
  - `transition-duration`: `400ms` ~ `500ms` (`var(--mg-v2-transition-slow)`)
  - `transition-timing-function`: `cubic-bezier(0.4, 0, 0.2, 1)` (`var(--mg-v2-transition-easing-default)`)
- **동작 규칙**:
  - 동시 1장만 flipped 상태 유지 (다른 카드 클릭 시 이전 카드는 auto flip-back)
  - 재클릭 또는 뒷면의 「닫기」 ActionBarButton 클릭 시 flip-back

## 2. 시각 스펙 (B0KlA 정합)

- **Radius**: `16px` (`var(--mg-v2-radius-xl)`)
- **Shadow**: `var(--mg-v2-shadow-sm)`
- **Background**: `var(--mg-v2-color-surface-card)`
- **금지 사항**: SaaS Blue(`#3B82F6`) 사용 금지, legacy box-shadow 난립 금지, transform stacking context로 인해 모달 등 다른 레이어가 가려지지 않도록 z-index 관리 주의.

## 3. 접근성 (a11y) 및 모바일 대응

- **Reduced Motion**: `@media (prefers-reduced-motion: reduce)` 적용 시, 3D flip 애니메이션 없이 crossfade 또는 instant toggle로 전환.
- **Focus**: 카드 내부 요소에만 focus trap 아님. 키보드 네비게이션 시 `:focus-visible` 링 노출.
- **ARIA**: `aria-expanded` 속성을 통해 현재 카드의 확장(뒷면 노출) 상태 제공.
- **모바일 (375px)**:
  - Full-width card 적용.
  - 터치 타겟 최소 `44px` 보장.
  - Flip 후 뒷면 detail 영역의 콘텐츠가 길 경우 `max-height` 및 내부 스크롤 적용.

## 4. HTML 구조 아웃라인 (참조용)

```html
<div class="mg-v2-kpi-flip-card" aria-expanded="false" role="button" tabindex="0">
  <div class="mg-v2-kpi-flip-card__inner">
    <!-- 앞면 (요약) -->
    <div class="mg-v2-kpi-flip-card__front">
      <!-- KPI 숫자, 라벨, 보조 텍스트 -->
    </div>
    
    <!-- 뒷면 (상세) -->
    <div class="mg-v2-kpi-flip-card__back">
      <div class="mg-v2-kpi-flip-card__back-header">
        <!-- 제목 및 닫기 버튼 -->
      </div>
      <div class="mg-v2-kpi-flip-card__back-content">
        <!-- 역할별 상세 리스트, 타임라인, CTA 등 -->
      </div>
    </div>
  </div>
</div>
```

## 5. CSS 애니메이션 핵심 (참조용)

```css
.mg-v2-kpi-flip-card {
  perspective: 1000px;
}

.mg-v2-kpi-flip-card__inner {
  position: relative;
  width: 100%;
  height: 100%;
  transition: transform 400ms cubic-bezier(0.4, 0, 0.2, 1);
  transform-style: preserve-3d;
}

.mg-v2-kpi-flip-card--flipped .mg-v2-kpi-flip-card__inner {
  transform: rotateY(180deg);
}

.mg-v2-kpi-flip-card__front,
.mg-v2-kpi-flip-card__back {
  position: absolute;
  width: 100%;
  height: 100%;
  backface-visibility: hidden;
  border-radius: var(--mg-v2-radius-xl);
}

.mg-v2-kpi-flip-card__back {
  transform: rotateY(180deg);
}

@media (prefers-reduced-motion: reduce) {
  .mg-v2-kpi-flip-card__inner {
    transition: none;
    /* 대체 효과 (예: opacity crossfade) 적용 */
  }
}
```

## 6. KPI별 앞/뒷면 콘텐츠 정의

| KPI | 앞면 (요약) | 뒷면 (상세) |
|-----|-------------|-------------|
| 오늘 상담 일정 | 오늘 예정된 전체 예약 및 완료 건수 추이 요약 | 시간대별 미니 타임라인 또는 CONFIRMED/COMPLETED/CANCELLED breakdown + 「일정 보기」 CTA |
| 상담사별 오늘 일정 | 상담사별 오늘 건수 요약 | 상담사 리스트 (이름, N건, 다음 일정 시각) + chip 클릭 → integrated-schedule filter deep link |
| 신규 상담 접수 | 신규 등록 내담자 및 최초 배정 대기 건수 | 신규 내담자 목록 (이름, 접수일, 배정 상태) + 「배정하기」 CTA |
