package com.coresolution.consultation.service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

import com.coresolution.consultation.entity.Client;
import com.coresolution.consultation.entity.ConsultantClientMapping;
import com.coresolution.consultation.entity.Schedule;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.repository.ClientRepository;
import com.coresolution.consultation.repository.ConsultantClientMappingRepository;
import com.coresolution.consultation.repository.ScheduleRepository;
import com.coresolution.consultation.repository.UserRepository;
import com.coresolution.consultation.service.ScheduleMappingContextResolver.ScheduleMappingResponseContext;
import org.springframework.stereotype.Component;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * 스케줄 목록 응답용 일괄 조회 (사용자·일정 시점 매칭·누적 회기).
 *
 * <p>행마다 사용자·매칭·누적 카운트를 조회하던 N+1 을 행 수와 무관한 고정 쿼리로 대체한다.
 * 관리자 목록(/schedules/admin)과 상담사 범위 목록(/schedules/consultant/{id})이 같은 조회를 쓴다.
 * 결과 값은 {@link ScheduleMappingContextResolver#resolveForScheduleResponse} 및
 * {@link ScheduleRepository#countSequenceUpToSchedule} 의 건별 계산과 같다.
 *
 * @author CoreSolution
 * @since 2026-10-07
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class ScheduleListBatchLoader {

    private final UserRepository userRepository;
    private final ConsultantClientMappingRepository mappingRepository;
    private final ScheduleRepository scheduleRepository;
    private final ClientRepository clientRepository;

    /**
     * 일정의 상담사·내담자 id 합집합.
     *
     * @param schedules 일정 목록
     * @return 사용자 id 집합
     */
    public static Set<Long> collectParticipantIds(List<Schedule> schedules) {
        Set<Long> userIds = new HashSet<>();
        if (schedules == null) {
            return userIds;
        }
        for (Schedule schedule : schedules) {
            if (schedule == null) {
                continue;
            }
            if (schedule.getConsultantId() != null) {
                userIds.add(schedule.getConsultantId());
            }
            if (schedule.getClientId() != null) {
                userIds.add(schedule.getClientId());
            }
        }
        return userIds;
    }

    /**
     * 테넌트 안의 미삭제 사용자 일괄 조회 ({@code findByTenantIdAndId} 와 같은 조건).
     *
     * @param tenantId 테넌트 ID
     * @param userIds 사용자 id
     * @return id → User (없는 id 는 키 없음)
     */
    public Map<Long, User> loadUsersById(String tenantId, Collection<Long> userIds) {
        if (isBlank(tenantId) || userIds == null || userIds.isEmpty()) {
            return Map.of();
        }
        try {
            Map<Long, User> out = new HashMap<>();
            for (User user : userRepository.findByTenantIdAndIdInAndIsDeletedFalse(tenantId, userIds)) {
                if (user != null && user.getId() != null) {
                    out.put(user.getId(), user);
                }
            }
            return out;
        } catch (Exception e) {
            log.warn("⚠️ 스케줄 목록 사용자 일괄 조회 실패: tenantId={}, error={}", tenantId, e.getMessage());
            return Map.of();
        }
    }

    /**
     * 일정별 매칭 컨텍스트(일정 시점 mappingId·totalSessions, 현재 ACTIVE/소진 remainingSessions).
     *
     * @param tenantId 테넌트 ID
     * @param schedules 일정 목록
     * @param activeOrExhaustedLookup {@link ScheduleMappingContextResolver#buildActiveOrExhaustedMappingLookup} 결과
     * @return scheduleId → 컨텍스트
     */
    public Map<Long, ScheduleMappingResponseContext> buildMappingContextByScheduleId(
            String tenantId,
            List<Schedule> schedules,
            Map<String, ConsultantClientMapping> activeOrExhaustedLookup) {
        if (schedules == null || schedules.isEmpty()) {
            return Map.of();
        }
        Set<Long> scheduleMappingIds = new HashSet<>();
        Set<Long> bookingConsultantIds = new HashSet<>();
        Set<Long> bookingClientIds = new HashSet<>();
        Set<String> bookingPairKeys = new HashSet<>();
        for (Schedule schedule : schedules) {
            if (schedule.getMappingId() != null) {
                scheduleMappingIds.add(schedule.getMappingId());
                continue;
            }
            if (schedule.getConsultantId() == null || schedule.getClientId() == null) {
                continue;
            }
            bookingConsultantIds.add(schedule.getConsultantId());
            bookingClientIds.add(schedule.getClientId());
            bookingPairKeys.add(toPairKey(schedule.getConsultantId(), schedule.getClientId()));
        }

        Map<Long, ConsultantClientMapping> mappingById = loadMappingsById(tenantId, scheduleMappingIds);
        Map<String, List<ConsultantClientMapping>> bookingCandidatesByPairKey = loadBookingCandidatesByPairKey(
                tenantId, bookingConsultantIds, bookingClientIds, bookingPairKeys);
        Map<Long, Client> clientsById = loadClientsById(tenantId, collectClientIds(schedules));

        Map<Long, ScheduleMappingResponseContext> out = new HashMap<>();
        for (Schedule schedule : schedules) {
            if (schedule == null || schedule.getId() == null) {
                continue;
            }
            Long mappingId = schedule.getMappingId();
            Integer totalSessions = null;
            String paymentTiming = null;
            ConsultantClientMapping displayMapping = null;
            if (mappingId != null) {
                displayMapping = mappingById.get(mappingId);
                totalSessions = displayMapping != null ? displayMapping.getTotalSessions() : null;
                paymentTiming = displayMapping != null ? displayMapping.getPaymentTiming() : null;
            } else if (schedule.getConsultantId() != null && schedule.getClientId() != null) {
                ConsultantClientMapping effective = resolveEffectiveMappingForBookingAt(
                        bookingCandidatesByPairKey.get(toPairKey(schedule.getConsultantId(), schedule.getClientId())),
                        schedule.getCreatedAt());
                if (effective != null) {
                    displayMapping = effective;
                    mappingId = effective.getId();
                    totalSessions = effective.getTotalSessions();
                    paymentTiming = effective.getPaymentTiming();
                }
            }

            Integer remainingSessions = null;
            ConsultantClientMapping current = null;
            if (activeOrExhaustedLookup != null
                    && schedule.getConsultantId() != null
                    && schedule.getClientId() != null) {
                current = activeOrExhaustedLookup.get(
                        toPairKey(schedule.getConsultantId(), schedule.getClientId()));
                remainingSessions = current != null ? current.getRemainingSessions() : null;
            }
            if (paymentTiming == null && current != null) {
                paymentTiming = current.getPaymentTiming();
            }
            Client client = schedule.getClientId() != null ? clientsById.get(schedule.getClientId()) : null;
            String engagementType = ScheduleMappingContextResolver.resolveEngagementType(client, paymentTiming);
            out.put(schedule.getId(), new ScheduleMappingResponseContext(
                    mappingId, totalSessions, remainingSessions, paymentTiming, engagementType));
        }
        return out;
    }

    /**
     * 일정 목록의 내담자 id 합집합.
     *
     * @param schedules 일정
     * @return clientId 집합
     */
    public static Set<Long> collectClientIds(List<Schedule> schedules) {
        Set<Long> clientIds = new HashSet<>();
        if (schedules == null) {
            return clientIds;
        }
        for (Schedule schedule : schedules) {
            if (schedule != null && schedule.getClientId() != null) {
                clientIds.add(schedule.getClientId());
            }
        }
        return clientIds;
    }

    /**
     * 테넌트 안 미삭제 내담자 일괄 조회 (engagementType).
     *
     * @param tenantId 테넌트
     * @param clientIds 내담자 id
     * @return id → Client
     */
    public Map<Long, Client> loadClientsById(String tenantId, Collection<Long> clientIds) {
        if (isBlank(tenantId) || clientIds == null || clientIds.isEmpty()) {
            return Map.of();
        }
        try {
            Map<Long, Client> out = new HashMap<>();
            for (Client client : clientRepository.findByTenantIdAndIdInAndIsDeletedFalse(tenantId, clientIds)) {
                if (client != null && client.getId() != null) {
                    out.put(client.getId(), client);
                }
            }
            return out;
        } catch (Exception e) {
            log.warn("⚠️ 스케줄 목록 내담자(engagement) 일괄 조회 실패: tenantId={}, error={}",
                    tenantId, e.getMessage());
            return Map.of();
        }
    }

    /**
     * 일정별 내담자 lifetime 회기 카운트 (해당 일정 시점까지, 취소 제외·sessionSequence 보유 일정).
     *
     * @param tenantId 테넌트 ID
     * @param schedules 일정 목록
     * @return scheduleId → 카운트 (내담자·날짜 없는 일정은 키 없음)
     */
    public Map<Long, Long> buildLifetimeSequenceCountByScheduleId(String tenantId, List<Schedule> schedules) {
        if (isBlank(tenantId) || schedules == null || schedules.isEmpty()) {
            return Map.of();
        }
        Set<Long> clientIds = new HashSet<>();
        LocalDate maxDate = null;
        for (Schedule schedule : schedules) {
            if (schedule == null || schedule.getId() == null
                    || schedule.getClientId() == null || schedule.getDate() == null) {
                continue;
            }
            clientIds.add(schedule.getClientId());
            if (maxDate == null || schedule.getDate().isAfter(maxDate)) {
                maxDate = schedule.getDate();
            }
        }
        if (clientIds.isEmpty()) {
            return Map.of();
        }

        try {
            Map<Long, List<SequenceCandidate>> candidatesByClientId = new HashMap<>();
            for (Object[] row : scheduleRepository.findSessionSequenceCandidatesByClientIdsUpToDate(
                    tenantId, clientIds, maxDate)) {
                if (row == null || row.length < 3 || row[0] == null || row[1] == null || row[2] == null) {
                    continue;
                }
                candidatesByClientId
                        .computeIfAbsent(((Number) row[0]).longValue(), ignored -> new ArrayList<>())
                        .add(new SequenceCandidate((LocalDate) row[1], ((Number) row[2]).longValue()));
            }

            Map<Long, Long> out = new HashMap<>();
            for (Schedule schedule : schedules) {
                if (schedule == null || schedule.getId() == null
                        || schedule.getClientId() == null || schedule.getDate() == null) {
                    continue;
                }
                out.put(schedule.getId(), countCandidatesUpTo(
                        candidatesByClientId.get(schedule.getClientId()), schedule.getDate(), schedule.getId()));
            }
            return out;
        } catch (Exception e) {
            log.warn("⚠️ 스케줄 목록 lifetime sequence 일괄 계산 실패: tenantId={}, error={}",
                    tenantId, e.getMessage());
            return Map.of();
        }
    }

    private Map<Long, ConsultantClientMapping> loadMappingsById(String tenantId, Set<Long> mappingIds) {
        if (isBlank(tenantId) || mappingIds.isEmpty()) {
            return Map.of();
        }
        try {
            Map<Long, ConsultantClientMapping> out = new HashMap<>();
            for (ConsultantClientMapping mapping
                    : mappingRepository.findByTenantIdAndIdInAndIsDeletedFalse(tenantId, mappingIds)) {
                if (mapping != null && mapping.getId() != null) {
                    out.put(mapping.getId(), mapping);
                }
            }
            return out;
        } catch (Exception e) {
            log.warn("⚠️ 스케줄 목록 매핑Id 일괄 조회 실패: tenantId={}, error={}", tenantId, e.getMessage());
            return Map.of();
        }
    }

    private Map<String, List<ConsultantClientMapping>> loadBookingCandidatesByPairKey(
            String tenantId,
            Set<Long> consultantIds,
            Set<Long> clientIds,
            Set<String> bookingPairKeys) {
        if (isBlank(tenantId) || consultantIds.isEmpty() || clientIds.isEmpty() || bookingPairKeys.isEmpty()) {
            return Map.of();
        }
        try {
            Map<String, List<ConsultantClientMapping>> out = new HashMap<>();
            for (ConsultantClientMapping mapping
                    : mappingRepository.findAllByTenantIdAndConsultantIdInAndClientIdInOrderByCreatedAtDesc(
                            tenantId, new ArrayList<>(consultantIds), new ArrayList<>(clientIds))) {
                if (mapping == null || mapping.getConsultant() == null || mapping.getClient() == null
                        || mapping.getConsultant().getId() == null || mapping.getClient().getId() == null) {
                    continue;
                }
                String pairKey = toPairKey(mapping.getConsultant().getId(), mapping.getClient().getId());
                if (bookingPairKeys.contains(pairKey)) {
                    out.computeIfAbsent(pairKey, ignored -> new ArrayList<>()).add(mapping);
                }
            }
            Comparator<ConsultantClientMapping> byCreatedAtDesc = Comparator
                    .comparing(ConsultantClientMapping::getCreatedAt, Comparator.nullsLast(Comparator.naturalOrder()))
                    .reversed();
            out.values().forEach(list -> list.sort(byCreatedAtDesc));
            return out;
        } catch (Exception e) {
            log.warn("⚠️ 스케줄 목록 예약 시점 매핑 일괄 조회 실패: tenantId={}, error={}", tenantId, e.getMessage());
            return Map.of();
        }
    }

    private static ConsultantClientMapping resolveEffectiveMappingForBookingAt(
            List<ConsultantClientMapping> candidates, LocalDateTime bookingAt) {
        if (bookingAt == null || candidates == null) {
            return null;
        }
        for (ConsultantClientMapping mapping : candidates) {
            if (isMappingEffectiveAt(mapping, bookingAt)) {
                return mapping;
            }
        }
        return null;
    }

    private static boolean isMappingEffectiveAt(ConsultantClientMapping mapping, LocalDateTime instant) {
        if (mapping == null || instant == null) {
            return false;
        }
        LocalDateTime createdAt = mapping.getCreatedAt();
        if (createdAt != null && instant.isBefore(createdAt)) {
            return false;
        }
        LocalDateTime terminatedAt = mapping.getTerminatedAt();
        return terminatedAt == null || instant.isBefore(terminatedAt);
    }

    /** candidates 는 date·scheduleId 오름차순. (date, id) ≤ (targetDate, targetId) 개수 */
    private static long countCandidatesUpTo(List<SequenceCandidate> candidates, LocalDate targetDate, Long targetId) {
        if (candidates == null || candidates.isEmpty()) {
            return 0L;
        }
        int lo = 0;
        int hi = candidates.size();
        while (lo < hi) {
            int mid = (lo + hi) >>> 1;
            SequenceCandidate candidate = candidates.get(mid);
            int cmp = candidate.date().compareTo(targetDate);
            if (cmp == 0) {
                cmp = candidate.scheduleId().compareTo(targetId);
            }
            if (cmp <= 0) {
                lo = mid + 1;
            } else {
                hi = mid;
            }
        }
        return lo;
    }

    private static String toPairKey(Long consultantId, Long clientId) {
        return consultantId + ":" + clientId;
    }

    private static boolean isBlank(String value) {
        return value == null || value.isEmpty();
    }

    private record SequenceCandidate(LocalDate date, Long scheduleId) {
    }
}
