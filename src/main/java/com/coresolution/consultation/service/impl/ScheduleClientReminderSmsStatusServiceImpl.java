package com.coresolution.consultation.service.impl;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Collections;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;
import com.coresolution.consultation.constant.BatchNotificationTemplateCodes;
import com.coresolution.consultation.constant.ClientReminderSmsDisplayStatus;
import com.coresolution.consultation.constant.ClientReminderSmsFailureReasonLabels;
import com.coresolution.consultation.constant.ImmediateReservationSmsPendingStatus;
import com.coresolution.consultation.constant.ScheduleStatus;
import com.coresolution.consultation.dto.ClientReminderSmsStatusDto;
import com.coresolution.consultation.entity.ImmediateReservationSmsPending;
import com.coresolution.consultation.entity.NotificationBatchSendLog;
import com.coresolution.consultation.entity.Schedule;
import com.coresolution.consultation.repository.ImmediateReservationSmsPendingRepository;
import com.coresolution.consultation.repository.NotificationBatchSendLogRepository;
import com.coresolution.consultation.repository.ScheduleRepository;
import com.coresolution.consultation.service.ScheduleClientReminderSmsStatusService;
import com.coresolution.consultation.service.SmsTemplateService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * 스케줄 단위 내담자 예약 문자 상태 enrich 구현 (읽기 전용).
 *
 * @author MindGarden
 * @since 2026-08-01
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ScheduleClientReminderSmsStatusServiceImpl
        implements ScheduleClientReminderSmsStatusService {

    private static final List<ScheduleStatus> OCCUPYING_STATUSES = List.of(
            ScheduleStatus.BOOKED,
            ScheduleStatus.TENTATIVE_PENDING_PAYMENT,
            ScheduleStatus.CONFIRMED);

    private final ImmediateReservationSmsPendingRepository pendingRepository;
    private final NotificationBatchSendLogRepository sendLogRepository;
    private final ScheduleRepository scheduleRepository;
    private final SmsTemplateService smsTemplateService;

    @Override
    public Map<Long, ClientReminderSmsStatusDto> resolveByScheduleIds(
            String tenantId,
            Collection<Long> scheduleIds) {
        if (tenantId == null || tenantId.isBlank() || scheduleIds == null || scheduleIds.isEmpty()) {
            return Collections.emptyMap();
        }
        Set<Long> ids = scheduleIds.stream()
                .filter(Objects::nonNull)
                .collect(Collectors.toCollection(HashSet::new));
        if (ids.isEmpty()) {
            return Collections.emptyMap();
        }

        List<ImmediateReservationSmsPending> pendings =
                pendingRepository.findByTenantIdAndScheduleIdInAndIsDeletedFalse(tenantId, ids);
        List<NotificationBatchSendLog> logs =
                sendLogRepository.findByTenantIdAndTargetTypeAndTargetIdInAndTemplateCodeIn(
                        tenantId,
                        BatchNotificationTemplateCodes.TARGET_TYPE_SCHEDULE,
                        ids,
                        BatchNotificationTemplateCodes.RESERVATION_SCHEDULE_SMS_CODES);

        Map<Long, List<ImmediateReservationSmsPending>> pendingsBySchedule = new HashMap<>();
        for (ImmediateReservationSmsPending p : pendings) {
            if (p == null || p.getScheduleId() == null) {
                continue;
            }
            pendingsBySchedule.computeIfAbsent(p.getScheduleId(), k -> new ArrayList<>()).add(p);
        }
        Map<Long, List<NotificationBatchSendLog>> logsBySchedule = new HashMap<>();
        for (NotificationBatchSendLog l : logs) {
            if (l == null || l.getTargetId() == null) {
                continue;
            }
            logsBySchedule.computeIfAbsent(l.getTargetId(), k -> new ArrayList<>()).add(l);
        }

        Set<String> disabledTemplateCodes = disabledScheduleSmsCodes(tenantId);
        Map<Long, ClientReminderSmsStatusDto> result = new HashMap<>();
        for (Long scheduleId : ids) {
            ClientReminderSmsStatusDto dto = resolveOne(
                    pendingsBySchedule.getOrDefault(scheduleId, List.of()),
                    logsBySchedule.getOrDefault(scheduleId, List.of()),
                    disabledTemplateCodes);
            if (dto != null) {
                result.put(scheduleId, dto);
            }
        }
        return result;
    }

    /**
     * 예약 일정 SMS 3종 중 현재 자동 발송이 꺼진 템플릿 코드.
     *
     * @param tenantId 테넌트 ID
     * @return OFF 인 코드. 없으면 빈 집합
     */
    private Set<String> disabledScheduleSmsCodes(String tenantId) {
        Set<String> disabled = new HashSet<>();
        for (String templateCode : BatchNotificationTemplateCodes.RESERVATION_SCHEDULE_SMS_CODES) {
            if (!smsTemplateService.isAutoDispatchEnabledFor(templateCode, tenantId)) {
                disabled.add(templateCode);
            }
        }
        return disabled;
    }

    @Override
    public Map<Long, ClientReminderSmsStatusDto> resolveForNextConsultationByMappingIds(
            String tenantId,
            LocalDate fromDate,
            Collection<Long> mappingIds) {
        if (tenantId == null || tenantId.isBlank()
                || fromDate == null
                || mappingIds == null || mappingIds.isEmpty()) {
            return Collections.emptyMap();
        }
        Set<Long> ids = mappingIds.stream()
                .filter(Objects::nonNull)
                .collect(Collectors.toCollection(HashSet::new));
        if (ids.isEmpty()) {
            return Collections.emptyMap();
        }

        List<Schedule> schedules = scheduleRepository.findOccupyingSchedulesOnOrAfterByMappingIds(
                tenantId, ids, fromDate, OCCUPYING_STATUSES);
        Map<Long, Long> nextScheduleIdByMapping = new HashMap<>();
        for (Schedule schedule : schedules) {
            if (schedule == null || schedule.getMappingId() == null || schedule.getId() == null) {
                continue;
            }
            nextScheduleIdByMapping.putIfAbsent(schedule.getMappingId(), schedule.getId());
        }
        if (nextScheduleIdByMapping.isEmpty()) {
            return Collections.emptyMap();
        }

        Map<Long, ClientReminderSmsStatusDto> bySchedule =
                resolveByScheduleIds(tenantId, nextScheduleIdByMapping.values());
        Map<Long, ClientReminderSmsStatusDto> byMapping = new HashMap<>();
        for (Map.Entry<Long, Long> entry : nextScheduleIdByMapping.entrySet()) {
            ClientReminderSmsStatusDto dto = bySchedule.get(entry.getValue());
            if (dto != null) {
                byMapping.put(entry.getKey(), dto);
            }
        }
        return byMapping;
    }

    /**
     * pending ∪ send_log 병합. 제외 종목 없음(기존 호출·테스트).
     *
     * @param pendings pending 행
     * @param logs     발송 로그
     * @return 배지. 표시할 이벤트가 없으면 {@code null}
     */
    static ClientReminderSmsStatusDto resolveOne(
            List<ImmediateReservationSmsPending> pendings,
            List<NotificationBatchSendLog> logs) {
        return resolveOne(pendings, logs, Set.of());
    }

    /**
     * pending ∪ send_log 병합.
     * 우선순위: 활성 PENDING → 최신 확정 이벤트(FAILED/SENT). SKIPPED·해당없음 → null.
     * {@code disabledTemplateCodes} 에 있는 템플릿의 로그·pending 은 SENT/FAILED/PENDING 모두 제외한다.
     * 에러 메시지 문구로는 걸러내지 않는다.
     *
     * @param pendings               pending 행
     * @param logs                   발송 로그
     * @param disabledTemplateCodes  현재 자동 발송 OFF 인 템플릿 코드. null 이면 빈 집합
     * @return 배지. 표시할 이벤트가 없으면 {@code null}
     */
    static ClientReminderSmsStatusDto resolveOne(
            List<ImmediateReservationSmsPending> pendings,
            List<NotificationBatchSendLog> logs,
            Set<String> disabledTemplateCodes) {
        Set<String> disabled = disabledTemplateCodes == null ? Set.of() : disabledTemplateCodes;
        ImmediateReservationSmsPending earliestPending = pendings.stream()
                .filter(p -> ImmediateReservationSmsPendingStatus.PENDING.equals(p.getStatus()))
                .filter(p -> !isDisabledTemplate(p.getTemplateCode(), disabled))
                .min(Comparator.comparing(
                        ImmediateReservationSmsPending::getFireAt,
                        Comparator.nullsLast(Comparator.naturalOrder())))
                .orElse(null);
        if (earliestPending != null) {
            return ClientReminderSmsStatusDto.builder()
                    .status(ClientReminderSmsDisplayStatus.PENDING)
                    .fireAt(earliestPending.getFireAt())
                    .sentAt(null)
                    .failureReason(null)
                    .build();
        }

        NotificationBatchSendLog channelPending = logs.stream()
                .filter(l -> ClientReminderSmsDisplayStatus.CHANNEL_PENDING.equals(l.getChannelUsed()))
                .filter(l -> !isDisabledTemplate(l.getTemplateCode(), disabled))
                .max(Comparator.comparing(
                        NotificationBatchSendLog::getSentAt,
                        Comparator.nullsLast(Comparator.naturalOrder())))
                .orElse(null);
        if (channelPending != null) {
            return ClientReminderSmsStatusDto.builder()
                    .status(ClientReminderSmsDisplayStatus.PENDING)
                    .fireAt(null)
                    .sentAt(channelPending.getSentAt())
                    .failureReason(null)
                    .build();
        }

        List<ResolvedEvent> events = new ArrayList<>();
        for (NotificationBatchSendLog logRow : logs) {
            if (isDisabledTemplate(logRow.getTemplateCode(), disabled)) {
                continue;
            }
            if (ClientReminderSmsDisplayStatus.CHANNEL_PENDING.equals(logRow.getChannelUsed())) {
                continue;
            }
            boolean success = Boolean.TRUE.equals(logRow.getSuccess());
            events.add(new ResolvedEvent(
                    success ? ClientReminderSmsDisplayStatus.SENT : ClientReminderSmsDisplayStatus.FAILED,
                    null,
                    logRow.getSentAt(),
                    success ? null : ClientReminderSmsFailureReasonLabels.resolve(logRow.getErrorCode()),
                    logRow.getSentAt()));
        }
        for (ImmediateReservationSmsPending p : pendings) {
            if (isDisabledTemplate(p.getTemplateCode(), disabled)) {
                continue;
            }
            if (!ImmediateReservationSmsPendingStatus.SENT.equals(p.getStatus())) {
                continue;
            }
            LocalDateTime at = p.getProcessedAt() != null ? p.getProcessedAt() : p.getFireAt();
            events.add(new ResolvedEvent(
                    ClientReminderSmsDisplayStatus.SENT,
                    null,
                    at,
                    null,
                    at));
        }
        if (events.isEmpty()) {
            return null;
        }
        events.sort(Comparator.comparing(
                ResolvedEvent::sortAt,
                Comparator.nullsLast(Comparator.reverseOrder())));
        ResolvedEvent latest = events.get(0);
        return ClientReminderSmsStatusDto.builder()
                .status(latest.status)
                .fireAt(latest.fireAt)
                .sentAt(latest.sentAt)
                .failureReason(latest.failureReason)
                .build();
    }

    /**
     * 현재 자동 발송이 꺼진 종목인지.
     *
     * @param templateCode 로그·pending 의 템플릿 코드
     * @param disabled     OFF 코드 집합
     * @return 집합에 있으면 {@code true}
     */
    private static boolean isDisabledTemplate(String templateCode, Set<String> disabled) {
        return templateCode != null && disabled.contains(templateCode);
    }

    private static final class ResolvedEvent {
        private final String status;
        private final LocalDateTime fireAt;
        private final LocalDateTime sentAt;
        private final String failureReason;
        private final LocalDateTime sortAt;

        private ResolvedEvent(
                String status,
                LocalDateTime fireAt,
                LocalDateTime sentAt,
                String failureReason,
                LocalDateTime sortAt) {
            this.status = status;
            this.fireAt = fireAt;
            this.sentAt = sentAt;
            this.failureReason = failureReason;
            this.sortAt = sortAt;
        }

        private LocalDateTime sortAt() {
            return sortAt;
        }
    }
}
