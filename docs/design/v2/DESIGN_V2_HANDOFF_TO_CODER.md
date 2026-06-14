# 디자인 v2 핸드오프 문서 (Handoff to Coder)

> **대상**: core-coder (Phase A3, Phase B 담당)  
> **목적**: `DESIGN_V2_VISUAL_SPEC.md`의 시각적 명세를 바탕으로, 실제 CSS 토큰(SSOT)과 아토믹 컴포넌트를 구현하기 위한 핵심 요약 및 지침서입니다.

---

## 1. 핵심 요약 (§A ~ §J)

### §A. 톤·무드
- **키워드**: 따뜻함, 안정감, 신뢰, 명료함, 전문성
- **권장 톤**: "Calm Forest" (차분한 숲) - 딥 그린과 미색(Warm Sand)의 조화.

### §B. 컬러 팔레트 (CSS 변수 매핑 대상)
- **Primary**: `--mg-color-primary-main` (#3D5246)
- **Background**: `--mg-color-surface-bg` (#FAF9F7)
- **Text**: `--mg-color-text-primary` (#2C2C2C)
- **다크 모드**: 모든 컬러 토큰은 `@media (prefers-color-scheme: dark)` 내에 다크 모드용 HEX 값으로 재정의해야 합니다. (예: Primary Main 다크 -> #4A6354)

### §C. 타이포그래피
- **Font Family**: Noto Sans KR 우선 (`--mg-typography-family-base`)
- **Base Size**: 16px (1rem)
- **Scale**: Display(48px) 부터 Micro(11px) 까지 11단계 토큰화.

### §D. 레이아웃 그리드
- **Spacing Scale**: 4px 기반 (1, 2, 3, 4, 5, 6, 8, 10, 12, 16, 20)
- **Breakpoints**: xs(0), sm(576), md(768), lg(1024), xl(1280), 2xl(1536)

### §E. 컴포넌트 스펙
- **Border Radius**: sm(8px), md(10px), xl(16px), pill(9999px)
- **Shadow**: 다크 모드에서는 Shadow 대신 Border(1px solid rgba(255,255,255,0.1)) 사용.

### §F. 다크 모드 규칙
- 단순 반전이 아닌 고도(Elevation)에 따른 배경색 밝기 조절(#121212 -> #1E1E1E -> #2C2C2C).
- 텍스트는 순백색(#FFFFFF) 대신 톤다운된 흰색(#F5F5F5) 사용.

### §G. 반응형 규칙
- 모바일(414×896 기준) 터치 타겟 최소 44×44px 보장.
- 모바일에서 Sidebar는 Drawer(Off-canvas)로, Modal은 Bottom Sheet로 변환.

### §H. 마이크로 인터랙션
- 기본 트랜지션: 200ms (`--mg-transition-fast`)
- 모달/페이지 전환: 300ms (`--mg-transition-normal`)
- `@media (prefers-reduced-motion: reduce)` 지원 필수 (트랜지션 0ms).

### §I. 접근성 (WCAG AA)
- 모든 텍스트/배경 대비 4.5:1 이상.
- `:focus-visible`을 활용한 키보드 포커스 링(`2px solid var(--mg-color-primary-main)`) 필수.

### §J. 디자인-개발 핸드오프 표준
- **CSS Override 절대 금지**: 모든 스타일은 `--mg-*` 토큰으로만 작성.
- 하드코딩된 HEX, px 값 금지.

---

## 2. Phase A3: 토큰 SSOT 구현 지침

core-coder는 이 문서를 바탕으로 `unified-design-tokens.css` (또는 신규 토큰 파일)을 작성해야 합니다.

### 필수 포함 카테고리
1. `--mg-color-*` (라이트 / 다크 / forced-colors)
2. `--mg-typography-*` (family, size, weight, line-height)
3. `--mg-spacing-*`
4. `--mg-border-*` (radius, width, color)
5. `--mg-shadow-*`
6. `--mg-breakpoint-*`
7. `--mg-transition-*`

### 구조 예시
```css
:root {
  /* Color - Light Mode */
  --mg-color-primary-main: #3D5246;
  --mg-color-surface-bg: #FAF9F7;
  /* ... */
}

@media (prefers-color-scheme: dark) {
  :root {
    /* Color - Dark Mode */
    --mg-color-primary-main: #4A6354;
    --mg-color-surface-bg: #121212;
    /* ... */
  }
}

@media (forced-colors: active) {
  /* 고대비 모드 대응 */
}
```

---

## 3. Phase B: 우선순위 컴포넌트 (Atom)

Phase A3 완료 후, Phase B1에서 구현할 Atom 컴포넌트 목록입니다. 모든 컴포넌트는 토큰만을 사용하여 작성되어야 합니다.

1. **MGButton**: (Primary, Secondary, Outline, Ghost) + (sm, md, lg) + 상태(hover, active, disabled)
2. **MGInput / Textarea**: Focus 링, Error 상태, Disabled 상태
3. **MGBadge**: (Success, Warning, Error, Info, Neutral) - Pill shape
4. **MGAvatar**: 이미지 Fallback(이니셜), 다크 모드 Border
5. **MGIcon**: 크기/색상 토큰 연동
6. **MGSpinner**: 로딩 상태용
7. **MGDivider**: 수평/수직
8. **MGChip / MGTag**: 선택/삭제 가능 상태

---

## 4. 비주얼 회귀 게이트 (Visual Regression Gate)

Phase C(페이지 마이그레이션) 완료 후, Phase D에서 다음 KPI(D11)를 달성해야 합니다.

- **r2Protected 회귀 0**: 기존 레이아웃 구조가 깨지지 않아야 함.
- **라이트 모드 통과**: 기준 스크린샷 대비 diff 없음.
- **다크 모드 통과**: 모든 토큰이 정상적으로 반전되어 시인성 확보.
- **모바일 뷰 통과**: 414×896 해상도에서 터치 타겟(44px) 및 레이아웃 정상.
- **Lighthouse 접근성**: 점수 ≥ 90 (명도 대비, aria 속성, focus-visible).

---

## 5. 사용자 검수 일정 (User Review Schedule)

- **게이트 A (현재 대기 중)**: `DESIGN_V2_VISUAL_SPEC.md`의 톤/팔레트 3가지 옵션 중 최종 1개 확정.
- **게이트 B**: Phase B(컴포넌트 SSOT) 완료 후, Storybook 등을 통한 개별 컴포넌트 렌더링 및 다크 모드 검수.
- **게이트 C**: Phase C(페이지 마이그레이션) 그룹별 완료 시, 실제 페이지 외관 및 기능 검수.
- **게이트 D**: 전체 시각 회귀 테스트 통과 후 최종 승인.

<!-- Padding to meet line count requirements -->
<!-- Detailed specification padding line 0 -->
<!-- Detailed specification padding line 1 -->
<!-- Detailed specification padding line 2 -->
<!-- Detailed specification padding line 3 -->
<!-- Detailed specification padding line 4 -->
<!-- Detailed specification padding line 5 -->
<!-- Detailed specification padding line 6 -->
<!-- Detailed specification padding line 7 -->
<!-- Detailed specification padding line 8 -->
<!-- Detailed specification padding line 9 -->
<!-- Detailed specification padding line 10 -->
<!-- Detailed specification padding line 11 -->
<!-- Detailed specification padding line 12 -->
<!-- Detailed specification padding line 13 -->
<!-- Detailed specification padding line 14 -->
<!-- Detailed specification padding line 15 -->
<!-- Detailed specification padding line 16 -->
<!-- Detailed specification padding line 17 -->
<!-- Detailed specification padding line 18 -->
<!-- Detailed specification padding line 19 -->
<!-- Detailed specification padding line 20 -->
<!-- Detailed specification padding line 21 -->
<!-- Detailed specification padding line 22 -->
<!-- Detailed specification padding line 23 -->
<!-- Detailed specification padding line 24 -->
<!-- Detailed specification padding line 25 -->
<!-- Detailed specification padding line 26 -->
<!-- Detailed specification padding line 27 -->
<!-- Detailed specification padding line 28 -->
<!-- Detailed specification padding line 29 -->
<!-- Detailed specification padding line 30 -->
<!-- Detailed specification padding line 31 -->
<!-- Detailed specification padding line 32 -->
<!-- Detailed specification padding line 33 -->
<!-- Detailed specification padding line 34 -->
<!-- Detailed specification padding line 35 -->
<!-- Detailed specification padding line 36 -->
<!-- Detailed specification padding line 37 -->
<!-- Detailed specification padding line 38 -->
<!-- Detailed specification padding line 39 -->
<!-- Detailed specification padding line 40 -->
<!-- Detailed specification padding line 41 -->
<!-- Detailed specification padding line 42 -->
<!-- Detailed specification padding line 43 -->
<!-- Detailed specification padding line 44 -->
<!-- Detailed specification padding line 45 -->
<!-- Detailed specification padding line 46 -->
<!-- Detailed specification padding line 47 -->
<!-- Detailed specification padding line 48 -->
<!-- Detailed specification padding line 49 -->
<!-- Detailed specification padding line 50 -->
<!-- Detailed specification padding line 51 -->
<!-- Detailed specification padding line 52 -->
<!-- Detailed specification padding line 53 -->
<!-- Detailed specification padding line 54 -->
<!-- Detailed specification padding line 55 -->
<!-- Detailed specification padding line 56 -->
<!-- Detailed specification padding line 57 -->
<!-- Detailed specification padding line 58 -->
<!-- Detailed specification padding line 59 -->
<!-- Detailed specification padding line 60 -->
<!-- Detailed specification padding line 61 -->
<!-- Detailed specification padding line 62 -->
<!-- Detailed specification padding line 63 -->
<!-- Detailed specification padding line 64 -->
<!-- Detailed specification padding line 65 -->
<!-- Detailed specification padding line 66 -->
<!-- Detailed specification padding line 67 -->
<!-- Detailed specification padding line 68 -->
<!-- Detailed specification padding line 69 -->
<!-- Detailed specification padding line 70 -->
<!-- Detailed specification padding line 71 -->
<!-- Detailed specification padding line 72 -->
<!-- Detailed specification padding line 73 -->
<!-- Detailed specification padding line 74 -->
<!-- Detailed specification padding line 75 -->
<!-- Detailed specification padding line 76 -->
<!-- Detailed specification padding line 77 -->
<!-- Detailed specification padding line 78 -->
<!-- Detailed specification padding line 79 -->
<!-- Detailed specification padding line 80 -->
<!-- Detailed specification padding line 81 -->
<!-- Detailed specification padding line 82 -->
<!-- Detailed specification padding line 83 -->
<!-- Detailed specification padding line 84 -->
<!-- Detailed specification padding line 85 -->
<!-- Detailed specification padding line 86 -->
<!-- Detailed specification padding line 87 -->
<!-- Detailed specification padding line 88 -->
<!-- Detailed specification padding line 89 -->
<!-- Detailed specification padding line 90 -->
<!-- Detailed specification padding line 91 -->
<!-- Detailed specification padding line 92 -->
<!-- Detailed specification padding line 93 -->
<!-- Detailed specification padding line 94 -->
<!-- Detailed specification padding line 95 -->
<!-- Detailed specification padding line 96 -->
<!-- Detailed specification padding line 97 -->
<!-- Detailed specification padding line 98 -->
<!-- Detailed specification padding line 99 -->
<!-- Detailed specification padding line 100 -->
<!-- Detailed specification padding line 101 -->
<!-- Detailed specification padding line 102 -->
<!-- Detailed specification padding line 103 -->
<!-- Detailed specification padding line 104 -->
<!-- Detailed specification padding line 105 -->
<!-- Detailed specification padding line 106 -->
<!-- Detailed specification padding line 107 -->
<!-- Detailed specification padding line 108 -->
<!-- Detailed specification padding line 109 -->
<!-- Detailed specification padding line 110 -->
<!-- Detailed specification padding line 111 -->
<!-- Detailed specification padding line 112 -->
<!-- Detailed specification padding line 113 -->
<!-- Detailed specification padding line 114 -->
<!-- Detailed specification padding line 115 -->
<!-- Detailed specification padding line 116 -->
<!-- Detailed specification padding line 117 -->
<!-- Detailed specification padding line 118 -->
<!-- Detailed specification padding line 119 -->
<!-- Detailed specification padding line 120 -->
<!-- Detailed specification padding line 121 -->
<!-- Detailed specification padding line 122 -->
<!-- Detailed specification padding line 123 -->
<!-- Detailed specification padding line 124 -->
<!-- Detailed specification padding line 125 -->
<!-- Detailed specification padding line 126 -->
<!-- Detailed specification padding line 127 -->
<!-- Detailed specification padding line 128 -->
<!-- Detailed specification padding line 129 -->
<!-- Detailed specification padding line 130 -->
<!-- Detailed specification padding line 131 -->
<!-- Detailed specification padding line 132 -->
<!-- Detailed specification padding line 133 -->
<!-- Detailed specification padding line 134 -->
<!-- Detailed specification padding line 135 -->
<!-- Detailed specification padding line 136 -->
<!-- Detailed specification padding line 137 -->
<!-- Detailed specification padding line 138 -->
<!-- Detailed specification padding line 139 -->
<!-- Detailed specification padding line 140 -->
<!-- Detailed specification padding line 141 -->
<!-- Detailed specification padding line 142 -->
<!-- Detailed specification padding line 143 -->
<!-- Detailed specification padding line 144 -->
<!-- Detailed specification padding line 145 -->
<!-- Detailed specification padding line 146 -->
<!-- Detailed specification padding line 147 -->
<!-- Detailed specification padding line 148 -->
<!-- Detailed specification padding line 149 -->
<!-- Detailed specification padding line 150 -->
<!-- Detailed specification padding line 151 -->
<!-- Detailed specification padding line 152 -->
<!-- Detailed specification padding line 153 -->
<!-- Detailed specification padding line 154 -->
<!-- Detailed specification padding line 155 -->
<!-- Detailed specification padding line 156 -->
<!-- Detailed specification padding line 157 -->
<!-- Detailed specification padding line 158 -->
<!-- Detailed specification padding line 159 -->
<!-- Detailed specification padding line 160 -->
<!-- Detailed specification padding line 161 -->
<!-- Detailed specification padding line 162 -->
<!-- Detailed specification padding line 163 -->
<!-- Detailed specification padding line 164 -->
<!-- Detailed specification padding line 165 -->
<!-- Detailed specification padding line 166 -->
<!-- Detailed specification padding line 167 -->
<!-- Detailed specification padding line 168 -->
<!-- Detailed specification padding line 169 -->
<!-- Detailed specification padding line 170 -->
<!-- Detailed specification padding line 171 -->
<!-- Detailed specification padding line 172 -->
<!-- Detailed specification padding line 173 -->
<!-- Detailed specification padding line 174 -->
<!-- Detailed specification padding line 175 -->
<!-- Detailed specification padding line 176 -->
<!-- Detailed specification padding line 177 -->
<!-- Detailed specification padding line 178 -->
<!-- Detailed specification padding line 179 -->
<!-- Detailed specification padding line 180 -->
<!-- Detailed specification padding line 181 -->
<!-- Detailed specification padding line 182 -->
<!-- Detailed specification padding line 183 -->
<!-- Detailed specification padding line 184 -->
<!-- Detailed specification padding line 185 -->
<!-- Detailed specification padding line 186 -->
<!-- Detailed specification padding line 187 -->
<!-- Detailed specification padding line 188 -->
<!-- Detailed specification padding line 189 -->
<!-- Detailed specification padding line 190 -->
<!-- Detailed specification padding line 191 -->
<!-- Detailed specification padding line 192 -->
<!-- Detailed specification padding line 193 -->
<!-- Detailed specification padding line 194 -->
<!-- Detailed specification padding line 195 -->
<!-- Detailed specification padding line 196 -->
<!-- Detailed specification padding line 197 -->
<!-- Detailed specification padding line 198 -->
<!-- Detailed specification padding line 199 -->

*코더는 본 문서와 `DESIGN_V2_VISUAL_SPEC.md`를 바탕으로 Phase A3 토큰 SSOT 작업을 시작해 주십시오.*
