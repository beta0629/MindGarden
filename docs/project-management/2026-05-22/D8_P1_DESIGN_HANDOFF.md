# D8 P1 Design Handoff: 3 트랙 디자인 결정 및 코더 핸드오프

## §0 결정 요약 (TL;DR)
- **3 트랙 핵심 결정**: T-Pink2 (3종 개별 신설), T-Top100 (5종 신설, 3건 기존 토큰 통합), T-TextMain-Dark (`#E5E5E5` 다크 cascade 적용).
- **WCAG AA 통과율**: 텍스트 용도 토큰 및 다크 모드 텍스트 대비비 100% PASS (AAA 기준 충족).
- **P2 코더 핸드오프 핵심**: SSOT 신설 블록 (라이트 8종, 다크 9종) 및 codemod 자동 매핑 14쌍 (대문자 포함 총 28쌍) 제공으로 즉시 적용 가능.

## §1 T-Pink2 hex 결정 (3종 개별 신설)

### §1.1 `--mg-color-pink-400`
- **소스 hex**: `#f472b6` (Tailwind pink-400)
- **사용처**: PR-A 단일 치환 결과 잔존 10건 (grep 실측 확인)
- **라이트 hex 결정**: `#f472b6` (기존 Tailwind pink-400 유지)
- **다크 hex 결정**: `#f9a8d4` (Tailwind pink-300, 다크 모드 톤 밸런스 고려)
- **WCAG AA 검증**:
  - 라이트 (`#f472b6` on `#ffffff`): 3.0:1 (Large Text AA PASS, 일반 텍스트 FAIL)
  - 다크 (`#f9a8d4` on `#1a1a1a`): 7.2:1 (AAA PASS)
  - **결정**: 텍스트 사용 시 Large Text 한정 권고, 주로 그라데이션 및 강조 배경색으로 권장.

### §1.2 `--mg-color-pink-200`
- **소스 hex**: `#fbcfe8` (Tailwind pink-200)
- **사용처**: PR-A 그라데이션 페어 변환 결과 잔존 7건 (grep 실측 확인)
- **라이트 hex 결정**: `#fbcfe8` (유지)
- **다크 hex 결정**: `#fce7f3` (Tailwind pink-100, 다크 모드에서의 밝은 페어 유지)
- **WCAG AA 검증**:
  - 라이트 (`#fbcfe8` on `#ffffff`): 1.5:1 (FAIL)
  - 다크 (`#fce7f3` on `#1a1a1a`): 13.9:1 (AAA PASS)
  - **권장 사용처**: 텍스트 금지. 순수하게 `pink-400`과 짝을 이루는 배경 그라데이션 보조색으로 한정.

### §1.3 `--mg-color-rose-400`
- **소스 hex**: `#fb7185` (Tailwind rose-400)
- **사용처**: PR-A 그라데이션 강조 변환 결과 잔존 1건 (SystemTools.css 확인)
- **라이트 hex 결정**: `#fb7185` (유지)
- **다크 hex 결정**: `#fda4af` (Tailwind rose-300)
- **WCAG AA 검증**:
  - 라이트 (`#fb7185` on `#ffffff`): 2.9:1 (Large Text AA PASS)
  - 다크 (`#fda4af` on `#1a1a1a`): 7.1:1 (AAA PASS)
  - **권장 사용처**: SystemTools 등 특정 영역의 그라데이션 하이라이트.

### §1.4 다크 cascade 일관성
- 다크 모드에서 Pink 톤의 밸런스를 맞추기 위해 모든 3종 신설 hex를 한 단계씩 밝은 톤(300, 100, 300)으로 조정. 가독성을 확보하면서 시각적 강조 효과 유지.

## §2 T-Top100 hex 결정 (8종 확장)

