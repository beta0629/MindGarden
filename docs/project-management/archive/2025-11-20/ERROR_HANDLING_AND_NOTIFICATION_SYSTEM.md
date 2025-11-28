# 에러 처리 및 알림 시스템 구현 문서

**작성일**: 2025-11-20  
**최종 업데이트**: 2025-11-20  
**상태**: 완료 ✅

---

## 📋 개요

Ops Portal에서 발생하는 API 오류를 적절히 처리하고, 사용자에게 공통 알림을 표시하는 시스템을 구현했습니다.

---

## ✅ 구현 완료 항목

### 1. 백엔드: AccessDeniedException 처리

**파일**: `src/main/java/com/coresolution/consultation/exception/GlobalExceptionHandler.java`

**변경 사항**:
- `AccessDeniedException` 핸들러 추가
- 403 Forbidden 상태 코드 반환
- "접근 권한이 없습니다." 메시지 반환

**코드**:
```java
/**
 * AccessDeniedException 처리 (권한 없음)
 * HTTP 403 Forbidden 응답
 * 공통 알림 시스템 사용: "접근 권한이 없습니다."
 */
@ExceptionHandler(AccessDeniedException.class)
public ResponseEntity<ErrorResponse> handleAccessDenied(AccessDeniedException e, HttpServletRequest request) {
    log.warn("Access denied: path={}, message={}", request.getRequestURI(), e.getMessage());
    
    ErrorResponse error = ErrorResponse.of(
        "접근 권한이 없습니다.",
        "ACCESS_DENIED",
        HttpStatus.FORBIDDEN.value(),
        request.getRequestURI(),
        request.getMethod()
    );
    
    return ResponseEntity.status(HttpStatus.FORBIDDEN).body(error);
}
```

---

### 2. 프론트엔드: 전역 공통 알림 시스템

#### 2.1 NotificationManager 유틸리티

**파일**: `frontend-ops/src/utils/notification.ts`

**기능**:
- 싱글톤 알림 매니저
- `success`, `error`, `warning`, `info` 메서드 제공
- 리스너 패턴으로 알림 전파

**사용 예시**:
```typescript
import notificationManager from "@/utils/notification";

// 성공 알림
notificationManager.success("작업이 완료되었습니다.");

// 오류 알림
notificationManager.error("접근 권한이 없습니다.");

// 경고 알림
notificationManager.warning("주의가 필요합니다.");

// 정보 알림
notificationManager.info("알림 메시지입니다.");
```

#### 2.2 GlobalNotification 컴포넌트

**파일**: 
- `frontend-ops/src/components/common/GlobalNotification.tsx`
- `frontend-ops/src/components/common/GlobalNotification.css`

**기능**:
- 전역 알림 표시 컴포넌트
- 우측 상단에 토스트 형태로 표시
- 자동 닫기 및 수동 닫기 지원
- 타입별 스타일링 (success, error, warning, info)

**레이아웃 통합**:
- `frontend-ops/app/layout.tsx`에 추가되어 모든 페이지에서 표시

#### 2.3 API 클라이언트 자동 알림

**파일**: `frontend-ops/src/services/clientApi.ts`

**변경 사항**:
- 403 Forbidden 오류 시 자동 알림 표시
- 401 Unauthorized 오류 시 자동 알림 표시
- 기타 API 오류 시 자동 알림 표시

**코드**:
```typescript
if (!response.ok) {
  const body = await safeParseJson(response);
  
  // 403 Forbidden (권한 없음) 처리
  if (response.status === 403) {
    const errorMessage = (body as { message?: string })?.message || "접근 권한이 없습니다.";
    // 공통 알림 표시
    notificationManager.error(errorMessage);
    const error = new Error(errorMessage);
    (error as any).status = 403;
    (error as any).body = body;
    throw error;
  }
  
  // 401 Unauthorized 처리
  if (response.status === 401) {
    const errorMessage = (body as { message?: string })?.message || "인증이 필요합니다.";
    notificationManager.error(errorMessage);
    const error = new Error(errorMessage);
    (error as any).status = 401;
    (error as any).body = body;
    throw error;
  }
  
  // 기타 오류 처리
  const errorMessage = (body as { message?: string })?.message || 
    `API 요청 실패 (${response.status} ${response.statusText})`;
  notificationManager.error(errorMessage);
  
  throw new Error(...);
}
```

