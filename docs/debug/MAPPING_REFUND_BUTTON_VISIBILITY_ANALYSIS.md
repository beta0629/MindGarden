# 매핑 관리 화면 "환불" 버튼 미노출 조사 보고서

**작성일**: 2026-03-17  
**대상**: 매핑 관리 화면(`mg-v2-mapping-management`) 내 매칭 리스트 행의 "환불" 버튼이 보이지 않는다는 사용자 피드백  
**제약**: 코드 수정 없이 조사·원인 정리·기획 확인·조치 제안만 수행

---

## 1. 표시 조건 조사 결과

### 1.1 렌더 조건 (코드 기준)

| 위치 | 파일 | 조건 |
|------|------|------|
| 행 컴포넌트 | `MappingListRow.js` | `onRefund`가 **truthy**일 때만 환불 버튼 렌더 (`{onRefund && (<ActionButton ...>환불</ActionButton>)}`) |
| 테이블 뷰 | `MappingTableView.js` | 동일. `onRefund`가 truthy일 때만 해당 셀에 환불 버튼 렌더 (아이콘만, `title="환불"`) |
| 블록 | `MappingListBlock.js` | 카드/테이블/캘린더 뷰 모두 부모로부터 받은 `onRefund`를 그대로 `MappingListRow` / `MappingTableView`에 전달 |
| 페이지 | `MappingManagementPage.js` | **항상** `onRefund={handleRefundMapping}` 전달. 권한·매핑 상태에 따른 조건부 전달 없음 |

결론: **현재 구현상 "환불" 버튼은 매핑 관리 페이지에서 모든 행에 대해 렌더되는 것이 정상**이다.  
(버튼을 아예 그리지 않게 하는 **상태/권한 조건은 코드에 없음**.)

### 1.2 클릭 시 검증 (버튼 노출과 무관)

- `handleRefundMapping(mapping)` 내부에서만 다음 검사 수행:
  - `mapping.status !== 'ACTIVE'` → 경고: "활성 상태의 매칭만 환불 처리할 수 있습니다."
  - `mapping.remainingSessions <= 0` → 경고: "남은 회기가 없는 매칭은 환불 처리할 수 없습니다."
- 위 조건을 만족하면 **PartialRefundModal**(부분 환불)을 연다.  
즉, **버튼 표시**와 **실제 환불 가능 여부**는 별개이며, 표시는 전 행 동일, 가능 여부는 클릭 시에만 검사된다.

### 1.3 뷰 모드

- `MappingListBlock` 기본 `viewMode`는 **`'card'`** (그리드 행 = `MappingListRow`).
- `'table'`일 때는 `MappingTableView` 사용. 두 뷰 모두 `onRefund`를 받아 환불 버튼을 노출한다.
- 테이블 뷰에서는 버튼이 **아이콘만** 표시되고 `title="환불"`로 툴팁만 있음. 카드 뷰에서는 아이콘 + 텍스트 "환불".

---

## 2. 미노출 가능 원인 정리

아래는 "버튼이 안 보인다"고 할 때 가능한 원인을 (가)(나)(다)로 정리한 것이다.

### (가) 조건 미충족으로 버튼이 아예 렌더되지 않는 경우

- **현재 코드에는 해당 없음.**  
  페이지는 권한/상태와 관계없이 `onRefund`를 항상 넘기므로, 모든 행에서 환불 버튼이 렌더되는 구조다.
- **가능성**:  
  - 다른 브랜치/배포에서 `onRefund`를 권한(예: `REFUND_MANAGE`) 또는 상태(예: `ACTIVE`만)에 따라 조건부로 넘기도록 수정했을 수 있음.  
  - 그 경우 해당 조건을 만족하지 않는 사용자/행에서는 버튼이 아예 안 나온다.

### (나) 렌더는 되지만 CSS/레이아웃으로 가려지거나 화면 밖에 있는 경우

- **반응형**: `MappingListRow.css`에서 `min-width: 900px` 미만일 때 행이 `flex-direction: column`으로 바뀌어 `__main`과 `__actions`가 세로로 쌓인다. `__actions`는 `flex-wrap: wrap`이라 버튼이 여러 줄로 내려갈 수 있다.
- **가능성**:
  - 뷰포트가 좁거나, `__main` 영역(상태·상담사·내담자·패키지·금액·회기·날짜 등)이 길어서 **액션 영역이 첫 화면 아래로 밀려** 스크롤하지 않으면 안 보일 수 있음.
  - 상위 컨테이너에 `overflow: hidden` 등이 있으면 액션 영역이 잘릴 수 있음. (현재 `MappingListRow.css`의 `__actions`에는 overflow 미지정.)
  - 테이블 뷰에서 "관리" 열이 좁으면 버튼이 잘리거나 가려질 수 있음.
- 사용자 제공 DOM 정보(`div.mg-v2-mapping-list-row__action` > `button.mg-v2-button mg-v2-button--danger ...` 텍스트 "환불")는 **카드 뷰**의 `MappingListRow`와 일치한다. (테이블 뷰는 `mg-v2-mapping-table` 내부이며 버튼에 텍스트 없이 아이콘만 있음.)

