package com.coresolution.consultation.sct.controller;

import com.coresolution.consultation.sct.constant.SctConsentKeys;
import com.coresolution.consultation.sct.dto.SctConsentRequest;
import com.coresolution.consultation.sct.dto.SctDraftSaveRequest;
import com.coresolution.consultation.sct.dto.SctPublicFormResponse;
import com.coresolution.consultation.sct.dto.SctPublicMetaResponse;
import com.coresolution.consultation.sct.dto.SctSubmitRequest;
import com.coresolution.consultation.sct.dto.SctVerifyRequest;
import com.coresolution.consultation.sct.dto.SctVerifyResponse;
import com.coresolution.consultation.sct.service.SctPublicService;
import com.coresolution.core.controller.BaseApiController;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
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
            HttpServletRequest http) {
        SctVerifyResponse data = sctPublicService.verify(token, request, clientIp(http));
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
            throw new IllegalArgumentException("본인 확인이 필요합니다.");
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

    private static String clientIp(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            return forwarded.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}
