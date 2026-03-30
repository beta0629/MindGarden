package com.coresolution.consultation.service.impl;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;
import com.coresolution.consultation.constant.UserRole;
import com.coresolution.consultation.entity.ConsultationRecord;
import com.coresolution.consultation.repository.ConsultationRecordRepository;
import com.coresolution.consultation.repository.ConsultationRepository;
import com.coresolution.consultation.repository.ScheduleRepository;
import com.coresolution.consultation.constant.ScheduleStatus;
import com.coresolution.consultation.entity.Schedule;
import com.coresolution.consultation.service.ConsultationRecordService;
import com.coresolution.consultation.service.PlSqlConsultationRecordAlertService;
import com.coresolution.core.context.TenantContextHolder;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import lombok.extern.slf4j.Slf4j;

/**
 * 상담일지 서비스 구현체
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2024-12-19
 */
@Slf4j
@Service
@Transactional
public class ConsultationRecordServiceImpl implements ConsultationRecordService {

    @Autowired
    private ConsultationRecordRepository consultationRecordRepository;
    
    @Autowired
    private ConsultationRepository consultationRepository;
    
    @Autowired
    private PlSqlConsultationRecordAlertService consultationRecordAlertService;

    @Autowired
    private ScheduleRepository scheduleRepository;

    @Override
    public Page<ConsultationRecord> getConsultationRecords(Long consultantId, Long clientId, Pageable pageable) {
        log.info("📝 상담일지 목록 조회 - 상담사 ID: {}, 내담자 ID: {}", consultantId, clientId);

        String tenantId = TenantContextHolder.getRequiredTenantId();

        if (consultantId != null && clientId != null) {
            return consultationRecordRepository.findByTenantIdAndConsultantIdAndClientIdAndIsDeletedFalseOrderBySessionDateDesc(
                tenantId, consultantId, clientId, pageable);
        } else if (consultantId != null) {
            return consultationRecordRepository.findByTenantIdAndConsultantIdAndIsDeletedFalseOrderBySessionDateDesc(
                tenantId, consultantId, pageable);
        } else if (clientId != null) {
            return consultationRecordRepository.findByTenantIdAndClientIdAndIsDeletedFalseOrderBySessionDateDesc(
                tenantId, clientId, pageable);
        } else {
            return consultationRecordRepository.findByTenantIdAndIsDeletedFalseOrderBySessionDateDesc(tenantId, pageable);
        }
    }

    @Override
    public ConsultationRecord getConsultationRecordById(Long recordId) {
        log.info("📝 상담일지 상세 조회 - 기록 ID: {}", recordId);
        String tenantId = TenantContextHolder.getRequiredTenantId();
        Optional<ConsultationRecord> record = consultationRecordRepository.findByTenantIdAndId(tenantId, recordId);
        if (record.isPresent() && !record.get().getIsDeleted()) {
            return record.get();
        }
        return null;
    }

    private void validateUserAccess(Long targetConsultantId) {
        com.coresolution.consultation.entity.User currentUser = com.coresolution.consultation.utils.SessionUtils.getCurrentUser(null);
        if (currentUser == null) {
            throw new org.springframework.security.access.AccessDeniedException("로그인이 필요합니다.");
        }
        
        boolean isAdmin = currentUser.getRole() != null && currentUser.getRole().isAdmin();
        
        if (!isAdmin && !currentUser.getId().equals(targetConsultantId)) {
            log.warn("❌ 타인 기록 접근 시도 차단: currentUser={}, targetConsultantId={}", currentUser.getId(), targetConsultantId);
            throw new org.springframework.security.access.AccessDeniedException("본인의 상담일지만 접근/수정할 수 있습니다.");
        }
    }

