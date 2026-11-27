package com.coresolution.consultation.sct.controller;

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Optional;
import com.coresolution.consultation.exception.EntityNotFoundException;
import com.coresolution.consultation.sct.entity.SctInvitation;
import com.coresolution.consultation.sct.repository.SctInvitationRepository;
import com.coresolution.consultation.sct.repository.SctRotatedTokenHashRepository;
import com.coresolution.consultation.sct.service.SctFeatureGuard;
import com.coresolution.consultation.sct.service.SctIdentityOtpDevCodeStore;
import com.coresolution.consultation.sct.util.SctTokenHasher;
import com.coresolution.core.controller.BaseApiController;
import com.coresolution.core.context.TenantContextHolder;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Profile;
import org.springframework.http.ResponseEntity;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * .dev 전용 — SCT 본인확인 OTP 검증용 코드 조회.
 *
 * <p>운영/default 프로필에는 빈·매핑이 없다. 로그·공개 응답에 평문 코드를 넣지 않는 일반 경로와 분리.</p>
 *
 * @author MindGarden
 * @since 2026-11-27
 */
@Slf4j
@Profile("dev")
@RestController
@RequestMapping("/api/v1/public/sct")
@RequiredArgsConstructor
public class PublicSctIdentityOtpDevController extends BaseApiController {

    private final SctInvitationRepository invitationRepository;
    private final SctRotatedTokenHashRepository rotatedTokenHashRepository;
    private final SctFeatureGuard sctFeatureGuard;
    private final SctIdentityOtpDevCodeStore devCodeStore;

    /**
     * 최근 발송 OTP 평문 조회(.dev only).
     *
     * @param token 공개 토큰
     * @return {@code { present, code? }} — 운영 경로에 없음
     */
    @GetMapping("/{token}/identity/otp/dev-code")
    public ResponseEntity<?> peekDevCode(@PathVariable String token) {
        if (!StringUtils.hasText(token)) {
            throw new EntityNotFoundException("SCT 링크를 찾을 수 없습니다.");
        }
        String hash = SctTokenHasher.sha256Hex(token);
        SctInvitation invitation = invitationRepository.findByTokenHashAndIsDeletedFalse(hash)
                .orElseGet(() -> {
                    if (rotatedTokenHashRepository.existsByTokenHash(hash)) {
                        throw new EntityNotFoundException("SCT 링크를 찾을 수 없습니다.");
                    }
                    throw new EntityNotFoundException("SCT 링크를 찾을 수 없습니다.");
                });
        TenantContextHolder.setTenantId(invitation.getTenantId());
        sctFeatureGuard.requireEnabled(invitation.getTenantId());
        Optional<String> code = devCodeStore.peek(invitation.getTenantId(), invitation.getId());
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("present", code.isPresent());
        code.ifPresent(c -> body.put("code", c));
        log.info("SCT identity OTP dev-code peeked: invitationId={}, present={}",
                invitation.getId(), code.isPresent());
        return success(body);
    }
}
