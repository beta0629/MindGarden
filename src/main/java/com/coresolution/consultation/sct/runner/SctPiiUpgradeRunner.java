package com.coresolution.consultation.sct.runner;

import java.util.List;
import java.util.Locale;
import java.util.Map;
import com.coresolution.consultation.security.pii.PiiCipherFormats;
import com.coresolution.consultation.security.pii.PiiCryptoService;
import com.coresolution.consultation.security.pii.PiiHmacService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.util.StringUtils;

/**
 * SCT PII 멱등 업그레이드 러너 — 평문/CBC→GCM, phone/email SHA→HMAC.
 *
 * <p>키 또는 HMAC 시크릿이 없으면 한 행도 건드리지 않고 warn 후 기동을 계속한다.
 * token_hash / ip_hash / user_agent_hash 는 원문이 없어 재계산하지 않는다.</p>
 *
 * @author CoreSolution
 * @since 2026-11-27
 */
@Slf4j
@Component
@Order(100)
@RequiredArgsConstructor
public class SctPiiUpgradeRunner implements ApplicationRunner {

    private final PiiCryptoService cryptoService;
    private final PiiHmacService hmacService;
    private final JdbcTemplate jdbcTemplate;
    private final PlatformTransactionManager transactionManager;

    @Override
    public void run(ApplicationArguments args) {
        if (!cryptoService.hasActiveKey() || !hmacService.hasSecret()) {
            log.warn("SCT PII upgrade skipped — keys missing (no data touched)");
            return;
        }

        UpgradeCounts counts = new UpgradeCounts();
        try {
            upgradeInvitations(counts);
            upgradeConsents(counts);
            upgradeResponseAnswers(counts);
            upgradeDomainMemos(counts);
            log.info(
                "SCT PII upgrade done — cipherUpdated={}, hashUpdated={}, skipped={}, errors={}",
                counts.cipherUpdated, counts.hashUpdated, counts.skipped, counts.errors);
        } catch (Exception e) {
            log.error("SCT PII upgrade aborted: {}", e.getMessage());
        }
    }

    private void upgradeInvitations(UpgradeCounts counts) {
        List<Map<String, Object>> rows = jdbcTemplate.queryForList(
            "SELECT id, recipient_name, target_phone, target_email, "
                + "target_phone_hash, target_email_hash FROM sct_invitations "
                + "WHERE is_deleted = false OR is_deleted IS NULL");
        TransactionTemplate tx = new TransactionTemplate(transactionManager);
        for (Map<String, Object> row : rows) {
            tx.executeWithoutResult(status -> upgradeInvitationRow(row, counts));
        }
    }

    private void upgradeInvitationRow(Map<String, Object> row, UpgradeCounts counts) {
        Long id = toLong(row.get("id"));
        if (id == null) {
            return;
        }
        try {
            String recipientName = (String) row.get("recipient_name");
            String targetPhone = (String) row.get("target_phone");
            String targetEmail = (String) row.get("target_email");
            String phoneHash = (String) row.get("target_phone_hash");
            String emailHash = (String) row.get("target_email_hash");

            String newRecipient = upgradeCipher(recipientName, counts);
            String newPhone = upgradeCipher(targetPhone, counts);
            String newEmail = upgradeCipher(targetEmail, counts);

            String plainPhone = plainFrom(newPhone != null ? newPhone : targetPhone);
            String plainEmail = plainFrom(newEmail != null ? newEmail : targetEmail);
            String newPhoneHash = upgradeHash(plainPhone, phoneHash, true, counts);
            String newEmailHash = upgradeHash(plainEmail, emailHash, false, counts);

            boolean changed = newRecipient != null || newPhone != null || newEmail != null
                || newPhoneHash != null || newEmailHash != null;
            if (!changed) {
                counts.skipped++;
                return;
            }

            jdbcTemplate.update(
                "UPDATE sct_invitations SET recipient_name = COALESCE(?, recipient_name), "
                    + "target_phone = COALESCE(?, target_phone), "
                    + "target_email = COALESCE(?, target_email), "
                    + "target_phone_hash = COALESCE(?, target_phone_hash), "
                    + "target_email_hash = COALESCE(?, target_email_hash) "
                    + "WHERE id = ?",
                newRecipient, newPhone, newEmail, newPhoneHash, newEmailHash, id);
        } catch (Exception e) {
            counts.errors++;
            log.warn("SCT invitation PII upgrade failed id={}: {}", id, e.getMessage());
            throw e;
        }
    }

    private void upgradeConsents(UpgradeCounts counts) {
        List<Map<String, Object>> rows = jdbcTemplate.queryForList(
            "SELECT id, guardian_relation, guardian_name_enc, signer_name_enc, "
                + "child_name_confirm_enc FROM sct_consents "
                + "WHERE is_deleted = false OR is_deleted IS NULL");
        TransactionTemplate tx = new TransactionTemplate(transactionManager);
        for (Map<String, Object> row : rows) {
            tx.executeWithoutResult(status -> upgradeConsentRow(row, counts));
        }
    }

