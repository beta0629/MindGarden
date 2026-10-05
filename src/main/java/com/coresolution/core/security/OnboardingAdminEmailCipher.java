package com.coresolution.core.security;

import java.util.Locale;
import com.coresolution.consultation.converter.PersonalDataEncryptionContextHolder;
import com.coresolution.consultation.util.PersonalDataEncryptionUtil;
import com.coresolution.core.constant.OnboardingConstants;
import com.coresolution.core.service.impl.OnboardingApprovalBlockedException;

/**
 * 온보딩 관리자 {@code users.email} 저장값.
 *
 * <p>프로시저와 JDBC 직접 INSERT 는 JPA 컨버터를 타지 않는다. 저장 직전에
 * {@link com.coresolution.consultation.converter.EmailAttributeConverter} 와 같은
 * {@link PersonalDataEncryptionUtil#safeEncrypt(String)}
 * (v1 고정 IV)만 사용한다. SQL 에서 암호화를 다시 구현하지 않는다.</p>
 *
 * <p>관리자 {@code users.user_id} 는 이메일 로컬 파트가 아니다.
 * {@link TenantAdminUserIdAllocator} 가 테넌트 토큰과 난수로 만든다.
 * 암호문에는 {@code @} 가 없어도 user_id 와 이메일을 섞지 않는다.</p>
 *
 * @author CoreSolution
 * @since 2026-10-05
 */
public final class OnboardingAdminEmailCipher {

    /** {@code users.email} 길이. V20260614_002 */
    public static final int EMAIL_COLUMN_LENGTH = 512;

    private OnboardingAdminEmailCipher() {
    }

    /**
     * 정규화된 평문 이메일을 저장용 암호문으로 나눈다. user_id 는 만들지 않는다.
     *
     * @param normalizedPlainEmail trim·소문자인 관리자 이메일
     * @return 평문, 암호문
     * @throws OnboardingApprovalBlockedException 암호화할 수 없거나 결과가 평문이면
     */
    public static Prepared prepare(String normalizedPlainEmail) {
        if (normalizedPlainEmail == null || normalizedPlainEmail.isBlank()) {
            throw new OnboardingApprovalBlockedException(
                    OnboardingConstants.ERROR_ONBOARDING_ADMIN_EMAIL_ENCRYPTION_UNAVAILABLE);
        }
        String plain = normalizedPlainEmail.trim().toLowerCase(Locale.ROOT);
        PersonalDataEncryptionUtil util = PersonalDataEncryptionContextHolder.get();
        if (util == null) {
            throw new OnboardingApprovalBlockedException(
                    OnboardingConstants.ERROR_ONBOARDING_ADMIN_EMAIL_ENCRYPTION_UNAVAILABLE);
        }
        String cipher = util.safeEncrypt(plain);
        if (!isStoredCipher(plain, cipher)) {
            throw new OnboardingApprovalBlockedException(
                    OnboardingConstants.ERROR_ONBOARDING_ADMIN_EMAIL_ENCRYPTION_UNAVAILABLE);
        }
        return new Prepared(plain, cipher);
    }

    /**
     * 컨버터와 같은 저장 형식인지 확인한다. 평문 이메일({@code @})이면 거부한다.
     *
     * @param plain  평문
     * @param cipher {@link PersonalDataEncryptionUtil#safeEncrypt(String)} 결과
     * @return 컬럼에 넣어도 되는 암호문이면 true
     */
    public static boolean isStoredCipher(String plain, String cipher) {
        return cipher != null
                && !cipher.isBlank()
                && cipher.length() <= EMAIL_COLUMN_LENGTH
                && !cipher.equals(plain)
                && cipher.indexOf('@') < 0
                && cipher.indexOf("::") > 0;
    }

    /**
     * 승인으로 새로 저장할 관리자 이메일.
     *
     * @param plain  정규화된 평문. 로그용. user_id 로 쓰지 않는다
     * @param cipher {@code users.email} 에 넣을 값
     */
    public record Prepared(String plain, String cipher) {
    }
}
