package com.coresolution.consultation.service;

import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import com.coresolution.consultation.entity.ConsultantClientMapping;
import com.coresolution.consultation.entity.ConsultantClientMapping.MappingStatus;
import com.coresolution.consultation.entity.Schedule;
import com.coresolution.consultation.repository.ConsultantClientMappingRepository;
import com.coresolution.core.context.TenantContextHolder;
import lombok.Value;

/**
 * 스케줄 응답용 매칭 컨텍스트: 일정 시점 매칭(total·mappingId)과 현재 ACTIVE 매칭(remaining) 분리.
 *
 * @author CoreSolution
 * @since 2026-05-20
 */
public final class ScheduleMappingContextResolver {

    private ScheduleMappingContextResolver() {
    }

    /**
     * @param scheduleMappingForDisplay 일정 시점 매칭 (totalSessions·응답 mappingId)
     * @param currentActiveMapping      현재 ACTIVE/SESSIONS_EXHAUSTED (remainingSessions)
     */
    @Value
    public static class ScheduleMappingResponseContext {
        Long mappingId;
        Integer totalSessions;
        Integer remainingSessions;
    }

    public static ScheduleMappingResponseContext resolveForScheduleResponse(
            Schedule schedule,
            String tenantId,
            ConsultantClientMappingRepository mappingRepository,
            Map<String, ConsultantClientMapping> activeOrExhaustedLookup) {
        if (schedule == null || mappingRepository == null) {
            return emptyContext();
        }
        String resolvedTenantId = resolveTenantId(schedule, tenantId);
        ConsultantClientMapping scheduleMapping = resolveScheduleMapping(schedule, resolvedTenantId, mappingRepository);
        ConsultantClientMapping currentMapping = resolveActiveOrExhaustedMapping(
                resolvedTenantId,
                schedule.getConsultantId(),
                schedule.getClientId(),
                activeOrExhaustedLookup,
                mappingRepository);

        Long mappingId = schedule.getMappingId();
        if (mappingId == null && scheduleMapping != null) {
            mappingId = scheduleMapping.getId();
        }
        Integer totalSessions = scheduleMapping != null ? scheduleMapping.getTotalSessions() : null;
        Integer remainingSessions = currentMapping != null ? currentMapping.getRemainingSessions() : null;

        return new ScheduleMappingResponseContext(mappingId, totalSessions, remainingSessions);
    }

    /**
     * 일정 {@code created_at} 기준 당시 유효 매칭 (TERMINATED 포함). 복수 후보 시 가장 최근 생성 매칭.
     */
    public static ConsultantClientMapping resolveMappingForScheduleAtBookingTime(
            Schedule schedule,
            String tenantId,
            ConsultantClientMappingRepository mappingRepository) {
        if (schedule == null
                || mappingRepository == null
                || schedule.getConsultantId() == null
                || schedule.getClientId() == null) {
            return null;
        }
        String resolvedTenantId = resolveTenantId(schedule, tenantId);
        if (resolvedTenantId == null || resolvedTenantId.isEmpty()) {
            return null;
        }
        LocalDateTime bookingAt = schedule.getCreatedAt();
        if (bookingAt == null) {
            return null;
        }
        List<ConsultantClientMapping> mappings = mappingRepository
                .findAllByTenantIdAndConsultantIdAndClientIdOrderByCreatedAtDesc(
                        resolvedTenantId, schedule.getConsultantId(), schedule.getClientId());
        return mappings.stream()
                .filter(mapping -> isMappingEffectiveAt(mapping, bookingAt))
                .max(Comparator.comparing(ConsultantClientMapping::getCreatedAt, Comparator.nullsLast(Comparator.naturalOrder())))
                .orElse(null);
    }

    private static ConsultantClientMapping resolveScheduleMapping(
            Schedule schedule,
            String tenantId,
            ConsultantClientMappingRepository mappingRepository) {
        if (schedule.getMappingId() != null && tenantId != null && !tenantId.isEmpty()) {
            return mappingRepository.findByTenantIdAndId(tenantId, schedule.getMappingId()).orElse(null);
        }
        return resolveMappingForScheduleAtBookingTime(schedule, tenantId, mappingRepository);
    }

