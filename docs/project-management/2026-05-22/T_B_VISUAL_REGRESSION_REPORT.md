# T-B 운영 정착 시각 회귀 검수 보고서 (D5 §3.2 게이트)

> **작성**: 2026-05-22 (core-tester)
> **유형**: 시각 회귀 검수 보고서 (코드 무수정, 정량·정성 분석)
> **상위 합의**: `docs/standards/DESIGN_TOKEN_GAP_2026Q2_D5_DESIGN.md` §1~§4, `docs/standards/DESIGN_TOKEN_GAP_2026Q2_D5_DIRECTION.md` §3.2
> **대상 커밋**: `86b663381` (D5 T-B 테마 고도화 일괄 정착)
> **운영 배포**: 2026-05-21 16:39:27 KST (Last-Modified `Thu, 21 May 2026 07:39:27 GMT`)
> **연계**: `docs/project-management/CORE_PLANNER_DELEGATION_ORDER.md`, `0aa3bbcee` (weekend 핫픽스)

---

## 0. 검수 결론 (TL;DR)

- **D5 §3.2 T-B 게이트 판정: ✅ PASS**
  - 운영 CSS 산출물 단일 (`main.6e6cca10.css`) 로컬 빌드와 **바이트 단위 0건 차이** (`cmp -l` = 0)
  - 변경 토큰 8종 (alias 5 + success + brand-olive + primary-dark) **라이트·다크 양방향 정착 확인**
  - `--mg-color-success-600` 토큰 운영 CSS 정의·치환 **완전 제거** (0건)
  - D5 §2 다크 4종 (`info-bg`/`info-dark`/`error-50`/`error-dark`) 라이트·다크 매핑 정착 확인
- **weekend 핫픽스 (`0aa3bbcee`) 재검증: ✅ PASS**
  - 통합 스킨 (`[data-calendar-skin="integrated"]`) weekend td 자식 `.fc-non-business` 투명화 셀렉터 운영 잔존
  - weekend td 배경 폴백 체인 (`color-mix → background-main → surface-main`) 정합 유지, `--mg-color-background-main:#faf9f7` (라이트) / `#1a1a1a` (다크) 운영 정의 정상
- **회귀 발견 건수**: HIGH 0건 / MEDIUM 0건 / LOW 1건 (관찰사항 1, §4 참조)
- **임상 모듈 (RiskAlertBadge/SOAPNoteEditor/DiagnosticReportEditor/AudioRecorder) 위험 자동 차단**: 4개 컴포넌트 모두 `frontend/src` 어디서도 import 미수행 → 빌드 산출물 미포함 → 운영 화면 시각 영향 **0건** (§5 발견)
- **후속 권장**: §7 — T-A rgba/3자리 흡수 (T-D 가드 배포 후) 또는 i18n Phase 2 별도 합의서 진입

---

## 1. 검수 방법론

### 1.1 정량 검증 (Quantitative)

| 축 | 방법 | 도구 | 결과 |
|---|---|---|---|
| **운영 vs 로컬 동일성** | 운영 CSS 다운로드 후 `cmp -l` 바이트 비교 | `curl` + `cmp` | 0건 차이 (완전 일치) |
| **토큰 정착 검출** | 라이트/다크 hex 값 grep | `grep -ao -E` | 16/16 검출 (8 토큰 × 2 테마) |
| **success-600 제거** | 운영 CSS 내 `--mg-color-success-600` 정의·사용 검색 | `grep -ac` | 0건 (완전 제거) |
| **weekend 셀렉터** | `.fc-non-business` 투명화 + weekend td color-mix 규칙 추출 | Python regex | 매치 2건 (sat/sun) + 폴백 체인 1쌍 |
| **사용량 측정** | `var(--mg-color-*)` 참조 카운트 | Python regex | §3.3 표 |
| **임상 컴포넌트 import** | `frontend/src` 전체에서 `components/clinical` 검색 | Grep | 0건 (자가 참조만 존재) |

