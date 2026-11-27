package com.coresolution.consultation.security.pii;

import java.util.Locale;
import com.coresolution.consultation.entity.Client;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.util.LoginIdentifierUtils;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import lombok.extern.slf4j.Slf4j;
import org.springframework.util.StringUtils;

/**
 * User/Client email·phone HMAC 블라인드 인덱스 자동 갱신.
 *
 * <p>{@code @PrePersist}/{@code @PreUpdate} 시점에 엔티티 필드는 아직 평문(또는 서비스가
 * 선암호화한 값)이다. 암호문이면 복호화 후 정규화·HMAC 한다. 해시 컬럼에는
 * {@link PiiAttributeConverter} 를 붙이지 않는다.</p>
 *
 * @author CoreSolution
 * @since 2026-11-27
 */
@Slf4j
public class PiiBlindIndexListener {

    /**
     * 저장 전 해시 갱신.
     *
     * @param entity User 또는 Client
     */
    @PrePersist
    public void prePersist(Object entity) {
        applyBlindIndexes(entity);
    }

    /**
     * 수정 전 해시 갱신.
     *
     * @param entity User 또는 Client
     */
    @PreUpdate
    public void preUpdate(Object entity) {
        applyBlindIndexes(entity);
    }

    private void applyBlindIndexes(Object entity) {
        if (entity instanceof User user) {
            user.setEmailHash(computeEmailHash(user.getEmail()));
            user.setPhoneHash(computePhoneHash(user.getPhone()));
            return;
        }
        if (entity instanceof Client client) {
            client.setEmailHash(computeEmailHash(client.getEmail()));
            client.setPhoneHash(computePhoneHash(client.getPhone()));
        }
    }

    /**
     * 이메일 평문(또는 암호문) → 정규화 HMAC hex.
     *
     * @param raw 엔티티 email 필드
     * @return 64자 hex 또는 null
     */
    public static String computeEmailHash(String raw) {
        String plain = toPlain(raw);
        if (!StringUtils.hasText(plain)) {
            return null;
        }
        String normalized = plain.trim().toLowerCase(Locale.ROOT);
        return hmacOrNull(normalized);
    }

    /**
     * 전화 평문(또는 암호문) → KR 숫자 정규화 HMAC hex.
     *
     * @param raw 엔티티 phone 필드
     * @return 64자 hex 또는 null
     */
    public static String computePhoneHash(String raw) {
        String plain = toPlain(raw);
        if (!StringUtils.hasText(plain)) {
            return null;
        }
        String normalized = LoginIdentifierUtils.normalizeKoreanMobileDigits(plain);
        if (!StringUtils.hasText(normalized)) {
            return null;
        }
        return hmacOrNull(normalized);
    }

    private static String toPlain(String raw) {
        if (!StringUtils.hasText(raw)) {
            return null;
        }
        if (!PiiCipherFormats.looksEncrypted(raw)) {
            PiiCryptoService crypto = PiiEncryptionContextHolder.get();
            if (crypto != null && crypto.isEncrypted(raw)) {
                return crypto.safeDecrypt(raw);
            }
            return raw;
        }
        PiiCryptoService crypto = PiiEncryptionContextHolder.get();
        if (crypto == null) {
            log.warn("PiiCryptoService 미초기화 — 블라인드 해시 스킵");
            return null;
        }
        return crypto.safeDecrypt(raw);
    }

    private static String hmacOrNull(String normalized) {
        PiiHmacService hmac = PiiHmacContextHolder.get();
        if (hmac == null || !hmac.hasSecret()) {
            throw new IllegalStateException(
                "PERSONAL_DATA_HMAC_SECRET 미설정 — PII 블라인드 인덱스 쓰기 금지 (fail-closed)");
        }
        return hmac.hmacHex(normalized);
    }
}