    @Override
    public ConsultationRecord createConsultationRecord(Map<String, Object> recordData) {
        log.info("📝 상담일지 작성 - 데이터: {}", recordData);
        String tenantId = TenantContextHolder.getRequiredTenantId();
        try {
            ConsultationRecord record = new ConsultationRecord();
            record.setTenantId(tenantId);
            
            // 필수 정보 설정 (null 체크 강화)
            Long consultationId = recordData.get("consultationId") != null ? 
                Long.valueOf(recordData.get("consultationId").toString()) : null;
            Long clientId = recordData.get("clientId") != null ? 
                Long.valueOf(recordData.get("clientId").toString()) : null;
            Long consultantId = recordData.get("consultantId") != null ? 
                Long.valueOf(recordData.get("consultantId").toString()) : null;
            
            if (consultationId == null || clientId == null || consultantId == null) {
                throw new RuntimeException("필수 필드가 누락되었습니다: consultationId, clientId, consultantId");
            }
            
            // 권한 검증: 본인 기록만 생성 가능
            validateUserAccess(consultantId);
            
            // 스케줄 검증: 상담 예약이 실제로 존재하는지 확인
            validateConsultationExists(consultationId, clientId, consultantId);
            
            record.setConsultationId(consultationId);
            record.setClientId(clientId);
            record.setConsultantId(consultantId);
            
            // 세션 일자 설정 (필수)
            if (recordData.get("sessionDate") != null) {
                String sessionDateStr = recordData.get("sessionDate").toString();
                record.setSessionDate(LocalDate.parse(sessionDateStr));
            } else {
                record.setSessionDate(LocalDate.now()); // 기본값으로 오늘 날짜 설정
            }
            
            // 세션 번호 설정
            if (recordData.get("sessionNumber") != null) {
                record.setSessionNumber(Integer.valueOf(recordData.get("sessionNumber").toString()));
            }
            
            // 상담 내용 설정
            record.setClientCondition((String) recordData.get("clientCondition"));
            record.setMainIssues((String) recordData.get("mainIssues"));
            record.setInterventionMethods((String) recordData.get("interventionMethods"));
            record.setClientResponse((String) recordData.get("clientResponse"));
            record.setNextSessionPlan((String) recordData.get("nextSessionPlan"));
            
            // 과제 관련 설정
            record.setHomeworkAssigned((String) recordData.get("homeworkAssigned"));
            if (recordData.get("homeworkDueDate") != null) {
                String homeworkDueDateStr = recordData.get("homeworkDueDate").toString();
                if (!homeworkDueDateStr.isEmpty()) {
                    record.setHomeworkDueDate(LocalDate.parse(homeworkDueDateStr));
                }
            }
            
            // 위험도 평가 설정
            record.setRiskAssessment((String) recordData.get("riskAssessment"));
            record.setRiskFactors((String) recordData.get("riskFactors"));
            record.setEmergencyResponsePlan((String) recordData.get("emergencyResponsePlan"));
            
            // 진행도 평가 설정
            record.setProgressEvaluation((String) recordData.get("progressEvaluation"));
            if (recordData.get("progressScore") != null) {
                record.setProgressScore(Integer.valueOf(recordData.get("progressScore").toString()));
            }
            record.setGoalAchievement((String) recordData.get("goalAchievement"));
            record.setGoalAchievementDetails((String) recordData.get("goalAchievementDetails"));
            
            // 상담사 관찰사항 설정
            record.setConsultantObservations((String) recordData.get("consultantObservations"));
            record.setConsultantAssessment((String) recordData.get("consultantAssessment"));
            
            // 특별 고려사항 설정
            record.setSpecialConsiderations((String) recordData.get("specialConsiderations"));
            record.setMedicalInformation((String) recordData.get("medicalInformation"));
            record.setMedicationInfo((String) recordData.get("medicationInfo"));
            record.setFamilyRelationships((String) recordData.get("familyRelationships"));
            record.setSocialSupport((String) recordData.get("socialSupport"));
            record.setEnvironmentalFactors((String) recordData.get("environmentalFactors"));
            
            // 세션 정보 설정
            if (recordData.get("sessionDurationMinutes") != null) {
                record.setSessionDurationMinutes(Integer.valueOf(recordData.get("sessionDurationMinutes").toString()));
            }
            
            // 세션 완료 여부 설정
            if (recordData.get("isSessionCompleted") != null) {
                record.setIsSessionCompleted(Boolean.valueOf(recordData.get("isSessionCompleted").toString()));
                if (record.getIsSessionCompleted()) {
                    record.completeSession();
                }
            }
            
            // 미완료 사유 설정
            record.setIncompletionReason((String) recordData.get("incompletionReason"));
            
            // 다음 세션 일정 설정 (관리자가 설정하므로 여기서는 설정하지 않음)
            // record.setNextSessionDate(...);
            
            // 후속 조치사항 설정
            record.setFollowUpActions((String) recordData.get("followUpActions"));
            if (recordData.get("followUpDueDate") != null) {
                String followUpDueDateStr = recordData.get("followUpDueDate").toString();
                if (!followUpDueDateStr.isEmpty()) {
                    record.setFollowUpDueDate(LocalDate.parse(followUpDueDateStr));
                }
            }
            
            ConsultationRecord savedRecord = consultationRecordRepository.save(record);
            
            // 상담일지 작성 완료시 미작성 알림 자동 해제
            try {
                String resolvedBy = recordData.get("resolvedBy") != null ? 
                    recordData.get("resolvedBy").toString() : "SYSTEM";
                
                Map<String, Object> alertResult = consultationRecordAlertService.resolveConsultationRecordAlert(
                    consultationId, resolvedBy);
                
                Boolean alertSuccess = (Boolean) alertResult.get("success");
                if (alertSuccess) {
                    log.info("✅ 상담일지 작성 완료로 인한 알림 해제 성공: 상담ID={}", consultationId);
                } else {
                    log.warn("⚠️ 상담일지 작성 완료로 인한 알림 해제 실패: 상담ID={}, 메시지={}", 
                            consultationId, alertResult.get("message"));
                }
                
            } catch (Exception alertException) {
                log.error("❌ 상담일지 작성 완료로 인한 알림 해제 중 오류: {}", alertException.getMessage(), alertException);
                // 알림 해제 실패해도 상담일지 작성은 성공으로 처리
            }
            
            return savedRecord;
            
        } catch (Exception e) {
            log.error("상담일지 작성 오류:", e);
            throw new RuntimeException("상담일지 작성 중 오류가 발생했습니다: " + e.getMessage());
        }
    }