### (다) 권한/역할에 따른 분기

- **현재 매핑 관리 페이지에는 권한 체크가 없다.**  
  `REFUND_MANAGE`(PermissionManagement.js에 정의된 "환불 관리") 등으로 `onRefund` 전달 여부를 나누는 코드는 없음.
- 따라서 **역할에 따라 버튼을 숨기는 로직은 구현되어 있지 않다.**  
  정책상 도입했다면 (다)가 원인이 될 수 있음.

---

## 3. 기획 관점 정리

### 3.1 문서 검색 결과

- **MAPPING_MANAGEMENT_DESIGN_SPEC_V2.md**: 환불/취소 아이콘(XCircle), 상태별 CTA(결제확인·입금확인·환불 등) 언급. **"언제·누구에게 환불 버튼을 보여줄지"에 대한 명시적 정책 없음.**
- **MAPPING_MODALS_DESIGN_SPEC.md**: PartialRefundModal, 환불 버튼(danger) 스타일만 정의. 노출 조건·대상 역할 미기재.
- **PermissionManagement.js**: `REFUND_MANAGE` 권한 코드 존재. 매핑 관리 화면에서는 **미사용**.

### 3.2 현재 구현 기준 정리

- **버튼 노출**: 모든 매칭 행에 동일 노출 (권한/상태 무관).
- **실제 환불 가능 여부**: 클릭 시에만 검사  
  - `status === 'ACTIVE'`  
  - `remainingSessions > 0`  
  → 불만족 시 경고만 하고, 만족 시 PartialRefundModal 오픈.

### 3.3 제안 (문서화·정책)

- **문서가 없으므로**, 아래를 기획 문서에 명시하는 것을 제안한다.
  - **노출 대상**:  
    - 옵션 A: 매핑 관리 화면에 진입 가능한 모든 역할에게 동일 노출 (현재 구현).  
    - 옵션 B: `REFUND_MANAGE` 권한이 있는 역할에게만 노출.
  - **노출 조건 (행 단위)**:  
    - 옵션 A: 모든 행에 노출, 클릭 시에만 활성/남은 회기 검사 (현재 구현).  
    - 옵션 B: `status === 'ACTIVE'` 이고 `remainingSessions > 0` 인 행에만 노출.
- 기획 확정 후, 위 옵션에 맞춰 구현과 문서를 맞추는 것을 권장한다.

---

## 4. 조치 제안 (원인별 담당)

| 원인 | 담당 | 내용 |
|------|------|------|
| **(가) 조건 미충족** | 기획 → 코더 | 기획에서 "환불 버튼 노출 조건" 확정 (예: ACTIVE+남은 회기만, 또는 REFUND_MANAGE 권한만). 확정 후 코더가 `onRefund` 조건부 전달 또는 행별 조건 렌더 적용. |
| **(나) CSS/레이아웃** | 디자이너 → 퍼블/코더 | 액션 영역 가시성·우선순위 검토 (좁은 뷰포트, 긴 행, 테이블 "관리" 열 너비). 필요 시 core-designer가 레이아웃/반응형 스펙 제안 → 퍼블/코더가 액션 고정(스티키), overflow, 또는 버튼 그룹 정리 등 적용. |
| **(다) 권한/역할** | 기획 → 코더 | 환불 버튼을 "환불 관리" 권한 보유자에게만 보이도록 할지 기획 확정. 확정 시 코더가 `hasPermission('REFUND_MANAGE')` 등으로 `onRefund` 전달 여부 분기. |
| **정책 문서 부재** | 기획 | "매칭 관리 > 환불 버튼: 노출 대상(역할/권한), 노출 조건(행 단위)"를 `docs/design-system/` 또는 `docs/project-management/`에 문서화. 이후 구현과 일치 여부 주기적 점검. |

---

## 5. 참조한 파일

- `frontend/src/components/admin/mapping-management/pages/MappingManagementPage.js` — `onRefund={handleRefundMapping}`, `handleRefundMapping` 로직
- `frontend/src/components/admin/mapping-management/organisms/MappingListBlock.js` — viewMode, onRefund 전달
- `frontend/src/components/admin/mapping-management/organisms/MappingListRow.js` — 환불 버튼 렌더 조건
- `frontend/src/components/admin/mapping-management/organisms/MappingTableView.js` — 테이블 뷰 환불 버튼
- `frontend/src/components/admin/mapping-management/organisms/MappingListRow.css` — 행·액션 레이아웃
- `frontend/src/components/admin/mapping-management/organisms/MappingListBlock.css` — 그리드·카드
- `frontend/src/components/common/ActionButton.js` — 버튼 클래스 (`mg-v2-button`, `mg-v2-button--danger`, `mg-v2-button--small`)
- `docs/design-system/MAPPING_MANAGEMENT_DESIGN_SPEC_V2.md`
- `docs/design-system/MAPPING_MODALS_DESIGN_SPEC.md`
- `frontend/src/components/admin/PermissionManagement.js` — REFUND_MANAGE
