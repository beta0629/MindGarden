# 업종별 컴포넌트 분리 구현 계획서

**작성일**: 2025-11-26  
**버전**: 1.0.0  
**목적**: 업종별 컴포넌트 분리 작업의 상세 구현 계획 및 실행 가이드

---

## 📋 실행 개요

### 목표
테넌트의 `business_type`에 따라 적절한 컴포넌트만 노출되도록 위젯, 메뉴, API 접근을 체계적으로 분리

### 핵심 원칙
1. **점진적 적용**: 위젯 → 메뉴 → API 순서로 단계적 구현
2. **하위 호환성**: 기존 기능에 영향 없도록 안전한 구현
3. **확장성**: 새로운 업종 추가 시 쉽게 확장 가능한 구조
4. **성능**: 최소한의 오버헤드로 검증 로직 구현

---

## 🚀 Phase 1: 문서화 및 현황 분석 (완료)

### ✅ 완료된 작업
- [x] 업종별 컴포넌트 분리 설계 문서 작성
- [x] 현재 위젯/메뉴/API 현황 분석
- [x] 접근 제어 매트릭스 정의
- [x] 구현 계획서 작성

---

## 🔧 Phase 2: 위젯 노출 제어 강화 (1-2일)

### 2.1 WidgetRegistry 개선

**파일**: `frontend/src/components/dashboard/widgets/WidgetRegistry.js`

**현재 문제점**:
```javascript
// businessType이 선택적이어서 검증 우회 가능
export const getWidgetComponent = (widgetType, businessType = null) => {
  // 업종 정보가 없으면 전체에서 검색 (하위 호환성)
  return WIDGET_COMPONENTS[normalizedType] || null;
}
```

**개선 사항**:
1. **필수 검증 추가**:
   ```javascript
   export const getWidgetComponent = (widgetType, businessType) => {
     if (!businessType) {
       console.warn('업종 정보가 필요합니다:', widgetType);
       return null;
     }
     // 업종별 검증 로직
   }
   ```

2. **에러 로깅 강화**:
   ```javascript
   if (normalizedBusinessType === 'consultation' && !CONSULTATION_WIDGETS[normalizedType]) {
     console.warn(`상담소에서 지원하지 않는 위젯: ${widgetType}`);
     return null;
   }
   ```

3. **Fallback 처리**:
   ```javascript
   // 특화 위젯이 없으면 공통 위젯에서 검색
   if (!component && COMMON_WIDGETS[normalizedType]) {
     return COMMON_WIDGETS[normalizedType];
   }
   ```

### 2.2 대시보드 렌더링 로직 수정

**파일**: `frontend/src/components/dashboard/DynamicDashboard.js`

**수정 내용**:
1. **테넌트 업종 정보 가져오기**:
   ```javascript
   const user = sessionManager.getUser();
   const tenantBusinessType = user?.tenant?.businessType || 'CONSULTATION';
   ```

2. **위젯 렌더링 시 업종 검증**:
   ```javascript
   const renderWidget = (widget) => {
     const WidgetComponent = getWidgetComponent(widget.type, tenantBusinessType);
     if (!WidgetComponent) {
       console.warn(`위젯을 로드할 수 없습니다: ${widget.type}`);
       return null; // 또는 fallback 컴포넌트
     }
     return <WidgetComponent key={widget.id} widget={widget} user={user} />;
   };
   ```

3. **Graceful Degradation**:
   ```javascript
   const FallbackWidget = ({ widget }) => (
     <div className="widget-fallback">
       <p>이 위젯은 현재 업종에서 지원되지 않습니다.</p>
     </div>
   );
   ```

### 2.3 위젯 가시성 검증 유틸리티 추가

**파일**: `frontend/src/utils/widgetVisibilityUtils.js` (신규)