    @Override
    public ConsultationRecord updateConsultationRecord(Long recordId, Map<String, Object> recordData) {
        log.info("📝 상담일지 수정 - 기록 ID: {}, 데이터: {}", recordId, recordData);
        String tenantId = TenantContextHolder.getRequiredTenantId();
        Optional<ConsultationRecord> recordOpt = consultationRecordRepository.findByTenantIdAndId(tenantId, recordId);
        if (recordOpt.isEmpty() || recordOpt.get().getIsDeleted()) {
            throw new RuntimeException("상담일지를 찾을 수 없습니다: " + recordId);
        }
        ConsultationRecord record = recordOpt.get();
        
        // 권한 검증: 본인 기록만 수정 가능
        validateUserAccess(record.getConsultantId());
        
        try {
            // 수정 가능한 필드들만 업데이트
            if (recordData.get("sessionNumber") != null) {
                record.setSessionNumber(Integer.valueOf(recordData.get("sessionNumber").toString()));
            }
            
            record.setClientCondition((String) recordData.get("clientCondition"));
            record.setMainIssues((String) recordData.get("mainIssues"));
            record.setInterventionMethods((String) recordData.get("interventionMethods"));
            record.setClientResponse((String) recordData.get("clientResponse"));
            record.setNextSessionPlan((String) recordData.get("nextSessionPlan"));
            
            record.setHomeworkAssigned((String) recordData.get("homeworkAssigned"));
            if (recordData.get("homeworkDueDate") != null) {
                String homeworkDueDateStr = recordData.get("homeworkDueDate").toString();
                if (!homeworkDueDateStr.isEmpty()) {
                    record.setHomeworkDueDate(LocalDate.parse(homeworkDueDateStr));
                }
            }
            
            record.setRiskAssessment((String) recordData.get("riskAssessment"));
            record.setRiskFactors((String) recordData.get("riskFactors"));
            record.setEmergencyResponsePlan((String) recordData.get("emergencyResponsePlan"));
            
            record.setProgressEvaluation((String) recordData.get("progressEvaluation"));
            if (recordData.get("progressScore") != null) {
                record.setProgressScore(Integer.valueOf(recordData.get("progressScore").toString()));
            }
            record.setGoalAchievement((String) recordData.get("goalAchievement"));
            record.setGoalAchievementDetails((String) recordData.get("goalAchievementDetails"));
            
            record.setConsultantObservations((String) recordData.get("consultantObservations"));
            record.setConsultantAssessment((String) recordData.get("consultantAssessment"));
            
            record.setSpecialConsiderations((String) recordData.get("specialConsiderations"));
            record.setMedicalInformation((String) recordData.get("medicalInformation"));
            record.setMedicationInfo((String) recordData.get("medicationInfo"));
            record.setFamilyRelationships((String) recordData.get("familyRelationships"));
            record.setSocialSupport((String) recordData.get("socialSupport"));
            record.setEnvironmentalFactors((String) recordData.get("environmentalFactors"));
            
            if (recordData.get("sessionDurationMinutes") != null) {
                record.setSessionDurationMinutes(Integer.valueOf(recordData.get("sessionDurationMinutes").toString()));
            }
            
            if (recordData.get("isSessionCompleted") != null) {
                Boolean isCompleted = Boolean.valueOf(recordData.get("isSessionCompleted").toString());
                record.setIsSessionCompleted(isCompleted);
                if (isCompleted && record.getCompletionTime() == null) {
                    record.completeSession();
                }
            }
            
            record.setIncompletionReason((String) recordData.get("incompletionReason"));
            record.setFollowUpActions((String) recordData.get("followUpActions"));
            
            if (recordData.get("followUpDueDate") != null) {
                String followUpDueDateStr = recordData.get("followUpDueDate").toString();
                if (!followUpDueDateStr.isEmpty()) {
                    record.setFollowUpDueDate(LocalDate.parse(followUpDueDateStr));
                }
            }
            
            return consultationRecordRepository.save(record);
            
        } catch (Exception e) {
            log.error("상담일지 수정 오류:", e);
            throw new RuntimeException("상담일지 수정 중 오류가 발생했습니다: " + e.getMessage());
        }
    }