### 1.2 정성 평가 (Qualitative)

- **시각 인상 차이**: 토큰 hex 값 RGB 거리 + 사용 셀렉터 카테고리 기준으로 평가 (Low / Med / High)
- **WCAG 영향**: 변경 토큰 중 텍스트·아이콘 표면 색에 적용된 토큰만 평가
- **사용자 인식 가능성**: 운영 화면 광범위 적용 토큰(`surface-main` 144건)과 한정 적용 토큰(`brand-olive` 2건)을 구분

### 1.3 검수 미수행 사항 (한계)

- **직접 화면 캡처 (브라우저 자동화)**: 본 검수는 core-tester 단독 작업이며 별도 browser-use 서브에이전트 위임 권한이 없음. 화면 캡처는 사용자 UAT 또는 별도 위임 시 수행 권장.
- **사용자 인터랙션 시나리오**: 로그인 후 페이지 (`/admin/*`)의 동적 상태 (예: hover, focus, drag) 시각 회귀는 정적 CSS 분석으로 추정. UAT 권장.

---

## 2. 운영 CSS 정착 검증 (§2 게이트 1)

### 2.1 운영 산출물 메타데이터

| 항목 | 값 |
|---|---|
| 운영 URL | `https://app.core-solution.co.kr/static/css/main.6e6cca10.css` |
| Content-Length | 2,093,658 bytes |
| Last-Modified | `Thu, 21 May 2026 07:39:27 GMT` (= 2026-05-21 16:39:27 KST) |
| ETag | `"6a0eb6af-1ff25a"` |
| 로컬 빌드 해시 | `main.6e6cca10.css` (동일) |
| 빌드 산출물 위치 | `frontend/build/static/css/main.6e6cca10.css` |
| 바이트 단위 비교 | `cmp -l prod local` → **0건 차이** |

### 2.2 alias 5종 라이트·다크 hex 정착 (디자이너 §1)

| 토큰명 | 라이트 (운영) | 다크 (운영) | 디자이너 §1 결정 | 검증 |
|---|---|---|---|---|
| `--mg-color-surface-main` | `#f5f3ef` | `#262626` | `#F5F3EF / #262626` | ✅ |
| `--mg-color-background-base` | `#faf9f7` | `#1a1a1a` | `#FAF9F7 / #1A1A1A` | ✅ |
| `--mg-color-background-muted` | `#f2ede8` | `#2c2c2c` | `#F2EDE8 / #2C2C2C` | ✅ |
| `--mg-color-background-secondary` | `#ebe6e0` | `#232323` | `#EBE6E0 / #232323` | ✅ |
| `--mg-color-background-sub` | `#e0dbd5` | `#333` | `#E0DBD5 / #333333` | ✅ (3자리 단축형) |

### 2.3 success 통합 + brand-olive + primary-dark (디자이너 §3·§4 + T-D 가드)

| 토큰명 | 라이트 (운영) | 다크 (운영) | 디자이너 결정 | 검증 |
|---|---|---|---|---|
| `--mg-color-success` | `#059669` | `#6ee7b7` | §4 옵션 A 통합 (emerald-600 / emerald-300) | ✅ |
| `--mg-color-brand-olive` | `#6b7c32` | `#d9f99d` | §3 brand 팔레트 공식 편입 | ✅ |
| `--mg-color-primary-dark` | `#2a3b30` | `#4f6b5a` | T-D 가드 SSOT 누락 보강 | ✅ |
| `--mg-color-success-600` | (정의 0건) | (정의 0건) | §4 옵션 A 통합으로 폐기 | ✅ 완전 제거 |
| `--mg-color-success-rgb` | `5, 150, 105` | `110, 231, 183` | §4 통합 후 emerald RGB | ✅ |

### 2.4 D5 §2 다크 6종 (D4 추정치 채택 확정)