**구현 내용**:
```javascript
/**
 * 위젯 가시성 검증 유틸리티
 */

import { 
  getCommonWidgetTypes, 
  getConsultationWidgetTypes, 
  getAcademyWidgetTypes 
} from '../components/dashboard/widgets/WidgetRegistry';

/**
 * 업종별 허용 위젯 타입 반환
 */
export const getAllowedWidgetTypes = (businessType) => {
  const commonTypes = getCommonWidgetTypes();
  
  switch (businessType?.toUpperCase()) {
    case 'CONSULTATION':
      return [...commonTypes, ...getConsultationWidgetTypes()];
    case 'ACADEMY':
      return [...commonTypes, ...getAcademyWidgetTypes()];
    default:
      return commonTypes; // 기본적으로 공통 위젯만 허용
  }
};

/**
 * 위젯 가시성 검증
 */
export const isWidgetVisible = (widgetType, businessType, userRole = null) => {
  if (!widgetType || !businessType) {
    return false;
  }
  
  const allowedTypes = getAllowedWidgetTypes(businessType);
  const isAllowed = allowedTypes.includes(widgetType.toLowerCase());
  
  // 관리자 위젯은 추가 역할 검증
  if (widgetType.includes('admin') || widgetType.includes('system')) {
    return isAllowed && isAdminRole(userRole);
  }
  
  return isAllowed;
};

/**
 * 관리자 역할 검증
 */
const isAdminRole = (userRole) => {
  const adminRoles = ['ADMIN', 'SUPER_ADMIN', 'HQ_MASTER'];
  return adminRoles.includes(userRole?.toUpperCase());
};

/**
 * 위젯 설정 필터링
 */
export const filterWidgetsByBusinessType = (widgets, businessType, userRole) => {
  if (!Array.isArray(widgets)) {
    return [];
  }
  
  return widgets.filter(widget => 
    isWidgetVisible(widget.type, businessType, userRole)
  );
};
```

---

## 🧭 Phase 3: 메뉴 및 라우팅 제어 (2-3일)

### 3.1 업종별 메뉴 상수 정의

**파일**: `frontend/src/constants/MenuConstants.js` (신규)

**구현 내용**:
```javascript
/**
 * 업종별 메뉴 접근 제어 상수
 */

// 공통 메뉴 (모든 업종에서 사용 가능)
export const COMMON_MENU_ITEMS = [
  'dashboard',
  'mypage',
  'notifications',
  'help',
  'settings'
];

// 상담소 특화 메뉴
export const CONSULTATION_MENU_ITEMS = [
  ...COMMON_MENU_ITEMS,
  'sessions',           // 세션 관리
  'consultations',      // 상담 관리
  'clients',           // 내담자 관리
  'consultants',       // 상담사 관리
  'mappings',          // 매칭 관리
  'consultation-records', // 상담 기록
  'consultation-reports'  // 상담 보고서
];

// 학원 특화 메뉴
export const ACADEMY_MENU_ITEMS = [
  ...COMMON_MENU_ITEMS,
  'courses',           // 강좌 관리
  'classes',           // 반 관리
  'enrollments',       // 수강 관리
  'attendance',        // 출석 관리
  'academy-schedules', // 학원 일정
  'tuition',          // 수강료 관리
  'academy-reports'    // 학원 보고서
];

// ERP 메뉴 (기능 활성화 시)
export const ERP_MENU_ITEMS = [
  'erp-dashboard',
  'purchase-management',
  'financial-management',
  'budget-management',
  'tax-management',
  'salary-management'
];

// 관리자 메뉴 (역할별)
export const ADMIN_MENU_ITEMS = [
  'admin-dashboard',
  'user-management',
  'permission-management',
  'system-status',
  'system-tools'
];

/**
 * 업종별 허용 메뉴 반환
 */
export const getAllowedMenuItems = (businessType, userRole, features = {}) => {
  let allowedMenus = [];
  
  switch (businessType?.toUpperCase()) {
    case 'CONSULTATION':
      allowedMenus = [...CONSULTATION_MENU_ITEMS];
      break;
    case 'ACADEMY':
      allowedMenus = [...ACADEMY_MENU_ITEMS];
      break;
    default:
      allowedMenus = [...COMMON_MENU_ITEMS];
  }
  
  // ERP 기능 활성화 시 추가
  if (features.erpEnabled) {
    allowedMenus.push(...ERP_MENU_ITEMS);
  }
  
  // 관리자 역할 시 추가
  if (isAdminRole(userRole)) {
    allowedMenus.push(...ADMIN_MENU_ITEMS);
  }
  
  return allowedMenus;
};

/**
 * 메뉴 접근 권한 검증
 */
export const hasMenuAccess = (menuItem, businessType, userRole, features = {}) => {
  const allowedMenus = getAllowedMenuItems(businessType, userRole, features);
  return allowedMenus.includes(menuItem);
};

const isAdminRole = (userRole) => {
  const adminRoles = ['ADMIN', 'SUPER_ADMIN', 'HQ_MASTER'];
  return adminRoles.includes(userRole?.toUpperCase());
};
```

