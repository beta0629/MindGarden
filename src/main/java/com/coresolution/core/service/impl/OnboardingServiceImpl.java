package com.coresolution.core.service.impl;

import java.time.Instant;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import com.coresolution.consultation.constant.UserRole;
import com.coresolution.consultation.entity.CommonCode;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.repository.UserRepository;
import com.coresolution.consultation.service.CommonCodeService;
import com.coresolution.core.constant.OnboardingConstants;
import com.coresolution.core.domain.Tenant;
import com.coresolution.core.domain.onboarding.OnboardingRequest;
import com.coresolution.core.domain.onboarding.OnboardingStatus;
import com.coresolution.core.domain.onboarding.RiskLevel;
import com.coresolution.core.repository.TenantRepository;
import com.coresolution.core.repository.billing.TenantSubscriptionRepository;
import com.coresolution.core.repository.onboarding.OnboardingRequestRepository;
import com.coresolution.core.service.AutoApprovalService;
import com.coresolution.core.service.OnboardingApprovalService;
import com.coresolution.core.service.OnboardingService;
import com.coresolution.core.service.TenantDashboardService;
import com.coresolution.core.service.TenantIdGenerator;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * 온보딩 서비스 구현체
 * 온보딩 요청 CRUD 및 승인 프로세스 처리
 * OnboardingApprovalService와 통합하여 PL/SQL 프로시저 호출
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-01-XX
 */
@Slf4j
@Service
@Transactional
@RequiredArgsConstructor
public class OnboardingServiceImpl implements OnboardingService {
    
    private final OnboardingRequestRepository repository;
    private final OnboardingApprovalService approvalService;
    private final UserRepository userRepository;
    private final AutoApprovalService autoApprovalService;
    private final TenantSubscriptionRepository subscriptionRepository;
    private final TenantIdGenerator tenantIdGenerator;
    private final TenantDashboardService tenantDashboardService;
    private final TenantRepository tenantRepository;
    private final PasswordEncoder passwordEncoder;
    private final ObjectMapper objectMapper;
    private final CommonCodeService commonCodeService;
    
    @Override
    @Transactional(readOnly = true)
    public List<OnboardingRequest> findPending() {
        log.debug("대기 중인 온보딩 요청 목록 조회");
        return repository.findByStatusOrderByCreatedAtDesc(OnboardingStatus.PENDING);
    }
    
