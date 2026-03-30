# 위젯 목록에서 드래그하여 추가 기능

**작성일**: 2025-11-24  
**목적**: 사용 가능한 위젯 목록에서 드래그하여 레이아웃 영역으로 드롭하면 위젯이 추가되는 기능

---

## 📋 현재 상태

### 현재 동작 방식

1. **위젯 추가**: "사용 가능한 위젯" 목록에서 **버튼 클릭**으로 추가
2. **위젯 위치 변경**: 추가된 위젯을 **드래그 앤 드롭**으로 위치 변경

### 목표 동작 방식

1. **위젯 추가**: "사용 가능한 위젯" 목록에서 **드래그**하여 레이아웃 영역으로 **드롭**하면 추가
2. **위젯 위치 변경**: 추가된 위젯을 **드래그 앤 드롭**으로 위치 변경

---

## 🔧 구현 방법

### SortableJS Group 옵션 사용

`react-sortablejs`의 `group` 옵션을 사용하여 두 영역 간 드래그 앤 드롭을 연결합니다.

**필요한 변경사항**:

1. **DashboardWidgetEditor.js**:
   - "사용 가능한 위젯" 목록을 `ReactSortable`로 감싸기
   - `group` 옵션 설정 (예: `group: { name: 'widgets', pull: 'clone', put: false }`)
   - `clone` 옵션으로 원본은 유지하고 복사본만 드롭

2. **DashboardLayoutEditor.js**:
   - 레이아웃 영역의 `ReactSortable`에 같은 `group` 이름 설정
   - `group: { name: 'widgets', pull: true, put: true }`
   - 드롭된 위젯을 처리하는 로직 추가

---

## 📝 구현 계획

### 1. DashboardWidgetEditor 수정

```javascript
import { ReactSortable } from 'react-sortablejs';

// 사용 가능한 위젯 목록을 드래그 가능하게
<ReactSortable
  list={availableWidgetTypes.map(type => ({ type, id: type }))}
  setList={() => {}} // 원본은 변경하지 않음
  group={{
    name: 'widgets',
    pull: 'clone', // 복사본만 드래그
    put: false // 여기로 드롭 불가
  }}
  sort={false} // 정렬 불가
  clone={(item) => ({
    type: item.type,
    id: `widget-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  })}
>
  {availableWidgetTypes.map(widgetType => (
    <div key={widgetType} className="available-widget-item" draggable>
      {/* 위젯 아이템 */}
    </div>
  ))}
</ReactSortable>
```

### 2. DashboardLayoutEditor 수정

```javascript
<ReactSortable
  list={widgetList}
  setList={handleSort}
  group={{
    name: 'widgets',
    pull: true, // 드래그 가능
    put: true // 드롭 가능
  }}
  onAdd={(evt) => {
    // 새로운 위젯이 드롭되었을 때
    const newWidget = {
      id: evt.item.dataset.widgetId || `widget-${Date.now()}`,
      type: evt.item.dataset.widgetType,
      position: calculatePosition(evt.newIndex),
      config: {},
      visibility: { roles: [], conditions: [] }
    };
    handleWidgetAdd(newWidget);
  }}
>
  {/* 기존 위젯들 */}
</ReactSortable>
```

---

## ✅ 구현 완료 후

- ✅ 사용 가능한 위젯 목록에서 드래그 가능
- ✅ 레이아웃 영역으로 드롭하면 위젯 추가
- ✅ 기존 위젯 드래그 앤 드롭으로 위치 변경 유지
- ✅ 버튼 클릭으로 추가하는 기능도 유지 (선택적)

---

**상태**: 계획 단계  
**우선순위**: 중간 (현재 버튼 클릭 방식도 작동함)

