package com.coresolution.consultation.sct.service;

import com.coresolution.consultation.sct.entity.SctInvitation;

/**
 * SCT 공개 경로 토큰·교환 코드 → 초대 해석 공용 컴포넌트.
 *
 * <p>단축 링크 교환 코드와 원 초대 토큰을 동일 순서로 해석한다.
 * {@code SctPublicService}·{@code SctIdentityOtpService} 가 공유한다.</p>
 *
 * @author MindGarden
 * @since 2026-11-27
 */
public interface SctPublicTokenResolver {

    /**
     * 초대 토큰 해시 → Redis 교환 코드 → 회전 이력 순으로 해석.
     *
     * @param rawToken             경로 토큰 또는 교환 코드
     * @param allowReissuedForMeta true면 회전/재발급을 REISSUED로 반환(meta 전용)
     * @return 해석 결과
     */
    ResolvedPublicToken resolveToken(String rawToken, boolean allowReissuedForMeta);

    /**
     * 읽기용 초대 로드. REISSUED·회전은 Gone.
     *
     * @param rawToken 토큰 또는 교환 코드
     * @return 초대
     */
    SctInvitation loadByToken(String rawToken);

    /**
     * verify·OTP 쓰기 경로 — 평문 토큰·교환 코드 모두 pessimistic write lock.
     * 교환 코드 REISSUED landingStatus면 410. 회전 해시는 loadByToken으로 410.
     *
     * @param rawToken 토큰 또는 교환 코드
     * @return 잠긴 초대
     */
    SctInvitation loadInvitationForVerify(String rawToken);

    /**
     * @param invitation     초대
     * @param statusOverride REISSUED 등 또는 null
     */
    record ResolvedPublicToken(SctInvitation invitation, String statusOverride) {
    }
}
