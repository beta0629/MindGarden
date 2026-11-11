package com.coresolution.consultation.controller;

import com.coresolution.consultation.constant.HomepageInquiryConstants;
import com.coresolution.consultation.dto.request.PublicHomepageInquiryCreateRequest;
import com.coresolution.consultation.service.HomepageInquiryService;
import com.coresolution.consultation.service.support.DeferredExternalCalls;
import com.coresolution.core.controller.BaseApiController;
import com.coresolution.core.dto.ApiResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * 홈페이지 공개 문의 접수 API.
 *
 * <p>{@code POST /api/v1/public/tenants/{tenantSlug}/inquiries} — 비로그인, 202 Accepted.
 * 공개 GET/조회는 제공하지 않는다.
 *
 * @author CoreSolution
 * @since 2026-11-11
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/public/tenants/{tenantSlug}/inquiries")
@RequiredArgsConstructor
public class PublicHomepageInquiryController extends BaseApiController {

    private final HomepageInquiryService homepageInquiryService;

    /**
     * 공개 문의 접수. 본문·식별자를 응답에 포함하지 않는다.
     *
     * @param tenantSlug 테넌트 서브도메인
     * @param request 문의 본문
     * @param httpRequest HTTP 요청
     * @return 202 Accepted
     */
    @PostMapping
    public ResponseEntity<ApiResponse<Void>> create(
            @PathVariable("tenantSlug") String tenantSlug,
            @Valid @RequestBody PublicHomepageInquiryCreateRequest request,
            HttpServletRequest httpRequest) {
        DeferredExternalCalls.run(
                () -> homepageInquiryService.submitPublicInquiry(tenantSlug, request, httpRequest));
        return accepted(HomepageInquiryConstants.PUBLIC_ACCEPTED_MESSAGE);
    }

    /**
     * 202 Accepted (데이터 없음).
     *
     * @param message 클라이언트 메시지
     * @return 응답
     */
    private ResponseEntity<ApiResponse<Void>> accepted(String message) {
        return ResponseEntity.status(HttpStatus.ACCEPTED)
                .body(ApiResponse.success(message));
    }
}
