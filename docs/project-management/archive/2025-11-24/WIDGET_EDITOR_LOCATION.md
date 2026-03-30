# 위젯 편집 화면 위치 및 구현 계획

**작성일**: 2025-11-24  
**목적**: 위젯 편집 화면이 어디에 속하는지 및 구현 방법 명확화

---

## 📍 화면 위치

### 코어 솔루션 테넌트 관리자 페이지

**경로**: `/admin/dashboards`  
**파일**: `frontend/src/components/admin/DashboardManagement.js`

**이유**:
- 테넌트 관리자가 자신의 대시보드를 편집하는 기능
- 온보딩이 아니라 운영 중인 테넌트의 대시보드 관리
- 코어 솔루션의 관리자 기능

---

## 🏗️ 현재 구조

### 1. 대시보드 관리 페이지
**파일**: `frontend/src/components/admin/DashboardManagement.js`
- 대시보드 목록 표시
- 대시보드 생성/수정/삭제 버튼
- 대시보드 활성화/비활성화

### 2. 대시보드 생성/수정 모달
**파일**: `frontend/src/components/admin/DashboardFormModal.js`
- 대시보드 기본 정보 입력
- **현재**: JSON 직접 입력 방식
- **개선 필요**: 위젯 시각적 편집 UI 추가

---

## 🎯 구현 계획

### Phase 1: DashboardFormModal에 위젯 편집기 통합

**위치**: `frontend/src/components/admin/DashboardFormModal.js`

**변경 사항**:
1. JSON 입력 방식과 시각적 편집 방식 탭 추가
2. 위젯 편집기 컴포넌트 통합
3. 위젯 편집 결과를 JSON으로 자동 변환

**구조**:
```
DashboardFormModal
├── 기본 정보 탭
│   ├── 대시보드 이름
│   ├── 역할 선택
│   └── 설명
└── 위젯 편집 탭 (신규)
    ├── 시각적 편집 모드
    │   ├── 위젯 목록 (사용 가능한 위젯)
    │   ├── 현재 위젯 목록
    │   └── 드래그 앤 드롭 레이아웃
    └── JSON 편집 모드 (기존)
```

---

## 📦 필요한 컴포넌트

### 1. DashboardWidgetEditor.js (신규)
**위치**: `frontend/src/components/admin/DashboardWidgetEditor.js`

**기능**:
- 위젯 목록 표시
- 위젯 추가/삭제
- 위젯 설정 모달 열기

### 2. DashboardLayoutEditor.js (신규)
**위치**: `frontend/src/components/admin/DashboardLayoutEditor.js`

**기능**:
- 드래그 앤 드롭 레이아웃 편집
- 위젯 위치 변경
- 위젯 미리보기

### 3. WidgetConfigModal.js (신규)
**위치**: `frontend/src/components/admin/WidgetConfigModal.js`

**기능**:
- 위젯 타입 선택
- 위젯 위치 설정 (row, col, span)
- 위젯별 설정 폼
- 표시 조건 설정

---

## 🔧 구현 방법

### 1. react-sortablejs 사용 (이미 설치됨)

```javascript
import { ReactSortable } from 'react-sortablejs';

const DashboardLayoutEditor = ({ widgets, onWidgetsChange }) => {
  return (
    <ReactSortable
      list={widgets}
      setList={onWidgetsChange}
      animation={200}
    >
      {widgets.map(widget => (
        <div key={widget.id}>
          {widget.type}
        </div>
      ))}
    </ReactSortable>
  );
};
```

### 2. DashboardFormModal 수정

```javascript
// DashboardFormModal.js에 추가
const [editMode, setEditMode] = useState('visual'); // 'visual' or 'json'

{editMode === 'visual' ? (
  <DashboardWidgetEditor
    widgets={parsedWidgets}
    onWidgetsChange={handleWidgetsChange}
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

## ✅ 확인 사항

1. **위치**: 코어 솔루션 테넌트 관리자 페이지 (`/admin/dashboards`) ✅
2. **라이브러리**: `react-sortablejs` 이미 설치됨 ✅
3. **구현**: DashboardFormModal에 위젯 편집기 통합 필요

---

## 📝 다음 단계

1. `DashboardWidgetEditor.js` 컴포넌트 생성
2. `DashboardLayoutEditor.js` 컴포넌트 생성 (react-sortablejs 사용)
3. `WidgetConfigModal.js` 컴포넌트 생성
4. `DashboardFormModal.js`에 통합
5. 테스트

---

**작성자**: 개발팀  
**위치**: 코어 솔루션 테넌트 관리자 페이지

