package com.coresolution.consultation.controller;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import com.coresolution.consultation.dto.ConsultantAvailabilityDto;
import com.coresolution.consultation.service.ConsultantAvailabilityService;
import com.coresolution.consultation.service.impl.ConsultantAvailabilityServiceImpl;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * 상담사 상담 가능 시간 관리 컨트롤러
 */
@Slf4j
@RestController
@RequestMapping({"/api/v1/consultants/availability", "/api/consultant"}) // v1 경로 추가, 레거시 경로 유지
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class ConsultantAvailabilityController {
    
    private final ConsultantAvailabilityService availabilityService;
    
    /**
     * 상담사별 상담 가능 시간 목록 조회
     * GET /api/consultant/{consultantId}/availability
     */
    @GetMapping("/{consultantId}/availability")
    public ResponseEntity<Map<String, Object>> getAvailability(
            @PathVariable Long consultantId) {
        
        log.info("상담사 상담 가능 시간 조회: consultantId={}", consultantId);
        
        try {
            List<ConsultantAvailabilityDto> availabilities = availabilityService.getAvailabilityByConsultantId(consultantId);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", availabilities);
            response.put("totalCount", availabilities.size());
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("상담 가능 시간 조회 실패: consultantId={}, error={}", consultantId, e.getMessage(), e);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "상담 가능 시간 조회에 실패했습니다: " + e.getMessage());
            
            return ResponseEntity.badRequest().body(response);
        }
    }
    
    /**
     * 상담 가능 시간 추가
     * POST /api/consultant/{consultantId}/availability
     */
    @PostMapping("/{consultantId}/availability")
    public ResponseEntity<Map<String, Object>> addAvailability(
            @PathVariable Long consultantId,
            @RequestBody ConsultantAvailabilityDto dto) {
        
        log.info("상담 가능 시간 추가: consultantId={}, dto={}", consultantId, dto);
        
        try {
            dto.setConsultantId(consultantId);
            ConsultantAvailabilityDto saved = availabilityService.addAvailability(dto);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", saved);
            response.put("message", "상담 가능 시간이 추가되었습니다.");
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("상담 가능 시간 추가 실패: consultantId={}, error={}", consultantId, e.getMessage(), e);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "상담 가능 시간 추가에 실패했습니다: " + e.getMessage());
            
            return ResponseEntity.badRequest().body(response);
        }
    }
    
    /**
     * 상담 가능 시간 수정
     * PUT /api/consultant/availability/{id}
     */
    @PutMapping("/availability/{id}")
    public ResponseEntity<Map<String, Object>> updateAvailability(
            @PathVariable Long id,
            @RequestBody ConsultantAvailabilityDto dto) {
        
        log.info("상담 가능 시간 수정: id={}, dto={}", id, dto);
        
        try {
            ConsultantAvailabilityDto updated = availabilityService.updateAvailability(id, dto);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", updated);
            response.put("message", "상담 가능 시간이 수정되었습니다.");
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("상담 가능 시간 수정 실패: id={}, error={}", id, e.getMessage(), e);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "상담 가능 시간 수정에 실패했습니다: " + e.getMessage());
            
            return ResponseEntity.badRequest().body(response);
        }
    }
    
    /**
     * 상담 가능 시간 삭제
     * DELETE /api/consultant/availability/{id}
     */
    @DeleteMapping("/availability/{id}")
    public ResponseEntity<Map<String, Object>> deleteAvailability(@PathVariable Long id) {
        
        log.info("상담 가능 시간 삭제: id={}", id);
        
        try {
            availabilityService.deleteAvailability(id);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "상담 가능 시간이 삭제되었습니다.");
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("상담 가능 시간 삭제 실패: id={}, error={}", id, e.getMessage(), e);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "상담 가능 시간 삭제에 실패했습니다: " + e.getMessage());
            
            return ResponseEntity.badRequest().body(response);
        }
    }
    
    /**
     * 특정 날짜의 상담 가능 시간 조회 (관리자용)
     * GET /api/consultant/{consultantId}/availability/date?date=2024-01-15
     */
    @GetMapping("/{consultantId}/availability/date")
    public ResponseEntity<Map<String, Object>> getAvailabilityByDate(
            @PathVariable Long consultantId,
            @RequestParam String date) {
        
        log.info("특정 날짜 상담 가능 시간 조회: consultantId={}, date={}", consultantId, date);
        
        try {
            List<ConsultantAvailabilityDto> availabilities = availabilityService.getAvailabilityByConsultantId(consultantId);
            
            // 요일별로 그룹화
            Map<String, List<ConsultantAvailabilityDto>> groupedByDay = availabilities.stream()
                    .collect(Collectors.groupingBy(availability -> 
                            availability.getDayOfWeek().toString()));
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", groupedByDay);
            response.put("consultantId", consultantId);
            response.put("date", date);
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("특정 날짜 상담 가능 시간 조회 실패: consultantId={}, date={}, error={}", 
                    consultantId, date, e.getMessage(), e);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "상담 가능 시간 조회에 실패했습니다: " + e.getMessage());
            
            return ResponseEntity.badRequest().body(response);
        }
    }
    
    /**
     * 상담사 휴무 설정
     * POST /api/consultant/{consultantId}/vacation
     */
    @PostMapping("/{consultantId}/vacation")
    public ResponseEntity<Map<String, Object>> setVacation(
            @PathVariable Long consultantId,
            @RequestBody Map<String, Object> vacationData) {
        
        log.info("상담사 휴무 설정: consultantId={}, vacationData={}", consultantId, vacationData);
        
        try {
                String date = (String) vacationData.get("date");
                String type = (String) vacationData.get("type"); // "MORNING", "AFTERNOON", "ALL_DAY", "CUSTOM_TIME"
                String reason = (String) vacationData.get("reason");
                String startTime = (String) vacationData.get("startTime");
                String endTime = (String) vacationData.get("endTime");
            
            Map<String, Object> result = availabilityService.setVacation(consultantId, date, type, reason, startTime, endTime);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", result);
            response.put("message", "휴무가 설정되었습니다.");
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("휴무 설정 실패: consultantId={}, error={}", consultantId, e.getMessage(), e);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "휴무 설정에 실패했습니다: " + e.getMessage());
            
            return ResponseEntity.badRequest().body(response);
        }
    }
    
    /**
     * 상담사 휴무 조회
     * GET /api/consultant/{consultantId}/vacation?startDate=2024-01-01&endDate=2024-01-31
     */
    @GetMapping("/{consultantId}/vacation")
    public ResponseEntity<Map<String, Object>> getVacations(
            @PathVariable Long consultantId,
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate) {
        
        log.info("상담사 휴무 조회: consultantId={}, startDate={}, endDate={}", consultantId, startDate, endDate);
        
        try {
            List<Map<String, Object>> vacations = availabilityService.getVacations(consultantId, startDate, endDate);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", vacations);
            response.put("totalCount", vacations.size());
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("휴무 조회 실패: consultantId={}, error={}", consultantId, e.getMessage(), e);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "휴무 조회에 실패했습니다: " + e.getMessage());
            
            return ResponseEntity.badRequest().body(response);
        }
    }
    
    /**
     * 모든 상담사의 휴무 정보 조회 (관리자용)
     * GET /api/consultant/vacations?date=2024-01-15 (선택적)
     */
    @GetMapping("/vacations")
    public ResponseEntity<Map<String, Object>> getAllConsultantsVacations(
            @RequestParam(required = false) String date) {
        
        log.info("모든 상담사 휴무 정보 조회: date={}", date);
        
        try {
            Map<String, Object> allVacations = availabilityService.getAllConsultantsVacations(date);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", allVacations);
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("모든 상담사 휴무 정보 조회 실패: date={}, error={}", date, e.getMessage(), e);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "휴무 정보 조회에 실패했습니다: " + e.getMessage());
            
            return ResponseEntity.badRequest().body(response);
        }
    }
    
    /**
     * 상담사 휴무 삭제
     * DELETE /api/consultant/{consultantId}/vacation/{date}
     */
    @DeleteMapping("/{consultantId}/vacation/{date}")
    public ResponseEntity<Map<String, Object>> deleteVacation(
            @PathVariable Long consultantId,
            @PathVariable String date) {
        
        log.info("상담사 휴무 삭제: consultantId={}, date={}", consultantId, date);
        
        try {
            availabilityService.deleteVacation(consultantId, date);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "휴무가 삭제되었습니다.");
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("휴무 삭제 실패: consultantId={}, date={}, error={}", consultantId, date, e.getMessage(), e);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "휴무 삭제에 실패했습니다: " + e.getMessage());
            
            return ResponseEntity.badRequest().body(response);
        }
    }
    
    /**
     * 테스트용 휴무 데이터 초기화
     * POST /api/consultant/init-test-data
     */
    @PostMapping("/init-test-data")
    public ResponseEntity<Map<String, Object>> initializeTestData() {
        log.info("테스트용 휴무 데이터 초기화 요청");
        
        try {
            // ConsultantAvailabilityServiceImpl의 initializeTestVacationData 메서드 호출
            ((ConsultantAvailabilityServiceImpl) availabilityService).initializeTestVacationData();
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "테스트용 휴무 데이터가 초기화되었습니다.");
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("테스트 데이터 초기화 실패: {}", e.getMessage(), e);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "테스트 데이터 초기화에 실패했습니다: " + e.getMessage());
            
            return ResponseEntity.badRequest().body(response);
        }
    }
    
    /**
     * 휴무 데이터 직접 설정 (테스트용)
     * POST /api/consultant/set-vacation-data
     */
    @PostMapping("/set-vacation-data")
    public ResponseEntity<Map<String, Object>> setVacationData(@RequestBody Map<String, Object> request) {
        log.info("휴무 데이터 직접 설정 요청: {}", request);
        
        try {
            Long consultantId = Long.valueOf(request.get("consultantId").toString());
            String date = request.get("date").toString();
            Map<String, Object> vacationData = (Map<String, Object>) request.get("vacationData");
            
            // ConsultantAvailabilityServiceImpl의 setVacationData 메서드 호출
            ((ConsultantAvailabilityServiceImpl) availabilityService).setVacationData(consultantId, date, vacationData);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "휴무 데이터가 설정되었습니다.");
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("휴무 데이터 설정 실패: {}", e.getMessage(), e);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "휴무 데이터 설정에 실패했습니다: " + e.getMessage());
            
            return ResponseEntity.badRequest().body(response);
        }
    }
    
    /**
     * 간단한 휴무 조회 테스트 (디버깅용)
     * GET /api/consultant/vacations-simple
     */
    @GetMapping("/vacations-simple")
    public ResponseEntity<Map<String, Object>> getVacationsSimple(
            @RequestParam Long consultantId,
            @RequestParam String startDate,
            @RequestParam String endDate) {
        
        log.info("간단한 휴무 조회 테스트: consultantId={}, startDate={}, endDate={}", consultantId, startDate, endDate);
        
        try {
            // 간단한 하드코딩된 응답
            Map<String, Object> vacation = new HashMap<>();
            vacation.put("consultantId", consultantId);
            vacation.put("date", "2025-09-26");
            vacation.put("type", "FULL_DAY");
            vacation.put("reason", "개인 사정");
            vacation.put("startTime", "09:00");
            vacation.put("endTime", "18:00");
            vacation.put("isApproved", true);
            
            List<Map<String, Object>> vacations = List.of(vacation);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", vacations);
            response.put("totalCount", vacations.size());
            response.put("message", "휴무 조회 성공 (테스트)");
            
            log.info("간단한 휴무 조회 테스트 완료: {}개", vacations.size());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("간단한 휴무 조회 테스트 실패: {}", e.getMessage(), e);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "휴무 조회에 실패했습니다: " + e.getMessage());
            
            return ResponseEntity.badRequest().body(response);
        }
    }
}
