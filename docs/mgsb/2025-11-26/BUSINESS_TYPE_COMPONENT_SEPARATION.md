# 업종별 컴포넌트 분리 설계 문서

**작성일**: 2025-11-26  
**버전**: 1.0.0  
**목적**: 테넌트 업종(상담소/학원)에 따른 컴포넌트 접근 제어 및 분리 설계

---

## 📋 개요

현재 MindGarden 시스템에서 학원 테넌트 사용자가 상담소 전용 위젯/메뉴를 볼 수 있고, 반대로 상담소 사용자가 학원 기능에 접근할 수 있는 문제가 있습니다. 테넌트의 `business_type`에 따라 적절한 컴포넌트만 노출되도록 체계적으로 분리해야 합니다.

---

## 🔍 현재 상황 분석

### 이미 구축된 기반

#### 1. 데이터베이스 레벨
- **테넌트 엔티티**: `business_type` 필드 존재 (`CONSULTATION`, `ACADEMY`)
- **테넌트 컨텍스트**: `TenantContextHolder`로 테넌트별 데이터 격리
- **Feature Flag 시스템**: `ops_feature_flag` 테이블로 기능 활성화 제어
- **업종별 기능 활성화**: 프로시저에서 `business_type`에 따른 기능 설정

```sql
-- V42 마이그레이션에서 구현된 업종별 기능 활성화
IF p_business_type = 'CONSULTATION' THEN
    SET v_consultation_enabled = TRUE;
    SET v_academy_enabled = FALSE;
ELSEIF p_business_type = 'ACADEMY' THEN
    SET v_consultation_enabled = FALSE;
    SET v_academy_enabled = TRUE;
```

#### 2. 프론트엔드 레벨
- **위젯 시스템**: `WidgetRegistry.js`에서 업종별 위젯 분류 구조 구현
- **공통 vs 특화 위젯**: 이미 분류되어 있음
- **동적 대시보드**: JSON 기반 위젯 구성 시스템

#### 3. 백엔드 레벨
- **API 권한 시스템**: `DynamicPermissionService`로 역할별 API 접근 제어
- **테넌트 격리**: 모든 엔티티에 `tenant_id` 필드로 데이터 분리

### 핵심 문제점

#### 1. 위젯 노출 제어 부족
**현재 상황:**
```javascript
// WidgetRegistry.js - 업종 검증이 선택적임
export const getWidgetComponent = (widgetType, businessType = null) => {
  // businessType이 null이면 전체에서 검색 (하위 호환성)
  return WIDGET_COMPONENTS[normalizedType] || null;
}
```

**문제:**
- 학원 대시보드에 상담소 위젯(`consultation-summary`, `mapping-management` 등) 노출
- `businessType` 파라미터가 선택적이어서 검증 우회 가능

#### 2. 메뉴 접근 제어 부족
**현재 상황:**
```javascript
// UnifiedHeader.js - 하드코딩된 메뉴
<nav className="mg-header__nav mg-header__nav--desktop">
  <a href="/dashboard">대시보드</a>
  <a href="/sessions">세션 관리</a>  {/* 상담소 전용 */}
  <a href="/users">사용자 관리</a>
  <a href="/analytics">분석</a>
</nav>
```

**문제:**
- 모든 테넌트에서 동일한 메뉴 노출
- 업종별 메뉴 필터링 로직 없음

#### 3. API 접근 제어 부족
**현재 상황:**
```java
// SecurityConfig.java - 역할 기반 접근 제어만 존재
.requestMatchers("/api/consultant/**").authenticated()
.requestMatchers("/api/admin/**").authenticated()
```

**문제:**
- 업종별 API 접근 제한 없음
- 학원 테넌트에서 상담소 API 호출 가능

---

## 🏗️ 컴포넌트 분류 현황

### 1. 상담소 특화 위젯 (11개)
**위치**: `frontend/src/components/dashboard/widgets/consultation/`

| 위젯명 | 파일명 | 기능 | 상태 |
|--------|--------|------|------|
| ConsultationSummaryWidget | ConsultationSummaryWidget.js | 상담 통계 요약 | ✅ 구현완료 |
| ConsultationScheduleWidget | ConsultationScheduleWidget.js | 상담 일정 관리 | ✅ 구현완료 |
| ConsultationStatsWidget | ConsultationStatsWidget.js | 상담 통계 | ✅ 구현완료 |
| ConsultationRecordWidget | ConsultationRecordWidget.js | 상담 기록 | ✅ 구현완료 |
| ConsultantClientWidget | ConsultantClientWidget.js | 내담자 목록 | ✅ 구현완료 |
| MappingManagementWidget | MappingManagementWidget.js | 매칭 관리 | ✅ 구현완료 |
| SessionManagementWidget | SessionManagementWidget.js | 회기 관리 | ✅ 구현완료 |
| ScheduleRegistrationWidget | ScheduleRegistrationWidget.js | 일정 등록 | ✅ 구현완료 |
| PendingDepositWidget | PendingDepositWidget.js | 미수금 관리 | ✅ 구현완료 |
| ClientRegistrationWidget | ClientRegistrationWidget.js | 내담자 등록 | ✅ 구현완료 |
| ConsultantRegistrationWidget | ConsultantRegistrationWidget.js | 상담사 등록 | ✅ 구현완료 |

