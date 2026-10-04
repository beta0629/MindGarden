package com.coresolution.consultation.controller;

import java.time.LocalDate;
import java.util.Map;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.service.PlSqlConsultationRecordAlertService;
import com.coresolution.consultation.service.support.ClientPathAccessGuard;
import com.coresolution.consultation.util.ServerErrorResponses;
import jakarta.servlet.http.HttpSession;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * 상담일지 미작성 알림 API 컨트롤러.
 *
 * <p>2026-10-05 (#1407·#1408 검증 FAIL 보완): 모든 엔드포인트가 인증·권한 검증 없이 열려 있어
 * 내담자·상담사도 테넌트 전체의 미작성 현황을 읽을 수 있었다. {@code auto-complete-with-reminder}
 * 와 같은 공용 가드({@link ClientPathAccessGuard#requireTenantManager})를 클래스 전체에 적용하고,
 * 테넌트 범위를 호출자 테넌트로 강제한다. 실패 응답에 원시 예외 문구(예: 프로시저 부재 메시지)를
 * 싣지 않고 {@link ServerErrorResponses} 공용 5xx 응답(errorCode·traceId)만 돌려준다.</p>
 *
 * @author MindGarden
 * @version 1.1.0
 * @since 2025-01-11
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/admin/consultation-record-alerts") // 표준화 2025-12-05: 레거시 경로 제거
@PreAuthorize("isAuthenticated()")
public class ConsultationRecordAlertController {

    /** 수동 확인 최대 과거 일수 (월 단위 점검 범위). */
    private static final int MAX_MANUAL_CHECK_DAYS_BACK = 31;

    private static final String INVALID_DAYS_BACK_MESSAGE =
            "확인 기간(daysBack)은 1~" + MAX_MANUAL_CHECK_DAYS_BACK + "일 사이여야 합니다.";

    @Autowired
    private PlSqlConsultationRecordAlertService consultationRecordAlertService;

    @Autowired
    private ClientPathAccessGuard clientPathAccessGuard;

    /**
     * 상담일지 미작성 확인 및 알림 생성.
     *
     * @param checkDate 확인 기준일
     * @param branchCode 지점 코드 (nullable)
     * @param session HTTP 세션
     * @return 확인·생성 결과
     */
    @PostMapping("/check-missing")
    public ResponseEntity<Map<String, Object>> checkMissingRecords(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate checkDate,
            @RequestParam(required = false) String branchCode,
            HttpSession session) {

        requireTenantManager(session);
        log.info("📝 상담일지 미작성 확인 API 호출: 날짜={}, 지점={}", checkDate, branchCode);

        try {
            return respond(consultationRecordAlertService.checkMissingConsultationRecords(checkDate, branchCode));
        } catch (Exception e) {
            return ServerErrorResponses.internalError("상담일지 미작성 확인 실패", e);
        }
    }

    /**
     * 상담일지 미작성 알림 조회.
     *
     * @param branchCode 지점 코드 (nullable)
     * @param startDate 조회 시작일
     * @param endDate 조회 종료일
     * @param session HTTP 세션
     * @return 알림 목록
     */
    @GetMapping("/missing-alerts")
    public ResponseEntity<Map<String, Object>> getMissingAlerts(
            @RequestParam(required = false) String branchCode,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            HttpSession session) {

        requireTenantManager(session);
        log.info("📝 상담일지 미작성 알림 조회 API 호출: 지점={}, 기간={}~{}", branchCode, startDate, endDate);

        try {
            return respond(consultationRecordAlertService.getMissingConsultationRecordAlerts(
                    branchCode, startDate, endDate));
        } catch (Exception e) {
            return ServerErrorResponses.internalError("상담일지 미작성 알림 조회 실패", e);
        }
    }

    /**
     * 상담일지 작성 완료 시 알림 해제.
     *
     * @param consultationId 상담(스케줄) ID
     * @param resolvedBy 해제자 표시명
     * @param session HTTP 세션
     * @return 해제 결과
     */
    @PostMapping("/resolve-alert")
    public ResponseEntity<Map<String, Object>> resolveAlert(
            @RequestParam Long consultationId,
            @RequestParam String resolvedBy,
            HttpSession session) {

        requireTenantManager(session);
        log.info("📝 상담일지 알림 해제 API 호출: 상담ID={}", consultationId);

        try {
            return respond(consultationRecordAlertService.resolveConsultationRecordAlert(
                    consultationId, resolvedBy));
        } catch (Exception e) {
            return ServerErrorResponses.internalError("상담일지 알림 해제 실패", e);
        }
    }

    /**
     * 상담일지 미작성 통계 조회.
     *
     * @param branchCode 지점 코드 (nullable)
     * @param startDate 조회 시작일
     * @param endDate 조회 종료일
     * @param session HTTP 세션
     * @return 통계
     */
    @GetMapping("/statistics")
    public ResponseEntity<Map<String, Object>> getStatistics(
            @RequestParam(required = false) String branchCode,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            HttpSession session) {

        requireTenantManager(session);
        log.info("📊 상담일지 미작성 통계 조회 API 호출: 지점={}, 기간={}~{}", branchCode, startDate, endDate);

        try {
            return respond(consultationRecordAlertService.getConsultationRecordMissingStatistics(
                    branchCode, startDate, endDate));
        } catch (Exception e) {
            return ServerErrorResponses.internalError("상담일지 미작성 통계 조회 실패", e);
        }
    }

    /**
     * 상담사별 상담일지 미작성 현황 조회.
     *
     * @param consultantId 상담사 ID
     * @param startDate 조회 시작일
     * @param endDate 조회 종료일
     * @param session HTTP 세션
     * @return 상담사별 현황
     */
    @GetMapping("/consultant-missing")
    public ResponseEntity<Map<String, Object>> getConsultantMissingRecords(
            @RequestParam Long consultantId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            HttpSession session) {

        User caller = requireTenantManager(session);
        // 대상 상담사가 같은 테넌트에 있을 때만 (타 테넌트 id 는 403).
        clientPathAccessGuard.assertCanAccessConsultant(caller, consultantId);
        log.info("👤 상담사별 상담일지 미작성 현황 조회 API 호출: 상담사ID={}, 기간={}~{}",
                consultantId, startDate, endDate);

        try {
            return respond(consultationRecordAlertService.getConsultantMissingRecords(
                    consultantId, startDate, endDate));
        } catch (Exception e) {
            return ServerErrorResponses.internalError("상담사별 상담일지 미작성 현황 조회 실패", e);
        }
    }

    /**
     * 상담일지 알림 일괄 해제.
     *
     * @param consultantId 상담사 ID (nullable)
     * @param resolvedBy 해제자 표시명
     * @param session HTTP 세션
     * @return 해제 결과
     */
    @PostMapping("/resolve-all-alerts")
    public ResponseEntity<Map<String, Object>> resolveAllAlerts(
            @RequestParam(required = false) Long consultantId,
            @RequestParam String resolvedBy,
            HttpSession session) {

        User caller = requireTenantManager(session);
        if (consultantId != null) {
            clientPathAccessGuard.assertCanAccessConsultant(caller, consultantId);
        }
        log.info("📝 상담일지 알림 일괄 해제 API 호출: 상담사ID={}", consultantId);

        try {
            return respond(consultationRecordAlertService.resolveAllConsultationRecordAlerts(
                    consultantId, resolvedBy));
        } catch (Exception e) {
            return ServerErrorResponses.internalError("상담일지 알림 일괄 해제 실패", e);
        }
    }

    /**
     * 수동 상담일지 미작성 확인 실행 (관리자용).
     *
     * @param daysBack 며칠 전까지 확인할지
     * @param session HTTP 세션
     * @return 확인 결과
     */
    @PostMapping("/manual-check")
    public ResponseEntity<Map<String, Object>> manualCheck(
            @RequestParam(defaultValue = "1") int daysBack,
            HttpSession session) {

        requireTenantManager(session);
        log.info("🔧 수동 상담일지 미작성 확인 API 호출: {}일 전까지", daysBack);

        if (daysBack < 1 || daysBack > MAX_MANUAL_CHECK_DAYS_BACK) {
            throw new IllegalArgumentException(INVALID_DAYS_BACK_MESSAGE);
        }

        try {
            // 호출자 테넌트(TenantContext) 1건만 처리한다. 스케줄러의 수동 실행은 전체 활성 테넌트를 돌기 때문에
            // 테넌트 관리자 API 에서 호출하면 다른 테넌트까지 알림을 만든다.
            Map<String, Object> result =
                    consultationRecordAlertService.autoCreateMissingConsultationRecordAlerts(daysBack);
            return respond(result);
        } catch (Exception e) {
            return ServerErrorResponses.internalError("수동 상담일지 미작성 확인 실패", e);
        }
    }

    /**
     * 상담일지 알림 시스템 상태 확인.
     *
     * @param session HTTP 세션
     * @return 시스템 상태
     */
    @GetMapping("/status")
    public ResponseEntity<Map<String, Object>> getSystemStatus(HttpSession session) {
        requireTenantManager(session);
        log.info("🔍 상담일지 알림 시스템 상태 확인 API 호출");

        try {
            // 최근 7일간의 통계 조회
            LocalDate endDate = LocalDate.now().minusDays(1);
            LocalDate startDate = endDate.minusDays(6);

            Map<String, Object> statistics = consultationRecordAlertService
                    .getConsultationRecordMissingStatistics(null, startDate, endDate);

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "상담일지 알림 시스템이 정상 작동 중입니다",
                    "systemStatus", "ACTIVE",
                    "lastCheckDate", endDate.toString(),
                    "statistics", statistics));
        } catch (Exception e) {
            return ServerErrorResponses.internalError("상담일지 알림 시스템 상태 확인 실패", e);
        }
    }

    /**
     * 같은 테넌트 관리자·사무원만 허용하고 테넌트 범위를 확정한다 (미인증 401, 그 외 403).
     *
     * @param session HTTP 세션
     * @return 세션 사용자
     */
    /**
     * 서비스 결과를 응답으로 바꾼다. 서비스가 내부 오류(추적 id)를 표시했으면 공용 5xx 본문만 돌려준다.
     *
     * @param result 서비스 결과
     * @return 200 또는 공용 500 응답
     */
    private static ResponseEntity<Map<String, Object>> respond(Map<String, Object> result) {
        Object traceId = result != null ? result.get(ServerErrorResponses.TRACE_ID_KEY) : null;
        if (traceId != null) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ServerErrorResponses.body(traceId.toString()));
        }
        return ResponseEntity.ok(result);
    }

    private User requireTenantManager(HttpSession session) {
        User caller = clientPathAccessGuard.requireTenantManager(session);
        clientPathAccessGuard.requireCallerTenantId(caller);
        return caller;
    }
}
