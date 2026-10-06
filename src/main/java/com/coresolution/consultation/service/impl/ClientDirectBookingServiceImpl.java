package com.coresolution.consultation.service.impl;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;
import com.coresolution.consultation.constant.ScheduleStatus;
import com.coresolution.consultation.dto.ClientDirectBookingRequest;
import com.coresolution.consultation.dto.ClientDirectBookingResponse;
import com.coresolution.consultation.entity.CommonCode;
import com.coresolution.consultation.entity.Schedule;
import com.coresolution.consultation.exception.ClientBookingRejectedException;
import com.coresolution.consultation.exception.ClientBookingRejectedException.Reason;
import com.coresolution.consultation.exception.ValidationException;
import com.coresolution.consultation.repository.UserRepository;
import com.coresolution.consultation.service.ClientDirectBookingService;
import com.coresolution.consultation.service.CommonCodeService;
import com.coresolution.consultation.service.ConsultantAvailabilityService;
import com.coresolution.consultation.service.ScheduleService;
import com.coresolution.core.constant.OnboardingConstants;
import com.coresolution.core.context.TenantContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * 내담자 직접 예약 — 공통 판정·공통 가예약 생성만 조합한다.
 *
 * <ol>
 *   <li>상담사 행 쓰기 잠금 (같은 상담사 슬롯 신청 직렬화, 트랜잭션 첫 조회)</li>
 *   <li>상담 유형: 공통코드 {@code CONSULTATION_TYPE} 활성 코드</li>
 *   <li>과거 시각: {@link ScheduleService#requireCreateStartNotInPast} ({@code SCHEDULE_CREATE_IN_PAST})</li>
 *   <li>휴무: {@link ConsultantAvailabilityService#isConsultantOnVacation}</li>
 *   <li>매칭: {@link ScheduleService#allowsTentativeBeforeDepositForPair}</li>
 *   <li>슬롯 충돌: {@link ScheduleService#hasTimeConflict}</li>
 *   <li>생성: {@link ScheduleService#createConsultantSchedule} 가예약 분기 (차감 없음)</li>
 * </ol>
 *
 * @author CoreSolution
 * @since 2026-10-06
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class ClientDirectBookingServiceImpl implements ClientDirectBookingService {

    private final UserRepository userRepository;
    private final CommonCodeService commonCodeService;
    private final ConsultantAvailabilityService consultantAvailabilityService;
    private final ScheduleService scheduleService;

    @Override
    public ClientDirectBookingResponse createTentativeBooking(Long clientId, ClientDirectBookingRequest request) {
        String tenantId = TenantContextHolder.getRequiredTenantId();
        Long consultantId = request.getConsultantId();
        LocalDate date = request.getDate();
        LocalTime startTime = request.getStartTime();
        LocalTime endTime = request.getEndTime();

        if (userRepository.findByTenantIdAndIdForUpdate(tenantId, consultantId).isEmpty()) {
            log.info("내담자 예약 거부(상담사 없음): tenantId={}, consultantId={}", tenantId, consultantId);
            throw new ClientBookingRejectedException(Reason.NO_ACTIVE_MAPPING);
        }

        CommonCode consultationType = requireActiveConsultationType(tenantId, request.getConsultationType());
        scheduleService.requireCreateStartNotInPast(date, startTime);

        if (consultantAvailabilityService.isConsultantOnVacation(consultantId, date, startTime, endTime)) {
            throw new ClientBookingRejectedException(Reason.CONSULTANT_ON_VACATION);
        }
        if (!scheduleService.allowsTentativeBeforeDepositForPair(consultantId, clientId)) {
            log.info("내담자 예약 거부(매칭 없음): tenantId={}, consultantId={}, clientId={}",
                    tenantId, consultantId, clientId);
            throw new ClientBookingRejectedException(Reason.NO_ACTIVE_MAPPING);
        }
        if (scheduleService.hasTimeConflict(consultantId, date, startTime, endTime, null)) {
            throw new ClientBookingRejectedException(Reason.SLOT_CONFLICT);
        }

        Schedule schedule = createTentative(clientId, request, consultationType);
        if (schedule.getStatus() != ScheduleStatus.TENTATIVE_PENDING_PAYMENT) {
            throw new IllegalStateException("내담자 예약은 가예약으로만 생성되어야 합니다.");
        }
        log.info("내담자 가예약 생성: tenantId={}, scheduleId={}, consultantId={}, clientId={}, mappingId={}",
                tenantId, schedule.getId(), consultantId, clientId, schedule.getMappingId());
        return ClientDirectBookingResponse.fromEntity(schedule);
    }

    private Schedule createTentative(Long clientId, ClientDirectBookingRequest request, CommonCode consultationType) {
        try {
            return scheduleService.createConsultantSchedule(
                    request.getConsultantId(),
                    clientId,
                    request.getDate(),
                    request.getStartTime(),
                    request.getEndTime(),
                    resolveTitle(consultationType),
                    request.getMemo(),
                    consultationType.getCodeValue(),
                    null,
                    true);
        } catch (RuntimeException e) {
            // 공통 가예약 규칙(기관연계·점유 중 가예약 등)은 사용자 문구를 담은 RuntimeException 을 던진다.
            if (e.getClass() == RuntimeException.class) {
                throw new ClientBookingRejectedException(Reason.NOT_ALLOWED, e.getMessage());
            }
            throw e;
        }
    }

    private CommonCode requireActiveConsultationType(String tenantId, String requested) {
        String value = requested != null ? requested.trim() : "";
        List<CommonCode> codes = commonCodeService.getCodesByGroupWithFallback(
                tenantId, OnboardingConstants.TENANT_COMMON_CODE_GROUP_CONSULTATION_TYPE);
        Optional<CommonCode> match = codes == null ? Optional.empty() : codes.stream()
                .filter(code -> !Boolean.FALSE.equals(code.getIsActive()))
                .filter(code -> value.equals(code.getCodeValue()))
                .findFirst();
        return match.orElseThrow(() -> new ValidationException(
                "consultationType", value, "선택한 상담 유형을 사용할 수 없습니다."));
    }

    private static String resolveTitle(CommonCode consultationType) {
        if (hasText(consultationType.getKoreanName())) {
            return consultationType.getKoreanName();
        }
        if (hasText(consultationType.getCodeLabel())) {
            return consultationType.getCodeLabel();
        }
        return consultationType.getCodeValue();
    }

    private static boolean hasText(String value) {
        return value != null && !value.isBlank();
    }
}
