# D6 P1 Design Handoff: 디자이너 컨펌 및 신설 토큰 결정

## §0 요약 (TL;DR)
- **사용처 판정**: `Pink accent`는 다수 모듈 산재로 **비한정(폐기/Tailwind 흡수 권고)**, `NAVER green`은 OAuth 버튼 전용으로 **한정(신설 확정)**.
- **8 토큰 결정**: 신설 후보 8종의 라이트·다크 hex를 결정했으며, 텍스트 용도 2건 모두 WCAG AA 대비비를 통과(100%).
- **다크 매트릭스**: D6 신설 5종 외에 누락된 warning/success 계열의 매트릭스 정합은 D7으로 이월하여 일괄 처리할 것을 권고.

## §1 사용처 grep 결과

### 1. Pink accent (`#ff6b9d`) — 10건 (비한정)
- **파일 목록**:
  - `frontend/src/styles/unified-design-tokens.css`
  - `frontend/src/styles/00-core/_variables.css`
  - `frontend/src/components/wellness/WellnessNotificationList.css` (3건)
  - `frontend/src/components/wellness/WellnessNotificationDetail.css` (2건)
  - `frontend/src/components/dashboard/WelcomeSection.css` (1건)
  - `frontend/src/components/client/ClientSchedule.css` (1건)
  - `frontend/src/components/admin/system/SystemTools.css` (3건)
- **판정 결과**: **비한정**. mood-journal(마음날씨)에 국한되지 않고 wellness, dashboard, admin 전반에 산재되어 사용 중.
- **권고**: 외부 브랜드 토큰으로 신설하지 않고 Tailwind pink/rose 계열로 흡수 또는 폐기 권고. (단, P2-a 하위 호환을 위해 임시 토큰 정의는 전달)

### 2. NAVER green (`#03c75a`) — 7건 (한정)
- **파일 목록**:
  - `frontend/src/styles/auth/TabletLogin.css` (2건)
  - `frontend/src/styles/auth/UnifiedLogin.css` (1건)
  - `frontend/src/components/admin/PaymentConfirmationModal.js` (4건, 빌드 및 스냅샷 포함)
- **판정 결과**: **한정**. NAVER OAuth 로그인 및 네이버페이 결제 버튼 위젯에만 사용 중.
- **권고**: 외부 브랜드 가이드 준수를 위해 `--mg-color-naver-green` 신설 확정.

## §2 신설 8 토큰 hex 결정표

| 토큰 | 라이트 hex | 다크 hex | 용도 | WCAG AA 대비비 / 비고 |
|---|---|---|---|---|
| `--mg-color-pink-accent` | `#ff6b9d` | `#f472b6` | (비한정 산재) | 비한정으로 폐기 권고 (임시 hex: 다크는 pink-400 적용) |
| `--mg-color-brand-olive-light` | `#9caf88` | `#b5c5a4` | 마케팅 배너 보조 | 표면/배경용 (텍스트 아님, N/A) |
| `--mg-color-naver-green` | `#03c75a` | `#03c75a` | NAVER OAuth 버튼 | 브랜드 고유색 (흰 텍스트 2.3:1 예외 허용) |
| `--mg-color-success-100` | `#d1fae5` | `#064e3b` | success light surface | 표면용 (텍스트 아님, N/A) |
| `--mg-color-success-800` | `#065f46` | `#6ee7b7` | success dark text | on `#d1fae5`(Lt) 6.6:1 PASS / on `#064e3b`(Dk) 6.3:1 PASS |
| `--mg-color-error-100` | `#fecaca` | `#7f1d1d` | error light surface | 표면용 (텍스트 아님, N/A) |
| `--mg-color-info-100` | `#dbeafe` | `#1e3a8a` | info light surface | 표면용 (텍스트 아님, N/A) |
| `--mg-color-warning-dark` | `#856404` | `#fde68a` | warning dark text | on `#fef3c7`(Lt) 4.7:1 PASS / on `#78350f`(Dk) 6.6:1 PASS (D4 warning-800과 통합) |

*통과율: 텍스트 용도로 식별된 2건 모두 WCAG AA(4.5:1 이상) PASS (2/2 = 100%).*

## §3 brand-olive 팔레트 위계 가이드
- `--mg-color-brand-olive`(`#6b7c32`)는 본문 내 포인트 텍스트 및 주요 뱃지에 사용하여 명시성을 높이고, 신설된 `--mg-color-brand-olive-light`(`#9caf88`)는 마케팅 배너의 배경이나 넓은 면적의 보조 표면 요소로 사용하여 시각적 위계를 분리합니다.

## §4 다크 매트릭스 정합 권고
- D6 §4 표에서 확인된 것처럼 `warning` 및 `success` 계열의 50, 100, 800 단계가 CSS 변수로 명확히 선언되지 않고 cascade(`cs-*` alias)에 의존하고 있습니다.
- **D7 이월 후보 (약 6건)**: `warning-100`, `warning-800`, `success-50` 등의 라이트·다크 톤을 `unified-design-tokens.css`에 직접 명시하여 다크 매트릭스를 100% 완전하게 정합시킬 것을 권고합니다.

## §5 P2-a 핸드오프 핵심 (`core-coder` 다음 라운드 입력)
1. **`unified-design-tokens.css` 추가할 라이트·다크 cascade 블록**:
   - 8개 토큰 × 2모드 = **16 줄 정의 코드** (폐기 권고인 Pink accent 포함 시 16줄, 제외 확정 시 14줄 적용).
2. **`convert-hardcoded-colors.js` 추가할 매핑 라인**:
   - 직접 매핑 및 통합 매핑 약 **12~14건** 추가 (D6 §6 매핑 갱신안 기준).
3. **SSOT 원칙**: C4 결정에 따라 D6 P2-a는 `unified-design-tokens.css` 내 SSOT 정의만 추가합니다. 실제 사용처(CSS/JS)의 하드코딩 흡수(codemod 실행)는 시각 회귀 위험을 통제하기 위해 **D7로 이월**합니다.
