# API 오류 처리 표준

**버전**: 1.0.0  
**최종 업데이트**: 2025-12-03  
**상태**: 공식 표준

---

## 📌 개요

MindGarden 프로젝트의 API 오류 처리 및 예외 관리 표준입니다.  
프론트엔드와 백엔드 간의 일관된 오류 처리 방식을 정의합니다.

### 참조 문서
- [에러 처리 표준](./ERROR_HANDLING_STANDARD.md)
- [API 설계 표준](./API_DESIGN_STANDARD.md)
- [공통코드 시스템 표준](./COMMON_CODE_SYSTEM_STANDARD.md)

### 구현 위치
- **백엔드 예외 처리**: `src/main/java/com/coresolution/consultation/exception/GlobalExceptionHandler.java`
- **프론트엔드 API 유틸**: `frontend/src/utils/ajax.js`
- **프론트엔드 API 캐시**: `frontend/src/utils/apiCache.js`

---

## 🎯 오류 처리 원칙

### 1. 백엔드 오류 처리

#### 표준 응답 형식
```json
{
  "success": false,
  "message": "에러 메시지",
  "error": {
    "code": "ERROR_CODE",
    "message": "상세 에러 메시지",
    "details": {}
  },
  "timestamp": "2025-12-03T10:00:00Z",
  "path": "/api/v1/common-codes",
  "status": 500
}
```

#### 예외 처리 규칙
1. **500 Internal Server Error**: 예상치 못한 서버 오류
   - 모든 예외는 GlobalExceptionHandler에서 처리
   - 로그에 상세 정보 기록
   - 클라이언트에는 일반적인 오류 메시지만 반환

2. **400 Bad Request**: 잘못된 요청
   - 파라미터 검증 실패
   - 형식 오류 (예: 잘못된 날짜 형식)

3. **401 Unauthorized**: 인증 실패
   - 로그인되지 않은 사용자
   - 세션 만료

4. **403 Forbidden**: 권한 없음
   - 로그인은 되었지만 접근 권한이 없는 경우
   - 테넌트 격리 위반

5. **404 Not Found**: 리소스 없음
   - 존재하지 않는 엔티티 조회
   - 잘못된 경로

---

## 📋 API 파라미터 처리 표준

### 1. 공통코드 API 파라미터 검증

#### 문제 상황
```
/api/v1/common-codes?codeGroup=NOTIFICATION_TYPE:1
```
- 잘못된 파라미터 형식 (`:1` 붙음)
- 프록시나 프론트엔드에서 잘못된 값 전달 가능

#### 해결 방법
```java
@GetMapping
public ResponseEntity<ApiResponse<CommonCodeListResponse>> findAll(
        @RequestParam(required = false) String codeGroup) {
    
    // 파라미터 정제 및 검증
    if (codeGroup != null) {
        // 콜론(:) 이후 제거 (잘못된 형식 처리)
        if (codeGroup.contains(":")) {
            codeGroup = codeGroup.split(":")[0];
            log.warn("⚠️ 잘못된 codeGroup 파라미터 형식 감지. 정제 후 사용: {}", codeGroup);
        }
        
        // 공백 제거 및 대문자 변환
        codeGroup = codeGroup.trim().toUpperCase();
        
        // 빈 문자열 체크
        if (codeGroup.isEmpty()) {
            codeGroup = null;
        }
    }
    
    log.info("공통코드 목록 조회 요청: codeGroup={}", codeGroup);
    
    try {
        CommonCodeListResponse response = commonCodeService.findAll(codeGroup);
        log.info("공통코드 목록 조회 완료: totalCount={}", response.getTotalCount());
        return success(response);
    } catch (Exception e) {
        log.error("❌ 공통코드 목록 조회 실패: codeGroup={}", codeGroup, e);
        throw new RuntimeException("공통코드 조회 중 오류가 발생했습니다.", e);
    }
}
```

