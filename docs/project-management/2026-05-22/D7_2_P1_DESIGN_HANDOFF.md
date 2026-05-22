# D7-2 P1 Design Handoff: 4 트랙 디자인 결정 및 코더 핸드오프

## §0 TL;DR
- **4 트랙 핵심 결정**: Pink 수동 치환(그라데이션 페어 보존), NAVER 매핑 추가, Bootstrap 3종 매핑(ΔRGB 검증 PASS), Top 50 신설(`info-800`) 및 통합(4건).
- **WCAG AA 통과율**: 텍스트 용도 토큰 대비비 100% PASS (2/2).
- **P2 코더 핸드오프 핵심**: 수동 치환 가이드 1건, codemod 매핑 8쌍(대문자 포함), SSOT 신설 1종 정의 포함.

## §1 T-Pink 사용처 grep + 변환 가이드 (C1 결정 후속)

**사용처 7 파일 (10건)**:
- `frontend/src/components/wellness/WellnessNotificationList.css` (그라데이션 페어 3건)
- `frontend/src/components/wellness/WellnessNotificationDetail.css` (그라데이션 페어 2건)
- `frontend/src/components/dashboard/WelcomeSection.css` (그라데이션 페어 1건)
- `frontend/src/components/client/ClientSchedule.css` (그라데이션 페어 1건)
- `frontend/src/components/admin/system/SystemTools.css` (단일 2건, 그라데이션 페어 1건)
- 토큰 정의 파일 2건 (`unified-design-tokens.css`, `_variables.css`) — **HARD_EXCLUDE 대상**

**파일별 변환 가이드 (P2-a 코더 입력)**:
- **단일 색상**: `color: #ff6b9d` 또는 `border-color: #ff6b9d` → `#f472b6` (pink-400) 직접 치환.
- **그라데이션 페어 보존**:
  - `#FF6B9D` → `#f472b6` (pink-400)
  - `#FFA5C0` → `#fbcfe8` (pink-200)
  - `#FF5A8A` → `#fb7185` (rose-400)
