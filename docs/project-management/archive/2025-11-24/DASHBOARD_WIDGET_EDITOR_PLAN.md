# 대시보드 위젯 편집 UI 개발 계획

**작성일**: 2025-11-24  
**목적**: 관리자가 시각적으로 대시보드 위젯을 편집할 수 있는 UI 개발

---

## 📋 현재 문제점

### 현재 상태
- `DashboardFormModal.js`에서 JSON을 직접 입력하는 방식
- 관리자가 위젯을 시각적으로 편집할 수 없음
- 드래그 앤 드롭 기능 없음 (계획만 있음, 구현 안 됨)
- 위젯 추가/삭제/배치가 어려움

### 설치된 라이브러리
- ✅ `react-sortablejs` (v6.1.4) - 이미 설치됨
- ✅ `sortablejs` (v1.15.6) - 이미 설치됨
- ❌ `react-grid-layout` - 미설치 (필요 시 설치)

### 화면 위치
- **위치**: 코어 솔루션 테넌트 관리자 페이지
- **경로**: `/admin/dashboards`
- **파일**: `frontend/src/components/admin/DashboardManagement.js`
- **모달**: `frontend/src/components/admin/DashboardFormModal.js`

### 문제점
1. **사용성 저하**: JSON 직접 입력은 기술적 지식 필요
2. **오류 발생 가능성**: JSON 형식 오류로 인한 저장 실패
3. **시각적 피드백 부족**: 위젯 배치를 미리 볼 수 없음
4. **생산성 저하**: 대시보드 생성/수정이 비효율적

---

## 🎯 목표

### 핵심 목표
1. **시각적 위젯 편집**: 관리자가 마우스로 위젯 추가/삭제/배치
2. **드래그 앤 드롭**: 위젯을 드래그하여 위치 변경
3. **실시간 미리보기**: 위젯 배치를 실시간으로 확인
4. **위젯 설정 UI**: 각 위젯의 설정을 폼으로 입력

### 부가 목표
1. **위젯 크기 조절**: 위젯 크기 조절 기능 (선택적)
2. **템플릿 기능**: 기본 대시보드 템플릿 제공 (선택적)
3. **반응형 미리보기**: 다양한 화면 크기에서 미리보기 (선택적)

---

## 🏗️ 구현 계획

### Phase 1: 기본 위젯 편집 UI (1-2일)

#### 1.1 위젯 편집기 컴포넌트 생성
**파일**: `frontend/src/components/admin/DashboardWidgetEditor.js`

**기능**:
- 위젯 목록 표시 (사용 가능한 위젯 타입)
- 위젯 추가 버튼
- 위젯 목록 표시 (현재 추가된 위젯)
- 위젯 삭제 버튼
- 위젯 설정 버튼

**UI 구조**:
```
┌─────────────────────────────────────┐
│  대시보드 위젯 편집                    │
├─────────────────────────────────────┤
│  [사용 가능한 위젯]                   │
│  ┌─────┐ ┌─────┐ ┌─────┐          │
│  │통계 │ │차트 │ │일정 │ ...       │
│  └─────┘ └─────┘ └─────┘          │
├─────────────────────────────────────┤
│  [현재 위젯 목록]                     │
│  1. 환영 위젯        [설정] [삭제]   │
│  2. 통계 위젯        [설정] [삭제]   │
│  3. 일정 위젯        [설정] [삭제]   │
└─────────────────────────────────────┘
```

#### 1.2 위젯 설정 모달
**파일**: `frontend/src/components/admin/WidgetConfigModal.js`

**기능**:
- 위젯 타입 선택
- 위젯 위치 설정 (row, col, span)
- 위젯별 설정 폼 (config 필드)
- 표시 조건 설정 (visibility)

**설정 폼 예시**:
```javascript
{
  type: 'welcome',
  position: { row: 0, col: 0, span: 3 },
  config: {
    title: '환영합니다',
    showDate: true
  },
  visibility: {
    roles: ['ADMIN']
  }
}
```

#### 1.3 DashboardFormModal 통합
- `DashboardFormModal.js`에 위젯 편집기 탭 추가
- JSON 직접 입력 방식과 시각적 편집 방식 선택 가능
- 위젯 편집 결과를 JSON으로 자동 변환
- JSON 검증 및 오류 표시

---

### Phase 2: 드래그 앤 드롭 레이아웃 편집기 (2-3일)

#### 2.1 라이브러리 선택
**옵션 1**: `react-sortablejs` (이미 설치됨) ✅
- 장점: 이미 설치되어 있음, 간단한 구현
- 단점: 그리드 레이아웃에 제한적, 리사이즈 기능 없음