---

## 🎯 동작 방식

### 1. 권한 오류 발생 시

1. **백엔드**: `@PreAuthorize`로 권한 체크 실패 시 `AccessDeniedException` 발생
2. **백엔드**: `GlobalExceptionHandler`가 403 Forbidden 응답 반환
3. **프론트엔드**: `clientApi.ts`에서 403 상태 코드 감지
4. **프론트엔드**: `notificationManager.error()` 호출하여 알림 표시
5. **프론트엔드**: `GlobalNotification` 컴포넌트가 우측 상단에 토스트 표시

### 2. 기타 API 오류 발생 시

1. **프론트엔드**: `clientApi.ts`에서 `response.ok === false` 감지
2. **프론트엔드**: 에러 메시지 추출 후 `notificationManager.error()` 호출
3. **프론트엔드**: `GlobalNotification` 컴포넌트가 알림 표시

---

## 📁 파일 목록

### 백엔드
- `src/main/java/com/coresolution/consultation/exception/GlobalExceptionHandler.java` (수정)

### 프론트엔드
- `frontend-ops/src/utils/notification.ts` (신규)
- `frontend-ops/src/components/common/GlobalNotification.tsx` (신규)
- `frontend-ops/src/components/common/GlobalNotification.css` (신규)
- `frontend-ops/src/services/clientApi.ts` (수정)
- `frontend-ops/src/services/apiClient.ts` (수정 - 403 처리 추가)
- `frontend-ops/src/constants/httpStatus.ts` (수정 - HTTP_STATUS_FORBIDDEN 추가)
- `frontend-ops/app/layout.tsx` (수정 - GlobalNotification 추가)
- `frontend-ops/app/onboarding/[id]/page.tsx` (수정 - 403 에러 처리)

---

## 🧪 테스트 방법

### 1. 권한 오류 테스트

1. Ops Portal에 로그인하지 않은 상태로 접근
2. `/onboarding/1` 같은 보호된 페이지 접근
3. 403 Forbidden 응답 확인
4. 우측 상단에 "접근 권한이 없습니다." 알림 표시 확인

### 2. 인증 오류 테스트

1. 만료된 토큰으로 API 호출
2. 401 Unauthorized 응답 확인
3. 우측 상단에 "인증이 필요합니다." 알림 표시 확인

### 3. 기타 오류 테스트

1. 존재하지 않는 리소스 접근
2. 404 또는 500 오류 발생
3. 우측 상단에 에러 메시지 알림 표시 확인

---

## 📝 참고 사항

### 서버 사이드 vs 클라이언트 사이드

- **서버 사이드** (`apiClient.ts`): Next.js 서버 컴포넌트에서 사용. 알림을 표시할 수 없으므로 에러만 throw
- **클라이언트 사이드** (`clientApi.ts`): 브라우저에서 실행. 알림 자동 표시

### 알림 타입

- `success`: 녹색 배경, ✓ 아이콘
- `error`: 빨간색 배경, ✕ 아이콘
- `warning`: 주황색 배경, ⚠ 아이콘
- `info`: 파란색 배경, ℹ 아이콘

### 알림 지속 시간

- `success`: 3초
- `error`: 5초
- `warning`: 4초
- `info`: 3초

---

## 🔄 향후 개선 사항

- [ ] 알림 스택 관리 (여러 알림 동시 표시)
- [ ] 알림 위치 설정 (우측 상단 외 다른 위치)
- [ ] 알림 애니메이션 개선
- [ ] 알림 클릭 시 상세 정보 표시
- [ ] 알림 히스토리 저장 (선택적)

---

## ✅ 체크리스트

- [x] 백엔드 `AccessDeniedException` 핸들러 추가
- [x] 프론트엔드 `notificationManager` 유틸리티 구현
- [x] 프론트엔드 `GlobalNotification` 컴포넌트 구현
- [x] `clientApi.ts`에서 자동 알림 표시 구현
- [x] `layout.tsx`에 전역 알림 추가
- [x] 403, 401 오류 처리 확인
- [x] 문서 작성

---

**작성자**: CoreSolution 개발팀  
**검토자**: -  
**승인자**: -

