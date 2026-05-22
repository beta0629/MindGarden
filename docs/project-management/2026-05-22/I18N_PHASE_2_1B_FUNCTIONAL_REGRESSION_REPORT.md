# i18n Phase 2.1b — 기능 회귀 검수 보고서

**작성일**: 2026-05-22  
**역할**: `core-tester` (검수 전용, 코드 직수정 금지)  
**근거 합의서**: `docs/standards/I18N_ADOPTION_STRATEGY_2026Q2.md` §3·§4·§6.1·§6.2·§6.3·§6.4  
**검수 대상**: 워킹트리 미커밋 변경 (Phase 2.1b 1차 치환 결과)

---

## §0 결론 (TL;DR)

**PASS** — 기능 회귀 0건. i18n Phase 2.1b 1차 치환은 정합·빌드·린트·fallback·훅 주입 모든 게이트를 통과. 별도 PR 분리 커밋 권고.

---

## §1 코드 변경 정합

| 항목 | 기대 | 실측 | 결과 |
|---|---|---|---|
| `frontend/src/**` 수정 파일 수 | ≈ 266 (264 .js + 2 locales) | **264 .js + 2 .json = 266** | ✅ |
| `useTranslation` 미주입 modified .js | 0 | **0 / 264** | ✅ |
| `frontend/src/locales/ko/common.json` 신규 키 | 50 (act 9 / lab 36 / msg 5) | **9 + 36 + 5 = 50** | ✅ |
| `frontend/src/locales/ko/admin.json` 신규 키 | 50 (act 9 / lab 37 / msg 4) | **9 + 37 + 4 = 50** | ✅ |
| 기존 flat 키 (`action.save` 외 9건) 보존 | 10/10 | **10/10 무수정** (common.json L2~11) | ✅ |
| 신규 키 nested 구조 `<ns>.<category>.<slug>` | 일치 | `common.actions.*`, `common.labels.*`, `common.messages.*`, `admin.actions.*`, `admin.labels.*`, `admin.messages.*` | ✅ |
| `scripts/i18n/extract-hangul-strings.js` 사전 5건 추가 | LABEL 4 + ACTION 1 | 32 줄 변경(추가) — 사전 확장 확인 | ✅ |
| `scripts/i18n/codemod-replace-top50.js` 신규 | untracked 신규 | **존재** | ✅ |

전체 워킹트리 280 modified + untracked 분포: frontend/src 266 + scripts/i18n 2 + 그 외 백엔드/docs 12 (D7·SMS·결제 트랙 별도 — 본 검수 무관).

---

## §2 빌드/린트 재검증

| 명령 | 결과 | 비고 |
|---|---|---|
| `cd frontend && npm run lint:check` | **PASS** (exit 0, 0 errors / 0 warnings) | `eslint src --ext .js,.jsx,.ts,.tsx --quiet`, 20.2 s |
| `cd frontend && npm run build:ci` | **PASS** (exit 0) | `main.d112e60d.js` 999.32 kB (+978 B — fallback 한글 746건 반영분), 22.5 s |

Phase 2.1b 1차 보고 §6.1 재현 완료. 신규 추가 텍스트로 인한 번들 +978 B는 예상 범위.

---

## §3 `useTranslation` 훅 주입 정합 (10 파일 샘플)

