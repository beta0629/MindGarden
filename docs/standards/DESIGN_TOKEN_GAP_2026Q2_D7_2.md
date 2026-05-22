# D7-2 합의서 — Pink/NAVER/Bootstrap/Top 50 + count 스크립트 신설 (2026 Q2)

> **작성**: 2026-05-22 (core-planner 오케스트레이션)
> **유형**: 의사결정 합의서 (코드·D1~D6 SSOT 무수정, 분배 골격만)
> **상위 합의**: `docs/standards/DESIGN_TOKEN_GAP_2026Q2_D6.md` §11 (D7 — Top 50 흡수 라운드)
> **선행 라운드**: D7-1 정착 (commit `1ef15862c`, 2026-05-22) — 6쌍 매핑 + 22 파일 흡수, 운영 게이트 1,688 → 1,644 (-44)
> **연계**: `docs/project-management/2026-05-22/D7_1_VISUAL_REGRESSION_REPORT.md`, `docs/project-management/2026-05-22/D6_P1_DESIGN_HANDOFF.md`, `docs/project-management/CORE_PLANNER_DELEGATION_ORDER.md`, `docs/COLOR_CONVERSION_REPORT.md`

---

## §0 결정 요약 (TL;DR)

D6 §11 후속 라운드(D7)를 **D7-2 단일 합의서**로 통합 — 4 트랙(T-Pink/T-NAVER/T-Bootstrap/T-Top50) + 1 인프라(T-Count) 병행 진행. 예상 codemod canonical 감축 -100 ~ -250건, 운영 게이트(CI/BI metric)는 보수 1,344 / 표준 1,200 / 확장 950 시나리오로 **< 1,000 진입을 본 라운드에서 시도**. 단, count metric SSOT 불일치(codemod canonical 606 vs CI/BI 1,644) 해소를 위해 `count:hardcoded-colors` npm 스크립트 신설을 본 합의서 책무로 포함. 사용자 컨펌 필요 항목 6건(§4).

---

## §1 현황 스냅샷

### 1.1 카운트 추이

| 라운드 | 적용 시점 | codemod canonical (잔존 hex) | CI/BI 운영 게이트 metric | 라운드 감축량 (canonical) |
|---:|---|---:|---:|---:|
| D2 | (10건 매핑, gray 계열) | ~1,801 | ~2,400 | -599 |
| D3 | (10건 + 3자리 정규화) | ~1,670 | ~2,200 | -131 |
| D4 | `267755325` (10건 + 인프라) | 1,005 | ~1,800 | -665 |
| D5 T-B 정착 | `86b663381` (테마·alias·success 통합) | 1,659 | 1,688 | +654 (재상승) |
| D6 P2-a 정착 | (정의 5종 신설, codemod 흡수는 D7 이월) | 662 | 1,688 | -997 |
| **D7-1 정착** | `1ef15862c` (6쌍 매핑 + 22 파일) | **606** | **1,644** | -56 / -44 |
| **D7-2 목표 (본 합의서)** | (4 트랙 + count 스크립트) | **~350 ~ 500** | **~950 ~ 1,344** | -100 ~ -250 |

### 1.2 운영 게이트 metric 정합성 분석 (본 합의서 SSOT 명확화)

| metric | 출처 | 현재 값 | 카운트 범위 | SSOT 위상 |
|---|---|---:|---|---|
| **codemod canonical 잔존 hex** | `scripts/design-system/color-management/convert-hardcoded-colors.js --dry-run` | 606 | `frontend/src/**` 6자리/3자리 hex (매핑 외) | 색상 트랙 진척 SSOT (T1-C) |
| **CI/BI 운영 게이트 metric** | `config/shell-scripts/check-hardcode.sh` + `code-quality-check.yml` | 1,644 | hex + 인라인 스타일 + 매직 라벨 + URL 등 광역 하드코딩 | 운영 반영 게이트 (전체 하드코딩) |

> **결론**: 두 metric은 **측정 범위가 다르므로 통합 단일화 불가**. 본 합의서에서 (1) `count:hardcoded-colors` 신설로 **색상 한정 metric을 CI/BI와 동일 범위로 정합화** + (2) codemod canonical 은 색상 트랙 진척 추적용으로 분리 운영. §4 C5 컨펌으로 확정.

