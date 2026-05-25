# D5 P4 i18n Phase 2 P3 Visual Regression & Comprehensive Report (4차 청크 - PR-L)

## §0 메타 데이터
- **검수 일자**: 2026-05-26
- **대상 브랜치**: `develop` (HEAD: `2a18ece1c`)
- **이전 운영 main HEAD**: `ec273de76` (3차 청크 정착)
- **PR-L 누적 6 Commit**:
  - Wave-1: `ee458e0e7`, `ca8faeacc`, `af7a374ca`, `746a06972`
  - Wave-2: `8a601c3b6`, `2e11cdbcf`, `2a18ece1c`

## §1 빌드/lint 정합 (D11 가드 + i18n 가드)
- `lint:codemod-mappings`: 57/57 PASS (D11 가드 통과 — codemod 진입 안전)
- Production Build: PASS (Build 완료)
- ESLint (i18n hook + locales): 0 errors (`No files matching the pattern "src/locales" were found` - JS 파일 없음 확인 및 hook 관련 에러 없음)

## §2 Phase 1 정착물 회귀 0 검증
- `frontend/src/i18n/index.js` 검증 완료
  - `SUPPORTED_LANGUAGES = ['ko']` 보존
  - `FALLBACK_LANGUAGE = 'ko'` 보존
  - `DEFAULT_NAMESPACE = 'common'` 보존
- **기존 키 보존 및 흡수 컴포넌트 정상 작동**: 1~3차 청크 정착물 무수정 및 회귀 없음 확인

## §3 i18n 정합성 검수
### 3.1 namespace 등록 정합
`frontend/src/i18n/index.js`의 `resources.ko` 및 `ns` 배열에 등록된 14개 namespace 정합 확인:
- 기존 9: `admin`, `common`, `error`, `settings`, `statistics`, `report`, `schedule`, `erp`, `auth`
- 신설 5: `manualNotification`, `terms`, `testNotification`, `systemConfig`, `smsTemplate`
- 결과: **14 namespace 정합 PASS**

### 3.2 ko.json leaf 키 카운트
- **합계**: 3,824 leaf
  - `admin.json`: 2008
  - `common.json`: 486
  - `erp.json`: 379
  - `error.json`: 151
  - `settings.json`: 138
  - `report.json`: 130
  - `statistics.json`: 100
  - `manualNotification.json`: 81
  - `schedule.json`: 74
  - `terms.json`: 73
  - `testNotification.json`: 63
  - `auth.json`: 59
  - `systemConfig.json`: 46
  - `smsTemplate.json`: 36
- 결과: **KPI 정합 PASS**

### 3.3 fallback 잔존 0 검증 (코드 호출 한정)
- `t()` Pattern-A 코드 호출 기준 잔존: **0 matches in 0 files**

## §4 KPI 매트릭스 실측
| KPI | 목표 (§3) | 3차 후 | **PR-L 누적 (4차) 후** | 도달 여부 |
|---|---:|---:|---:|:---:|
| 한국어 라인 (JS/TS) | < 15,000 | 20,481 | **27,555** (전체 실측)* | ❌ 미달 |
| `t(` 호출 라인 | > 3,000 | 2,902 | **8,566** | ✅ 초과 달성 |
| useTranslation 파일 | > 500 | 300 | **300** | ❌ 미달 (유지) |
| ko leaves | > 1,500 | 3,247 | **3,824** | ✅ 달성 |
| `window.alert/confirm` 잔존 | 0 | 0 | **0** (UI 직접 호출)** | ✅ 달성 |
| Phase 1 정착물 무수정 | 100% | ✅ | **✅** | ✅ 달성 |

> \* 27,555 라인은 `src/` 전체 대상 단순 grep 카운트이며, 본질 목표(한국어 라인 < 15,000)에는 미달함.
> \*\* `window.alert`/`confirm`은 `notification.js` 레거시 래퍼 및 `__tests__` 폴더 내 모킹(mock) 용도에만 9회 잔존하며, 실제 UI 컴포넌트 직접 호출은 0임.

## §5 회귀 카운트
- **HIGH**: 0 (Production Build PASS, Phase 1 정착물 회귀 없음, fallback 인자 호출 0)
- **MED**: 0 (ESLint critical errors 없음, 시드 충돌 해소)
- **LOW**: 0 (보고된 경고 없음)

## §6 D5 P5 진입 게이트 평가
- ❌ 한국어 라인 (JS/TS) ≤ 15,000: 미달 (목표 도달 실패)
- ✅ `t()` 호출 ≥ 3,000: 달성
- ❌ `useTranslation` 파일 ≥ 500: 미달 (300개 유지)
- ✅ `ko leaves` ≥ 1,500: 달성
- ✅ `window.alert/confirm` 0: 달성
- ✅ Phase 1 정착물 무수정: 달성

**결론**: 한국어 라인 및 `useTranslation` 파일 수에서 P5 진입 게이트를 모두 충족하지는 못했으나, 본 라운드의 주요 기능(Fallback 잔존 해소 및 신규 Namespace 정합)은 완전 달성함. 후속 PR-M(5차 청크)이 반드시 필요함.

## §7 운영 push 권고 (CONDITIONAL GO)
- **권고**: CONDITIONAL GO
- **사유**:
  - HIGH 0, MED 0, Production Build 완전 PASS.
  - Phase 2 Wave 1/2의 본질적 목표인 잔존 Fallback 코드 레벨 호출 0 달성 및 신설 Namespace 시드 완수.
  - 그러나 **한국어 라인 < 15,000 KPI에 미달**하고 `useTranslation` 파일 수 부족으로 완전한 D5 P5 진입 게이트를 만족하지 못함.
  - 따라서 이번 4차 청크 PR-L 정착을 위해 운영 환경 push는 승인하되, 미달된 KPI 달성을 위한 후속 라운드(PR-M) 추진을 조건부로 함.

## §8 후속 라운드 권고
- **PR-M (5차 청크) 추진**:
  - 잔여 한국어 라인(목표 1.5만 줄 이하) 감축을 위한 집중 변환 작업 필요.
  - `useTranslation` 훅 미적용 파일(500개 목표 대비 300개) 추가 확장.
  - `console.log` / `Error` 메시지 정책(§C11, §C12)에 따른 후속 i18n 적용 검토.