---

## 🔧 OAuth2 Config API 오류 처리

### 1. getBaseUrlFromRequest 메서드 개선

#### 문제 상황
- 500 Internal Server Error 발생
- 중괄호 불일치로 인한 컴파일 오류 가능성

#### 해결 방법
```java
private String getBaseUrlFromRequest(HttpServletRequest request) {
    // 1. 환경변수가 설정되어 있으면 우선 사용
    if (oauth2BaseUrl != null && !oauth2BaseUrl.isEmpty()) {
        log.debug("OAuth2 BaseUrl (환경변수): {}", oauth2BaseUrl);
        return oauth2BaseUrl;
    }
    
    // 2. 요청에서 동적으로 생성 (프록시 헤더 고려)
    String scheme = request.getHeader("X-Forwarded-Proto");
    if (scheme == null || scheme.isEmpty()) {
        scheme = request.getScheme();
    }
    
    String serverName = request.getHeader("X-Forwarded-Host");
    if (serverName == null || serverName.isEmpty()) {
        serverName = request.getHeader("Host");
    }
    if (serverName == null || serverName.isEmpty()) {
        serverName = request.getServerName();
    }
    
    // 포트 제거 (X-Forwarded-Host에 포트가 포함되어 있을 수 있음)
    if (serverName != null && serverName.contains(":")) {
        serverName = serverName.split(":")[0];
    }
    
    int serverPort = request.getServerPort();
    
    // 개발 환경 (localhost)
    if ("localhost".equals(serverName) || "127.0.0.1".equals(serverName)) {
        if (serverPort == 80 || serverPort == 443) {
            return scheme + "://" + serverName;
        } else {
            return scheme + "://" + serverName + ":" + serverPort;
        }
    }
    
    // 운영/개발 환경 (실제 도메인)
    if ("https".equals(scheme)) {
        return scheme + "://" + serverName;
    } else {
        if (serverPort == 80 || serverPort == 443) {
            return scheme + "://" + serverName;
        } else {
            return scheme + "://" + serverName + ":" + serverPort;
        }
    }
}
```

### 2. 예외 처리 추가
```java
@GetMapping("/oauth2")
public ResponseEntity<Map<String, Object>> getOAuth2Config(HttpServletRequest request) {
    try {
        String baseUrl = getBaseUrlFromRequest(request);
        
        log.info("OAuth2 설정 정보 요청 - 서버 포트: {}", serverPort);
        
        // 동적 baseUrl을 사용해서 리다이렉트 URI 생성
        String dynamicKakaoRedirectUri = baseUrl + "/api/auth/kakao/callback";
        String dynamicNaverRedirectUri = baseUrl + "/api/auth/naver/callback";
        
        Map<String, Object> config = Map.of(
            "kakao", Map.of(
                "clientId", kakaoClientId != null ? kakaoClientId : "dummy",
                "redirectUri", dynamicKakaoRedirectUri,
                "authUrl", "https://kauth.kakao.com/oauth/authorize"
            ),
            "naver", Map.of(
                "clientId", naverClientId != null ? naverClientId : "dummy",
                "redirectUri", dynamicNaverRedirectUri,
                "authUrl", "https://nid.naver.com/oauth2.0/authorize"
            )
        );
        
        log.info("OAuth2 설정 반환: {}", config);
        return ResponseEntity.ok(config);
    } catch (Exception e) {
        log.error("❌ OAuth2 설정 조회 실패", e);
        // 기본값 반환 (오류 시에도 프론트엔드가 동작하도록)
        Map<String, Object> fallbackConfig = Map.of(
            "kakao", Map.of(
                "clientId", "dummy",
                "redirectUri", "http://localhost:8080/api/auth/kakao/callback",
                "authUrl", "https://kauth.kakao.com/oauth/authorize"
            ),
            "naver", Map.of(
                "clientId", "dummy",
                "redirectUri", "http://localhost:8080/api/auth/naver/callback",
                "authUrl", "https://nid.naver.com/oauth2.0/authorize"
            )
        );
        return ResponseEntity.ok(fallbackConfig);
    }
}
```