    @Override
    @Transactional(readOnly = true)
    public OnboardingRequest getById(Long id) {
        log.debug("온보딩 요청 조회: id={}", id);
        return repository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException(
                OnboardingConstants.formatError(OnboardingConstants.ERROR_TENANT_NOT_FOUND, id)
            ));
    }
    
    @Override
    @Transactional(propagation = Propagation.REQUIRED, rollbackFor = Exception.class)
    public OnboardingRequest create(
            String tenantId,
            String tenantName,
            String requestedBy,
            RiskLevel riskLevel,
            String checklistJson,
            String businessType) {
        
        log.info("온보딩 요청 생성: tenantId={}, tenantName={}, requestedBy={}", 
            tenantId, tenantName, requestedBy);
        
        // 기본 위험도 조회 (공통 코드에서 동적으로 가져옴)
        RiskLevel defaultRiskLevel = getDefaultRiskLevel();
        RiskLevel finalRiskLevel = riskLevel != null ? riskLevel : defaultRiskLevel;
        
        OnboardingRequest entity = OnboardingRequest.builder()
            .tenantId(tenantId)
            .tenantName(tenantName)
            .requestedBy(requestedBy)
            .riskLevel(finalRiskLevel)
            .checklistJson(checklistJson)
            .businessType(businessType)
            .status(OnboardingStatus.PENDING)
            .isDeleted(false)  // BaseEntity의 기본값이 Builder에서 적용되지 않으므로 명시적으로 설정
            .version(0L)  // BaseEntity의 기본값이 Builder에서 적용되지 않으므로 명시적으로 설정
            .build();
        
        OnboardingRequest saved = repository.save(entity);
        
        log.info("온보딩 요청 생성 완료: id={}, tenantId={}", saved.getId(), tenantId);
        
        // 자동 승인 체크
        // 주의: 자동 승인은 별도로 처리하여 원래 트랜잭션에 영향을 주지 않도록 함
        // 자동 승인 실패가 전체 온보딩 요청 생성을 막지 않도록 함
        if (autoApprovalService.canAutoApprove(saved)) {
            log.info("자동 승인 조건 만족: requestId={}, 자동 승인은 별도로 처리됩니다", saved.getId());
            // 자동 승인은 별도로 처리 (현재는 수동 승인 필요)
            // TODO: 자동 승인을 별도 스케줄러나 이벤트로 처리하도록 개선
        } else {
            AutoApprovalService.AutoApprovalResult result = autoApprovalService.checkAutoApprovalConditions(saved);
            log.debug("자동 승인 조건 불만족: requestId={}, reason={}", 
                saved.getId(), result.getReason());
        }
        
        return saved;
    }
    
    /**
     * 별도 트랜잭션에서 decide 메서드 실행
     * 자동 승인 실패 시에도 원래 트랜잭션이 롤백되지 않도록 함
     * 
     * 주의: decideInternal을 호출하여 트랜잭션 전파 문제를 피함
     * 예외가 발생해도 원래 트랜잭션에 영향을 주지 않도록 예외를 catch하고 null 반환
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW, rollbackFor = Exception.class)
    public OnboardingRequest decideInNewTransaction(
            Long requestId,
            OnboardingStatus status,
            String actorId,
            String note) {
        try {
            // decideInternal을 호출하여 트랜잭션 전파 문제를 피함
            return decideInternal(requestId, status, actorId, note);
        } catch (Exception e) {
            log.error("별도 트랜잭션에서 decide 실행 중 오류 발생: requestId={}, error={}, 원래 트랜잭션에 영향 없음", 
                requestId, e.getMessage(), e);
            // 예외를 다시 던지지 않고 null을 반환하여 원래 트랜잭션에 영향을 주지 않음
            // 호출하는 쪽에서 null 체크를 해야 함
            return null;
        }
    }
    
    /**
     * decide 메서드의 실제 로직 (트랜잭션 없음)
     * decide와 decideInNewTransaction에서 공통으로 사용
     */
    private OnboardingRequest decideInternal(
            Long requestId,
            OnboardingStatus status,
            String actorId,
            String note) {
        
        log.info("온보딩 요청 결정 (내부): requestId={}, status={}, actorId={}", 
            requestId, status, actorId);
        
        OnboardingRequest request = repository.findById(requestId)
            .orElseThrow(() -> new IllegalArgumentException(
                OnboardingConstants.formatError(OnboardingConstants.ERROR_TENANT_NOT_FOUND, requestId)
            ));
        
        // 상태 업데이트
        request.setStatus(status);
        request.setDecidedBy(actorId);
        request.setDecisionAt(DateTimeFormatter.ISO_INSTANT.format(Instant.now()));
        request.setDecisionNote(note);
        
        // 승인 시 PL/SQL 프로시저를 통해 테넌트 생성 및 ERD 생성 등 자동 처리
        if (status == OnboardingStatus.APPROVED) {
            // 멀티 테넌트 지원: 같은 이메일로 여러 테넌트 생성 가능
            // 이메일 중복 체크 제거 (멀티 테넌트 지원)
            log.info("테넌트 생성 진행: requestedBy={}, tenantName={}", 
                request.getRequestedBy(), request.getTenantName());
            
            // tenant_id가 없으면 자동 생성 또는 삭제된 테넌트 복구
            String tenantId = request.getTenantId();
            if (tenantId == null || tenantId.trim().isEmpty()) {
                // 같은 이메일로 삭제된 테넌트가 있는지 확인
                String email = request.getRequestedBy();
                if (email != null && !email.trim().isEmpty()) {
                    List<Tenant> deletedTenants = tenantRepository.findDeletedByContactEmailIgnoreCase(email.trim().toLowerCase());
                    if (!deletedTenants.isEmpty()) {
                        // 삭제된 테넌트가 있으면 가장 최근에 삭제된 테넌트 복구
                        Tenant deletedTenant = deletedTenants.get(0);
                        tenantId = deletedTenant.getTenantId();
                        
                        // 테넌트 복구 및 정보 업데이트
                        deletedTenant.setIsDeleted(false);
                        deletedTenant.setDeletedAt(null);
                        deletedTenant.setStatus(Tenant.TenantStatus.PENDING); // 승인 후 ACTIVE로 변경될 예정
                        
                        // 온보딩 요청 정보로 테넌트 정보 업데이트
                        if (request.getTenantName() != null && !request.getTenantName().trim().isEmpty()) {
                            deletedTenant.setName(request.getTenantName());
                        }
                        if (request.getBusinessType() != null && !request.getBusinessType().trim().isEmpty()) {
                            deletedTenant.setBusinessType(request.getBusinessType());
                        }
                        if (email != null && !email.trim().isEmpty()) {
                            deletedTenant.setContactEmail(email.trim().toLowerCase());
                        }
                        
                        tenantRepository.save(deletedTenant);
                        
                        log.info("삭제된 테넌트 복구: tenantId={}, email={}, name={}", 
                            tenantId, email, deletedTenant.getName());
                    }
                }
                
                // 삭제된 테넌트가 없으면 새로운 tenant_id 생성
                if (tenantId == null || tenantId.trim().isEmpty()) {
                    // checklistJson에서 주소 정보 추출하여 지역 코드 생성
                    String regionCode = extractRegionCodeFromRequest(request);
                    
                    tenantId = tenantIdGenerator.generateTenantId(
                        request.getTenantName(), 
                        request.getBusinessType(),
                        regionCode
                    );
                    log.info("테넌트 ID 자동 생성: tenantName={}, businessType={}, regionCode={}, tenantId={}", 
                        request.getTenantName(), request.getBusinessType(), regionCode, tenantId);
                }
                
                request.setTenantId(tenantId);
            }
            
            log.info("온보딩 승인 처리 시작: requestId={}, tenantId={}, businessType={}", 
                requestId, tenantId, request.getBusinessType());
            
            // 기본 업종 조회 (공통 코드에서 동적으로 가져옴)
            String businessType = getDefaultBusinessType(request.getBusinessType());
            
            Map<String, Object> approvalResult = approvalService.processOnboardingApproval(
                requestId,
                tenantId,
                request.getTenantName(),
                businessType,
                actorId,
                note
            );
            
            Boolean success = (Boolean) approvalResult.get("success");
            String message = (String) approvalResult.get("message");
            
            // 온보딩 승인 성공 시 기본 대시보드 생성
            if (success != null && success) {
                try {
                    // 기본 업종 조회 (공통 코드에서 동적으로 가져옴)
                    String dashboardBusinessType = getDefaultBusinessType(request.getBusinessType());
                    List<com.coresolution.core.dto.TenantDashboardResponse> dashboards = 
                        tenantDashboardService.createDefaultDashboards(tenantId, dashboardBusinessType, actorId);
                    
                    log.info("기본 대시보드 생성 완료: tenantId={}, count={}", tenantId, dashboards.size());
                } catch (Exception e) {
                    log.error("기본 대시보드 생성 실패: tenantId={}", tenantId, e);
                    // 대시보드 생성 실패는 온보딩 프로세스를 중단하지 않음 (경고만)
                }
            }
            
            if (success == null || !success) {
                log.error("온보딩 승인 프로세스 실패: {}", message);
                // 승인 프로세스 실패 시 상태를 ON_HOLD로 변경
                request.setStatus(OnboardingStatus.ON_HOLD);
                request.setDecisionNote(note != null ? note + "\n[시스템 오류] " + message : "[시스템 오류] " + message);
            } else {
                log.info("온보딩 승인 프로세스 완료: {}", message);
                
                // 온보딩 승인 후 관리자 계정 생성
                try {
                    createTenantAdminAccount(request, tenantId);
                } catch (Exception e) {
                    log.error("테넌트 관리자 계정 생성 실패: tenantId={}, error={}", tenantId, e.getMessage(), e);
                    // 관리자 계정 생성 실패는 온보딩 프로세스를 중단하지 않음 (경고만)
                }
                
                // 온보딩 승인 후 구독의 tenant_id 업데이트
                // 테넌트가 생성되었으므로 checklistJson에서 subscriptionId를 찾아서 업데이트
                try {
                    updateSubscriptionTenantId(request);
                } catch (Exception e) {
                    log.warn("구독 tenant_id 업데이트 실패 (계속 진행): {}", e.getMessage());
                    // 구독 업데이트 실패해도 온보딩 프로세스는 계속 진행
                }
            }
        }
        
        OnboardingRequest saved = repository.save(request);
        
        log.info("온보딩 요청 결정 완료: id={}, status={}", saved.getId(), saved.getStatus());
        return saved;
    }
    
    @Override
    @Transactional(propagation = Propagation.REQUIRED)
    public OnboardingRequest decide(
            Long requestId,
            OnboardingStatus status,
            String actorId,
            String note) {
        // decideInternal을 호출하여 실제 로직 실행
        return decideInternal(requestId, status, actorId, note);
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<OnboardingRequest> findByTenantId(String tenantId) {
        log.debug("테넌트별 온보딩 요청 목록 조회: tenantId={}", tenantId);
        return repository.findByTenantIdOrderByCreatedAtDesc(tenantId);
    }
    
    @Override
    @Transactional(readOnly = true)
    public long countByStatus(OnboardingStatus status) {
        log.debug("상태별 온보딩 요청 개수 조회: status={}", status);
        return repository.countByStatus(status);
    }
    
    @Override
    @Transactional(readOnly = true)
    public Page<OnboardingRequest> findByStatus(OnboardingStatus status, Pageable pageable) {
        log.debug("상태별 온보딩 요청 페이지 조회: status={}, page={}, size={}", 
            status, pageable.getPageNumber(), pageable.getPageSize());
        return repository.findByStatusOrderByCreatedAtDesc(status, pageable);
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<OnboardingRequest> findAll() {
        log.debug("모든 온보딩 요청 목록 조회");
        return repository.findAllByIsDeletedFalseOrderByCreatedAtDesc();
    }
    
    @Override
    @Transactional(readOnly = true)
    public Page<OnboardingRequest> findAll(Pageable pageable) {
        log.debug("모든 온보딩 요청 페이지 조회: page={}, size={}", 
            pageable.getPageNumber(), pageable.getPageSize());
        return repository.findAllByIsDeletedFalseOrderByCreatedAtDesc(pageable);
    }
    
    @Override
    public OnboardingRequest retryApproval(Long requestId, String actorId, String note) {
        log.info("온보딩 승인 프로세스 재시도: requestId={}, actorId={}", requestId, actorId);
        
        OnboardingRequest request = repository.findById(requestId)
            .orElseThrow(() -> new IllegalArgumentException(
                OnboardingConstants.formatError(OnboardingConstants.ERROR_TENANT_NOT_FOUND, requestId)
            ));
        
        // ON_HOLD 상태인 경우에만 재시도 가능
        if (request.getStatus() != OnboardingStatus.ON_HOLD) {
            throw new IllegalStateException(
                OnboardingConstants.formatError(
                    OnboardingConstants.ERROR_RETRY_ONLY_ON_HOLD, 
                    request.getStatus()
                )
            );
        }
        
        // 재시도 메모 추가
        String retryNote = (note != null && !note.trim().isEmpty()) 
            ? note 
            : "프로시저 실패로 인한 재시도";
        
        if (request.getDecisionNote() != null && !request.getDecisionNote().isEmpty()) {
            retryNote = request.getDecisionNote() + "\n[재시도] " + retryNote;
        } else {
            retryNote = "[재시도] " + retryNote;
        }
        
        // 다시 APPROVED 상태로 변경하고 프로시저 재실행
        return decide(requestId, OnboardingStatus.APPROVED, actorId, retryNote);
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<OnboardingRequest> findByEmail(String email) {
        log.debug("이메일로 온보딩 요청 조회: email={}", email);
        return repository.findByRequestedByAndIsDeletedFalseOrderByCreatedAtDesc(email);
    }
    
    @Override
    @Transactional(readOnly = true)
    public OnboardingRequest findByIdAndEmail(Long id, String email) {
        log.debug("ID와 이메일로 온보딩 요청 조회: id={}, email={}", id, email);
        OnboardingRequest request = repository.findByIdAndRequestedByAndIsDeletedFalse(id, email);
        if (request == null) {
            throw new IllegalArgumentException(OnboardingConstants.ERROR_ONBOARDING_REQUEST_NOT_FOUND);
        }
        return request;
    }
    
    @Override
    @Transactional(readOnly = true)
    public OnboardingService.EmailDuplicateCheckResult checkEmailDuplicate(String email) {
        // 온보딩 요청 단계에서 이메일 중복 확인
        // 
        // 핵심 원칙:
        // - tenant_id가 unique이므로, 같은 이메일로 여러 테넌트를 만들 수 있음
        // - 각 테넌트는 고유한 tenant_id를 가지므로 중복이 발생할 수 없음
        // - 따라서 contact_email 중복 체크는 불필요함
        // - 대기 중인 온보딩 요청 확인 (같은 이메일로 동시에 여러 요청하는 것 방지)
        // 
        // 멀티 테넌트 지원:
        // - 같은 이메일로 여러 테넌트에 User 계정을 가질 수 있음
        // - 이미 입점사에 일반 계정이 있어도 새로운 테넌트를 온보딩할 수 있음
        // - 로그인 시 멀티 테넌트 사용자 감지 및 테넌트 선택 화면 표시
        log.info("이메일 중복 확인 (온보딩 요청 단계): email={}", email);
        
        if (email == null || email.trim().isEmpty()) {
            log.warn("이메일이 비어있음: email={}", email);
            return new OnboardingService.EmailDuplicateCheckResult(
                false, true, "이메일을 입력해주세요.", null
            );
        }
        
        String normalizedEmail = email.trim().toLowerCase();
        
        // 대기 중인 온보딩 요청 확인 (PENDING, IN_REVIEW, ON_HOLD 상태 포함)
        // 같은 이메일로 이미 온보딩 요청이 진행 중이면 중복
        // (tenant_id가 unique이므로 contact_email 중복 체크 불필요)
        List<OnboardingRequest> pendingRequests = repository.findPendingByRequestedByIgnoreCase(normalizedEmail);
        log.info("대기 중인 온보딩 요청 확인: pendingCount={}, email={}", pendingRequests.size(), normalizedEmail);
        
        if (!pendingRequests.isEmpty()) {
            // 가장 최근 요청의 상태 확인
            OnboardingRequest latestRequest = pendingRequests.get(0);
            OnboardingStatus status = latestRequest.getStatus();
            
            String statusMessage;
            String statusName;
            if (status == OnboardingStatus.PENDING) {
                statusMessage = "승인 대기 중입니다.";
                statusName = "PENDING";
            } else if (status == OnboardingStatus.IN_REVIEW) {
                statusMessage = "검토 중입니다.";
                statusName = "IN_REVIEW";
            } else if (status == OnboardingStatus.ON_HOLD) {
                statusMessage = "보류 중입니다.";
                statusName = "ON_HOLD";
            } else {
                statusMessage = "처리 중입니다.";
                statusName = status.name();
            }
            
            log.info("이메일 중복: 대기 중인 온보딩 요청 존재 - email={}, status={}, message={}", 
                normalizedEmail, status, statusMessage);
            
            return new OnboardingService.EmailDuplicateCheckResult(
                true, false, statusMessage, statusName
            );
        }
        
        log.info("이메일 사용 가능 (온보딩 요청 단계): email={}", normalizedEmail);
        return new OnboardingService.EmailDuplicateCheckResult(
            false, true, "사용 가능한 이메일입니다.", null
        );
    }
    
    
    /**
     * 테넌트 생성 시점에만 중복 체크 (온보딩 승인 시 호출)
     * 
     * 멀티 테넌트 지원 원칙:
     * - 같은 이메일로 여러 테넌트를 생성할 수 있음
     * - 테넌트의 contact_email은 연락처 정보일 뿐이며, 중복 허용
     * - 이 메서드는 더 이상 사용하지 않음 (항상 false 반환)
     * 
     * @deprecated 멀티 테넌트 지원으로 인해 이메일 중복 체크 불필요
     */
    @Deprecated
    @Transactional(readOnly = true)
    private boolean isEmailDuplicateForTenantCreation(String email) {
        log.info("테넌트 생성 시점 이메일 중복 확인 (deprecated): email={}", email);
        log.info("멀티 테넌트 지원으로 인해 이메일 중복 체크 불필요 - 항상 false 반환");
        return false; // 멀티 테넌트 지원으로 항상 false 반환
    }
    
    /**
     * 온보딩 승인 후 테넌트 관리자 계정 생성
     * checklistJson에서 adminPassword를 가져와서 ADMIN 역할의 사용자 계정 생성
     */
    private void createTenantAdminAccount(OnboardingRequest request, String tenantId) {
        if (request.getChecklistJson() == null || request.getChecklistJson().isEmpty()) {
            log.debug("checklistJson이 없어 관리자 계정 생성 스킵: requestId={}", request.getId());
            return;
        }
        
        try {
            // checklistJson 파싱
            Map<String, Object> checklist = objectMapper.readValue(
                request.getChecklistJson(), 
                new TypeReference<Map<String, Object>>() {}
            );
            
            String adminPassword = (String) checklist.get("adminPassword");
            if (adminPassword == null || adminPassword.trim().isEmpty()) {
                log.warn("checklistJson에 adminPassword가 없어 관리자 계정 생성 스킵: requestId={}", request.getId());
                return;
            }
            
            String requestedBy = request.getRequestedBy();
            if (requestedBy == null || requestedBy.trim().isEmpty()) {
                log.warn("requestedBy가 없어 관리자 계정 생성 불가: requestId={}", request.getId());
                return;
            }
            
            String normalizedEmail = requestedBy.trim().toLowerCase();
            
            // 같은 테넌트에 이미 ADMIN 역할의 사용자가 있는지 확인
            // 주의: 다른 테넌트에 계정이 있어도 상관없음 (멀티 테넌트 지원)
            List<User> existingAdmins = userRepository.findAllByEmail(normalizedEmail).stream()
                .filter(user -> user.getTenantId() != null && tenantId.equals(user.getTenantId()))
                .filter(user -> user.getRole() == UserRole.ADMIN)
                .filter(user -> user.getIsDeleted() == null || !user.getIsDeleted())
                .toList();
            
            if (!existingAdmins.isEmpty()) {
                log.info("이미 해당 테넌트에 ADMIN 계정이 존재: tenantId={}, email={}, existingAdminCount={}", 
                    tenantId, requestedBy, existingAdmins.size());
                return;
            }
            
            // 다른 테넌트에 계정이 있는 경우 로그만 남기고 계정 생성 진행
            List<User> otherTenantUsers = userRepository.findAllByEmail(normalizedEmail).stream()
                .filter(user -> user.getTenantId() != null && !user.getTenantId().trim().isEmpty())
                .filter(user -> !tenantId.equals(user.getTenantId()))
                .filter(user -> user.getIsDeleted() == null || !user.getIsDeleted())
                .toList();
            
            if (!otherTenantUsers.isEmpty()) {
                log.info("다른 테넌트에 계정이 있지만 새 테넌트 관리자 계정 생성 진행: email={}, otherTenantIds={}, newTenantId={}", 
                    normalizedEmail, 
                    otherTenantUsers.stream().map(User::getTenantId).toList(), 
                    tenantId);
            }
            
            // 사용자명 생성 (이메일의 로컬 파트 사용)
            String username = requestedBy.substring(0, requestedBy.indexOf('@'));
            
            // 관리자 계정 생성
            User adminUser = new User();
            adminUser.setTenantId(tenantId);
            adminUser.setEmail(requestedBy.trim().toLowerCase());
            adminUser.setUsername(username);
            adminUser.setPassword(passwordEncoder.encode(adminPassword));
            adminUser.setName(request.getTenantName() + " 관리자");
            adminUser.setRole(UserRole.ADMIN);
            adminUser.setIsActive(true);
            adminUser.setIsEmailVerified(true);  // 온보딩 시 이메일 인증 완료
            adminUser.setIsSocialAccount(false);
            
            adminUser = userRepository.save(adminUser);
            
            log.info("테넌트 관리자 계정 생성 완료: tenantId={}, email={}, userId={}", 
                tenantId, requestedBy, adminUser.getId());
                
        } catch (JsonProcessingException e) {
            log.error("checklistJson 파싱 실패: requestId={}, error={}", 
                request.getId(), e.getMessage(), e);
            throw new RuntimeException("checklistJson 파싱 실패", e);
        } catch (Exception e) {
            log.error("테넌트 관리자 계정 생성 중 오류 발생: requestId={}, tenantId={}, error={}", 
                request.getId(), tenantId, e.getMessage(), e);
            throw e;
        }
    }
    
    /**
     * 온보딩 승인 후 구독의 tenant_id 업데이트
     * checklistJson에서 subscriptionId를 찾아서 생성된 tenant_id로 업데이트
     */
    private void updateSubscriptionTenantId(OnboardingRequest request) {
        if (request.getChecklistJson() == null || request.getChecklistJson().isEmpty()) {
            log.debug("checklistJson이 없어 구독 업데이트 스킵: requestId={}", request.getId());
            return;
        }
        
        try {
            // checklistJson 파싱
            Map<String, Object> checklist = objectMapper.readValue(
                request.getChecklistJson(), 
                new TypeReference<Map<String, Object>>() {}
            );
            
            String subscriptionId = (String) checklist.get("subscriptionId");
            if (subscriptionId == null || subscriptionId.isEmpty()) {
                log.debug("checklistJson에 subscriptionId가 없어 구독 업데이트 스킵: requestId={}", request.getId());
                return;
            }
            
            // 생성된 tenant_id 가져오기 (승인 프로세스에서 생성됨)
            String tenantId = request.getTenantId();
            if (tenantId == null || tenantId.isEmpty()) {
                log.warn("tenant_id가 없어 구독 업데이트 불가: requestId={}, subscriptionId={}", 
                    request.getId(), subscriptionId);
                return;
            }
            
            // 구독 조회 및 tenant_id 업데이트
            subscriptionRepository.findBySubscriptionId(subscriptionId)
                .ifPresentOrElse(
                    subscription -> {
                        subscription.setTenantId(tenantId);
                        subscriptionRepository.save(subscription);
                        log.info("구독 tenant_id 업데이트 완료: subscriptionId={}, tenantId={}", 
                            subscriptionId, tenantId);
                    },
                    () -> log.warn("구독을 찾을 수 없음: subscriptionId={}", subscriptionId)
                );
                
        } catch (JsonProcessingException e) {
            log.error("checklistJson 파싱 실패: requestId={}, error={}", 
                request.getId(), e.getMessage(), e);
            throw new RuntimeException("checklistJson 파싱 실패", e);
        } catch (Exception e) {
            log.error("구독 tenant_id 업데이트 중 오류 발생: requestId={}, error={}", 
                request.getId(), e.getMessage(), e);
            throw e;
        }
    }
    
    /**
     * 기본 업종 조회 (공통 코드에서 동적으로 가져옴)
     * businessType이 null이거나 비어있으면 공통 코드에서 기본 업종을 조회
     * 공통 코드 조회 실패 시 상수에 정의된 기본값 사용
     * 
     * @param businessType 요청된 업종 (null 가능)
     * @return 업종 코드 값
     */
    @Transactional(readOnly = true)
    private String getDefaultBusinessType(String businessType) {
        // businessType이 있으면 그대로 사용
        if (businessType != null && !businessType.trim().isEmpty()) {
            return businessType.trim();
        }
        
        // 공통 코드에서 기본 업종 조회 시도
        try {
            List<CommonCode> businessTypes = commonCodeService
                .getActiveCommonCodesByGroup(OnboardingConstants.CODE_GROUP_BUSINESS_TYPE);
            
            if (businessTypes != null && !businessTypes.isEmpty()) {
                // 기본 업종 찾기 (DEFAULT 값이 있으면 사용, 없으면 첫 번째)
                Optional<CommonCode> defaultType = businessTypes.stream()
                    .filter(code -> OnboardingConstants.CODE_VALUE_DEFAULT_BUSINESS_TYPE
                        .equals(code.getCodeValue()))
                    .findFirst();
                
                if (defaultType.isPresent()) {
                    log.debug("공통 코드에서 기본 업종 조회 성공: {}", defaultType.get().getCodeValue());
                    return defaultType.get().getCodeValue();
                } else {
                    // DEFAULT가 없으면 첫 번째 활성 코드 사용
                    log.debug("공통 코드에서 첫 번째 업종 사용: {}", businessTypes.get(0).getCodeValue());
                    return businessTypes.get(0).getCodeValue();
                }
            }
        } catch (Exception e) {
            log.warn("공통 코드에서 업종 조회 실패, 기본값 사용: {}", e.getMessage());
        }
        
        // 공통 코드 조회 실패 시 상수에 정의된 기본값 사용
        log.debug("기본 업종 사용 (상수): {}", OnboardingConstants.CODE_VALUE_DEFAULT_BUSINESS_TYPE);
        return OnboardingConstants.CODE_VALUE_DEFAULT_BUSINESS_TYPE;
    }
    
    /**
     * 기본 위험도 조회 (공통 코드에서 동적으로 가져옴)
     * 공통 코드 조회 실패 시 상수에 정의된 기본값 사용
     * 
     * @return 기본 위험도 (RiskLevel Enum)
     */
    @Transactional(readOnly = true)
    private RiskLevel getDefaultRiskLevel() {
        // 공통 코드에서 기본 위험도 조회 시도
        try {
            List<CommonCode> riskLevels = commonCodeService
                .getActiveCommonCodesByGroup(OnboardingConstants.CODE_GROUP_RISK_LEVEL);
            
            if (riskLevels != null && !riskLevels.isEmpty()) {
                // 기본 위험도 찾기 (LOW 값이 있으면 사용, 없으면 첫 번째)
                Optional<CommonCode> lowRisk = riskLevels.stream()
                    .filter(code -> OnboardingConstants.CODE_VALUE_LOW
                        .equals(code.getCodeValue()))
                    .findFirst();
                
                if (lowRisk.isPresent()) {
                    try {
                        RiskLevel riskLevel = RiskLevel.valueOf(lowRisk.get().getCodeValue());
                        log.debug("공통 코드에서 기본 위험도 조회 성공: {}", riskLevel);
                        return riskLevel;
                    } catch (IllegalArgumentException e) {
                        log.warn("공통 코드 값이 RiskLevel Enum과 일치하지 않음: {}, 기본값 사용", 
                            lowRisk.get().getCodeValue());
                    }
                } else {
                    // LOW가 없으면 첫 번째 활성 코드 사용
                    try {
                        RiskLevel riskLevel = RiskLevel.valueOf(riskLevels.get(0).getCodeValue());
                        log.debug("공통 코드에서 첫 번째 위험도 사용: {}", riskLevel);
                        return riskLevel;
                    } catch (IllegalArgumentException e) {
                        log.warn("공통 코드 값이 RiskLevel Enum과 일치하지 않음: {}, 기본값 사용", 
                            riskLevels.get(0).getCodeValue());
                    }
                }
            }
        } catch (Exception e) {
            log.warn("공통 코드에서 위험도 조회 실패, 기본값 사용: {}", e.getMessage());
        }
        
        // 공통 코드 조회 실패 시 상수에 정의된 기본값 사용
        log.debug("기본 위험도 사용 (상수): {}", RiskLevel.LOW);
        return RiskLevel.LOW;
    }
    
    /**
     * 온보딩 요청에서 지역 코드 추출
     * checklistJson에서 주소 정보를 추출하여 지역 코드 생성
     * 
     * @param request 온보딩 요청
     * @return 지역 코드 (예: "seoul", "busan", "tokyo", "newyork")
     */
    private String extractRegionCodeFromRequest(OnboardingRequest request) {
        try {
            if (request.getChecklistJson() == null || request.getChecklistJson().isEmpty()) {
                return null;
            }
            
            // checklistJson 파싱
            Map<String, Object> checklist = objectMapper.readValue(
                request.getChecklistJson(), 
                new TypeReference<Map<String, Object>>() {}
            );
            
            // 주소 정보 추출 (address, postalCode 등)
            String address = (String) checklist.get("address");
            String postalCode = (String) checklist.get("postalCode");
            String region = (String) checklist.get("region"); // 직접 지역 코드가 있는 경우
            
            // 직접 지역 코드가 있으면 사용
            if (region != null && !region.trim().isEmpty()) {
                return region.trim();
            }
            
            // 주소에서 지역 추출
            if (address != null && !address.trim().isEmpty()) {
                return extractRegionFromAddress(address);
            }
            
            // 우편번호에서 지역 추출 (한국 우편번호 기준)
            if (postalCode != null && !postalCode.trim().isEmpty()) {
                return extractRegionFromPostalCode(postalCode);
            }
            
            return null;
            
        } catch (Exception e) {
            log.warn("지역 코드 추출 실패: requestId={}, error={}", 
                request.getId(), e.getMessage());
            return null;
        }
    }
    
    /**
     * 주소에서 지역 코드 추출
     * 
     * @param address 주소 문자열
     * @return 지역 코드
     */
    private String extractRegionFromAddress(String address) {
        if (address == null || address.trim().isEmpty()) {
            return null;
        }
        
        String normalizedAddress = address.trim().toLowerCase();
        
        // 한국 지역
        if (normalizedAddress.contains("서울") || normalizedAddress.contains("seoul")) {
            return "seoul";
        } else if (normalizedAddress.contains("부산") || normalizedAddress.contains("busan")) {
            return "busan";
        } else if (normalizedAddress.contains("인천") || normalizedAddress.contains("incheon")) {
            return "incheon";
        } else if (normalizedAddress.contains("대구") || normalizedAddress.contains("daegu")) {
            return "daegu";
        } else if (normalizedAddress.contains("대전") || normalizedAddress.contains("daejeon")) {
            return "daejeon";
        } else if (normalizedAddress.contains("광주") || normalizedAddress.contains("gwangju")) {
            return "gwangju";
        } else if (normalizedAddress.contains("울산") || normalizedAddress.contains("ulsan")) {
            return "ulsan";
        } else if (normalizedAddress.contains("세종") || normalizedAddress.contains("sejong")) {
            return "sejong";
        } else if (normalizedAddress.contains("경기") || normalizedAddress.contains("gyeonggi")) {
            return "gyeonggi";
        } else if (normalizedAddress.contains("강원") || normalizedAddress.contains("gangwon")) {
            return "gangwon";
        } else if (normalizedAddress.contains("충북") || normalizedAddress.contains("chungbuk")) {
            return "chungbuk";
        } else if (normalizedAddress.contains("충남") || normalizedAddress.contains("chungnam")) {
            return "chungnam";
        } else if (normalizedAddress.contains("전북") || normalizedAddress.contains("jeonbuk")) {
            return "jeonbuk";
        } else if (normalizedAddress.contains("전남") || normalizedAddress.contains("jeonnam")) {
            return "jeonnam";
        } else if (normalizedAddress.contains("경북") || normalizedAddress.contains("gyeongbuk")) {
            return "gyeongbuk";
        } else if (normalizedAddress.contains("경남") || normalizedAddress.contains("gyeongnam")) {
            return "gyeongnam";
        } else if (normalizedAddress.contains("제주") || normalizedAddress.contains("jeju")) {
            return "jeju";
        }
        
        // 해외 지역 (주요 도시)
        else if (normalizedAddress.contains("tokyo") || normalizedAddress.contains("도쿄")) {
            return "tokyo";
        } else if (normalizedAddress.contains("osaka") || normalizedAddress.contains("오사카")) {
            return "osaka";
        } else if (normalizedAddress.contains("new york") || normalizedAddress.contains("뉴욕")) {
            return "newyork";
        } else if (normalizedAddress.contains("los angeles") || normalizedAddress.contains("la") || normalizedAddress.contains("로스앤젤레스")) {
            return "losangeles";
        } else if (normalizedAddress.contains("london") || normalizedAddress.contains("런던")) {
            return "london";
        } else if (normalizedAddress.contains("paris") || normalizedAddress.contains("파리")) {
            return "paris";
        } else if (normalizedAddress.contains("singapore") || normalizedAddress.contains("싱가포르")) {
            return "singapore";
        } else if (normalizedAddress.contains("hong kong") || normalizedAddress.contains("홍콩")) {
            return "hongkong";
        } else if (normalizedAddress.contains("beijing") || normalizedAddress.contains("베이징") || normalizedAddress.contains("북경")) {
            return "beijing";
        } else if (normalizedAddress.contains("shanghai") || normalizedAddress.contains("상하이")) {
            return "shanghai";
        } else if (normalizedAddress.contains("sydney") || normalizedAddress.contains("시드니")) {
            return "sydney";
        } else if (normalizedAddress.contains("melbourne") || normalizedAddress.contains("멜버른")) {
            return "melbourne";
        }
        
        // 국가 코드 추출 (해외 지역)
        else if (normalizedAddress.contains("japan") || normalizedAddress.contains("일본")) {
            return "japan";
        } else if (normalizedAddress.contains("usa") || normalizedAddress.contains("united states") || normalizedAddress.contains("미국")) {
            return "usa";
        } else if (normalizedAddress.contains("uk") || normalizedAddress.contains("united kingdom") || normalizedAddress.contains("영국")) {
            return "uk";
        } else if (normalizedAddress.contains("france") || normalizedAddress.contains("프랑스")) {
            return "france";
        } else if (normalizedAddress.contains("china") || normalizedAddress.contains("중국")) {
            return "china";
        } else if (normalizedAddress.contains("australia") || normalizedAddress.contains("호주") || normalizedAddress.contains("오스트레일리아")) {
            return "australia";
        }
        
        return null;
    }
    
    /**
     * 우편번호에서 지역 코드 추출 (한국 우편번호 기준)
     * 
     * @param postalCode 우편번호
     * @return 지역 코드
     */
    private String extractRegionFromPostalCode(String postalCode) {
        if (postalCode == null || postalCode.trim().isEmpty()) {
            return null;
        }
        
        // 한국 우편번호는 5자리 숫자 (예: 06000 = 서울)
        String code = postalCode.trim().replaceAll("[^0-9]", "");
        if (code.length() < 2) {
            return null;
        }
        
        // 우편번호 앞 2자리로 지역 판단
        String prefix = code.substring(0, 2);
        int prefixNum = Integer.parseInt(prefix);
        
        // 서울: 01-09, 10-13
        if (prefixNum >= 1 && prefixNum <= 13) {
            return "seoul";
        }
        // 부산: 48-49
        else if (prefixNum >= 48 && prefixNum <= 49) {
            return "busan";
        }
        // 대구: 42-43
        else if (prefixNum >= 42 && prefixNum <= 43) {
            return "daegu";
        }
        // 인천: 22-23
        else if (prefixNum >= 22 && prefixNum <= 23) {
            return "incheon";
        }
        // 광주: 61-62
        else if (prefixNum >= 61 && prefixNum <= 62) {
            return "gwangju";
        }
        // 대전: 30-34
        else if (prefixNum >= 30 && prefixNum <= 34) {
            return "daejeon";
        }
        // 울산: 44-45
        else if (prefixNum >= 44 && prefixNum <= 45) {
            return "ulsan";
        }
        // 세종: 30
        else if (prefixNum == 30) {
            return "sejong";
        }
        // 경기: 10-20, 40-47
        else if ((prefixNum >= 10 && prefixNum <= 20) || (prefixNum >= 40 && prefixNum <= 47)) {
            return "gyeonggi";
        }
        // 강원: 24-25
        else if (prefixNum >= 24 && prefixNum <= 25) {
            return "gangwon";
        }
        // 충북: 28-29
        else if (prefixNum >= 28 && prefixNum <= 29) {
            return "chungbuk";
        }
        // 충남: 31-32
        else if (prefixNum >= 31 && prefixNum <= 32) {
            return "chungnam";
        }
        // 전북: 54-56
        else if (prefixNum >= 54 && prefixNum <= 56) {
            return "jeonbuk";
        }
        // 전남: 57-59
        else if (prefixNum >= 57 && prefixNum <= 59) {
            return "jeonnam";
        }
        // 경북: 36-39
        else if (prefixNum >= 36 && prefixNum <= 39) {
            return "gyeongbuk";
        }
        // 경남: 50-53
        else if (prefixNum >= 50 && prefixNum <= 53) {
            return "gyeongnam";
        }
        // 제주: 63-64
        else if (prefixNum >= 63 && prefixNum <= 64) {
            return "jeju";
        }
        
        return null;
    }
}

