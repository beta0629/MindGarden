package com.coresolution.consultation.sct.service;

import java.util.Optional;

/**
 * .dev 전용 — 관리자 인증 후 OTP 평문 peek.
 *
 * <p>운영/default 프로필에는 구현 빈이 없다.</p>
 *
 * @author MindGarden
 * @since 2026-11-27
 */
public interface SctIdentityOtpDevPeekService {

    /**
     * 테넌트 스코프 초대에 대한 최근 OTP 평문 조회.
     *
     * @param tenantId     테넌트
     * @param invitationId 초대 ID
     * @return 평문 또는 empty
     */
    Optional<String> peekCode(String tenantId, Long invitationId);
}