---

## 🎨 CSS 테마 API 오류 처리

### 1. getConsultantColors 예외 처리 개선

#### 문제 상황
- 500 Internal Server Error 발생
- `getThemeColorsByCategory` 메서드에서 예외 발생 가능

#### 해결 방법
```java
@GetMapping("/consultant-colors")
public ResponseEntity<ApiResponse<Map<String, Object>>> getConsultantColors(
        @RequestParam(defaultValue = "default") String themeName) {
    log.info("🎨 상담사별 색상 조회: {}", themeName);
    
    // 기본 색상 (fallback)
    List<String> defaultColors = java.util.Arrays.asList(
        "#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6",
        "#06b6d4", "#84cc16", "#f97316", "#ec4899", "#6366f1"
    );
    
    List<String> colors;
    try {
        // CONSULTANT 카테고리의 색상들 조회
        List<CssColorSettings> consultantColors = cssThemeService.getThemeColorsByCategory(themeName, "CONSULTANT");
        
        // 색상 배열로 변환
        colors = consultantColors.stream()
            .map(CssColorSettings::getColorValue)
            .filter(color -> color != null && !color.trim().isEmpty())
            .collect(java.util.stream.Collectors.toList());
        
        // 기본 색상이 없는 경우 fallback 색상 제공
        if (colors.isEmpty()) {
            log.warn("⚠️ 상담사별 색상이 없어 기본 색상을 사용합니다: themeName={}", themeName);
            colors = defaultColors;
        }
    } catch (Exception e) {
        log.error("❌ 상담사별 색상 조회 실패: themeName={}", themeName, e);
        
        // 에러 시 기본 색상 반환
        colors = defaultColors;
        themeName = "default";
    }
    
    Map<String, Object> data = new HashMap<>();
    data.put("themeName", themeName);
    data.put("colors", colors);
    data.put("count", colors.size());
    
    return success("상담사별 색상을 성공적으로 조회했습니다.", data);
}
```

---

## 🌐 프론트엔드 오류 처리 표준

### 1. API 호출 오류 처리

#### ajax.js 표준화
```javascript
export const apiGet = async (endpoint, params = {}, options = {}) => {
  try {
    // URL 생성 및 파라미터 추가
    const url = new URL(endpoint, window.location.origin);
    Object.keys(params).forEach(key => {
      if (params[key] != null) {
        url.searchParams.append(key, params[key]);
      }
    });
    
    const response = await fetch(url, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    });
    
    // 응답 본문 파싱
    let jsonData = {};
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      try {
        jsonData = await response.json();
      } catch (parseError) {
        log.warn('JSON 파싱 실패, 빈 객체 사용');
        jsonData = {};
      }
    }
    
    // 오류 상태 코드 처리
    if (!response.ok) {
      // 세션 체크 및 리다이렉트
      if (response.status === 401) {
        window.location.href = '/login';
        return null;
      }
      
      // 403 오류는 권한 문제이므로 조용히 처리
      if (response.status === 403) {
        const error = new Error('접근 권한이 없습니다.');
        error.status = 403;
        throw error;
      }
      
      // 404 오류는 리소스가 없을 수 있으므로 조용히 null 반환
      if (response.status === 404) {
        return null;
      }
      
      // 500 오류 처리
      if (response.status >= 500) {
        log.error('서버 오류:', {
          status: response.status,
          statusText: response.statusText,
          url: url.toString(),
          response: jsonData
        });
        throw new Error(jsonData.message || '서버 오류가 발생했습니다.');
      }
      
      // 기타 4xx 오류
      throw new Error(jsonData.message || '요청 오류가 발생했습니다.');
    }
    
    // ApiResponse 래퍼 처리
    if (jsonData && typeof jsonData === 'object' && 'success' in jsonData && 'data' in jsonData) {
      return jsonData.data;
    }
    
    return jsonData;
  } catch (error) {
    // 403 오류는 권한 문제이므로 조용히 처리 (콘솔 오류 표시 안 함)
    if (error.status === 403) {
      return null;
    }
    
    // 네트워크 오류 처리
    if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
      log.error('네트워크 오류 (서버 연결 실패):', endpoint);
      // 조용히 처리 (서버가 실행되지 않은 경우)
      return null;
    }
    
    log.error('API 호출 실패:', {
      endpoint,
      error: error.message,
      status: error.status
    });
    
    throw error;
  }
};
```

