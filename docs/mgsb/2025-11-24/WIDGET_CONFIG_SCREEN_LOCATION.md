# 위젯 설정 화면 위치 가이드

**작성일**: 2025-11-24  
**목적**: 위젯 설정 화면 접근 방법 안내

---

## 📍 위젯 설정 화면 위치

### 접근 경로

```
1. 로그인
   ↓
2. 대시보드 관리 페이지 접속
   URL: https://dev.core-solution.co.kr/admin/dashboards
   ↓
3. 대시보드 생성 또는 수정
   "대시보드 생성" 버튼 클릭 또는 기존 대시보드 "수정" 버튼
   ↓
4. 위젯 편집 탭 선택
   DashboardFormModal에서 "위젯 편집" 탭 클릭
   ↓
5. 위젯 설정 버튼 클릭
   현재 위젯 목록에서 "설정" 버튼 (⚙️ 아이콘) 클릭
   ↓
6. 위젯 설정 모달 열림
   WidgetConfigModal 표시
```

---

## 🎨 위젯 설정 화면 구성

### 1. WidgetConfigModal 컴포넌트

**파일**: `frontend/src/components/admin/WidgetConfigModal.js`

**위치**: 대시보드 생성/수정 모달 내부

**접근 방법**:
1. `/admin/dashboards` 접속
2. "대시보드 생성" 또는 "수정" 버튼 클릭
3. "위젯 편집" 탭 선택
4. 현재 위젯 목록에서 "설정" 버튼 클릭

---

### 2. 설정 가능한 항목

#### 위젯 타입
- 읽기 전용 (변경 불가)
- 위젯 생성 시 결정됨

#### 위치 설정 (Position)
- **행 (Row)**: 0부터 시작
- **열 (Col)**: 0부터 시작
- **Span**: 1-12 (그리드에서 차지할 칸 수)

#### 위젯 설정 (Config)
- 위젯별 고유 설정
- JSON 형식으로 입력
- 예: `{ "title": "환영합니다", "showDate": true }`

#### 표시 조건 (Visibility)
- **역할 (Roles)**: 위젯을 표시할 역할 목록
- **조건 (Conditions)**: 향후 구현 예정

---

## 🔧 위젯 설정 화면 사용 방법

### Step 1: 대시보드 관리 페이지 접속

```
URL: https://dev.core-solution.co.kr/admin/dashboards
```

### Step 2: 대시보드 생성 또는 수정

1. **새 대시보드 생성**:
   - "대시보드 생성" 버튼 클릭
   - 기본 정보 입력 (이름, 역할, 타입 등)

2. **기존 대시보드 수정**:
   - 대시보드 목록에서 수정할 대시보드 선택
   - "수정" 버튼 클릭

### Step 3: 위젯 편집 탭 선택

1. `DashboardFormModal` 모달이 열림
2. "위젯 편집" 탭 클릭
3. `DashboardWidgetEditor` 컴포넌트 표시

### Step 4: 위젯 설정 열기

1. **현재 위젯 목록** 섹션에서 위젯 선택
2. "설정" 버튼 (⚙️ 아이콘) 클릭
3. `WidgetConfigModal` 모달이 열림

### Step 5: 위젯 설정 변경

1. **위치 설정**:
   - 행, 열, Span 값 입력
   - 그리드 레이아웃에서 위젯 위치 조정

2. **위젯 설정 (JSON)**:
   - 위젯별 고유 설정을 JSON 형식으로 입력
   - 예: `{ "title": "환영합니다", "showDate": true }`

3. **표시 조건**:
   - 역할 목록 입력 (쉼표로 구분)
   - 예: `ADMIN, BRANCH_SUPER_ADMIN`

### Step 6: 설정 저장

1. "저장" 버튼 클릭
2. 위젯 설정이 업데이트됨
3. 모달이 닫힘

---

## 📂 관련 파일

### 프론트엔드 컴포넌트

1. **WidgetConfigModal.js**
   - 위치: `frontend/src/components/admin/WidgetConfigModal.js`
   - 기능: 위젯 설정 모달

2. **DashboardFormModal.js**
   - 위치: `frontend/src/components/admin/DashboardFormModal.js`
   - 기능: 대시보드 생성/수정 모달 (위젯 편집기 포함)

3. **DashboardWidgetEditor.js**
   - 위치: `frontend/src/components/admin/DashboardWidgetEditor.js`
   - 기능: 위젯 추가/삭제/설정 버튼

4. **DashboardLayoutEditor.js**
   - 위치: `frontend/src/components/admin/DashboardLayoutEditor.js`
   - 기능: 드래그 앤 드롭 레이아웃 편집

---

## 🎯 위젯 설정 예시

### 예시 1: 환영 위젯 설정

```json
{
  "type": "welcome",
  "position": {
    "row": 0,
    "col": 0,
    "span": 3
  },
  "config": {
    "title": "환영합니다",
    "showDate": true,
    "showTime": true
  },
  "visibility": {
    "roles": ["ADMIN", "BRANCH_SUPER_ADMIN"]
  }
}
```

### 예시 2: 통계 위젯 설정

```json
{
  "type": "summary-statistics",
  "position": {
    "row": 1,
    "col": 0,
    "span": 2
  },
  "config": {
    "title": "통계 요약",
    "showChart": true,
    "period": "month"
  },
  "visibility": {
    "roles": ["ADMIN"]
  }
}
```

### 예시 3: 활동 목록 위젯 설정

```json
{
  "type": "activity-list",
  "position": {
    "row": 1,
    "col": 2,
    "span": 1
  },
  "config": {
    "title": "최근 활동",
    "maxItems": 10,
    "showTimestamp": true
  },
  "visibility": {
    "roles": []
  }
}
```

---

## 🔍 문제 해결

### 문제 1: 위젯 설정 버튼이 보이지 않음

**원인**:
- 위젯이 추가되지 않음
- 위젯 편집 탭이 선택되지 않음

**해결**:
1. "위젯 편집" 탭이 선택되어 있는지 확인
2. 위젯이 추가되어 있는지 확인
3. "사용 가능한 위젯" 섹션에서 위젯 추가

### 문제 2: 위젯 설정 모달이 열리지 않음

**원인**:
- JavaScript 오류
- 모달 컴포넌트 로드 실패

**해결**:
1. 브라우저 콘솔에서 오류 확인
2. 페이지 새로고침
3. 브라우저 캐시 삭제

### 문제 3: 설정이 저장되지 않음

**원인**:
- JSON 형식 오류
- 필수 필드 누락

**해결**:
1. JSON 형식 확인 (유효성 검사)
2. 필수 필드 입력 확인
3. 브라우저 콘솔에서 오류 확인

---

## 📝 체크리스트

- [ ] 대시보드 관리 페이지 접속 성공
- [ ] 대시보드 생성/수정 모달 열림
- [ ] 위젯 편집 탭 선택 가능
- [ ] 위젯 추가 가능
- [ ] 위젯 설정 버튼 표시됨
- [ ] 위젯 설정 모달 열림
- [ ] 위치 설정 변경 가능
- [ ] 위젯 설정 (JSON) 입력 가능
- [ ] 표시 조건 설정 가능
- [ ] 설정 저장 성공

---

## 🚀 빠른 접근

**직접 URL**:
```
https://dev.core-solution.co.kr/admin/dashboards
```

**테스트 계정**:
- 이메일: `test-academy-1763988263@example.com`
- 비밀번호: `Test1234!@#`

---

**최종 업데이트**: 2025-11-24