### 3.2 네비게이션 컴포넌트 수정

**파일**: `frontend/src/components/common/UnifiedHeader.js`

**수정 내용**:
1. **메뉴 필터링 로직 추가**:
   ```javascript
   import { hasMenuAccess, getAllowedMenuItems } from '../../constants/MenuConstants';
   
   const UnifiedHeader = ({ ... }) => {
     const user = sessionManager.getUser();
     const businessType = user?.tenant?.businessType;
     const userRole = user?.role;
     
     // 허용된 메뉴 목록 가져오기
     const allowedMenus = getAllowedMenuItems(businessType, userRole);
   ```

2. **메뉴 렌더링 조건부 처리**:
   ```javascript
   const renderMenuItem = (menuItem, label, path) => {
     if (!hasMenuAccess(menuItem, businessType, userRole)) {
       return null; // 권한 없는 메뉴는 숨김
     }
     
     return (
       <a href={path} className="mg-header__nav-item">
         {label}
       </a>
     );
   };
   ```

3. **동적 메뉴 생성**:
   ```javascript
   const menuConfig = {
     'dashboard': { label: '대시보드', path: '/dashboard' },
     'sessions': { label: '세션 관리', path: '/sessions' },
     'courses': { label: '강좌 관리', path: '/courses' },
     // ... 기타 메뉴 설정
   };
   
   return (
     <nav className="mg-header__nav mg-header__nav--desktop">
       {allowedMenus.map(menuItem => {
         const config = menuConfig[menuItem];
         return config ? renderMenuItem(menuItem, config.label, config.path) : null;
       })}
     </nav>
   );
   ```

### 3.3 라우팅 가드 구현

**파일**: `frontend/src/components/common/BusinessTypeGuard.js` (신규)

**구현 내용**:
```javascript
/**
 * 업종별 라우트 접근 제어 가드
 */
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import sessionManager from '../../utils/sessionManager';
import { hasMenuAccess } from '../../constants/MenuConstants';

const BusinessTypeGuard = ({ children, requiredBusinessType, requiredMenu }) => {
  const location = useLocation();
  const user = sessionManager.getUser();
  
  if (!user) {
    // 인증되지 않은 사용자는 로그인 페이지로
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  const userBusinessType = user.tenant?.businessType;
  const userRole = user.role;
  
  // 업종 검증
  if (requiredBusinessType && userBusinessType !== requiredBusinessType) {
    console.warn(`접근 거부: 필요 업종=${requiredBusinessType}, 사용자 업종=${userBusinessType}`);
    return <Navigate to="/dashboard" replace />;
  }
  
  // 메뉴 접근 권한 검증
  if (requiredMenu && !hasMenuAccess(requiredMenu, userBusinessType, userRole)) {
    console.warn(`메뉴 접근 거부: ${requiredMenu}`);
    return <Navigate to="/dashboard" replace />;
  }
  
  return children;
};

export default BusinessTypeGuard;

/**
 * 상담소 전용 라우트 가드
 */
export const ConsultationGuard = ({ children }) => (
  <BusinessTypeGuard requiredBusinessType="CONSULTATION">
    {children}
  </BusinessTypeGuard>
);

/**
 * 학원 전용 라우트 가드
 */
export const AcademyGuard = ({ children }) => (
  <BusinessTypeGuard requiredBusinessType="ACADEMY">
    {children}
  </BusinessTypeGuard>
);

/**
 * 메뉴별 접근 가드
 */
export const MenuGuard = ({ children, menu }) => (
  <BusinessTypeGuard requiredMenu={menu}>
    {children}
  </BusinessTypeGuard>
);
```

---

## 🔐 Phase 4: API 접근 제어 강화 (2-3일)

### 4.1 업종별 API 권한 상수 정의

