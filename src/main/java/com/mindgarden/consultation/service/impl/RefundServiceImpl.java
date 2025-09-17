package com.mindgarden.consultation.service.impl;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.mindgarden.consultation.entity.ConsultantClientMapping;
import com.mindgarden.consultation.entity.RefundRequest;
import com.mindgarden.consultation.entity.User;
import com.mindgarden.consultation.repository.ConsultantClientMappingRepository;
import com.mindgarden.consultation.repository.RefundRequestRepository;
import com.mindgarden.consultation.repository.UserRepository;
import com.mindgarden.consultation.service.ErpIntegrationService;
import com.mindgarden.consultation.service.RefundService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * 환불 관리 서비스 구현체
 */
@Service
@RequiredArgsConstructor
@Transactional
@Slf4j
public class RefundServiceImpl implements RefundService {

    private final RefundRequestRepository refundRequestRepository;
    private final ConsultantClientMappingRepository mappingRepository;
    private final UserRepository userRepository;
    private final ErpIntegrationService erpIntegrationService;

    @Override
    public RefundRequest createRefundRequest(Long mappingId, String refundReason, String reasonCode, 
                                           Integer refundSessions, Long requestedById) {
        log.info("🔄 환불 요청 생성 시작: MappingID={}, Sessions={}", mappingId, refundSessions);
        
        // 매핑 조회
        ConsultantClientMapping mapping = mappingRepository.findById(mappingId)
                .orElseThrow(() -> new RuntimeException("매핑을 찾을 수 없습니다."));
        
        // 요청자 조회
        User requestedBy = userRepository.findById(requestedById)
                .orElseThrow(() -> new RuntimeException("요청자를 찾을 수 없습니다."));
        
        // 환불 가능 여부 검증
        if (mapping.getStatus() != ConsultantClientMapping.MappingStatus.ACTIVE) {
            throw new RuntimeException("비활성 매핑에 대해서는 환불 요청을 할 수 없습니다.");
        }
        
        if (refundSessions > mapping.getRemainingSession()) {
            throw new RuntimeException("환불 요청 회기가 남은 회기보다 많습니다.");
        }
        
        // 환불 금액 계산 (비례 배분)
        BigDecimal refundAmount = BigDecimal.ZERO;
        if (mapping.getPackagePrice() != null && mapping.getTotalSessions() > 0) {
            BigDecimal sessionPrice = new BigDecimal(mapping.getPackagePrice())
                    .divide(new BigDecimal(mapping.getTotalSessions()), 2, BigDecimal.ROUND_HALF_UP);
            refundAmount = sessionPrice.multiply(new BigDecimal(refundSessions));
        }
        
        // 환불 요청 생성
        RefundRequest refundRequest = RefundRequest.builder()
                .mapping(mapping)
                .requestedBy(requestedBy)
                .refundReason(refundReason)
                .reasonCode(reasonCode)
                .refundSessions(refundSessions)
                .refundAmount(refundAmount)
                .status(RefundRequest.RefundStatus.REQUESTED)
                .erpStatus(RefundRequest.ErpIntegrationStatus.PENDING)
                .requestedAt(LocalDateTime.now())
                .build();
        
        RefundRequest savedRequest = refundRequestRepository.save(refundRequest);
        
        // ERP 연동 시도
        try {
            Map<String, Object> erpResult = erpIntegrationService.sendRefundRequestToErp(savedRequest);
            
            // ERP 연동 결과 업데이트
            RefundRequest.ErpIntegrationStatus erpStatus = 
                    (RefundRequest.ErpIntegrationStatus) erpResult.get("erpStatus");
            String erpReferenceNumber = (String) erpResult.get("erpReferenceNumber");
            String responseMessage = (String) erpResult.get("message");
            
            savedRequest.setErpStatus(erpStatus);
            savedRequest.setErpReferenceNumber(erpReferenceNumber);
            savedRequest.setErpResponseMessage(responseMessage);
            
            refundRequestRepository.save(savedRequest);
            
        } catch (Exception e) {
            log.error("❌ ERP 연동 실패: RefundID={}", savedRequest.getId(), e);
            savedRequest.setErpStatus(RefundRequest.ErpIntegrationStatus.FAILED);
            savedRequest.setErpResponseMessage("ERP 연동 실패: " + e.getMessage());
            refundRequestRepository.save(savedRequest);
        }
        
        log.info("✅ 환불 요청 생성 완료: ID={}, Amount={}", savedRequest.getId(), refundAmount);
        return savedRequest;
    }

