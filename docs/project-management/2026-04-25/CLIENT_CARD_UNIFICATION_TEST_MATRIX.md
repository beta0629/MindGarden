# 내담자 카드 통일 — Phase E 테스트 매트릭스

**작성일**: 2026-04-25  
**근거**: `CLIENT_CARD_UNIFICATION_ORCHESTRATION.md` §6 Phase E, §8 회귀 체크리스트  
**대상 컴포넌트**: `frontend/src/components/ui/Card/ClientCard.js`, B0KlA 소비처 `ClientSelector.js` / `ClientSelectionStep.js`

---

## 1. `ClientCard`(공통 UI) 소비처 인벤토리 (explore 반영)

| 경로 | 비고 |
|------|------|
| `frontend/src/components/schedule/ClientSelector.js` | B0KlA 내담자 선택 모달 — **본 배치 주 검증 대상** |
| `frontend/src/components/admin/SessionManagement.js` | `import ClientCard from '../ui/Card/ClientCard'` — **회귀 스모크 최소 1곳** |

> 동일 파일명·다른 구현: `frontend/src/components/consultant/molecules/ClientCard.js` 등은 본 SSOT와 별도이므로 본 매트릭스 범위 밖(혼동 방지용).

---

## 2. 시나리오 매트릭스

| ID | 전제 | 단계 | 기대 결과 | 우선순위 |
|----|------|------|------------|----------|
| **E-B0-01** | 관리자 계정, B0KlA 스케줄 플로우 진입 가능 | 내담자 선택 단계까지 진행해 모달(오버레이) 오픈 | `mg-modal--large` · `client-selection-step` / `client-selector` 영역이 보이고 카드가 1건 이상 그리드로 표시됨 | P0 |
| **E-B0-02** | E-B0-01과 동일, 카드에 상태 라벨이 있는 데이터 | 각 카드의 상태 영역(진행중/대기 등) 시각 검사 | §8: 상태 배지 가독성·일관성(색·라벨·위치가 스펙·토큰과 어긋나지 않음) | P0 |
| **E-B0-03** | 긴 이름·긴 메타가 있는 내담자 | 카드 내 이름·이니셜·부가 메타(최근 상담 등) 확인 | §8: ellipsis/줄바꿈 붕괴 없음, 레이아웃 오버플로 없음 | P0 |
| **E-B0-04** | 진행률·회차·숫자 필드가 있는 카드 | 해당 필드 표기 확인 | §8: 숫자 표기가 기존 제품 로케일·패턴과 일관 | P1 |
| **E-B0-05** | 선택 가능한 카드가 있음 | "선택하기"(또는 동등 CTA)에 마우스 호버·포커스·클릭 | §8: 호버·포커스 링·disabled 시 일관 동작, 선택 후 플로우 정상 진행 | P0 |
| **E-B0-06** | 내담자 수가 뷰포트보다 많음 | 모달 본문 내 목록 스크롤(휠/트랙패드) | 스크롤이 모달 밖으로 새지 않고, 카드가 잘리지 않으며 스크롤바 동작 정상 | P0 |
| **E-B0-07** | 모달 오픈 상태 | 키보드만으로 Tab / Shift+Tab 순회 | §8: 포커스가 논리 순서로 이동(닫기·목록·CTA 등), 포커스 트랩이 제품 정책과 일치 | P0 |
| **E-CON-01** | 개발자 도구 콘솔 오픈 | E-B0-01~07 수행 전후 콘솔 확인 | **에러 0건**(경고만 있는 경우는 팀 정책에 따르되, 본 게이트는 **error 0** 명시) | P0 |
| **E-REACT-01** | 동일 | 카드가 있는 탭 전환·스크롤·선택 반복 | **React #130**(자식으로 객체 렌더 등) 미발생; 빨간 오버레이 없음 | P0 |
| **E-REG-SM-01** | 관리자, 세션 관리 화면 접근 권한 | `SessionManagement`가 `ClientCard`를 쓰는 뷰로 이동해 목록/카드 영역 스모크 | §8: **레이아웃 붕괴 없음**, 배지·타이포가 이전 대비 비정상 뒤틀림 없음 | P0 |
| **E-SAFE-01** | (해당 시) 코더 체크리스트에 동적 필드 변경 포함 | 카드 내 API 기원 필드가 객체 그대로 노출되지 않는지 샘플링 | `safeDisplay` 등 표시 경계 위반 흔적 없음(문자열·숫자만 텍스트 노드로) | P1 |

---

## 3. 자동화·정적 검증 (보조)

| ID | 도구 | 범위 | 비고 |
|----|------|------|------|
| **E-LINT-01** | `npx eslint --max-warnings 0` | `ClientCard.js`, `ClientSelector.js`, `ClientSelectionStep.js` | 코더 머지 전후 베이스라인 비교 가능 |

**프론트 단위 테스트(Jest)**: 저장소 기준 `ClientCard` / `ClientSelector` / `ClientSelectionStep` 직접 참조 `*.test.*` 미존재 → **해당 테스트 없음**(신규 작성은 별 과제).

---

## 4. 코더 머지 후 재실행 (필수)

다음은 **core-coder 변경이 `main`(또는 대상 브랜치)에 병합된 뒤** Phase E를 **처음부터 다시** 통과시키기 위한 절차이다.

1. 최신 브랜치 체크아웃 후 의존성 동기화(`npm ci` 또는 팀 표준).
2. **E-LINT-01** 동일 명령으로 세 파일 eslint 재실행(경고 0 정책 유지 시 `--max-warnings 0`).
3. **§2 매트릭스**의 P0 시나리오(E-B0-01~07, E-CON-01, E-REACT-01, E-REG-SM-01) 전부 재실행; P1은 시간 허용 시.
4. 결과를 통과/실패 표로 남기고, 실패 시 **재현 경로·스크린샷·콘솔 로그**를 이슈에 첨부.

**완료 정의**: §7 게이트 — Phase E **core-tester 통과**(콘솔 0·스모크·회귀 최소 범위) 및 본 문서 §4 재실행 완료.

---

## 5. Phase E 자동 검증 기록 (타임스탬프)

| 항목 | 내용 |
|------|------|
| **실행 일시** | 2026-04-25 12:16:36 KST (2026-04-25T03:16:36Z) |
| **E-LINT-01** | **통과** (`eslint` exit **0**, `--max-warnings 0`) |
| **수동(§2 P0)** | **미실행(에이전트 환경)** — E-B0-01~07, E-CON-01, E-REACT-01, E-REG-SM-01 등 브라우저 검증은 로컬에서 수행 |

**실행 명령 (frontend 루트)**:

```bash
cd frontend && npx eslint --max-warnings 0 \
  src/components/ui/Card/ClientCard.js \
  src/components/schedule/ClientSelector.js \
  src/components/schedule/steps/ClientSelectionStep.js \
  src/components/admin/SessionManagement.js
```

**보조**: `ScheduleB0KlA.css` — **stylelint 미구성** (`frontend/package.json`에 stylelint 스크립트·의존성 없음).
