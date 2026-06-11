package com.coresolution.consultation.service;

import com.coresolution.consultation.dto.MyPageEmailChangeRequest;
import com.coresolution.consultation.dto.MyPagePhoneChangeRequest;
import com.coresolution.consultation.dto.MyPageResponse;
import com.coresolution.consultation.dto.MyPageUpdateRequest;


/**
 * 마이페이지 서비스 인터페이스
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2024-12-19
 */
public interface MyPageService {

    /**
     * 마이페이지 정보 조회
     */
    MyPageResponse getMyPageInfo(Long userId);

    /**
     * 마이페이지 정보 수정
     */
    MyPageResponse updateMyPageInfo(Long userId, MyPageUpdateRequest request);

    /**
     * 휴대전화 변경(Phase A) — SMS OTP 검증 + 정규화 + tenant 내 중복 검사 + AuditLog 적재.
     *
     * <p>요청 본문의 {@code verificationCode} 는 {@code /api/v1/auth/sms/send} 발송 후 5분 이내
     * 발급된 단일 사용 코드여야 한다. 검증 성공 시 OTP 는 즉시 폐기되며, 새 번호는
     * {@link com.coresolution.consultation.util.LoginIdentifierUtils#normalizeAndValidateKoreanMobileForSms(String)}
     * 결과로 정규화된 뒤 암호화 저장된다.</p>
     *
     * @param userId  본인 PK (세션 기준)
     * @param request 새 휴대전화 번호 + OTP 코드
     * @return 갱신된 마이페이지 응답
     * @throws IllegalArgumentException 형식 위반·OTP 불일치·만료·tenant 내 중복(409 의미상 동일하지만
     *         기존 회원가입·관리자 생성 흐름과 동일하게 {@code GlobalExceptionHandler} 를 통해
     *         {@code 400 Bad Request + DUPLICATE_PHONE 메시지} 로 매핑된다).
     */
    MyPageResponse changePhone(Long userId, MyPagePhoneChangeRequest request);

    /**
     * 이메일 변경(Phase B) — 이메일 OTP 검증 + 정규화 + tenant 내 중복 검사 + AuditLog 적재 +
     * 세션/refresh token 강제 무효화.
     *
     * <p>요청 본문의 {@code verificationCode} 는 {@code POST /api/v1/clients/profile/email/send-otp}
     * 발송 후 5분 이내 발급된 단일 사용 코드여야 한다. 검증 성공 시 OTP 는 즉시 폐기되며,
     * 새 이메일은 {@code trim().toLowerCase()} 정규화된 형태로 저장된다.</p>
     *
     * <p><strong>보안 — 사용자 키 변경:</strong> 이메일은 JWT 의 {@code sub} 클레임 및 일부
     * 로그인 경로의 식별자로 사용되므로, 변경 직후 본 메서드는
     * {@link com.coresolution.consultation.service.RefreshTokenService#revokeAllUserTokens(Long)}
     * 으로 모든 refresh token 을 회수한다. 호출 컨트롤러는 추가로 {@code HttpSession#invalidate()}
     * 및 {@code SecurityContextHolder#clearContext()} 를 실행하여 재로그인을 강제한다.</p>
     *
     * <p><strong>가드:</strong> 본 메서드 외부 (특히 {@code UserServiceImpl#partialUpdate},
     * 관리자 변경 흐름) 에서 raw {@code user.setEmail(...)} 호출은 차단된다 (Phase B 보안 결함
     * 동봉 수정).</p>
     *
     * @param userId  본인 PK (세션 기준)
     * @param request 새 이메일 + 6자리 OTP 코드
     * @return 갱신된 마이페이지 응답
     * @throws IllegalArgumentException 형식 위반·OTP 불일치·만료·tenant 내 중복
     */
    MyPageResponse changeEmail(Long userId, MyPageEmailChangeRequest request);

    /**
     * 프로필 이미지 업로드
     */
    String uploadProfileImage(Long userId, String imageUrl);

    /**
     * 비밀번호 변경
     */
    String changePassword(Long userId, String newPassword);

    /**
     * 소셜 계정 정보 조회
     */
    String getSocialAccountInfo(Long userId);

    /**
     * 소셜 계정 연결
     */
    String linkSocialAccount(Long userId, String socialType, String socialId);

    /**
     * 소셜 계정 연결 해제
     */
    String unlinkSocialAccount(Long userId, String socialType);

    /**
     * 계정 탈퇴
     */
    String deleteAccount(String userId);
}