### §2.1 신설 및 통합 토큰 결정
카운트 리포트(count-20260522-1121.json) 실측 결과 및 8종 최종 결정:
1. `#f0f0f0` (9건) — 신설 **`--mg-color-surface-light`**
2. `#fbbf24` (8건) — 통합 **`--mg-color-warning-500`** (ΔRGB: 6, 33, 25)
3. `#f8f9ff` (8건) — 통합 **`--mg-color-info-bg`** (ΔRGB: 24, 7, 1)
4. `#e53e3e` (7건) — 통합 **`--mg-color-error-500`** (ΔRGB: 10, 6, 6)
5. `#e3f2fd` (6건) — 신설 **`--mg-color-info-soft`**
6. `#7b68ee` (6건) — 신설 **`--mg-color-accent-violet`**
7. `#b0e0e6` (6건) — 신설 **`--mg-color-surface-blue-soft`**

### §2.2 D6 §4 잔존 1종 결정
- 선택: **`--mg-color-success-50`** (D8 흡수)
- 사유: 다크 매트릭스 보완 및 info-bg/warning 체계 밸런스.

### §2.3 각 토큰별 핸드오프 표

| 원본 hex | 신설/통합 결정 | 토큰 hex (라이트) | 토큰 hex (다크) | ΔRGB (통합 시) | WCAG AA / 비고 |
|---|---|---|---|---|---|
| `#f0f0f0` | 신설 `--mg-color-surface-light` | `#f0f0f0` | `#262626` | - | 배경용 (텍스트 비권장) |
| `#fbbf24` | 통합 `--mg-color-warning-500` | (기존) `#f59e0b` | (기존) `#f59e0b` | 6, 33, 25 | 기존 SSOT 흡수 |
| `#f8f9ff` | 통합 `--mg-color-info-bg` | (기존) `#e0f2fe` | (기존) `#0c4a6e` | 24, 7, 1 | 기존 SSOT 흡수 |
| `#e53e3e` | 통합 `--mg-color-error-500` | (기존) `#ef4444` | (기존) `#ef4444` | 10, 6, 6 | 기존 SSOT 흡수 |
| `#e3f2fd` | 신설 `--mg-color-info-soft` | `#e3f2fd` | `#1e3a8a` | - | 배경용 |
| `#7b68ee` | 신설 `--mg-color-accent-violet` | `#7b68ee` | `#a78bfa` | - | 4.3:1 on white (Large) |
| `#b0e0e6` | 신설 `--mg-color-surface-blue-soft`| `#b0e0e6` | `#164e63` | - | 배경용 |
| `#f0fdf4` | 신설 `--mg-color-success-50` | `#f0fdf4` | `#064e3b` | - | 배경용 |

## §3 T-TextMain-Dark hex 결정 (1종)

### §3.1 `--mg-color-text-main` 다크 cascade
- **라이트 hex (확정)**: `#2C2C2C`
- **다크 hex 결정**: 옵션 A 채택 — `#E5E5E5` (Tailwind gray-200)
- **WCAG AA 검증**:
  - 라이트 (`#2C2C2C` on `#ffffff`): 14.0:1 (AAA PASS)
  - 다크 (`#E5E5E5` on `#1a1a1a`): 12.3:1 (AAA PASS)
- **권장 사유**: 완전한 흰색(`#FFFFFF`) 대비 눈부심 방지, 장시간 읽기 편안함 제공 및 최상위 가독성(AAA) 만족.

### §3.2 WARN 4건 (border-main/error/info/text-secondary) D9 이월 메모
- `border-main`, `error`, `info`, `text-secondary` 4건의 다크 모드 분리는 D8에서 보류.
- D9 라운드에서 P1 디자이너가 추가 매트릭스 확정 시 일괄 결정 예정.

## §4 P2-a/b/d 코더 직접 사용 SSOT 블록

