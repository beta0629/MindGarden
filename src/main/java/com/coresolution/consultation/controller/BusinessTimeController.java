package com.coresolution.consultation.controller;

import java.util.Map;
import com.coresolution.consultation.service.BusinessTimeService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * 업무 시간 및 정책 관리 컨트롤러
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-01-27
 */
@RestController
@RequestMapping({"/api/v1/admin/business-time", "/api/admin/business-time"})
@RequiredArgsConstructor
@Slf4j
public class BusinessTimeController {
    
    private final BusinessTimeService businessTimeService;
    
    /**
     * 모든 업무 시간 설정 조회
     */
    @GetMapping("/settings")
    public ResponseEntity<Map<String, Object>> getBusinessTimeSettings() {
        Map<String, Object> settings = businessTimeService.getAllBusinessTimeSettings();
        
        log.info("🕐 업무 시간 설정 조회 성공: {}", settings);
        
        return ResponseEntity.ok(Map.of(
            "success", true,
            "data", settings,
            "message", "업무 시간 설정을 성공적으로 조회했습니다."
        ));
    }
    
    /**
     * 업무 시간 설정 업데이트
     */
    @PostMapping("/settings")
    public ResponseEntity<Map<String, Object>> updateBusinessTimeSettings(
            @RequestBody Map<String, Object> settings) {
        log.info("🕐 업무 시간 설정 업데이트 요청: {}", settings);
        
        // 입력값 검증
        validateBusinessTimeSettings(settings);
        
        // 설정 업데이트
        businessTimeService.updateBusinessTimeSettings(settings);
        
        log.info("✅ 업무 시간 설정 업데이트 성공");
        
        return ResponseEntity.ok(Map.of(
            "success", true,
            "message", "업무 시간 설정이 성공적으로 업데이트되었습니다.",
            "data", businessTimeService.getAllBusinessTimeSettings()
        ));
    }
    
    /**
     * 특정 시간이 업무 시간인지 확인
     */
    @GetMapping("/check-time")
    public ResponseEntity<Map<String, Object>> checkBusinessTime(
            @RequestParam String time) {
        boolean isBusinessTime = businessTimeService.isBusinessTime(
            java.time.LocalTime.parse(time)
        );
        
        return ResponseEntity.ok(Map.of(
            "success", true,
            "data", Map.of(
                "time", time,
                "isBusinessTime", isBusinessTime,
                "isLunchTime", businessTimeService.isLunchTime(java.time.LocalTime.parse(time))
            ),
            "message", isBusinessTime ? "업무 시간입니다." : "업무 시간이 아닙니다."
        ));
    }
    
    /**
     * 업무 시간 설정 입력값 검증
     */
    private void validateBusinessTimeSettings(Map<String, Object> settings) {
        // 필수 필드 검증
        String[] requiredFields = {
            "businessStartTime", "businessEndTime", 
            "lunchStartTime", "lunchEndTime",
            "slotIntervalMinutes", "minNoticeHours",
            "maxAdvanceBookingDays", "breakTimeMinutes"
        };
        
        for (String field : requiredFields) {
            if (!settings.containsKey(field) || settings.get(field) == null) {
                throw new IllegalArgumentException("필수 필드가 누락되었습니다: " + field);
            }
        }
        
        // 시간 형식 검증
        String[] timeFields = {"businessStartTime", "businessEndTime", "lunchStartTime", "lunchEndTime"};
        for (String field : timeFields) {
            String timeStr = (String) settings.get(field);
            if (!timeStr.matches("\\d{2}:\\d{2}")) {
                throw new IllegalArgumentException("잘못된 시간 형식입니다: " + field + " = " + timeStr);
            }
        }
        
        // 숫자 필드 검증
        String[] numericFields = {"slotIntervalMinutes", "minNoticeHours", "maxAdvanceBookingDays", "breakTimeMinutes"};
        for (String field : numericFields) {
            Object value = settings.get(field);
            if (!(value instanceof Number) || ((Number) value).intValue() <= 0) {
                throw new IllegalArgumentException("잘못된 숫자 값입니다: " + field + " = " + value);
            }
        }
        
        // 논리적 검증
        String businessStart = (String) settings.get("businessStartTime");
        String businessEnd = (String) settings.get("businessEndTime");
        String lunchStart = (String) settings.get("lunchStartTime");
        String lunchEnd = (String) settings.get("lunchEndTime");
        
        java.time.LocalTime startTime = java.time.LocalTime.parse(businessStart);
        java.time.LocalTime endTime = java.time.LocalTime.parse(businessEnd);
        java.time.LocalTime lunchStartTime = java.time.LocalTime.parse(lunchStart);
        java.time.LocalTime lunchEndTime = java.time.LocalTime.parse(lunchEnd);
        
        if (!startTime.isBefore(endTime)) {
            throw new IllegalArgumentException("업무 시작시간이 종료시간보다 늦을 수 없습니다.");
        }
        
        if (!lunchStartTime.isBefore(lunchEndTime)) {
            throw new IllegalArgumentException("점심 시작시간이 종료시간보다 늦을 수 없습니다.");
        }
        
        if (!startTime.isBefore(lunchStartTime) || !lunchEndTime.isBefore(endTime)) {
            throw new IllegalArgumentException("점심시간은 업무시간 내에 있어야 합니다.");
        }
    }
}
