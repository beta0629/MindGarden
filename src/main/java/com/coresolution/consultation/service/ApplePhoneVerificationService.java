package com.coresolution.consultation.service;

import com.coresolution.consultation.dto.auth.ApplePhoneSendRequest;
import com.coresolution.consultation.dto.auth.ApplePhoneSendResponse;
import com.coresolution.consultation.dto.auth.ApplePhoneVerifyRequest;
import com.coresolution.consultation.dto.auth.AppleSignInResponse;

/**
 * Apple SIWA 휴대폰 매칭 흐름의 OTP 발송/검증 책임자.
 *
 * <p>흐름:
 * <ol>
 *   <li>{@link AppleSignInService#signIn} 이 apple_sub 매칭 실패 시 {@code phoneVerificationToken} 발급</li>
 *   <li>클라이언트가 {@link #sendOtp} 호출 → 6자리 OTP 발송 + {@code otpChallengeToken} 응답</li>
 *   <li>클라이언트가 {@link #verifyOtp} 호출 → 휴대폰 매칭 + JWT 발급 (또는 신규 가입)</li>
 * </ol>
 * </p>
 *
 * <p>본 서비스는 {@code AbstractOAuth2Service} 와 분리돼 있어 카카오/네이버 흐름에 영향을 주지 않는다.</p>
 *
 * @author MindGarden
 * @since 2026-06-08
 */
public interface ApplePhoneVerificationService {

    /**
     * Apple SIWA 휴대폰 인증 OTP 발송.
     *
     * <ul>
     *   <li>{@code phoneVerificationToken} 검증 → tenantId / apple_sub 추출</li>
     *   <li>휴대폰 정규화 + SHA-256 해시</li>
     *   <li>1분 쿨다운, 일 5회 한도 검사</li>
     *   <li>6자리 OTP 생성 → bcrypt 해시 → {@code phone_otp_attempts} row 저장</li>
     *   <li>Solapi {@link SmsAuthService#sendVerificationCode(String)} 로 실제 발송</li>
     *   <li>{@code otpChallengeToken} 발행 후 응답</li>
     * </ul>
     *
     * @param request {@code phoneVerificationToken + phoneNumber}
     * @return 발송 결과 + challenge 토큰
     */
    ApplePhoneSendResponse sendOtp(ApplePhoneSendRequest request);

    /**
     * Apple SIWA 휴대폰 인증 OTP 검증 + 휴대폰 매칭.
     *
     * <ul>
     *   <li>{@code phoneVerificationToken} 과 {@code otpChallengeToken} 의 apple_sub 일치 검증</li>
     *   <li>{@code phone_otp_attempts} row 조회 → attempts++ → bcrypt 검증</li>
     *   <li>성공 시 phone 으로 user 매칭 (역할 혼재 시 phone account selection 분기)</li>
     *   <li>매칭 1명 → apple_sub 연결 후 JWT 발급</li>
     *   <li>매칭 없음 → 신규 가입(role=CLIENT) 후 JWT 발급</li>
     * </ul>
     *
     * @param request {@code phoneVerificationToken + otpChallengeToken + code}
     * @return 로그인/가입 결과
     */
    AppleSignInResponse verifyOtp(ApplePhoneVerifyRequest request);
}
