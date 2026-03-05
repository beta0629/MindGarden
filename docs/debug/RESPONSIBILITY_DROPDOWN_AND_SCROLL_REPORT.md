# 담당업무 드롭다운 미동작 및 스크롤 시 이동 문제 분석 보고서

**작성일**: 2025-03-05  
**담당**: core-debugger (원인 분석·수정 제안만, 코드 수정은 core-coder 위임)

---

## 1. 담당업무 드롭다운 사용 위치

| 항목 | 내용 |
|------|------|
| **화면** | 매칭 생성 모달 (MappingCreationModal) |
| **단계** | 4단계 결제 정보 |
| **파일** | `frontend/src/components/admin/MappingCreationModal.js` |
| **라인** | 643~652 (라벨 "담당 업무" + CustomSelect) |
| **컴포넌트** | **CustomSelect** (공통 컴포넌트) |
| **옵션 로드** | `getTenantCodes('RESPONSIBILITY')` → `loadCodeOptions()` (264~266라인) |
| **상태** | `paymentInfo.responsibility`, `responsibilityOptions` |

결제 방법 드롭다운(615~632라인)과 **동일한 모달(UnifiedModal) 내부**에서 **동일한 CustomSelect**를 사용합니다.

---

## 2. 동일 문제(z-index) 여부 — **동일 원인**

### 2.1 CSS vs JS z-index 불일치

- **CustomSelect.css** (75~76라인):  
  `.custom-select__dropdown` 에 **z-index: 10100 !important** 로 모달 위에 오도록 이미 수정되어 있음.
- **CustomSelect.js** (76라인):  
  `updatePosition()` 내부에서 **`dropdown.style.zIndex = '9999'`** 로 인라인 설정하여 **CSS 값을 덮어씀**.

프로젝트 z-index 체계(`frontend/src/styles/01-settings/_z-index.css` 등):

- `--z-modal`: 10000, `--z-modal-backdrop`: 10001, `--z-modal-content`: 10002 … `--z-modal-specialty`: 10050
- 모달 계열이 **10000~10050** 이므로, 드롭다운이 **9999** 이면 **모달 아래**에 그려짐 → 옵션 클릭이 모달 레이어에 가로채어져 "클릭이 안 됐던" 현상 발생.

**결론**: 담당업무 드롭다운도 결제 방법과 **같은 CustomSelect**를 쓰므로, **동일한 z-index 버그(JS에서 9999로 덮어쓰는 부분)** 때문에 클릭이 안 됐을 가능성이 높음.

---

## 3. 스크롤 시 드롭다운이 이동되는 문제

### 3.1 현재 구현 요약

- 드롭다운은 **ReactDOM.createPortal(..., document.body)** 로 body에 렌더링됨 (CustomSelect.js 201~237라인).
- 위치: **position: fixed** + **getBoundingClientRect()** 로 트리거 기준 계산 (69~91라인).
- 스크롤/리사이즈 시:  
  - **document** 에 `scroll` (capture: true)  
  - **window** 에 `resize`  
  - **getScrollParent(selectRef.current)** 로 찾은 스크롤 가능 조상에 **scroll** (capture: true)  
  → 모두 `requestAnimationFrame(updatePosition)` 호출 (98~107라인).

### 3.2 "스크롤 시 드롭다운이 이동된다"의 의미

- **의도한 동작**: 트리거(버튼) 위치가 바뀔 때마다 드롭다운이 **트리거 아래로 따라가도록** 위치를 갱신하는 것.
- **현재**: 스크롤 시 `updatePosition()` 이 호출되므로, **문서 스크롤** 및 **스크롤 부모가 올바르게 잡힌 경우**에는 드롭다운이 트리거에 맞춰 이동하는 것이 정상 동작입니다.

### 3.3 잠재 이슈 (모달 내부 스크롤)