    private void upgradeConsentRow(Map<String, Object> row, UpgradeCounts counts) {
        Long id = toLong(row.get("id"));
        if (id == null) {
            return;
        }
        try {
            String guardianRelation = upgradeCipher((String) row.get("guardian_relation"), counts);
            String guardianName = upgradeCipher((String) row.get("guardian_name_enc"), counts);
            String signerName = upgradeCipher((String) row.get("signer_name_enc"), counts);
            String childName = upgradeCipher((String) row.get("child_name_confirm_enc"), counts);

            boolean changed = guardianRelation != null || guardianName != null
                || signerName != null || childName != null;
            if (!changed) {
                counts.skipped++;
                return;
            }

            jdbcTemplate.update(
                "UPDATE sct_consents SET guardian_relation = COALESCE(?, guardian_relation), "
                    + "guardian_name_enc = COALESCE(?, guardian_name_enc), "
                    + "signer_name_enc = COALESCE(?, signer_name_enc), "
                    + "child_name_confirm_enc = COALESCE(?, child_name_confirm_enc) "
                    + "WHERE id = ?",
                guardianRelation, guardianName, signerName, childName, id);
        } catch (Exception e) {
            counts.errors++;
            log.warn("SCT consent PII upgrade failed id={}: {}", id, e.getMessage());
            throw e;
        }
    }

    private void upgradeResponseAnswers(UpgradeCounts counts) {
        upgradeSingleCipherColumn(
            "sct_response_answers", "answer_text_enc", counts);
    }

    private void upgradeDomainMemos(UpgradeCounts counts) {
        upgradeSingleCipherColumn(
            "sct_domain_memos", "memo_text_enc", counts);
    }

    private void upgradeSingleCipherColumn(String table, String column, UpgradeCounts counts) {
        String sql = "SELECT id, " + column + " AS cipher_col FROM " + table
            + " WHERE is_deleted = false OR is_deleted IS NULL";
        List<Map<String, Object>> rows;
        try {
            rows = jdbcTemplate.queryForList(sql);
        } catch (Exception e) {
            log.debug("SCT PII upgrade skip table {}: {}", table, e.getMessage());
            return;
        }
        TransactionTemplate tx = new TransactionTemplate(transactionManager);
        String updateSql = "UPDATE " + table + " SET " + column + " = ? WHERE id = ?";
        for (Map<String, Object> row : rows) {
            tx.executeWithoutResult(status -> {
                Long id = toLong(row.get("id"));
                if (id == null) {
                    return;
                }
                try {
                    String upgraded = upgradeCipher((String) row.get("cipher_col"), counts);
                    if (upgraded == null) {
                        counts.skipped++;
                        return;
                    }
                    jdbcTemplate.update(updateSql, upgraded, id);
                } catch (Exception e) {
                    counts.errors++;
                    log.warn("SCT {} PII upgrade failed id={}: {}", table, id, e.getMessage());
                    throw e;
                }
            });
        }
    }

    /**
     * 평문/CBC → GCM. 이미 v2 이면 null(변경 없음).
     *
     * @param value  현재 컬럼 값
     * @param counts 카운터
     * @return 새 암호문 또는 null
     */
    private String upgradeCipher(String value, UpgradeCounts counts) {
        if (!StringUtils.hasText(value)) {
            return null;
        }
        if (PiiCipherFormats.looksV2(value)) {
            return null;
        }
        String plain = cryptoService.decryptCompatible(value);
        if (!StringUtils.hasText(plain)) {
            return null;
        }
        String gcm = cryptoService.encryptGcm(plain);
        counts.cipherUpdated++;
        return gcm;
    }

    /**
     * 전화/이메일 해시를 HMAC 으로 교정.
     *
     * @param plain      복호화된 평문 (정규화 전)
     * @param current    현재 해시
     * @param isPhone    전화이면 숫자 정규화
     * @param counts     카운터
     * @return 새 HMAC 또는 null
     */
    private String upgradeHash(String plain, String current, boolean isPhone, UpgradeCounts counts) {
        if (!StringUtils.hasText(plain)) {
            return null;
        }
        String normalized = isPhone ? normalizePhone(plain) : plain.trim().toLowerCase(Locale.ROOT);
        if (!StringUtils.hasText(normalized)) {
            return null;
        }
        String hmac = hmacService.hmacHex(normalized);
        if (hmac.equals(current)) {
            return null;
        }
        counts.hashUpdated++;
        return hmac;
    }

    private String plainFrom(String stored) {
        if (!StringUtils.hasText(stored)) {
            return null;
        }
        return cryptoService.decryptCompatible(stored);
    }

    private static String normalizePhone(String phone) {
        if (phone == null) {
            return null;
        }
        String digits = phone.replaceAll("[^0-9]", "");
        if (digits.startsWith("82") && digits.length() >= 11) {
            digits = "0" + digits.substring(2);
        }
        return digits;
    }

    private static Long toLong(Object value) {
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

    private static final class UpgradeCounts {
        private int cipherUpdated;
        private int hashUpdated;
        private int skipped;
        private int errors;
    }
}