### 1.3 T-D 가드 정착 상태

D7-1 §2 보고서 인용: **24 매핑 / ✅19 / ⚠️5 / ❌0 / 🚨0** (운영 cascade 영향 없음). D6 신설 5종 + brand-olive-light + naver-green 라이트·다크 cascade 정상 작동. 본 합의서 신설 매핑은 T-D 가드 PASS 후에만 운영 push.

---

## §2 트랙별 인벤토리

### §2.1 T-Pink — Pink accent 폐기·Tailwind 흡수

- **실측 (case-insensitive grep, 2026-05-22)**: `#ff6b9d` / `#FF6B9D` — **10건 / 7 파일** (D6 P1 §1.1 정합).
- **파일 목록**:
  - `frontend/src/components/wellness/WellnessNotificationList.css` (3건, `linear-gradient` 본문)
  - `frontend/src/components/wellness/WellnessNotificationDetail.css` (2건)
  - `frontend/src/components/dashboard/WelcomeSection.css` (1건, `info-icon--mindfulness` 배경)
  - `frontend/src/components/client/ClientSchedule.css` (1건)
  - `frontend/src/components/admin/system/SystemTools.css` (3건, `btn-outline-danger` 호버)
  - 토큰 정의 파일 2건 (`unified-design-tokens.css` `--gradient-peach-start`, `_variables.css` 동일 토큰)
- **사용 컨텍스트**: 대부분 **그라데이션 페어** (`linear-gradient(135deg, #FF6B9D, #FFA5C0)` — 마음챙김/웰니스 강조 톤). SystemTools 만 단독 hex.
- **권고 치환 패턴 (P1 디자이너 컨펌 필요)**:
  - 단일 색 (SystemTools 3건) → Tailwind `pink-400 (#f472b6)` 또는 `pink-500 (#ec4899)` 선택 → `--mg-color-pink-accent` 정의 후 var 치환
  - 그라데이션 페어 (`#FF6B9D`+`#FFA5C0`, 7건) → 시각 톤 보존이 핵심 → **수동 치환 권고** (codemod 매핑 단순화 vs 그라데이션 표준화 별도 평가)
- **codemod vs 수동**: 그라데이션 톤은 단일 hex 치환만으로 시각 회귀 위험 → **수동 우선** (P2-a 단일 트랙), 토큰 정의 파일은 HARD_EXCLUDE 보호.

### §2.2 T-NAVER — NAVER green 수동 흡수

- **실측 grep (2026-05-22)**: `#03c75a` — **4 파일** (D6 P1 §1.2 정합, 총 7건):
  - `frontend/src/styles/auth/TabletLogin.css` (2건)
  - `frontend/src/styles/auth/UnifiedLogin.css` (1건)
  - `frontend/src/components/admin/PaymentConfirmationModal.js` (4건, 네이버페이 결제 버튼)
  - `frontend/src/styles/unified-design-tokens.css` (SSOT — 라이트·다크 정의 D6 P2-a 정착)
- **SSOT 정착 확인**: `--mg-color-naver-green: #03c75a` 라이트·다크 양방향 모두 D6 P2-a에서 정의 완료 (실측: `unified-design-tokens.css` L1455 / L1472).
- **치환 패턴**: `#03c75a` → `var(--mg-color-naver-green)` 직접 치환 (NAVER OAuth + 네이버페이 한정 7건, 토큰 파일 제외).
- **codemod 매핑 추가 안전성 평가**:
  - **장점**: 자동화·일관성. 잔존 NAVER OAuth/네이버페이 외부에서 `#03c75a` 등장 시 자동 흡수.
  - **위험**: 외부 브랜드 색은 추후 NAVER 외 동일 hex 잔존 시 의도와 다르게 치환 위험 (현재 4 파일 외 사용처 미확인). §4 C2 컨펌.

### §2.3 T-Bootstrap — Bootstrap 3종 일괄 폐기

- **실측 grep (3종 합산, 2026-05-22)**:
  - `#dee2e6` (Bootstrap gray-300) — **14 파일** (PgConfiguration·ops/PgApproval·super-admin/PaymentManagement·dashboard widgets 등 산재)
  - `#721c24` (Bootstrap danger-dark) — 9건 (D6 §2 인용)
  - `#d4edda` (Bootstrap success-light) — 9건 (D6 §2 인용)
  - **합계 약 28건** (form/alert/modal 컴포넌트 분포)
