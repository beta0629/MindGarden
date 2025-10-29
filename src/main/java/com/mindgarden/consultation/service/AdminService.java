package com.mindgarden.consultation.service;

import java.util.List;
import java.util.Map;
import com.mindgarden.consultation.dto.ClientRegistrationDto;
import com.mindgarden.consultation.dto.ConsultantClientMappingDto;
import com.mindgarden.consultation.dto.ConsultantRegistrationDto;
import com.mindgarden.consultation.dto.ConsultantTransferRequest;
import com.mindgarden.consultation.entity.Client;
import com.mindgarden.consultation.entity.ConsultantClientMapping;
import com.mindgarden.consultation.entity.User;

/**
 * 관리자 서비스 인터페이스
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2024-12-19
 */
public interface AdminService {

    /**
     * 상담사 등록
     */
    User registerConsultant(ConsultantRegistrationDto request);

    /**
     * 내담자 등록
     */
    Client registerClient(ClientRegistrationDto request);

    /**
     * 상담사-내담자 매칭 생성
     */
    ConsultantClientMapping createMapping(ConsultantClientMappingDto request);

    /**
     * 모든 상담사 조회
     */
    List<User> getAllConsultants();
    
    /**
     * 모든 상담사 조회 (전문분야 상세 정보 포함)
     */
    List<Map<String, Object>> getAllConsultantsWithSpecialty();
    
    /**
     * 휴무 정보를 포함한 상담사 목록 조회 (관리자 스케줄링용)
     */
    List<Map<String, Object>> getAllConsultantsWithVacationInfo(String date);

    /**
     * 모든 내담자 조회
     */
    List<Client> getAllClients();

    /**
     * 통합 내담자 데이터 조회 (매칭 정보, 결제 상태, 남은 세션 등 포함)
     */
    List<Map<String, Object>> getAllClientsWithMappingInfo();

    /**
     * 모든 매칭 조회
     */
    List<ConsultantClientMapping> getAllMappings();

    /**
     * 상담사 정보 수정
     */
    User updateConsultant(Long id, ConsultantRegistrationDto request);

    /**
     * 상담사 등급 업데이트
     */
    User updateConsultantGrade(Long id, String grade);

    /**
     * 내담자 정보 수정
     */
    Client updateClient(Long id, ClientRegistrationDto request);

    /**
     * 매칭 정보 수정
     */
    ConsultantClientMapping updateMapping(Long id, ConsultantClientMappingDto request, String updatedBy);

    /**
     * 상담사 삭제
     */
    void deleteConsultant(Long id);
    
    /**
     * 상담사 삭제 (다른 상담사로 이전 포함)
     */
    void deleteConsultantWithTransfer(Long consultantId, Long transferToConsultantId, String reason);
    
    /**
     * 상담사 삭제 가능 여부 확인
     */
    Map<String, Object> checkConsultantDeletionStatus(Long consultantId);

    /**
     * 내담자 삭제
     */
    void deleteClient(Long id);
    
    /**
     * 내담자 삭제 가능 여부 확인
     */
    Map<String, Object> checkClientDeletionStatus(Long clientId);

    /**
     * 매칭 삭제
     */
    void deleteMapping(Long id);
    
    /**
     * 매칭 강제 종료 (환불 처리)
     */
    void terminateMapping(Long id, String reason);
    
    /**
     * 부분 환불 처리 (지정된 회기수만 환불)
     */
    void partialRefundMapping(Long id, int refundSessions, String reason);
    
    /**
     * 환불 통계 조회
     */
    Map<String, Object> getRefundStatistics(String period);
    
    /**
     * 환불 통계 조회 (지점별 필터링)
     */
    Map<String, Object> getRefundStatistics(String period, String branchCode);
    
    /**
     * 환불 이력 조회
     */
    Map<String, Object> getRefundHistory(int page, int size, String period, String status);
    
    /**
     * 환불 이력 조회 (지점별 필터링)
     */
    Map<String, Object> getRefundHistory(int page, int size, String period, String status, String branchCode);
    
    /**
     * ERP 동기화 상태 확인
     */
    Map<String, Object> getErpSyncStatus();
    
    // ==================== 휴가 통계 ====================
    
    /**
     * 상담사별 휴가 통계 조회
     */
    Map<String, Object> getConsultantVacationStats(String period);
    
    /**
     * 지점별 상담사 휴가 통계 조회
     */
    Map<String, Object> getConsultantVacationStatsByBranch(String period, String branchCode);
    
    /**
     * 지점별 상담 완료 건수 통계 조회
     */
    List<Map<String, Object>> getConsultationCompletionStatisticsByBranch(String period, String branchCode);