- **getScrollParent** 는 **useEffect 실행 시점(isOpen === true)** 에 한 번만 `selectRef.current`로 계산됨 (105~107라인).
- 모달 **내부** 스크롤 컨테이너(예: `.mg-modal__body`)가 그 시점에 이미 렌더되어 있고 `overflow-y: auto` 등으로 스크롤 가능하면, 해당 요소가 scrollParent로 잡혀 리스너가 붙음 → **모달 내부 스크롤 시에도 위치 갱신됨**.
- 다만 모달이 열린 직후 DOM/레이아웃이 아직 안정화되지 않았거나, 스크롤 영역이 나중에 생기는 경우에는 scrollParent를 한 번만 찾는 현재 방식으로는 놓칠 수 있음.  
  → "스크롤 시 드롭다운이 **이상한 곳으로 움직이거나 사라진다**"면 **버그**이고, "트리거를 따라 **제자리로 이동한다**"면 **의도한 동작**으로 보면 됨.

**정리**:  
- 담당업무/결제 방법이 "안 됐던" 이유는 **스크롤 때문이 아니라 z-index(9999 vs 모달 10000~10050)** 가 주된 원인으로 판단됩니다.  
- 스크롤 시 이동은 **트리거 추적**이면 정상이며, 같은 CustomSelect를 쓰는 담당업무도 z-index만 맞추면 동일하게 해결됩니다.

---

## 4. 결과 정리 및 수정 제안

### 4.1 담당업무 드롭다운이 안 됐던 원인 판단

| 후보 | 판단 |
|------|------|
| **(1) z-index** | **해당함.** JS에서 9999로 설정해 모달 아래로 가서 클릭이 가로채어짐. |
| **(2) 스크롤 시 위치 미갱신** | 해당 없음. scrollParent + document scroll 리스너로 갱신하고 있음. 스크롤 시 "이동"은 트리거 추적 목적의 정상 동작. |
| **(3) 그 외** | 옵션은 getTenantCodes('RESPONSIBILITY')로 로드되며, 빈 배열이면 "옵션이 없습니다"로 표시됨. 이벤트 막힘은 z-index로 설명됨. |

### 4.2 수정 제안 (코드 위치 + 패치)

**파일**: `frontend/src/components/common/CustomSelect.js`  
**위치**: `updatePosition()` 함수 내부, 76라인 부근

**현재**:
```javascript
dropdown.style.zIndex = '9999';
```

**변경안 (택 1)**  
- **A**: CSS와 통일해 모달(최대 10050) 위에 오도록  
  `dropdown.style.zIndex = '10100';`  
- **B**: z-index를 JS에서 건드리지 않고 CSS에만 맡기기  
  해당 라인 **삭제** (CustomSelect.css의 `.custom-select__dropdown { z-index: 10100 !important; }` 가 적용됨).

권장: **B(라인 삭제)**. 단일 소스(CSS)로 z-index를 관리하는 편이 유지보수에 유리합니다.

### 4.3 core-coder에게 전달할 태스크 설명 (초안)

- **제목**: CustomSelect 드롭다운 z-index 인라인 덮어쓰기 제거
- **내용**:  
  - CustomSelect.js의 `updatePosition()` 안에서 `dropdown.style.zIndex = '9999'` 를 설정하고 있어, CSS의 `z-index: 10100` 이 무시되고 있음.  
  - 그 결과 모달(10000~10050) 아래에 드롭다운이 그려져, 결제 방법·담당업무 등 모달 내 CustomSelect에서 옵션 클릭이 안 되는 현상이 발생함.  
  - 해당 인라인 한 줄을 삭제하여 CSS(10100)만 적용되도록 수정해 주세요.

### 4.4 수정 후 체크리스트

- [ ] 매칭 생성 모달 4단계에서 **결제 방법** 드롭다운 열고 옵션 클릭 시 선택됨.
- [ ] 같은 단계에서 **담당 업무** 드롭다운 열고 옵션 클릭 시 선택됨.
- [ ] 모달 내부를 스크롤한 뒤 드롭다운을 열었을 때, 드롭다운이 트리거 버튼 아래에 맞춰 표시됨(스크롤 후에도 위치 갱신 확인).

---

**요약**: 담당업무 드롭다운은 결제 방법과 같은 CustomSelect를 쓰며, **z-index를 JS에서 9999로 덮어쓰는 동일 문제**로 클릭이 안 됐을 가능성이 높습니다. 스크롤 시 드롭다운이 이동하는 것은 트리거 추적을 위한 **의도된 동작**입니다. **CustomSelect.js에서 `dropdown.style.zIndex = '9999'` 한 줄을 제거**하면 두 드롭다운 모두 동일하게 해결됩니다.