    @Override
    public RefundRequest approveRefundRequest(Long refundRequestId, Long approvedById) {
        log.info("✅ 환불 요청 승인 시작: ID={}", refundRequestId);
        
        RefundRequest refundRequest = refundRequestRepository.findById(refundRequestId)
                .orElseThrow(() -> new RuntimeException("환불 요청을 찾을 수 없습니다."));
        
        User approvedBy = userRepository.findById(approvedById)
                .orElseThrow(() -> new RuntimeException("승인자를 찾을 수 없습니다."));
        
        if (refundRequest.getStatus() != RefundRequest.RefundStatus.REQUESTED) {
            throw new RuntimeException("요청 상태의 환불만 승인할 수 있습니다.");
        }
        
        // 환불 승인 처리
        refundRequest.setStatus(RefundRequest.RefundStatus.APPROVED);
        refundRequest.setApprovedAt(LocalDateTime.now());
        refundRequest.setApprovedBy(approvedBy);
        
        // 매핑 상태 업데이트 (환불 승인 시 매핑 종료)
        ConsultantClientMapping mapping = refundRequest.getMapping();
        mapping.setStatus(ConsultantClientMapping.MappingStatus.TERMINATED);
        mapping.setTerminatedAt(LocalDateTime.now());
        mapping.setRemainingSession(mapping.getRemainingSession() - refundRequest.getRefundSessions());
        
        // 환불 노트 추가
        String currentNotes = mapping.getNotes() != null ? mapping.getNotes() : "";
        String refundNote = String.format("[%s 환불 승인] %d회기 환불 - %s", 
                LocalDateTime.now().format(java.time.format.DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm")),
                refundRequest.getRefundSessions(), 
                refundRequest.getRefundReason());
        
        String updatedNotes = currentNotes.isEmpty() ? refundNote : currentNotes + "\n" + refundNote;
        mapping.setNotes(updatedNotes);
        
        mappingRepository.save(mapping);
        
        RefundRequest savedRequest = refundRequestRepository.save(refundRequest);
        
        log.info("✅ 환불 요청 승인 완료: ID={}, Sessions={}", refundRequestId, refundRequest.getRefundSessions());
        return savedRequest;
    }

    @Override
    public RefundRequest rejectRefundRequest(Long refundRequestId, String rejectionReason, Long rejectedById) {
        log.info("❌ 환불 요청 거부 시작: ID={}", refundRequestId);
        
        RefundRequest refundRequest = refundRequestRepository.findById(refundRequestId)
                .orElseThrow(() -> new RuntimeException("환불 요청을 찾을 수 없습니다."));
        
        if (refundRequest.getStatus() != RefundRequest.RefundStatus.REQUESTED) {
            throw new RuntimeException("요청 상태의 환불만 거부할 수 있습니다.");
        }
        
        refundRequest.setStatus(RefundRequest.RefundStatus.REJECTED);
        refundRequest.setRejectedAt(LocalDateTime.now());
        refundRequest.setRejectionReason(rejectionReason);
        
        RefundRequest savedRequest = refundRequestRepository.save(refundRequest);
        
        log.info("❌ 환불 요청 거부 완료: ID={}, Reason={}", refundRequestId, rejectionReason);
        return savedRequest;
    }

    @Override
    @Transactional(readOnly = true)
    public List<RefundRequest> getAllRefundRequests() {
        return refundRequestRepository.findAll();
    }

    @Override
    @Transactional(readOnly = true)
    public List<RefundRequest> getRefundRequestsByStatus(RefundRequest.RefundStatus status) {
        return refundRequestRepository.findByStatusOrderByCreatedAtDesc(status);
    }

    @Override
    @Transactional(readOnly = true)
    public List<RefundRequest> getRefundRequestsByMapping(Long mappingId) {
        return refundRequestRepository.findByMappingIdOrderByCreatedAtDesc(mappingId);
    }

    @Override
    @Transactional(readOnly = true)
    public List<RefundRequest> getRefundRequestsByClient(Long clientId) {
        return refundRequestRepository.findByClientId(clientId);
    }

    @Override
    @Transactional(readOnly = true)
    public List<RefundRequest> getRefundRequestsByConsultant(Long consultantId) {
        return refundRequestRepository.findByConsultantId(consultantId);
    }

    @Override
    @Transactional(readOnly = true)
    public RefundRequest getRefundRequestById(Long refundRequestId) {
        return refundRequestRepository.findById(refundRequestId)
                .orElseThrow(() -> new RuntimeException("환불 요청을 찾을 수 없습니다."));
    }

    @Override
    public void updateErpIntegrationStatus(Long refundRequestId, RefundRequest.ErpIntegrationStatus erpStatus, 
                                         String erpReferenceNumber, String erpResponseMessage) {
        RefundRequest refundRequest = refundRequestRepository.findById(refundRequestId)
                .orElseThrow(() -> new RuntimeException("환불 요청을 찾을 수 없습니다."));
        
        refundRequest.setErpStatus(erpStatus);
        refundRequest.setErpReferenceNumber(erpReferenceNumber);
        refundRequest.setErpResponseMessage(erpResponseMessage);
        
        refundRequestRepository.save(refundRequest);
        
        log.info("🔄 ERP 연동 상태 업데이트: RefundID={}, Status={}", refundRequestId, erpStatus);
    }

    @Override
    public RefundRequest completeRefundRequest(Long refundRequestId) {
        RefundRequest refundRequest = refundRequestRepository.findById(refundRequestId)
                .orElseThrow(() -> new RuntimeException("환불 요청을 찾을 수 없습니다."));
        
        if (refundRequest.getStatus() != RefundRequest.RefundStatus.PROCESSING) {
            throw new RuntimeException("처리중 상태의 환불만 완료할 수 있습니다.");
        }
        
        refundRequest.setStatus(RefundRequest.RefundStatus.COMPLETED);
        refundRequest.setCompletedAt(LocalDateTime.now());
        refundRequest.setErpStatus(RefundRequest.ErpIntegrationStatus.CONFIRMED);
        
        RefundRequest savedRequest = refundRequestRepository.save(refundRequest);
        
        log.info("✅ 환불 처리 완료: ID={}, Amount={}", refundRequestId, refundRequest.getRefundAmount());
        return savedRequest;
    }

    @Override
    @Transactional(readOnly = true)
    public Map<String, Object> getRefundStatisticsWithErp(String period) {
        log.info("📊 ERP 연동 환불 통계 조회: period={}", period);
        
        LocalDateTime startDate = getStartDateByPeriod(period);
        LocalDateTime endDate = LocalDateTime.now();
        
        // 기간별 환불 요청 조회
        List<RefundRequest> refundRequests = refundRequestRepository.findByRequestedAtBetween(startDate, endDate);
        
        // 기본 통계
        Map<String, Object> summary = new HashMap<>();
        summary.put("totalRequests", refundRequests.size());
        summary.put("completedRequests", refundRequests.stream()
                .mapToInt(r -> r.getStatus() == RefundRequest.RefundStatus.COMPLETED ? 1 : 0).sum());
        summary.put("totalRefundAmount", refundRequests.stream()
                .filter(r -> r.getStatus() == RefundRequest.RefundStatus.COMPLETED)
                .mapToDouble(r -> r.getRefundAmount().doubleValue()).sum());
        summary.put("totalRefundSessions", refundRequests.stream()
                .filter(r -> r.getStatus() == RefundRequest.RefundStatus.COMPLETED)
                .mapToInt(RefundRequest::getRefundSessions).sum());
        
        // 상태별 통계
        Map<String, Long> statusStats = refundRequests.stream()
                .collect(Collectors.groupingBy(
                    r -> r.getStatus().name(),
                    Collectors.counting()
                ));
        
        // ERP 연동 상태별 통계
        Map<String, Long> erpStatusStats = refundRequests.stream()
                .collect(Collectors.groupingBy(
                    r -> r.getErpStatus().name(),
                    Collectors.counting()
                ));
        
        // 사유별 통계
        Map<String, Long> reasonStats = refundRequests.stream()
                .filter(r -> r.getReasonCode() != null)
                .collect(Collectors.groupingBy(
                    RefundRequest::getReasonCode,
                    Collectors.counting()
                ));
        
        Map<String, Object> result = new HashMap<>();
        result.put("period", period);
        result.put("startDate", startDate);
        result.put("endDate", endDate);
        result.put("summary", summary);
        result.put("statusStats", statusStats);
        result.put("erpStatusStats", erpStatusStats);
        result.put("reasonStats", reasonStats);
        
        log.info("✅ ERP 연동 환불 통계 조회 완료: 총 {}건", refundRequests.size());
        return result;
    }

    @Override
    public void syncWithErp() {
        log.info("🔄 ERP 동기화 시작");
        
        try {
            // ERP 연동 실패 건 재시도
            erpIntegrationService.retryFailedErpIntegrations();
            
            // ERP 데이터 동기화
            erpIntegrationService.synchronizeErpRefundData();
            
            log.info("✅ ERP 동기화 완료");
            
        } catch (Exception e) {
            log.error("❌ ERP 동기화 실패", e);
            throw new RuntimeException("ERP 동기화에 실패했습니다: " + e.getMessage());
        }
    }

    /**
     * 기간에 따른 시작 날짜 계산
     */
    private LocalDateTime getStartDateByPeriod(String period) {
        switch (period.toLowerCase()) {
            case "today":
                return LocalDate.now().atStartOfDay();
            case "week":
                return LocalDate.now().minusDays(6).atStartOfDay();
            case "month":
                return LocalDate.now().minusMonths(1).atStartOfDay();
            case "quarter":
                return LocalDate.now().minusMonths(3).atStartOfDay();
            case "year":
                return LocalDate.now().minusYears(1).atStartOfDay();
            default:
                return LocalDate.now().minusMonths(1).atStartOfDay();
        }
    }
}