    private static boolean isMappingEffectiveAt(ConsultantClientMapping mapping, LocalDateTime instant) {
        if (mapping == null || instant == null) {
            return false;
        }
        LocalDateTime mappingCreatedAt = mapping.getCreatedAt();
        if (mappingCreatedAt != null && instant.isBefore(mappingCreatedAt)) {
            return false;
        }
        LocalDateTime terminatedAt = mapping.getTerminatedAt();
        return terminatedAt == null || instant.isBefore(terminatedAt);
    }

    public static Map<String, ConsultantClientMapping> buildActiveOrExhaustedMappingLookup(
            String tenantId,
            ConsultantClientMappingRepository mappingRepository) {
        if (tenantId == null || tenantId.isEmpty() || mappingRepository == null) {
            return Map.of();
        }
        List<ConsultantClientMapping> mappings = mappingRepository.findActiveOrExhaustedByTenantId(tenantId);
        Map<String, ConsultantClientMapping> lookup = new HashMap<>();
        for (ConsultantClientMapping mapping : mappings) {
            if (mapping.getConsultant() == null || mapping.getClient() == null) {
                continue;
            }
            Long consultantId = mapping.getConsultant().getId();
            Long clientId = mapping.getClient().getId();
            if (consultantId == null || clientId == null) {
                continue;
            }
            String key = mappingLookupKey(consultantId, clientId);
            lookup.merge(key, mapping, ScheduleMappingContextResolver::preferActiveMapping);
        }
        return lookup;
    }

    public static ConsultantClientMapping resolveActiveOrExhaustedMapping(
            String tenantId,
            Long consultantId,
            Long clientId,
            Map<String, ConsultantClientMapping> mappingLookup,
            ConsultantClientMappingRepository mappingRepository) {
        if (consultantId == null || clientId == null || tenantId == null || tenantId.isEmpty()) {
            return null;
        }
        if (mappingLookup != null && !mappingLookup.isEmpty()) {
            ConsultantClientMapping fromLookup = mappingLookup.get(mappingLookupKey(consultantId, clientId));
            if (fromLookup != null) {
                return fromLookup;
            }
        }
        if (mappingRepository == null) {
            return null;
        }
        List<ConsultantClientMapping> candidates = mappingRepository
                .findActiveOrExhaustedListByTenantIdAndConsultantIdAndClientId(tenantId, consultantId, clientId);
        return selectLatestActiveOrExhaustedMapping(candidates).orElse(null);
    }

    /**
     * ACTIVE/SESSIONS_EXHAUSTED 복수 매핑 중 최신 1건 선택 (NonUniqueResult 방지).
     */
    public static java.util.Optional<ConsultantClientMapping> selectLatestActiveOrExhaustedMapping(
            List<ConsultantClientMapping> candidates) {
        if (candidates == null || candidates.isEmpty()) {
            return java.util.Optional.empty();
        }
        Comparator<ConsultantClientMapping> recency = Comparator
                .comparing(ConsultantClientMapping::getUpdatedAt, Comparator.nullsFirst(Comparator.naturalOrder()))
                .thenComparing(ConsultantClientMapping::getCreatedAt, Comparator.nullsFirst(Comparator.naturalOrder()));
        java.util.Optional<ConsultantClientMapping> active = candidates.stream()
                .filter(m -> m.getStatus() == MappingStatus.ACTIVE)
                .max(recency);
        if (active.isPresent()) {
            return active;
        }
        return candidates.stream()
                .filter(m -> m.getStatus() == MappingStatus.SESSIONS_EXHAUSTED)
                .max(recency);
    }

    private static ConsultantClientMapping preferActiveMapping(
            ConsultantClientMapping existing,
            ConsultantClientMapping incoming) {
        if (existing.getStatus() == MappingStatus.ACTIVE) {
            return existing;
        }
        if (incoming.getStatus() == MappingStatus.ACTIVE) {
            return incoming;
        }
        return existing;
    }

    private static String mappingLookupKey(Long consultantId, Long clientId) {
        return consultantId + ":" + clientId;
    }

    private static String resolveTenantId(Schedule schedule, String tenantId) {
        if (tenantId != null && !tenantId.isEmpty()) {
            return tenantId;
        }
        if (schedule.getTenantId() != null && !schedule.getTenantId().isEmpty()) {
            return schedule.getTenantId();
        }
        return TenantContextHolder.getTenantId();
    }

    private static ScheduleMappingResponseContext emptyContext() {
        return new ScheduleMappingResponseContext(null, null, null);
    }
}