    // ==================== 입금 승인 시스템 ====================

    /**
     * 입금 확인 처리
     */
    ConsultantClientMapping confirmPayment(Long mappingId, String paymentMethod, String paymentReference, Long paymentAmount);

    /**
     * 결제 확인 처리 (미수금 상태)
     */
    ConsultantClientMapping confirmPayment(Long mappingId, String paymentMethod, String paymentReference);

    /**
     * 입금 확인 처리 (현금 수입)
     */
    ConsultantClientMapping confirmDeposit(Long mappingId, String depositReference);

    /**
     * 관리자 승인
     */
    ConsultantClientMapping approveMapping(Long mappingId, String adminName);

    /**
     * 관리자 거부
     */
    ConsultantClientMapping rejectMapping(Long mappingId, String reason);

    /**
     * 회기 사용 처리
     */
    ConsultantClientMapping useSession(Long mappingId);

    /**
     * 회기 추가 (연장)
     */
    ConsultantClientMapping extendSessions(Long mappingId, Integer additionalSessions, String packageName, Long packagePrice);

    // ==================== 매칭 상태별 조회 ====================

    /**
     * 입금 대기 중인 매칭 목록 조회
     */
    List<ConsultantClientMapping> getPendingPaymentMappings();

    /**
     * 입금 확인된 매칭 목록 조회
     */
    List<ConsultantClientMapping> getPaymentConfirmedMappings();

    /**
     * 입금 확인 대기 중인 매칭 목록 조회 (결제 확인 완료, 입금 확인 대기)
     */
    List<ConsultantClientMapping> getPendingDepositMappings();

    /**
     * 활성 매칭 목록 조회 (승인 완료)
     */
    List<ConsultantClientMapping> getActiveMappings();

    /**
     * 회기 소진된 매칭 목록 조회
     */
    List<ConsultantClientMapping> getSessionsExhaustedMappings();

    /**
     * 회기관리 통계 조회
     */
    Map<String, Object> getSessionStatistics();

    /**
     * 회기관리 목록 조회
     */
    List<Map<String, Object>> getSessions();

    /**
     * 상담사별 매칭 목록 조회
     */
    List<ConsultantClientMapping> getMappingsByConsultantId(Long consultantId);
    List<ConsultantClientMapping> getMappingsByConsultantId(Long consultantId, String branchCode);
    
    /**
     * 상담사 이메일로 매칭 목록 조회
     */
    List<ConsultantClientMapping> getMappingsByConsultantEmail(String consultantEmail);

    /**
     * 내담자별 매칭 목록 조회
     */
    List<ConsultantClientMapping> getMappingsByClient(Long clientId);

    /**
     * 개별 매칭 조회
     */
    ConsultantClientMapping getMappingById(Long mappingId);

    // ==================== 상담사 변경 시스템 ====================

    /**
     * 상담사 변경 처리
     */
    ConsultantClientMapping transferConsultant(ConsultantTransferRequest request);

    /**
     * 내담자별 상담사 변경 이력 조회
     */
    List<ConsultantClientMapping> getTransferHistory(Long clientId);

    /**
     * 상담사별 스케줄 조회
     */
    List<Map<String, Object>> getSchedulesByConsultantId(Long consultantId);

    /**
     * 상담사별 상담 완료 건수 통계 조회
     */
    List<Map<String, Object>> getConsultationCompletionStatistics(String period);

    /**
     * 모든 스케줄 조회
     */
    List<Map<String, Object>> getAllSchedules();

    /**
     * 스케줄 상태별 통계 조회
     */
    Map<String, Object> getScheduleStatistics();
    
    /**
     * 스케줄 상태별 통계 조회 (지점별 필터링)
     */
    Map<String, Object> getScheduleStatisticsByBranch(String branchCode);
    
    /**
     * 스케줄 자동 완료 처리 (상담일지 미작성 시 메시지 발송 포함)
     */
    Map<String, Object> autoCompleteSchedulesWithReminder();
    
    /**
     * 사용자 목록 조회
     */
    List<User> getUsers(boolean includeInactive, String role, String branchCode);
    
    /**
     * 사용자 ID로 사용자 조회
     */
    User getUserById(Long id);
    
    /**
     * 사용자 역할 변경
     */
    User changeUserRole(Long userId, String newRole);
    
    /**
     * 중복 매칭 통합
     */
    Map<String, Object> mergeDuplicateMappings();
    
    /**
     * 중복 매칭 조회
     */
    List<Map<String, Object>> findDuplicateMappings();
}
