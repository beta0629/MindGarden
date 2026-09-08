package com.coresolution.consultation.service.impl;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import com.coresolution.consultation.constant.EmailConstants;
import com.coresolution.consultation.constant.FinancialTransactionConstants;
import com.coresolution.consultation.constant.admin.AdminServiceUserFacingMessages;
import com.coresolution.consultation.dto.EmailResponse;
import com.coresolution.consultation.dto.FinancialTransactionRequest;
import com.coresolution.consultation.dto.FinancialTransactionResponse;
import com.coresolution.consultation.entity.ConsultantClientMapping;
import com.coresolution.consultation.entity.SessionExtensionRequest;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.entity.erp.financial.FinancialTransaction;
import com.coresolution.consultation.exception.EntityNotFoundException;
import com.coresolution.consultation.repository.ConsultantClientMappingRepository;
import com.coresolution.consultation.repository.SessionExtensionRequestRepository;
import com.coresolution.consultation.repository.erp.financial.FinancialTransactionRepository;
import com.coresolution.consultation.service.EmailService;
import com.coresolution.consultation.service.RealTimeStatisticsService;
import com.coresolution.consultation.service.SalaryTaxRateLookupService;
import com.coresolution.consultation.service.SessionExtensionService;
import com.coresolution.consultation.service.SessionSyncService;
import com.coresolution.consultation.service.UserService;
import com.coresolution.consultation.service.erp.financial.FinancialTransactionService;
import com.coresolution.consultation.util.EmailLogMasking;
import com.coresolution.consultation.util.TaxCalculationUtil;
import com.coresolution.core.context.TenantContextHolder;
import com.coresolution.core.context.TenantIsolationValidator;
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

    private static final String BACKFILL_KEY_SCANNED = "scanned";
    private static final String BACKFILL_KEY_CREATED = "created";
    private static final String BACKFILL_KEY_SKIPPED_EXISTING = "skippedExisting";
    private static final String BACKFILL_KEY_SKIPPED_NO_AMOUNT = "skippedNoAmount";
    private static final String BACKFILL_KEY_CREATED_ITEMS = "createdItems";
    private static final String BACKFILL_ITEM_REQUEST_ID = "requestId";
    private static final String BACKFILL_ITEM_AMOUNT = "amount";
    /** 운영 확인용 createdItems 상한 (응답 크기 제한) */
    private static final int BACKFILL_CREATED_ITEMS_MAX = 100;
    
    private final SessionExtensionRequestRepository requestRepository;
    private final ConsultantClientMappingRepository mappingRepository;
    private final UserService userService;
    private final SessionSyncService sessionSyncService;
    private final EmailService emailService;
    private final RealTimeStatisticsService realTimeStatisticsService;
    private final FinancialTransactionService financialTransactionService;
    private final FinancialTransactionRepository financialTransactionRepository;
    private final SalaryTaxRateLookupService salaryTaxRateLookupService;
    
    @Override
    public SessionExtensionRequest createRequest(
            Long mappingId,
            Long requesterId,
            Integer additionalSessions,
            BigDecimal extensionAmount,
            String reason) {
        log.info("회기 추가 요청 생성: mappingId={}, requesterId={}, sessions={}", 
                mappingId, requesterId, additionalSessions);
        
        String tenantId = TenantContextHolder.getRequiredTenantId();
        ConsultantClientMapping mapping = mappingRepository.findByTenantIdAndId(tenantId, mappingId)
                .orElseThrow(() -> new EntityNotFoundException("매핑", mappingId));

        if (mapping.getStatus() != ConsultantClientMapping.MappingStatus.ACTIVE) {
            throw new IllegalStateException("ACTIVE 매핑에만 회기를 추가할 수 있습니다.");
        }
        if (additionalSessions == null || additionalSessions < 1) {
            throw new IllegalArgumentException("추가 회기 수는 1 이상이어야 합니다.");
        }
        if (extensionAmount == null || extensionAmount.signum() < 0) {
            throw new IllegalArgumentException("추가분 결제 금액은 0 이상이어야 합니다.");
        }
        String inheritedPackageName = mapping.getPackageName();
        if (inheritedPackageName == null || inheritedPackageName.isBlank()) {
            throw new IllegalStateException("현재 매핑의 패키지 정보가 없어 회기를 추가할 수 없습니다.");
        }
        
        User requester = userService.findActiveById(requesterId)
                .orElseThrow(() -> new EntityNotFoundException("요청자", requesterId));

        List<SessionExtensionRequest> pendingRequests = requestRepository
                .findByTenantIdAndMappingIdAndStatus(
                        tenantId, mappingId, SessionExtensionRequest.ExtensionStatus.PENDING);
        if (!pendingRequests.isEmpty()) {
            throw new IllegalStateException(
                    "이미 입금 대기 중인 회기 추가 요청이 있습니다. 통합 스케줄에서 입금 확인 또는 취소를 진행해 주세요.");
        }
        
        // packageName은 mapping 승계(재선택 금지). packagePrice는 이번 요청 결제액만 저장.
        SessionExtensionRequest request = SessionExtensionRequest.builder()
                .tenantId(tenantId)
                .mapping(mapping)
                .requester(requester)
                .additionalSessions(additionalSessions)
                .packageName(inheritedPackageName)
                .packagePrice(extensionAmount)
                // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. CommonCodeService 사용
                .status(SessionExtensionRequest.ExtensionStatus.PENDING)
                .reason(reason)
                .build();
        
        SessionExtensionRequest savedRequest = requestRepository.save(request);
        
        log.info("✅ 회기 추가 요청 생성 완료: requestId={}", savedRequest.getId());
        return savedRequest;
    }
    
    @Override
    public SessionExtensionRequest confirmPayment(
            Long requestId,
            Long adminId,
            String paymentMethod,
            String paymentReference) {
        log.info("💰 입금 확인 및 자동 승인 처리: requestId={}, paymentMethod={}, paymentReference={}", 
                requestId, paymentMethod, paymentReference);
        
        SessionExtensionRequest request = requireRequestForCurrentTenantForUpdate(requestId);
        
        String finalPaymentReference = "CASH".equals(paymentMethod) ? null : paymentReference;
        
        request.confirmPayment(paymentMethod, finalPaymentReference);
        
        User systemAdmin = userService.findActiveById(adminId)
                .orElseThrow(() -> new EntityNotFoundException("관리자", adminId));
        
        request.approveByAdmin(systemAdmin);
        request.setAdminComment("입금 확인 후 자동 승인 처리");
        
        request.complete();
        
        SessionExtensionRequest savedRequest = requestRepository.save(request);
        
        sessionSyncService.syncAfterSessionExtension(savedRequest);
        log.info("✅ 회기 추가 후 동기화 완료: requestId={}", savedRequest.getId());
        
        ConsultantClientMapping mapping = request.getMapping();
        try {
            realTimeStatisticsService.updateStatisticsOnMappingChange(
                    mapping.getConsultant().getId(),
                    mapping.getClient().getId(),
                    mapping.getBranchCode());
            realTimeStatisticsService.updateFinancialStatisticsOnPayment(
                    mapping.getBranchCode(),
                    savedRequest.getPackagePrice().longValue(),
                    LocalDateTime.now().toLocalDate());
            log.info("✅ 회기 추가분 실시간 통계 업데이트 완료: mappingId={}, requestId={}",
                    mapping.getId(), savedRequest.getId());
        } catch (Exception e) {
            log.error("❌ 회기 추가분 실시간 통계 업데이트 실패: {}", e.getMessage(), e);
        }
        
        // 원장(FinancialTransaction) 기록 — 모의 ERP 금지. 실패 시 트랜잭션 롤백(회기·요청과 원자성).
        createSessionExtensionIncomeTransaction(savedRequest, paymentMethod);

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
        
        SessionExtensionRequest request = requireRequestForCurrentTenant(requestId);
        
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
        
        SessionExtensionRequest request = requireRequestForCurrentTenant(requestId);
        
        request.reject(reason);
        
        SessionExtensionRequest savedRequest = requestRepository.save(request);
        
        log.info("✅ 요청 거부 완료: requestId={}", savedRequest.getId());
        return savedRequest;
    }

    @Override
    public SessionExtensionRequest cancelRequest(Long requestId, Long adminId, String reason) {
        log.info("입금 전 회기 추가 요청 취소: requestId={}, adminId={}", requestId, adminId);

        userService.findActiveById(adminId)
                .orElseThrow(() -> new EntityNotFoundException("관리자", adminId));
        SessionExtensionRequest request = requireRequestForCurrentTenantForUpdate(requestId);
        request.cancel(reason);

        SessionExtensionRequest savedRequest = requestRepository.save(request);
        log.info("회기 추가 요청 취소 완료: requestId={}, status={}",
                savedRequest.getId(), savedRequest.getStatus());
        return savedRequest;
    }
    
    @Override
    public SessionExtensionRequest completeRequest(Long requestId) {
        log.info("요청 완료 처리: requestId={}", requestId);
        
        SessionExtensionRequest request = requireRequestForCurrentTenantForUpdate(requestId);

        request.complete();

        SessionExtensionRequest savedRequest = requestRepository.save(request);

        sessionSyncService.syncAfterSessionExtension(savedRequest);
        log.info("✅ 회기 추가 후 동기화 완료: requestId={}", savedRequest.getId());

        // 모바일 /complete 경로도 confirmPayment 과 동일하게 원장 기록 (금액 없으면 스킵, 기존 FT면 중복 스킵)
        createSessionExtensionIncomeTransaction(savedRequest, savedRequest.getPaymentMethod());

        log.info("✅ 회기 추가 완료: requestId={}, mappingId={}, sessions={}", 
                savedRequest.getId(), savedRequest.getMapping().getId(), request.getAdditionalSessions());
        return savedRequest;
    }
    
    @Override
    @Transactional(readOnly = true)
    public SessionExtensionRequest getRequestById(Long requestId) {
        log.info("요청 상세 조회: requestId={}", requestId);
        String tenantId = TenantContextHolder.getRequiredTenantId();
        return requestRepository.findByTenantIdAndIdWithDetails(tenantId, requestId)
                .orElseThrow(() -> new EntityNotFoundException("회기 추가 요청", requestId));
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
        String tenantId = TenantContextHolder.getRequiredTenantId();
        return requestRepository.findPendingPaymentRequests(tenantId);
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
     * {@inheritDoc}
     *
     * <p>회기 수({@code sessionSyncService}/{@code addSessions})는 절대 변경하지 않는다.
     * 원장(INCOME) 누락분만 idempotent 생성한다.</p>
     */
    @Override
    public Map<String, Object> backfillMissingSessionExtensionIncomeTransactions(String tenantId) {
        TenantIsolationValidator.requireTenantIdMatch(tenantId);
        log.info("회기 추가 수입 원장 백필 시작: tenantId={} (회기 동기화 없음)", tenantId);

        long scanned = 0L;
        long created = 0L;
        long skippedExisting = 0L;
        long skippedNoAmount = 0L;
        List<Map<String, Object>> createdItems = new ArrayList<>();

        List<SessionExtensionRequest> candidates = requestRepository
                .findByTenantIdAndStatusAndPackagePriceGreaterThan(
                        tenantId,
                        SessionExtensionRequest.ExtensionStatus.COMPLETED,
                        BigDecimal.ZERO);

        for (SessionExtensionRequest request : candidates) {
            scanned++;
            SessionExtensionIncomeCreateResult createResult =
                    createSessionExtensionIncomeTransaction(request, request.getPaymentMethod());
            switch (createResult) {
                case CREATED:
                    created++;
                    if (createdItems.size() < BACKFILL_CREATED_ITEMS_MAX) {
                        Map<String, Object> item = new HashMap<>();
                        item.put(BACKFILL_ITEM_REQUEST_ID, request.getId());
                        item.put(BACKFILL_ITEM_AMOUNT, request.getPackagePrice());
                        createdItems.add(item);
                    }
                    break;
                case SKIPPED_EXISTING:
                    skippedExisting++;
                    break;
                case SKIPPED_NO_AMOUNT:
                    skippedNoAmount++;
                    break;
                default:
                    throw new IllegalStateException("지원하지 않는 원장 생성 결과: " + createResult);
            }
        }

        Map<String, Object> result = new HashMap<>();
        result.put(BACKFILL_KEY_SCANNED, scanned);
        result.put(BACKFILL_KEY_CREATED, created);
        result.put(BACKFILL_KEY_SKIPPED_EXISTING, skippedExisting);
        result.put(BACKFILL_KEY_SKIPPED_NO_AMOUNT, skippedNoAmount);
        result.put(BACKFILL_KEY_CREATED_ITEMS, createdItems);

        log.info("회기 추가 수입 원장 백필 완료: tenantId={}, scanned={}, created={}, skippedExisting={}, skippedNoAmount={}, createdItemsSample={}",
                tenantId, scanned, created, skippedExisting, skippedNoAmount, createdItems.size());
        return result;
    }
    
    /**
     * 현재 테넌트 컨텍스트의 회기 추가 요청을 ID로 조회합니다.
     *
     * @param requestId 요청 PK
     * @return 요청 엔티티
     */
    private SessionExtensionRequest requireRequestForCurrentTenant(Long requestId) {
        String tenantId = TenantContextHolder.getRequiredTenantId();
        return requestRepository.findByTenantIdAndId(tenantId, requestId)
                .orElseThrow(() -> new EntityNotFoundException("회기 추가 요청", requestId));
    }

    /**
     * 현재 테넌트 요청을 중복 처리 방지 잠금으로 조회합니다.
     *
     * @param requestId 요청 PK
     * @return 잠긴 요청 엔티티
     */
    private SessionExtensionRequest requireRequestForCurrentTenantForUpdate(Long requestId) {
        String tenantId = TenantContextHolder.getRequiredTenantId();
        return requestRepository.findByTenantIdAndIdForUpdate(tenantId, requestId)
                .orElseThrow(() -> new EntityNotFoundException("회기 추가 요청", requestId));
    }

    /**
     * 회기 추가 입금 확인 시 상담료 수입(FinancialTransaction)을 원장에 기록한다.
     *
     * <p>기존 {@code sendSessionExtensionToErp} 모의 전송은 원장·ERP 목록에 행이 생기지 않아
     * “결제 성공인데 이력/원장에 안 보임” 원인을 만들었다. 추가 매칭 입금과 동일하게
     * {@link FinancialTransactionService#createTransaction} 경로를 사용한다.</p>
     *
     * @param request 완료된 회기 추가 요청
     * @param paymentMethod 결제 수단(공통코드 code_value 권장)
     * @return 생성·스킵 결과
     */
    private SessionExtensionIncomeCreateResult createSessionExtensionIncomeTransaction(
            SessionExtensionRequest request, String paymentMethod) {
        Long requestId = request.getId();
        BigDecimal packagePrice = request.getPackagePrice();
        long amountLong = packagePrice != null ? packagePrice.longValue() : 0L;
        log.info("회기 추가 수입 거래 생성 시작: requestId={}, amount={}", requestId, amountLong);

        if (amountLong <= 0L) {
            log.warn("유효한 회기 추가 결제 금액이 없어 원장 기록을 건너뜀: requestId={}", requestId);
            return SessionExtensionIncomeCreateResult.SKIPPED_NO_AMOUNT;
        }

        String tenantId = request.getTenantId();
        if (tenantId == null || tenantId.isBlank()) {
            tenantId = TenantContextHolder.getRequiredTenantId();
        }

        boolean exists = financialTransactionRepository
                .existsByTenantIdAndRelatedEntityIdAndRelatedEntityTypeAndTransactionTypeAndIsDeletedFalse(
                        tenantId,
                        requestId,
                        FinancialTransactionConstants.RELATED_ENTITY_SESSION_EXTENSION_REQUEST,
                        FinancialTransaction.TransactionType.INCOME);
        if (exists) {
            log.warn("중복 거래 방지: requestId={} 회기 추가 수입 거래가 이미 존재합니다.", requestId);
            return SessionExtensionIncomeCreateResult.SKIPPED_EXISTING;
        }

        int additionalSessions = request.getAdditionalSessions() != null
                ? request.getAdditionalSessions() : 0;
        String packageName = request.getPackageName() != null
                ? request.getPackageName()
                : AdminServiceUserFacingMessages.FALLBACK_PACKAGE_DISPLAY_NAME;
        String methodLabel = paymentMethod != null && !paymentMethod.isBlank()
                ? paymentMethod
                : AdminServiceUserFacingMessages.PAYMENT_METHOD_UNSPECIFIED;

        BigDecimal vatRate = salaryTaxRateLookupService.getVatRate(tenantId);
        TaxCalculationUtil.TaxCalculationResult tax =
                TaxCalculationUtil.calculateTaxFromPayment(BigDecimal.valueOf(amountLong), vatRate);

        String description = String.format(
                AdminServiceUserFacingMessages.DESC_ADDITIONAL_SESSION_INCOME_FMT,
                packageName,
                additionalSessions,
                methodLabel,
                amountLong);
        description = description + String.format(
                AdminServiceUserFacingMessages.DESC_TAX_SPLIT_SUFFIX_FMT,
                tax.getAmountExcludingTax().longValue(),
                tax.getVatAmount().longValue());

        LocalDate transactionDate = request.getPaymentDate() != null
                ? request.getPaymentDate().toLocalDate()
                : LocalDate.now();

        FinancialTransactionRequest ftRequest = FinancialTransactionRequest.builder()
                .transactionType(FinancialTransaction.TransactionType.INCOME.name())
                .category(FinancialTransactionConstants.CATEGORY_CONSULTATION_FEE)
                .subcategory(FinancialTransactionConstants.SUBCATEGORY_ADDITIONAL_CONSULTATION)
                .amount(tax.getAmountIncludingTax())
                .taxAmount(tax.getVatAmount())
                .amountBeforeTax(tax.getAmountExcludingTax())
                .description(description)
                .transactionDate(transactionDate)
                .relatedEntityId(requestId)
                .relatedEntityType(FinancialTransactionConstants.RELATED_ENTITY_SESSION_EXTENSION_REQUEST)
                .tenantId(tenantId)
                .taxIncluded(true)
                .paymentMethod(paymentMethod)
                .build();

        FinancialTransactionResponse response =
                financialTransactionService.createTransaction(ftRequest, null);

        if (response == null || response.getId() == null) {
            throw new IllegalStateException(String.format(
                    "회기 추가 수입 원장 생성 실패(거래 ID 없음): requestId=%s, amount=%s",
                    requestId, amountLong));
        }

        FinancialTransaction transaction = financialTransactionRepository
                .findByTenantIdAndId(tenantId, response.getId())
                .orElseThrow(() -> new IllegalStateException(String.format(
                        "회기 추가 수입 원장 생성 후 조회 실패: requestId=%s, transactionId=%s",
                        requestId, response.getId())));
        transaction.complete();
        transaction.setApprovedAt(LocalDateTime.now());
        financialTransactionRepository.save(transaction);

        log.info("회기 추가 수입 거래 생성 완료: requestId={}, transactionId={}, amount={}",
                requestId, response.getId(), amountLong);
        return SessionExtensionIncomeCreateResult.CREATED;
    }

    /**
     * 회기 추가 수입 원장 생성 결과 (confirmPayment·백필 공통).
     */
    private enum SessionExtensionIncomeCreateResult {
        CREATED,
        SKIPPED_EXISTING,
        SKIPPED_NO_AMOUNT
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
                        request.getId(), EmailLogMasking.maskForLog(requester.getEmail()));
            } else {
                log.warn("⚠️ 입금 확인 이메일 발송 실패: requestId={}, email={}", 
                        request.getId(), EmailLogMasking.maskForLog(requester.getEmail()));
            }
            
        } catch (Exception e) {
            log.error("❌ 입금 확인 이메일 발송 중 오류 발생: requestId={}, error={}", 
                     request.getId(), e.getMessage(), e);
            throw e;
        }
    }
}