**파일**: `src/main/java/com/coresolution/core/constant/BusinessTypePermissions.java` (신규)

**구현 내용**:
```java
/**
 * 업종별 API 접근 권한 상수
 */
package com.coresolution.core.constant;

import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.HashMap;

public class BusinessTypePermissions {
    
    // 공통 API (모든 업종에서 접근 가능)
    public static final List<String> COMMON_API_PATTERNS = Arrays.asList(
        "/api/auth/**",
        "/api/admin/users/**",
        "/api/admin/permissions/**",
        "/api/schedules/**",
        "/api/payments/**",
        "/api/notifications/**",
        "/api/common-codes/**"
    );
    
    // 상담소 특화 API
    public static final List<String> CONSULTATION_API_PATTERNS = Arrays.asList(
        "/api/consultant/**",
        "/api/client/**",
        "/api/consultations/**",
        "/api/consultation-messages/**",
        "/api/admin/mappings/**",
        "/api/admin/sessions/**",
        "/api/admin/consultation-records/**"
    );
    
    // 학원 특화 API
    public static final List<String> ACADEMY_API_PATTERNS = Arrays.asList(
        "/api/academy/**",
        "/api/courses/**",
        "/api/classes/**",
        "/api/enrollments/**",
        "/api/attendance/**",
        "/api/tuition/**"
    );
    
    // ERP API (기능 활성화 시)
    public static final List<String> ERP_API_PATTERNS = Arrays.asList(
        "/api/erp/**",
        "/api/purchase/**",
        "/api/financial/**",
        "/api/budget/**",
        "/api/tax/**",
        "/api/salary/**"
    );
    
    // 업종별 허용 API 매핑
    private static final Map<String, List<String>> BUSINESS_TYPE_API_MAP = new HashMap<>();
    
    static {
        // 상담소 허용 API
        BUSINESS_TYPE_API_MAP.put("CONSULTATION", 
            Arrays.asList(COMMON_API_PATTERNS, CONSULTATION_API_PATTERNS)
                .stream()
                .flatMap(List::stream)
                .collect(Collectors.toList())
        );
        
        // 학원 허용 API
        BUSINESS_TYPE_API_MAP.put("ACADEMY",
            Arrays.asList(COMMON_API_PATTERNS, ACADEMY_API_PATTERNS)
                .stream()
                .flatMap(List::stream)
                .collect(Collectors.toList())
        );
    }
    
    /**
     * 업종별 API 접근 권한 확인
     */
    public static boolean hasApiAccess(String businessType, String apiPath) {
        if (businessType == null || apiPath == null) {
            return false;
        }
        
        List<String> allowedPatterns = BUSINESS_TYPE_API_MAP.get(businessType.toUpperCase());
        if (allowedPatterns == null) {
            // 알 수 없는 업종은 공통 API만 허용
            allowedPatterns = COMMON_API_PATTERNS;
        }
        
        return allowedPatterns.stream()
            .anyMatch(pattern -> matchesPattern(apiPath, pattern));
    }
    
    /**
     * 패턴 매칭 (Ant 스타일)
     */
    private static boolean matchesPattern(String path, String pattern) {
        // 간단한 와일드카드 매칭 구현
        if (pattern.endsWith("/**")) {
            String prefix = pattern.substring(0, pattern.length() - 3);
            return path.startsWith(prefix);
        }
        return path.equals(pattern);
    }
}
```

### 4.2 업종 검증 어노테이션 구현

**파일**: `src/main/java/com/coresolution/core/annotation/RequireBusinessType.java` (신규)

**구현 내용**:
```java
/**
 * 업종 검증 커스텀 어노테이션
 */
package com.coresolution.core.annotation;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

@Target({ElementType.METHOD, ElementType.TYPE})
@Retention(RetentionPolicy.RUNTIME)
public @interface RequireBusinessType {
    
    /**
     * 필요한 업종 타입들
     */
    String[] value();
    
    /**
     * 접근 거부 시 에러 메시지
     */
    String message() default "이 기능은 해당 업종에서 사용할 수 없습니다.";
}
```

**AOP 구현**: `src/main/java/com/coresolution/core/aspect/BusinessTypeAspect.java` (신규)

