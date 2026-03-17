# 매칭 리스트 카드/테이블 뷰 Pill 토글 상태 원인 분석

**작성일**: 2025-02-12  
**대상**: `mg-v2-mapping-list-block__toggle` 내 "카드 뷰" / "테이블 뷰" pill 배지(활성 상태)

---

## 1. 현재 구현 요약

| 구분 | 위치 | 동작 |
|------|------|------|
| **뷰 모드 상태** | `MappingListBlock.js` | `const [viewMode, setViewMode] = useState('card')` — **기본값 'card'** |
| **옵션 순서** | 동일 | `MAPPING_VIEW_MODE_OPTIONS`: ① card(카드 뷰), ② table(테이블 뷰), ③ calendar(캘린더 뷰) |
| **활성 판단** | `ViewModeToggle.js` | `isActive = viewMode === opt.value` → 선택된 옵션에만 `mg-v2-ad-b0kla__pill--active` + `aria-pressed="true"` 적용 |
| **본문 렌더** | `MappingListBlock.js` `renderContent()` | `viewMode === 'table'` → 테이블, `viewMode === 'calendar'` → 캘린더, 그 외 → 카드 그리드 |

즉, **pill 활성 상태와 실제 보이는 콘텐츠는 같은 `viewMode` 한 개로 동기화**되어 있어, 코드 상으로는 “카드가 active인데 본문은 테이블”처럼 어긋날 여지는 없음.

---

## 2. “배지 상태가 틀리다”로 느껴질 수 있는 원인

### 2.1 기본값이 카드 뷰로 고정됨 (가장 유력)

- **현상**: 페이지에 들어오면 항상 **카드 뷰**가 선택된 상태로 시작함.
- **기대**: “매칭 리스트는 기본이 **테이블 뷰**”라면, 현재 구현은 기대와 다르게 **카드 뷰**가 active로 보임.
- **원인**: `useState('card')`로 초기값이 `'card'`로 고정되어 있음.
- **수정**: 기본값을 테이블로 바꾸려면 `useState('table')`로 변경.

### 2.2 상위에서 key 변경으로 블록 리마운트

- **현상**: 테이블 뷰로 바꾼 뒤 검색/필터 등을 하면 다시 **카드 뷰**가 active로 돌아옴.
- **원인**: 상위에서 `<MappingListBlock key={…} />`처럼 **key가 바뀌면** 컴포넌트가 리마운트되고, `viewMode`가 다시 `'card'`로 초기화됨.
- **현재**: `MappingManagementPage.js`에서는 `MappingListBlock`에 **key를 넘기지 않음** → 일반적인 네비게이션/필터만으로는 리마운트 가능성 낮음. 다만 이후에 `key={filteredMappings.length}` 등 동적으로 바뀌는 key를 넣으면 이 현상이 발생할 수 있음.
- **수정**: key를 넣지 않거나, 뷰 모드를 상위(state/URL)로 올려서 리마운트되어도 복원되게 함.

### 2.3 클릭해도 pill/본문이 안 바뀜

- **원인 후보**: `onClick`이 다른 요소에 가로채이거나, `setViewMode`가 호출되지 않는 경우.
- **현재 구현**: `ViewModeToggle`에서 `onClick={() => onViewModeChange(opt.value)}` → `MappingListBlock`의 `setViewMode` 호출. 별도 `preventDefault`/`stopPropagation` 없음. 다른 영역과 겹치는 클릭 타겟이 없다면 정상 동작하는 구조임.

### 2.4 시각만 어긋나 보이는 경우 (DOM/aria는 맞음)

- **현상**: DOM/`aria-pressed`는 “카드 뷰 = active”인데, 화면상으로는 “테이블 뷰가 active”처럼 보임(또는 그 반대).
- **원인**: `.mg-v2-ad-b0kla__pill--active`가 다른 선택자에 덮이거나, 특정 해상도/스타일에서 적용 대상이 달라지는 경우.
- **확인**: 개발자 도구에서 해당 버튼의 computed style과 `aria-pressed` 값을 보면, 코드와 일치하는지 확인 가능.

---

## 3. 결론 및 권장 수정

- **“기본이 테이블이어야 하는데 카드가 선택되어 있다”**가 문제라면 → **원인 2.1**.  
  **권장**: `MappingListBlock.js`에서 `useState('card')`를 `useState('table')`로 변경.
- **“테이블로 바꿨는데 검색/필터 후 다시 카드로 돌아온다”**라면 → **원인 2.2** 가능성.  
  상위에서 `MappingListBlock`에 **key**를 주지 않았는지 확인하고, 필요 시 viewMode를 페이지 레벨 state나 URL과 연동해 유지.
- 그 외에는 **2.3(이벤트)** / **2.4(CSS)** 순으로 확인하면 됨.

위 수정 후에도 pill과 본문이 어긋나면, **어느 동작 시점에서** (최초 로드 / 클릭 직후 / 필터·검색 후 등) 어긋나는지 알려주면 추가로 추적할 수 있음.
