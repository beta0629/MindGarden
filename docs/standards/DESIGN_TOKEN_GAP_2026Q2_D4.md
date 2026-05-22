# D4 합의서 — 잔존 표준 팔레트 토큰 매핑 (2026 Q2)

## 0. 결정 요약
- **A. 기존 토큰 통합**: 2건 (`#ddd`, `#000`) — 3자리 HEX 정규화 포함
- **B. 신설 토큰**: 6건 (`#f0f9ff`, `#6b7c32`, `#991b1b`, `#fef2f2`, `#059669`, `#1e40af`) — 50/100/800 계열 및 다크 토큰 보강
- **C. 폐기 통합**: 2건 (`#f8d7da`, `#fff3cd`) — Bootstrap 잔재 흡수
- **적용 후 예상 잔존 HEX**: 1,670건에서 약 1,200건 수준으로 감소 (직접 변환 및 R-2 보호 잔존 포함), 운영 게이트 warn 임계(1,000 미만) 도달 가능성 확보.

## 1. HEX 매핑 결정표 (A/B/C)

| 순위 | HEX | 추정 출처/용도 | 결정 | 결정값 (토큰) | 사유 및 비고 |
|---:|---|---|---|---|---|
| 1 | `#ddd` | 3자리 회색 (테두리) | A. 기존 토큰 통합 | `var(--mg-color-border-main)` | 3자리 정규화 포함. 표준 보더로 통합. |
| 2 | `#f0f9ff` | Tailwind sky-50 (정보 배경) | B. 신설 토큰 | `var(--mg-color-info-bg)` | 정보(Info) 상태의 명시적인 배경 토큰 신설. |
| 3 | `#6b7c32` | 브랜드 olive | B. 신설 토큰 (보류) | `var(--mg-color-brand-olive)` | 브랜드 팔레트 편입 검토. 사용자(디자이너) 최종 컨펌 필요. |
| 4 | `#991b1b` | Tailwind red-800 (에러 다크) | B. 신설 토큰 | `var(--mg-color-error-dark)` | 에러 상태의 강한 텍스트/보더를 위한 800계열 추가. |
| 5 | `#fef2f2` | Tailwind red-50 (에러 배경 50) | B. 신설 토큰 | `var(--mg-color-error-50)` | 기존 100급(`--mg-color-error-bg`)과 구분되는 가장 밝은 배경. |
| 6 | `#059669` | Tailwind emerald-600 (성공) | B. 신설 토큰 | `var(--mg-color-success-600)` | 기존 시스템의 `--mg-color-success`(`#81C784`)와 색상 톤 거리가 커 우선 신설 (사용자 컨펌 후 통합 고려). |
| 7 | `#f8d7da` | Bootstrap danger-light | C. 폐기 통합 | `var(--mg-color-error-bg)` | Bootstrap 잔재. D3에서 신설된 에러 배경으로 통합. |
| 8 | `#fff3cd` | Bootstrap warning-light | C. 폐기 통합 | `var(--mg-color-warning-bg)` | Bootstrap 잔재. D3에서 신설된 경고 배경으로 통합. |
| 9 | `#1e40af` | Tailwind blue-800 (정보 다크) | B. 신설 토큰 | `var(--mg-color-info-dark)` | 정보 상태의 다크 텍스트/보더를 위한 800계열 추가. |
| 10 | `#000` | 검정 3자리 정규화 | A. 기존 토큰 통합 | `var(--mg-color-text-main)` | 기본 텍스트 색상 정규화. |

## 2. 신설 토큰 정의 (`unified-design-tokens.css` 추가분)

`frontend/src/styles/unified-design-tokens.css` 파일의 변수 블록에 추가할 CSS 코드입니다.

```css
/* 2026 Q2 D4 합의서 신규 토큰 */
:root {
  --mg-color-info-bg: #f0f9ff;
  --mg-color-info-dark: #1e40af;
  --mg-color-error-50: #fef2f2;
  --mg-color-error-dark: #991b1b;
  --mg-color-success-600: #059669;
  --mg-color-brand-olive: #6b7c32;
}

/* 다크 모드 오버라이드 (추정치 - 디자인 팀 검토 요망) */
:root[data-theme="dark"] {
  --mg-color-info-bg: #082f49;
  --mg-color-info-dark: #bae6fd;
  --mg-color-error-50: #450a0a;
  --mg-color-error-dark: #fca5a5;
  --mg-color-success-600: #6ee7b7;
  --mg-color-brand-olive: #d9f99d; 
}
```

## 3. codemod 매핑 갱신안 + 인프라 보강 권장

`scripts/design-system/color-management/convert-hardcoded-colors.js`에 추가할 항목입니다.

