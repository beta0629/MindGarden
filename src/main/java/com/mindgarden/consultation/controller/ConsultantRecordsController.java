package com.mindgarden.consultation.controller;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import com.mindgarden.consultation.service.AdminService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * 상담사 상담 기록 관리 컨트롤러
 */
@Slf4j
@RestController
@RequestMapping("/api/consultant")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class ConsultantRecordsController {
    
    private final AdminService adminService;
    
    /**
     * 상담사별 상담 기록 목록 조회
     * GET /api/consultant/{consultantId}/consultation-records
     */
    @GetMapping("/{consultantId}/consultation-records")
    public ResponseEntity<Map<String, Object>> getConsultationRecords(
            @PathVariable Long consultantId) {
        
        log.info("상담사 상담 기록 조회: consultantId={}", consultantId);
        
        try {
            // 상담사의 스케줄 데이터를 상담 기록으로 사용
            var schedules = adminService.getSchedulesByConsultantId(consultantId);
            
            // 스케줄을 상담 기록 형태로 변환
            List<Map<String, Object>> records = schedules.stream()
                    .map(schedule -> {
                        Map<String, Object> record = new HashMap<>();
                        record.put("id", schedule.get("id"));
                        record.put("title", schedule.get("title") != null ? schedule.get("title") : "상담 기록");
                        record.put("clientName", schedule.get("clientName"));
                        record.put("consultationDate", schedule.get("startTime"));
                        record.put("startTime", schedule.get("startTime"));
                        record.put("endTime", schedule.get("endTime"));
                        record.put("status", schedule.get("status"));
                        record.put("notes", schedule.get("notes"));
                        record.put("consultationType", schedule.get("consultationType"));
                        return record;
                    })
                    .toList();
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", records);
            response.put("totalCount", records.size());
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("상담 기록 조회 실패: consultantId={}, error={}", consultantId, e.getMessage(), e);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "상담 기록 조회에 실패했습니다: " + e.getMessage());
            
            return ResponseEntity.badRequest().body(response);
        }
    }
}
