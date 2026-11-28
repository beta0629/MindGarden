package com.coresolution.consultation.sct.controller;

import com.coresolution.consultation.sct.constant.SctConsentKeys;
import com.coresolution.consultation.sct.constant.SctConstants;
import com.coresolution.consultation.sct.dto.SctConsentRequest;
import com.coresolution.consultation.sct.dto.SctIdentityOtpConfirmRequest;
import com.coresolution.consultation.sct.dto.SctIdentityOtpSendRequest;
import com.coresolution.consultation.sct.dto.SctIdentityOtpSendResponse;
import com.coresolution.consultation.sct.exception.SctVerifyRequiredException;
import com.coresolution.consultation.sct.dto.SctDraftSaveRequest;
import com.coresolution.consultation.sct.dto.SctPublicFormResponse;
import com.coresolution.consultation.sct.dto.SctPublicMetaResponse;
import com.coresolution.consultation.sct.dto.SctSubmitRequest;
import com.coresolution.consultation.sct.dto.SctVerifyRequest;
import com.coresolution.consultation.sct.dto.SctVerifyResponse;
import com.coresolution.consultation.sct.service.SctDeviceSessionCookieSupport;
import com.coresolution.consultation.sct.service.SctIdentityOtpService;
import com.coresolution.consultation.sct.service.SctPublicService;
import com.coresolution.core.controller.BaseApiController;
import com.coresolution.core.util.HttpRequestClientIp;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * SCT 공개(비로그인) API.
 *
 * @author MindGarden
 * @since 2026-11-23
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/public/sct")
@RequiredArgsConstructor
public class PublicSctController extends BaseApiController {

    private final SctPublicService sctPublicService;
    private final SctIdentityOtpService sctIdentityOtpService;
    private final SctDeviceSessionCookieSupport deviceSessionCookieSupport;

    /**
     * 링크 메타.
     *
     * @param token opaque 토큰
     * @return 메타
     */
    @GetMapping("/{token}/meta")
    public ResponseEntity<?> meta(@PathVariable String token) {
        SctPublicMetaResponse data = sctPublicService.getMeta(token);
        return success(data);
    }

    /**
     * 연락처 검증.
     *
     * @param token   토큰
     * @param request 연락처
     * @param http    HTTP
     * @return verify session
     */
    @PostMapping("/{token}/verify")
    public ResponseEntity<?> verify(
            @PathVariable String token,
            @RequestBody SctVerifyRequest request,
            HttpServletRequest http,
            HttpServletResponse response) {
        SctVerifyResponse data = sctPublicService.verify(token, request, clientIp(http));
        bindDevice(token, data, http, response);
        return success(data);
    }

    /**
     * 본인확인 SMS OTP 발송(PHONE). 일치 여부와 무관하게 동일 스키마.
     *
     * @param token   토큰
     * @param request 휴대폰
     * @param http    HTTP
     * @return 발송 접수 응답
     */
    @PostMapping("/{token}/identity/otp/send")
    public ResponseEntity<?> sendIdentityOtp(
            @PathVariable String token,
            @RequestBody SctIdentityOtpSendRequest request,
            HttpServletRequest http) {
        SctIdentityOtpSendResponse data =
                sctIdentityOtpService.sendOtp(token, request, clientIp(http));
        return success(data);
    }

    /**
     * 본인확인 SMS OTP 확인 — 성공 시에만 verify 세션 발급.
     *
     * @param token   토큰
     * @param request 휴대폰+코드
     * @param http    HTTP
     * @return {@link SctVerifyResponse}
     */
    @PostMapping("/{token}/identity/otp/confirm")
    public ResponseEntity<?> confirmIdentityOtp(
            @PathVariable String token,
            @RequestBody SctIdentityOtpConfirmRequest request,
            HttpServletRequest http,
            HttpServletResponse response) {
        SctVerifyResponse data =
                sctIdentityOtpService.confirmOtp(token, request, clientIp(http));
        bindDevice(token, data, http, response);
        return success(data);
    }

    /**
     * 같은 단말 재진입 — HttpOnly 단말 쿠키의 verify 세션이 유효하면 재인증 없이 세션 반환.
     * 쿠키가 없으면 200 + verifySessionId=null (링크만으로는 세션 없음 → OTP).
     *
     * @param token 토큰
     * @param http  HTTP
     * @return {@link SctVerifyResponse}
     */
    @PostMapping("/{token}/session/resume")
    public ResponseEntity<?> resumeSession(
            @PathVariable String token,
            HttpServletRequest http) {
        String deviceSessionId = deviceSessionCookieSupport.read(http).orElse(null);
        SctVerifyResponse data = sctPublicService.resumeDeviceSession(token, deviceSessionId);
        return success(data);
    }

    /**
     * 양식+임시답. verifySessionId 는 헤더 {@code X-Sct-Verify-Session}.
     *
     * @param token 토큰
     * @param http  HTTP
     * @return 양식
     */
    @GetMapping("/{token}/form")
    public ResponseEntity<?> form(
            @PathVariable String token,
            HttpServletRequest http) {
        String verifySessionId = http.getHeader(SctConsentKeys.VERIFY_SESSION_HEADER);
        if (!StringUtils.hasText(verifySessionId)) {
            throw new SctVerifyRequiredException(SctConstants.MSG_VERIFY_REQUIRED);
        }
        SctPublicFormResponse data = sctPublicService.getForm(token, verifySessionId);
        return success(data);
    }

    /**
     * 임시저장.
     *
     * @param token   토큰
     * @param request 답안
     * @return 성공
     */
    @PutMapping("/{token}/draft")
    public ResponseEntity<?> draft(
            @PathVariable String token,
            @Valid @RequestBody SctDraftSaveRequest request) {
        sctPublicService.saveDraft(token, request);
        return success("임시 저장되었습니다.");
    }

    /**
     * 동의.
     *
     * @param token   토큰
     * @param request 동의
     * @param http    HTTP
     * @return 성공
     */
    @PostMapping("/{token}/consents")
    public ResponseEntity<?> consents(
            @PathVariable String token,
            @Valid @RequestBody SctConsentRequest request,
            HttpServletRequest http) {
        sctPublicService.saveConsent(token, request, clientIp(http), http.getHeader("User-Agent"));
        return success("동의가 저장되었습니다.");
    }

    /**
     * 제출.
     *
     * @param token   토큰
     * @param request 제출
     * @return 성공
     */
    @PostMapping("/{token}/submit")
    public ResponseEntity<?> submit(
            @PathVariable String token,
            @Valid @RequestBody SctSubmitRequest request) {
        sctPublicService.submit(token, request);
        return success("제출되었습니다.");
    }

    /**
     * 본인확인 성공 직후 verify 세션 ID 를 단말(브라우저)에 HttpOnly 쿠키로 바인딩.
     */
    private void bindDevice(String token, SctVerifyResponse data,
            HttpServletRequest http, HttpServletResponse response) {
        if (data == null || !StringUtils.hasText(data.getVerifySessionId())) {
            return;
        }
        response.addHeader(HttpHeaders.SET_COOKIE, deviceSessionCookieSupport.build(
                token, data.getVerifySessionId(), data.getExpiresInSeconds(), http).toString());
    }

    private static String clientIp(HttpServletRequest request) {
        return HttpRequestClientIp.resolve(request);
    }
}
