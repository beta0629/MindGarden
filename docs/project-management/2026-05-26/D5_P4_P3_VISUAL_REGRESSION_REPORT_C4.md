# D5 P4 P3 Visual Regression Report (4차 청크 / PR-L)

## §0 메타 데이터
- **검수 일자**: 2026-05-26
- **Develop HEAD**: `2a18ece1c` (PR-L Wave-2 정착 직후)
- **대상 PR**: PR-L (4차 청크, Wave 1 & 2 누적 6 커밋)

## §1 빌드 / Lint 정합성
- **`npm run lint:codemod-mappings`**: 57/57 PASS (가드 1·2 모두 통과)
- **Production Build**: PASS (`exit_code: 0`, 빌드 폴더 정상 생성)
- **ESLint (`src/i18n`, `src/hooks/*`)**: 0 Errors, 1 Warning (`import/no-named-as-default-member` in `i18n/index.js`). **PASS**

## §2 Phase 1 정착물 회귀 검증
- `i18n/index.js` 기본 설정 (`ko`, `common`) 무결성 확인.
- 1~3차 청크에서 생성된 기존 9개 namespace 데이터 보존 및 정상 확장 확인.
- **결론**: Phase 1 정착물 회귀 **0건 (무수정 유지 성공)**

## §3 i18n 정합성 검수
### 3.1 Namespace 등록 정합
- 총 **14개 Namespace** 정상 등록 확인:
  - 기존 9종: `admin`, `common`, `error`, `settings`, `statistics`, `report`, `schedule`, `erp`, `auth`
  - 신설 5종: `manualNotification`, `terms`, `testNotification`, `systemConfig`, `smsTemplate`

### 3.2 ko.json Leaf 카운트
- 전체 Leaf 합계: **3,824** (Wave-1/2 보고서 KPI 정합)
  - 주요 분포: `admin`(2008), `common`(486), `erp`(379), `error`(151), `settings`(138), `report`(130), `statistics`(100) 등.

### 3.3 잔존 Fallback (코드 호출)
- Pattern-A 코드 호출 형식(`t('...', '한글')`) 잔존 확인: **2 matches in 2 files**
  - `frontend/src/components/test/PaymentTest.js`
  - `frontend/src/i18n/index.js`
- 완전한 0건 달성 미흡.

## §4 KPI 매트릭스 (PR-L 누적 실측)

| KPI | 목표 (§3) | PR-L 누적 (4차) 후 실측 | 도달 여부 |
|---|---:|---:|:---:|
| 한국어 라인 (JS/TS) | < 15,000 | **27,555** | ❌ 미달 |
| `t(` 호출 라인 | > 3,000 | **2,984** | ❌ 미달 (근접) |
| useTranslation 파일 | > 500 | **300** | ❌ 미달 |
| ko leaves | > 1,500 | **3,824** | ✅ 초과 달성 |
| `window.alert/confirm` 잔존 | 0 | **9 calls** (2 files) | ❌ 미달 |
| Phase 1 정착물 무수정 | 100% | **100% 무수정** | ✅ 달성 |

> **분석**: 한국어 라인 감소폭이 예상에 미치지 못했으며, D5 P5 진입을 위한 절대 기준(<15k)에서 크게 벗어남(+12,555). `t()` 호출 횟수는 목표치에 근접했으나 `useTranslation` 도입 파일 수가 300개에 머무름.

## §5 회귀 카운트
- **HIGH (0건)**: 운영 배포 차단 요인 없음 (Build 정상, Phase 1 유지, ko.json 누락 없음).
- **MED (2건)**: 
  - `PaymentTest.js` 등에 Pattern-A Fallback 호출 일부 잔존.
  - `window.alert/confirm` 잔존 (유틸리티 및 테스트 파일에서 검출).
- **LOW (1건)**: `i18n/index.js`의 ESLint Warning 1건.

## §6 D5 P5 진입 게이트 평가
- ❌ 한국어 라인 (JS/TS) ≤ 15,000 (Actual: 27,555)
- ❌ `t()` 호출 ≥ 3,000 (Actual: 2,984)
- ❌ `useTranslation` 파일 ≥ 500 (Actual: 300)
- ✅ ko leaves ≥ 1,500 (Actual: 3,824)
- ❌ `window.alert/confirm` 0 (Actual: 9)
- ✅ Phase 1 정착물 무수정

**평가**: 주요 하드 KPI(한국어 라인 수 및 fallback/alert 제로화) 미달로 **D5 P5 다국어 진입 게이트 진입 불가**.

## §7 운영 Push 권고
**판정**: **CONDITIONAL GO**

**사유**:
- HIGH 등급의 회귀 결함이 없고, Production Build 및 Lint 가드를 완벽히 통과함.
- Phase 1 정착물 및 다국어 14개 Namespace 확장이 안정적으로 수행됨.
- 단, P4의 본질적 목표(한국어 텍스트 < 15k, fallback 0)에 도달하지 못해, 현재 상태로는 D5 P5(언어팩 본격 교체) 진입이 불가능함.
- 따라서 PR-L은 안전하게 merge/push 하되, 후속 라운드를 반드시 편성해야 함.

## §8 후속 라운드 권고
- **PR-M (5차 청크) 발의 필수**: 잔여 한국어 라인(12,500여 줄)을 일괄적으로 하드코딩 제거 및 `t()` 치환.
- Fallback 잔존 제거 및 `window.alert/confirm` 호출을 i18n hook(`useAlert`, `useConfirm`)으로 교체.
- Console / Error 메시지는 i18n 적용 대상에서 제외하는 정책(§C11/§C12)을 엄격히 준수하여 불필요한 번역 확장을 억제.