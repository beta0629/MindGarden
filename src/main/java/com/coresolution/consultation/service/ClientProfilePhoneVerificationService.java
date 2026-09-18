package com.coresolution.consultation.service;

import java.time.LocalDateTime;
import java.util.Optional;
import com.coresolution.consultation.entity.User;

/**
 * 결제용 휴대폰 소유 확인 SSOT ({@code phone_otp_attempts}).
 *
 * <p>기존 {@code phone_otp_attempts} 테이블만 사용한다. 동일 {@code tenantId + phone_hash} 의
 * {@code status=VERIFIED} + {@code verified_at IS NOT NULL} 행이면 provider(PROFILE/APPLE/KAKAO 등)와
 * 무관하게 결제 게이트를 통과한다. SNS 프로필 전화 클레임만으로는 통과하지 않으며,
 * OTP 성공 행만 SSOT 다. CHANGE_PHONE 성공 시 PROFILE VERIFIED 행을 기록한다.
 * users 테이블에 별도 verified 컬럼을 두지 않는다.</p>
 *
 * @author MindGarden
 * @since 2026-09-18
 */
public interface ClientProfilePhoneVerificationService {

    /**
     * CHANGE_PHONE OTP 소비·번호 저장 성공 후 PROFILE VERIFIED 장부 행을 기록한다.
     *
     * @param tenantId 테넌트 ID
     * @param userId 로그인 사용자 PK
     * @param normalizedPhoneDigits 정규화된 KR 휴대폰 ({@code 01012345678})
     */
    void recordVerifiedAfterChangePhone(String tenantId, Long userId, String normalizedPhoneDigits);

    /**
     * PortOne preparePayment 등 결제 게이트용 — 현재 번호가 KR 모바일이고
     * 동일 phone_hash 의 VERIFIED({@code verified_at} 존재) 행이 있으면 true.
     * provider 는 PROFILE·OAuth 모두 허용한다.
     *
     * @param user 테넌트 스코프 사용자
     * @return 결제용 소유 확인 여부
     */
    boolean isPhoneVerifiedForPayment(User user);

    /**
     * 사용자 현재 휴대폰을 정규화한 숫자열 (복호화·정규화만, 인증 여부와 무관).
     * PG synthetic email 등 신원 기반 폴백용.
     *
     * @param user 테넌트 스코프 사용자
     * @return 정규화된 KR 휴대폰 또는 empty
     */
    Optional<String> findNormalizedPhoneDigits(User user);

    /**
     * API soft-refresh 용 — 매칭 VERIFIED 행의 {@code verified_at} (provider 무관).
     *
     * @param user 테넌트 스코프 사용자
     * @return verified_at 또는 empty
     */
    Optional<LocalDateTime> findPhoneVerifiedAt(User user);
}
