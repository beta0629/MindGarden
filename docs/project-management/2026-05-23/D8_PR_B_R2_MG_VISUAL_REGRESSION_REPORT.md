# D8 PR-B 단계 1 — R-2 mg-* 폴백 alias 대체 시각 회귀 위험 보고서

> **작성**: 2026-05-23 (core-coder 위임 산출물)
> **상위 합의**: `docs/standards/DESIGN_TOKEN_GAP_2026Q2_D8.md` §2.3 + §4 C3 + §6
> **인벤토리 SSOT**: `scripts/design-system/color-management/reports/r2-inventory-20260523-1135.json`
> **count 측정 (적용 전·후)**: `reports/count-20260523-1134.json` / `reports/count-20260523-1142.json`
> **codemod 변경**: `scripts/design-system/color-management/convert-hardcoded-colors.js` — `--r2-mg-alias-replace` 옵션 + `R2_MG_ALIAS_SAFE_PAIRS` 화이트리스트 추가
> **변경 파일 수**: 19 CSS 파일 / **변경 라인 수**: 60 (insertions 60 / deletions 60)
> **HARD_EXCLUDE / VAR_FALLBACK 보호 패턴 변경**: 0줄 (모두 원위치 유지)

---

## §0 TL;DR

D8 PR-B 단계 1은 R-2 폴백 343건 중 **mg-* 1단 폴백 150건**을 시맨틱 매칭 검증 후 **SAFE 60건 (14쌍)** 만 alias 대체로 흡수했다. **HOLD 13건 (7쌍)** 은 D9 이월. 신규 토큰 신설 0건. HARD_EXCLUDE / R-2 보호 정규식 영구 변경 0건. `unified-design-tokens.css` 본문 수정 0줄. 시각 회귀 위험은 **MEDIUM-LOW** — 60건 모두 텍스트·경고·성공 시맨틱 패밀리 내부 alias 정착으로 한정. 다크 모드 cascade 정착이 부수 효과로 발생 (긍정적).

---

## §1 인벤토리 분류 결과

### 1.1 그룹별 분포 (R-2 폴백 343건)

| 그룹 | 건수 | auto-replaceable | manual-review | 본 PR 처리 |
|---|---:|---:|---:|---|
| **mg-* (D8 처리 범위)** | **150** | **73** | **77** | SAFE 60건 흡수 / HOLD 13건 D9 이월 |
| mg-v2-* (D9 이월) | 37 | 15 | 22 | 본 PR 대상 외 |
| other (cs-*, color-*, theme-* 등) | 156 | 74 | 82 | 본 PR 대상 외 |

### 1.2 mg-* auto-replaceable 21쌍 — 시맨틱 매칭 분류

