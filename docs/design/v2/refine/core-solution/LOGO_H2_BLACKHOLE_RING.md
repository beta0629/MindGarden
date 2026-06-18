# Core Solution Logo Spec: H2 Blackhole Ring (Superseded)

> **Status**: Archive  
> **Scope**: Deprecated logo concept — **Shield H2** 단일 확정. SaaS Blue 그라데이션 레거시.

> **Superseded by**: [BRAND_SSOT_CORE_SOLUTION.md](../BRAND_SSOT_CORE_SOLUTION.md) §1 Shield H2

> **Note**: 이 컨셉은 Shield + 워드마크로 대체되었습니다. 신규 mockup·시안·SSOT 참조 **금지**.

## 1. 선정 근거 (Rationale)
Core Solution은 B2B Enterprise SaaS 플랫폼으로서, 방대한 데이터를 안전하게 처리하고 운영을 자동화하는 핵심 인프라 역할을 합니다. H2 `blackhole-ring` 심볼은 모든 복잡성을 중심으로 흡수하여 단순화하는 '블랙홀'의 강력한 중력과, 그 주위를 감싸는 '데이터의 흐름(Ring)'을 형상화했습니다. Refine SaaS 팔레트(Blue #3B82F6 ~ Purple #8B5CF6)의 그라데이션을 적용하여 현대적이고 신뢰감 있는 기술 기업의 이미지를 전달합니다.

## 2. 심볼 및 워드마크 규격
- **심볼 (Symbol)**: 
  - 중앙의 검은 원(Black disc)과 이를 감싸는 그라데이션 링(Gradient ring)으로 구성.
  - SVG 파일: `assets/brand-symbol-blackhole-ring.svg`
- **워드마크 (Wordmark)**: 
  - 텍스트: "Core Solution"
  - 폰트: Noto Sans KR 또는 시스템 기본 산세리프 폰트, Bold
  - 심볼과 워드마크 간격: 심볼 크기의 25% (예: 심볼이 32px일 경우 간격 8px)

## 3. 라이트/다크 모드 사용 기준
- **라이트 모드 (Light Mode)**: 
  - 심볼: 원본 그대로 사용 (중앙 검은 원 + 그라데이션 링)
  - 워드마크: `#0A0A0A` (또는 `var(--mg-v2-color-text-primary)`)
- **다크 모드 (Dark Mode)**: 
  - 심볼: 중앙의 검은 원을 배경색에 맞춰 투명하게 처리하거나, 다크 그레이(`#1A1A1A`)로 조정하여 링의 그라데이션이 돋보이도록 유지.
  - 워드마크: `#FFFFFF` (또는 `var(--mg-v2-color-text-inverse)`)

## 4. 최소 여백 및 금지 사항
- **최소 여백 (Clear Space)**: 로고 주변으로 심볼 반지름(R)만큼의 여백을 항상 확보해야 합니다.
- **최소 크기 (Minimum Size)**: 디지털 화면 기준 가로/세로 24px 이하로 축소하지 않습니다.
- **금지 사항 (Don'ts)**:
  - 링의 그라데이션 색상을 임의로 변경하지 마십시오.
  - 심볼의 비율(가로/세로)을 왜곡하지 마십시오.
  - 복잡한 배경이나 대비가 부족한 배경 위에 로고를 단독으로 배치하지 마십시오.

## 5. 주요 사용처
- **PublicNavBar (GNB)**: 좌측 상단에 심볼 + 워드마크 조합으로 배치 (높이 32px 기준).
- **PublicFooter**: 좌측 하단에 심볼 + 워드마크 조합으로 배치.
- **Favicon**: 심볼 단독 사용.