package com.coresolution.consultation.cli;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyBoolean;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.coresolution.consultation.config.ClientEventBackfillProperties;
import com.coresolution.consultation.constant.ClientEventBackfillConstants;
import com.coresolution.consultation.constant.ClientEventBackfillMode;
import com.coresolution.consultation.dto.ClientEventBackfillResult;
import com.coresolution.consultation.service.ClientEventBackfillService;
import com.coresolution.consultation.service.support.ClientEventBackfillBusinessHoursGuard;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.ConfigurableApplicationContext;
import org.springframework.test.util.ReflectionTestUtils;

/**
 * CLI runner — confirm·tenant·운영시간 가드 검증(exit 없이 dispatch 경로).
 *
 * @author MindGarden
 * @since 2026-11-26
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("ClientEventBackfillCliRunner")
class ClientEventBackfillCliRunnerTest {

    @Mock
    private ClientEventBackfillService clientEventBackfillService;
    @Mock
    private ClientEventBackfillBusinessHoursGuard businessHoursGuard;
    @Mock
    private ConfigurableApplicationContext applicationContext;

    private ClientEventBackfillProperties properties;
    private ClientEventBackfillCliRunner runner;

    @BeforeEach
    void setUp() {
        properties = new ClientEventBackfillProperties();
        properties.setTenantId("tenant-cli");
        properties.setMode(ClientEventBackfillConstants.MODE_DRY_RUN);
        runner = new ClientEventBackfillCliRunner(
                clientEventBackfillService,
                properties,
                businessHoursGuard,
                applicationContext);
    }

    @Test
    @DisplayName("dry-run: confirm 없이 서비스 dryRun")
    void dryRun_withoutConfirm() {
        when(clientEventBackfillService.dryRun("tenant-cli"))
                .thenReturn(ClientEventBackfillResult.empty(
                        ClientEventBackfillMode.DRY_RUN, "tenant-cli"));

        ClientEventBackfillResult result = ReflectionTestUtils.invokeMethod(
                runner,
                "dispatch",
                ClientEventBackfillMode.DRY_RUN,
                "tenant-cli");

        assert result != null;
        verify(clientEventBackfillService).dryRun("tenant-cli");
        verify(clientEventBackfillService, never()).apply(any());
        verify(clientEventBackfillService, never()).rollback(any(), anyBoolean());
    }

    @Test
    @DisplayName("apply: confirm 누락 시 예외")
    void apply_requiresConfirm() {
        assertThatThrownBy(() -> ReflectionTestUtils.invokeMethod(
                        runner,
                        "dispatch",
                        ClientEventBackfillMode.APPLY,
                        "tenant-cli"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining(ClientEventBackfillConstants.CONFIRM_APPLY);
        verify(clientEventBackfillService, never()).apply(any());
    }

    @Test
    @DisplayName("apply: confirm=APPLY 이면 apply 호출")
    void apply_withConfirm() {
        properties.setConfirm(ClientEventBackfillConstants.CONFIRM_APPLY);
        when(clientEventBackfillService.apply("tenant-cli"))
                .thenReturn(ClientEventBackfillResult.empty(
                        ClientEventBackfillMode.APPLY, "tenant-cli"));

        ReflectionTestUtils.invokeMethod(
                runner, "dispatch", ClientEventBackfillMode.APPLY, "tenant-cli");

        verify(clientEventBackfillService).apply("tenant-cli");
    }

    @Test
    @DisplayName("rollback: confirm 없으면 dry-run 삭제 집계")
    void rollback_withoutConfirm_isDryRun() {
        when(clientEventBackfillService.rollback("tenant-cli", true))
                .thenReturn(ClientEventBackfillResult.empty(
                        ClientEventBackfillMode.DRY_RUN, "tenant-cli"));

        ReflectionTestUtils.invokeMethod(
                runner, "dispatch", ClientEventBackfillMode.ROLLBACK, "tenant-cli");

        verify(clientEventBackfillService).rollback(eq("tenant-cli"), eq(true));
    }

    @Test
    @DisplayName("rollback: confirm=ROLLBACK 이면 실제 삭제")
    void rollback_withConfirm_applies() {
        properties.setConfirm(ClientEventBackfillConstants.CONFIRM_ROLLBACK);
        when(clientEventBackfillService.rollback("tenant-cli", false))
                .thenReturn(ClientEventBackfillResult.empty(
                        ClientEventBackfillMode.ROLLBACK, "tenant-cli"));

        ReflectionTestUtils.invokeMethod(
                runner, "dispatch", ClientEventBackfillMode.ROLLBACK, "tenant-cli");

        verify(clientEventBackfillService).rollback(eq("tenant-cli"), eq(false));
    }
}