- **기존 토큰 SSOT 정착 여부 확인** (실측: `unified-design-tokens.css`):
  - `--mg-color-border-main: #D4CFC8` (L1127) — ✅ D2 정착
  - `--mg-color-error-dark: #991b1b` (L1376) — ✅ D5 정착
  - `--mg-color-success-100: #d1fae5` (L1457) — ✅ D6 P2-a 정착 (success-light 슬롯)
- **codemod 매핑 3쌍 추가 권고** (D6 §6 정의안 재확인):
  - `'#dee2e6': 'var(--mg-color-border-main)'`
  - `'#721c24': 'var(--mg-color-error-dark)'`
  - `'#d4edda': 'var(--mg-color-success-100)'`
- **위험**: `#D4CFC8` (brand border) ↔ `#dee2e6` (Bootstrap) ΔRGB ~10/3/26 — **시각 톤 차** P3 시각 회귀 검수 필수.

### §2.4 T-Top50 — Top 50 매핑 확장

- **출처**: `docs/COLOR_CONVERSION_REPORT.md` (2026-05-22 D7-1 후 실측) Top 잔존 hex.
- **본 라운드 후보 5종** (D6 §11 + D7-1 §8.4 + 실측 기반):

| hex | 건수 | 추정 출처 | 권장 결정 | 결정값 (토큰) |
|---|---:|---|---|---|
| `#1a202c` | 13 | Tailwind gray-900 | **A. 기존 통합** | `var(--mg-color-text-main)` (D6 §3.2 정의안 재확인) |
| `#4a5568` | 12 | Tailwind gray-700 | **A. 기존 통합** | `var(--mg-color-text-secondary-dark)` (D6 §3.2 정의안 재확인) |
| `#92400e` | 9 | Tailwind amber-800 | **A. 기존 통합** | `var(--mg-color-warning-dark)` (D6 신설 토큰 재사용) |
| `#1d4ed8` | 9 | Tailwind blue-700 | **A. 기존 통합** | `var(--mg-color-info-dark)` (D5 정착, ΔRGB 미세 차 수용) |
| `#1e3a8a` | 5 | Tailwind blue-900 | **B. 신설 후보** | `var(--mg-color-info-800)` (다크 매트릭스 §2.4) |
- **추가 검토 후보 (6~10건 사용 hex Top 20)**: `#d2b48c` (9, R-2 보호 유지) / `#3498db` (9, Flat UI → primary-500) / `#f0f0f0` (9, background-muted) / `#f8f9ff` (8, info-bg 미세 차) / `#fbbf24` (8, warning-500) — 모두 D6 §3 기 결정.
- **신설 토큰 후보 (P1 디자이너 결정)**:
  - `--mg-color-info-800` (`#1e3a8a` 흡수) — 다크 매트릭스 info-800 슬롯 신설 (D6 §4 권고 잔존 톤 일부 해소)
  - 그 외 D6 §4 권고 `warning-100/warning-800/success-50` 보강 (D8 이월 vs D7-2 포함 §4 C4 컨펌)
- **WCAG AA 검증**: P1 디자이너 단계에서 신설 토큰 텍스트 용도 시 대비비 ≥ 4.5:1 검증 필수 (D6 P1 §2 패턴 답습).

### §2.5 T-Count — `count:hardcoded-colors` 스크립트 신설 (인프라)

> **상태**: 본 임무 외 별도 위임 진행 중 (메인 어시스턴트 분배). 본 합의서는 **요구·완료 조건**만 정의.

- **신설 항목**:
  - `frontend/package.json` `count:hardcoded-colors` alias 추가 (예: `node ../scripts/design-system/color-management/count-hardcoded-colors.js`)
  - `scripts/design-system/color-management/count-hardcoded-colors.js` 신설
- **요구 사항**:
  - 토큰 정의 파일(`unified-design-tokens.css`, `00-core/_variables.css`, `styles/common/variables.css`) 제외
  - R-2 폴백(`var(--token, #hex)`) 제외
  - 테스트·테마 파일 옵션 제외 (`--exclude-tests`, `--exclude-themes`)
  - 출력 포맷: 총 건수 + 파일별 카운트 + (선택) Top N hex
