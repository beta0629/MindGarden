package com.coresolution.consultation.security.pii;

import java.util.Locale;
import org.springframework.util.StringUtils;

/**
 * 레거시 평문/CBC → GCM, SHA → HMAC 업그레이드 공통 헬퍼.
 *
 * <p>도메인별 {@code *PiiUpgradeRunner}(SCT·이후 phase 2–6)가 동일 멱등 규칙을 재사용한다.
 * 키/시크릿 부재 시 러너는 {@link #shouldSkipUpgrade} 로 no-op 한다.</p>
 *
 * @author CoreSolution
 * @since 2026-11-27
 */
public final class PiiLegacyUpgradeSupport {

    private PiiLegacyUpgradeSupport() {
    }

    /**
     * 암호화 키 또는 HMAC 시크릿이 없으면 업그레이드를 건너뛴다.
     *
     * @param crypto AES-GCM 서비스
     * @param hmac   HMAC 서비스
     * @return true 이면 한 행도 건드리지 말고 return
     */
    public static boolean shouldSkipUpgrade(PiiCryptoService crypto, PiiHmacService hmac) {
        return crypto == null || hmac == null
            || !crypto.hasActiveKey() || !hmac.hasSecret();
    }

    /**
     * 평문/CBC → GCM. 이미 v2 이면 null(변경 없음).
     *
     * @param crypto 암호화 서비스
     * @param value  현재 컬럼 값
     * @param counts 카운터
     * @return 새 암호문 또는 null
     */
    public static String upgradeCipher(
        PiiCryptoService crypto, String value, UpgradeCounts counts) {
        if (!StringUtils.hasText(value)) {
            return null;
        }
        if (PiiCipherFormats.looksV2(value)) {
            return null;
        }
        String plain = crypto.decryptCompatible(value);
        if (!StringUtils.hasText(plain)) {
            return null;
        }
        String gcm = crypto.encryptGcm(plain);
        counts.cipherUpdated++;
        return gcm;
    }

    /**
     * 전화/이메일 해시를 HMAC 으로 교정.
     *
     * @param hmac    HMAC 서비스
     * @param plain   복호화된 평문 (정규화 전)
     * @param current 현재 해시
     * @param isPhone 전화이면 숫자 정규화
     * @param counts  카운터
     * @return 새 HMAC 또는 null
     */
    public static String upgradeHash(
        PiiHmacService hmac,
        String plain,
        String current,
        boolean isPhone,
        UpgradeCounts counts) {
        if (!StringUtils.hasText(plain)) {
            return null;
        }
        String normalized = isPhone
            ? normalizePhone(plain)
            : plain.trim().toLowerCase(Locale.ROOT);
        if (!StringUtils.hasText(normalized)) {
            return null;
        }
        String hmacHex = hmac.hmacHex(normalized);
        if (hmacHex.equals(current)) {
            return null;
        }
        counts.hashUpdated++;
        return hmacHex;
    }

    /**
     * 저장값에서 평문을 복원한다 (이미 평문이면 그대로).
     *
     * @param crypto 암호화 서비스
     * @param stored 컬럼 값
     * @return 평문 또는 null
     */
    public static String plainFrom(PiiCryptoService crypto, String stored) {
        if (!StringUtils.hasText(stored)) {
            return null;
        }
        return crypto.decryptCompatible(stored);
    }

    /**
     * 전화번호를 숫자만 남기고 82 국가코드를 0 으로 정규화한다.
     *
     * @param phone 원본
     * @return 정규화 숫자열 또는 null
     */
    public static String normalizePhone(String phone) {
        if (phone == null) {
            return null;
        }
        String digits = phone.replaceAll("[^0-9]", "");
        if (digits.startsWith("82") && digits.length() >= 11) {
            digits = "0" + digits.substring(2);
        }
        return digits;
    }

    /**
     * JDBC 행 id 등을 Long 으로 변환한다.
     *
     * @param value Number 또는 숫자 문자열
     * @return Long 또는 null
     */
    public static Long toLong(Object value) {
        if (value instanceof Number number) {
            return number.longValue();
        }
        if (value == null) {
            return null;
        }
        try {
            return Long.parseLong(value.toString());
        } catch (NumberFormatException e) {
            return null;
        }
    }

    /**
     * 업그레이드 건수 카운터 (도메인 러너가 공유).
     */
    public static final class UpgradeCounts {
        public int cipherUpdated;
        public int hashUpdated;
        public int skipped;
        public int errors;
    }
}