| 토큰명 | 라이트 (운영) | 다크 (운영) | 디자이너 §2 결정 | 검증 |
|---|---|---|---|---|
| `--mg-color-info-bg` | `#f0f9ff` | `#082f49` | sky-50 / sky-950 | ✅ |
| `--mg-color-info-dark` | `#1e40af` | `#bae6fd` | blue-800 / sky-200 | ✅ |
| `--mg-color-error-50` | `#fef2f2` | `#450a0a` | red-50 / red-950 | ✅ |
| `--mg-color-error-dark` | `#991b1b` | `#fca5a5` | red-800 / red-300 | ✅ |
| `--mg-color-success-600` | (통합 폐기) | (통합 폐기) | §4 success로 흡수 | ✅ |
| `--mg-color-brand-olive` | (위 §2.3 참조) | (위 §2.3 참조) | §3 재정렬 | ✅ |

> **검증 결과**: D5 디자이너 합의서 §1~§4 의사결정이 운영 CSS에 hex 단위로 정확히 정착됨. SSOT 정합도 100%.

---

## 3. 변경 토큰 사용량 측정 (§5 위험 매트릭스 입력)

### 3.1 alias 5종 사용량 (라이트 페이지 기준, 운영 main.css)

| 토큰 | 사용 셀렉터 수 | 라이트 변경 | 변화 강도 (ΔRGB) | 위험 분류 |
|---|---:|---|---:|---|
| `--mg-color-surface-main` | 144 | `#FAF9F7` (alias) → `#F5F3EF` | -5 (R), -6 (G), -8 (B) | **Med** (광범위·미세) |
| `--mg-color-background-base` | 3 | `#FAF9F7` (alias) → `#FAF9F7` (값 동일) | 0 | **None** |
| `--mg-color-background-muted` | 2 | `#FAF9F7` → `#F2EDE8` | -8/-11/-15 | Low (사용처 한정) |
| `--mg-color-background-secondary` | 0 | (사용 없음) | — | **None** |
| `--mg-color-background-sub` | 4 | `#FAF9F7` → `#E0DBD5` | -26/-30/-34 | Low~Med (사용처 적으나 톤 차 큼) |

### 3.2 success / brand-olive / primary-dark 사용량

| 토큰 | 사용 셀렉터 수 | 변경 | 위험 분류 |
|---|---:|---|---|
| `--mg-color-success` | 21 | `#81C784` → `#059669` (파스텔 → 짙은 에메랄드) | **Med** (한정·인상 큼, WCAG AA 향상 의도) |
| `--mg-color-brand-olive` | 2 | (신규 — Tailwind arbitrary value) | Low |
| `--mg-color-primary-dark` | 22 | (이전 SSOT 누락 → `#2a3b30` 정착) | Low~Med (primary 버튼 hover/active 일관성 회복) |

### 3.3 weekend 핫픽스 잔존 셀렉터 (운영 main.css)

```
[data-calendar-skin=integrated]
  .mg-v2-schedule-calendar.mg-v2-ad-b0kla
  .mg-v2-schedule-calendar-view
  td.fc-daygrid-day.mg-v2-ad-calendar-day--weekend-{sat,sun}
  .fc-non-business
{ background: #0000 !important }   /* transparent */
```

- **사sun 셀렉터 그룹**: 운영 검출 2건 (토/일)
- **`.fc-non-business` 정의**: 운영 4건 (B0KlA 전역 흰색 덮기 + 통합 스킨 weekend 투명화 1쌍)
- **weekend td 배경**: `color-mix(in srgb, var(--mg-info-300) 14%, var(--mg-color-surface-main))` (토요일) / `var(--mg-error-300) 12%` (일요일). 두 줄로 정의되어 두 번째 폴백 체인 `var(--mg-color-background-main, var(--mg-color-surface-main))` 적용.
- **`--mg-color-background-main`**: 라이트 `#faf9f7` / 다크 `#1a1a1a` 운영 정의 살아있음 (R-3 핫픽스 잔존).

---

