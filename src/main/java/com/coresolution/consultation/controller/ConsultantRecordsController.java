package com.coresolution.consultation.controller;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import com.coresolution.consultation.constant.UserRole;
import com.coresolution.consultation.entity.Schedule;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.service.ConsultationRecordService;
import com.coresolution.consultation.service.DynamicPermissionService;
import com.coresolution.consultation.service.ScheduleService;
import com.coresolution.consultation.service.UserService;
import com.coresolution.consultation.util.PermissionCheckUtils;
import com.coresolution.consultation.utils.SessionUtils;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * 상담사 상담 기록 관리 컨트롤러
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/admin/consultant-records") // 표준화 2025-12-05: 레거시 경로 제거
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
@PreAuthorize("isAuthenticated()")
public class ConsultantRecordsController {
    
    private final ConsultationRecordService consultationRecordService;
    private final DynamicPermissionService dynamicPermissionService;
    private final UserService userService;
    private final ScheduleService scheduleService;
    private final com.coresolution.consultation.service.UserPersonalDataCacheService userPersonalDataCacheService;
    
    /**
     * 상담사별 상담 기록 목록 조회
     * - 관리자: 모든 상담사의 기록 조회 가능
     * - 상담사: 본인(consultantId = 로그인 사용자 ID) 기록만 조회 가능
     * GET /api/v1/admin/consultant-records/{consultantId}/consultation-records
     */
    @GetMapping("/{consultantId}/consultation-records")
    public ResponseEntity<Map<String, Object>> getConsultationRecords(
            @PathVariable Long consultantId,
            HttpSession session) {
        
        log.info("상담사 상담 기록 조회: consultantId={}", consultantId);
        
        User currentUser = SessionUtils.getCurrentUser(session);
        if (currentUser == null) {
            return ResponseEntity.status(401)
                    .body(Map.of("success", false, "message", "로그인이 필요합니다."));
        }
        if (!SessionUtils.isAdmin(session) && !consultantId.equals(currentUser.getId())) {
            return ResponseEntity.status(403)
                    .body(Map.of("success", false, "message", "본인의 상담일지만 조회할 수 있습니다."));
        }
        
        try {
            // 실제 상담일지 데이터 조회 (최근 20개)
            Pageable pageable = PageRequest.of(0, 20);
            var consultationRecords = consultationRecordService.getConsultationRecords(consultantId, null, pageable);
            
            // 상담일지를 상담 기록 형태로 변환 (모든 상담일지 포함)
            List<Map<String, Object>> records = consultationRecords.getContent().stream()
                    .map(record -> {
                        Map<String, Object> recordMap = new HashMap<>();
                        recordMap.put("id", record.getId());
                        recordMap.put("title", "상담일지 #" + record.getSessionNumber());
                        // 실제 내담자 이름 조회
                        String clientName = getClientName(record.getClientId());
                        recordMap.put("clientName", clientName);
                        String sessionDateStr = record.getSessionDate().toString();
                        recordMap.put("sessionDate", sessionDateStr);
                        recordMap.put("consultationDate", sessionDateStr);
                        
                        // 상담 시간 설정 (완료 시간이 있으면 사용, 없으면 기본 상담 시간 사용)
                        int sessionDuration = record.getSessionDurationMinutes() != null ? record.getSessionDurationMinutes() : 60; // 기본 60분
                        String startTimeStr = record.getSessionDate().atStartOfDay().plusHours(9).toString(); // 오전 9시 시작
                        String endTimeStr = record.getSessionDate().atStartOfDay().plusHours(9).plusMinutes(sessionDuration).toString();
                        
                        // 완료 시간이 있으면 실제 완료 시간 사용
                        if (record.getCompletionTime() != null) {
                            endTimeStr = record.getCompletionTime().toString();
                        }
                        
                        recordMap.put("startTime", startTimeStr);
                        recordMap.put("endTime", endTimeStr);
                        recordMap.put("status", record.getIsSessionCompleted() ? "COMPLETED" : "PENDING");
                        recordMap.put("notes", record.getConsultantObservations());
                        recordMap.put("consultationType", "INDIVIDUAL"); // 기본값
                        recordMap.put("isSessionCompleted", record.getIsSessionCompleted());
                        recordMap.put("sessionNumber", record.getSessionNumber());
                        recordMap.put("sessionDuration", record.getSessionDurationMinutes());
                        return recordMap;
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
    
    /**
     * 상담기록 삭제 (소프트 삭제)
     * DELETE /api/consultant/{consultantId}/consultation-records/{recordId}
     */
    @DeleteMapping("/{consultantId}/consultation-records/{recordId}")
    public ResponseEntity<Map<String, Object>> deleteConsultationRecord(
            @PathVariable Long consultantId,
            @PathVariable Long recordId) {
        
        log.info("상담기록 삭제 요청: consultantId={}, recordId={}", consultantId, recordId);
        
        try {
            consultationRecordService.deleteConsultationRecord(recordId);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "상담기록이 삭제되었습니다.");
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("상담기록 삭제 실패: consultantId={}, recordId={}, error={}", consultantId, recordId, e.getMessage(), e);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "상담기록 삭제에 실패했습니다: " + e.getMessage());
            
            return ResponseEntity.badRequest().body(response);
        }
    }
    
    /**
     * 상담기록 상세 조회
     * GET /api/consultant/{consultantId}/consultation-records/{recordId}
     */
    @GetMapping("/{consultantId}/consultation-records/{recordId}")
    public ResponseEntity<Map<String, Object>> getConsultationRecord(
            @PathVariable Long consultantId,
            @PathVariable Long recordId,
            HttpSession session) {
        
        log.info("상담기록 상세 조회: consultantId={}, recordId={}", consultantId, recordId);
        
        try {
            // 동적 권한 체크
            ResponseEntity<?> permissionResponse = PermissionCheckUtils.checkPermission(session, "ACCESS_CONSULTATION_RECORDS", dynamicPermissionService);
            if (permissionResponse != null) {
                return (ResponseEntity<Map<String, Object>>) permissionResponse;
            }
            // 상담기록 조회
            var record = consultationRecordService.getConsultationRecordById(recordId);
            
            if (record == null) {
                Map<String, Object> response = new HashMap<>();
                response.put("success", false);
                response.put("message", "상담기록을 찾을 수 없습니다.");
                return ResponseEntity.notFound().build();
            }
            
            // 상담사 ID 검증
            if (!record.getConsultantId().equals(consultantId)) {
                Map<String, Object> response = new HashMap<>();
                response.put("success", false);
                response.put("message", "접근 권한이 없습니다.");
                return ResponseEntity.status(403).body(response);
            }
            
            // 상담기록을 상세 조회 형태로 변환
            Map<String, Object> recordMap = new HashMap<>();
            recordMap.put("id", record.getId());
            recordMap.put("title", "상담일지 #" + record.getSessionNumber());
            // 실제 내담자 이름 조회
            String clientName = getClientName(record.getClientId());
            recordMap.put("clientName", clientName);
            recordMap.put("clientId", record.getClientId());
            recordMap.put("consultantId", record.getConsultantId());
            recordMap.put("consultationDate", record.getSessionDate().toString());
            recordMap.put("sessionDate", record.getSessionDate().toString());
            
            // 상담 시간 설정
            int sessionDuration = record.getSessionDurationMinutes() != null ? record.getSessionDurationMinutes() : 60;
            String startTimeStr = record.getSessionDate().atStartOfDay().plusHours(9).toString();
            String endTimeStr = record.getSessionDate().atStartOfDay().plusHours(9).plusMinutes(sessionDuration).toString();
            
            if (record.getCompletionTime() != null) {
                endTimeStr = record.getCompletionTime().toString();
            }
            
            recordMap.put("startTime", startTimeStr);
            recordMap.put("endTime", endTimeStr);
            recordMap.put("status", record.getIsSessionCompleted() ? "COMPLETED" : "PENDING");
            recordMap.put("notes", record.getConsultantObservations());
            recordMap.put("consultationType", "INDIVIDUAL");
            recordMap.put("isSessionCompleted", record.getIsSessionCompleted());
            recordMap.put("sessionNumber", record.getSessionNumber());
            recordMap.put("sessionDuration", record.getSessionDurationMinutes());
            
            // 상담일지 전체 필드 추가
            recordMap.put("clientCondition", record.getClientCondition());
            recordMap.put("mainIssues", record.getMainIssues());
            recordMap.put("interventionMethods", record.getInterventionMethods());
            recordMap.put("clientResponse", record.getClientResponse());
            recordMap.put("nextSessionPlan", record.getNextSessionPlan());
            recordMap.put("homeworkAssigned", record.getHomeworkAssigned());
            recordMap.put("homeworkDueDate", record.getHomeworkDueDate());
            recordMap.put("riskAssessment", record.getRiskAssessment());
            recordMap.put("riskFactors", record.getRiskFactors());
            recordMap.put("emergencyResponsePlan", record.getEmergencyResponsePlan());
            recordMap.put("progressEvaluation", record.getProgressEvaluation());
            recordMap.put("progressScore", record.getProgressScore());
            recordMap.put("goalAchievement", record.getGoalAchievement());
            recordMap.put("goalAchievementDetails", record.getGoalAchievementDetails());
            recordMap.put("consultantObservations", record.getConsultantObservations());
            recordMap.put("consultantAssessment", record.getConsultantAssessment());
            recordMap.put("specialConsiderations", record.getSpecialConsiderations());
            recordMap.put("medicalInformation", record.getMedicalInformation());
            recordMap.put("medicationInfo", record.getMedicationInfo());
            recordMap.put("familyRelationships", record.getFamilyRelationships());
            recordMap.put("socialSupport", record.getSocialSupport());
            recordMap.put("environmentalFactors", record.getEnvironmentalFactors());
            recordMap.put("incompletionReason", record.getIncompletionReason());
            recordMap.put("nextSessionDate", record.getNextSessionDate());
            recordMap.put("followUpActions", record.getFollowUpActions());
            recordMap.put("followUpDueDate", record.getFollowUpDueDate());
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", recordMap);
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("상담기록 상세 조회 실패: consultantId={}, recordId={}, error={}", consultantId, recordId, e.getMessage(), e);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "상담기록 조회에 실패했습니다: " + e.getMessage());
            
            return ResponseEntity.badRequest().body(response);
        }
    }
    
    /**
     * 스케줄과 상담기록 데이터 일관성 검증
     * GET /api/consultant/{consultantId}/data-consistency-check
     */
    @GetMapping("/{consultantId}/data-consistency-check")
    public ResponseEntity<Map<String, Object>> checkDataConsistency(@PathVariable Long consultantId) {
        
        log.info("데이터 일관성 검증: consultantId={}", consultantId);
        
        try {
            Map<String, Object> result = new HashMap<>();
            
            // 1. 스케줄 데이터 조회 (기존 메서드 사용)
            List<Schedule> schedules = scheduleService.findSchedulesByUserRole(consultantId, UserRole.CONSULTANT.name());
            
            // 2. 상담기록 데이터 조회
            Pageable pageable = PageRequest.of(0, 100);
            var consultationRecords = consultationRecordService.getConsultationRecords(consultantId, null, pageable);
            
            // 3. 불일치 데이터 찾기
            List<Map<String, Object>> inconsistencies = new ArrayList<>();
            
            for (var record : consultationRecords.getContent()) {
                if (record.getIsSessionCompleted() == null || !record.getIsSessionCompleted()) {
                    // 실제 스케줄 존재 여부 확인
                    boolean hasSchedule = hasScheduleForRecord(record, schedules);
                    if (!hasSchedule) {
                        // 대기 중인 상담기록이지만 실제 스케줄이 없는 경우
                        inconsistencies.add(Map.of(
                            "type", "PENDING_RECORD_WITHOUT_SCHEDULE",
                            "recordId", record.getId(),
                            "sessionDate", record.getSessionDate(),
                            "description", "대기 중인 상담기록이지만 해당 날짜에 예약된 스케줄이 없습니다."
                        ));
                    }
                }
            }
            
            result.put("success", true);
            result.put("consultantId", consultantId);
            result.put("totalRecords", consultationRecords.getContent().size());
            result.put("inconsistencies", inconsistencies);
            result.put("inconsistencyCount", inconsistencies.size());
            
            return ResponseEntity.ok(result);
            
        } catch (Exception e) {
            log.error("데이터 일관성 검증 실패: consultantId={}, error={}", consultantId, e.getMessage(), e);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "데이터 일관성 검증에 실패했습니다: " + e.getMessage());
            
            return ResponseEntity.badRequest().body(response);
        }
    }
    