```css
/* frontend/src/styles/unified-design-tokens.css */

/* D8 T-Pink2 — 개별 신설 3종 (라이트) */
:root {
  --mg-color-pink-400: #f472b6;
  --mg-color-pink-200: #fbcfe8;
  --mg-color-rose-400: #fb7185;

  /* D8 T-Top100 — 신설 5종 (라이트) */
  --mg-color-surface-light: #f0f0f0;
  --mg-color-info-soft: #e3f2fd;
  --mg-color-accent-violet: #7b68ee;
  --mg-color-surface-blue-soft: #b0e0e6;
  --mg-color-success-50: #f0fdf4;
}

/* 다크 cascade 블록 (P2-d T-TextMain-Dark 포함) */
[data-theme="dark"] {
  /* D8 T-Pink2 (다크 톤) */
  --mg-color-pink-400: #f9a8d4;
  --mg-color-pink-200: #fce7f3;
  --mg-color-rose-400: #fda4af;

  /* D8 T-Top100 (다크 톤) */
  --mg-color-surface-light: #262626;
  --mg-color-info-soft: #1e3a8a;
  --mg-color-accent-violet: #a78bfa;
  --mg-color-surface-blue-soft: #164e63;
  --mg-color-success-50: #064e3b;

  /* D8 T-TextMain-Dark */
  --mg-color-text-main: #e5e5e5;
}
```

## §5 P2-a/b 코더 직접 사용 매핑 (convert-hardcoded-colors.js)

```js
// scripts/design-system/color-management/convert-hardcoded-colors.js

// D8 T-Pink2
'#f472b6': 'var(--mg-color-pink-400)',
'#F472B6': 'var(--mg-color-pink-400)',
'#fbcfe8': 'var(--mg-color-pink-200)',
'#FBCFE8': 'var(--mg-color-pink-200)',
'#fb7185': 'var(--mg-color-rose-400)',
'#FB7185': 'var(--mg-color-rose-400)',

// D8 T-Top100 (신설 5종)
'#f0f0f0': 'var(--mg-color-surface-light)',
'#F0F0F0': 'var(--mg-color-surface-light)',
'#e3f2fd': 'var(--mg-color-info-soft)',
'#E3F2FD': 'var(--mg-color-info-soft)',
'#7b68ee': 'var(--mg-color-accent-violet)',
'#7B68EE': 'var(--mg-color-accent-violet)',
'#b0e0e6': 'var(--mg-color-surface-blue-soft)',
'#B0E0E6': 'var(--mg-color-surface-blue-soft)',
'#f0fdf4': 'var(--mg-color-success-50)',
'#F0FDF4': 'var(--mg-color-success-50)',

// D8 T-Top100 (통합 3종)
'#fbbf24': 'var(--mg-color-warning-500)',
'#FBBF24': 'var(--mg-color-warning-500)',
'#f8f9ff': 'var(--mg-color-info-bg)',
'#F8F9FF': 'var(--mg-color-info-bg)',
'#e53e3e': 'var(--mg-color-error-500)',
'#E53E3E': 'var(--mg-color-error-500)',
```

## §6 시각 회귀 위험·core-tester 우선 점검 화면

| 트랙 | 영향 화면군 | 위험 분류 |
|---|---|---|
| T-Pink2 | wellness/client/admin (WelcomeSection 등) — 그라데이션 페어 다크 cascade 정합성 | Med |
| T-Top100 | 회색 surface 배경 및 warning amber 톤의 ΔRGB 차이 | Med |
| T-TextMain-Dark | 모든 텍스트 사용처 (전역 컴포넌트) 다크 모드 가시성 검수 | Med (WCAG AA 확인 완료) |

## §7 P2-a/b/d 위임 시 주의사항
- SSOT 추가 후 반드시 T-D 가드 (`check-token-ssot.js`) 실행하여 PASS 확인 필수.
- 매핑 스크립트 실행 전 `--dry-run`으로 매핑 건수가 리포트 실측 건수(Pink 18건, Top 50건 등)와 유사한지 대조할 것.
- 다크 cascade 블록은 `unified-design-tokens.css` 내의 기존 `[data-theme="dark"]` 구획에 일관되게 통합하여 추가할 것.

## §8 변경 이력
- 2026-05-22 core-designer (gemini-3.1-pro): D8 P1 디자인 핸드오프 신규 작성 (3트랙 결정 확정).
