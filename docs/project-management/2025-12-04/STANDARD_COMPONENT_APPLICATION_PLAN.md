# 표준 컴포넌트 적용 계획

**작성일**: 2025-12-04  
**작업**: Priority 4.2 - 표준 컴포넌트 사용  
**상태**: 진행 중

---

## 📋 개요

모든 컴포넌트를 표준 컴포넌트로 전환하여 UI 일관성과 사용자 경험을 향상시킵니다.

### 참조 문서
- [버튼 디자인 표준](../../standards/BUTTON_DESIGN_STANDARD.md)
- [API 연동 표준](../../standards/API_INTEGRATION_STANDARD.md)
- [프론트엔드 개발 표준](../../standards/FRONTEND_DEVELOPMENT_STANDARD.md)

---

## 🎯 목표

1. **버튼 표준화**
   - 비표준 버튼 → 표준 `Button` 컴포넌트 전환
   - 2중 클릭 방지 적용 (`preventDoubleClick={true}`)
   - API 연동 시 로딩 상태 표시

2. **알림 표준화**
   - 비표준 알림 → `NotificationManager` 사용
   - 일관된 알림 UI

---

## 📊 현재 상태 분석

### 비표준 버튼 사용 파일 (20개)

#### 우선순위 높음 (관리자 페이지)
1. `AdminDashboard.js` - 관리자 대시보드
2. `ClientComprehensiveManagement.js` - 내담자 종합관리
3. `ConsultantComprehensiveManagement.js` - 상담사 종합관리
4. `MappingManagement.js` - 매칭 관리
5. `CommonCodeManagement.js` - 공통코드 관리
6. `DashboardFormModal.js` - 대시보드 폼 모달

#### 우선순위 중간 (기타 페이지)
7. `ErdManagement.js` - ERD 관리
8. `ConsultationHistory.js` - 상담 내역
9. `WidgetConfigModal.js` - 위젯 설정 모달
10. `ConfirmModal.js` - 확인 모달

#### 우선순위 낮음 (특수 컴포넌트)
11. `MGHeader.js` - 헤더
12. `WelcomeWidget.js` - 환영 위젯
13. 기타 위젯 및 UI 컴포넌트

---

## 🗓️ 작업 계획

### Day 1: 관리자 페이지 버튼 표준화 (우선순위 높음)
- `AdminDashboard.js`
- `ClientComprehensiveManagement.js`
- `ConsultantComprehensiveManagement.js`
- `MappingManagement.js`
- `CommonCodeManagement.js`
- `DashboardFormModal.js`

### Day 2: 기타 페이지 버튼 표준화
- `ErdManagement.js`
- `ConsultationHistory.js`
- `WidgetConfigModal.js`
- `ConfirmModal.js`

### Day 3: 특수 컴포넌트 버튼 표준화
- `MGHeader.js`
- `WelcomeWidget.js`
- 기타 위젯 컴포넌트

### Day 4: 알림 표준화
- 비표준 알림 검색
- `NotificationManager` 사용으로 전환

### Day 5: 검증 및 테스트
- 전체 시스템 테스트
- 2중 클릭 방지 확인
- 로딩 상태 확인

---

## ✅ 체크리스트

### 버튼 표준화
- [ ] 비표준 버튼 검색 완료
- [ ] 표준 `Button` 컴포넌트 import 추가
- [ ] 네이티브 `<button>` → `<Button>` 전환
- [ ] `preventDoubleClick={true}` 적용
- [ ] API 연동 시 `loading` prop 추가
- [ ] variant 및 size 표준화

### 알림 표준화
- [ ] 비표준 알림 검색
- [ ] `NotificationManager` 사용으로 전환
- [ ] 일관된 알림 UI 확인

---

## 📈 예상 결과

- 표준 버튼 사용률: 0% → 100%
- 2중 클릭 방지 적용률: 0% → 100%
- 알림 표준화: 0% → 100%

---

**작성자**: CoreSolution  
**검토자**: -  
**승인자**: -