    @Override
    public void deleteConsultationRecord(Long recordId) {
        log.info("📝 상담일지 삭제 - 기록 ID: {}", recordId);
        String tenantId = TenantContextHolder.getRequiredTenantId();
        Optional<ConsultationRecord> record = consultationRecordRepository.findByTenantIdAndId(tenantId, recordId);
        if (record.isPresent() && !record.get().getIsDeleted()) {
            // 권한 검증: 본인 기록만 삭제 가능
            validateUserAccess(record.get().getConsultantId());
            
            record.get().setIsDeleted(true);
            consultationRecordRepository.save(record.get());
        } else {
            throw new RuntimeException("상담일지를 찾을 수 없습니다: " + recordId);
        }
    }

    @Override
    public List<ConsultationRecord> getConsultationRecordsByConsultationId(Long consultationId) {
        log.info("📝 상담 ID로 상담일지 조회 - 상담 ID: {}", consultationId);
        String tenantId = TenantContextHolder.getRequiredTenantId();
        return consultationRecordRepository.findByTenantIdAndConsultationIdAndIsDeletedFalse(tenantId, consultationId);
    }

    @Override
    public Page<ConsultationRecord> getConsultationRecordsByConsultantId(Long consultantId, Pageable pageable) {
        log.info("📝 상담사별 상담일지 목록 조회 - 상담사 ID: {}", consultantId);
        String tenantId = TenantContextHolder.getRequiredTenantId();
        return consultationRecordRepository.findByTenantIdAndConsultantIdAndIsDeletedFalseOrderBySessionDateDesc(tenantId, consultantId, pageable);
    }

    @Override
    public Page<ConsultationRecord> getConsultationRecordsByClientId(Long clientId, Pageable pageable) {
        log.info("📝 내담자별 상담일지 목록 조회 - 내담자 ID: {}", clientId);
        String tenantId = TenantContextHolder.getRequiredTenantId();
        return consultationRecordRepository.findByTenantIdAndClientIdAndIsDeletedFalseOrderBySessionDateDesc(tenantId, clientId, pageable);
    }

