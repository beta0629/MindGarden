# D3 합의서 — 잔존 표준 팔레트 토큰 매핑 (2026 Q2)

## 0. 결정 요약
- A. 기존 토큰 통합: 5건 (`#666`, `#333`, `#f3f4f6`, `#f8fafc`, `#9ca3af`)
- B. 신설 토큰: 2건 (`#fef3c7`, `#fee2e2`)
- C. 폐기 통합: 3건 (`#e2e8f0`, `#d1d5db`, `#2d3748`)
- 적용 후 예상 잔존 HEX: ~1,200건 (운영 게이트 warn 임계 1,000 근접)

## 1. HEX 매핑 결정표 (A/B/C)

| 순위 | HEX | 추정 출처/용도 | 결정 | 결정값 (토큰) | 사유 및 비고 |
|---:|---|---|---|---|---|
| 1 | `#666` | Tailwind 다크 회색 3자리 표기 | A. 기존 토큰 통합 | `var(--mg-color-text-secondary)` | 보조 텍스트 색상. 기존 토큰과 시각적 동등. 3자리 정규화 포함. |
| 2 | `#f3f4f6` | Tailwind gray-100 | A. 기존 토큰 통합 | `var(--mg-color-background-main)` | 밝은 배경/호버. D2에서 통합한 `#f9fafb`와 동일하게 메인 배경으로 통합. |
| 3 | `#333` | 다크 그레이 3자리 | A. 기존 토큰 통합 | `var(--mg-color-text-main)` | 기본 텍스트 색상. 기존 토큰과 시각적 동등. 3자리 정규화 포함. |
| 4 | `#9ca3af` | Tailwind gray-400 | A. 기존 토큰 통합 | `var(--mg-color-text-tertiary)` | D2에서 다크모드 변형으로 정의된 색상. 라이트/다크 양방향 호환을 위해 3차 텍스트로 통합. |
| 5 | `#e2e8f0` | Tailwind slate-200 | C. 폐기 통합 | `var(--mg-color-border-main)` | 보조 보더. 표준 테두리 토큰으로 흡수하여 일관성 확보. |
| 6 | `#d1d5db` | Tailwind gray-300 | C. 폐기 통합 | `var(--mg-color-border-main)` | 밝은 보더. D2 다크 변형 매핑과 겹치나, 라이트 모드 테두리로 쓰인 경우 표준 보더로 통합. |
| 7 | `#2d3748` | Bootstrap dark | C. 폐기 통합 | `var(--mg-color-text-main)` | 헤더 텍스트. Bootstrap 잔재이므로 메인 텍스트로 흡수. |
| 8 | `#fef3c7` | Tailwind yellow-100 | B. 신설 토큰 | `var(--mg-color-warning-bg)` | 경고 배경. 기존 시스템에 명시적인 경고 배경 토큰이 부족하여 신설. |
| 9 | `#f8fafc` | Tailwind slate-50 | A. 기존 토큰 통합 | `var(--mg-color-background-main)` | 밝은 배경. `#f3f4f6`와 함께 표준 배경으로 통합. |
| 10 | `#fee2e2` | Tailwind red-100 | B. 신설 토큰 | `var(--mg-color-error-bg)` | 에러 배경. 에러 상태를 명확히 표시하기 위한 배경 토큰 신설. |

## 2. 신설 토큰 정의 (`unified-design-tokens.css` 추가분)

`frontend/src/styles/unified-design-tokens.css` 파일의 변수 블록에 추가할 CSS 코드입니다.

```css
/* 2026 Q2 D3 합의서 신규 토큰 (경고/에러 배경) */
:root {
  --mg-color-warning-bg: #fef3c7;
  --mg-color-error-bg: #fee2e2;
}

/* 다크 모드 오버라이드 */
:root[data-theme="dark"] {
  --mg-color-warning-bg: #453303; /* 다크모드 경고 배경 (대비 조정) */
  --mg-color-error-bg: #450a0a; /* 다크모드 에러 배경 (대비 조정) */
}
```

## 3. codemod 매핑 테이블 갱신안 + 인프라 보강 권장

`scripts/design-system/color-management/convert-hardcoded-colors.js`에 추가할 매핑 항목입니다.

