# `MappingCreationModal` step 3 "다음" 버튼 disabled — 디버그 보고서

- **대상 케이스**: `frontend/src/components/admin/__tests__/MappingCreationModal.test.js:207` — `step 3 에서 패키지 미선택 시 "다음" 버튼 disabled (default 패키지 제거)`
- **baseline**: `origin/develop` (`4dee473b8`, PR #69 merge 직후) — PR #71 와 **무관** (PR #71 베이스가 아님)
- **검수자**: core-debugger (read-only · 코드 수정 없음)
- **검수 일시**: 2026-05-28 (Asia/Seoul)
- **연계 근거**: `P0_MAPPING_FLOW_HOTFIX_PR_47_REGRESSION_REPORT.md` §1 T3 / §4 HIGH #1 (선행 검수자가 동일 결함 보고) · `OPTION_B_V2_P0_INTEGRATION_TEST_REPORT.md` R-1 (develop tip 재현 확인)
- **선행 PR**: #47 (`e6a4c5fc6`) — step swap + step 3 가드 패치, **단 `useState` 초기값 patch 누락**
- **합의서**: `OPTION_B_RESERVATION_FIRST_PLAN.md` §0 Q4

---

## 0. 결론 (TL;DR)

- **근본 원인**: `MappingCreationModal.js:70-81` 의 `useState` 초기값이 여전히 `DEFAULT_MAPPING_CONFIG.{TOTAL_SESSIONS=10, PACKAGE_NAME='기본 10회기 패키지', PACKAGE_PRICE=500000}` 을 사용 → 첫 mount 시 `paymentInfo.packageName` 가 truthy → `canProceed(step=3)` 가 `true` 반환 → "다음" 버튼 활성화 → `expect(nextButton).toBeDisabled()` 실패.
- **PR #47 step swap 후속 누락**의 결과(`resetModal()` 만 patch 되고 `useState` 초기값은 미반영). PR #71 (카드형 마크업) 과 인과 없음.
- **우선순위**: **P0** (테스트 FAIL + 운영 UX 결함 동반)

---

## 1. 재현 매트릭스 (12 케이스 · develop baseline)

| # | 조건 (state · fixture · 진입 경로) | `canProceed(step=3)` | "다음" disabled? | 비고 |
|---|------------------------------------|----------------------|------------------|------|
| C1 | 신규 mount → step 3 직진 (default state) | `true` | **NO** ← 실패 | `packageName='기본 10회기 패키지'`, `totalSessions=10`, `packagePrice=500000` (모두 truthy) |
| C2 | 패키지 클릭 안 함, `paymentInfo.packageName=null` 강제 | `false` | YES ✓ | resetModal() 후 동일 |
| C3 | `packageName=''` (빈 문자열) | `false` | YES ✓ | `!!''` → false |
| C4 | `totalSessions=0`, 나머지 default | `false` | YES ✓ | `(0||0)>0` → false |
| C5 | `packagePrice=0`, 나머지 default | `false` | YES ✓ | 동일 |
| C6 | `packageName='표준 패키지'` (테스트 fixture 라벨 클릭) | `true` | NO ✓ | 정상 흐름 |
| C7 | step swap 전 (`canProceed` step 2 = `!!packageName`) | `true` | NO | PR #47 이전 버그 (참고용, develop 에서는 더 이상 해당 없음) |
| C8 | `localStorage.lastUsedPackage` 있고 매칭되는 `packageOptions` 존재 | `true` | NO | R6 잔존(useEffect L147-166) — 두 번째 진입 |
| C9 | `localStorage.lastUsedPackage` 있고 매칭 `packageOptions` 없음 | `true` | **NO** ← 동일 실패 | useEffect no-op → default 그대로 |
| C10 | `loadPackageCodes()` 가 빈 배열 반환 (JSDOM fetch 실패) | `true` | **NO** ← 동일 실패 | `packageOptions=[]` 이어도 default state 는 그대로 truthy |
| C11 | 테스트 fixture 그대로(`packageCodeFixture` 1건, JSDOM 환경) | `true` | **NO** ← 본 케이스 | `getCommonCodes` mock → `packageOptions=[{표준 패키지,5,300000}]` 로딩됨, but 클릭 전이라 paymentInfo 영향 0 |
| C12 | step 3 진입 후 `setPaymentInfo({packageName:null,...})` 직접 호출 | `false` | YES ✓ | reset 가설 검증 — 초기 state만 문제 |

→ **C1·C11 동일 패턴 ≡ 본 테스트 실패**. 트리거 조건은 "fresh mount + step 3 까지 진입하되 패키지 미클릭". 회기 부여 / fixture / DOM 변경 모두 인과 없음.

---

## 2. 원인 가설 5종 — H-check (FALSIFY / CONFIRM)

| H | 가설 | 근거 인용 | 판정 |
|---|------|-----------|------|
| **H1** | testid/text selector 누락으로 next 버튼이 잘못 잡혀 disabled 단언 실패 | `MappingCreationModal.js:421-434` 의 next 버튼은 `step<4` 조건으로 단 1개만 렌더. 테스트는 `screen.getByText('common:action.next')` (`test.js:220`) 로 정확히 단일 매칭 | **FALSIFY** |
| **H2** | `canProceed` step index 가 swap 후 오기재 (예: step 2 와 3 로직 뒤바뀜) | `MappingCreationModal.js:391-403` — `step===2` → `!!selectedClient?.id`, `step===3` → `packageName + totalSessions>0 + packagePrice>0`. 본문 콘텐츠 `step===2`(L606 내담자) / `step===3`(L551 패키지) 와 정합. 로직 일관 | **FALSIFY** |
| **H3** | fixture `packageCodeFixture` 에 `totalSessions` 누락 → `(totalSessions||0)>0` false 로 빠짐 | fixture `extraData:{price:300000, sessions:5}` (`test.js:147-151`) → `loadPackageCodes` parse 정상. 단 **패키지 클릭 전**이므로 fixture 값은 paymentInfo 에 반영되지 않음. 본 실패와 무관 | **FALSIFY** |
| **H4** | `STEPS_CONFIG` 라벨↔본문 step index drift 가 `canProceed` 까지 영향 | `MappingCreationModal.js:41-47` STEPS_CONFIG `key=2 labelFallback='패키지'`, `key=3 labelFallback='내담자'` — **본문/canProceed 와 라벨 불일치 (사용자 UX 결함)**. 단 `canProceed`/next 버튼 로직은 `step` state 만 참조, STEPS_CONFIG label 무관 → 본 테스트 실패의 인과는 아님 | **PARTIAL** (UI 결함 CONFIRM / 본 실패 인과 FALSIFY) |
| **H5** | `disabled` 속성 set timing — React state 비동기 또는 testing-library 렌더 race | `fireEvent.click` 은 sync flush, `setStep(step+1)` 후 `await waitFor(...)` 로 다음 step 렌더 완료까지 대기 (`test.js:215-220`). `disabled={!canProceed()}` 는 매 렌더마다 sync 계산 → race 없음 | **FALSIFY** |
| **H6 (실제 근본 원인)** | `useState` 초기값이 여전히 `DEFAULT_MAPPING_CONFIG` 사용 → 첫 mount 시 default 패키지 강제 선택 상태 → `canProceed(3)` truthy → disabled 단언 실패 | `MappingCreationModal.js:70-81` `useState({totalSessions: DEFAULT_MAPPING_CONFIG.TOTAL_SESSIONS, packageName: DEFAULT_MAPPING_CONFIG.PACKAGE_NAME, packagePrice: DEFAULT_MAPPING_CONFIG.PACKAGE_PRICE, ...})`. `constants/mapping.js:246-252` `DEFAULT_MAPPING_CONFIG = {TOTAL_SESSIONS:10, PACKAGE_NAME:'기본 10회기 패키지', PACKAGE_PRICE:500000, ...}`. PR #47 (`e6a4c5fc6`) 의 step swap 핫픽스가 `resetModal()` (L370-381) 만 `0/null` 로 patch — `useState` 초기값은 미patch (선행 검수 §4 HIGH #1 보고) | **CONFIRM** |

---

## 3. 핫픽스 권고 (코더 위임 명세 · 본 디버거는 코드 수정 안 함)

### P0 (필수, 본 테스트 PASS 조건)

- **F-1**: `frontend/src/components/admin/MappingCreationModal.js:70-81` — `useState` 초기값을 `resetModal()` (L370-381) 과 동일하게 변경.

  ```js
  // 변경 후 (예시)
  const [paymentInfo, setPaymentInfo] = useState({
    totalSessions: 0,
    packageName: null,
    packagePrice: 0,
    paymentMethod: 'BANK_TRANSFER',
    paymentReference: '',
    responsibility: '',
    specialConsiderations: '',
    notes: '',
    paymentTiming: 'ADVANCE'
  });
  ```

- **F-2**: `MappingCreationModal.js:23` — `import { DEFAULT_MAPPING_CONFIG } from '../../constants/mapping'` 사용처가 더 이상 없으면 import 제거. (`constants/mapping.js:246-252` 의 상수는 다른 모듈 영향 없는지 `git grep DEFAULT_MAPPING_CONFIG` 로 확인 후 정리.)

### P1 (동반 권고, 회귀 보호)

- **F-3**: `MappingCreationModal.js:41-47` — `STEPS_CONFIG` 의 `key=2/3` 라벨/아이콘 swap. (현재: key2=패키지/Package, key3=내담자/UserCircle → 본문 step===2 내담자, step===3 패키지 와 정합 위해 swap)

  ```js
  const STEPS_CONFIG = [
    { key: 1, labelKey: 'admin:mappingCreation.step.consultant', labelFallback: '상담사', icon: User },
    { key: 2, labelKey: 'admin:mappingCreation.step.client',     labelFallback: '내담자', icon: UserCircle },
    { key: 3, labelKey: 'admin:mappingCreation.step.package',    labelFallback: '패키지', icon: Package },
    { key: 4, labelKey: 'admin:mappingCreation.step.paymentLabel', labelFallback: '결제', icon: CreditCard },
    { key: 5, labelKey: 'admin:mappingCreation.step.complete',   labelFallback: '완료', icon: CheckCircle }
  ];
  ```

- **F-4**: `MappingCreationModal.js:147-166` — `localStorage.getItem('lastUsedPackage')` 자동 적용 블록 제거 (HIGH #3, 선행 R6 보고). `handleCreateMapping` (L327-333) 의 `localStorage.setItem('lastUsedPackage', …)` 도 동시 정리. (자동 적용 유지 시 F-1 적용 후에도 두 번째 진입에서 default 재발 가능 → C8 케이스)

---

## 4. 회귀 보호 권고 (tester 위임)

| # | 가드 | 위치 (제안) |
|---|------|-------------|
| **G-1** | 본 fail 케이스(`step 3 에서 패키지 미선택 시 "다음" 버튼 disabled`) PASS 유지 — F-1 적용 후 재실행 | `MappingCreationModal.test.js:207-222` |
| **G-2** | step swap 라벨 정합 단언 — step===2 진입 시 스테퍼 `'내담자'` 가 `mg-v2-ad-stepper__item current`, step===3 진입 시 `'패키지'` 가 `current` (HIGH #2 선행 권고 §MEDIUM 4) | `MappingCreationModal.test.js` 신규 케이스 |
| **G-3** | `useState` 초기값 회귀 가드 — 모달 mount 직후(step===1) `apiPost` 호출 없이 step 3 까지 클릭하고 "다음" disabled 확인 (이미 G-1 과 동일 패턴, default 재도입 방지 가드로 명시 주석) | 동일 파일 |
| **G-4** | localStorage 자동 적용 제거 가드 — `localStorage.setItem('lastUsedPackage', JSON.stringify({packageName:'표준 패키지', totalSessions:5, packagePrice:300000}))` 후 모달 재mount → step 3 "다음" disabled 유지 확인 | 동일 파일 |
| **G-5** | (선행 §MEDIUM 4 와 중복 가능) lint 차원에서 `useState`/`resetModal` 초기값 일관성 검사 — `npm run lint:codemod-mappings` 의 가드에 `DEFAULT_MAPPING_CONFIG.PACKAGE_NAME` 직접 참조 금지 룰 추가 (옵션) | `config/shell-scripts/check-hardcode.sh` 또는 codemod |

---

## 5. 우선순위 (P0~P3)

| Priority | 항목 | 대응 |
|----------|------|------|
| **P0** | F-1 `useState` 초기값 0/null 정렬 (테스트 FAIL + 운영 default 패키지 강제 적용 P0 UX 결함 동반) | core-coder 즉시 핫픽스 |
| **P0** | G-1 동일 Jest 케이스 PASS 재확인 | core-tester, F-1 직후 |
| **P1** | F-3 `STEPS_CONFIG` 라벨 swap + G-2 스테퍼 라벨 단언 | core-coder + core-tester |
| **P1** | F-4 `localStorage.lastUsedPackage` 자동 적용 제거 + G-4 가드 | core-coder + core-tester |
| **P2** | F-2 `DEFAULT_MAPPING_CONFIG` import / 상수 정리 | core-coder, F-1 이후 |
| **P3** | G-5 lint 룰 추가 (선택) | core-coder, 일정 여유 시 |

---

## 6. 후속 코더 위임 prompt 초안 (3~5 줄)

> 너는 **core-coder** 서브에이전트로 행동한다. develop 기준 별도 브랜치 `hotfix/mapping-creation-modal-step3-default-purge-2026-05-28` 에서 다음을 적용해 `MappingCreationModal — P0 핫픽스 + STEP swap › step 3 에서 패키지 미선택 시 "다음" 버튼 disabled (default 패키지 제거)` Jest 케이스를 PASS 시켜라. 변경 범위 한정 (1) `frontend/src/components/admin/MappingCreationModal.js:70-81` `useState` 초기값을 `{totalSessions:0, packageName:null, packagePrice:0, paymentMethod:'BANK_TRANSFER', paymentReference:'', responsibility:'', specialConsiderations:'', notes:'', paymentTiming:'ADVANCE'}` 로 변경 (`resetModal()` L370-381 과 정합), (2) L41-47 `STEPS_CONFIG` 의 key=2/3 라벨·아이콘 swap (`{key:2, …'내담자', UserCircle}`, `{key:3, …'패키지', Package}`), (3) L147-166 `localStorage.lastUsedPackage` 자동 적용 useEffect 블록 + L327-333 `setItem` 호출 동시 제거, (4) L23 `DEFAULT_MAPPING_CONFIG` import 잔여 사용 확인 후 정리. 게이트 `cd frontend && npm test -- --watchAll=false --testPathPattern='MappingCreationModal'` PASS + `npm run check:i18n-seed` PASS + `npm run lint:codemod-mappings` PASS 확인 후 PR 발주. 디버그 근거: `docs/project-management/2026-05-28/MAPPING_CREATION_MODAL_STEP3_NEXT_DISABLED_DEBUG.md` §3·§4.

---

## 7. 부록 — 인용 출처

- 컴포넌트: `frontend/src/components/admin/MappingCreationModal.js` (L23 import · L41-47 STEPS_CONFIG · L70-81 useState · L147-177 localStorage useEffect · L283-364 handleCreateMapping · L370-381 resetModal · L391-403 canProceed · L421-434 next 버튼 · L496/551/606/685/819 step 콘텐츠 분기)
- 상수: `frontend/src/constants/mapping.js:246-252` (`DEFAULT_MAPPING_CONFIG`)
- 테스트: `frontend/src/components/admin/__tests__/MappingCreationModal.test.js:207-222` (실패 케이스), L145-152 fixture, L60-63/L178-182 `getTenantCodes` mock
- 선행 검수: `docs/project-management/2026-05-28/P0_MAPPING_FLOW_HOTFIX_PR_47_REGRESSION_REPORT.md` §1 T3 / §4 HIGH #1·#2·#3 / §6 위임
- 인접 보고: `docs/project-management/2026-05-28/OPTION_B_V2_P0_INTEGRATION_TEST_REPORT.md` §R-1 (develop tip 재현)
- PR #47 핫픽스 commit: `e6a4c5fc6` (`hotfix(p0): 신규 매칭 흐름 가드 강화 + CheckoutSameDayModal 진입 가드`)

(끝)
