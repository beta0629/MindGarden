# API 경로 표준화 진행 상황

**작성일**: 2025-12-07  
**상태**: 진행 중

---

## 📋 표준화 규칙

모든 API 경로는 `/api/v1/` 접두사를 사용해야 합니다.

**표준**:
- ✅ `/api/v1/users`
- ✅ `/api/v1/admin/logs/recent`
- ❌ `/api/users` (버전 없음)
- ❌ `/api/admin/logs/recent` (버전 없음)

---

## ✅ 완료된 파일

1. `AdminDashboard.js` - 3개 경로 수정
   - `/api/admin/logs/recent` → `/api/v1/admin/logs/recent`
   - `/api/admin/cache/clear` → `/api/v1/admin/cache/clear`
   - `/api/admin/backup/create` → `/api/v1/admin/backup/create`

2. `ScheduleCalendar.js` - 1개 경로 수정
   - `/api/common-codes/STATUS` → `/api/v1/common-codes/STATUS`

3. `RecentActivitiesWidget.js` - 2개 경로 수정
   - `/api/schedules` → `/api/v1/schedules` (2곳)

4. `SummaryPanelsWidget.js` - 1개 경로 수정
   - `/api/schedules` → `/api/v1/schedules`

---

## ⏳ 남은 파일 (약 46개)

### 주요 파일 목록

1. `ScheduleModal.js`
2. `ScheduleModalOld.js`
3. `ClientSelectionStep.js`
4. `ClientSelector.js`
5. `ProfileSection.js`
6. `AddressInput.js`
7. `HQBranchManagement.js`
8. `BranchUserTransfer.js`
9. `BranchRegistrationModal.js`
10. `BranchManagement.js`
11. `BranchList.js`
12. `BranchForm.js`
13. `RecurringExpenseModal.js`
14. `NotificationTest.js`
15. `PerformanceMetricsModal.js`
16. 기타 다수...

---

## 🔍 검색 패턴

다음 패턴으로 미표준화 경로를 찾을 수 있습니다:

```bash
# 프론트엔드에서 검색
grep -r "'/api/[^v]" frontend/src/components/
grep -r '"/api/[^v]' frontend/src/components/

# 또는
grep -r "'/api/admin" frontend/src/components/
grep -r "'/api/erp" frontend/src/components/
grep -r "'/api/auth[^/]" frontend/src/components/
```

---

## 📝 수정 방법

1. 파일 열기
2. `/api/` 패턴 찾기 (v1 없음)
3. `/api/v1/`로 변경
4. 테스트 확인

---

**최종 업데이트**: 2025-12-07

