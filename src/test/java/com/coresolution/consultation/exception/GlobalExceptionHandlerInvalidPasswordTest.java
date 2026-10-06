package com.coresolution.consultation.exception;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.coresolution.consultation.util.ServerErrorResponses;
import com.coresolution.core.dto.ErrorResponse;
import com.coresolution.core.security.PasswordPolicy;
import com.coresolution.core.security.PasswordService;
import jakarta.servlet.http.HttpServletRequest;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.method.annotation.ExceptionHandlerMethodResolver;

/**
 * {@link GlobalExceptionHandler#handleInvalidPassword} — 비밀번호 정책 위반 400 매핑.
 *
 * @author CoreSolution
 * @since 2026-10-06
 */
@DisplayName("GlobalExceptionHandler — InvalidPassword 400 매핑")
class GlobalExceptionHandlerInvalidPasswordTest {

    private static final String NO_UPPERCASE = "noupper1!";

    private final GlobalExceptionHandler handler = new GlobalExceptionHandler();

    @Test
    @DisplayName("대문자 없는 비밀번호 정책 문구를 HTTP 400 + INVALID_PASSWORD 로 돌려준다")
    void mapsPolicyMessageToBadRequest() {
        String policyMessage = PasswordPolicy.firstLoginStorageViolationMessage(NO_UPPERCASE);
        assertThat(policyMessage).isEqualTo("비밀번호는 최소 1개의 대문자를 포함해야 합니다.");

        HttpServletRequest request = Mockito.mock(HttpServletRequest.class);
        Mockito.when(request.getRequestURI()).thenReturn("/api/v1/admin/consultants");
        Mockito.when(request.getMethod()).thenReturn("POST");

        PasswordService.InvalidPasswordException ex =
                new PasswordService.InvalidPasswordException(policyMessage);

        ResponseEntity<ErrorResponse> response = handler.handleInvalidPassword(ex, request);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().getStatus()).isEqualTo(400);
        assertThat(response.getBody().getErrorCode())
                .isEqualTo(PasswordService.InvalidPasswordException.ERROR_CODE);
        assertThat(response.getBody().getMessage()).isEqualTo(policyMessage);
        assertThat(response.getBody().isSuccess()).isFalse();
        assertThat(response.getBody().getPath()).isEqualTo("/api/v1/admin/consultants");
        assertThat(response.getBody().getMethod()).isEqualTo("POST");
        assertThat(response.getBody().getTraceId()).isNull();
    }

    @Test
    @DisplayName("RuntimeException 500 핸들러가 정책 위반 400 을 가로채지 않는다")
    void resolverPrefersInvalidPasswordOverRuntime() {
        ExceptionHandlerMethodResolver resolver = new ExceptionHandlerMethodResolver(GlobalExceptionHandler.class);
        PasswordService.InvalidPasswordException ex = new PasswordService.InvalidPasswordException(
                PasswordPolicy.firstLoginStorageViolationMessage(NO_UPPERCASE));

        assertThat(resolver.resolveMethod(ex).getName()).isEqualTo("handleInvalidPassword");
    }

    @Test
    @DisplayName("ServerErrorResponses 는 정책 위반을 500 으로 덮지 않고 다시 던진다")
    void serverErrorResponsesRethrowsInvalidPassword() {
        PasswordService.InvalidPasswordException ex = new PasswordService.InvalidPasswordException(
                PasswordPolicy.firstLoginStorageViolationMessage(NO_UPPERCASE));

        assertThat(ServerErrorResponses.isMappedBusinessException(ex)).isTrue();
        assertThatThrownBy(() -> ServerErrorResponses.internalError("상담사 등록", ex)).isSameAs(ex);
    }
}