### 2. 학원 특화 컴포넌트 (6개)
**위치**: `frontend/src/components/academy/`

| 컴포넌트명 | 파일명 | 기능 | 상태 |
|------------|--------|------|------|
| AcademyDashboard | AcademyDashboard.js | 학원 통합 대시보드 | ✅ 구현완료 |
| CourseList | CourseList.js | 강좌 목록 | ✅ 구현완료 |
| CourseForm | CourseForm.js | 강좌 등록/수정 | ✅ 구현완료 |
| ClassList | ClassList.js | 반 목록 | ✅ 구현완료 |
| ClassForm | ClassForm.js | 반 등록/수정 | ✅ 구현완료 |
| EnrollmentForm | EnrollmentForm.js | 수강 등록 | ✅ 구현완료 |

**⚠️ 학원 특화 위젯 부족:**
- 학원 컴포넌트들이 위젯화되지 않음
- `WidgetRegistry.js`에서 `ACADEMY_WIDGETS` 비어있음

### 3. 공통 위젯 (20개)
**위치**: `frontend/src/components/dashboard/widgets/`

| 위젯명 | 기능 | 사용 범위 |
|--------|------|-----------|
| StatisticsWidget | 기본 통계 | 모든 업종 |
| ChartWidget | 차트 표시 | 모든 업종 |
| TableWidget | 테이블 표시 | 모든 업종 |
| CalendarWidget | 캘린더 | 모든 업종 |
| FormWidget | 폼 입력 | 모든 업종 |
| WelcomeWidget | 환영 메시지 | 모든 업종 |
| SummaryStatisticsWidget | 통계 요약 | 모든 업종 |
| ActivityListWidget | 활동 목록 | 모든 업종 |
| QuickActionsWidget | 빠른 액션 | 모든 업종 |
| NavigationMenuWidget | 네비게이션 | 모든 업종 |
| MessageWidget | 메시지 | 모든 업종 |
| NotificationWidget | 알림 | 모든 업종 |
| ScheduleWidget | 일정 | 모든 업종 |
| RatingWidget | 평가 | 모든 업종 |
| PaymentWidget | 결제 | 모든 업종 |
| HealingCardWidget | 힐링 카드 | 모든 업종 |
| PurchaseRequestWidget | 구매 요청 | 모든 업종 |
| PersonalizedMessageWidget | 개인화 메시지 | 모든 업종 |
| HeaderWidget | 헤더 | 모든 업종 |
| ErpCardWidget | ERP 카드 | ERP 활성화 시 |

### 4. 관리자 전용 위젯 (5개)
**위치**: `frontend/src/components/dashboard/widgets/admin/`

| 위젯명 | 기능 | 접근 제어 |
|--------|------|-----------|
| SystemStatusWidget | 시스템 상태 | 관리자 역할 |
| SystemToolsWidget | 시스템 도구 | 관리자 역할 |
| PermissionWidget | 권한 관리 | 관리자 역할 |
| StatisticsGridWidget | 통계 그리드 | 관리자 역할 |
| ManagementGridWidget | 관리 그리드 | 관리자 역할 |

---

## 🔐 접근 제어 매트릭스

### 1. 위젯 접근 제어

| 위젯 카테고리 | 상담소 테넌트 | 학원 테넌트 | 기타 테넌트 |
|---------------|---------------|-------------|-------------|
| 공통 위젯 | ✅ 허용 | ✅ 허용 | ✅ 허용 |
| 상담소 특화 위젯 | ✅ 허용 | ❌ 차단 | ❌ 차단 |
| 학원 특화 위젯 | ❌ 차단 | ✅ 허용 | ❌ 차단 |
| 관리자 위젯 | 🔒 역할 검증 | 🔒 역할 검증 | 🔒 역할 검증 |
| ERP 위젯 | 🔒 기능 활성화 | 🔒 기능 활성화 | 🔒 기능 활성화 |

### 2. 메뉴 접근 제어

