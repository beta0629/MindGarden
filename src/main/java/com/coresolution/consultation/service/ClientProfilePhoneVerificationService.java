package com.coresolution.consultation.service;

import java.time.LocalDateTime;
import java.util.Optional;
import com.coresolution.consultation.entity.User;

/**
 * 로그인 마이페이지 OTP(CHANGE_PHONE) 성공 후 결제용 휴대폰 소유 확인 SSOT.
 *
 * <p>기존 {@code phone_otp_attempts} 테이블만 사용한다. {@code provider=PROFILE} 행의
 * {@code verified_at} 이 게이트 기준이며, SNS/OAuth(APPLE/KAKAO 등) VERIFIED 행은 결제 통과에
 * 사용하지 않는다. users 테이블에 별도 verified 컬럼을 두지 않는다.</p>
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
     * 동일 phone_hash 의 PROFILE VERIFIED 행이 있으면 true.
     *
     * @param user 테넌트 스코프 사용자
     * @return 결제용 소유 확인 여부
     */
    boolean isPhoneVerifiedForPayment(User user);

    /**
     * API soft-refresh 용 — 매칭 PROFILE VERIFIED 행의 {@code verified_at}.
     *
     * @param user 테넌트 스코프 사용자
     * @return verified_at 또는 empty
     */
    Optional<LocalDateTime> findPhoneVerifiedAt(User user);
}
