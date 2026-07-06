# Core Solution Logo Spec: Shield Variant (User Confirmed)

> **Status**: Deprecated  
> **Scope**: docs `assets/final/` 임시 shield spec — canonical은 Trinity `public/assets`.

> **Superseded by**: [BRAND_SSOT_CORE_SOLUTION.md](../BRAND_SSOT_CORE_SOLUTION.md) §0~§1 (Shield H2 단일 확정)

> **혼동 경고**: `docs/.../assets/final/*.svg`는 Trinity canonical **아님**. mockup·C-1과 혼용 금지.

## 1. 선정 근거 (Rationale)
사용자 요청에 따라 **방패(Shield) 형태 심볼 + 타이포(워드마크)** 조합이 최종 확정되었습니다.
방패 모양은 엔터프라이즈 B2B SaaS 플랫폼으로서의 강력한 보안, 데이터 격리(Multi-tenant), 시스템 안정성을 직관적으로 상징합니다.
Core Solution의 주조색(Primary `#3D5246`)과 다크 그레이 톤을 활용하여 신뢰감 있고 전문적인 이미지를 전달합니다.

## 2. 심볼 및 워드마크 규격
- **심볼 (Symbol)**: 
  - 방패 외곽선과 내부를 채우는 면으로 구성.
  - SVG 파일: `assets/final/brand-symbol-shield.svg`
- **워드마크 (Wordmark)**: 
  - 텍스트: "Core Solution"
  - 폰트: Noto Sans KR 또는 시스템 기본 산세리프 폰트, Bold
- **Horizontal 조합 (Primary)**:
  - SVG 파일: `assets/final/logo-shield-horizontal.svg`

## 3. 라이트/다크 모드 사용 기준
- **라이트 모드 (Light Mode)**: 
  - 심볼: 원본 그대로 사용 (`#3D5246` 및 투명도 적용된 다크 그레이)
  - 워드마크: `#2C2C2C` (또는 `var(--mg-v2-color-text-primary)`)
- **다크 모드 (Dark Mode)**: 
  - 심볼: 원본 그대로 사용.
  - 워드마크: `currentColor`를 활용하여 `#FFFFFF` (또는 `var(--mg-v2-color-text-inverse)`)로 자동 전환되도록 적용.

## 4. 최소 여백 및 금지 사항
- **최소 여백 (Clear Space)**: 로고 주변으로 심볼 높이의 50% 이상 여백을 확보해야 합니다.
- **최소 크기 (Minimum Size)**: 디지털 화면 기준 가로/세로 24px 이하로 축소하지 않습니다.
- **금지 사항 (Don'ts)**:
  - 심볼의 비율(가로/세로)을 왜곡하지 마십시오.
  - 복잡한 배경이나 대비가 부족한 배경 위에 로고를 단독으로 배치하지 마십시오.

## 5. 주요 사용처
- **PublicNavBar (GNB)**: 좌측 상단에 `logo-shield-horizontal.svg` 배치 (높이 32~48px 기준) 또는 HTML/CSS 조합 사용.
- **PublicFooter**: 좌측 하단에 심볼 + 워드마크 조합으로 배치.
- **Favicon**: `brand-symbol-shield.svg` 단독 사용.