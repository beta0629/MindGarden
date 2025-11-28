# 테넌트 비즈니스 타입별 위젯 필터링 시스템 현황 (2025-11-27)

**작성일**: 2025-11-27  
**작성자**: AI Assistant  
**목적**: 현재 위젯 필터링 시스템 구현 상태 및 테스트 계획

---

## 📊 **현재 구현 상태**

### ✅ **구현 완료된 부분들**

#### 1. 백엔드 - 테넌트 비즈니스 타입 관리
```java
// 테넌트 엔티티
public class Tenant extends BaseEntity {
    private String businessType; // CONSULTATION, ACADEMY 등
}

// 테넌트 서비스
public class TenantServiceImpl implements TenantService {
    public String getBusinessType(String tenantId) {
        // 테넌트의 업종 타입 조회
    }
}

// 업종 검증 AOP
@Aspect
public class BusinessTypeAspect {
    @Before("@annotation(RequireBusinessType)")
    public void validateBusinessType(...) {
        // 자동 업종 검증
    }
}
```

#### 2. 프론트엔드 - 위젯 레지스트리 및 필터링
```javascript
// 위젯 레지스트리 (업종별 분리)
const COMMON_WIDGETS = { 'statistics', 'chart', 'table' }; // 모든 업종
const CONSULTATION_WIDGETS = { 'consultation-summary', 'session-management' }; // 상담소 전용
const ACADEMY_WIDGETS = { 'academy-schedule', 'academy-attendance' }; // 학원 전용

// 위젯 가시성 검증
export const isWidgetVisible = (widgetType, businessType, userRole) => {
    // 업종별 위젯 접근 제어
}

// 위젯 필터링
export const filterWidgetsByBusinessType = (widgets, businessType, userRole) => {
    return widgets.filter(widget => isWidgetVisible(widget.type, businessType, userRole));
}
```

#### 3. 동적 대시보드 - 위젯 렌더링
```javascript
// DynamicDashboard.js
const businessFilteredWidgets = businessType 
  ? filterWidgetsByBusinessType(widgets, businessType, user?.role)
  : widgets;
```

---

## 🔍 **데이터베이스 확인 결과**

### 테넌트 목록 (실제 존재)
```
tenant-unknown-consultation-001 | 테스트 상담소 | CONSULTATION | ACTIVE
tenant-unknown-academy-001      | 테스트 학원   | ACADEMY      | ACTIVE  
tenant-seoul-consultation-004   | 테스트 상담소 | CONSULTATION | ACTIVE
```

### 테스트 계정 (문서 기준)
- **상담소**: test-consultation-1763988242@example.com / Test1234!@#
- **학원**: test-academy-1763988263@example.com / Test1234!@#

---

## 🧪 **테스트 계획**

### Step 1: 백엔드 서버 시작 대기
- [진행 중] 포그라운드에서 서버 실행 중
- [ ] http://localhost:8080/actuator/health 확인

### Step 2: 상담소 테넌트 로그인 테스트
```
URL: http://localhost:3000/login
계정: test-consultation-1763988242@example.com / Test1234!@#
예상: CONSULTATION 업종으로 인식
```

**확인 사항:**
- [ ] 로그인 성공
- [ ] 대시보드 로드 성공
- [ ] **상담소 전용 위젯만 표시** (consultation-summary, session-management 등)
- [ ] **학원 전용 위젯 숨김** (academy-schedule, academy-attendance 등)
- [ ] **공통 위젯 표시** (statistics, chart, table 등)

### Step 3: 학원 테넌트 로그인 테스트  
```
URL: http://localhost:3000/login
계정: test-academy-1763988263@example.com / Test1234!@#
예상: ACADEMY 업종으로 인식
```

**확인 사항:**
- [ ] 로그인 성공
- [ ] 대시보드 로드 성공  
- [ ] **학원 전용 위젯만 표시** (academy-schedule, academy-attendance 등)
- [ ] **상담소 전용 위젯 숨김** (consultation-summary, session-management 등)
- [ ] **공통 위젯 표시** (statistics, chart, table 등)

### Step 4: 크로스 검증
- [ ] 상담소에서 학원 API 호출 → 403 Forbidden
- [ ] 학원에서 상담소 API 호출 → 403 Forbidden

---

## 🔧 **예상 문제점 및 해결 방안**

### 1. 백엔드 API 미구현 (확인 필요)
**문제**: 프론트엔드에서 호출하는 API들
```
GET /api/admin/business-type/{businessType}/widgets
GET /api/admin/widgets/{widgetType}/visibility-config
```

**해결**: 해당 API들이 구현되어 있는지 확인하고 없으면 구현

### 2. 테넌트 컨텍스트 설정 문제
**문제**: TenantContextHolder에 tenant_id가 제대로 설정되지 않을 수 있음

**진단 방법**: 브라우저 콘솔에서 확인
```javascript
// 로그인 후 확인
console.log('Current User:', sessionManager.getUser());
console.log('Business Type:', sessionManager.getUser()?.businessType);
```

### 3. 위젯 컴포넌트 누락
**문제**: 일부 위젯 컴포넌트가 실제로 구현되지 않았을 수 있음

**해결**: 누락된 위젯들은 placeholder로 대체

---

## 🎯 **성공 기준**

### 상담소 테넌트 로그인 시
```
표시되어야 할 위젯:
✅ 공통: statistics, chart, table, calendar
✅ 상담소: consultation-summary, session-management, consultant-client
❌ 학원: academy-schedule, academy-attendance (숨김)
```

### 학원 테넌트 로그인 시
```  
표시되어야 할 위젯:
✅ 공통: statistics, chart, table, calendar
✅ 학원: academy-schedule, academy-attendance, class-management  
❌ 상담소: consultation-summary, session-management (숨김)
```

---

## 📋 **현재 진행 상황**

- [진행 중] 백엔드 서버 시작 (포그라운드 실행)
- [대기] 로그인 테스트
- [대기] 위젯 필터링 검증
- [대기] API 접근 제어 검증

---

**다음 단계**: 백엔드 서버 시작 완료 후 테스트 계정으로 위젯 필터링 검증

---

**마지막 업데이트**: 2025-11-27 오후 3:49  
**다음 업데이트**: 서버 시작 완료 후