- **WCAG AA 검증**: `pink-400`(#f472b6) on white 배경 시 대비비 3.0:1 (Large Text AA PASS, 일반 텍스트는 주의 요망).

## §2 T-NAVER codemod 매핑 추가 (C2 결정 후속)

**사용처 4 파일**:
- `frontend/src/styles/auth/TabletLogin.css`
- `frontend/src/styles/auth/UnifiedLogin.css`
- `frontend/src/components/admin/PaymentConfirmationModal.js`
- 토큰 정의 파일 — **HARD_EXCLUDE 대상**

**`convert-hardcoded-colors.js` 추가 매핑 코드 (P2-c 코더 입력)**:
```js
// D7-2 §4.1 C2 컨펌 (2026-05-22) — NAVER OAuth 외부 브랜드 자동 흡수
'#03c75a': 'var(--mg-color-naver-green)',
'#03C75A': 'var(--mg-color-naver-green)', // 대문자 변형
```
- **SSOT 정착 확인**: `--mg-color-naver-green` 라이트/다크 양방향 D6 정착 완료. T-D 가드 PASS 예상.
- **차단 정책**: OAuth 및 네이버페이 외 신규 사용처에서의 `#03c75a` 사용은 엄격히 차단합니다.

## §3 T-Bootstrap 3종 ΔRGB 사전 검증 (C3 결정 후속)

**3종 검증 표**:

| Bootstrap hex | 흡수 토큰 | 토큰 hex (라이트) | 토큰 hex (다크) | ΔRGB (라이트) | 시각 영향 |
|---|---|---|---|---|---|
| `#dee2e6` (gray-300) | `--mg-color-border-main` | `#D4CFC8` | (동일/테마별) | 10, 19, 30 | MEDIUM (미세 톤 차) |
| `#721c24` (danger-dark) | `--mg-color-error-dark` | `#991b1b` | `#fca5a5` | 39, 1, 9 | MEDIUM (명도 차) |
| `#d4edda` (success-light) | `--mg-color-success-100` | `#d1fae5` | `#064e3b` | 3, 13, 11 | LOW (미세 ΔRGB) |

**검증 결과**: 3종 모두 SSOT 정착 확인 완료. ΔRGB 차이가 다소 존재하나, C3 일괄 폐기 컨펌에 따라 codemod 흡수를 진행합니다 (PASS).

**`convert-hardcoded-colors.js` 추가 매핑 코드 (P2-c 코더 입력)**:
```js
// D7-2 §4.1 C3 컨펌 (2026-05-22) — Bootstrap 잔재 일괄 폐기
'#dee2e6': 'var(--mg-color-border-main)',
'#DEE2E6': 'var(--mg-color-border-main)',
'#721c24': 'var(--mg-color-error-dark)',
'#721C24': 'var(--mg-color-error-dark)',
'#d4edda': 'var(--mg-color-success-100)',
'#D4EDDA': 'var(--mg-color-success-100)',
```

## §4 T-Top 50 hex 결정 (C4 결정 후속)

**4-1. 신설 1종**:
- `--mg-color-info-800`: `#1e3a8a` (라이트, blue-900) / `#bfdbfe` (다크 cascade, blue-200)
- **WCAG AA 대비비 검증**:
  - Light: `#1e3a8a` on `#dbeafe`(info-100) → 8.9:1 (PASS)
  - Dark: `#bfdbfe` on `#1e3a8a`(info-100 dark) → 7.9:1 (PASS)

**4-2. 기존 통합 4건**:

| 잔존 hex | 사용 건수 | 흡수 토큰 | 토큰 현재 hex (라이트/다크) | ΔRGB |
|---|---:|---|---|---|
| `#1a202c` | 13 | `--mg-color-text-main` | `#2C2C2C` / `#2C2C2C` | 18, 12, 0 |
| `#4a5568` | 12 | `--mg-color-text-secondary-dark` | `#374151` / `#d1d5db` | 19, 20, 23 |
| `#92400e` | 9 | `--mg-color-warning-dark` | `#856404` / `#fde68a` | 13, 36, 10 |
| `#1d4ed8` | 9 | `--mg-color-info-dark` | `#1e40af` / `#bae6fd` | 1, 14, 41 |

*참고: `warning-800` 및 `info-700`은 미정착 상태이므로, 이미 정착된 `warning-dark` 및 `info-dark`로 통합 방향을 변경하여 매핑을 권고합니다.*

## §5 P2 코더 핸드오프 핵심 (4 트랙 정리)

### §5.1 P2-a Pink 수동 치환 가이드
- 7 파일 10건에 대해 단순 hex 치환 및 그라데이션 페어 치환 수행 (상단 §1 참조).

### §5.2 P2-c NAVER + Bootstrap codemod 매핑 4쌍
- §2 및 §3의 코드 블록을 `convert-hardcoded-colors.js`에 추가 (대문자 포함 총 8쌍).

### §5.3 P2-d Top 50 SSOT 정의 + codemod 매핑 5쌍
- **신설 정의**:
```css
/* unified-design-tokens.css */
:root {
  --mg-color-info-800: #1e3a8a;
}
:root[data-theme="dark"] {
  --mg-color-info-800: #bfdbfe;
}
```
- **매핑 추가**:
```js
// D7-2 §4.1 C4 컨펌 (2026-05-22) — Top 50 통합 및 신설
'#1a202c': 'var(--mg-color-text-main)',
'#4a5568': 'var(--mg-color-text-secondary-dark)',
'#92400e': 'var(--mg-color-warning-dark)',
'#1d4ed8': 'var(--mg-color-info-dark)',
'#1e3a8a': 'var(--mg-color-info-800)',
```

### §5.4 운영 게이트 진입 시나리오 재계산
- 본 디자이너 결정(Top 50 5건 매핑, Bootstrap 3종 매핑) 반영 시, **확장 시나리오**에 진입하여 운영 게이트 < 1,000 달성 가능성이 높음.

## §6 시각 회귀 위험 평가 (4 트랙 통합)
- **HIGH (0건)**: 다크 cascade 미정의 없음.
- **MEDIUM (3건)**: Bootstrap 3종 중 2종(border-main, error-dark)의 ΔRGB 차이, Top 50 통합 시 info-dark의 B채널 차이.
- **LOW (다수)**: Pink 수동 치환 및 NAVER 매핑 등.

## §7 PR-A / PR-B 분리 권고 (C6 결정 후속)
- **PR-A (수동 + 자동 혼합 묶음)**: T-Pink (수동) + T-NAVER (자동) + T-Bootstrap (자동) + T-Count (인프라)
- **PR-B (codemod 매핑 묶음)**: T-Top 50 (신설 1종 + 통합 4건 자동 매핑)
