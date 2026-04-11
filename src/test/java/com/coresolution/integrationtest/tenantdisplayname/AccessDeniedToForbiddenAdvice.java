package com.coresolution.integrationtest.tenantdisplayname;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

/**
 * {@code addFilters = false}이면 서블릿 필터가 AccessDenied를 403으로 바꾸지 않으므로,
 * 메서드 시큐리티 거부를 HTTP 403으로 매핑한다.
 */
@RestControllerAdvice
class AccessDeniedToForbiddenAdvice {

    @ExceptionHandler(AccessDeniedException.class)
    ResponseEntity<Void> onAccessDenied() {
        return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
    }
}