**옵션 2**: `react-grid-layout` (추가 설치 필요)
- 장점: 그리드 레이아웃에 최적화, 리사이즈 기능 포함
- 단점: 추가 설치 필요

**옵션 3**: `react-dnd` (react-dnd-html5-backend)
- 장점: 유연한 드래그 앤 드롭, 다양한 레이아웃 지원
- 단점: 구현 복잡도 높음, 추가 설치 필요

**권장**: `react-sortablejs` (이미 설치되어 있으므로 우선 사용)
- 기본 드래그 앤 드롭: `react-sortablejs` 사용
- 고급 기능 필요 시: `react-grid-layout` 추가 설치

#### 2.2 드래그 앤 드롭 구현
**파일**: `frontend/src/components/admin/DashboardLayoutEditor.js`

**기능**:
- 위젯 드래그 앤 드롭
- 위젯 위치 자동 저장 (position 정보)
- 위젯 크기 조절 (선택적)
- 그리드 레이아웃 시각화

**UI 구조**:
```
┌─────────────────────────────────────┐
│  레이아웃 편집 (드래그 앤 드롭)        │
├─────────────────────────────────────┤
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ │
│  │ 환영    │ │ 통계    │ │ 일정    │ │
│  │ 위젯    │ │ 위젯    │ │ 위젯    │ │
│  └─────────┘ └─────────┘ └─────────┘ │
│  ┌─────────┐ ┌─────────┐            │
│  │ 활동    │ │ 알림    │            │
│  │ 목록    │ │ 위젯    │            │
│  └─────────┘ └─────────┘            │
├─────────────────────────────────────┤
│  [위젯 추가] [저장] [취소]            │
└─────────────────────────────────────┘
```

#### 2.3 실시간 미리보기
- 위젯 배치 변경 시 즉시 반영
- 실제 대시보드와 동일한 스타일로 표시
- 반응형 레이아웃 미리보기 (선택적)

---

### Phase 3: 고급 기능 (선택적, 1-2일)

#### 3.1 위젯 템플릿
- 역할별 기본 위젯 템플릿 제공
- 템플릿에서 위젯 일괄 추가
- 커스텀 템플릿 저장/불러오기

#### 3.2 위젯 복사/붙여넣기
- 위젯 복사 기능
- 위젯 붙여넣기 기능
- 여러 위젯 일괄 복사

#### 3.3 위젯 미리보기 모드
- 실제 대시보드와 동일한 스타일
- 반응형 미리보기 (모바일, 태블릿, 데스크톱)
- 위젯 데이터 미리보기

---

## 📦 필요한 라이브러리

### 이미 설치됨 ✅
```json
{
  "react-sortablejs": "^6.1.4",
  "sortablejs": "^1.15.6"
}
```

### 추가 설치 필요 (고급 기능)
```json
{
  "react-grid-layout": "^1.4.4"
}
```

### 선택적
```json
{
  "react-dnd": "^16.0.1",
  "react-dnd-html5-backend": "^16.0.1"
}
```

---

## 🔧 구현 상세

### 1. 위젯 편집기 컴포넌트 구조

```javascript
// DashboardWidgetEditor.js
import React, { useState } from 'react';
import { getSupportedWidgetTypes } from '../../dashboard/widgets/WidgetRegistry';

const DashboardWidgetEditor = ({ 
  widgets = [], 
  onWidgetsChange,
  businessType = null 
}) => {
  const [selectedWidget, setSelectedWidget] = useState(null);
  const availableWidgets = getSupportedWidgetTypes(businessType);
  
  const handleAddWidget = (widgetType) => {
    const newWidget = {
      id: `widget-${Date.now()}`,
      type: widgetType,
      position: { row: 0, col: 0, span: 1 },
      config: {}
    };
    onWidgetsChange([...widgets, newWidget]);
  };
  
  const handleDeleteWidget = (widgetId) => {
    onWidgetsChange(widgets.filter(w => w.id !== widgetId));
  };
  
  const handleUpdateWidget = (widgetId, updates) => {
    onWidgetsChange(widgets.map(w => 
      w.id === widgetId ? { ...w, ...updates } : w
    ));
  };
  
  return (
    <div className="dashboard-widget-editor">
      {/* 위젯 목록 */}
      <div className="available-widgets">
        <h3>사용 가능한 위젯</h3>
        {availableWidgets.map(type => (
          <button 
            key={type}
            onClick={() => handleAddWidget(type)}
          >
            {type}
          </button>
        ))}
      </div>
      
      {/* 현재 위젯 목록 */}
      <div className="current-widgets">
        <h3>현재 위젯</h3>
        {widgets.map(widget => (
          <div key={widget.id} className="widget-item">
            <span>{widget.type}</span>
            <button onClick={() => setSelectedWidget(widget)}>설정</button>
            <button onClick={() => handleDeleteWidget(widget.id)}>삭제</button>
          </div>
        ))}
      </div>
      
      {/* 위젯 설정 모달 */}
      {selectedWidget && (
        <WidgetConfigModal
          widget={selectedWidget}
          onSave={(updates) => {
            handleUpdateWidget(selectedWidget.id, updates);
            setSelectedWidget(null);
          }}
          onClose={() => setSelectedWidget(null)}
        />
      )}
    </div>
  );
};
```

