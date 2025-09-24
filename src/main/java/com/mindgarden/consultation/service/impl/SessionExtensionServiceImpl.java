package com.mindgarden.consultation.service.impl;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import com.mindgarden.consultation.constant.EmailConstants;
import com.mindgarden.consultation.dto.EmailResponse;
import com.mindgarden.consultation.entity.ConsultantClientMapping;
import com.mindgarden.consultation.entity.SessionExtensionRequest;
import com.mindgarden.consultation.entity.User;
import com.mindgarden.consultation.repository.ConsultantClientMappingRepository;
import com.mindgarden.consultation.repository.SessionExtensionRequestRepository;
import com.mindgarden.consultation.service.EmailService;
import com.mindgarden.consultation.service.SessionExtensionService;
import com.mindgarden.consultation.service.SessionSyncService;
import com.mindgarden.consultation.service.UserService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * 회기 추가 요청 서비스 구현체
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2024-12-19
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class SessionExtensionServiceImpl implements SessionExtensionService {
    
    private final SessionExtensionRequestRepository requestRepository;
    private final ConsultantClientMappingRepository mappingRepository;
    private final UserService userService;
    private final SessionSyncService sessionSyncService;
    private final EmailService emailService;
    
    @Override
    public SessionExtensionRequest createRequest(Long mappingId, Long requesterId, 
                                               Integer additionalSessions, String packageName, 
                                               BigDecimal packagePrice, String reason) {
        log.info("회기 추가 요청 생성: mappingId={}, requesterId={}, sessions={}", 
                mappingId, requesterId, additionalSessions);
        
        // 매핑 정보 조회
        ConsultantClientMapping mapping = mappingRepository.findById(mappingId)
                .orElseThrow(() -> new RuntimeException("매핑을 찾을 수 없습니다: " + mappingId));
        
        // 요청자 정보 조회
        User requester = userService.findActiveById(requesterId)
                .orElseThrow(() -> new RuntimeException("요청자를 찾을 수 없습니다: " + requesterId));
        
        // 회기 추가 요청 생성
        SessionExtensionRequest request = SessionExtensionRequest.builder()
                .mapping(mapping)
                .requester(requester)
                .additionalSessions(additionalSessions)
                .packageName(packageName)
                .packagePrice(packagePrice)
                .status(SessionExtensionRequest.ExtensionStatus.PENDING)
                .reason(reason)
                .build();
        
        SessionExtensionRequest savedRequest = requestRepository.save(request);
        
        log.info("✅ 회기 추가 요청 생성 완료: requestId={}", savedRequest.getId());
        return savedRequest;
    }
    
    @Override
    public SessionExtensionRequest confirmPayment(Long requestId, String paymentMethod, String paymentReference) {
        log.info("💰 입금 확인 및 자동 승인 처리: requestId={}, paymentMethod={}, paymentReference={}", 
                requestId, paymentMethod, paymentReference);
        
        SessionExtensionRequest request = requestRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("요청을 찾을 수 없습니다: " + requestId));
        
        // 현금 결제의 경우 참조번호를 null로 설정
        String finalPaymentReference = "CASH".equals(paymentMethod) ? null : paymentReference;
        
        // 1. 입금 확인 처리
        request.confirmPayment(paymentMethod, finalPaymentReference);
        
        // 2. 자동 관리자 승인 처리 (시스템 관리자로 처리)
        User systemAdmin = userService.findActiveById(1L) // 시스템 관리자 ID
                .orElseThrow(() -> new RuntimeException("시스템 관리자를 찾을 수 없습니다"));
        
        request.approveByAdmin(systemAdmin);
        request.setAdminComment("입금 확인 후 자동 승인 처리");
        
        // 3. 즉시 완료 처리 (실제 회기 추가)
        request.complete();
        
        SessionExtensionRequest savedRequest = requestRepository.save(request);
        
        // 4. 매핑에 회기 추가 및 동기화
        try {
            sessionSyncService.syncAfterSessionExtension(savedRequest);
            log.info("✅ 회기 추가 후 동기화 완료: requestId={}", savedRequest.getId());
        } catch (Exception e) {
            log.error("❌ 회기 추가 후 동기화 실패: requestId={}, error={}", 
                     savedRequest.getId(), e.getMessage(), e);
            // 동기화 실패해도 회기 추가는 완료된 상태로 유지
        }
        
        // 5. 매핑 상태도 자동으로 ACTIVE로 변경 및 결제 정보 동기화
        try {
            ConsultantClientMapping mapping = request.getMapping();
            mapping.setStatus(ConsultantClientMapping.MappingStatus.ACTIVE);
            mapping.setPaymentStatus(ConsultantClientMapping.PaymentStatus.APPROVED);
            mapping.setAdminApprovalDate(LocalDateTime.now());
            mapping.setApprovedBy("시스템 자동 승인");
            
            // 결제 정보를 매핑에도 동기화
            mapping.setPaymentMethod(paymentMethod);
            mapping.setPaymentReference(finalPaymentReference);
            mapping.setPaymentDate(LocalDateTime.now());
            
            mappingRepository.save(mapping);
            log.info("✅ 매핑 상태 자동 활성화 및 결제 정보 동기화: mappingId={}, paymentReference={}", 
                    mapping.getId(), finalPaymentReference);
        } catch (Exception e) {
            log.error("❌ 매핑 상태 활성화 실패: {}", e.getMessage(), e);
        }
        
        // 6. 이메일 알림 발송
        try {
            sendPaymentConfirmationEmail(savedRequest);
            log.info("✅ 입금 확인 이메일 발송 완료: requestId={}", savedRequest.getId());
        } catch (Exception e) {
            log.error("❌ 입금 확인 이메일 발송 실패: requestId={}, error={}", 
                     savedRequest.getId(), e.getMessage(), e);
            // 이메일 발송 실패해도 회기 추가는 완료된 상태로 유지
        }
        
        log.info("✅ 입금 확인 및 자동 승인 완료: requestId={}, status={}", 
                savedRequest.getId(), savedRequest.getStatus());
        return savedRequest;
    }
    
    @Override
    public SessionExtensionRequest approveByAdmin(Long requestId, Long adminId, String comment) {
        log.info("관리자 승인: requestId={}, adminId={}", requestId, adminId);
        
        SessionExtensionRequest request = requestRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("요청을 찾을 수 없습니다: " + requestId));
        
        User admin = userService.findActiveById(adminId)
                .orElseThrow(() -> new RuntimeException("관리자를 찾을 수 없습니다: " + adminId));
        
        request.approveByAdmin(admin);
        request.setAdminComment(comment);
        
        SessionExtensionRequest savedRequest = requestRepository.save(request);
        
        log.info("✅ 관리자 승인 완료: requestId={}", savedRequest.getId());
        return savedRequest;
    }
    
    @Override
    public SessionExtensionRequest rejectRequest(Long requestId, Long adminId, String reason) {
        log.info("요청 거부: requestId={}, adminId={}", requestId, adminId);
        
        SessionExtensionRequest request = requestRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("요청을 찾을 수 없습니다: " + requestId));
        
        request.reject(reason);
        
        SessionExtensionRequest savedRequest = requestRepository.save(request);
        
        log.info("✅ 요청 거부 완료: requestId={}", savedRequest.getId());
        return savedRequest;
    }
    
    @Override
    public SessionExtensionRequest completeRequest(Long requestId) {
        log.info("요청 완료 처리: requestId={}", requestId);
        
        SessionExtensionRequest request = requestRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("요청을 찾을 수 없습니다: " + requestId));
        
        // 회기 추가는 SessionSyncService에서 처리
        
        // 요청 완료 처리
        request.complete();
        
        SessionExtensionRequest savedRequest = requestRepository.save(request);
        
        // 🔄 회기 추가 후 전체 시스템 동기화
        try {
            sessionSyncService.syncAfterSessionExtension(savedRequest);
            log.info("✅ 회기 추가 후 동기화 완료: requestId={}", savedRequest.getId());
        } catch (Exception e) {
            log.error("❌ 회기 추가 후 동기화 실패: requestId={}, error={}", 
                     savedRequest.getId(), e.getMessage(), e);
            // 동기화 실패해도 회기 추가는 완료된 상태로 유지
        }
        
        log.info("✅ 회기 추가 완료: requestId={}, mappingId={}, sessions={}", 
                savedRequest.getId(), savedRequest.getMapping().getId(), request.getAdditionalSessions());
        return savedRequest;
    }
    
    @Override
    @Transactional(readOnly = true)
    public SessionExtensionRequest getRequestById(Long requestId) {
        log.info("요청 상세 조회: requestId={}", requestId);
        return requestRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("요청을 찾을 수 없습니다: " + requestId));
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<SessionExtensionRequest> getAllRequests() {
        log.info("전체 요청 목록 조회");
        return requestRepository.findAllByOrderByCreatedAtDesc();
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<SessionExtensionRequest> getRequestsByStatus(SessionExtensionRequest.ExtensionStatus status) {
        log.info("상태별 요청 목록 조회: status={}", status);
        return requestRepository.findByStatusOrderByCreatedAtDesc(status);
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<SessionExtensionRequest> getPendingPaymentRequests() {
        log.info("입금 확인 대기 중인 요청 목록 조회");
        return requestRepository.findPendingPaymentRequests();
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<SessionExtensionRequest> getPendingAdminApprovalRequests() {
        log.info("관리자 승인 대기 중인 요청 목록 조회");
        return requestRepository.findPendingAdminApprovalRequests();
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<SessionExtensionRequest> getRequestsByRequester(Long requesterId) {
        log.info("요청자별 요청 목록 조회: requesterId={}", requesterId);
        return requestRepository.findByRequesterIdOrderByCreatedAtDesc(requesterId);
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<SessionExtensionRequest> getRequestsByMapping(Long mappingId) {
        log.info("매핑별 요청 목록 조회: mappingId={}", mappingId);
        return requestRepository.findByMappingIdOrderByCreatedAtDesc(mappingId);
    }
    
    @Override
    @Transactional(readOnly = true)
    public Map<String, Object> getRequestStatistics() {
        log.info("요청 통계 조회");
        
        Map<String, Object> statistics = new HashMap<>();
        
        // 전체 요청 수
        long totalRequests = requestRepository.count();
        statistics.put("totalRequests", totalRequests);
        
        // 상태별 요청 수
        for (SessionExtensionRequest.ExtensionStatus status : SessionExtensionRequest.ExtensionStatus.values()) {
            long count = requestRepository.findByStatusOrderByCreatedAtDesc(status).size();
            statistics.put(status.name().toLowerCase() + "Count", count);
        }
        
        // 최근 7일간 요청 수
        LocalDateTime weekAgo = LocalDateTime.now().minusDays(7);
        List<Object[]> weekStats = requestRepository.getRequestStatsByPeriod(weekAgo, LocalDateTime.now());
        statistics.put("weekStats", weekStats);
        
        return statistics;
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<Map<String, Object>> getRequesterStatistics() {
        log.info("요청자별 통계 조회");
        
        List<Object[]> stats = requestRepository.getRequestStatsByRequester();
        
        return stats.stream().map(stat -> {
            Map<String, Object> requesterStat = new HashMap<>();
            requesterStat.put("requesterId", stat[0]);
            requesterStat.put("requesterName", stat[1]);
            requesterStat.put("requestCount", stat[2]);
            requesterStat.put("totalAmount", stat[3]);
            return requesterStat;
        }).collect(Collectors.toList());
    }
    
    @Override
    @Transactional(readOnly = true)
    public Map<String, Object> getPeriodStatistics(String startDate, String endDate) {
        log.info("기간별 통계 조회: {} ~ {}", startDate, endDate);
        
        LocalDateTime start = LocalDateTime.parse(startDate + "T00:00:00");
        LocalDateTime end = LocalDateTime.parse(endDate + "T23:59:59");
        
        List<Object[]> stats = requestRepository.getRequestStatsByPeriod(start, end);
        
        Map<String, Object> statistics = new HashMap<>();
        statistics.put("startDate", startDate);
        statistics.put("endDate", endDate);
        statistics.put("statusStats", stats);
        
        return statistics;
    }
    
    /**
     * 입금 확인 이메일 발송
     */
    private void sendPaymentConfirmationEmail(SessionExtensionRequest request) {
        try {
            log.info("📧 입금 확인 이메일 발송 시작: requestId={}", request.getId());
            
            // 요청자 정보 조회
            User requester = request.getRequester();
            if (requester == null || requester.getEmail() == null) {
                log.warn("⚠️ 이메일 발송 실패: 요청자 정보 또는 이메일이 없습니다. requestId={}", request.getId());
                return;
            }
            
            // 매핑 정보 조회
            ConsultantClientMapping mapping = request.getMapping();
            if (mapping == null) {
                log.warn("⚠️ 이메일 발송 실패: 매핑 정보가 없습니다. requestId={}", request.getId());
                return;
            }
            
            // 이메일 템플릿 변수 설정
            Map<String, Object> variables = new HashMap<>();
            variables.put("userName", requester.getName() != null ? requester.getName() : "고객님");
            variables.put("userEmail", requester.getEmail());
            variables.put("companyName", "mindgarden");
            variables.put("supportEmail", EmailConstants.SUPPORT_EMAIL);
            variables.put("currentYear", String.valueOf(java.time.Year.now().getValue()));
            variables.put("paymentAmount", String.format("%,d", request.getPackagePrice().longValue()));
            variables.put("paymentMethod", request.getPaymentMethod() != null ? request.getPaymentMethod() : "미지정");
            variables.put("additionalSessions", request.getAdditionalSessions().toString());
            variables.put("packageName", request.getPackageName());
            variables.put("totalSessions", mapping.getTotalSessions() != null ? mapping.getTotalSessions().toString() : "0");
            variables.put("remainingSessions", mapping.getRemainingSessions() != null ? mapping.getRemainingSessions().toString() : "0");
            variables.put("consultantName", mapping.getConsultant() != null && mapping.getConsultant().getName() != null ? 
                         mapping.getConsultant().getName() : "상담사");
            variables.put("clientName", mapping.getClient() != null && mapping.getClient().getName() != null ? 
                         mapping.getClient().getName() : "내담자");
            variables.put("confirmationDate", java.time.LocalDateTime.now().format(java.time.format.DateTimeFormatter.ofPattern("yyyy년 MM월 dd일 HH:mm")));
            
            // 이메일 발송
            EmailResponse response = emailService.sendTemplateEmail(
                EmailConstants.TEMPLATE_SESSION_EXTENSION_CONFIRMATION,
                requester.getEmail(),
                requester.getName(),
                variables
            );
            boolean success = response.isSuccess();
            
            if (success) {
                log.info("✅ 입금 확인 이메일 발송 성공: requestId={}, email={}", 
                        request.getId(), requester.getEmail());
            } else {
                log.warn("⚠️ 입금 확인 이메일 발송 실패: requestId={}, email={}", 
                        request.getId(), requester.getEmail());
            }
            
        } catch (Exception e) {
            log.error("❌ 입금 확인 이메일 발송 중 오류 발생: requestId={}, error={}", 
                     request.getId(), e.getMessage(), e);
            throw e;
        }
    }
}
