package com.coresolution.consultation.sct.service;

import java.util.Optional;

/**
 * .dev 전용 — 최근 발송 OTP 평문 조회 저장소.
 *
 * <p>운영/default 프로필에는 구현 빈이 없어야 한다.</p>
 *
 * @author MindGarden
 * @since 2026-11-27
 */
public interface SctIdentityOtpDevCodeStore {

    /**
     * 발송 직후 평문 코드 기억(로그·응답 금지 경로와 분리된 메모리).
     *
     * @param tenantId     테넌트
     * @param invitationId 초대
     * @param code         평문 OTP
     */
    void remember(String tenantId, Long invitationId, String code);

    /**
     * 최근 코드 조회.
     *
     * @param tenantId     테넌트
     * @param invitationId 초대
     * @return 평문 또는 empty
     */
    Optional<String> peek(String tenantId, Long invitationId);
}
