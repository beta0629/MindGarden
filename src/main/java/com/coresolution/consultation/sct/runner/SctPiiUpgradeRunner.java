package com.coresolution.consultation.sct.runner;

import java.util.List;
import java.util.Map;
import com.coresolution.consultation.security.pii.PiiCryptoService;
import com.coresolution.consultation.security.pii.PiiHmacService;
import com.coresolution.consultation.security.pii.PiiLegacyUpgradeSupport;
import com.coresolution.consultation.security.pii.PiiLegacyUpgradeSupport.UpgradeCounts;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;

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
        if (PiiLegacyUpgradeSupport.shouldSkipUpgrade(cryptoService, hmacService)) {
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
        Long id = PiiLegacyUpgradeSupport.toLong(row.get("id"));
        if (id == null) {
            return;
        }
        try {
            String recipientName = (String) row.get("recipient_name");
            String targetPhone = (String) row.get("target_phone");
            String targetEmail = (String) row.get("target_email");
            String phoneHash = (String) row.get("target_phone_hash");
            String emailHash = (String) row.get("target_email_hash");

            String newRecipient = PiiLegacyUpgradeSupport.upgradeCipher(
                cryptoService, recipientName, counts);
            String newPhone = PiiLegacyUpgradeSupport.upgradeCipher(
                cryptoService, targetPhone, counts);
            String newEmail = PiiLegacyUpgradeSupport.upgradeCipher(
                cryptoService, targetEmail, counts);

            String plainPhone = PiiLegacyUpgradeSupport.plainFrom(
                cryptoService, newPhone != null ? newPhone : targetPhone);
            String plainEmail = PiiLegacyUpgradeSupport.plainFrom(
                cryptoService, newEmail != null ? newEmail : targetEmail);
            String newPhoneHash = PiiLegacyUpgradeSupport.upgradeHash(
                hmacService, plainPhone, phoneHash, true, counts);
            String newEmailHash = PiiLegacyUpgradeSupport.upgradeHash(
                hmacService, plainEmail, emailHash, false, counts);

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
        Long id = PiiLegacyUpgradeSupport.toLong(row.get("id"));
        if (id == null) {
            return;
        }
        try {
            String guardianRelation = PiiLegacyUpgradeSupport.upgradeCipher(
                cryptoService, (String) row.get("guardian_relation"), counts);
            String guardianName = PiiLegacyUpgradeSupport.upgradeCipher(
                cryptoService, (String) row.get("guardian_name_enc"), counts);
            String signerName = PiiLegacyUpgradeSupport.upgradeCipher(
                cryptoService, (String) row.get("signer_name_enc"), counts);
            String childName = PiiLegacyUpgradeSupport.upgradeCipher(
                cryptoService, (String) row.get("child_name_confirm_enc"), counts);

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
                Long id = PiiLegacyUpgradeSupport.toLong(row.get("id"));
                if (id == null) {
                    return;
                }
                try {
                    String upgraded = PiiLegacyUpgradeSupport.upgradeCipher(
                        cryptoService, (String) row.get("cipher_col"), counts);
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
}
