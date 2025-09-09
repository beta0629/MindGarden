package com.mindgarden.consultation.service.impl;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;
import com.mindgarden.consultation.entity.ConsultationRecord;
import com.mindgarden.consultation.repository.ConsultationRecordRepository;
import com.mindgarden.consultation.service.ConsultationRecordService;
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

    @Override
    public Page<ConsultationRecord> getConsultationRecords(Long consultantId, Long clientId, Pageable pageable) {
        log.info("📝 상담일지 목록 조회 - 상담사 ID: {}, 내담자 ID: {}", consultantId, clientId);
        
        if (consultantId != null && clientId != null) {
            return consultationRecordRepository.findByConsultantIdAndClientIdAndIsDeletedFalseOrderBySessionDateDesc(
                consultantId, clientId, pageable);
        } else if (consultantId != null) {
            return consultationRecordRepository.findByConsultantIdAndIsDeletedFalseOrderBySessionDateDesc(consultantId, pageable);
        } else if (clientId != null) {
            return consultationRecordRepository.findByClientIdAndIsDeletedFalseOrderBySessionDateDesc(clientId, pageable);
        } else {
            return Page.empty();
        }
    }

    @Override
    public ConsultationRecord getConsultationRecordById(Long recordId) {
        log.info("📝 상담일지 상세 조회 - 기록 ID: {}", recordId);
        
        Optional<ConsultationRecord> record = consultationRecordRepository.findById(recordId);
        if (record.isPresent() && !record.get().getIsDeleted()) {
            return record.get();
        }
        return null;
    }

    @Override
    public ConsultationRecord createConsultationRecord(Map<String, Object> recordData) {
        log.info("📝 상담일지 작성 - 데이터: {}", recordData);
        
        try {
            ConsultationRecord record = new ConsultationRecord();
            
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
            
            return consultationRecordRepository.save(record);
            
        } catch (Exception e) {
            log.error("상담일지 작성 오류:", e);
            throw new RuntimeException("상담일지 작성 중 오류가 발생했습니다: " + e.getMessage());
        }
    }

    @Override
    public ConsultationRecord updateConsultationRecord(Long recordId, Map<String, Object> recordData) {
        log.info("📝 상담일지 수정 - 기록 ID: {}, 데이터: {}", recordId, recordData);
        
        Optional<ConsultationRecord> recordOpt = consultationRecordRepository.findById(recordId);
        if (recordOpt.isEmpty() || recordOpt.get().getIsDeleted()) {
            throw new RuntimeException("상담일지를 찾을 수 없습니다: " + recordId);
        }
        
        ConsultationRecord record = recordOpt.get();
        
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
        
        Optional<ConsultationRecord> record = consultationRecordRepository.findById(recordId);
        if (record.isPresent() && !record.get().getIsDeleted()) {
            record.get().setIsDeleted(true);
            consultationRecordRepository.save(record.get());
        } else {
            throw new RuntimeException("상담일지를 찾을 수 없습니다: " + recordId);
        }
    }

    @Override
    public List<ConsultationRecord> getConsultationRecordsByConsultationId(Long consultationId) {
        log.info("📝 상담 ID로 상담일지 조회 - 상담 ID: {}", consultationId);
        return consultationRecordRepository.findByConsultationIdAndIsDeletedFalse(consultationId);
    }

    @Override
    public Page<ConsultationRecord> getConsultationRecordsByConsultantId(Long consultantId, Pageable pageable) {
        log.info("📝 상담사별 상담일지 목록 조회 - 상담사 ID: {}", consultantId);
        return consultationRecordRepository.findByConsultantIdAndIsDeletedFalseOrderBySessionDateDesc(consultantId, pageable);
    }

    @Override
    public Page<ConsultationRecord> getConsultationRecordsByClientId(Long clientId, Pageable pageable) {
        log.info("📝 내담자별 상담일지 목록 조회 - 내담자 ID: {}", clientId);
        return consultationRecordRepository.findByClientIdAndIsDeletedFalseOrderBySessionDateDesc(clientId, pageable);
    }

    @Override
    public ConsultationRecord completeSession(Long recordId) {
        log.info("📝 세션 완료 처리 - 기록 ID: {}", recordId);
        
        Optional<ConsultationRecord> record = consultationRecordRepository.findById(recordId);
        if (record.isPresent() && !record.get().getIsDeleted()) {
            record.get().completeSession();
            return consultationRecordRepository.save(record.get());
        } else {
            throw new RuntimeException("상담일지를 찾을 수 없습니다: " + recordId);
        }
    }

    @Override
    public ConsultationRecord incompleteSession(Long recordId, String reason) {
        log.info("📝 세션 미완료 처리 - 기록 ID: {}, 사유: {}", recordId, reason);
        
        Optional<ConsultationRecord> record = consultationRecordRepository.findById(recordId);
        if (record.isPresent() && !record.get().getIsDeleted()) {
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
        
        if ("CONSULTANT".equals(userType)) {
            return consultationRecordRepository.searchByKeywordAndConsultantId(keyword, userId, pageable);
        } else {
            return consultationRecordRepository.searchByKeywordAndClientId(keyword, userId, pageable);
        }
    }

    @Override
    public List<ConsultationRecord> getConsultationRecordsByRiskAssessment(String riskAssessment) {
        log.info("📝 위험도별 상담일지 조회 - 위험도: {}", riskAssessment);
        return consultationRecordRepository.findByRiskAssessmentAndIsDeletedFalseOrderBySessionDateDesc(riskAssessment);
    }

    @Override
    public List<ConsultationRecord> getConsultationRecordsByProgressScoreRange(Integer minScore, Integer maxScore) {
        log.info("📝 진행도 점수 범위별 상담일지 조회 - 최소: {}, 최대: {}", minScore, maxScore);
        return consultationRecordRepository.findByProgressScoreBetweenAndIsDeletedFalseOrderBySessionDateDesc(minScore, maxScore);
    }

    @Override
    public Map<String, Object> getConsultationStatistics(Long consultantId) {
        log.info("📝 상담사별 통계 조회 - 상담사 ID: {}", consultantId);
        
        Map<String, Object> stats = new HashMap<>();
        stats.put("totalRecords", consultationRecordRepository.countByConsultantIdAndIsDeletedFalse(consultantId));
        stats.put("completedSessions", consultationRecordRepository.countByConsultantIdAndIsSessionCompletedTrueAndIsDeletedFalse(consultantId));
        stats.put("incompleteSessions", consultationRecordRepository.countByConsultantIdAndIsSessionCompletedFalseAndIsDeletedFalse(consultantId));
        
        return stats;
    }

    @Override
    public Map<String, Object> getClientStatistics(Long clientId) {
        log.info("📝 내담자별 통계 조회 - 내담자 ID: {}", clientId);
        
        Map<String, Object> stats = new HashMap<>();
        stats.put("totalRecords", consultationRecordRepository.countByClientIdAndIsDeletedFalse(clientId));
        
        return stats;
    }

    @Override
    public List<ConsultationRecord> getRecentConsultationRecords(Long userId, String userType, int limit) {
        log.info("📝 최근 상담일지 조회 - 사용자 ID: {}, 유형: {}, 제한: {}", userId, userType, limit);
        
        Pageable pageable = Pageable.ofSize(limit);
        if ("CONSULTANT".equals(userType)) {
            return consultationRecordRepository.findRecentByConsultantId(userId, pageable);
        } else {
            return consultationRecordRepository.findRecentByClientId(userId, pageable);
        }
    }

    @Override
    public boolean existsByConsultationId(Long consultationId) {
        log.info("📝 상담일지 존재 여부 확인 - 상담 ID: {}", consultationId);
        return consultationRecordRepository.existsByConsultationIdAndIsDeletedFalse(consultationId);
    }

    @Override
    public List<ConsultationRecord> getConsultationRecordsByDate(Long userId, String userType, LocalDate sessionDate) {
        log.info("📝 특정 날짜의 상담일지 조회 - 사용자 ID: {}, 유형: {}, 날짜: {}", userId, userType, sessionDate);
        
        if ("CONSULTANT".equals(userType)) {
            return consultationRecordRepository.findByConsultantIdAndSessionDateAndIsDeletedFalse(userId, sessionDate);
        } else {
            return consultationRecordRepository.findByClientIdAndSessionDateAndIsDeletedFalse(userId, sessionDate);
        }
    }

    @Override
    public Page<ConsultationRecord> getConsultationRecordsByClientAndSession(Long clientId, Integer sessionNumber, Pageable pageable) {
        log.info("👤 내담자별 특정 회기 상담일지 조회 - 내담자ID: {}, 회기: {}", clientId, sessionNumber);
        
        try {
            return consultationRecordRepository.findByClientIdAndSessionNumberAndIsDeletedFalseOrderBySessionDateDesc(clientId, sessionNumber, pageable);
        } catch (Exception e) {
            log.error("❌ 내담자별 특정 회기 상담일지 조회 실패", e);
            throw new RuntimeException("내담자별 특정 회기 상담일지 조회 중 오류가 발생했습니다: " + e.getMessage());
        }
    }

    @Override
    public List<ConsultationRecord> getConsultationRecordsByClientOrderBySession(Long clientId) {
        log.info("👤 내담자별 전체 상담일지 조회 (회기순) - 내담자ID: {}", clientId);
        
        try {
            return consultationRecordRepository.findByClientIdOrderBySession(clientId);
        } catch (Exception e) {
            log.error("❌ 내담자별 전체 상담일지 조회 실패", e);
            throw new RuntimeException("내담자별 전체 상담일지 조회 중 오류가 발생했습니다: " + e.getMessage());
        }
    }

    @Override
    public Map<Integer, List<ConsultationRecord>> getConsultationRecordsGroupedBySession(Long clientId) {
        log.info("👤 내담자별 상담일지 회기별 그룹화 조회 - 내담자ID: {}", clientId);
        
        try {
            List<ConsultationRecord> records = consultationRecordRepository.findByClientIdOrderBySession(clientId);
            return records.stream()
                    .collect(Collectors.groupingBy(ConsultationRecord::getSessionNumber));
        } catch (Exception e) {
            log.error("❌ 내담자별 상담일지 회기별 그룹화 조회 실패", e);
            throw new RuntimeException("내담자별 상담일지 회기별 그룹화 조회 중 오류가 발생했습니다: " + e.getMessage());
        }
    }
}