- **CI/BI metric 과 정합성**:
  - CI/BI 운영 게이트(`check-hardcode.sh`)와 **동일 카운트 정의** 채택 권고 → 운영 게이트 추적 SSOT 통일
  - 또는 별도 metric으로 명시 (color-only) → 색상 트랙 한정 진척 추적 (§4 C5 컨펌)
- **완료 조건**: `npm run count:hardcoded-colors` 단일 명령으로 카운트 출력 + D7-2 적용 전후 비교 가능.

---

## §3 트랙별 우선순위·의존성

- **즉시 진행 가능 (병렬)**:
  - **T-Pink** (수동, 7 파일 한정 — P1 디자이너 Tailwind utility 결정 선행)
  - **T-NAVER** (수동, OAuth/네이버페이 4 파일 한정 — SSOT 정착됨)
  - **T-Bootstrap** (codemod 매핑 3쌍 — 기존 토큰 SSOT 검증 후 일괄)
  - **T-Count** (인프라, 별도 위임 — 본 합의서와 무관 진행)
- **디자이너 컨펌 필요 (직렬 — P1 → P2-d)**:
  - T-Top50 신설 토큰 hex 결정 (info-800 + D6 §4 잔존 톤)
  - T-Pink Tailwind utility 선택 (pink-400 vs pink-500 vs 컨텍스트 분기)
  - 신설 토큰 WCAG AA 대비비 검증
- **시각 회귀 검수 게이트**:
  - 모든 트랙 codemod 흡수·수동 치환 후 `core-tester` PASS 후에만 운영 push
  - D7-1 §8 패턴 답습 (보고서 1장 + lint·build PASS)

---

## §4 사용자 컨펌 필요 항목 (D7-2 진입 전)

### C1. Pink Tailwind utility 결정
- **질문**: `pink-400 (#f472b6)` 단일 vs `pink-500 (#ec4899)` 단일 vs 컨텍스트별 분기 (그라데이션 페어 보존 vs 단순화).
- **권장**: P1 디자이너 시각 검토 후 결정. 그라데이션 페어 보존 시 `--mg-color-pink-accent`(라이트) + `--mg-color-pink-accent-light`(`#FFA5C0`) 신설 페어로 정의 권고.

### C2. NAVER green codemod 매핑 추가 여부
- **질문**: codemod 매핑 추가 (자동, 외부 브랜드 hex 자동 흡수) vs 수동 한정 (안전, NAVER 외 동일 hex 잔존 시 의도 외 치환 방지).
- **권장**: **수동 한정** (현재 4 파일 외 사용처 미확인, NAVER 외 동일 hex 등장 시 의도와 다른 치환 위험).

### C3. Bootstrap 토큰 흡수 검증
- **질문**: `--mg-color-border-main` (`#D4CFC8`, ΔRGB ~10/3/26 차) / `--mg-color-error-dark` (`#991b1b`) / `--mg-color-success-100` (`#d1fae5`) 모두 SSOT 정착됐는지 + T-D 가드 PASS 시뮬레이션.
- **권장**: 실측 정착 확인 (§2.3) + Bootstrap ΔRGB 미세 차 P3 시각 회귀 검수 시 명시 표기.

### C4. Top 50 신설 토큰 범위
- **질문**: D7-2에서 `--mg-color-info-800` 1종만 신설 vs D6 §4 잔존(`warning-100/warning-800/success-50`) 포함 4종 일괄 신설.
- **권장**: **info-800 1종 + D6 §4 잔존 3종은 D8로 이월** (시각 회귀 위험 통제, D7-2는 codemod 흡수 우선).

### C5. count metric 통일 (T-Count)
- **질문**: codemod canonical 채택 vs CI/BI 운영 게이트 metric 채택 vs 두 metric 분리 유지.
- **권장**: **두 metric 분리 유지** (측정 범위 다름) — `count:hardcoded-colors`는 CI/BI 정의 답습 + codemod canonical 은 색상 트랙 진척 SSOT 분리. §1.2 SSOT 명확화 그대로.