    @Override
    public ConsultationRecord completeSession(Long recordId) {
        log.info("📝 세션 완료 처리 - 기록 ID: {}", recordId);
        String tenantId = TenantContextHolder.getRequiredTenantId();
        Optional<ConsultationRecord> record = consultationRecordRepository.findByTenantIdAndId(tenantId, recordId);
        if (record.isPresent() && !record.get().getIsDeleted()) {
            validateUserAccess(record.get().getConsultantId());
            record.get().completeSession();
            return consultationRecordRepository.save(record.get());
        } else {
            throw new RuntimeException("상담일지를 찾을 수 없습니다: " + recordId);
        }
    }

    @Override
    public ConsultationRecord incompleteSession(Long recordId, String reason) {
        log.info("📝 세션 미완료 처리 - 기록 ID: {}, 사유: {}", recordId, reason);
        String tenantId = TenantContextHolder.getRequiredTenantId();
        Optional<ConsultationRecord> record = consultationRecordRepository.findByTenantIdAndId(tenantId, recordId);
        if (record.isPresent() && !record.get().getIsDeleted()) {
            validateUserAccess(record.get().getConsultantId());
            record.get().setIsSessionCompleted(false);
            record.get().setIncompletionReason(reason);
            return consultationRecordRepository.save(record.get());
        } else {
            throw new RuntimeException("상담일지를 찾을 수 없습니다: " + recordId);
        }
    }

    @Override
    public Page<ConsultationRecord> searchConsultationRecords(Long userId, String userType, String keyword, Pageable pageable) {
        log.info("📝 상담일지 검색 - 사용자 ID: {}, 유형: {}, 키워드: {}", userId, userType, keyword);
        String tenantId = TenantContextHolder.getRequiredTenantId();
        // 표준화 2025-12-05: enum 활용
        if (UserRole.CONSULTANT.name().equals(userType)) {
            return consultationRecordRepository.searchByKeywordAndConsultantId(tenantId, keyword, userId, pageable);
        } else {
            return consultationRecordRepository.searchByKeywordAndClientId(tenantId, keyword, userId, pageable);
        }
    }

    @Override
    public List<ConsultationRecord> getConsultationRecordsByRiskAssessment(String riskAssessment) {
        log.info("📝 위험도별 상담일지 조회 - 위험도: {}", riskAssessment);
        String tenantId = TenantContextHolder.getRequiredTenantId();
        return consultationRecordRepository.findByTenantIdAndRiskAssessmentAndIsDeletedFalseOrderBySessionDateDesc(tenantId, riskAssessment);
    }

    @Override
    public List<ConsultationRecord> getConsultationRecordsByProgressScoreRange(Integer minScore, Integer maxScore) {
        log.info("📝 진행도 점수 범위별 상담일지 조회 - 최소: {}, 최대: {}", minScore, maxScore);
        String tenantId = TenantContextHolder.getRequiredTenantId();
        return consultationRecordRepository.findByTenantIdAndProgressScoreBetweenAndIsDeletedFalseOrderBySessionDateDesc(tenantId, minScore, maxScore);
    }

    @Override
    public Map<String, Object> getConsultationStatistics(Long consultantId) {
        log.info("📝 상담사별 통계 조회 - 상담사 ID: {}", consultantId);
        String tenantId = TenantContextHolder.getRequiredTenantId();
        Map<String, Object> stats = new HashMap<>();
        stats.put("totalRecords", consultationRecordRepository.countByTenantIdAndConsultantIdAndIsDeletedFalse(tenantId, consultantId));
        stats.put("completedSessions", consultationRecordRepository.countByTenantIdAndConsultantIdAndIsSessionCompletedTrueAndIsDeletedFalse(tenantId, consultantId));
        stats.put("incompleteSessions", consultationRecordRepository.countByTenantIdAndConsultantIdAndIsSessionCompletedFalseAndIsDeletedFalse(tenantId, consultantId));
        return stats;
    }