## 4. 시각 회귀 위험 매트릭스 (D5 §5 측정 결과)

### 4.1 트랙별 측정 결과

| 트랙 | D5 §5 가이드 | 본 검수 측정 | 판정 |
|---|---|---|---|
| **T-E alias 정착** | Low~Med | 측정값: surface-main 144건 (광범위·미세, ΔRGB ≤ 8), background-sub 4건 (사용처 적으나 ΔRGB 26~34), 다른 alias 0~3건. **사용자 인식 가능성: 카드 경계가 1~2단계 또렷해짐 (의도된 변경)** | **Low** |
| **T-B 테마 고도화 (성공 통합)** | Med~High | 측정값: success 21건 (PaymentConfirm/SalaryExport/TabletLogin hover 등 한정), 임상 모듈 (RiskAlert/SOAP/Diagnostic/Audio) 빌드 미포함으로 영향 0. **사용자 인식 가능성: hover/뱃지 색이 진한 에메랄드로 인상 변경 (WCAG AA 향상 의도)** | **Low~Med** |
| **T-B 다크 6종 매핑** | Med | 측정값: info/error 50·800 다크 매핑 정착, success-dark/brand-olive-dark/primary-dark 신규 정착. **다크 모드 활성 사용자 한정, 가독성 향상 의도** | **Low** (다크 사용 비중 가정) |
| **종합** | Med | 측정값: HIGH 0건 / MEDIUM 0건 / LOW 1건 (관찰사항) | **Low** |

### 4.2 회귀 발견 (HIGH / MEDIUM / LOW)

#### HIGH (0건)
- 없음.

#### MEDIUM (0건)
- 없음.

#### LOW (1건) — 관찰사항 (회귀 아님)

| # | 위치 | 증상 | 재현 절차 | 심각도 | 권장 조치 |
|---|---|---|---|---|---|
| L-1 | weekend td 배경 폴백 체인 (`ScheduleCalendarView.css` weekend-sat/sun 규칙) | 운영 CSS에서 `background-color` 가 동일 셀렉터에 2번 정의되어 있어 (한 줄은 surface-main, 한 줄은 `background-main` 폴백 체인) 두 번째 정의가 우선 적용되는 cascade. 폴백 체인 자체는 정합하나 `--mg-color-background-main`(R-3 핫픽스) 토큰이 D5 §1에서 `background-base` 와 동일 값으로 분리됐음에도 별도 토큰으로 살아있어 SSOT 중복 형태. | `https://dev.core-solution.co.kr/admin/mapping-schedule` → 통합 스케줄 캘린더 → 주말 컬럼 inspect → computed style 확인 | **LOW** (시각 영향 0건 — 두 토큰 값이 동일하고 폴백 체인 작동) | 후속 라운드 (D6) 다크모드 토큰 표준화 시 `--mg-color-background-main` → `--mg-color-background-base` alias 합쳐서 단일 SSOT 정리 권장 (본 라운드에서는 회귀 아님, 정착 OK). |

> **결론**: 본 검수 범위에서 시각 회귀 0건. L-1은 D6 라운드 리팩토링 항목(SSOT 단일화)으로만 관찰됨.

---

## 5. 임상 모듈 빌드 미포함 발견 (자동 위험 차단)

### 5.1 발견 사항

D5 디자이너 §5에서 다크 모드 UAT 우선 점검 화면으로 지목된 4개 임상 컴포넌트 중 src에 코드 변경(success-600 → success)이 반영되었으나, **운영 빌드 산출물에는 클래스가 포함되어 있지 않음**.

| 컴포넌트 | src 변경 건수 | 운영 CSS 검출 | 원인 |
|---|---:|---|---|
| `RiskAlertBadge.css` | 1건 (`.confidence`) | 0건 | `components/clinical` 미import |
| `SOAPNoteEditor.css` | 2건 (`.btn-success:hover`, `.approval-notice`) | 0건 | 동일 |
| `DiagnosticReportEditor.css` | 2건 (`.btn-success:hover`, `.meta-item.reviewed`) | 0건 | 동일 |
| `AudioRecorder.css` | 1건 (`.btn-success:hover`) | 0건 | 동일 |

