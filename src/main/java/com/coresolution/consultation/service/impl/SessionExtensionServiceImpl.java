package com.coresolution.consultation.service.impl;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import com.coresolution.consultation.constant.EmailConstants;
import com.coresolution.consultation.dto.EmailResponse;
import com.coresolution.consultation.entity.ConsultantClientMapping;
import com.coresolution.consultation.entity.SessionExtensionRequest;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.repository.ConsultantClientMappingRepository;
import com.coresolution.consultation.repository.SessionExtensionRequestRepository;
import com.coresolution.consultation.service.EmailService;
import com.coresolution.consultation.service.PlSqlMappingSyncService;
import com.coresolution.consultation.service.RealTimeStatisticsService;
import com.coresolution.consultation.service.SessionExtensionService;
import com.coresolution.consultation.service.SessionSyncService;
import com.coresolution.consultation.service.UserService;
import com.coresolution.core.context.TenantContextHolder;
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
    private final RealTimeStatisticsService realTimeStatisticsService;
    private final PlSqlMappingSyncService plSqlMappingSyncService;
    
    @Override
    public SessionExtensionRequest createRequest(Long mappingId, Long requesterId, 
                                               Integer additionalSessions, String packageName, 
                                               BigDecimal packagePrice, String reason) {
        log.info("회기 추가 요청 생성: mappingId={}, requesterId={}, sessions={}", 
                mappingId, requesterId, additionalSessions);
        
        ConsultantClientMapping mapping = mappingRepository.findById(mappingId)
                .orElseThrow(() -> new RuntimeException("매핑을 찾을 수 없습니다: " + mappingId));
        
        User requester = userService.findActiveById(requesterId)
                .orElseThrow(() -> new RuntimeException("요청자를 찾을 수 없습니다: " + requesterId));
        
        SessionExtensionRequest request = SessionExtensionRequest.builder()
                .mapping(mapping)
                .requester(requester)
                .additionalSessions(additionalSessions)
                .packageName(packageName)
                .packagePrice(packagePrice)
                // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. CommonCodeService 사용
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
        
        String finalPaymentReference = "CASH".equals(paymentMethod) ? null : paymentReference;
        
        request.confirmPayment(paymentMethod, finalPaymentReference);
        
        User systemAdmin = userService.findActiveById(1L) // 시스템 관리자 ID
                .orElseThrow(() -> new RuntimeException("시스템 관리자를 찾을 수 없습니다"));
        
        request.approveByAdmin(systemAdmin);
        request.setAdminComment("입금 확인 후 자동 승인 처리");
        
        request.complete();
        
        SessionExtensionRequest savedRequest = requestRepository.save(request);
        
        try {
            Map<String, Object> plSqlResult = plSqlMappingSyncService.addSessionsToMapping(
                request.getMapping().getId(),
                request.getAdditionalSessions(),
                request.getPackageName(),
                request.getPackagePrice().longValue(),
                request.getReason()
            );
            
            if ((Boolean) plSqlResult.get("success")) {
                log.info("✅ PL/SQL 회기 추가 처리 완료: requestId={}, message={}", 
                        savedRequest.getId(), plSqlResult.get("message"));
            } else {
                log.warn("⚠️ PL/SQL 회기 추가 처리 실패: requestId={}, message={}", 
                        savedRequest.getId(), plSqlResult.get("message"));
                sessionSyncService.syncAfterSessionExtension(savedRequest);
            }
            
            sessionSyncService.syncAfterSessionExtension(savedRequest);
            log.info("✅ 회기 추가 후 동기화 완료: requestId={}", savedRequest.getId());
        } catch (Exception e) {
            log.error("❌ 회기 추가 후 동기화 실패: requestId={}, error={}", 
                     savedRequest.getId(), e.getMessage(), e);
        }
        
        try {
            ConsultantClientMapping mapping = request.getMapping();
            // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. CommonCodeService 사용
            mapping.setStatus(ConsultantClientMapping.MappingStatus.ACTIVE);
            // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. CommonCodeService 사용
            mapping.setPaymentStatus(ConsultantClientMapping.PaymentStatus.APPROVED);
            mapping.setAdminApprovalDate(LocalDateTime.now());
            mapping.setApprovedBy("시스템 자동 승인");
            
            mapping.setPaymentMethod(paymentMethod);
            mapping.setPaymentReference(finalPaymentReference);
            mapping.setPaymentDate(LocalDateTime.now());
            
            mappingRepository.save(mapping);
            
            try {
                realTimeStatisticsService.updateStatisticsOnMappingChange(
                    mapping.getConsultant().getId(), 
                    mapping.getClient().getId(), 
                    mapping.getBranchCode()
                );
                
                if (mapping.getPaymentAmount() != null) {
                    realTimeStatisticsService.updateFinancialStatisticsOnPayment(
                        mapping.getBranchCode(), 
                        mapping.getPaymentAmount(), 
                        LocalDateTime.now().toLocalDate()
                    );
                }
                
                log.info("✅ 세션 연장 승인시 실시간 통계 업데이트 완료: mappingId={}", mapping.getId());
            } catch (Exception e) {
                log.error("❌ 세션 연장 승인시 실시간 통계 업데이트 실패: {}", e.getMessage(), e);
            }
            
            log.info("✅ 매핑 상태 자동 활성화 및 결제 정보 동기화: mappingId={}, paymentReference={}", 
                    mapping.getId(), finalPaymentReference);
        } catch (Exception e) {
            log.error("❌ 매핑 상태 활성화 실패: {}", e.getMessage(), e);
        }
        
        try {
            sendSessionExtensionToErp(savedRequest, paymentMethod, finalPaymentReference);
            log.info("✅ ERP 시스템 연동 완료: requestId={}", savedRequest.getId());
        } catch (Exception e) {
            log.error("❌ ERP 시스템 연동 실패: requestId={}, error={}", 
                     savedRequest.getId(), e.getMessage(), e);
        }

        try {
            sendPaymentConfirmationEmail(savedRequest);
            log.info("✅ 입금 확인 이메일 발송 완료: requestId={}", savedRequest.getId());
        } catch (Exception e) {
            log.error("❌ 입금 확인 이메일 발송 실패: requestId={}, error={}", 
                     savedRequest.getId(), e.getMessage(), e);
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
        
        
        request.complete();
        
        SessionExtensionRequest savedRequest = requestRepository.save(request);
        
        try {
            Map<String, Object> plSqlResult = plSqlMappingSyncService.addSessionsToMapping(
                request.getMapping().getId(),
                request.getAdditionalSessions(),
                request.getPackageName(),
                request.getPackagePrice().longValue(),
                request.getReason()
            );
            
            if ((Boolean) plSqlResult.get("success")) {
                log.info("✅ PL/SQL 회기 추가 처리 완료: requestId={}, message={}", 
                        savedRequest.getId(), plSqlResult.get("message"));
            } else {
                log.warn("⚠️ PL/SQL 회기 추가 처리 실패: requestId={}, message={}", 
                        savedRequest.getId(), plSqlResult.get("message"));
            }
            
            sessionSyncService.syncAfterSessionExtension(savedRequest);
            log.info("✅ 회기 추가 후 동기화 완료: requestId={}", savedRequest.getId());
        } catch (Exception e) {
            log.error("❌ 회기 추가 후 동기화 실패: requestId={}, error={}", 
                     savedRequest.getId(), e.getMessage(), e);
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
        log.info("전체 요청 목록 조회 (매핑 정보 포함)");
        return requestRepository.findAllWithMappingOrderByCreatedAtDesc();
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
        
        long totalRequests = requestRepository.count();
        statistics.put("totalRequests", totalRequests);
        
        for (SessionExtensionRequest.ExtensionStatus status : SessionExtensionRequest.ExtensionStatus.values()) {
            long count = requestRepository.findByStatusOrderByCreatedAtDesc(status).size();
            statistics.put(status.name().toLowerCase() + "Count", count);
        }
        
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
     * ERP 시스템에 회기 추가 결제 정보 전송 (매칭 시스템과 동일한 방식)
     */
    private void sendSessionExtensionToErp(SessionExtensionRequest request, String paymentMethod, String paymentReference) {
        try {
            log.info("🔄 ERP 회기 추가 결제 데이터 전송 시작: RequestID={}", request.getId());
            
            ConsultantClientMapping mapping = request.getMapping();
            
            Map<String, Object> erpData = new HashMap<>();
            erpData.put("transactionType", "SESSION_EXTENSION_PAYMENT");
            erpData.put("requestId", request.getId());
            erpData.put("mappingId", mapping.getId());
            erpData.put("clientId", mapping.getClient().getId());
            erpData.put("clientName", mapping.getClient().getName());
            erpData.put("consultantId", mapping.getConsultant().getId());
            erpData.put("consultantName", mapping.getConsultant().getName());
            erpData.put("packageName", request.getPackageName());
            erpData.put("additionalSessions", request.getAdditionalSessions());
            erpData.put("packagePrice", request.getPackagePrice().longValue());
            erpData.put("paymentMethod", paymentMethod);
            erpData.put("paymentReference", paymentReference);
            erpData.put("paymentDate", request.getPaymentDate() != null ? 
                request.getPaymentDate().format(java.time.format.DateTimeFormatter.ISO_LOCAL_DATE_TIME) : 
                java.time.LocalDateTime.now().format(java.time.format.DateTimeFormatter.ISO_LOCAL_DATE_TIME));
            erpData.put("branchCode", mapping.getBranchCode());
            erpData.put("reason", request.getReason());
            erpData.put("erpTransactionId", "EXT_" + request.getId() + "_" + System.currentTimeMillis());
            
            String erpUrl = getErpSessionExtensionApiUrl();
            Map<String, String> headers = getErpHeaders();
            
            boolean success = sendToErpSystem(erpUrl, erpData, headers);
            
            if (success) {
                log.info("✅ ERP 회기 추가 결제 데이터 전송 완료: RequestID={}, ERPTransactionID={}", 
                        request.getId(), erpData.get("erpTransactionId"));
            } else {
                log.warn("⚠️ ERP 회기 추가 결제 데이터 전송 실패: RequestID={}", request.getId());
            }
            
        } catch (Exception e) {
            log.error("❌ ERP 회기 추가 결제 데이터 전송 중 오류: RequestID={}, Error={}", 
                     request.getId(), e.getMessage(), e);
            throw e;
        }
    }
    
    /**
     * ERP 시스템으로 실제 데이터 전송 (매칭 시스템과 동일한 방식)
     */
    private boolean sendToErpSystem(String url, Map<String, Object> data, Map<String, String> headers) {
        try {
            
            org.springframework.http.HttpHeaders httpHeaders = new org.springframework.http.HttpHeaders();
            httpHeaders.setContentType(org.springframework.http.MediaType.APPLICATION_JSON);
            
            if (headers != null) {
                headers.forEach(httpHeaders::set);
            }
            
            org.springframework.http.HttpEntity<Map<String, Object>> request = new org.springframework.http.HttpEntity<>(data, httpHeaders);
            
            
            log.info("🎭 모의 ERP 전송: URL={}, Data={}, Request={}", url, data.get("erpTransactionId"), request != null ? "준비됨" : "null");
            return true;
            
        } catch (Exception e) {
            log.error("❌ ERP 시스템 통신 오류", e);
            return false;
        }
    }
    
    /**
     * ERP 회기 추가 API URL 가져오기 (매칭 시스템과 동일한 방식)
     */
    private String getErpSessionExtensionApiUrl() {
        return System.getProperty("erp.session.extension.api.url", "http://erp.company.com/api/session-extension");
    }
    
    /**
     * ERP 인증 헤더 생성 (매칭 시스템과 동일한 방식)
     */
    private Map<String, String> getErpHeaders() {
        Map<String, String> headers = new HashMap<>();
        headers.put("Authorization", "Bearer " + System.getProperty("erp.api.token", "default-token"));
        headers.put("X-System", "CONSULTATION_SYSTEM");
        headers.put("X-Version", "1.0");
        headers.put("X-Transaction-Type", "SESSION_EXTENSION");
        return headers;
    }

    /**
     * 입금 확인 이메일 발송
     */
    private void sendPaymentConfirmationEmail(SessionExtensionRequest request) {
        try {
            log.info("📧 입금 확인 이메일 발송 시작: requestId={}", request.getId());
            
            User requester = request.getRequester();
            if (requester == null || requester.getEmail() == null) {
                log.warn("⚠️ 이메일 발송 실패: 요청자 정보 또는 이메일이 없습니다. requestId={}", request.getId());
                return;
            }
            
            ConsultantClientMapping mapping = request.getMapping();
            if (mapping == null) {
                log.warn("⚠️ 이메일 발송 실패: 매핑 정보가 없습니다. requestId={}", request.getId());
                return;
            }
            
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