```js
// 2026 Q2 D3 합의서 매핑 (10건 + 3자리 HEX 정규화)

// 3자리 HEX 정규화 (case-insensitive 처리가 안 된 경우를 대비한 명시적 추가)
'#666': 'var(--mg-color-text-secondary)',
'#333': 'var(--mg-color-text-main)',
'#000': 'var(--mg-color-text-main)', // 추가 정규화
'#ccc': 'var(--mg-color-border-main)', // 추가 정규화
'#999': 'var(--mg-color-text-tertiary)', // 추가 정규화
'#eee': 'var(--mg-color-border-main)', // 추가 정규화

// A. 기존 토큰 매핑
'#f3f4f6': 'var(--mg-color-background-main)',
'#f8fafc': 'var(--mg-color-background-main)',
'#9ca3af': 'var(--mg-color-text-tertiary)',

// B. 신설 토큰
'#fef3c7': 'var(--mg-color-warning-bg)',
'#fee2e2': 'var(--mg-color-error-bg)',

// C. 폐기 통합 (Bootstrap 및 Tailwind 테두리/텍스트 잔재)
'#e2e8f0': 'var(--mg-color-border-main)',
'#d1d5db': 'var(--mg-color-border-main)',
'#2d3748': 'var(--mg-color-text-main)',
```

### codemod 인프라 보강 권장
- **3자리 HEX 정규화 처리**: `#666`, `#333` 등 3자리 HEX 값이 case-insensitive하게 매핑되도록 정규식 스캐너 보완 필요.
- **HARD_EXCLUDE 확장**: D2 라운드에서 토큰 정의 파일 7종이 codemod에 휩쓸린 회귀 사고를 방지하기 위해, `frontend/src/styles/unified-design-tokens.css` 등 토큰 정의 파일 경로를 `HARD_EXCLUDE` 목록에 명시적으로 추가.

## 4. 시각 회귀 위험·core-tester 우선 점검 화면

- **시각 회귀 위험도 (Medium)**: `#f3f4f6`, `#f8fafc` -> `var(--mg-color-background-main)`. 미세하게 구분되던 밝은 회색/푸른빛 배경이 단일 배경색으로 통합되어 영역 구분이 약해질 수 있음.
- **시각 회귀 위험도 (Medium)**: `#e2e8f0`, `#d1d5db` -> `var(--mg-color-border-main)`. 테두리 색상이 통합되면서 일부 컴포넌트(표, 카드)의 경계선 대비가 달라질 수 있음.
- **core-tester 우선 점검 화면**: 
  - 어드민 메인 대시보드 (`/admin`)
  - 컨설턴트 대시보드 v2 (`/consultant`)
  - 인증 페이지 공통 (`/login` 등 에러/경고 메시지 노출 영역)
  - 매핑 화면 모달 (테두리 및 배경 통합 확인)

## 5. 운영 게이트 임계 시뮬레이션

- **적용 전 하드코딩 카운트**: 1,801건 (D2 적용 후 잔존)
- **본 매핑을 통한 codemod 예상 절감량**: 314건 (Top 10 합산) + 3자리 정규화 잠재 케이스(수백 건 예상)
- **적용 후 예상 카운트**: 약 1,200건 수준
- **운영 게이트 임계(1,000건 미만) 도달 가능성**: D3 적용 시 1,200건 수준으로 감소하며, 이후 T8(인라인 스타일) 및 기타 잔여 하드코딩 클린업 병행 시 Q2 내 1,000건 미만(warn 임계) 도달이 매우 유력함.

## 6. 사용자 컨펌 필요 항목

- **`#d1d5db` 및 `#9ca3af`의 양방향 사용**: D2 합의서에서 다크모드 변형으로 정의된 값이 라이트 모드에서 직접 하드코딩된 케이스입니다. 이를 각각 `border-main`과 `text-tertiary`로 일괄 치환할 때 발생하는 시각적 차이에 대해 기획/디자인 파트의 최종 확인이 필요합니다.
- **배경색 통합 (`#f3f4f6`, `#f8fafc`)**: 호버(hover) 상태나 미세한 섹션 구분을 위해 사용된 배경색이 `background-main`으로 통합될 경우, UI의 깊이감이 감소할 우려가 있으므로 주요 화면(대시보드 등)에서의 시각적 수용 여부 컨펌이 필요합니다.

## 7. 다음 라운드 권장 (T1 3차 적용 또는 i18n Phase 2 병행)

- **잔여 3자리 HEX 완벽 제거**: 이번 정규화로 잡히지 않는 특이 케이스(예: `#abc`, `#123`)에 대한 추가 스캔 및 매핑.
- **rgba() 하드코딩 변환**: 투명도가 포함된 하드코딩 값(`rgba(0,0,0,0.5)` 등)을 `var(--mg-color-text-main)`에 `opacity` 속성을 조합하거나 전용 투명도 토큰으로 치환하는 방안 논의.
- **i18n Phase 2 병행**: 텍스트 길이에 따른 레이아웃 변경과 색상 통합에 따른 시각적 경계 변화가 겹치지 않도록, D3 안정화 이후 i18n 작업을 진행할 것을 권장.