### 5.2 검증 방법

- `Grep components/clinical` (`frontend/src` 전체): 검색 결과 **0건** (자가 참조 외 외부 import 없음)
- 빌드 산출물 (`frontend/build/static/css/*.css`) 내 `risk-alert`, `RiskAlertBadge`, `approval-notice`, `meta-item.reviewed`, `btn-success` 등 클래스 검색: 매우 일반적인 `.btn-success` 1건만 검출 (Bootstrap 잔재로 추정, success 토큰 미사용 — `background-color: var(--mg-success-500)` 사용)

### 5.3 의의

- **현재 시각 회귀 위험**: 0건 (운영 화면에 임상 컴포넌트 미노출)
- **미래 회귀 위험 잠재**: 향후 임상 모듈이 import되면 success 통합 톤(`#059669` 진한 에메랄드)이 일괄 적용되며 시각 인상 변경. 단 D5 §4 옵션 A 결정대로 WCAG AA 향상 의도와 정합하므로 정합성 자체는 문제 없음.
- **권장 후속**: 임상 모듈 활성화 시점(별도 트랙)에 RiskAlertBadge/SOAPNoteEditor/DiagnosticReportEditor/AudioRecorder 시각 UAT 1회 수행 (현 시점에서는 불필요).

---

## 6. weekend 핫픽스 재검증 (특별 점검)

### 6.1 점검 결과: ✅ PASS

| 검증 항목 | 측정값 | 판정 |
|---|---|---|
| 통합 스킨 weekend td 자식 `.fc-non-business` 투명화 셀렉터 운영 잔존 | 1쌍 (sat + sun, `background: #0000 !important`) | ✅ |
| `.fc-non-business` 전역 흰색 덮기 (`var(--ad-b0kla-card-bg)`) 보존 | 1건 (다른 페이지 영향 0 유지) | ✅ |
| weekend td 배경 폴백 체인 (`color-mix → background-main → surface-main`) | 2건 (sat + sun) | ✅ |
| `--mg-color-background-main` 라이트 정의 (R-3 핫픽스 잔존) | `#faf9f7` | ✅ |
| `--mg-color-background-main` 다크 정의 | `#1a1a1a` | ✅ |
| `--mg-color-surface-main` (D5 §1 톤 분리) | 라이트 `#f5f3ef` / 다크 `#262626` | ✅ |

### 6.2 surface-main vs background-base 톤 분리 영향

- **라이트**: surface (`#F5F3EF`) vs base (`#FAF9F7`) — RGB 거리 약 6 단위, 매우 미세
  - weekend td 폴백 체인은 두 번째 줄 (`background-main` ≈ `background-base`)이 최종 적용 → 페이지 배경과 동일 베이지 톤에 weekend tint 14%/12% 추가
  - **부정 영향**: 없음. weekend 영역이 페이지 배경과 자연스럽게 어우러짐
- **다크**: surface (`#262626`) vs base (`#1A1A1A`) — RGB 거리 약 12 단위, 상대적으로 큼
  - 같은 폴백 체인 적용 (background-main = background-base = `#1A1A1A` 다크 정착)
  - **부정 영향**: 없음. 카드(`surface-main #262626`)와 페이지 배경(`#1A1A1A`)의 톤 분리가 확연해 weekend 영역에 차별성 제공

### 6.3 회귀 케이스 재현 시도

| 회귀 케이스 | 재현 가능 여부 | 비고 |
|---|---|---|
| 주말 컬럼 분할/부분 색상 (`0aa3bbcee` 직전 회귀) | ❌ 재현 불가 | `.fc-non-business` 투명화 + weekend td color-mix 정상 cascade |
| weekend td 배경이 카드(`surface-main`)와 충돌해 weekend 색조 미인식 | ❌ 재현 불가 | 폴백 체인이 페이지 배경(`background-base`)을 사용해 인식 가능한 weekend tint 유지 |
| 다크 모드 weekend 영역 시인성 저하 | ❌ 재현 불가 | 다크 toggle 시 `--mg-info-300` / `--mg-error-300` 채도가 다크 배경에 충분히 두드러짐 (정성 평가) |