| # | (token, hex) 쌍 | 건수 | 캐노니컬 타깃 | 판정 | 사유 |
|---|---|---:|---|:---:|---|
| 1 | `--mg-text-secondary` + `#666` | 23 | `--mg-color-text-secondary` | ✅ SAFE | text-secondary 시맨틱 동일 (dashboard-tokens-extension legacy alias → D-round 캐노니컬) |
| 2 | `--mg-text-tertiary` + `#999` | 9 | `--mg-color-text-tertiary` | ✅ SAFE | text-tertiary 시맨틱 동일 |
| 3 | `--mg-text-tertiary` + `#9ca3af` | 8 | `--mg-color-text-tertiary` | ✅ SAFE | text-tertiary 시맨틱 동일 |
| 4 | `--mg-color-text-secondary` + `#666` | 5 | `--mg-color-text-secondary` | ✅ SAFE | **동일 토큰** — 폴백만 제거, 시각 변화 0 |
| 5 | `--mg-bg-hover` + `#f3f4f6` | 4 | `--mg-color-background-main` | ⛔ HOLD | hover 상태 ≠ base bg — 시맨틱 시프트 위험 |
| 6 | `--mg-color-text-primary` + `#333` | 4 | `--mg-color-text-main` | ✅ SAFE | text-primary ≈ text-main (D-round 정합) |
| 7 | `--mg-text-primary` + `#2d3748` | 3 | `--mg-color-text-main` | ✅ SAFE | text-primary alias → text-main 정착 |
| 8 | `--mg-text-tertiary` + `#666` | 3 | `--mg-color-text-secondary` | ⛔ HOLD | tertiary ≠ secondary — 시맨틱 tier 시프트 |
| 9 | `--mg-primary-light` + `#dbeafe` | 2 | `--mg-color-info-100` | ⛔ HOLD | primary 브랜드 ≠ info 패밀리 — 색 패밀리 시프트 |
| 10 | `--mg-pipeline-card-bg` + `#f8fafc` | 1 | `--mg-color-background-main` | ⛔ HOLD | pipeline 특화 ≠ generic bg — 특정성 시프트 |
| 11 | `--mg-error-50` + `#fef2f2` | 1 | `--mg-color-error-50` | ✅ SAFE | 동명 토큰, 라이트 hex 정확 일치 |
| 12 | `--mg-success-light` + `#d1fae5` | 1 | `--mg-color-success-100` | ✅ SAFE | success 패밀리, 라이트 hex 정확 일치 |
| 13 | `--mg-gray-light` + `#f3f4f6` | 1 | `--mg-color-background-main` | ⛔ HOLD | gray-light ≠ background-main — 개념 시프트 |
| 14 | `--mg-amber-light` + `#fef3c7` | 1 | `--mg-color-warning-bg` | ✅ SAFE | warning 패밀리 alias, 라이트 정확 일치 |
| 15 | `--mg-emerald-light` + `#d1fae5` | 1 | `--mg-color-success-100` | ✅ SAFE | success 패밀리 alias, 라이트 정확 일치 |
| 16 | `--mg-red-light` + `#fee2e2` | 1 | `--mg-color-error-bg` | ✅ SAFE | error 패밀리 alias, 라이트 정확 일치 |
| 17 | `--mg-custom-fff3cd` + `#fff3cd` | 1 | `--mg-color-warning-bg` | ✅ SAFE | custom placeholder (legacy 미정의, hex 바인딩 명확) |
| 18 | `--mg-custom-856404` + `#856404` | 1 | `--mg-color-warning-dark` | ✅ SAFE | custom placeholder, 라이트 hex 정확 일치 |
| 19 | `--mg-color-warning-light` + `#fef3c7` | 1 | `--mg-color-warning-bg` | ✅ SAFE | warning-light → warning-bg, hex 일치 |
| 20 | `--mg-color-primary-light` + `#e3f2fd` | 1 | `--mg-color-info-soft` | ⛔ HOLD | primary ≠ info — 색 패밀리 시프트 |
| 21 | `--mg-gray-100` + `#f3f4f6` | 1 | `--mg-color-background-main` | ⛔ HOLD | named scale ≠ semantic surface — 시맨틱 시프트 |

**SAFE 합계**: 14쌍 / **60건** (대체 완료)
**HOLD 합계**: 7쌍 / **13건** (D9 이월)

---

## §2 적용 전·후 count 비교

| metric | 적용 전 (`count-20260523-1134.json`) | 적용 후 (`count-20260523-1142.json`) | Δ |
|---|---:|---:|---:|
| **canonical** (D6 §8 운영 게이트) | 458 | 458 | **0** (R-2 alias 대체는 canonical 잔존 hex 아님) |
| **withR2** | 801 | 741 | **-60** (정확) |
| **rawLine** (CI/BI grep 라인) | 1,544 | 1,485 | **-59** (동일 라인 다중 폴백 1건 통합) |
| **r2Protected** | 343 | 283 | **-60** (정확) |
| **uniqueR2ProtectedHex** | 81 | 75 | -6 |