### C6. 운영 push 단위
- **질문**: 트랙별 분리 PR (4개) vs (T-Pink + T-NAVER + T-Bootstrap) 1 PR + T-Top50 별도 PR vs 전체 1 PR.
- **권장**: **그룹 2 PR** — (a) 수동 흡수 묶음 (Pink + NAVER, 시각 톤 보존 위주) + (b) codemod 매핑 묶음 (Bootstrap + Top50, 일괄 흡수). T-Count 는 인프라 별도 PR.

### 4.1 사용자 컨펌 결과 (2026-05-22)

| 항목 | 결정 | 메모 |
|---|---|---|
| C1 | **Pink-400 단일 (`#f472b6`)** | D6 §9.1 C1 폐기 결정 후속. 7 파일 10건 `#ff6b9d` → Tailwind `pink-400` 단일 흡수. 그라데이션 페어 보존 시 디자이너가 P1에서 분기 결정 (수동 치환). |
| C2 | **NAVER codemod 매핑 추가 (자동)** | `#03c75a` → `var(--mg-color-naver-green)` codemod 매핑 1쌍 추가. SSOT 정착 상태 (`--mg-color-naver-green` 라이트·다크 양방향). 외부 브랜드 가이드 준수, OAuth 외 신규 사용처 차단은 향후 디자이너 정책으로. |
| C3 | **Bootstrap 3종 일괄 codemod 매핑 3쌍** | `#dee2e6` → `--mg-color-border-main` / `#721c24` → `--mg-color-error-dark` / `#d4edda` → `--mg-color-success-100`. 기존 토큰 3종 SSOT 정착 상태 (P1 디자이너 ΔRGB 사전 검증 결과 반영). |
| C4 | **1종 신설 + 4건 기존 통합 (안전 폭)** | 신설: `--mg-color-info-800: #1e3a8a` (라이트·다크 cascade hex P1 디자이너 결정). 기존 통합 4건 (`#1a202c` → text-main / `#4a5568` → text-secondary-dark / `#92400e` → warning-800 / `#1d4ed8` → info-700) — D6 §4 다크 매트릭스 완성도는 D8 라운드로 이월. |
| C5 | **canonical metric SSOT 채택 (count-hardcoded-colors.js)** | 2026-05-22 count 스크립트 신설 결과로 결정. `canonical` (D7-1 적용 후 606) 이 운영 게이트 SSOT, `rawLine` (1,642) 은 CI/BI 호환 추적, `withR2` (949) 은 D8 R-2 폴백 토큰화 진행도 보조. |
| C6 | **그룹 2 PR 채택** | PR-A: T-Pink + T-NAVER + T-Bootstrap + T-Count (수동/자동 혼합 묶음) / PR-B: T-Top50 (1 신설 + 4 통합 codemod 매핑 묶음, 디자이너 hex 결정 후). |

