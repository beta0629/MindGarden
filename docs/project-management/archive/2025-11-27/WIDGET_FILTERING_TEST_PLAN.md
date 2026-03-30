# 업종별 위젯 필터링 테스트 계획 (2025-11-27)

**작성일**: 2025-11-27  
**목적**: 사용자 직접 로그인 후 위젯 필터링 시스템 검증  
**상태**: 로그인 대기 중

---

## ✅ **사전 확인 완료**

### 백엔드 준비 상태
- ✅ 서버 정상 실행: `{"status":"UP"}`
- ✅ 테넌트 계정 유효성 확인: 로그인 API 성공
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 162,
      "email": "test-consultation-1763988242@example.com", 
      "name": "테스트 상담소 관리자",
      "role": "ADMIN"
    }
  }
}
```

### 테넌트 정보 확인
- ✅ **상담소 테넌트**: `tenant-unknown-consultation-001` (CONSULTATION)
- ✅ **학원 테넌트**: `tenant-unknown-academy-001` (ACADEMY)
- ✅ **관리자 계정들**: 데이터베이스에서 확인 완료

---

## 📋 **로그인 후 테스트 항목**

### 🔬 **상담소 테넌트 테스트**

**로그인 계정**: `test-consultation-1763988242@example.com` / `Test1234!@#`

#### 확인 사항:
1. **로그인 성공 후 대시보드 진입**
   - [ ] 대시보드 페이지 정상 로드
   - [ ] 사용자 정보 표시 (테스트 상담소 관리자)

2. **브라우저 콘솔 확인** (F12 → Console)
```javascript
// 현재 사용자 정보
console.log('Current User:', sessionManager.getUser());

// 비즈니스 타입 확인
console.log('Business Type:', sessionManager.getUser()?.businessType);
// 예상값: "CONSULTATION"

// 테넌트 ID 확인
console.log('Tenant ID:', sessionManager.getUser()?.tenantId);
// 예상값: "tenant-unknown-consultation-001"
```

3. **표시되어야 하는 위젯들** ✅
   - **공통 위젯**: Statistics, Chart, Table, Calendar
   - **상담소 전용**: Consultation Summary, Session Management, Consultant-Client
   - **관리자 위젯**: System Status, Management Grid (ADMIN 역할이므로)

4. **숨겨져야 하는 위젯들** ❌  
   - **학원 전용**: Academy Schedule, Academy Attendance, Class Management

5. **위젯 필터링 로그 확인** (Console에서)
```
위젯 필터링 완료: X → Y개
위젯 접근 허용: consultation-summary, 업종: CONSULTATION
위젯 접근 거부: academy-schedule, 업종: CONSULTATION
```

---

## 🔬 **학원 테넌트 테스트** (추후)

**로그인 계정**: `test-academy-1763988263@example.com` / `Test1234!@#`

#### 확인 사항:
1. **비즈니스 타입**: "ACADEMY"로 인식
2. **표시 위젯**: 공통 + 학원 전용 + 관리자 위젯
3. **숨김 위젯**: 상담소 전용 위젯

---

## 🧪 **테스트 시나리오**

### Step 1: 상담소 테넌트 로그인 (진행 중)
- [대기] 사용자 직접 로그인
- [ ] Console 로그 확인
- [ ] 대시보드 위젯 확인

### Step 2: 대시보드 관리 페이지 접속
```
URL: /admin/dashboards
목적: 위젯 편집 UI에서 필터링 확인
```

### Step 3: 학원 테넌트 테스트
- [ ] 로그아웃
- [ ] 학원 계정으로 로그인
- [ ] 위젯 필터링 비교

---

## 🎯 **성공 기준**

### 상담소 테넌트 로그인 시
```
✅ 표시: statistics, consultation-summary, session-management
❌ 숨김: academy-schedule, academy-attendance  
```

### 학원 테넌트 로그인 시  
```
✅ 표시: statistics, academy-schedule, academy-attendance
❌ 숨김: consultation-summary, session-management
```

### 콘솔 로그
```
업종별 위젯 필터링 (1차: 업종 기반)
위젯 필터링 완료: 15 → 8개 (예시)
```

---

## 📝 **참고 정보**

### 구현된 위젯 필터링 시스템
- **백엔드**: `@RequireBusinessType`, `BusinessTypeAspect`, `TenantService`
- **프론트엔드**: `widgetVisibilityUtils.js`, `WidgetRegistry.js`, `DynamicDashboard.js`

### 위젯 카테고리
- **공통**: 모든 업종에서 사용 가능
- **상담소 전용**: CONSULTATION 업종에서만 표시  
- **학원 전용**: ACADEMY 업종에서만 표시
- **관리자 전용**: ADMIN 역할에서만 표시

---

**상태**: 로그인 대기 중  
**다음 작업**: 로그인 완료 후 위젯 필터링 검증

---

**마지막 업데이트**: 2025-11-27 15:55
