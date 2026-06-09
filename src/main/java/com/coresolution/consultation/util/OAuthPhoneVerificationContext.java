package com.coresolution.consultation.util;

/**
 * provider-agnostic OAuth 휴대폰 매칭(OTP) 흐름에서 검증 완료된 phone 을 한 트랜잭션 동안 전달하기 위한
 * ThreadLocal holder.
 *
 * <p>2026-06-09 OAuth 휴대폰 SSOT 정책: OAuth 응답의 phone 은 본인 검증되지 않은 값이므로 신규 user 의
 * {@code User.phone} 컬럼에 그대로 저장하지 않는다. {@code OAuthPhoneVerificationServiceImpl} 가 OTP 검증을
 * 마치고 신규 user 를 생성하는 경로(SSOT)에서는 {@code createNewOAuthUser} 가 phone 미저장 정책으로 직접 처리한다.
 * 반면, 기존 호환 경로({@link com.coresolution.consultation.service.impl.AbstractOAuth2Service#createUserFromSocial})
 * 가 외부에서 호출될 가능성에 대비해, 같은 트랜잭션 안에서 검증된 phone 을 전달할 수단이 필요하다.</p>
 *
 * <p>사용 패턴:
 * <pre>{@code
 * OAuthPhoneVerificationContext.setVerifiedPhone("01012345678");
 * try {
 *     oauth2Service.createUserFromSocial(socialUserInfo);
 * } finally {
 *     OAuthPhoneVerificationContext.clear();
 * }
 * }</pre>
 * </p>
 *
 * <p>본 holder 는 호환성 hook 일 뿐이며, 운영 경로(OAuth 콜백 → OTP send → OTP verify) 에서는 사용하지 않는다
 * — 그 경로에서는 {@code OAuthPhoneVerificationServiceImpl} 가 SSOT 로 작동한다.</p>
 *
 * @author MindGarden
 * @since 2026-06-09
 */
public final class OAuthPhoneVerificationContext {

    private static final ThreadLocal<String> VERIFIED_PHONE = new ThreadLocal<>();

    private OAuthPhoneVerificationContext() {
    }

    /**
     * 검증 완료된 정규화 phone 을 현재 스레드에 설정한다.
     *
     * @param normalizedPhone 정규화 한국 휴대 (예: {@code 01012345678}). null/빈 문자열이면 {@link #clear()} 와 동일.
     */
    public static void setVerifiedPhone(String normalizedPhone) {
        if (normalizedPhone == null || normalizedPhone.isBlank()) {
            VERIFIED_PHONE.remove();
            return;
        }
        VERIFIED_PHONE.set(normalizedPhone);
    }

    /**
     * 검증 완료된 phone 조회.
     *
     * @return 설정되지 않았으면 null
     */
    public static String getVerifiedPhone() {
        return VERIFIED_PHONE.get();
    }

    /**
     * 현재 스레드의 verified phone 을 비운다. 트랜잭션·요청 종료 시 반드시 호출.
     */
    public static void clear() {
        VERIFIED_PHONE.remove();
    }
}