**위임 기대치 (-100 ~ -200)** 대비: 보수적 -59. 사유는 §3 NO-OP 부분 진행 사유 참조.

---

## §3 NO-OP / 부분 진행 사유

### 3.1 SAFE 필터링 결과 60건 (auto-replaceable 73건 → 보류 13건)

`mg-*` 그룹의 auto-replaceable 73건 중 시맨틱 매칭 검증을 통과한 60건 (14쌍) 만 대체했고, HOLD 13건 (7쌍) 은 의미 다른 폴백으로 일괄 처리 금지 정책에 따라 D9 이월:

| HOLD 쌍 | 건수 | 시맨틱 시프트 유형 |
|---|---:|---|
| `--mg-bg-hover` + `#f3f4f6` → background-main | 4 | hover 상태 vs base bg |
| `--mg-text-tertiary` + `#666` → text-secondary | 3 | tertiary → secondary tier 시프트 |
| `--mg-primary-light` + `#dbeafe` → info-100 | 2 | primary 브랜드 → info 패밀리 |
| `--mg-pipeline-card-bg` + `#f8fafc` → background-main | 1 | 특화 surface → generic bg |
| `--mg-gray-light` + `#f3f4f6` → background-main | 1 | named scale → semantic |
| `--mg-color-primary-light` + `#e3f2fd` → info-soft | 1 | primary → info 패밀리 |
| `--mg-gray-100` + `#f3f4f6` → background-main | 1 | scale → semantic |
| **합계** | **13** | **D9 디자이너 검토 후 결정** |

### 3.2 manual-review 77건 (캐노니컬 매핑 부재)

`mg-*` 그룹의 77건은 `COLOR_MAPPING` (codemod SSOT) 에 매핑이 없어 자동 대체 불가. D9 디자이너 P1 결정 필요:

| 상위 manual-review 쌍 | 건수 | 비고 |
|---|---:|---|
| `--mg-primary` + `#4a90e2` | 15 | 구 primary blue — D9 신설 토큰 후보 또는 폐기 통합 결정 |
| `--mg-color-surface-main` + `#f5f3ef` | 8 | 따뜻한 표면색 — surface-main 토큰 정의 신설 후보 |
| `--mg-color-primary-light` + `#4a6354` | 8 | brand-olive 변형 — 통합 vs 신설 |
| `--mg-surface-primary` + `#f5f3ef` | 5 | surface 시맨틱 중복 정리 |
| `--mg-text-secondary` + `#64748b` | 4 | text-secondary 추가 hex 변형 |
| `--mg-primary-light` + `#4f6b5a` | 4 | brand-olive 변형 |
| `--mg-color-success` + `#81c784` | 3 | success 라이트 톤 |
| `--mg-color-error` + `#e57373` | 3 | error 라이트 톤 |
| `--mg-consultant-primary-light` + `#6b7f72` | 3 | consultant 도메인 alias |
| `--mg-pipeline-primary` + `#4b745c` | 2 | pipeline 도메인 alias |
| ... (18 more) | 19 | (전체 28쌍 합계 77건) |

---

## §4 시각 회귀 위험 분류 (D8 §6 위험 매트릭스 적용)

### 4.1 변경 60건 — 영향 화면군 + 위험 분류

