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
     * 상담사-내담자 매핑 생성
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
     * 모든 내담자 조회
     */
    List<Client> getAllClients();

    /**
     * 모든 매핑 조회
     */
    List<ConsultantClientMapping> getAllMappings();

    /**
     * 상담사 정보 수정
     */
    User updateConsultant(Long id, ConsultantRegistrationDto request);

    /**
     * 내담자 정보 수정
     */
    Client updateClient(Long id, ClientRegistrationDto request);

    /**
     * 매핑 정보 수정
     */
    ConsultantClientMapping updateMapping(Long id, ConsultantClientMappingDto request);

    /**
     * 상담사 삭제
     */
    void deleteConsultant(Long id);

    /**
     * 내담자 삭제
     */
    void deleteClient(Long id);

    /**
     * 매핑 삭제
     */
    void deleteMapping(Long id);

    // ==================== 입금 승인 시스템 ====================

    /**
     * 입금 확인 처리
     */
    ConsultantClientMapping confirmPayment(Long mappingId, String paymentMethod, String paymentReference, Long paymentAmount);

    /**
     * 입금 확인 처리 (간단 버전)
     */
    ConsultantClientMapping confirmPayment(Long mappingId, String paymentMethod, String paymentReference);

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

    // ==================== 매핑 상태별 조회 ====================

    /**
     * 입금 대기 중인 매핑 목록 조회
     */
    List<ConsultantClientMapping> getPendingPaymentMappings();

    /**
     * 입금 확인된 매핑 목록 조회
     */
    List<ConsultantClientMapping> getPaymentConfirmedMappings();

    /**
     * 활성 매핑 목록 조회 (승인 완료)
     */
    List<ConsultantClientMapping> getActiveMappings();

    /**
     * 회기 소진된 매핑 목록 조회
     */
    List<ConsultantClientMapping> getSessionsExhaustedMappings();

    /**
     * 상담사별 매핑 목록 조회
     */
    List<ConsultantClientMapping> getMappingsByConsultantId(Long consultantId);

    /**
     * 내담자별 매핑 목록 조회
     */
    List<ConsultantClientMapping> getMappingsByClient(Long clientId);

    /**
     * 개별 매핑 조회
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
}