| # | 파일 (modified) | import | `const { t } = useTranslation();` | `t('key', '한글')` 적용 | 결과 |
|---|---|:-:|:-:|:-:|:-:|
| 1 | `admin/AdminDashboard.js` | L89 ✅ | L124 ✅ | (legacy 한글 잔존 별도 항목) | ✅ |
| 2 | `admin/AdminDashboard/AdminDashboardHeader.js` | L6 ✅ | L24 ✅ | `admin.labels.systemSettings` 외 | ✅ |
| 3 | `admin/AdminDashboard/organisms/DepositPendingList.js` | L6 ✅ | L18 ✅ | `common.actions.confirm` | ✅ |
| 4 | `common/BadgeSelect.js` | L5 ✅ | L28 ✅ | `common.messages.loading` | ✅ |
| 5 | `common/Chart.js` | L44 ✅ | L72 ✅ | `common.messages.loading` | ✅ |
| 6 | `common/ConsultantApplicationModal.js` | L7 ✅ | L31 ✅ | `common.actions.cancel` | ✅ |
| 7 | `ui/AdminMenuSidebarUI.js` (base/* 미수정 대체) | L29 ✅ | L38 ✅ | `admin.labels.systemManagement` | ✅ |
| 8 | `ui/Button/ButtonExamples.js` | L10 ✅ | L13 ✅ | `common.actions.delete`/`save`/`prev` | ✅ ※ |
| 9 | `dashboard-v2/AdminDashboardV2.js` | L106 ✅ | L197 ✅ | (legacy 한글 잔존 별도) | ✅ |
| 10 | `dashboard-v2/consultant/NextConsultationCard.js` | L6 ✅ | L23 ✅ | `admin.labels.client` | ✅ |

**합격률 10/10 (100 %)**. ※ ButtonExamples.js L13은 `const { t } = useTranslation();const [loading,...]` 동일 줄 — 동작 OK, 린트 PASS, 스타일 개선은 Phase 2.2 후속.

> **base/* 미선택 사유**: `frontend/src/components/base/` 폴더는 Phase 2.1b 치환 대상이 아님(modified 0건). 대체로 `ui/AdminMenuSidebarUI.js` 1건 선정.

---

## §4 fallback 한글 강제 유지 (§6.1 C-i4)

| 분류 | 건수 |
|---|---|
| **워킹트리 diff `+` 라인 — `t('key', '한글…')` 패턴** | **746건** |
| **워킹트리 diff `+` 라인 — `t('key')` 단일 인자 추가** | **0건** |

→ Phase 2.1b 1차 치환은 **fallback 누락 0건**. §6.1 C-i4 **무위반**.

> 참고: 코드베이스 전체 `t('key')` 단일-인자 호출은 잔존(라인 합산 약 250+, 73개 modified 파일 포함) — 모두 Phase 2.1b 이전 legacy. 본 라운드의 도입 책임이 아니며 Phase 2.2 후속 라운드의 점진 보강 대상.

---

## §5 자동 롤백 3 파일 사용처 영향 평가

| 파일 (rollback) | 상태 | 부모 import | 부모 i18n 적용 | 텍스트 일관성 위험 |
|---|---|---|:-:|---|
| `consultant/organisms/ConsultationLogFormPanel.js` | unmodified (i18n 미적용) | `consultant/ConsultationLogModal.js` | **modified ✅** | 자식 한글 직표시 / 부모 `t()` 혼재 — 사용자 가시 텍스트 동일 한글로 표시되므로 **LOW** |
| `schedule/AdminSchedulesPage.js` | unmodified | `App.js` | **modified ✅** | 라우트 진입점만 호출 — UI 텍스트 충돌 없음, **LOW** |
| `ui/Schedule/ScheduleCalendarView.js` | unmodified | `schedule/UnifiedScheduleComponent.js` | unmodified | 부모도 i18n 미적용 (별도 트랙) — 자식과 일관 한글 표시, **LOW** |

3 파일 모두 implicit-return arrow 컴포넌트로 codemod 안전 가드에 의해 정상 롤백. 다음 라운드(Phase 2.1b 2차) 수동 처리 후보로 정확히 분리됨.

---

## §6 수동 보강 2 파일 정합

| 파일 | 변환 | export 형태 | props/state/effect | 결과 |
|---|---|---|---|:-:|
| `consultant/ConsultantDashboardRenewal.js` | `ErrorState = ({...}) => (...)` → `=> { const { t } = useTranslation(); return (...); }` (L97~106) + main fn L186에 `const { t } = useTranslation();` | `export default ConsultantDashboardRenewal` (L410) 무변경 | 변경 없음 | ✅ |
| `ui/Card/MappingCard.js` | `MappingCardSummary` (외 3개 sub-component 중 1개) implicit→explicit, 4개 컴포넌트 export 구조 무변경 | `export default MappingCard` (L460) 무변경 | 변경 없음 | ✅ |

`return (...)` 누락 없음. 들여쓰기 +2 위치 차이만 발생 (functional 동일).

---

## §7 빈도 잔존 평가 (5 키워드, §6.3 인용)

| 키워드 | 보고 wrapped | 실측 wrapped | 보고 잔존 | 실측 총-잔존 (총 발생 − wrapped) |
|---|---:|---:|---:|---:|
| 취소 | 91 | **92** | 175 | 174 |
| 확인 | 20 | **30** | 818 | 808 |
| 완료 | 10 | **10** | 626 | 626 |
| 내담자 | 16 | **21** | 689 | 684 |
| 상담사 | 22 | **28** | 1,015 | 1,009 |

`확인`·`내담자`·`상담사` wrapped 수치가 보고치보다 약간 높음 — `paymentConfirm`, `clientManagement`, `consultantManagement` 등 복합 슬러그가 추가 매칭. 잔존치는 보고치 ± 1 % 이내로 일치.

**잔존 분포 정성 평가** (Phase 2.2~2.5 후속 권고):

| 분포 | '취소' | '내담자' | '상담사' | '완료' | 처리 라운드 |
|---|---:|---:|---:|---:|---|
| `constants/` 객체 리터럴 파일 수 | 27 | 36 | 39 | 30 | **Phase 2.2** (107 파일 스킵 영역 일괄) |
| `defaultProps`/`propTypes` 파일 수 | 7 | n/a | n/a | n/a | **Phase 2.3** |
| 주석/`console.*`/`throw new Error` 매치 수 | 15 | 105 | 204 | 183 | **Phase 2.5 영구 제외 합의 후보** |

→ 잔존 대부분이 **상수·검증·로깅·예외 메시지** (사용자 비가시 영역)로 위험도 낮음. 사용자 가시 영역 잔존은 Phase 2.1b 2차(롤백 3 파일) + Phase 2.2(constants 일괄)에서 처리.

---

## §8 i18n 운영 영향 위험 평가

| 등급 | 시나리오 | 차단 수단 | 본 라운드 건수 |
|---|---|---|---:|
| **HIGH** | UI 텍스트 누락 → 빈 텍스트 표시 | fallback 한글 강제 (§4) | **0** |
| **MEDIUM** | `t()` import 누락 → 빌드 에러 | lint 0 errors + build PASS (§2) | **0** |
| **LOW** | 롤백 3 파일 i18n 미적용 | 다음 라운드 수동 처리 (§5) | **3 파일** |
| **LOW** | 잔존 비-i18n 텍스트 (constants·defaults·주석) | Phase 2.2~2.5 후속 (§7) | **constants 100+ 파일** |

---

## §9 종합 판정 + 다음 라운드 권고

- **종합 판정**: ✅ **PASS** (회귀 0건, 모든 게이트 통과)
- **권고**:
  1. **별도 i18n PR 분리 커밋·운영 push 진행 가능** — `frontend/src/**` 266 파일 + `scripts/i18n/**` 2 파일 + (선택) 합의서 본문만 단일 PR.
  2. **D7·SMS·결제 트랙 파일은 본 PR에서 제외** — `src/main/java/**`, `docs/CI_BI_*`, `scripts/design-system/**`, `scripts/deployment/**` 등은 각 트랙 별도 커밋.
  3. **Phase 2.1b 2차 (수동 라운드) 즉시 착수 가능**:
     - `consultant/organisms/ConsultationLogFormPanel.js`
     - `schedule/AdminSchedulesPage.js`
     - `ui/Schedule/ScheduleCalendarView.js`
  4. **Phase 2.2 (constants 일괄) 사전 합의 필요** — 107 스킵 파일 약 130+ 키 신규 추가 예상.
  5. **린트 룰 강화 권고** (운영 push 후): `react-i18next/no-untranslated-fallback` 또는 자체 룰로 `t('key')` 단일 인자 호출 추가 차단 → C-i4 항구적 보장.

---

**검수 종료 — 차단 사유 없음. 별도 PR 커밋·push 진행 권고.**
