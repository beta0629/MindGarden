package com.coresolution.consultation.controller;

import java.time.LocalDate;
import com.coresolution.consultation.constant.SessionStatisticsGranularity;
import com.coresolution.consultation.dto.response.ConsultantSessionStatisticsResponse;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.exception.ForbiddenException;
import com.coresolution.consultation.exception.UnauthorizedException;
import com.coresolution.consultation.service.ConsultantCompletedSessionStatisticsService;
import com.coresolution.consultation.utils.SessionUtils;
import com.coresolution.core.context.TenantContextHolder;
import com.coresolution.core.controller.BaseApiController;
import com.coresolution.core.dto.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * 상담사 본인 완료(COMPLETED) 회기 집계 API(급여 모듈과 분리).
 *
 * @author CoreSolution
 * @since 2026-05-16
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/consultants/me")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
@Tag(name = "Consultant session statistics", description = "상담사 본인 완료 회기 통계")
public class ConsultantSessionStatisticsController extends BaseApiController {

    private final ConsultantCompletedSessionStatisticsService consultantCompletedSessionStatisticsService;

    /**
     * 로그인 상담사(전문가) 본인의 완료 일정을 기간·단위로 집계한다.
     *
     * @param startDate 시작일(포함), ISO-8601 date
     * @param endDate 종료일(포함), ISO-8601 date
     * @param granularity DAY | WEEK | MONTH
     * @param session HTTP 세션
     * @return {@link ConsultantSessionStatisticsResponse}
     */
    @Operation(
            summary = "본인 완료 회기 통계",
            description = "tenantId·consultantId(세션 사용자) 스코프에서 COMPLETED 일정만 집계합니다. "
                    + "buckets.label: DAY는 해당일, WEEK는 ISO 주의 월요일, MONTH는 해당월 1일(YYYY-MM-DD).")
    @GetMapping("/session-statistics")
    public ResponseEntity<ApiResponse<ConsultantSessionStatisticsResponse>> getMySessionStatistics(
            @Parameter(description = "시작일(포함)", example = "2026-05-01", required = true)
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @Parameter(description = "종료일(포함)", example = "2026-05-31", required = true)
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @Parameter(description = "DAY, WEEK, MONTH", example = "DAY", required = true)
            @RequestParam String granularity,
            HttpSession session) {

        User currentUser = SessionUtils.getCurrentUser(session);
        if (currentUser == null) {
            throw new UnauthorizedException("로그인이 필요합니다. 세션을 확인해 주세요.");
        }
        if (currentUser.getRole() == null || !currentUser.getRole().isProfessionalProvider()) {
            throw new ForbiddenException("상담사(전문가)만 완료 회기 통계를 조회할 수 있습니다.");
        }
        if (currentUser.getId() == null) {
            throw new ForbiddenException("사용자 식별 정보가 없어 통계를 조회할 수 없습니다.");
        }
        if (currentUser.getTenantId() != null && !currentUser.getTenantId().isBlank()) {
            TenantContextHolder.setTenantId(currentUser.getTenantId());
        }

        String tenantId = TenantContextHolder.getTenantId();
        if (tenantId == null || tenantId.isBlank()) {
            tenantId = currentUser.getTenantId();
        }
        if (tenantId == null || tenantId.isBlank()) {
            log.warn("테넌트 정보 없음 - 완료 회기 통계 거부: userId={}", currentUser.getId());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error("테넌트 정보가 없습니다. 로그아웃 후 다시 로그인해 주세요."));
        }

        final SessionStatisticsGranularity gran;
        try {
            gran = SessionStatisticsGranularity.fromApiParam(granularity);
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error(ex.getMessage()));
        }

        try {
            ConsultantSessionStatisticsResponse body =
                    consultantCompletedSessionStatisticsService.aggregateCompletedSessions(
                            tenantId,
                            currentUser.getId(),
                            startDate,
                            endDate,
                            gran);
            return success("완료 회기 통계를 조회했습니다.", body);
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error(ex.getMessage()));
        }
    }
}