    @Override
    public Map<String, Object> getClientStatistics(Long clientId) {
        log.info("📝 내담자별 통계 조회 - 내담자 ID: {}", clientId);
        String tenantId = TenantContextHolder.getRequiredTenantId();
        Map<String, Object> stats = new HashMap<>();
        stats.put("totalRecords", consultationRecordRepository.countByTenantIdAndClientIdAndIsDeletedFalse(tenantId, clientId));
        return stats;
    }

    @Override
    public List<ConsultationRecord> getRecentConsultationRecords(Long userId, String userType, int limit) {
        log.info("📝 최근 상담일지 조회 - 사용자 ID: {}, 유형: {}, 제한: {}", userId, userType, limit);
        String tenantId = TenantContextHolder.getRequiredTenantId();
        Pageable pageable = Pageable.ofSize(limit);
        // 표준화 2025-12-05: enum 활용
        if (UserRole.CONSULTANT.name().equals(userType)) {
            return consultationRecordRepository.findRecentByConsultantId(tenantId, userId, pageable);
        } else {
            return consultationRecordRepository.findRecentByClientId(tenantId, userId, pageable);
        }
    }

    @Override
    public boolean existsByConsultationId(Long consultationId) {
        log.info("📝 상담일지 존재 여부 확인 - 상담 ID: {}", consultationId);
        String tenantId = TenantContextHolder.getRequiredTenantId();
        return consultationRecordRepository.existsByTenantIdAndConsultationIdAndIsDeletedFalse(tenantId, consultationId);
    }

    @Override
    public List<ConsultationRecord> getConsultationRecordsByDate(Long userId, String userType, LocalDate sessionDate) {
        log.info("📝 특정 날짜의 상담일지 조회 - 사용자 ID: {}, 유형: {}, 날짜: {}", userId, userType, sessionDate);
        String tenantId = TenantContextHolder.getRequiredTenantId();
        if (UserRole.CONSULTANT.name().equals(userType)) {
            return consultationRecordRepository.findByTenantIdAndConsultantIdAndSessionDateAndIsDeletedFalse(tenantId, userId, sessionDate);
        } else {
            return consultationRecordRepository.findByTenantIdAndClientIdAndSessionDateAndIsDeletedFalse(tenantId, userId, sessionDate);
        }
    }

    @Override
    public Page<ConsultationRecord> getConsultationRecordsByClientAndSession(Long clientId, Integer sessionNumber, Pageable pageable) {
        log.info("👤 내담자별 특정 회기 상담일지 조회 - 내담자ID: {}, 회기: {}", clientId, sessionNumber);
        String tenantId = TenantContextHolder.getRequiredTenantId();
        try {
            return consultationRecordRepository.findByTenantIdAndClientIdAndSessionNumberAndIsDeletedFalseOrderBySessionDateDesc(tenantId, clientId, sessionNumber, pageable);
        } catch (Exception e) {
            log.error("❌ 내담자별 특정 회기 상담일지 조회 실패", e);
            throw new RuntimeException("내담자별 특정 회기 상담일지 조회 중 오류가 발생했습니다: " + e.getMessage());
        }
    }

    @Override
    public List<ConsultationRecord> getConsultationRecordsByClientOrderBySession(Long clientId) {
        log.info("👤 내담자별 전체 상담일지 조회 (회기순) - 내담자ID: {}", clientId);
        String tenantId = TenantContextHolder.getRequiredTenantId();
        try {
            return consultationRecordRepository.findByClientIdOrderBySession(tenantId, clientId);
        } catch (Exception e) {
            log.error("❌ 내담자별 전체 상담일지 조회 실패", e);
            throw new RuntimeException("내담자별 전체 상담일지 조회 중 오류가 발생했습니다: " + e.getMessage());
        }
    }

