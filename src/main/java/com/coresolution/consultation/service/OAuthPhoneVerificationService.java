package com.coresolution.consultation.service;

import com.coresolution.consultation.dto.auth.OAuthPhoneSendRequest;
import com.coresolution.consultation.dto.auth.OAuthPhoneSendResponse;
import com.coresolution.consultation.dto.auth.OAuthPhoneVerifyRequest;
import com.coresolution.consultation.dto.auth.OAuthPhoneVerifyResponse;

/**
 * provider-agnostic OAuth 휴대폰 매칭 흐름의 OTP 발송/검증 책임자.
 *
 * <p>Apple/Google/Kakao/Naver 4 종 provider 가 동일한 시퀀스로 호출한다:
 * <ol>
 *   <li>OAuth 콜백이 {@code phoneVerificationToken} 발급 (tenantId, oauthProvider, providerUserId 포함)</li>
 *   <li>클라이언트가 {@link #sendOtp} 호출 → 6자리 OTP 발송 + {@code challengeToken} 응답</li>
 *   <li>클라이언트가 {@link #verifyOtp} 호출 → 휴대폰 매칭 + JWT 발급 (또는 신규 가입)</li>
 * </ol>
 * </p>
 *
 * <p>본 서비스는 Apple SIWA P1 인프라({@code ApplePhoneVerificationService}) 를 일반화한 것이다.
 * Apple 전용 엔드포인트({@code /api/v1/auth/oauth/apple/phone/{send,verify}}) 는 FE PR #161 호환을 위해
 * 기존 {@code ApplePhoneVerificationService} 로 그대로 라우팅되고, 본 서비스는 신규
 * {@code /api/v1/oauth/phone/{send,verify}} 엔드포인트에 사용된다.</p>
 *
 * @author MindGarden
 * @since 2026-06-09
 */
public interface OAuthPhoneVerificationService {

    /**
     * OAuth 휴대폰 인증 OTP 발송.
     *
     * <ul>
     *   <li>{@code phoneVerificationToken} 검증 → tenantId / provider / providerUserId 추출</li>
     *   <li>요청 본문의 {@code oauthProvider} 와 토큰의 provider 일치 검증</li>
     *   <li>휴대폰 정규화 + SHA-256 해시</li>
     *   <li>1분 쿨다운, 일 5회 한도 검사</li>
     *   <li>6자리 OTP 생성 → bcrypt 해시 → {@code phone_otp_attempts} row 저장</li>
     *   <li>Solapi {@code SmsAuthService#sendVerificationCode(String)} 로 실제 발송</li>
     *   <li>{@code challengeToken} 발행 후 응답</li>
     * </ul>
     *
     * @param request {@code oauthProvider + phoneVerificationToken + phone}
     * @return 발송 결과 + challenge 토큰
     */
    OAuthPhoneSendResponse sendOtp(OAuthPhoneSendRequest request);

    /**
     * OAuth 휴대폰 인증 OTP 검증 + 휴대폰 매칭.
     *
     * <ul>
     *   <li>{@code phoneVerificationToken} 과 {@code challengeToken} 의 provider/sub/tenantId 일치 검증</li>
     *   <li>{@code phone_otp_attempts} row 조회 → attempts++ → bcrypt 검증</li>
     *   <li>성공 시 phone 으로 user 매칭 (역할 혼재 시 phone account selection 분기)</li>
     *   <li>매칭 1명 → provider sub 연결 후 JWT 발급</li>
     *   <li>매칭 없음 → 신규 가입(role=CLIENT) 후 JWT 발급</li>
     * </ul>
     *
     * @param request {@code oauthProvider + phoneVerificationToken + challengeToken + otpCode}
     * @return 로그인/가입/계정선택 결과
     */
    OAuthPhoneVerifyResponse verifyOtp(OAuthPhoneVerifyRequest request);
}
