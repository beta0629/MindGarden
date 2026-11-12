package com.coresolution.core.deploy;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Component;

/**
 * Blue/Green 트래픽 슬롯 가드 — idle JVM 의 {@code @Scheduled} 실행 차단.
 *
 * <p>컷오버 이후 이전 active JVM 은 Nginx 롤백용으로 기동 상태를 유지하지만,
 * {@code /etc/mindgarden/active-backend}(또는 설정 경로)가 가리키는 트래픽 슬롯과
 * 일치할 때만 배치 잡을 실행한다. 예외를 던지지 않아 트랜잭션 rollback-only 나
 * 스케줄 실패 폭주를 만들지 않는다.</p>
 *
 * @author CoreSolution
 * @since 2026-11-12
 * @see ActiveBackendScheduledAspect
 * @see DeploySlotConstants
 */
@Slf4j
@Component
public class ActiveBackendSlotGuard {

    private final Environment environment;
    private final String instanceId;
    private final int serverPort;
    private final Path activeBackendFile;

    /**
     * @param environment       Spring Environment (prod 프로파일 판별)
     * @param instanceId        {@code app.instance.id} ({@code APP_INSTANCE_ID})
     * @param serverPort        {@code server.port} ({@code SERVER_PORT})
     * @param activeBackendFile 트래픽 슬롯 파일 경로
     */
    public ActiveBackendSlotGuard(
            Environment environment,
            @Value("${app.instance.id:default}") String instanceId,
            @Value("${server.port:8080}") int serverPort,
            @Value("${mindgarden.deploy.active-backend-file:"
                    + DeploySlotConstants.DEFAULT_ACTIVE_BACKEND_FILE + "}")
                    String activeBackendFile) {
        this.environment = environment;
        this.instanceId = instanceId;
        this.serverPort = serverPort;
        this.activeBackendFile = Path.of(activeBackendFile);
    }

    /**
     * 이 JVM 이 트래픽 슬롯이면 스케줄 잡을 실행해도 되는지 판정한다.
     *
     * <ul>
     *   <li>파일 없음 + non-prod → {@code true} (.dev 현행 유지)</li>
     *   <li>파일 없음/읽기실패/잘못된 값 + prod → {@code false} (ERROR 로그)</li>
     *   <li>파일 있음 + self == traffic → {@code true}</li>
     *   <li>파일 있음 + mismatch/unknown self → {@code false} (INFO 로그)</li>
     * </ul>
     *
     * @param schedulerName 로그용 스케줄러/메서드 식별자
     * @return 실행 허용 시 {@code true}
     */
    public boolean shouldRunScheduledJob(String schedulerName) {
        String selfSlot = resolveSelfSlot();
        TrafficSlotResolution traffic = resolveTrafficSlot();

        if (!traffic.present()) {
            if (isProdProfile()) {
                log.error(
                        "Active-backend 파일 없음/불가독/무효 — prod 스케줄 스킵. selfSlot={}, path={}, "
                                + "reason={}, schedulerName={}",
                        selfSlot,
                        activeBackendFile,
                        traffic.failureReason(),
                        schedulerName);
                return false;
            }
            return true;
        }

        String activeSlot = traffic.slot();
        if (activeSlot.equals(selfSlot)) {
            return true;
        }

        log.info(
                "Idle/비트래픽 슬롯 — 스케줄 스킵. selfSlot={}, activeBackend={}, schedulerName={}",
                selfSlot,
                activeSlot,
                schedulerName);
        return false;
    }

    /**
     * 이 JVM 의 슬롯을 해석한다.
     *
     * <ol>
     *   <li>{@code app.instance.id} 가 blue/green 이면 사용 (대소문자·trim 무시)</li>
     *   <li>아니면 {@code server.port} 8080→blue, 8081→green</li>
     *   <li>그 외 {@code null} (unknown)</li>
     * </ol>
     *
     * @return {@link DeploySlotConstants#SLOT_BLUE}, {@link DeploySlotConstants#SLOT_GREEN}, 또는 {@code null}
     */
    public String resolveSelfSlot() {
        String fromInstance = normalizeSlot(instanceId);
        if (fromInstance != null) {
            return fromInstance;
        }
        if (serverPort == DeploySlotConstants.BLUE_PORT) {
            return DeploySlotConstants.SLOT_BLUE;
        }
        if (serverPort == DeploySlotConstants.GREEN_PORT) {
            return DeploySlotConstants.SLOT_GREEN;
        }
        return null;
    }

    /**
     * 설정 경로의 active-backend 파일을 읽어 트래픽 슬롯을 해석한다.
     *
     * @return 해석 결과 (absent / unreadable / invalid / slot)
     */
    TrafficSlotResolution resolveTrafficSlot() {
        if (!Files.exists(activeBackendFile)) {
            return TrafficSlotResolution.absent();
        }
        final String raw;
        try {
            raw = Files.readString(activeBackendFile, StandardCharsets.UTF_8);
        } catch (IOException ex) {
            log.warn("Active-backend 파일 읽기 실패: path={}, message={}",
                    activeBackendFile, ex.getMessage());
            return TrafficSlotResolution.unreadable();
        }
        String slot = normalizeSlot(raw);
        if (slot == null) {
            return TrafficSlotResolution.invalid(raw == null ? "" : raw.trim());
        }
        return TrafficSlotResolution.ofSlot(slot);
    }

    Path getActiveBackendFile() {
        return activeBackendFile;
    }

    private boolean isProdProfile() {
        return environment != null && environment.acceptsProfiles("prod");
    }

    /**
     * trim + lowercase 후 blue|green 만 허용.
     *
     * @param value 원본 문자열
     * @return 정규화 슬롯 또는 {@code null}
     */
    static String normalizeSlot(String value) {
        if (value == null) {
            return null;
        }
        String normalized = value.trim().toLowerCase();
        if (DeploySlotConstants.SLOT_BLUE.equals(normalized)
                || DeploySlotConstants.SLOT_GREEN.equals(normalized)) {
            return normalized;
        }
        return null;
    }

    /**
     * active-backend 파일 해석 결과.
     *
     * @param present        유효 슬롯을 읽었는지
     * @param slot           blue|green (present 일 때만)
     * @param failureReason  실패 사유 코드 (absent|unreadable|invalid)
     */
    record TrafficSlotResolution(boolean present, String slot, String failureReason) {

        static TrafficSlotResolution ofSlot(String slot) {
            return new TrafficSlotResolution(true, slot, null);
        }

        static TrafficSlotResolution absent() {
            return new TrafficSlotResolution(false, null, "absent");
        }

        static TrafficSlotResolution unreadable() {
            return new TrafficSlotResolution(false, null, "unreadable");
        }

        static TrafficSlotResolution invalid(String raw) {
            return new TrafficSlotResolution(false, null, "invalid:" + raw);
        }
    }
}