| 메뉴 항목 | 상담소 | 학원 | 기타 |
|-----------|--------|------|------|
| 대시보드 | ✅ | ✅ | ✅ |
| 세션 관리 | ✅ | ❌ | ❌ |
| 매칭 관리 | ✅ | ❌ | ❌ |
| 강좌 관리 | ❌ | ✅ | ❌ |
| 반 관리 | ❌ | ✅ | ❌ |
| 수강 관리 | ❌ | ✅ | ❌ |
| 사용자 관리 | ✅ | ✅ | ✅ |
| 결제 관리 | ✅ | ✅ | ✅ |
| ERP | 🔒 | 🔒 | 🔒 |

### 3. API 접근 제어

| API 경로 | 상담소 | 학원 | 기타 |
|----------|--------|------|------|
| `/api/admin/**` | ✅ | ✅ | ✅ |
| `/api/consultant/**` | ✅ | ❌ | ❌ |
| `/api/client/**` | ✅ | ❌ | ❌ |
| `/api/academy/**` | ❌ | ✅ | ❌ |
| `/api/schedules/**` | ✅ | ✅ | ✅ |
| `/api/payments/**` | ✅ | ✅ | ✅ |
| `/api/erp/**` | 🔒 | 🔒 | 🔒 |

---

## 🎯 분리 전략

### 1. 3단계 접근 제어 모델

#### Level 1: 위젯 레벨 제어
- `WidgetRegistry.js`에서 `businessType` 필수 검증
- 잘못된 업종-위젯 조합 시 null 반환
- 에러 로깅 및 fallback 처리

#### Level 2: 메뉴/라우팅 레벨 제어
- 업종별 메뉴 상수 정의
- 네비게이션 컴포넌트에서 업종별 필터링
- 라우팅 가드로 잘못된 접근 차단

#### Level 3: API 레벨 제어
- 컨트롤러에서 업종 검증
- 커스텀 어노테이션으로 자동 검증
- 잘못된 접근 시 403 Forbidden 응답

### 2. 확장 가능한 구조

#### 새로운 업종 추가 시
1. **상수 추가**: `DashboardConstants.java`에 업종 코드 추가
2. **위젯 카테고리 추가**: `WidgetRegistry.js`에 새 업종 위젯 그룹 추가
3. **메뉴 정의**: `MenuConstants.js`에 업종별 메뉴 추가
4. **API 권한**: `BusinessTypePermissions.java`에 권한 매트릭스 추가

#### 컴포넌트 재사용
- 공통 컴포넌트는 모든 업종에서 사용
- 특화 컴포넌트는 해당 업종에서만 사용
- 설정 기반으로 컴포넌트 동작 커스터마이징

---

## 🚨 위험 요소 및 대응 방안

### 1. 기존 기능 영향도
**위험**: 접근 제어 강화로 기존 기능 동작 불가
**대응**: 
- 단계적 적용 (위젯 → 메뉴 → API 순서)
- 충분한 테스트 및 롤백 계획
- 하위 호환성 유지

### 2. 성능 영향
**위험**: 업종 검증 로직으로 인한 성능 저하
**대응**:
- 캐싱 활용 (테넌트 정보, 권한 정보)
- 최소한의 검증 로직
- 프론트엔드에서 사전 필터링

### 3. 사용자 경험
**위험**: 갑작스러운 메뉴/기능 제거로 사용자 혼란
**대응**:
- 점진적 적용
- 사용자 안내 메시지
- 대체 기능 제공

---

## 📈 성공 기준

### 1. 기능적 요구사항
- ✅ 학원 테넌트에서 상담소 전용 기능 완전 차단
- ✅ 상담소 테넌트에서 학원 전용 기능 완전 차단
- ✅ 공통 기능은 모든 업종에서 정상 동작
- ✅ 새로운 업종 추가 시 확장 가능한 구조

### 2. 비기능적 요구사항
- ✅ 기존 기능에 영향 없음
- ✅ 성능 저하 5% 이내
- ✅ 사용자 경험 개선
- ✅ 유지보수성 향상

### 3. 보안 요구사항
- ✅ API 레벨에서 업종별 접근 제어
- ✅ 프론트엔드 우회 불가능한 구조
- ✅ 권한 상승 공격 방지

---

## 📝 다음 단계

1. **Phase 1**: 위젯 노출 제어 강화 (1-2일)
2. **Phase 2**: 메뉴 및 라우팅 제어 (2-3일)
3. **Phase 3**: API 접근 제어 강화 (2-3일)
4. **Phase 4**: 통합 테스트 및 검증 (1-2일)

**총 예상 소요 시간**: 6-10일

---

**작성자**: AI Assistant  
**검토자**: 개발팀  
**승인일**: 2025-11-26  
**다음 검토일**: 2025-12-03