| 영향 영역 | 적용 SAFE 쌍 | 건수 | 위험 등급 | 시각 영향 |
|---|---|---:|:---:|---|
| **PG 결제 운영 (ops/PG)** | `--mg-text-secondary` `--mg-text-tertiary` | ~28 | **HIGH** | PG 승인·구성 관리 화면 보조 텍스트 톤 — `#4b5563` (cool gray, dashboard alias 해결값) → `#5C6B61` (mossy gray, 캐노니컬 라이트) — **약간의 톤 시프트 발생** |
| **어드민 대시보드 편집기** | `--mg-text-*` 그룹 | ~16 | MEDIUM | DashboardWidgetEditor/ModernDashboardEditor/LayoutEditor — 위젯 편집 UI 보조 텍스트 톤 — 동일 시프트 |
| **컨설턴트 대시보드** | `--mg-text-*` | 1 | LOW | ConsultantDashboard 단일 텍스트 |
| **테넌트 PG 구성** | `--mg-text-*` | ~17 | MEDIUM | PgConfigurationList/Detail — 보조 텍스트 톤 시프트 |
| **공통 — 약관/개인정보** | `--mg-text-*` | 2 | LOW | PrivacyPolicy 보조 텍스트 |
| **대시보드 위젯 (공통)** | `--mg-text-*` | ~10 | MEDIUM | HeaderWidget·ErpWidget·ErpCardWidget — 위젯 헤더·라벨 톤 시프트 |
| **공통 코드 관리** | `--mg-text-*` | 1 | LOW | CommonCodeManagementB0KlA |
| **Atomic/Molecules** | `--mg-text-*` | ~5 | LOW | MatchQueueRow/PipelineStepCard/ManualMatchingQueue |

### 4.2 다크 모드 cascade 정착 (긍정적 부수 효과)

본 alias 대체로 다크 모드 가시성이 **개선**된다. 캐노니컬 토큰은 라이트·다크 cascade 가 정착되어 있으나, legacy `--mg-text-*` (dashboard-tokens-extension) 는 다크 cascade 없이 `--mg-gray-*` 만 참조한다.

| 토큰 | 라이트 | 다크 (변경 전) | 다크 (변경 후) | 변화 |
|---|---|---|---|---|
| `--mg-text-secondary` → `--mg-color-text-secondary` | `#4b5563`→`#5C6B61` | `#4b5563` (cascade 부재, light 톤 잔존) | WARN T-D 가드 (라이트 톤 잔존) | 다크 가시성 동일 (D9 ️ext-secondary 다크 cascade 결정 별도 필요) |
| `--mg-text-tertiary` → `--mg-color-text-tertiary` | `#9ca3af`→`#4b5563` | `#9ca3af` (cascade 부재) | `#9ca3af` (다크 cascade) | 다크 동일 hex / 라이트 darker (tertiary 가시성 향상) |
| `--mg-text-primary` → `--mg-color-text-main` | `#111827`→`#2C2C2C` | `#111827` (cascade 부재) | `#E5E5E5` (다크 cascade) | **다크 가시성 대폭 향상** (검정→밝은 회색) |
| `--mg-color-text-primary` → `--mg-color-text-main` | `#333`→`#2C2C2C` | `#333` (폴백 잔존) | `#E5E5E5` | 다크 가시성 향상 |
| `--mg-amber-light` → `--mg-color-warning-bg` | `#fef3c7` (동일) | `#fef3c7` (폴백 잔존) | `#453303` | 다크 모드 경고 배경 정착 |
| `--mg-emerald-light` `--mg-success-light` → `--mg-color-success-100` | `#d1fae5` (동일) | `#d1fae5` (폴백 잔존) | `#064e3b` | 다크 모드 성공 배경 정착 |
| `--mg-red-light` → `--mg-color-error-bg` | `#fee2e2` (동일) | `#fee2e2` (폴백 잔존) | `#450a0a` | 다크 모드 에러 배경 정착 |
| `--mg-custom-856404` → `--mg-color-warning-dark` | `#856404` (동일) | `#856404` (폴백 잔존) | `#fde68a` | 다크 모드 경고 어두운 톤 정착 |
| `--mg-custom-fff3cd` → `--mg-color-warning-bg` | `#fff3cd`→`#fef3c7` | `#fff3cd` | `#453303` | Bootstrap→Tailwind 톤 정합 + 다크 정착 |
| `--mg-color-warning-light` → `--mg-color-warning-bg` | `#fef3c7` (동일) | 폴백 잔존 | `#453303` | 다크 정착 |

### 4.3 라이트 모드 톤 시프트 핵심 위험 — `#4b5563` → `#5C6B61` (mossy gray)