```js
// 2026 Q2 D4 합의서 매핑

// 3자리 회색 일괄 정규화 보강
'#000': 'var(--mg-color-text-main)',
'#ddd': 'var(--mg-color-border-main)',
'#ccc': 'var(--mg-color-border-main)',
'#bbb': 'var(--mg-color-text-tertiary)',
'#aaa': 'var(--mg-color-text-tertiary)',
'#999': 'var(--mg-color-text-tertiary)',
'#eee': 'var(--mg-color-border-main)',

// C. 폐기 통합 (Bootstrap 잔재)
'#f8d7da': 'var(--mg-color-error-bg)',
'#fff3cd': 'var(--mg-color-warning-bg)',

// B. 신설 토큰
'#f0f9ff': 'var(--mg-color-info-bg)',
'#1e40af': 'var(--mg-color-info-dark)',
'#fef2f2': 'var(--mg-color-error-50)',
'#991b1b': 'var(--mg-color-error-dark)',
'#059669': 'var(--mg-color-success-600)',
'#6b7c32': 'var(--mg-color-brand-olive)',
```

### 인프라 보강 권장
- **3자리 회색 일괄 정규화**: D3에서 부분적으로만 다뤘던 3자리 HEX를 일괄 매핑에 포함.
- **`rgba()` 변형 지원**: 현재 codemod는 `rgba(R, G, B, A)`의 공백 없는 정확 매칭만 처리합니다. `rgba(0,0,0,.1)` 등 다양한 alpha 형태 및 소수점/공백 변형을 캡처할 수 있도록 정규식 및 치환 로직 보완이 필요합니다.

## 4. 시각 회귀 위험·core-tester 우선 점검 화면

- **시각 회귀 위험도 (Medium)**: 50/100/800 계열의 토큰이 기존 500급 토큰들과 일관성을 유지하는지 확인 필요.
- **시각 회귀 위험도 (Medium-High)**: Bootstrap 잔여 색상(`danger-light`, `warning-light`)을 신규 에러/경고 배경 토큰으로 일괄 치환 시 경계선/배경의 시각적 강조도가 달라질 수 있음.
- **core-tester 우선 점검 화면**:
  - 어드민 메인 대시보드 (`/admin`)
  - 임상 모듈 `RiskAlertBadge` (에러/경고 상태의 토큰 치환)
  - `SOAPNoteEditor` (텍스트/배경 회색 및 상태 표시 변화)

## 5. 운영 게이트 임계 시뮬레이션

- **적용 전 잔존 HEX**: 1,670건 (D3 라운드 적용 및 R-2 보류 포함 기준)
- **D4 예상 절감량**: 본 문서의 10대 HEX(총 160건) 직접 치환 및 3자리/rgba 잠재 변형 매핑 보강 포함 약 400~470건 이상 절감 기대.
- **적용 후 예상 잔존 카운트**: 약 1,200건
- **1,000건 미만 도달 가능성**: D4 매핑 적용 후 추가로 `rgba()` 변형 치환 인프라가 배포되면, T1 트랙 목표인 **운영 게이트 warn 임계 < 1,000건 달성**이 매우 유력합니다.

## 6. 사용자 컨펌 필요 항목

기획/디자인 파트 최종 의사결정이 필요한 사항입니다.
- **`#059669` (emerald-600) vs 기존 `--mg-color-success` (`#81C784`)**: 시스템 내 두 성공 색상의 톤 거리가 멉니다. 사용자의 미세 체감 변화를 감수하고 하나로 통합할지, 아니면 D4안처럼 `success-600` / `success-dark`로 신설 유지할지 판단 요망.
- **`#6b7c32` (브랜드 olive)**: 브랜드 팔레트로 공식 신설할지, 아니면 단순 미스매치로 간주해 타 톤으로 통합/폐기할지 결정.
- **토큰 네이밍 일관성**: 에러 50/100/800 계열 도입에 따라, 기존 500급의 명칭(`success`, `error`)과 섞였을 때 네이밍 룰(`success-50`/`success-100`/`success-dark` 등)을 어떻게 재정비할지 합의 필요.

## 7. 다음 라운드 권장 (D5 또는 i18n Phase 2 병행)

- **rgba() 및 3자리 완벽 흡수**: D4에서 제안한 인프라 보완을 적용 후, T1-C 잔존물 최종 클렌징.
- **D5 라운드 평가**: D4 적용 후 운영 게이트 1,000 미만 도달 시, D5는 하드코딩 치환이 아닌 **테마 오버라이드 고도화** 및 **i18n Phase 2 병행** 작업으로 방향 전환 권장.
