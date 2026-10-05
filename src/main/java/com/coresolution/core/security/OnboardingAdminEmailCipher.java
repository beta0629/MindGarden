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
 * <p>{@code users.user_id} 는 {@code VARCHAR(50)} 이고 이메일 로컬 파트에서 만든다.
 * 암호문에는 {@code @} 가 없으므로 user_id 계산은 암호화 전에 한다.</p>
 *
 * @author CoreSolution
 * @since 2026-10-05
 */
public final class OnboardingAdminEmailCipher {

    /** {@code users.email} 길이. V20260614_002 */
    public static final int EMAIL_COLUMN_LENGTH = 512;

    /** {@code users.user_id} 길이. V20251208_002 */
    public static final int USER_ID_COLUMN_LENGTH = 50;

    private OnboardingAdminEmailCipher() {
    }

    /**
     * 정규화된 평문 이메일을 저장용 암호문과 프로시저 user_id 베이스로 나눈다.
     *
     * @param normalizedPlainEmail trim·소문자인 관리자 이메일
     * @return 평문, 암호문, 프로시저가 고유 접미사를 붙이기 전의 user_id
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
        return new Prepared(plain, cipher, procedureUserIdBase(plain));
    }

    /**
     * 프로시저가 쓰던 {@code LOWER(SUBSTRING_INDEX(email, '@', 1))} 와 같은 베이스.
     * 컬럼 길이를 넘으면 앞에서 자른다. 고유 접미사는 프로시저가 붙인다.
     *
     * @param normalizedPlainEmail 정규화된 평문 이메일
     * @return user_id 베이스
     */
    public static String procedureUserIdBase(String normalizedPlainEmail) {
        int at = normalizedPlainEmail.indexOf('@');
        String local = at >= 0 ? normalizedPlainEmail.substring(0, at) : normalizedPlainEmail;
        String base = local.toLowerCase(Locale.ROOT);
        if (base.length() > USER_ID_COLUMN_LENGTH) {
            return base.substring(0, USER_ID_COLUMN_LENGTH);
        }
        return base;
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
     * @param plain  정규화된 평문. 로그·user_id 계산용
     * @param cipher {@code users.email} 에 넣을 값
     * @param procedureUserIdBase 프로시저 user_id 베이스
     */
    public record Prepared(String plain, String cipher, String procedureUserIdBase) {
    }
}
