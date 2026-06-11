package com.coresolution.consultation.service;

import com.coresolution.consultation.dto.community.UserEulaConsentRequest;
import com.coresolution.consultation.dto.community.UserEulaConsentResponse;
import com.coresolution.consultation.entity.User;

/**
 * Apple G1.2 UGC (P2-C) — EULA 동의 서비스.
 *
 * <p>FE {@code app/(auth)/eula-consent.tsx} 게이트의 백엔드 SSOT. 사용자별 최신 EULA 동의 상태를
 * 조회·저장하고, 재동의가 필요한지(미동의/구버전) 판정한다.</p>
 *
 * @author MindGarden
 * @since 2026-06-11
 */
public interface UserEulaConsentService {

    /**
     * 사용자 EULA 동의 상태 조회 — 부팅 게이트용.
     *
     * @param user 세션 사용자 (tenantId 포함)
     * @return 현재/마지막 동의 버전·시각 + {@code requiresReconsent}
     */
    UserEulaConsentResponse getConsentStatus(User user);

    /**
     * 사용자 EULA 동의 저장.
     *
     * <p>{@link UserEulaConsentRequest#getTermsVersion()} 이 현재 시행 버전과 일치해야 하며,
     * 필수 두 항목이 {@code true} 여야 한다 (DTO 어노테이션 + 서비스 가드).</p>
     *
     * @param user      세션 사용자
     * @param request   동의 본문
     * @param ipAddress 요청 IP (감사 로그)
     * @param userAgent 요청 UA (감사 로그)
     * @return 저장 후 동의 상태 (requiresReconsent=false)
     */
    UserEulaConsentResponse acceptConsent(
            User user,
            UserEulaConsentRequest request,
            String ipAddress,
            String userAgent);
}