### 2. 드래그 앤 드롭 레이아웃 편집기 (react-sortablejs 사용)

```javascript
// DashboardLayoutEditor.js
import React, { useState, useRef, useEffect } from 'react';
import { ReactSortable } from 'react-sortablejs';

const DashboardLayoutEditor = ({ widgets, onWidgetsChange }) => {
  const [widgetList, setWidgetList] = useState(widgets);
  
  useEffect(() => {
    setWidgetList(widgets);
  }, [widgets]);
  
  const handleSort = (newList) => {
    // 순서 변경 시 position 업데이트
    const updatedWidgets = newList.map((widget, index) => {
      const row = Math.floor(index / 3);
      const col = index % 3;
      return {
        ...widget,
        position: {
          row,
          col,
          span: widget.position?.span || 1
        }
      };
    });
    setWidgetList(updatedWidgets);
    onWidgetsChange(updatedWidgets);
  };
  
  return (
    <div className="dashboard-layout-editor">
      <div className="layout-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
        <ReactSortable
          list={widgetList}
          setList={handleSort}
          animation={200}
          ghostClass="widget-ghost"
          chosenClass="widget-chosen"
          dragClass="widget-drag"
        >
          {widgetList.map(widget => (
            <div 
              key={widget.id} 
              className="widget-preview-item"
              style={{ 
                gridColumn: `span ${widget.position?.span || 1}`,
                minHeight: '100px'
              }}
            >
              <div className="widget-preview-header">
                <span>{widget.type}</span>
                <button onClick={() => handleDeleteWidget(widget.id)}>삭제</button>
              </div>
              <div className="widget-preview-content">
                {/* 위젯 미리보기 */}
              </div>
            </div>
          ))}
        </ReactSortable>
      </div>
    </div>
  );
};
```

---

## 📝 통합 방법

### DashboardFormModal 수정

```javascript
// DashboardFormModal.js에 추가
const [editMode, setEditMode] = useState('visual'); // 'visual' or 'json'

// 위젯 편집 모드 선택
<div className="edit-mode-selector">
  <button 
    onClick={() => setEditMode('visual')}
    className={editMode === 'visual' ? 'active' : ''}
  >
    시각적 편집
  </button>
  <button 
    onClick={() => setEditMode('json')}
    className={editMode === 'json' ? 'active' : ''}
  >
    JSON 편집
  </button>
</div>

{editMode === 'visual' ? (
  <DashboardWidgetEditor
    widgets={parsedWidgets}
    onWidgetsChange={(widgets) => {
      const newConfig = {
        ...parsedConfig,
        widgets
      };
      setFormData({
        ...formData,
        dashboardConfig: JSON.stringify(newConfig, null, 2)
      });
    }}
    businessType={businessType}
  />
) : (
  <textarea
    value={formData.dashboardConfig}
    onChange={(e) => handleChange('dashboardConfig', e.target.value)}
  />
)}
```

---

## 🎯 우선순위

### P0 (필수, MVP)
1. ✅ 기본 위젯 편집 UI (위젯 추가/삭제/설정)
2. ✅ 위젯 설정 모달
3. ✅ DashboardFormModal 통합

### P1 (중요, 사용성 향상)
1. ⏳ 드래그 앤 드롭 레이아웃 편집기
2. ⏳ 실시간 미리보기

### P2 (선택적, 고급 기능)
1. ⏳ 위젯 템플릿
2. ⏳ 위젯 복사/붙여넣기
3. ⏳ 반응형 미리보기

---

## 📚 참고 자료

- [위젯 설정 가이드](./WIDGET_CONFIGURATION_GUIDE.md)
- [대시보드 설정 JSON 스키마](../2025-11-22/META_SYSTEM_DASHBOARD_SCHEMA.md)
- [위젯 아키텍처](../2025-11-22/WIDGET_ARCHITECTURE.md)
- [react-grid-layout 문서](https://github.com/react-grid-layout/react-grid-layout)

---

**작성자**: 개발팀  
**예상 완료일**: 2025-11-26 (기본 UI), 2025-11-30 (드래그 앤 드롭 포함)