    @Override
    public Map<Integer, List<ConsultationRecord>> getConsultationRecordsGroupedBySession(Long clientId) {
        log.info("👤 내담자별 상담일지 회기별 그룹화 조회 - 내담자ID: {}", clientId);
        String tenantId = TenantContextHolder.getRequiredTenantId();
        try {
            List<ConsultationRecord> records = consultationRecordRepository.findByClientIdOrderBySession(tenantId, clientId);
            return records.stream()
                    .collect(Collectors.groupingBy(ConsultationRecord::getSessionNumber));
        } catch (Exception e) {
            log.error("❌ 내담자별 상담일지 회기별 그룹화 조회 실패", e);
            throw new RuntimeException("내담자별 상담일지 회기별 그룹화 조회 중 오류가 발생했습니다: " + e.getMessage());
        }
    }
    
    /**
     * 상담 예약 존재 여부 검증
     * - consultations 테이블에 있으면 Consultation 기준 검증
     * - 없으면 schedules 테이블(Schedule) 기준 검증 (통합 스케줄에서 schedule id로 저장하는 경우)
     */
    private void validateConsultationExists(Long consultationId, Long clientId, Long consultantId) {
        log.info("🔍 상담 예약 검증: consultationId={}, clientId={}, consultantId={}",
                consultationId, clientId, consultantId);

        String tenantId = TenantContextHolder.getRequiredTenantId();
        Optional<com.coresolution.consultation.entity.Consultation> consultationOpt =
                consultationRepository.findByTenantIdAndId(tenantId, consultationId);

        if (consultationOpt.isPresent()) {
            com.coresolution.consultation.entity.Consultation consult = consultationOpt.get();
            if (!consult.getConsultantId().equals(consultantId)) {
                throw new RuntimeException("상담사 ID가 일치하지 않습니다. 예상: " + consultantId +
                        ", 실제: " + consult.getConsultantId());
            }
            if (!consult.getClientId().equals(clientId)) {
                throw new RuntimeException("내담자 ID가 일치하지 않습니다. 예상: " + clientId +
                        ", 실제: " + consult.getClientId());
            }
            if ("CANCELLED".equals(consult.getStatus())) {
                throw new RuntimeException("취소된 상담은 상담일지를 작성할 수 없습니다.");
            }
            log.info("✅ 상담 예약 검증 완료(Consultation): {}", consultationId);
            return;
        }

        Optional<Schedule> scheduleOpt = scheduleRepository.findByTenantIdAndId(tenantId, consultationId);
        if (scheduleOpt.isEmpty()) {
            throw new RuntimeException("상담 예약을 찾을 수 없습니다: " + consultationId);
        }
        Schedule schedule = scheduleOpt.get();
        if (!schedule.getConsultantId().equals(consultantId)) {
            throw new RuntimeException("상담사 ID가 일치하지 않습니다. 예상: " + consultantId +
                    ", 실제: " + schedule.getConsultantId());
        }
        if (clientId != null && schedule.getClientId() != null && !schedule.getClientId().equals(clientId)) {
            throw new RuntimeException("내담자 ID가 일치하지 않습니다. 예상: " + clientId +
                    ", 실제: " + schedule.getClientId());
        }
        if (schedule.getStatus() == ScheduleStatus.CANCELLED) {
            throw new RuntimeException("취소된 일정은 상담일지를 작성할 수 없습니다.");
        }
        log.info("✅ 상담 예약 검증 완료(Schedule): {}", consultationId);
    }
    
    @Override
    public boolean hasConsultationRecordForSchedule(Long scheduleId, Long consultantId, LocalDate sessionDate) {
        try {
            log.info("🔍 상담일지 작성 여부 확인: 스케줄 ID={}, 상담사 ID={}, 날짜={}", 
                    scheduleId, consultantId, sessionDate);
            String tenantId = TenantContextHolder.getRequiredTenantId();
            long count = consultationRecordRepository.countByTenantIdAndConsultantIdAndSessionDateAndIsDeletedFalse(
                tenantId, consultantId, sessionDate);
            boolean hasRecord = count > 0;
            log.info("📝 상담일지 작성 여부: {}", hasRecord ? "작성됨" : "미작성");
            
            return hasRecord;
            
        } catch (Exception e) {
            log.error("❌ 상담일지 작성 여부 확인 실패: {}", e.getMessage(), e);
            return false; // 오류 시 안전하게 미작성으로 간주
        }
    }
}
