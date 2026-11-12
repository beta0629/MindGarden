package com.coresolution.core.deploy;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.api.io.TempDir;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.core.env.Environment;

/**
 * {@link ActiveBackendSlotGuard} 단위 테스트 — 트래픽 슬롯 일치 시에만 스케줄 허용.
 *
 * @author CoreSolution
 * @since 2026-11-12
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("ActiveBackendSlotGuard — 트래픽 슬롯 스케줄 가드")
class ActiveBackendSlotGuardTest {

    private static final String SCHEDULER_NAME = "ReservationReminderScheduler.runDailyReminder()";

    @Mock
    private Environment environment;

    @TempDir
    Path tempDir;

    @Test
    @DisplayName("Given active 슬롯과 일치 When shouldRun Then true")
    void shouldRun_whenSelfMatchesActiveSlot_returnsTrue() throws Exception {
        // Given
        Path file = writeActiveBackend(DeploySlotConstants.SLOT_BLUE);
        ActiveBackendSlotGuard guard = newGuard(
                DeploySlotConstants.SLOT_BLUE,
                DeploySlotConstants.BLUE_PORT,
                file);

        // When
        boolean allowed = guard.shouldRunScheduledJob(SCHEDULER_NAME);

        // Then
        assertThat(allowed).isTrue();
    }

    @Test
    @DisplayName("Given idle 슬롯(불일치) When shouldRun Then false")
    void shouldRun_whenSelfIsIdleSlot_returnsFalse() throws Exception {
        // Given
        Path file = writeActiveBackend(DeploySlotConstants.SLOT_BLUE);
        ActiveBackendSlotGuard guard = newGuard(
                DeploySlotConstants.SLOT_GREEN,
                DeploySlotConstants.GREEN_PORT,
                file);

        // When
        boolean allowed = guard.shouldRunScheduledJob(SCHEDULER_NAME);

        // Then
        assertThat(allowed).isFalse();
    }

    @Test
    @DisplayName("Given 파일 없음 + non-prod When shouldRun Then true")
    void shouldRun_whenFileMissingAndNonProd_returnsTrue() {
        // Given
        Path missing = tempDir.resolve("missing-active-backend");
        when(environment.acceptsProfiles("prod")).thenReturn(false);
        ActiveBackendSlotGuard guard = newGuard("default", 9090, missing);

        // When
        boolean allowed = guard.shouldRunScheduledJob(SCHEDULER_NAME);

        // Then
        assertThat(allowed).isTrue();
    }

    @Test
    @DisplayName("Given 파일 없음 + prod When shouldRun Then false")
    void shouldRun_whenFileMissingAndProd_returnsFalse() {
        // Given
        Path missing = tempDir.resolve("missing-active-backend-prod");
        when(environment.acceptsProfiles("prod")).thenReturn(true);
        ActiveBackendSlotGuard guard = newGuard(
                DeploySlotConstants.SLOT_BLUE,
                DeploySlotConstants.BLUE_PORT,
                missing);

        // When
        boolean allowed = guard.shouldRunScheduledJob(SCHEDULER_NAME);

        // Then
        assertThat(allowed).isFalse();
    }

    @Test
    @DisplayName("Given APP_INSTANCE_ID 미설정 + SERVER_PORT=8081 When resolveSelf Then green")
    void resolveSelfSlot_fallsBackToServerPort() {
        // Given
        ActiveBackendSlotGuard guard = newGuard(
                "default",
                DeploySlotConstants.GREEN_PORT,
                tempDir.resolve("unused"));

        // When
        String selfSlot = guard.resolveSelfSlot();

        // Then
        assertThat(selfSlot).isEqualTo(DeploySlotConstants.SLOT_GREEN);
    }

    private ActiveBackendSlotGuard newGuard(String instanceId, int port, Path file) {
        return new ActiveBackendSlotGuard(environment, instanceId, port, file.toString());
    }

    private Path writeActiveBackend(String slot) throws Exception {
        Path file = tempDir.resolve("active-backend");
        Files.writeString(file, slot + "\n", StandardCharsets.UTF_8);
        return file;
    }
}
