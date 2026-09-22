package com.coresolution.consultation.exception;

import static org.assertj.core.api.Assertions.assertThat;

import com.coresolution.consultation.constant.ShopRefundConstants;
import com.coresolution.core.dto.ErrorResponse;
import jakarta.servlet.http.HttpServletRequest;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

/**
 * {@link GlobalExceptionHandler#handleDataIntegrityViolation} —
 * 비이메일 unique 를 이메일 중복 UX 로 오매핑하지 않는지 검증.
 *
 * @author MindGarden
 * @since 2026-09-22
 */
@DisplayName("GlobalExceptionHandler — DataIntegrityViolation 매핑")
class GlobalExceptionHandlerDataIntegrityMappingTest {

    private final GlobalExceptionHandler handler = new GlobalExceptionHandler();

    @Test
    @DisplayName("financial_transactions unique — 이메일 문구 금지·일반 중복 메시지")
    void nonEmailUnique_notMappedToEmailAlreadyUsed() {
        DataIntegrityViolationException ex = new DataIntegrityViolationException(
                "could not execute statement; SQL [n/a]; constraint [uk_financial_transactions_dedupe]; "
                        + "Duplicate entry 't1-99-CONSULTANT_CLIENT_MAPPING-INCOME-0' for key "
                        + "'uk_financial_transactions_dedupe'");
        HttpServletRequest request = mockRequest("POST", "/api/v1/admin/mappings/1/confirm-deposit");

        ResponseEntity<ErrorResponse> response = handler.handleDataIntegrityViolation(ex, request);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        ErrorResponse body = response.getBody();
        assertThat(body).isNotNull();
        assertThat(body.getMessage()).isEqualTo(ShopRefundConstants.MSG_DATA_DUPLICATE_CONSTRAINT);
        assertThat(body.getMessage()).doesNotContain("이메일");
        assertThat(body.getErrorCode()).isEqualTo("DATA_INTEGRITY_VIOLATION");
    }

    @Test
    @DisplayName("환불 API unique — 환불 전용 메시지·코드 (이메일 금지)")
    void refundPathUnique_usesRefundSpecificMessage() {
        DataIntegrityViolationException ex = new DataIntegrityViolationException(
                "Duplicate entry for key 'uk_financial_transactions_dedupe'");
        HttpServletRequest request = mockRequest(
                "POST",
                "/api/v1/admin/shop/orders/92c500fa-54cd-478c-aeac-e8b0316e751b/refund");

        ResponseEntity<ErrorResponse> response = handler.handleDataIntegrityViolation(ex, request);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        ErrorResponse body = response.getBody();
        assertThat(body).isNotNull();
        assertThat(body.getMessage()).isEqualTo(ShopRefundConstants.MSG_REFUND_DATA_INTEGRITY);
        assertThat(body.getMessage()).doesNotContain("이메일");
        assertThat(body.getErrorCode()).isEqualTo(ShopRefundConstants.ERROR_CODE_DATA_INTEGRITY);
    }

    @Test
    @DisplayName("uk_users_email_tenant — 이미 등록된 이메일")
    void emailTenantUnique_mapsToRegisteredEmail() {
        DataIntegrityViolationException ex = new DataIntegrityViolationException(
                "Duplicate entry 'x' for key 'uk_users_email_tenant'");
        HttpServletRequest request = mockRequest("POST", "/api/v1/auth/register");

        ResponseEntity<ErrorResponse> response = handler.handleDataIntegrityViolation(ex, request);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().getMessage())
                .isEqualTo(ShopRefundConstants.MSG_EMAIL_ALREADY_REGISTERED);
    }

    @Test
    @DisplayName("ShopRefundClinicChainException — 409 + SHOP_REFUND_CLINIC_INCOMPLETE")
    void shopRefundClinicChain_mapsToConflict() {
        ShopRefundClinicChainException ex =
                new ShopRefundClinicChainException("order-1", true, new IllegalStateException("ERP EXPENSE failed"));
        HttpServletRequest request = mockRequest("POST", "/api/v1/admin/shop/orders/order-1/refund");

        ResponseEntity<ErrorResponse> response = handler.handleShopRefundClinicChain(ex, request);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
        ErrorResponse body = response.getBody();
        assertThat(body).isNotNull();
        assertThat(body.getErrorCode()).isEqualTo(ShopRefundConstants.ERROR_CODE_CLINIC_INCOMPLETE);
        assertThat(body.getMessage()).contains("order-1");
        assertThat(body.getMessage()).doesNotContain("이메일");
        assertThat(body.getMessage()).contains("reconcile-refund");
    }

    private static HttpServletRequest mockRequest(String method, String uri) {
        HttpServletRequest request = Mockito.mock(HttpServletRequest.class);
        Mockito.when(request.getRequestURI()).thenReturn(uri);
        Mockito.when(request.getMethod()).thenReturn(method);
        return request;
    }
}