### 2. API 캐시 오류 처리

#### apiCache.js 표준화
```javascript
export const cachedApiCall = async (url, options = {}, ttl = 300000) => {
  try {
    // 캐시 확인
    const cacheKey = `api_cache_${url}`;
    const cached = getFromCache(cacheKey);
    if (cached) {
      return cached;
    }
    
    // API 호출
    const response = await apiGet(url, {}, options);
    
    // 캐시 저장
    setToCache(cacheKey, response, ttl);
    
    return response;
  } catch (error) {
    // 오류 발생 시 조용히 처리
    log.warn('API 캐시 호출 실패:', url, error.message);
    
    // 네트워크 오류는 조용히 무시
    if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
      return null;
    }
    
    throw error;
  }
};
```

---

## ✅ 체크리스트

### 백엔드 API 개발 시
- [ ] 모든 파라미터 검증 및 정제
- [ ] 예외 상황에 대한 적절한 HTTP 상태 코드 반환
- [ ] 오류 로그 기록 (상세 정보)
- [ ] 클라이언트에는 일반적인 오류 메시지만 반환
- [ ] GlobalExceptionHandler에서 중앙 처리
- [ ] 표준 응답 형식 준수

### 프론트엔드 API 호출 시
- [ ] 모든 API 호출에 try-catch 적용
- [ ] 네트워크 오류 조용히 처리
- [ ] 403/404 오류는 조용히 처리
- [ ] 500 오류는 로그만 기록
- [ ] 사용자에게는 친화적인 메시지 표시
- [ ] API 응답 형식 다양성 처리

---

## 🚫 금지 사항

### 1. 예외를 그대로 전달
```java
// ❌ 금지
@GetMapping("/api/v1/test")
public ResponseEntity<?> test() {
    return ResponseEntity.ok(someService.doSomething());
}

// ✅ 권장
@GetMapping("/api/v1/test")
public ResponseEntity<ApiResponse<?>> test() {
    try {
        Object result = someService.doSomething();
        return success(result);
    } catch (Exception e) {
        log.error("오류 발생", e);
        throw e; // GlobalExceptionHandler에서 처리
    }
}
```

### 2. 클라이언트에 상세 오류 노출
```java
// ❌ 금지
throw new RuntimeException("SQL Error: SELECT * FROM users WHERE id = " + userId);

// ✅ 권장
log.error("사용자 조회 실패: userId={}", userId, e);
throw new RuntimeException("사용자 정보를 조회할 수 없습니다.");
```

### 3. 프론트엔드에서 오류 무시
```javascript
// ❌ 금지
const response = await fetch('/api/v1/users');
const data = await response.json(); // 오류 발생 가능

// ✅ 권장
try {
    const response = await apiGet('/api/v1/users');
    if (!response) {
        // 조용히 처리
        return;
    }
    // 처리
} catch (error) {
    log.error('사용자 조회 실패:', error);
    // 사용자에게 친화적인 메시지 표시
}
```

---

## 📞 문의

API 오류 처리 표준 관련 문의:
- 백엔드 팀
- 프론트엔드 팀
- 아키텍처 팀

**최종 업데이트**: 2025-12-03

