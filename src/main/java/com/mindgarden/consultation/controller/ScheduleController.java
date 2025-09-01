package com.mindgarden.consultation.controller;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import com.mindgarden.consultation.entity.Schedule;
import com.mindgarden.consultation.service.ScheduleService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * 스케줄 관리 컨트롤러
 * 권한 기반으로 상담사는 자신의 일정만, 관리자는 모든 일정을 조회/관리할 수 있습니다.
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2024-12-19
 */
@Slf4j
@RestController
@RequestMapping("/api/schedules")
@RequiredArgsConstructor
public class ScheduleController {

    private final ScheduleService scheduleService;

    // ==================== 권한 기반 스케줄 조회 ====================

    /**
     * 권한 기반 전체 스케줄 조회
     * 상담사: 자신의 일정만, 관리자: 모든 일정
     */
    @GetMapping
    public ResponseEntity<List<Schedule>> getSchedulesByUserRole(
            @RequestParam Long userId,
            @RequestParam String userRole) {
        
        log.info("🔐 권한 기반 스케줄 조회 요청: 사용자 {}, 역할 {}", userId, userRole);
        
        try {
            List<Schedule> schedules = scheduleService.findSchedulesByUserRole(userId, userRole);
            log.info("✅ 스케줄 조회 완료: {}개", schedules.size());
            return ResponseEntity.ok(schedules);
        } catch (Exception e) {
            log.error("❌ 스케줄 조회 실패: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * 권한 기반 특정 날짜 스케줄 조회
     */
    @GetMapping("/date/{date}")
    public ResponseEntity<List<Schedule>> getSchedulesByUserRoleAndDate(
            @RequestParam Long userId,
            @RequestParam String userRole,
            @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        
        log.info("🔐 권한 기반 특정 날짜 스케줄 조회: 사용자 {}, 역할 {}, 날짜 {}", userId, userRole, date);
        
        try {
            List<Schedule> schedules = scheduleService.findSchedulesByUserRoleAndDate(userId, userRole, date);
            log.info("✅ 특정 날짜 스케줄 조회 완료: {}개", schedules.size());
            return ResponseEntity.ok(schedules);
        } catch (Exception e) {
            log.error("❌ 특정 날짜 스케줄 조회 실패: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * 권한 기반 날짜 범위 스케줄 조회
     */
    @GetMapping("/date-range")
    public ResponseEntity<List<Schedule>> getSchedulesByUserRoleAndDateRange(
            @RequestParam Long userId,
            @RequestParam String userRole,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        
        log.info("🔐 권한 기반 날짜 범위 스케줄 조회: 사용자 {}, 역할 {}, 기간 {} ~ {}", userId, userRole, startDate, endDate);
        
        try {
            List<Schedule> schedules = scheduleService.findSchedulesByUserRoleAndDateBetween(userId, userRole, startDate, endDate);
            log.info("✅ 날짜 범위 스케줄 조회 완료: {}개", schedules.size());
            return ResponseEntity.ok(schedules);
        } catch (Exception e) {
            log.error("❌ 날짜 범위 스케줄 조회 실패: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    // ==================== 관리자 전용 ====================

    /**
     * 관리자용 전체 스케줄 통계 조회
     */
    @GetMapping("/admin/statistics")
    public ResponseEntity<Map<String, Object>> getScheduleStatisticsForAdmin(
            @RequestParam String userRole) {
        
        log.info("📊 관리자용 스케줄 통계 조회 요청: 역할 {}", userRole);
        
        // 관리자 권한 확인
        if (!"ADMIN".equals(userRole) && !"SUPER_ADMIN".equals(userRole)) {
            log.warn("❌ 관리자 권한 없음: {}", userRole);
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        
        try {
            Map<String, Object> statistics = scheduleService.getScheduleStatisticsForAdmin();
            log.info("✅ 관리자용 스케줄 통계 조회 완료");
            return ResponseEntity.ok(statistics);
        } catch (Exception e) {
            log.error("❌ 관리자용 스케줄 통계 조회 실패: {}", e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }

    // ==================== 상담사별 스케줄 관리 ====================

    /**
     * 상담사별 스케줄 조회 (관리자만 접근 가능)
     */
    @GetMapping("/consultant/{consultantId}")
    public ResponseEntity<List<Schedule>> getSchedulesByConsultant(
            @PathVariable Long consultantId,
            @RequestParam String userRole) {
        
        log.info("👨‍⚕️ 상담사별 스케줄 조회: 상담사 {}, 요청자 역할 {}", consultantId, userRole);
        
        // 관리자 권한 확인
        if (!"ADMIN".equals(userRole) && !"SUPER_ADMIN".equals(userRole)) {
            log.warn("❌ 관리자 권한 없음: {}", userRole);
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        
        try {
            List<Schedule> schedules = scheduleService.findByConsultantId(consultantId);
            log.info("✅ 상담사별 스케줄 조회 완료: {}개", schedules.size());
            return ResponseEntity.ok(schedules);
        } catch (Exception e) {
            log.error("❌ 상담사별 스케줄 조회 실패: {}", e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }

    // ==================== 내담자별 스케줄 관리 ====================

    /**
     * 내담자별 스케줄 조회 (관리자만 접근 가능)
     */
    @GetMapping("/client/{clientId}")
    public ResponseEntity<List<Schedule>> getSchedulesByClient(
            @PathVariable Long clientId,
            @RequestParam String userRole) {
        
        log.info("👤 내담자별 스케줄 조회: 내담자 {}, 요청자 역할 {}", clientId, userRole);
        
        // 관리자 권한 확인
        if (!"ADMIN".equals(userRole) && !"SUPER_ADMIN".equals(userRole)) {
            log.warn("❌ 관리자 권한 없음: {}", userRole);
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        
        try {
            List<Schedule> schedules = scheduleService.findByClientId(clientId);
            log.info("✅ 내담자별 스케줄 조회 완료: {}개", schedules.size());
            return ResponseEntity.ok(schedules);
        } catch (Exception e) {
            log.error("❌ 내담자별 스케줄 조회 실패: {}", e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }
}
