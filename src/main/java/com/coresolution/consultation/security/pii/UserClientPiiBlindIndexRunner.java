package com.coresolution.consultation.security.pii;

import java.util.List;
import java.util.Map;
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
 * users / clients email·phone HMAC 블라인드 인덱스 멱등 백필 러너.
 *
 * <p>키 또는 HMAC 시크릿이 없으면 한 행도 건드리지 않는다. 암호문 컬럼은 변경하지 않고
 * hash 컬럼만 UPDATE 한다. 로그는 건수만 남긴다.</p>
 *
 * @author CoreSolution
 * @since 2026-11-27
 */
@Slf4j
@Component
@Order(101)
@RequiredArgsConstructor
public class UserClientPiiBlindIndexRunner implements ApplicationRunner {

    private final PiiCryptoService cryptoService;
    private final PiiHmacService hmacService;
    private final JdbcTemplate jdbcTemplate;
    private final PlatformTransactionManager transactionManager;

    @Override
    public void run(ApplicationArguments args) {
        if (PiiLegacyUpgradeSupport.shouldSkipUpgrade(cryptoService, hmacService)) {
            log.warn("User/Client PII blind-index upgrade skipped — keys missing (no data touched)");
            return;
        }

        UpgradeCounts counts = new UpgradeCounts();
        try {
            upgradeUsers(counts);
            upgradeClients(counts);
            log.info(
                "User/Client PII blind-index upgrade done — hashUpdated={}, skipped={}, errors={}",
                counts.hashUpdated, counts.skipped, counts.errors);
        } catch (Exception e) {
            log.error("User/Client PII blind-index upgrade aborted: {}", e.getMessage());
        }
    }

    private void upgradeUsers(UpgradeCounts counts) {
        List<Map<String, Object>> rows;
        try {
            rows = jdbcTemplate.queryForList(
                "SELECT id, email, phone, email_hash, phone_hash FROM users");
        } catch (Exception e) {
            log.debug("User blind-index upgrade skip: {}", e.getMessage());
            return;
        }
        TransactionTemplate tx = new TransactionTemplate(transactionManager);
        for (Map<String, Object> row : rows) {
            tx.executeWithoutResult(status -> upgradeRow(
                "users", row, counts));
        }
    }

    private void upgradeClients(UpgradeCounts counts) {
        List<Map<String, Object>> rows;
        try {
            rows = jdbcTemplate.queryForList(
                "SELECT id, email, phone, email_hash, phone_hash FROM clients");
        } catch (Exception e) {
            log.debug("Client blind-index upgrade skip: {}", e.getMessage());
            return;
        }
        TransactionTemplate tx = new TransactionTemplate(transactionManager);
        for (Map<String, Object> row : rows) {
            tx.executeWithoutResult(status -> upgradeRow(
                "clients", row, counts));
        }
    }

    private void upgradeRow(String table, Map<String, Object> row, UpgradeCounts counts) {
        Long id = PiiLegacyUpgradeSupport.toLong(row.get("id"));
        if (id == null) {
            return;
        }
        try {
            String email = (String) row.get("email");
            String phone = (String) row.get("phone");
            String emailHash = (String) row.get("email_hash");
            String phoneHash = (String) row.get("phone_hash");

            String plainEmail = PiiLegacyUpgradeSupport.plainFrom(cryptoService, email);
            String plainPhone = PiiLegacyUpgradeSupport.plainFrom(cryptoService, phone);

            String newEmailHash = PiiLegacyUpgradeSupport.upgradeHash(
                hmacService, plainEmail, emailHash, false, counts);
            String newPhoneHash = PiiLegacyUpgradeSupport.upgradeHash(
                hmacService, plainPhone, phoneHash, true, counts);

            if (newEmailHash == null && newPhoneHash == null) {
                counts.skipped++;
                return;
            }

            jdbcTemplate.update(
                "UPDATE " + table + " SET email_hash = COALESCE(?, email_hash), "
                    + "phone_hash = COALESCE(?, phone_hash) WHERE id = ?",
                newEmailHash, newPhoneHash, id);
        } catch (Exception e) {
            counts.errors++;
            log.warn("{} PII blind-index upgrade failed id={}: {}", table, id, e.getMessage());
            throw e;
        }
    }
}
