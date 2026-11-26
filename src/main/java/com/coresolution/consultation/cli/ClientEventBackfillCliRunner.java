package com.coresolution.consultation.cli;

import com.coresolution.consultation.config.ClientEventBackfillProperties;
import com.coresolution.consultation.constant.ClientEventBackfillConstants;
import com.coresolution.consultation.constant.ClientEventBackfillMode;
import com.coresolution.consultation.dto.ClientEventBackfillResult;
import com.coresolution.consultation.service.ClientEventBackfillService;
import com.coresolution.consultation.service.support.ClientEventBackfillBusinessHoursGuard;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.ConfigurableApplicationContext;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

/**
 * 서버 로컬 {@code client_event} 백필 CLI (WebApplicationType.NONE 권장).
 *
 * <p>{@code client-event.backfill.cli.enabled=true} 일 때만 기동한다.
 * .dev HTTP 컨트롤러·토큰 필터·workflow 와 분리 — 운영은 본 CLI 만 사용한다.</p>
 *
 * @author MindGarden
 * @since 2026-11-26
 */
@Slf4j
@Component
@RequiredArgsConstructor
@ConditionalOnProperty(
        name = ClientEventBackfillConstants.PROP_CLI_ENABLED,
        havingValue = "true")
public class ClientEventBackfillCliRunner implements ApplicationRunner {

    private final ClientEventBackfillService clientEventBackfillService;
    private final ClientEventBackfillProperties properties;
    private final ClientEventBackfillBusinessHoursGuard businessHoursGuard;
    private final ConfigurableApplicationContext applicationContext;

    @Override
    public void run(ApplicationArguments args) {
        int exitCode = 0;
        try {
            businessHoursGuard.requireOutsideBlockedWindow();
            String tenantId = properties.getTenantId();
            if (!StringUtils.hasText(tenantId)) {
                throw new IllegalArgumentException(
                        ClientEventBackfillConstants.PROP_TENANT_ID + " 는 필수입니다.");
            }
            ClientEventBackfillMode mode =
                    ClientEventBackfillMode.fromCode(properties.getMode());
            ClientEventBackfillResult result = dispatch(mode, tenantId.trim());
            logResult(result);
        } catch (Exception ex) {
            exitCode = 1;
            log.error("client_event backfill CLI failed: {}", ex.getMessage(), ex);
        } finally {
            final int codeToReturn = exitCode;
            int code = SpringApplication.exit(applicationContext, () -> codeToReturn);
            System.exit(code);
        }
    }

    private ClientEventBackfillResult dispatch(ClientEventBackfillMode mode, String tenantId) {
        if (mode == ClientEventBackfillMode.ROLLBACK) {
            boolean applyDelete = ClientEventBackfillConstants.CONFIRM_ROLLBACK.equals(
                    properties.getConfirm());
            if (StringUtils.hasText(properties.getConfirm()) && !applyDelete) {
                throw new IllegalArgumentException(
                        ClientEventBackfillConstants.PROP_CONFIRM
                                + " 는 "
                                + ClientEventBackfillConstants.CONFIRM_ROLLBACK
                                + " 이어야 합니다 (누락 시 dry-run).");
            }
            return clientEventBackfillService.rollback(tenantId, !applyDelete);
        }
        if (mode == ClientEventBackfillMode.APPLY) {
            if (!ClientEventBackfillConstants.CONFIRM_APPLY.equals(properties.getConfirm())) {
                throw new IllegalArgumentException(
                        "apply 모드는 "
                                + ClientEventBackfillConstants.PROP_CONFIRM
                                + "="
                                + ClientEventBackfillConstants.CONFIRM_APPLY
                                + " 가 필요합니다.");
            }
            return clientEventBackfillService.apply(tenantId);
        }
        return clientEventBackfillService.dryRun(tenantId);
    }

    private void logResult(ClientEventBackfillResult result) {
        log.info(
                "client_event backfill CLI done: mode={}, tenantId={}, scanned={}, inserted={},"
                        + " skipped={}, errors={}, clientCount={}, byEventType={}",
                result.getMode() != null ? result.getMode().getCode() : null,
                result.getTenantId(),
                result.getScanned(),
                result.getInserted(),
                result.getSkipped(),
                result.getErrors(),
                result.getClientCount(),
                result.getByEventType());
    }
}