```java
/**
 * 업종 검증 AOP
 */
package com.coresolution.core.aspect;

import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.springframework.stereotype.Component;
import org.springframework.security.access.AccessDeniedException;

import com.coresolution.core.annotation.RequireBusinessType;
import com.coresolution.core.context.TenantContextHolder;
import com.coresolution.core.service.TenantService;

@Aspect
@Component
@Slf4j
public class BusinessTypeAspect {
    
    private final TenantService tenantService;
    
    public BusinessTypeAspect(TenantService tenantService) {
        this.tenantService = tenantService;
    }
    
    @Around("@annotation(requireBusinessType)")
    public Object checkBusinessType(ProceedingJoinPoint joinPoint, RequireBusinessType requireBusinessType) throws Throwable {
        
        String tenantId = TenantContextHolder.getTenantId();
        if (tenantId == null) {
            throw new AccessDeniedException("테넌트 정보가 없습니다.");
        }
        
        // 테넌트 업종 조회
        String businessType = tenantService.getBusinessType(tenantId);
        if (businessType == null) {
            throw new AccessDeniedException("업종 정보를 찾을 수 없습니다.");
        }
        
        // 허용된 업종 확인
        String[] allowedTypes = requireBusinessType.value();
        boolean hasAccess = Arrays.stream(allowedTypes)
            .anyMatch(type -> type.equalsIgnoreCase(businessType));
        
        if (!hasAccess) {
            log.warn("업종 접근 거부: 필요={}, 현재={}, 메서드={}", 
                Arrays.toString(allowedTypes), businessType, joinPoint.getSignature().getName());
            throw new AccessDeniedException(requireBusinessType.message());
        }
        
        return joinPoint.proceed();
    }
}
```

### 4.3 컨트롤러 레벨 접근 제어

**상담소 컨트롤러 수정 예시**:
```java
@RestController
@RequestMapping("/api/consultant")
@RequireBusinessType("CONSULTATION")
public class ConsultantController {
    
    @GetMapping("/clients")
    @RequireBusinessType("CONSULTATION")
    public ResponseEntity<List<Client>> getClients() {
        // 상담소에서만 접근 가능
    }
}
```

**학원 컨트롤러 수정 예시**:
```java
@RestController
@RequestMapping("/api/academy")
@RequireBusinessType("ACADEMY")
public class AcademyController {
    
    @GetMapping("/courses")
    @RequireBusinessType("ACADEMY")
    public ResponseEntity<List<Course>> getCourses() {
        // 학원에서만 접근 가능
    }
}
```

---

## 🧪 Phase 5: 통합 테스트 및 검증 (1-2일)

### 5.1 테스트 시나리오

#### 위젯 접근 제어 테스트
```javascript
// 테스트 케이스 1: 상담소 테넌트
describe('상담소 테넌트 위젯 접근 제어', () => {
  test('상담소 특화 위젯 접근 가능', () => {
    const component = getWidgetComponent('consultation-summary', 'CONSULTATION');
    expect(component).not.toBeNull();
  });
  
  test('학원 특화 위젯 접근 불가', () => {
    const component = getWidgetComponent('academy-schedule', 'CONSULTATION');
    expect(component).toBeNull();
  });
});

// 테스트 케이스 2: 학원 테넌트
describe('학원 테넌트 위젯 접근 제어', () => {
  test('학원 특화 위젯 접근 가능', () => {
    const component = getWidgetComponent('academy-schedule', 'ACADEMY');
    expect(component).not.toBeNull();
  });
  
  test('상담소 특화 위젯 접근 불가', () => {
    const component = getWidgetComponent('consultation-summary', 'ACADEMY');
    expect(component).toBeNull();
  });
});
```

#### API 접근 제어 테스트
```java
@Test
public void 상담소_테넌트_API_접근_테스트() {
    // Given
    String tenantId = "consultation-tenant-1";
    TenantContextHolder.setTenantId(tenantId);
    
    // When & Then
    assertTrue(BusinessTypePermissions.hasApiAccess("CONSULTATION", "/api/consultant/clients"));
    assertFalse(BusinessTypePermissions.hasApiAccess("CONSULTATION", "/api/academy/courses"));
}

@Test
public void 학원_테넌트_API_접근_테스트() {
    // Given
    String tenantId = "academy-tenant-1";
    TenantContextHolder.setTenantId(tenantId);
    
    // When & Then
    assertTrue(BusinessTypePermissions.hasApiAccess("ACADEMY", "/api/academy/courses"));
    assertFalse(BusinessTypePermissions.hasApiAccess("ACADEMY", "/api/consultant/clients"));
}
```