    /**
     * 불일치 데이터 정리 및 복구
     * POST /api/consultant/{consultantId}/cleanup-inconsistent-data
     */
    @PostMapping("/{consultantId}/cleanup-inconsistent-data")
    public ResponseEntity<Map<String, Object>> cleanupInconsistentData(@PathVariable Long consultantId) {
        
        log.info("🧹 불일치 데이터 정리 시작: consultantId={}", consultantId);
        
        try {
            Map<String, Object> result = new HashMap<>();
            List<Map<String, Object>> cleanedRecords = new ArrayList<>();
            
            // 1. 스케줄 데이터 조회 (기존 메서드 사용)
            List<Schedule> schedules = scheduleService.findSchedulesByUserRole(consultantId, UserRole.CONSULTANT.name());
            
            // 2. 불일치 데이터 조회
            Pageable pageable = PageRequest.of(0, 100);
            var consultationRecords = consultationRecordService.getConsultationRecords(consultantId, null, pageable);
            
            // 3. 대기 중인 상담기록 중 실제 상담 예약이 없는 것들 찾기
            for (var record : consultationRecords.getContent()) {
                if (record.getIsSessionCompleted() == null || !record.getIsSessionCompleted()) {
                    // 실제 상담 예약 존재 여부 확인
                    boolean hasSchedule = hasScheduleForRecord(record, schedules);
                    if (!hasSchedule) {
                        // 상담 예약이 없는 경우에만 완료 상태로 변경
                        Map<String, Object> updateData = new HashMap<>();
                        updateData.put("isSessionCompleted", true);
                        updateData.put("consultantObservations", 
                            (record.getConsultantObservations() != null ? record.getConsultantObservations() : "") + 
                            "\n[시스템 정리] 불일치 데이터 복구 - " + java.time.LocalDateTime.now()
                        );
                        consultationRecordService.updateConsultationRecord(record.getId(), updateData);
                        
                        cleanedRecords.add(Map.of(
                            "recordId", record.getId(),
                            "sessionDate", record.getSessionDate(),
                            "action", "COMPLETED"
                        ));
                    }
                }
            }
            
            result.put("success", true);
            result.put("consultantId", consultantId);
            result.put("cleanedRecords", cleanedRecords);
            result.put("cleanedCount", cleanedRecords.size());
            result.put("message", "불일치 데이터 정리가 완료되었습니다.");
            
            log.info("✅ 불일치 데이터 정리 완료: {}건 처리", cleanedRecords.size());
            return ResponseEntity.ok(result);
            
        } catch (Exception e) {
            log.error("❌ 불일치 데이터 정리 실패: consultantId={}, error={}", consultantId, e.getMessage(), e);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "불일치 데이터 정리에 실패했습니다: " + e.getMessage());
            
            return ResponseEntity.badRequest().body(response);
        }
    }
    
    /**
     * 내담자 이름 조회 헬퍼 메서드
     */
    private String getClientName(Long clientId) {
        try {
            Optional<User> clientOpt = userService.findById(clientId);
            if (clientOpt.isPresent()) {
                User client = clientOpt.get();
                Map<String, String> decryptedData = userPersonalDataCacheService.getDecryptedUserData(client);
                String name = decryptedData.get("name");
                if (name != null && !name.isEmpty()) {
                    return name;
                }
                return client.getUserId() != null ? client.getUserId() : "내담자 ID: " + clientId;
            }
        } catch (Exception e) {
            log.warn("내담자 이름 조회 실패: clientId={}, error={}", clientId, e.getMessage());
        }
        return "내담자 ID: " + clientId;
    }
    
    /**
     * 상담 기록에 해당하는 스케줄 존재 여부 확인 헬퍼 메서드
     */
    private boolean hasScheduleForRecord(com.coresolution.consultation.entity.ConsultationRecord record, List<Schedule> schedules) {
        if (schedules == null || schedules.isEmpty()) {
            return false;
        }
        
        return schedules.stream()
            .anyMatch(schedule -> 
                schedule.getConsultantId() != null && 
                schedule.getConsultantId().equals(record.getConsultantId()) &&
                schedule.getDate() != null &&
                schedule.getDate().equals(record.getSessionDate())
            );
    }
}
