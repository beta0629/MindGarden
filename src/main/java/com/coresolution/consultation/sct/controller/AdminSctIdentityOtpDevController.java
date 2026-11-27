package com.coresolution.consultation.sct.controller;

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Optional;
import com.coresolution.consultation.sct.service.SctIdentityOtpDevPeekService;
import com.coresolution.core.controller.BaseApiController;
import com.coresolution.core.context.TenantContextHolder;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Profile;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * .dev 전용 — SCT 본인확인 OTP 검증용 코드 조회(ADMIN 전용).
 *
 * <p>공개 {@code /api/v1/public/sct/**} 경로에는 두지 않는다. 운영/default 프로필에는 빈·매핑이 없다.</p>
 *
 * @author MindGarden
 * @since 2026-11-27
 */
@Slf4j
@Profile("dev")
@RestController
@RequestMapping("/api/v1/admin/sct/invitations")
@RequiredArgsConstructor
public class AdminSctIdentityOtpDevController extends BaseApiController {

    private final SctIdentityOtpDevPeekService peekService;

    /**
     * 최근 발송 OTP 평문 조회(.dev + ADMIN only).
     *
     * @param invitationId 초대 ID
     * @return {@code { present, code? }} — 공개 경로·운영 빌드에 없음
     */
    @GetMapping("/{invitationId}/identity/otp/dev-code")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> peekDevCode(@PathVariable Long invitationId) {
        String tenantId = TenantContextHolder.getRequiredTenantId();
        Optional<String> code = peekService.peekCode(tenantId, invitationId);
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("present", code.isPresent());
        code.ifPresent(c -> body.put("code", c));
        log.info("SCT identity OTP admin dev-code peeked: invitationId={}, present={}",
                invitationId, code.isPresent());
        return success(body);
    }
}
