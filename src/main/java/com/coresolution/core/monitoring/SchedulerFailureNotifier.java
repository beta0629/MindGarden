package com.coresolution.core.monitoring;

import java.util.Collections;
import java.util.HashMap;
import java.util.Map;
import java.util.Objects;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

/**
 * 스케줄러·배치 실패를 Discord webhook 으로 통지하는 공통 컴포넌트.
 *
 * <p>{@code monitoring.discord.webhook-url} 미설정 시 본 빈 자체가 등록되지 않아
 * 호출부는 {@code Optional<SchedulerFailureNotifier>} 또는 {@code @Autowired(required=false)}
 * 로 graceful skip(no-op) 한다.</p>
 *
 * <p>Discord webhook 인입 실패는 절대 본 BE 흐름을 막지 않는다 — 모든 예외는
 * {@code log.warn} 으로 swallow 한다 (운영 알람 채널만의 책임).</p>
 *
 * <p>참고: docs/project-management/2026-06-11/AI_MONITORING_ROADMAP.md Phase 1,
 * docs/운영반영/DISCORD_WEBHOOK_AND_AI_MONITORING_GUIDE.md.</p>
 *
 * @author MindGarden
 * @since 2026-06-14
 */
@Slf4j
@Component
@ConditionalOnProperty(name = "monitoring.discord.webhook-url")
public class SchedulerFailureNotifier {

    /** Discord webhook content 필드 한도 2000자, 헤더·코드블럭 여유 두고 1800자로 제한. */
    private static final int DISCORD_CONTENT_MAX_LENGTH = 1800;

    private final RestTemplate restTemplate;
    private final String webhookUrl;

    public SchedulerFailureNotifier(
            RestTemplate restTemplate,
            @Value("${monitoring.discord.webhook-url:}") String webhookUrl) {
        this.restTemplate = restTemplate;
        this.webhookUrl = webhookUrl == null ? "" : webhookUrl.trim();
    }

    /**
     * 스케줄러 실패 알람을 Discord 채널로 발송한다.
     *
     * @param schedulerName 스케줄러/배치 이름 (예: {@code "ErpAutomation"})
     * @param stepName      세부 단계 이름 (예: {@code "DailyFinancialClose"})
     * @param tenantId      대상 테넌트 ID (없으면 {@code null} / 빈 문자열)
     * @param error         원인 예외 (없으면 {@code null})
     */
    public void notifyFailure(String schedulerName, String stepName, String tenantId, Throwable error) {
        if (webhookUrl.isEmpty()) {
            return;
        }

        try {
            String content = buildContent(schedulerName, stepName, tenantId, error);
            Map<String, Object> payload = new HashMap<>();
            payload.put("content", content);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(payload, headers);

            ResponseEntity<String> response =
                restTemplate.postForEntity(webhookUrl, entity, String.class);

            HttpStatus status = HttpStatus.resolve(response.getStatusCodeValue());
            if (status == null || !(status == HttpStatus.NO_CONTENT || status == HttpStatus.OK)) {
                log.warn("[SchedulerFailureNotifier] Discord 발송 비정상 응답: status={}, scheduler={}, step={}",
                    response.getStatusCode(), schedulerName, stepName);
            }
        } catch (RestClientException ex) {
            log.warn("[SchedulerFailureNotifier] Discord 발송 실패 (network): scheduler={}, step={}, error={}",
                schedulerName, stepName, ex.getMessage());
        } catch (Exception ex) {
            log.warn("[SchedulerFailureNotifier] Discord 발송 실패 (unexpected): scheduler={}, step={}, error={}",
                schedulerName, stepName, ex.getMessage());
        }
    }

    private static String buildContent(String schedulerName, String stepName,
                                       String tenantId, Throwable error) {
        StringBuilder sb = new StringBuilder(256);
        sb.append("\uD83D\uDEA8 [Scheduler] ")
            .append(safe(schedulerName, "unknown-scheduler"))
            .append(" / ")
            .append(safe(stepName, "unknown-step"));
        if (tenantId != null && !tenantId.isEmpty()) {
            sb.append("\n• tenantId: `").append(tenantId).append("`");
        }
        if (error != null) {
            sb.append("\n• error: `")
                .append(safe(error.getClass().getSimpleName(), "Throwable"))
                .append("`")
                .append("\n```\n")
                .append(safe(error.getMessage(), "(no message)"))
                .append("\n```");
        }
        String content = sb.toString();
        if (content.length() > DISCORD_CONTENT_MAX_LENGTH) {
            content = content.substring(0, DISCORD_CONTENT_MAX_LENGTH);
        }
        return content;
    }

    private static String safe(String value, String fallback) {
        return (value == null || value.isEmpty()) ? fallback : value;
    }

    /** 테스트·디버그 용. (운영 코드에서 사용 금지) */
    Map<String, String> dumpConfig() {
        Map<String, String> map = new HashMap<>();
        map.put("webhookConfigured", Boolean.toString(!webhookUrl.isEmpty()));
        map.put("notifierClass", Objects.toString(getClass().getSimpleName()));
        return Collections.unmodifiableMap(map);
    }
}
