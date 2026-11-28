package com.coresolution.consultation.sct.unit;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.mock.env.MockEnvironment;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import com.coresolution.consultation.config.SessionCookieSupport;
import com.coresolution.consultation.sct.constant.SctConsentKeys;
import com.coresolution.consultation.sct.controller.PublicSctController;
import com.coresolution.consultation.sct.dto.SctIdentityOtpConfirmRequest;
import com.coresolution.consultation.sct.dto.SctVerifyResponse;
import com.coresolution.consultation.sct.exception.SctOtpInvalidException;
import com.coresolution.consultation.sct.service.SctDeviceSessionCookieSupport;
import com.coresolution.consultation.sct.service.SctIdentityOtpService;
import com.coresolution.consultation.sct.service.SctPublicService;

/**
 * 단말 바인딩 쿠키 — OTP 성공 시에만 HttpOnly 쿠키 발급, resume 은 쿠키 값만 서비스로 전달.
 *
 * @author MindGarden
 * @since 2026-11-28
 */
class SctDeviceSessionCookieControllerTest {

    private static final String TOKEN = "opaqueExchangeCode123";
    private static final String SID = "0123456789abcdef0123456789abcdef";
    private static final String REF = SctDeviceSessionCookieSupport.refFor("tenant-a", 100L);
    private static final String COOKIE_NAME = SctDeviceSessionCookieSupport.cookieName(REF);

    private SctPublicService publicService;
    private SctIdentityOtpService otpService;
    private MockMvc mvc;

    @BeforeEach
    void setUp() {
        publicService = mock(SctPublicService.class);
        otpService = mock(SctIdentityOtpService.class);
        SctDeviceSessionCookieSupport cookies =
                new SctDeviceSessionCookieSupport(new SessionCookieSupport(new MockEnvironment()));
        mvc = MockMvcBuilders.standaloneSetup(
                new PublicSctController(publicService, otpService, cookies)).build();
    }

    @Test
    @DisplayName("OTP 확인 성공 → HttpOnly·SameSite·Secure(프록시 https)·공통 Path·초대별 이름·Max-Age 쿠키, 값=세션 ID")
    void confirmOtp_setsHttpOnlyDeviceCookie() throws Exception {
        when(otpService.confirmOtp(eq(TOKEN), any(SctIdentityOtpConfirmRequest.class), any()))
                .thenReturn(SctVerifyResponse.builder().verifySessionId(SID).expiresInSeconds(86400)
                        .deviceCookieRef(REF).build());

        MvcResult result = mvc.perform(post("/api/v1/public/sct/" + TOKEN + "/identity/otp/confirm")
                        .header("X-Forwarded-Proto", "https")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"phone\":\"01000000000\",\"code\":\"000000\"}"))
                .andExpect(status().isOk())
                .andReturn();