### 5.2 성능 테스트

#### 위젯 로딩 성능
- 업종 검증 로직 추가 전후 위젯 로딩 시간 비교
- 목표: 5% 이내 성능 저하

#### API 응답 성능
- 업종 검증 AOP 추가 전후 API 응답 시간 비교
- 목표: 10ms 이내 추가 지연

### 5.3 롤백 계획

#### 단계별 롤백
1. **Phase 2 롤백**: `WidgetRegistry.js` 원복
2. **Phase 3 롤백**: 메뉴 필터링 로직 제거
3. **Phase 4 롤백**: API 어노테이션 제거

#### 긴급 롤백 스크립트
```bash
#!/bin/bash
# 긴급 롤백 스크립트

echo "업종별 컴포넌트 분리 롤백 시작..."

# Git으로 변경사항 되돌리기
git checkout HEAD~1 -- frontend/src/components/dashboard/widgets/WidgetRegistry.js
git checkout HEAD~1 -- frontend/src/components/common/UnifiedHeader.js

# 신규 파일 삭제
rm -f frontend/src/utils/widgetVisibilityUtils.js
rm -f frontend/src/constants/MenuConstants.js
rm -f frontend/src/components/common/BusinessTypeGuard.js

echo "롤백 완료"
```

---

## 📊 진행 상황 추적

### 체크리스트

#### Phase 1: 문서화 (완료)
- [x] 설계 문서 작성
- [x] 구현 계획서 작성
- [x] 현황 분석 완료

#### Phase 2: 위젯 제어
- [ ] WidgetRegistry.js 개선
- [ ] DynamicDashboard.js 수정
- [ ] widgetVisibilityUtils.js 구현
- [ ] 위젯 접근 제어 테스트

#### Phase 3: 메뉴/라우팅 제어
- [ ] MenuConstants.js 구현
- [ ] UnifiedHeader.js 수정
- [ ] BusinessTypeGuard.js 구현
- [ ] 라우팅 가드 테스트

#### Phase 4: API 제어
- [ ] BusinessTypePermissions.java 구현
- [ ] RequireBusinessType 어노테이션 구현
- [ ] BusinessTypeAspect.java 구현
- [ ] 컨트롤러 어노테이션 적용
- [ ] API 접근 제어 테스트

#### Phase 5: 통합 테스트
- [ ] 전체 시나리오 테스트
- [ ] 성능 테스트
- [ ] 사용자 수용 테스트

### 위험 요소 모니터링

| 위험 요소 | 확률 | 영향도 | 대응 방안 |
|-----------|------|--------|-----------|
| 기존 기능 영향 | 중간 | 높음 | 충분한 테스트, 단계적 적용 |
| 성능 저하 | 낮음 | 중간 | 캐싱, 최적화 |
| 사용자 혼란 | 중간 | 중간 | 점진적 적용, 안내 메시지 |

---

## 🎯 완료 기준

### 기능 검증
1. ✅ 학원 테넌트에서 상담소 위젯 완전 차단
2. ✅ 상담소 테넌트에서 학원 위젯 완전 차단
3. ✅ 공통 위젯은 모든 업종에서 정상 동작
4. ✅ 메뉴 접근 제어 정상 동작
5. ✅ API 접근 제어 정상 동작

### 성능 검증
1. ✅ 위젯 로딩 성능 저하 5% 이내
2. ✅ API 응답 성능 저하 10ms 이내
3. ✅ 메모리 사용량 증가 5% 이내

### 사용자 경험 검증
1. ✅ 직관적인 에러 메시지
2. ✅ 부드러운 fallback 처리
3. ✅ 기존 워크플로우 유지

---

**작성자**: AI Assistant  
**검토자**: 개발팀  
**승인일**: 2025-11-26  
**예상 완료일**: 2025-12-03
