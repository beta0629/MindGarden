# 대시보드 위젯 드래그 앤 드롭 기능 현황

**작성일**: 2025-11-24  
**목적**: 대시보드 생성과 위젯 드래그 앤 드롭 기능의 관계 명확화

---

## ❓ 질문

**"대시보드를 생성해야 위젯 드래그 앤 드롭 기능이 생기는거야?"**

---

## 📋 현재 상태

### ✅ 구현된 부분

1. **컴포넌트 생성 완료**:
   - ✅ `DashboardLayoutEditor.js` - 드래그 앤 드롭 레이아웃 편집기
   - ✅ `DashboardWidgetEditor.js` - 위젯 편집기
   - ✅ `WidgetConfigModal.js` - 위젯 설정 모달

2. **라이브러리 설치 완료**:
   - ✅ `react-sortablejs` (v6.1.4)
   - ✅ `sortablejs` (v1.15.6)

3. **코드 통합**:
   - ✅ `DashboardFormModal.js`에 컴포넌트 import 완료
   - ✅ `editMode` 상태 변수 존재 (`'visual'` 또는 `'json'`)

### ❌ 미구현 부분

1. **UI 통합 미완료**:
   - ❌ `DashboardFormModal.js`에서 `editMode`에 따른 조건부 렌더링 없음
   - ❌ 현재는 JSON textarea만 표시됨
   - ❌ 시각적 편집기(드래그 앤 드롭)가 UI에 표시되지 않음

2. **편집 모드 전환 기능 없음**:
   - ❌ "시각적 편집" / "JSON 편집" 탭 또는 버튼 없음
   - ❌ 사용자가 편집 모드를 선택할 수 없음

---

## 🔍 현재 동작 방식

### 대시보드 생성 시

1. **"대시보드 생성" 버튼 클릭** → `DashboardFormModal` 열림
2. **기본 정보 입력**:
   - 역할 선택
   - 대시보드 이름
   - 대시보드 타입
   - 설명
3. **위젯 설정**:
   - ❌ **현재**: JSON textarea에 직접 입력
   - ✅ **계획**: 시각적 편집기(드래그 앤 드롭) 사용

### 대시보드 수정 시

1. **"수정" 버튼 클릭** → `DashboardFormModal` 열림 (기존 데이터 로드)
2. **기본 정보 수정**
3. **위젯 설정 수정**:
   - ❌ **현재**: JSON textarea에서 직접 수정
   - ✅ **계획**: 시각적 편집기(드래그 앤 드롭) 사용

---

## ✅ 답변

### 질문: "대시보드를 생성해야 위젯 드래그 앤 드롭 기능이 생기는거야?"

**답변**: 

**아니요. 대시보드를 생성할 때도 위젯 드래그 앤 드롭 기능을 사용할 수 있어야 합니다.**

하지만 **현재는 아직 UI에 통합되지 않아서** JSON으로 직접 입력해야 합니다.

---

## 🎯 올바른 동작 방식 (목표)

### 대시보드 생성 시

1. **"대시보드 생성" 버튼 클릭**
2. **기본 정보 입력**
3. **위젯 편집 탭**:
   - **시각적 편집 모드** (기본):
     - 위젯 목록에서 위젯 추가
     - 드래그 앤 드롭으로 위치 변경
     - 위젯 설정 모달로 상세 설정
   - **JSON 편집 모드** (고급):
     - JSON 직접 입력 (현재 방식)
4. **"생성" 버튼 클릭** → 대시보드 생성

### 대시보드 수정 시

1. **"수정" 버튼 클릭**
2. **기존 위젯 로드** (이미 존재하는 대시보드)
3. **위젯 편집**:
   - 시각적 편집기에서 위젯 추가/삭제/이동
   - 또는 JSON 직접 수정
4. **"수정" 버튼 클릭** → 대시보드 업데이트

---

## 🔧 필요한 작업

### 1. DashboardFormModal.js 수정

**현재 코드**:
```javascript
// editMode 상태는 있지만 사용되지 않음
const [editMode, setEditMode] = useState('visual'); // 'visual' or 'json'

// JSON textarea만 표시됨
<textarea
  value={formData.dashboardConfig}
  onChange={(e) => handleChange('dashboardConfig', e.target.value)}
/>
```

**수정 필요**:
```javascript
// 편집 모드 전환 버튼 추가
<div className="edit-mode-tabs">
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

// 조건부 렌더링
{editMode === 'visual' ? (
  <DashboardWidgetEditor
    widgets={parsedConfig?.widgets || []}
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

## 📝 결론

### 현재 상태

- ❌ **대시보드를 생성해야 위젯을 편집할 수 있음** (JSON 입력만 가능)
- ❌ **드래그 앤 드롭 기능이 UI에 표시되지 않음**
- ✅ **드래그 앤 드롭 컴포넌트는 이미 구현되어 있음**

### 목표 상태

- ✅ **대시보드 생성 시에도 위젯 드래그 앤 드롭 사용 가능**
- ✅ **대시보드 수정 시에도 위젯 드래그 앤 드롭 사용 가능**
- ✅ **시각적 편집 모드와 JSON 편집 모드 선택 가능**

---

## 🚀 다음 단계

1. **DashboardFormModal.js에 편집 모드 전환 UI 추가**
2. **시각적 편집기 조건부 렌더링 구현**
3. **위젯 편집 결과를 JSON으로 자동 변환**
4. **테스트**: 대시보드 생성/수정 시 드래그 앤 드롭 동작 확인

---

**최종 업데이트**: 2025-11-24