**P1 디자이너 핸드오프 핵심 (본 컨펌 결과 후 위임 즉시 가능)**:
- C1: Pink 7 파일 10건 사용처별 utility 변환 가이드 (단순 hex 치환 + Tailwind 클래스 추가 가능성 평가)
- C2: NAVER codemod 매핑 추가 코드 (P2-c 코더 입력)
- C3: Bootstrap 3종 토큰 ΔRGB 사전 검증 (PASS 시 codemod 매핑 3쌍 추가)
- C4: `--mg-color-info-800` 신설 hex 결정 (라이트 #1e3a8a / 다크 cascade) + 기존 통합 4건 ΔRGB 검증 + WCAG AA 대비비

---

## §5 분배실행 표 (위임 골격)

> **본 임무 범위 외**: 실제 위임은 사용자 컨펌(§4) 후 메인 어시스턴트가 수행. 본 표는 위임 시 사용할 골격.

| Phase | 책무 | 담당 서브에이전트 | 위임 프롬프트 골격 (요약) | 적용 스킬 | 모델 권장 |
|---|---|---|---|---|---|
| **P1** | §4 C1·C4 디자이너 컨펌 | `core-designer` | (1) Pink Tailwind utility 선택 (pink-400/500/그라데이션 페어 보존). (2) Top 50 신설 토큰(`info-800` + D6 §4 잔존 잠정 hex) 결정 + WCAG AA 검증. (3) Bootstrap ΔRGB 미세 차 시각 톤 영향 평가. 완료 조건: P2-a~d 핸드오프 1장. | `/core-solution-design-system-css`, `/core-solution-design-handoff` | `gemini-3.1-pro` |
| **P2-a** | §2.1 T-Pink 수동 흡수 | `core-coder` | P1 결정 hex 적용 → 7 파일 10건 치환 (그라데이션 페어 보존 패턴 명시). 토큰 정의 파일 2건 SSOT 갱신. 완료 조건: case-insensitive grep `#ff6b9d` 0건 (토큰 파일 제외). | `/core-solution-frontend`, `/core-solution-standardization` | 기본 |
| **P2-b** | §2.2 T-NAVER 수동 흡수 | `core-coder` | `#03c75a` → `var(--mg-color-naver-green)` 4 파일 7건 치환 (codemod 매핑 추가 없음 — §4 C2 결정). 완료 조건: grep 0건 (토큰 파일 제외). | `/core-solution-frontend` | 기본 |
| **P2-c** | §2.3 T-Bootstrap codemod 매핑·흡수 | `core-coder` | (1) `convert-hardcoded-colors.js` 매핑 3쌍 추가. (2) dry-run → 영향 파일 확인 → 실행. 완료 조건: T-D 가드 PASS + dry-run 잔존 hex -28 ~ -45. | `/core-solution-frontend`, `/core-solution-standardization` | 기본 |
| **P2-d** | §2.4 T-Top50 codemod 매핑·흡수 (P1 후) | `core-coder` | (1) 기존 통합 4건 매핑 (`#1a202c/#4a5568/#92400e/#1d4ed8`). (2) 신설 1종 (`info-800` if P1 컨펌) 토큰 정의 + 매핑 추가. (3) dry-run → 실행. 완료 조건: T-D 가드 PASS + canonical 감축 -39 ~ -50. | `/core-solution-frontend`, `/core-solution-standardization` | 기본 |
| **P2-e** | §2.5 T-Count 스크립트 신설 (별도 위임 진행 중) | `core-coder` | `count-hardcoded-colors.js` + `package.json` alias 신설. CI/BI metric 정합 (§4 C5 결정). 완료 조건: `npm run count:hardcoded-colors` 단일 실행 + 카운트 출력. | `/core-solution-frontend` | 기본 |
| **P3** | §6 시각 회귀 검수 | `core-tester` | P2-a~d 적용 후 (1) §6 우선 점검 화면 8군 UAT. (2) 라이트·다크 cascade 정합 확인. (3) Bootstrap ΔRGB 미세 차 보고. 완료 조건: HIGH 0건. | `/core-solution-testing` | `gemini-3.1-pro` |
| **P4** | 운영 push (§4 C6 결정 단위) | `core-deployer` | (P3 PASS 후) 그룹 2 PR 분리 push → 운영 게이트 카운트 측정 (count 스크립트 + CI/BI). 완료 조건: 카운트 < 1,000 진입 또는 시나리오 §7 보수·표준·확장 중 도달 수준 보고. | `/core-solution-deployment` | 기본 |

> **검증 게이트 (필수)**: P2 코드 변경은 P3 `core-tester` 통과 전 P4 진행 금지 (`CORE_PLANNER_DELEGATION_ORDER.md` 강제 규칙).
> **병렬 가능**: P1 (디자이너 컨펌) 과 P2-b·P2-c·P2-e 는 의존성 무 → 병렬 진행 가능. P2-a·P2-d 는 P1 후 직렬.

---

## §6 시각 회귀 위험·core-tester 우선 점검 화면

| 트랙 | 영향 화면군 | 위험 분류 |
|---|---|---|
| T-Pink (7 파일) | wellness 알림(List/Detail), 대시보드 환영 섹션 mindfulness 아이콘, 클라이언트 스케줄, 어드민 SystemTools `btn-outline-danger` | **Med** (그라데이션 톤 보존 검수 필요) |
| T-NAVER (4 파일) | TabletLogin·UnifiedLogin OAuth 버튼, PaymentConfirmationModal 네이버페이 결제 버튼 | Low (SSOT 정착, 단순 변수명 치환) |
| T-Bootstrap (≥14 파일) | PgConfiguration/ops/super-admin form·modal·alert, dashboard widgets, SimpleHamburgerMenu | **Med** (ΔRGB ~10/3/26 미세 차, alert/danger 톤 검수 필수) |
| T-Top50 (≥30 파일) | clinical(SOAPNote/Diagnostic/Audio/SmartNote/RiskAlert/VoiceBiomarker), landing(CounselingHero/Services/About), dashboard-v2(ContentKpiRow/NavIcon), common(MGForm/MGLayout/MGLoading), commoncode admin | **Med** (텍스트 가독성·info 알림·warning 메시지 영향 광역) |
| 다크 모드 cascade | D6 P2-a 정착 + D7-2 신설 (`info-800` if 컨펌) 다크 톤 정합 | Low (D6 P3 PASS 기반, 신설 1종만 신규 검수) |

---

## §7 운영 게이트 진입 시나리오

### 7.1 카운트 계산 (D7-2 적용 전)

- **codemod canonical 잔존 hex**: 606 (D7-1 §7 실측)
- **CI/BI 운영 게이트 metric**: 1,644 (D7-1 §0 실측)

### 7.2 예상 감축 (codemod canonical 기준)

| 시나리오 | 적용 트랙 | canonical 감축 | 적용 후 canonical | CI/BI 추정 | 운영 게이트 (< 1,000) |
|---|---|---:|---:|---:|:---:|
| **보수** | T-Pink + T-NAVER (수동만) | -17 | **~589** | **~1,627** | ❌ (gap 627) |
| **표준** | + T-Bootstrap (codemod 3쌍) | -45 ~ -75 | **~531 ~ 561** | **~1,344 ~ 1,569** | ❌ (gap 344~569) |
| **확장** | + T-Top50 (codemod 4~5건) | -100 ~ -150 | **~456 ~ 506** | **~950 ~ 1,200** | ⚠️ (확장 적용 시 gap 0~200, < 1,000 진입 시나리오 가능) |

### 7.3 목표

- **D7-2 적용 목표**: codemod canonical < 500 / CI/BI < 1,000 진입 (확장 시나리오 도달 시)
- **미도달 시 D8 이월**: T1-C 종결 (잔존 hex < 100) + R-2 폴백 343건 처리

---

## §8 후속 라운드 (D8 가늠)

| 라운드 | 시점 가늠 | 트리거 | 주요 책무 | 비고 |
|---|---|---|---|---|
| **D8 (T1-C 종결)** | D7-2 적용 후 (~2주 내) | canonical < 500 도달 또는 < 1,000 미진입 시 | (1) 잔존 hex Top 51~100 일괄 흡수 (2) R-2 폴백 343건 var() → 토큰 alias 대체 (3) D6 §4 다크 매트릭스 완전성 (warning-100/warning-800/success-50 신설) | 운영 게이트 < 500 (장기 목표) |
| **i18n Phase 2.1c** | D7-2와 무관 진행 가능 | i18n 트랙 별도 결정 | clinical + client Top 50 라벨 i18n | T-C 별도 트랙, 색상 트랙과 충돌 없음 |
| **다크모드 UAT 후속** | D6 신설 5종 + D7-2 신설 토큰 정착 후 | 임상 모듈 활성화 시 | 임상 모듈 UAT (RiskAlert/SOAP/Diagnostic/Audio) 신설 토큰 다크 cascade 정합 | T-B §5 발견 자동 차단 해제 시점 |

---

## §9 변경 이력

| 일자 | 작성 | 내용 |
|---|---|---|
| 2026-05-22 | core-planner | D7-2 합의서 신규 작성. 4 트랙(Pink/NAVER/Bootstrap/Top50) + 1 인프라(count 스크립트) 통합 — Pink 7파일 10건 / NAVER OAuth+네이버페이 4파일 7건 / Bootstrap 3종 ≥28건 / Top50 4기존+1신설(info-800) / count 스크립트 별도 위임. 사용자 컨펌 6건(§4). 운영 게이트 < 1,000 진입은 확장 시나리오에서 가능, 미도달 시 D8 이월 명시. SSOT metric 분리 운영 결정(§1.2). |