`--mg-text-secondary` 28건의 라이트 모드 톤 시프트가 가장 광역. dashboard-tokens-extension 의 `--mg-text-secondary: var(--mg-gray-600)` 해결값 `#4b5563` (Tailwind cool gray) → 캐노니컬 `--mg-color-text-secondary: #5C6B61` (mossy gray, MindGarden 브랜드 톤). 동일 채도의 회색 계열이며 명도 ΔL ≈ 6 정도로 인지 가능하나 가독성 영향 없음. **P3 검수 시 PG 승인 관리·테넌트 PG 구성·대시보드 편집기 화면 보조 텍스트 톤 일관성 확인 필수**.

---

## §5 P3 코어 테스터 핸드오프 우선 점검 화면

### 5.1 HIGH 우선 점검

| 라우트 / 화면 | 점검 포인트 | 변경 hex |
|---|---|---|
| `/ops/pg-approval-management` | 헤더 부제 / 검색 placeholder / 빈 상태 / 정보 라벨 / 닫기 버튼 / 상세 라벨 보조 텍스트 톤 | `#666` `#999` |
| `/tenant/pg-configuration-list` | PG 카드 리스트 보조 텍스트 / 빈 상태 / 필터 placeholder 톤 | `#666` `#999` |
| `/tenant/pg-configuration-detail` | PG 상세 라벨·값·메타 정보 보조 텍스트 톤 | `#666` `#999` |

### 5.2 MEDIUM 우선 점검

| 라우트 / 화면 | 점검 포인트 | 변경 hex |
|---|---|---|
| `/admin/dashboard-editor` (Modern/Layout/Widget) | 편집기 보조 라벨·플레이스홀더·도움말 텍스트 톤 | `#666` `#999` |
| `/admin/dashboard-management` | 대시보드 관리 보조 텍스트 | `#666` `#999` |
| Dashboard 위젯 (Header/Erp/ErpCard) | 위젯 헤더·캡션·라벨 보조 텍스트 | `#666` `#999` `#9ca3af` |
| `/admin/common-code-management` | 공통코드 관리 보조 텍스트 | `#999` |

### 5.3 LOW 우선 점검

| 라우트 / 화면 | 점검 포인트 | 변경 hex |
|---|---|---|
| Privacy Policy | 약관 본문 보조 텍스트 | `#666` |
| Consultant Dashboard | 보조 텍스트 1건 | `#9ca3af` |
| Admin Dashboard atomic/molecules (MatchQueueRow, PipelineStepCard, ManualMatchingQueue) | 매칭 큐 / 파이프라인 단계 카드 보조 텍스트 | `#999` |
| Dashboard3DPreview | 위젯 placeholder 텍스트 | `#9ca3af` |
| WidgetConfigModal / DashboardFormModal | 모달 보조 라벨 | `#666` `#999` |

### 5.4 다크 모드 별도 점검 (P3 권고)

- 다크 모드 활성 상태에서 PG 운영·테넌트 PG·대시보드 편집기 화면의 텍스트·경고 배경·성공 배경이 라이트 모드 cascade 잔존 문제를 해소했는지 확인.
- 특히 `--mg-text-primary` (그래서 `text-main`) 의 다크 모드 가시성 `#111827` (검정에 가까움, 다크 배경에서 비가독) → `#E5E5E5` (밝은 회색) 향상 확인.

---

## §6 D9 이월 사항

### 6.1 본 PR HOLD 13건 (시맨틱 시프트)

7쌍 13건 — P1 디자이너 / 메인 어시스턴트 결정 필요:
- `--mg-bg-hover` (4): bg-hover 토큰 신설 vs background-main 통합 결정
- `--mg-text-tertiary` + `#666` (3): tier 시프트 허용 여부 결정
- `--mg-primary-light` + `#dbeafe` (2): primary 브랜드 vs info 패밀리 결정
- 기타 4건 (pipeline-card-bg / gray-light / color-primary-light + e3f2fd / gray-100): 토큰 정리 정책 결정

