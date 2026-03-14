# ERP UX — 데이터 동기화 섹션 마크업 및 라벨 영역 접근성 스펙

**작성일**: 2026-03-14  
**참조**:  
- `docs/project-management/ERP_UX_INVISIBLE_ERP_PLAN.md`  
- `docs/project-management/ERP_UX_PLANNER_TASK_HANDOFF.md` §3  
- `.cursor/skills/core-solution-publisher/SKILL.md`

**대상**: 운영 현황(ErpDashboard) 페이지, 통합 재무·기타 ERP 관련 라벨 영역.  
**담당**: core-publisher(마크업 스펙) → core-coder(구현·라벨 적용).

---

## 1. "데이터 동기화" 섹션 마크업 스펙

### 1.1 구현 상태

- **운영 현황(ErpDashboard)** 페이지의 "데이터 동기화" 섹션은 **이미 구현되어 있음** (`frontend/src/components/erp/ErpDashboard.js` 386~434줄).
- 섹션 제목 라벨은 이미 **"데이터 동기화"**로 적용되어 있음 (기획 §2.2 "ERP 회계 초기화·동기화" → "데이터 동기화" 반영).

### 1.2 퍼블리셔 결론

| 항목 | 내용 |
|------|------|
| **마크업** | **기존 마크업 유지, 라벨만 변경** (라벨은 이미 "데이터 동기화"로 적용됨). |
| **구조** | `mg-v2-ad-b0kla__card erp-sync-card` 래퍼, `h2.mg-v2-ad-b0kla__section-title`, `erp-sync__usage` / `erp-sync__urls` / `erp-sync__results` / `erp-sync__help` 하위 블록 유지. |
| **접이식** | 기획서에서는 "접이식 권장"이나, 현재는 항상 펼쳐진 상태. 접이식 도입 시 아래 §1.3 참고. |

### 1.3 접이식 도입 시 권장 마크업 (선택)

나중에 "데이터 동기화"를 접이식(collapsible)으로 변경할 경우, **기존 DOM 구조를 최소 변경**하는 범위에서 권장하는 구조만 기술한다. (코드 수정은 core-coder 담당.)

- **섹션 래퍼**: `<section class="mg-v2-ad-b0kla__card erp-sync-card" aria-labelledby="erp-sync-heading">`
- **토글 가능 제목**:  
  `<h2 id="erp-sync-heading" class="mg-v2-ad-b0kla__section-title">`  
  내부에 `<button type="button" aria-expanded="true" aria-controls="erp-sync-body">` 로 제목+아이콘 감싸기.  
  접근성: `aria-expanded`, `aria-controls="erp-sync-body"` 로 열림/닫힘 상태·대상 연결.
- **본문**: `<div id="erp-sync-body" class="erp-sync__body">` 로 사용 방법·URL·결과·도움말 블록을 한 덩어리로 감싸기.
- **BEM**: 기존 `erp-sync__*` 유지, 필요 시 `erp-sync__body` 만 추가.

---

## 2. 라벨 영역 시맨틱·접근성 가이드

기획서 §2에서 변경되는 **페이지 타이틀, 카드 제목, 탭 라벨**이 들어가는 영역에 대한 시맨틱·접근성 권장 사항. **기존 컴포넌트 DOM 구조를 바꾸지 않는 범위**에서만 적용.

### 2.1 페이지 타이틀

| 화면 | 권장 사항 |
|------|-----------|
| 운영 현황(ErpDashboard) | 레이아웃에서 페이지 제목이 한 번만 노출되면 **h1** 또는 `ContentHeader`에 `aria-label="운영 현황"` 유지. 이미 `ContentArea`에 `ariaLabel="운영 현황"` 사용 중이면 유지. |
| 수입·지출 관리(IntegratedFinanceDashboard) | 동일하게 페이지 제목 영역에 **h1** 또는 `aria-label="수입·지출 관리"` 권장. |

### 2.2 부제(서브타이틀)

| 권장 | 비고 |
|------|------|
| 부제가 제목 바로 다음에 오면 **h1 + 부제는 텍스트 노드 또는 span**으로 두고, 필요 시 `aria-describedby`로 h1과 연결 가능. | 기존 구조 유지 우선. |

### 2.3 카드·섹션 제목

| 영역 | 권장 |
|------|------|
| 운영 현황 카드 그룹 섹션 제목("빠른 액션", "최근 활동" 등) | **h2** 유지. 이미 `h2.mg-v2-ad-b0kla__section-title` 사용 중이면 유지. |
| "데이터 동기화" 섹션 제목 | **h2** 유지. `id="erp-sync-heading"` 은 접이식 도입 시 `aria-controls`와 연결용으로 추가 권장. |
| 통합 재무 화면 내 섹션 제목 | **h2** 로 섹션 구분. 기존 `mg-v2-ad-b0kla__chart-title` 등이 h2/h3인지 확인 후, 문서 제목 계층(h1 → h2 → h3)이 한 번에 건너뛰지 않도록 유지. |

### 2.4 탭 라벨

| 영역 | 권장 |
|------|------|
| 통합 재무 탭(거래 정리, 계정별 내역, 현금 흐름 등) | 탭 컨테이너에 `role="tablist"`, 각 탭에 `role="tab"`, 선택 시 `aria-selected="true"`. 탭 패널에 `role="tabpanel"`, `aria-labelledby`로 해당 탭 id 연결. |
| 아이콘만 있는 버튼/링크 | `aria-label`로 목적 설명(예: "새로고침", "데이터 동기화 실행"). |

### 2.5 요약

- **제목 계층**: 페이지당 h1 1개, 섹션 제목은 h2, 하위 블록 제목은 h3.
- **기존 구조 유지**: 이미 `ContentHeader`, `ContentKpiRow`, `mg-v2-ad-b0kla__section-title`, `mg-v2-ad-b0kla__admin-card` 등으로 구성된 경우 **태그·클래스 추가/변경 없이** 라벨 문자열만 교체해도 됨.
- **접근성**: 라벨 변경 시 동일한 `aria-label` / `ariaLabelledby` 값만 새 문구로 맞추면 됨. 별도 마크업 수정 불필요.

---

## 3. designer 산출물 연계

- **`docs/project-management/ERP_UX_LABEL_APPLICATION_SPEC.md`**  
  작업 시점에 **해당 파일이 존재하지 않음**.  
  따라서 새 문구가 들어가는 블록 중 **마크업 수정이 필요한 곳**을 블록별로 목록화하지 못함.

- **결론**:  
  - **추가 마크업 수정 없음** (라벨 적용 스펙 문서가 없어, 스펙 기준 목록화 생략).  
  - designer가 `ERP_UX_LABEL_APPLICATION_SPEC.md`를 생성한 뒤, 해당 스펙에 "마크업/구조 변경"이 필요한 블록이 명시되면 core-publisher가 그 블록만 대상으로 마크업 예시·가이드를 보완할 수 있음.

---

**문서 끝.**
