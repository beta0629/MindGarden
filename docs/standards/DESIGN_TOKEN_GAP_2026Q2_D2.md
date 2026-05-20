# D2 합의서 — 표준 팔레트 토큰 매핑 (2026 Q2)

## 0. 결정 요약
- A. 기존 토큰 통합: 5건
- B. 신설 토큰: 2건
- C. 폐기 통합: 3건
- 적용 후 예상 잔존 HEX: ~1,700건

## 1. HEX 매핑 결정표
| HEX | Tailwind/Bootstrap | 결정 | 매핑 | 사유 |
|---|---|---|---|---|
| `#6b7280` | Tailwind gray-500 | A. 기존 토큰 통합 | `var(--mg-color-text-secondary)` | 디자인 가이드의 보조 텍스트 색상과 시각적 차이가 미미하여 단일 소스로 통합. |
| `#1f2937` | Tailwind gray-800 | A. 기존 토큰 통합 | `var(--mg-color-text-main)` | 다크 그레이 텍스트의 표준인 `#2c2c2c`와 유사하여 메인 텍스트 컬러로 편입. |
| `#f9fafb` | Tailwind gray-50 | A. 기존 토큰 통합 | `var(--mg-color-background-main)` | 밝은 배경 스케일 중 가장 널리 쓰이는 표준 배경색과 통합하여 일관성 확보. |
| `#2563eb` | Tailwind blue-600 | A. 기존 토큰 통합 | `var(--mg-color-info)` | 브랜드 표준 info 색상과 톤 매너가 같아 통합. |
| `#dc2626` | Tailwind red-600 | A. 기존 토큰 통합 | `var(--mg-color-error)` | 브랜드 표준 에러 색상으로 통일. 기존보다 약간 부드러운 톤으로 변경됨. |
| `#374151` | Tailwind gray-700 | B. 신설 토큰 | `var(--mg-color-text-secondary-dark)` | `text-main`과 `text-secondary` 사이의 명도가 필요한 다크 보조 텍스트 케이스를 위해 신설. |
| `#4b5563` | Tailwind gray-600 | B. 신설 토큰 | `var(--mg-color-text-tertiary)` | 입력 폼 플레이스홀더 및 덜 중요한 캡션 등 3차 텍스트 용도로 신설. |
| `#e5e7eb` | Tailwind gray-200 | C. 폐기 통합 | `var(--mg-color-border-main)` | 기존 사용되던 Tailwind 테두리 색상을 시스템 표준 border로 통합. |
| `#e9ecef` | Bootstrap gray-200 | C. 폐기 통합 | `var(--mg-color-border-main)` | Bootstrap 잔재 디자인. `e5e7eb`와 함께 표준 테두리 토큰으로 폐기 및 통합. |
| `#495057` | Bootstrap gray-700 | C. 폐기 통합 | `var(--mg-color-text-secondary)` | Bootstrap 잔재 텍스트 컬러. 표준 보조 텍스트 컬러로 대체 가능하므로 통합. |

## 2. 신설 토큰 정의 (`unified-design-tokens.css` 추가분)
```css
/* 2026 Q2 D2 합의서 신규 토큰 */
:root {
  --mg-color-text-secondary-dark: #374151;
  --mg-color-text-tertiary: #4b5563;
}

:root[data-theme="dark"] {
  --mg-color-text-secondary-dark: #d1d5db; /* Tailwind gray-300 대응 */
  --mg-color-text-tertiary: #9ca3af; /* Tailwind gray-400 대응 */
}
```

## 3. codemod 매핑 테이블 갱신안
```js
// scripts/design-system/color-management/convert-hardcoded-colors.js
// 2026 Q2 D2 합의서 매핑 (10건 + 3자리 HEX 추가)
'#fff': 'var(--mg-white)',

// A. 기존 토큰 매핑
'#6b7280': 'var(--mg-color-text-secondary)',
'#1f2937': 'var(--mg-color-text-main)',
'#f9fafb': 'var(--mg-color-background-main)',
'#2563eb': 'var(--mg-color-info)',
'#dc2626': 'var(--mg-color-error)',

// B. 신설 토큰
'#374151': 'var(--mg-color-text-secondary-dark)',
'#4b5563': 'var(--mg-color-text-tertiary)',

// C. 폐기 통합 (Bootstrap 및 Tailwind 테두리/보조 잔재)
'#e5e7eb': 'var(--mg-color-border-main)',
'#e9ecef': 'var(--mg-color-border-main)',
'#495057': 'var(--mg-color-text-secondary)',
```

## 4. 시각 회귀 위험·core-tester 우선 화면
- **시각 회귀 위험도 (High)**: `#dc2626` -> `var(--mg-color-error)` (`#E57373`). 기존보다 에러 텍스트/배경이 약간 연해집니다.
- **시각 회귀 위험도 (Medium)**: `#e5e7eb`, `#e9ecef` -> `var(--mg-color-border-main)` (`#D4CFC8`). 테두리가 기존 쿨톤 옅은 회색에서 웜톤(베이지 섞인) 회색으로 변경되어 일부 테이블/모달 경계선이 조금 더 진해 보일 수 있습니다.
- **core-tester 우선 점검 화면**: `HARDCODE_CLEANUP_HOTZONE_INVENTORY.md` 기준 우선 대상인 어드민 레이아웃 메뉴, 세팅 페이지 (Settings/Profile 등 Bootstrap 잔재가 남아있던 곳), 테이블/데이터 그리드 라인.

## 5. 운영 게이트 임계 시뮬레이션
- 적용 전 하드코딩 카운트: 2,399건
- 본 매핑을 통한 codemod 예상 절감량: 695건 + `#fff` 3자리 케이스 다수
- 적용 후 예상 카운트: 약 1,700건
- **운영 게이트 임계(1,000건 미만) 도달 가능성**: 향후 도메인별(Settings, AdminDashboard 등) 하드코딩 클린업과 병행 시 Q2 내에 1,000건 이하 달성이 매우 유력합니다. 본 D2 합의서 적용이 가장 큰 단일 감소폭(약 -700건)을 제공합니다.

## 6. 다음 라운드 권장 (T1 색상 트랙 후속 + i18n Phase 1과 병행 가능 여부)
- `var(--mg-white)`의 누락으로 인해 `rgba(255, 255, 255, X)` 등 투명도 베리에이션 매핑이 필요한지 T1 트랙에서 추가 조사가 필요합니다.
- 다음 라운드에서는 `rgb()` 하드코딩 케이스 및 인라인 스타일(`style={{ color: '#xxx' }}`)에 대한 일괄 컨버트 훅(Hook)을 추가로 논의할 것을 권장합니다.
- i18n Phase 1의 경우 텍스트 길이 변경에 따른 UI 레이아웃 검증이 필수적이므로, 본 디자인 토큰 일괄 치환 후 시각 회귀 점검을 마치고 안정화된 뒤 i18n 작업을 병행하는 것이 안전합니다.