### 6.2 본 PR 대상 외 — D9 처리 범위

- **mg-v2-* 폴백 37건** (D8 §4 C3 명시 — D9 이월 분):
  - `--mg-v2-color-text-primary` 6건
  - `--mg-v2-color-text-tertiary` 5건
  - `--mg-v2-color-primary-50` 4건
  - `--mg-v2-color-border-light` 4건
  - 기타 12쌍 18건
- **mg-* manual-review 77건** (캐노니컬 매핑 부재 — P1 디자이너 결정):
  - 상위: `--mg-primary` + `#4a90e2` 15건 등 28쌍 (§3.2 참조)
- **other 그룹 156건** (cs-*, color-*, theme-* 등): 별도 트랙 분류 후 라운드 결정

---

## §7 T-D 가드 결과

`npm run lint:codemod-mappings` 실행 결과 **PASS** (exit 0):

- **OK 33 토큰**: 라이트·다크 cascade 정착 정상 (D2~D8 PR-A 누적 정의 흡수 확인)
- **WARN 4 토큰**: `--mg-color-border-main` / `--mg-color-error` / `--mg-color-info` / `--mg-color-text-secondary` — 다크 cascade 부재 (D9 일괄 결정 의도)
- **ERROR 0 / 🚨 0**: alias 충돌·SSOT 정의 누락 없음

---

## §8 빌드 결과

`cd frontend && CI=false npm run build` 실행 결과 **PASS**:
- 빌드 성공, 번들 생성 완료
- 신규 경고·오류 없음 (기존 bundle size 경고만 잔존, 본 작업과 무관)

---

## §9 codemod 변경 요약

### 9.1 변경 내역

`scripts/design-system/color-management/convert-hardcoded-colors.js`:

1. `R2_MG_ALIAS_SAFE_PAIRS` 화이트리스트 신설 (14쌍, D8 §2.3 + §4 C3 SSOT 인용 주석 포함)
2. `escapeRegexLiteral`, `buildSafePairRegex` 헬퍼 함수 추가
3. `processFile` 1단계 직전 0단계 추가 — `--r2-mg-alias-replace` 옵션 시 SAFE_PAIRS 일괄 치환
4. `parseArgs` 에 `--r2-mg-alias-replace` 옵션 추가
5. CLI 사용법 + generateReport 통계 출력 보강

### 9.2 변경 없음 (보호 패턴 원위치 유지)

- `HARD_EXCLUDE_PATTERNS` (codemod / count 스크립트): diff 0줄
- `VAR_FALLBACK_HEX_PATTERN` (R-2 보호 정규식): diff 0줄
- `VAR_FALLBACK_PLACEHOLDER_PREFIX/SUFFIX`: diff 0줄
- `findFiles` HARD_EXCLUDE 배열: diff 0줄
- 모든 R-2 fallback 보호 동작은 기본값 그대로 유지되며, 본 옵션은 opt-in (`--r2-mg-alias-replace`)

### 9.3 신규 산출 스크립트 (인벤토리 도구)

`scripts/design-system/color-management/inventory-r2-fallbacks.js` — R-2 폴백 343건 그룹 분류 + 매핑 후보 + 파일별 분포 분석 도구. 향후 D9 mg-v2-* 라운드에서도 재사용.

---

## §10 변경 이력

| 일자 | 작성 | 내용 |
|---|---|---|
| 2026-05-23 | core-coder | 본 보고서 신규 작성. D8 PR-B 단계 1 — R-2 mg-* 폴백 SAFE 60건 alias 대체 완료. HOLD 13건 D9 이월. 시각 회귀 위험 HIGH 1 / MEDIUM 4 / LOW 5 영역 분류. T-D 가드 PASS / build PASS. HARD_EXCLUDE / R-2 보호 패턴 원위치 유지. |
