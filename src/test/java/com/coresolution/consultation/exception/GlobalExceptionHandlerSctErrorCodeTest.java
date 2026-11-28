package com.coresolution.consultation.exception;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.coresolution.consultation.constant.ApiRequestErrorMessages;
import com.coresolution.consultation.sct.exception.SctGoneException;
import com.coresolution.core.dto.ErrorResponse;
import com.coresolution.consultation.sct.exception.SctLinkCancelledException;
import com.coresolution.consultation.sct.exception.SctLinkReissuedException;
import com.coresolution.consultation.sct.exception.SctOtpLockedException;
import com.coresolution.consultation.sct.exception.SctOtpRateLimitedException;
import java.util.Map;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.mock.web.MockHttpServletRequest;

/**
 * SCT 공개 화면 오류 코드·문구 계약 — 취소/만료 분리, 영문 세션 예외 비노출, 429 남은 대기 시간.
 *
 * @author MindGarden
 * @since 2026-11-28
 */
class GlobalExceptionHandlerSctErrorCodeTest {

    private final GlobalExceptionHandler handler = new GlobalExceptionHandler();

    private static MockHttpServletRequest request() {
        return new MockHttpServletRequest("POST", "/api/v1/public/sct/x/otp/send");
    }

    @Test
    @DisplayName("취소된 링크 → 410 SCT_LINK_CANCELLED (기한 만료 SCT_GONE 과 구분)")
    void cancelledVsExpired() {
        ResponseEntity<ErrorResponse> cancelled =
                handler.handleSctLinkCancelled(new SctLinkCancelledException("취소"), request());
        assertEquals(HttpStatus.GONE, cancelled.getStatusCode());
        assertEquals("SCT_LINK_CANCELLED", cancelled.getBody().getErrorCode());

        ResponseEntity<ErrorResponse> expired = handler.handleSctGone(
                SctGoneException.forInvitationStatus("EXPIRED"), request());
        assertEquals(HttpStatus.GONE, expired.getStatusCode());
        assertFalse("SCT_LINK_CANCELLED".equals(expired.getBody().getErrorCode()));

        assertTrue(SctGoneException.forInvitationStatus("CANCELLED") instanceof SctLinkCancelledException);
        assertFalse(SctGoneException.forInvitationStatus("EXPIRED") instanceof SctLinkCancelledException);
    }

    @Test
    @DisplayName("재발급으로 닫힌 링크 → 410 SCT_LINK_REISSUED (만료·취소와 구분)")
    void reissuedIsDistinct() {
        ResponseEntity<ErrorResponse> res = handler.handleSctLinkReissued(
                new SctLinkReissuedException(
                        com.coresolution.consultation.sct.constant.SctConstants.MSG_LINK_REISSUED),
                request());
        assertEquals(HttpStatus.GONE, res.getStatusCode());
        assertEquals("SCT_LINK_REISSUED", res.getBody().getErrorCode());
        assertFalse(res.getBody().getMessage().contains("만료되었거나 취소"));
    }

    @Test
    @DisplayName("Session was invalidated 영문 원문은 응답에 없고 한글 문구 + SESSION_INVALIDATED")
    void sessionInvalidatedIsKorean() {
        ResponseEntity<ErrorResponse> res = handler.handleIllegalState(
                new IllegalStateException("Session was invalidated"), request());
        assertEquals(HttpStatus.BAD_REQUEST, res.getStatusCode());
        assertEquals("SESSION_INVALIDATED", res.getBody().getErrorCode());
        assertEquals(ApiRequestErrorMessages.SESSION_INVALIDATED, res.getBody().getMessage());
        assertFalse(res.getBody().getMessage().contains("Session was invalidated"));
    }

    @Test
    @DisplayName("OTP 429 — retryAfterSeconds 본문 + Retry-After 헤더")
    void rateLimitedCarriesRetryAfter() {
        ResponseEntity<Map<String, Object>> res = handler.handleSctOtpRateLimited(
                new SctOtpRateLimitedException("요청이 너무 많습니다.", 125L), request());
        assertEquals(HttpStatus.TOO_MANY_REQUESTS, res.getStatusCode());
        assertEquals("SCT_OTP_RATE_LIMITED", res.getBody().get("errorCode"));
        @SuppressWarnings("unchecked")
        Map<String, Object> data = (Map<String, Object>) res.getBody().get("data");
        assertEquals(125L, data.get("retryAfterSeconds"));
        assertEquals("125", res.getHeaders().getFirst(HttpHeaders.RETRY_AFTER));
    }

    @Test
    @DisplayName("OTP 잠금 429 — 남은 시간 없으면 data 생략")
    void lockedWithoutRetryAfter() {
        ResponseEntity<Map<String, Object>> res = handler.handleSctOtpLocked(
                new SctOtpLockedException("잠금"), request());
        assertEquals(HttpStatus.TOO_MANY_REQUESTS, res.getStatusCode());
        assertNotNull(res.getBody().get("errorCode"));
        assertNull(res.getBody().get("data"));
        assertNull(res.getHeaders().getFirst(HttpHeaders.RETRY_AFTER));
    }
}