---

## 7. 후속 권장 사항

### 7.1 본 검수 결론에 따른 후속 트랙

| 우선순위 | 트랙 | 근거 | 권장 위임 |
|---|---|---|---|
| **1순위** | **D5 §3.2 T-B 게이트 PASS 처리** → **T-A rgba/3자리 흡수** 진입 | T-D 가드 (`6c4f727e9`) 배포로 codemod 안전망 확보, T-B 정착 완료. D5 §3.3 정의 3순위 트랙 진입 조건 충족 | `core-coder` (`/core-solution-frontend`, `/core-solution-standardization`) |
| **2순위** | **i18n Phase 2 별도 합의서 신설** (`I18N_ADOPTION_STRATEGY_2026Q2.md`) | 색상 트랙 안정화 완료, D5 §6 C5 권고 (a) "T-B 완료 직후" 진입 트리거 충족 | `core-planner` → `core-coder` |
| **3순위** | **D6 라운드 (다크모드 토큰 표준화)** | §4 LOW 관찰사항 L-1 (`background-main` vs `background-base` SSOT 단일화) 흡수, 50/100/500/800/dark 네이밍 일관성 정비 | `core-designer` → `core-coder` (별도 라운드) |
| **선택** | **임상 모듈 활성화 시 UAT** | §5 발견 — 운영 노출 시점에 success 통합 인상 1회 검증 | `core-tester` (해당 모듈 import 트랙 종료 후) |

### 7.2 회귀 발견 시 트리거 (참고)

본 검수에서는 회귀 0건이므로 trigger 미작동. 향후 사용자 UAT에서 회귀 발견 시:
- **HIGH/MEDIUM 발견 시**: `core-debugger` 위임 (재현 절차·근본 원인 분석) → `core-coder` 위임 (패치) → `core-tester` 재검수
- **LOW 발견 시**: 별도 회고 문서에 기록 후 후속 라운드 흡수 권장

---

## 8. 검수 산출물 요약

| 산출물 | 위치 | 상태 |
|---|---|---|
| **본 보고서** | `docs/project-management/2026-05-22/T_B_VISUAL_REGRESSION_REPORT.md` | 신규 작성 |
| 운영 CSS 다운로드 (검증용) | `/tmp/prod_main.css` (2,093,658 bytes) | 임시 (검증 후 제거 가능) |
| 운영 vs 로컬 cmp 결과 | (본 보고서 §2.1) | 0건 차이 — 완전 일치 |
| 토큰 정착 검출 결과 | (본 보고서 §2.2 ~ §2.4) | 16/16 검출 |
| 사용량 측정 결과 | (본 보고서 §3.1 ~ §3.3) | surface-main 144 외 정량값 |
| 시각 회귀 위험 매트릭스 | (본 보고서 §4) | HIGH 0 / MED 0 / LOW 1 (관찰) |
| weekend 핫픽스 재검증 결과 | (본 보고서 §6) | ✅ PASS |
| 임상 모듈 미포함 발견 | (본 보고서 §5) | 운영 위험 자동 차단 |
| 후속 권장 | (본 보고서 §7) | T-A 흡수 / i18n Phase 2 / D6 라운드 |

---

## 9. 변경 이력

| 일자 | 작성 | 내용 |
|---|---|---|
| 2026-05-22 | core-tester | T-B 운영 정착 시각 회귀 검수 보고서 신규 작성 (D5 §3.2 게이트 PASS 판정). 토큰 8종·다크 4종 정착·weekend 핫픽스 재검증·임상 모듈 자동 차단 발견 포함. |