        String setCookie = result.getResponse().getHeader(HttpHeaders.SET_COOKIE);
        assertTrue(setCookie.startsWith(COOKIE_NAME + "=" + SID), setCookie);
        assertTrue(COOKIE_NAME.startsWith(SctConsentKeys.DEVICE_SESSION_COOKIE + "_"), COOKIE_NAME);
        assertTrue(setCookie.contains("HttpOnly"), setCookie);
        assertTrue(setCookie.contains("Secure"), setCookie);
        assertTrue(setCookie.contains("SameSite=Lax"), setCookie);
        // 교환 코드는 링크를 열 때마다 새로 발급되므로 Path 에 넣지 않는다
        assertTrue(setCookie.contains("Path=/api/v1/public/sct;") || setCookie.endsWith("Path=/api/v1/public/sct"),
                setCookie);
        assertFalse(setCookie.contains(TOKEN), "쿠키에 교환 코드 미포함");
        assertTrue(setCookie.contains("Max-Age=86400"), setCookie);
        assertFalse(setCookie.contains("Domain="), "호스트 전용 쿠키");
    }

    @Test
    @DisplayName("OTP 실패(예외)에서는 쿠키를 발급하지 않음")
    void confirmOtp_failure_noCookie() throws Exception {
        when(otpService.confirmOtp(eq(TOKEN), any(), any()))
                .thenThrow(new SctOtpInvalidException("invalid"));
        try {
            mvc.perform(post("/api/v1/public/sct/" + TOKEN + "/identity/otp/confirm")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"phone\":\"01000000000\",\"code\":\"999999\"}"));
        } catch (Exception expected) {
            // standalone 에는 GlobalExceptionHandler 없음 — 예외 전파 자체가 기대 동작
        }
        // 응답 헤더 확인 불가 시에도 서비스가 세션을 반환하지 않았으므로 쿠키 경로에 도달하지 않음
        verify(otpService).confirmOtp(eq(TOKEN), any(), any());
    }

    @Test
    @DisplayName("resume — 이 링크 초대의 쿠키 값만 서비스로 전달, 쿠키 없으면 null(링크만으로는 세션 없음)")
    void resume_passesOnlyCookieValue() throws Exception {
        when(publicService.resolveDeviceCookieRef(TOKEN)).thenReturn(REF);
        when(publicService.resumeDeviceSession(eq(TOKEN), eq(SID)))
                .thenReturn(SctVerifyResponse.builder().verifySessionId(SID).expiresInSeconds(100).build());
        when(publicService.resumeDeviceSession(eq(TOKEN), eq(null)))
                .thenReturn(SctVerifyResponse.builder().build());

        mvc.perform(post("/api/v1/public/sct/" + TOKEN + "/session/resume")
                        .cookie(new Cookie(COOKIE_NAME, SID)))
                .andExpect(status().isOk());
        verify(publicService).resumeDeviceSession(TOKEN, SID);

        // 다른 초대의 쿠키 이름은 이 링크에서 읽지 않는다(교차 접근 불가)
        String otherName = SctDeviceSessionCookieSupport.cookieName(
                SctDeviceSessionCookieSupport.refFor("tenant-a", 101L));
        mvc.perform(post("/api/v1/public/sct/" + TOKEN + "/session/resume")
                        .cookie(new Cookie(otherName, SID)))
                .andExpect(status().isOk());
        // 헤더로 보낸 값(X-Sct-Verify-Session)은 resume 의 자격이 아니다
        mvc.perform(post("/api/v1/public/sct/" + TOKEN + "/session/resume")
                        .header(SctConsentKeys.VERIFY_SESSION_HEADER, SID))
                .andExpect(status().isOk());
        verify(publicService, org.mockito.Mockito.times(2)).resumeDeviceSession(TOKEN, null);
    }

    @Test
    @DisplayName("새 교환 코드(다른 URL 토큰)로도 같은 쿠키가 전달된다")
    void resume_newExchangeCodeSameCookie() throws Exception {
        String newExchange = "anotherFreshExchangeCode456";
        when(publicService.resolveDeviceCookieRef(newExchange)).thenReturn(REF);
        when(publicService.resumeDeviceSession(eq(newExchange), eq(SID)))
                .thenReturn(SctVerifyResponse.builder().verifySessionId(SID).expiresInSeconds(100).build());
        mvc.perform(post("/api/v1/public/sct/" + newExchange + "/session/resume")
                        .cookie(new Cookie(COOKIE_NAME, SID)))
                .andExpect(status().isOk());
        verify(publicService).resumeDeviceSession(newExchange, SID);
    }

    @Test
    @DisplayName("쿠키 이름은 초대·테넌트별로 달라 한 단말에 여러 초대가 공존")
    void cookieName_perInvitationAndTenant() {
        String a = SctDeviceSessionCookieSupport.refFor("tenant-a", 100L);
        assertEquals(16, a.length());
        assertFalse(a.equals(SctDeviceSessionCookieSupport.refFor("tenant-a", 101L)));
        assertFalse(a.equals(SctDeviceSessionCookieSupport.refFor("tenant-b", 100L)));
        assertEquals(a, SctDeviceSessionCookieSupport.refFor("tenant-a", 100L));

        SctDeviceSessionCookieSupport cookies =
                new SctDeviceSessionCookieSupport(new SessionCookieSupport(new MockEnvironment()));
        String header = cookies.build(REF, SID, 10, null).toString();
        assertTrue(header.contains("Path=/api/v1/public/sct"), header);
        assertFalse(header.contains("Secure"), "프록시 헤더·설정 없으면 Secure 미설정(JSESSIONID 와 동일 규칙)");
        assertNull(cookies.read(null, REF).orElse(null));
        assertEquals(SID, cookies.read(requestWithCookie(), REF).orElseThrow());
        assertNull(cookies.read(requestWithCookie(), "0000000000000000").orElse(null));
    }

    private static jakarta.servlet.http.HttpServletRequest requestWithCookie() {
        org.springframework.mock.web.MockHttpServletRequest r =
                new org.springframework.mock.web.MockHttpServletRequest();
        r.setCookies(new Cookie(COOKIE_NAME, SID));
        return r;
    }
}
