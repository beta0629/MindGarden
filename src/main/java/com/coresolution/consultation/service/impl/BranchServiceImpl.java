package com.coresolution.consultation.service.impl;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;
import com.coresolution.consultation.constant.UserRole;
import com.coresolution.consultation.dto.BranchCreateRequest;
import com.coresolution.consultation.dto.BranchResponse;
import com.coresolution.consultation.dto.BranchUpdateRequest;
import com.coresolution.consultation.entity.Branch;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.exception.EntityNotFoundException;
import com.coresolution.consultation.exception.ValidationException;
import com.coresolution.consultation.repository.BaseRepository;
import com.coresolution.consultation.repository.BranchRepository;
import com.coresolution.consultation.repository.UserRepository;
import com.coresolution.consultation.service.BranchService;
import com.coresolution.core.context.TenantContextHolder;
import com.coresolution.core.security.TenantAccessControlService;
import com.coresolution.core.service.impl.BaseTenantEntityServiceImpl;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import lombok.extern.slf4j.Slf4j;
import java.time.LocalDateTime;

 /**
 * 지점 서비스 구현체
 /**
 * BaseTenantEntityServiceImpl을 상속하여 테넌트 필터링 및 접근 제어 지원
 /**
 * 
 /**
 * @author CoreSolution
 /**
 * @version 2.0.0
 /**
 * @since 2025-09-12
 */
@Slf4j
@Service
@Transactional
public class BranchServiceImpl extends BaseTenantEntityServiceImpl<Branch, Long> 
        implements BranchService {
    
    private final BranchRepository branchRepository;
    private final UserRepository userRepository;
    
    public BranchServiceImpl(
            BranchRepository branchRepository,
            TenantAccessControlService accessControlService,
            UserRepository userRepository) {
        super(branchRepository, accessControlService);
        this.branchRepository = branchRepository;
        this.userRepository = userRepository;
    }
    
    
    @Override
    protected Optional<Branch> findEntityById(Long id) {
        return branchRepository.findById(id);
    }
    
    @Override
    protected List<Branch> findEntitiesByTenantAndBranch(String tenantId, Long branchId) {
        if (branchId != null) {
            return branchRepository.findAllByTenantIdAndBranchId(tenantId, branchId);
        } else {
            return branchRepository.findAllByTenantId(tenantId);
        }
    }
    
    
    @Override
    public BaseRepository<Branch, Long> getRepository() {
        return branchRepository;
    }
    
    
    @Override
    public BranchResponse createBranch(BranchCreateRequest request) {
        log.info("지점 생성 요청: {}", request.getBranchName());
        
        validateBranchCreation(request);
        
        Branch parentBranch = null;
        if (request.getParentBranchId() != null) {
            parentBranch = findActiveByIdOrThrow(request.getParentBranchId());
        }
        
        User manager = null;
        if (request.getManagerId() != null) {
            manager = userRepository.findById(request.getManagerId())
                    .orElseThrow(() -> new EntityNotFoundException("지점장을 찾을 수 없습니다."));
        }
        
        Branch branch = Branch.builder()
                .branchCode(request.getBranchCode())
                .branchName(request.getBranchName())
                .branchType(request.getBranchType())
                .branchStatus(Branch.BranchStatus.PLANNING)
                .postalCode(request.getPostalCode())
                .address(request.getAddress())
                .addressDetail(request.getAddressDetail())
                .phoneNumber(request.getPhoneNumber())
                .faxNumber(request.getFaxNumber())
                .email(request.getEmail())
                .openingDate(request.getOpeningDate())
                .operatingStartTime(request.getOperatingStartTime())
                .operatingEndTime(request.getOperatingEndTime())
                .closedDays(request.getClosedDays())
                .manager(manager)
                .parentBranch(parentBranch)
                .maxConsultants(request.getMaxConsultants())
                .maxClients(request.getMaxClients())
                .description(request.getDescription())
                .logoUrl(request.getLogoUrl())
                .websiteUrl(request.getWebsiteUrl())
                .build();
        
        String tenantId = TenantContextHolder.getTenantId();
        if (tenantId != null) {
            branch = create(tenantId, branch);
        } else {
            branch = save(branch);
        }
        log.info("지점 생성 완료: ID={}, 코드={}", branch.getId(), branch.getBranchCode());
        
        return convertToResponse(branch);
    }
    
    @Override
    public BranchResponse updateBranch(Long branchId, BranchUpdateRequest request) {
        log.info("지점 수정 요청: ID={}", branchId);
        
        Branch branch = findActiveByIdOrThrow(branchId);
        
        validateBranchUpdate(branch, request);
        
        if (request.getBranchName() != null) {
            branch.setBranchName(request.getBranchName());
        }
        if (request.getBranchType() != null) {
            branch.setBranchType(request.getBranchType());
        }
        if (request.getPostalCode() != null) {
            branch.setPostalCode(request.getPostalCode());
        }
        if (request.getAddress() != null) {
            branch.setAddress(request.getAddress());
        }
        if (request.getAddressDetail() != null) {
            branch.setAddressDetail(request.getAddressDetail());
        }
        if (request.getPhoneNumber() != null) {
            branch.setPhoneNumber(request.getPhoneNumber());
        }
        if (request.getFaxNumber() != null) {
            branch.setFaxNumber(request.getFaxNumber());
        }
        if (request.getEmail() != null) {
            branch.setEmail(request.getEmail());
        }
        if (request.getOperatingStartTime() != null) {
            branch.setOperatingStartTime(request.getOperatingStartTime());
        }
        if (request.getOperatingEndTime() != null) {
            branch.setOperatingEndTime(request.getOperatingEndTime());
        }
        if (request.getClosedDays() != null) {
            branch.setClosedDays(request.getClosedDays());
        }
        if (request.getMaxConsultants() != null) {
            branch.setMaxConsultants(request.getMaxConsultants());
        }
        if (request.getMaxClients() != null) {
            branch.setMaxClients(request.getMaxClients());
        }
        if (request.getDescription() != null) {
            branch.setDescription(request.getDescription());
        }
        if (request.getLogoUrl() != null) {
            branch.setLogoUrl(request.getLogoUrl());
        }
        if (request.getWebsiteUrl() != null) {
            branch.setWebsiteUrl(request.getWebsiteUrl());
        }
        
        if (request.getManagerId() != null) {
            User manager = userRepository.findById(request.getManagerId())
                    .orElseThrow(() -> new EntityNotFoundException("지점장을 찾을 수 없습니다."));
            branch.setManager(manager);
        }
        
        String tenantId = TenantContextHolder.getTenantId();
        if (tenantId != null && branch.getTenantId() != null) {
            branch = update(tenantId, branch);
        } else {
            branch = save(branch);
        }
        log.info("지점 수정 완료: ID={}", branch.getId());
        
        return convertToResponse(branch);
    }
    
    @Override
    @Transactional(readOnly = true)
    public BranchResponse getBranchResponse(Long branchId) {
        Branch branch = findActiveByIdOrThrow(branchId);
        return convertToResponse(branch);
    }
    
    @Override
    /**
     * 지점 코드로 지점 조회
     * 표준화 2025-12-06: Deprecated - branchCode는 더 이상 사용하지 않음
     * 대신 getBranchById() 또는 getAllActiveBranches()를 사용하세요.
     */
    @Deprecated
    @Transactional(readOnly = true)
    public Branch getBranchByCode(String branchCode) {
        log.warn("⚠️ Deprecated 메서드 호출: getBranchByCode - branchCode는 더 이상 사용하지 않음. branchCode={}", branchCode);
        // 표준화 2025-12-06: branchCode는 레거시 호환용으로만 유지
        return branchRepository.findByBranchCodeAndIsDeletedFalse(branchCode)
                .orElseThrow(() -> new EntityNotFoundException("지점을 찾을 수 없습니다: " + branchCode));
    }
    
    
    @Override
    @Transactional(readOnly = true)
    public List<BranchResponse> getAllActiveBranches() {
        List<Branch> branches = branchRepository.findByIsDeletedFalseOrderByBranchName();
        return branches.stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<BranchResponse> getBranchesByType(Branch.BranchType type) {
        List<Branch> branches = branchRepository.findByBranchTypeAndIsDeletedFalseOrderByBranchName(type);
        return branches.stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<BranchResponse> getBranchesByStatus(Branch.BranchStatus status) {
        List<Branch> branches = branchRepository.findByBranchStatusAndIsDeletedFalseOrderByBranchName(status);
        return branches.stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<BranchResponse> getSubBranches(Long parentBranchId) {
        Branch parentBranch = findActiveByIdOrThrow(parentBranchId);
        List<Branch> subBranches = branchRepository.findByParentBranchAndIsDeletedFalseOrderByBranchName(parentBranch);
        return subBranches.stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<BranchResponse> getMainBranches() {
        List<Branch> mainBranches = branchRepository.findByParentBranchIsNullAndIsDeletedFalseOrderByBranchName();
        return mainBranches.stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<BranchResponse> searchBranches(String keyword) {
        List<Branch> branches = branchRepository.searchByKeyword(keyword);
        return branches.stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());
    }
    
    @Override
    @Transactional(readOnly = true)
    public Page<BranchResponse> getBranchesWithPaging(Pageable pageable) {
        Page<Branch> branchPage = branchRepository.findByIsDeletedFalseOrderByCreatedAtDesc(pageable);
        return branchPage.map(this::convertToResponse);
    }
    
    @Override
    @Transactional(readOnly = true)
    public Page<BranchResponse> searchBranchesWithPaging(String keyword, Pageable pageable) {
        Page<Branch> branchPage = branchRepository.searchByKeyword(keyword, pageable);
        return branchPage.map(this::convertToResponse);
    }
    
    
    @Override
    public void assignManager(Long branchId, Long managerId) {
        log.info("지점장 지정: 지점 ID={}, 지점장 ID={}", branchId, managerId);
        
        Branch branch = findActiveByIdOrThrow(branchId);
        User manager = userRepository.findById(managerId)
                .orElseThrow(() -> new EntityNotFoundException("지점장을 찾을 수 없습니다."));
        
        List<Branch> existingManagedBranches = branchRepository.findByManagerAndIsDeletedFalse(manager);
        if (!existingManagedBranches.isEmpty()) {
            log.warn("이미 다른 지점을 관리하는 지점장입니다: {}", manager.getUserId());
        }
        
        branch.setManager(manager);
        save(branch);
        
        log.info("지점장 지정 완료: 지점={}, 지점장={}", branch.getBranchName(), manager.getUserId());
    }
    
    @Override
    public void removeManager(Long branchId) {
        log.info("지점장 해제: 지점 ID={}", branchId);
        
        Branch branch = findActiveByIdOrThrow(branchId);
        branch.setManager(null);
        save(branch);
        
        log.info("지점장 해제 완료: 지점={}", branch.getBranchName());
    }
    
    @Override
    public void changeBranchStatus(Long branchId, Branch.BranchStatus newStatus) {
        log.info("지점 상태 변경: 지점 ID={}, 새 상태={}", branchId, newStatus);
        
        Branch branch = findActiveByIdOrThrow(branchId);
        Branch.BranchStatus oldStatus = branch.getBranchStatus();
        
        branch.setBranchStatus(newStatus);
        
        // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. CommonCodeService 사용
        if (newStatus == Branch.BranchStatus.ACTIVE && branch.getOpeningDate() == null) {
            branch.setOpeningDate(LocalDate.now());
        // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. CommonCodeService 사용
        } else if (newStatus == Branch.BranchStatus.CLOSED) {
            branch.setClosingDate(LocalDate.now());
        }
        
        save(branch);
        
        log.info("지점 상태 변경 완료: 지점={}, {} -> {}", 
                branch.getBranchName(), oldStatus, newStatus);
    }
    
    @Override
    public void activateBranch(Long branchId) {
        // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. CommonCodeService 사용
        changeBranchStatus(branchId, Branch.BranchStatus.ACTIVE);
    }
    
    @Override
    public void deactivateBranch(Long branchId) {
        // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. CommonCodeService 사용
        changeBranchStatus(branchId, Branch.BranchStatus.SUSPENDED);
    }
    
    @Override
    public void closeBranch(Long branchId) {
        // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. CommonCodeService 사용
        changeBranchStatus(branchId, Branch.BranchStatus.CLOSED);
    }
    
    
    @Override
    public void assignConsultantToBranch(Long branchId, Long consultantId) {
        log.info("상담사 지점 할당: 지점 ID={}, 상담사 ID={}", branchId, consultantId);
        
        Branch branch = findActiveByIdOrThrow(branchId);
        User consultant = userRepository.findById(consultantId)
                .orElseThrow(() -> new EntityNotFoundException("상담사를 찾을 수 없습니다."));
        
        if (!isConsultantCapacityAvailable(branchId)) {
            throw new ValidationException("지점의 상담사 수용 인원을 초과했습니다.");
        }
        
        consultant.setBranch(branch);
        userRepository.save(consultant);
        
        log.info("상담사 지점 할당 완료: 지점={}, 상담사={}", 
                branch.getBranchName(), consultant.getUserId());
    }
    
    @Override
    public void assignClientToBranch(Long branchId, Long clientId) {
        log.info("내담자 지점 할당: 지점 ID={}, 내담자 ID={}", branchId, clientId);
        
        Branch branch = findActiveByIdOrThrow(branchId);
        User client = userRepository.findById(clientId)
                .orElseThrow(() -> new EntityNotFoundException("내담자를 찾을 수 없습니다."));
        
        if (!isClientCapacityAvailable(branchId)) {
            throw new ValidationException("지점의 내담자 수용 인원을 초과했습니다.");
        }
        
        client.setBranch(branch);
        userRepository.save(client);
        
        log.info("내담자 지점 할당 완료: 지점={}, 내담자={}", 
                branch.getBranchName(), client.getUserId());
    }
    
    @Override
    public void removeUserFromBranch(Long userId) {
        log.info("사용자 지점 제거: 사용자 ID={}", userId);
        
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("사용자를 찾을 수 없습니다."));
        
        String branchName = user.getBranch() != null ? user.getBranch().getBranchName() : "없음";
        user.setBranch(null);
        userRepository.save(user);
        
        log.info("사용자 지점 제거 완료: 사용자={}, 이전 지점={}", 
                user.getUserId(), branchName);
    }
    
    @Override
    public void transferUserBetweenBranches(Long userId, Long fromBranchId, Long toBranchId) {
        log.info("사용자 지점 이동: 사용자 ID={}, {} -> {}", userId, fromBranchId, toBranchId);
        
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("사용자를 찾을 수 없습니다."));
        
        Branch fromBranch = findActiveByIdOrThrow(fromBranchId);
        Branch toBranch = findActiveByIdOrThrow(toBranchId);
        
        if (user.getBranch() == null || !user.getBranch().getId().equals(fromBranchId)) {
            throw new ValidationException("사용자가 해당 지점에 소속되어 있지 않습니다.");
        }
        
        if (user.getRole() == com.coresolution.consultation.constant.UserRole.CONSULTANT && !isConsultantCapacityAvailable(toBranchId)) {
            throw new ValidationException("목표 지점의 상담사 수용 인원을 초과했습니다.");
        } else if (user.getRole() == com.coresolution.consultation.constant.UserRole.CLIENT && !isClientCapacityAvailable(toBranchId)) {
            throw new ValidationException("목표 지점의 내담자 수용 인원을 초과했습니다.");
        }
        
        user.setBranch(toBranch);
        userRepository.save(user);
        
        log.info("사용자 지점 이동 완료: 사용자={}, {} -> {}", 
                user.getUserId(), fromBranch.getBranchName(), toBranch.getBranchName());
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<User> getBranchConsultants(Long branchId) {
        String tenantId = TenantContextHolder.getTenantId();
        if (tenantId == null) {
            log.error("❌ tenantId가 설정되지 않았습니다");
            return new ArrayList<>();
        }
        Branch branch = findActiveByIdOrThrow(branchId);
        return userRepository.findByBranchAndRoleAndIsDeletedFalseOrderByUserId(
                tenantId, branch, UserRole.CONSULTANT);
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<User> getBranchClients(Long branchId) {
        String tenantId = TenantContextHolder.getTenantId();
        if (tenantId == null) {
            log.error("❌ tenantId가 설정되지 않았습니다");
            return new ArrayList<>();
        }
        Branch branch = findActiveByIdOrThrow(branchId);
        return userRepository.findByBranchAndRoleAndIsDeletedFalseOrderByUserId(
                tenantId, branch, UserRole.CLIENT);
    }
    
    
    @Override
    @Transactional(readOnly = true)
    public Map<String, Object> getBranchStatistics(Long branchId) {
        Branch branch = findActiveByIdOrThrow(branchId);
        
        Map<String, Object> statistics = new HashMap<>();
        statistics.put("branchId", branch.getId());
        statistics.put("branchName", branch.getBranchName());
        statistics.put("branchCode", branch.getBranchCode());
        statistics.put("branchType", branch.getBranchType());
        statistics.put("branchStatus", branch.getBranchStatus());
        
        List<User> consultants = getBranchConsultants(branchId);
        List<User> clients = getBranchClients(branchId);
        
        statistics.put("consultantCount", consultants.size());
        statistics.put("clientCount", clients.size());
        statistics.put("maxConsultants", branch.getMaxConsultants());
        statistics.put("maxClients", branch.getMaxClients());
        
        if (branch.getMaxConsultants() != null && branch.getMaxConsultants() > 0) {
            double consultantUtilization = (double) consultants.size() / branch.getMaxConsultants() * 100;
            statistics.put("consultantUtilization", Math.round(consultantUtilization * 100.0) / 100.0);
        }
        
        if (branch.getMaxClients() != null && branch.getMaxClients() > 0) {
            double clientUtilization = (double) clients.size() / branch.getMaxClients() * 100;
            statistics.put("clientUtilization", Math.round(clientUtilization * 100.0) / 100.0);
        }
        
        return statistics;
    }
    
    
    @Override
    @Transactional(readOnly = true)
    public Map<String, Integer> getConsultantCountByBranch() {
        List<Object[]> results = branchRepository.countConsultantsByBranch();
        Map<String, Integer> consultantCounts = new HashMap<>();
        
        for (Object[] result : results) {
            String branchName = (String) result[1];
            Long count = (Long) result[2];
            consultantCounts.put(branchName, count.intValue());
        }
        
        return consultantCounts;
    }
    
    @Override
    @Transactional(readOnly = true)
    public Map<String, Integer> getClientCountByBranch() {
        List<Object[]> results = branchRepository.countClientsByBranch();
        Map<String, Integer> clientCounts = new HashMap<>();
        
        for (Object[] result : results) {
            String branchName = (String) result[1];
            Long count = (Long) result[2];
            clientCounts.put(branchName, count.intValue());
        }
        
        return clientCounts;
    }
    
    @Override
    @Transactional(readOnly = true)
    public Map<Branch.BranchStatus, Long> getCountByStatus() {
        List<Object[]> results = branchRepository.countByBranchStatus();
        Map<Branch.BranchStatus, Long> statusCounts = new HashMap<>();
        
        for (Object[] result : results) {
            Branch.BranchStatus status = (Branch.BranchStatus) result[0];
            Long count = (Long) result[1];
            statusCounts.put(status, count);
        }
        
        return statusCounts;
    }
    
    @Override
    @Transactional(readOnly = true)
    public Map<Branch.BranchType, Long> getCountByType() {
        List<Object[]> results = branchRepository.countByBranchType();
        Map<Branch.BranchType, Long> typeCounts = new HashMap<>();
        
        for (Object[] result : results) {
            Branch.BranchType type = (Branch.BranchType) result[0];
            Long count = (Long) result[1];
            typeCounts.put(type, count);
        }
        
        return typeCounts;
    }
    
    
    /**
     * 지점 코드 중복 확인
     * 표준화 2025-12-06: Deprecated - branchCode는 더 이상 사용하지 않음
     */
    @Deprecated
    @Override
    @Transactional(readOnly = true)
    public boolean isBranchCodeDuplicate(String branchCode) {
        log.warn("⚠️ Deprecated 메서드 호출: isBranchCodeDuplicate - branchCode는 더 이상 사용하지 않음. branchCode={}", branchCode);
        // 표준화 2025-12-06: branchCode는 레거시 호환용으로만 유지
        return branchRepository.existsByBranchCodeAndIsDeletedFalse(branchCode);
    }
    
    /**
     * 지점 코드 중복 확인 (ID 제외)
     * 표준화 2025-12-06: Deprecated - branchCode는 더 이상 사용하지 않음
     */
    @Deprecated
    @Override
    @Transactional(readOnly = true)
    public boolean isBranchCodeDuplicate(String branchCode, Long excludeBranchId) {
        log.warn("⚠️ Deprecated 메서드 호출: isBranchCodeDuplicate - branchCode는 더 이상 사용하지 않음. branchCode={}, excludeBranchId={}", branchCode, excludeBranchId);
        // 표준화 2025-12-06: branchCode는 레거시 호환용으로만 유지
        return branchRepository.existsByBranchCodeAndIdNotAndIsDeletedFalse(branchCode, excludeBranchId);
    }
    
    @Override
    @Transactional(readOnly = true)
    public boolean isBranchNameDuplicate(String branchName, Long parentBranchId) {
        Branch parentBranch = parentBranchId != null ? findActiveByIdOrThrow(parentBranchId) : null;
        return branchRepository.existsByBranchNameAndParentBranchAndIsDeletedFalse(branchName, parentBranch);
    }
    
    @Override
    @Transactional(readOnly = true)
    public boolean isBranchNameDuplicate(String branchName, Long parentBranchId, Long excludeBranchId) {
        Branch parentBranch = parentBranchId != null ? findActiveByIdOrThrow(parentBranchId) : null;
        return branchRepository.existsByBranchNameAndParentBranchAndIdNotAndIsDeletedFalse(
                branchName, parentBranch, excludeBranchId);
    }
    
    @Override
    @Transactional(readOnly = true)
    public boolean isWithinCapacity(Long branchId) {
        return isConsultantCapacityAvailable(branchId) && isClientCapacityAvailable(branchId);
    }
    
    @Override
    @Transactional(readOnly = true)
    public boolean isConsultantCapacityAvailable(Long branchId) {
        Branch branch = findActiveByIdOrThrow(branchId);
        if (branch.getMaxConsultants() == null) {
            return true; // 제한 없음
        }
        
        List<User> consultants = getBranchConsultants(branchId);
        return consultants.size() < branch.getMaxConsultants();
    }
    
    @Override
    @Transactional(readOnly = true)
    public boolean isClientCapacityAvailable(Long branchId) {
        Branch branch = findActiveByIdOrThrow(branchId);
        if (branch.getMaxClients() == null) {
            return true; // 제한 없음
        }
        
        List<User> clients = getBranchClients(branchId);
        return clients.size() < branch.getMaxClients();
    }
    
    
    @Override
    public void setParentBranch(Long branchId, Long parentBranchId) {
        log.info("상위 지점 설정: 지점 ID={}, 상위 지점 ID={}", branchId, parentBranchId);
        
        Branch branch = findActiveByIdOrThrow(branchId);
        Branch parentBranch = findActiveByIdOrThrow(parentBranchId);
        
        if (isCircularReference(branch, parentBranch)) {
            throw new ValidationException("순환 참조가 발생합니다.");
        }
        
        branch.setParentBranch(parentBranch);
        save(branch);
        
        log.info("상위 지점 설정 완료: {} -> {}", 
                branch.getBranchName(), parentBranch.getBranchName());
    }
    
    @Override
    public void removeParentBranch(Long branchId) {
        log.info("상위 지점 해제: 지점 ID={}", branchId);
        
        Branch branch = findActiveByIdOrThrow(branchId);
        branch.setParentBranch(null);
        save(branch);
        
        log.info("상위 지점 해제 완료: {}", branch.getBranchName());
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<BranchResponse> getBranchHierarchy() {
        List<Branch> mainBranches = branchRepository.findByParentBranchIsNullAndIsDeletedFalseOrderByBranchName();
        return mainBranches.stream()
                .map(this::convertToResponseWithHierarchy)
                .collect(Collectors.toList());
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<BranchResponse> getAllSubBranches(Long branchId) {
        List<Branch> subBranches = branchRepository.findByParentBranchIdAndIsDeletedFalseOrderByBranchName(branchId);
        return subBranches.stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<BranchResponse> getAllParentBranches(Long branchId) {
        Optional<Branch> parentBranch = branchRepository.findParentBranch(branchId);
        return parentBranch.map(branch -> List.of(convertToResponse(branch)))
                .orElse(List.of());
    }
    
    
    @Override
    public void updateBranchSettings(Long branchId, String settings) {
        log.info("지점 설정 업데이트: 지점 ID={}", branchId);
        
        Branch branch = findActiveByIdOrThrow(branchId);
        branch.setBranchSettings(settings);
        save(branch);
        
        log.info("지점 설정 업데이트 완료: {}", branch.getBranchName());
    }
    
    @Override
    public void updateOperatingHours(Long branchId, String startTime, String endTime) {
        log.info("지점 운영시간 업데이트: 지점 ID={}, {}~{}", branchId, startTime, endTime);
        
        Branch branch = findActiveByIdOrThrow(branchId);
        branch.setOperatingStartTime(LocalTime.parse(startTime));
        branch.setOperatingEndTime(LocalTime.parse(endTime));
        save(branch);
        
        log.info("지점 운영시간 업데이트 완료: {}", branch.getBranchName());
    }
    
    @Override
    public void updateClosedDays(Long branchId, List<String> closedDays) {
        log.info("지점 휴무일 업데이트: 지점 ID={}", branchId);
        
        Branch branch = findActiveByIdOrThrow(branchId);
        branch.setClosedDays(String.join(",", closedDays));
        save(branch);
        
        log.info("지점 휴무일 업데이트 완료: {}", branch.getBranchName());
    }
    
    @Override
    public void updateCapacity(Long branchId, Integer maxConsultants, Integer maxClients) {
        log.info("지점 수용 인원 업데이트: 지점 ID={}, 상담사={}, 내담자={}", 
                branchId, maxConsultants, maxClients);
        
        Branch branch = findActiveByIdOrThrow(branchId);
        branch.setMaxConsultants(maxConsultants);
        branch.setMaxClients(maxClients);
        save(branch);
        
        log.info("지점 수용 인원 업데이트 완료: {}", branch.getBranchName());
    }
    
    
    private void validateBranchCreation(BranchCreateRequest request) {
        if (isBranchCodeDuplicate(request.getBranchCode())) {
            throw new ValidationException("이미 존재하는 지점 코드입니다: " + request.getBranchCode());
        }
        
        if (isBranchNameDuplicate(request.getBranchName(), request.getParentBranchId())) {
            throw new ValidationException("동일한 상위 지점에 같은 이름의 지점이 존재합니다: " + request.getBranchName());
        }
    }
    
    private void validateBranchUpdate(Branch branch, BranchUpdateRequest request) {
        if (request.getBranchName() != null && 
            isBranchNameDuplicate(request.getBranchName(), 
                    branch.getParentBranch() != null ? branch.getParentBranch().getId() : null, 
                    branch.getId())) {
            throw new ValidationException("동일한 상위 지점에 같은 이름의 지점이 존재합니다: " + request.getBranchName());
        }
    }
    
    private boolean isCircularReference(Branch branch, Branch potentialParent) {
        if (potentialParent == null) {
            return false;
        }
        
        Branch current = potentialParent;
        while (current != null) {
            if (current.getId().equals(branch.getId())) {
                return true;
            }
            current = current.getParentBranch();
        }
        return false;
    }
    
    private BranchResponse convertToResponse(Branch branch) {
        if (branch == null) {
            return null;
        }
        
        return BranchResponse.builder()
                .id(branch.getId())
                .branchCode(branch.getBranchCode())
                .branchName(branch.getBranchName())
                .branchType(branch.getBranchType())
                .branchTypeDescription(branch.getBranchType() != null ? branch.getBranchType().getDescription() : null)
                .branchStatus(branch.getBranchStatus())
                .branchStatusDescription(branch.getBranchStatus() != null ? branch.getBranchStatus().getDescription() : null)
                .postalCode(branch.getPostalCode())
                .address(branch.getAddress())
                .addressDetail(branch.getAddressDetail())
                .phoneNumber(branch.getPhoneNumber())
                .faxNumber(branch.getFaxNumber())
                .email(branch.getEmail())
                .openingDate(branch.getOpeningDate())
                .closingDate(branch.getClosingDate())
                .operatingStartTime(branch.getOperatingStartTime())
                .operatingEndTime(branch.getOperatingEndTime())
                .closedDays(branch.getClosedDays())
                .managerId(branch.getManager() != null ? branch.getManager().getId() : null)
                .managerName(branch.getManager() != null ? branch.getManager().getUserId() : null)
                .parentBranchId(branch.getParentBranch() != null ? branch.getParentBranch().getId() : null)
                .parentBranchName(branch.getParentBranch() != null ? branch.getParentBranch().getBranchName() : null)
                .maxConsultants(branch.getMaxConsultants())
                .maxClients(branch.getMaxClients())
                .description(branch.getDescription())
                .logoUrl(branch.getLogoUrl())
                .websiteUrl(branch.getWebsiteUrl())
                .fullAddress(branch.getFullAddress())
                .operatingHours(branch.getOperatingHours())
                .currentConsultants(0) // 임시로 0으로 설정
                .currentClients(0) // 임시로 0으로 설정
                .consultantUtilization(0.0) // 임시로 0.0으로 설정
                .clientUtilization(0.0) // 임시로 0.0으로 설정
                .isActive(true) // 임시로 true로 설정
                .createdAt(branch.getCreatedAt())
                .updatedAt(branch.getUpdatedAt())
                .build();
    }
    
    private BranchResponse convertToResponseWithHierarchy(Branch branch) {
        BranchResponse response = convertToResponse(branch);
        
        if (branch.getSubBranches() != null && !branch.getSubBranches().isEmpty()) {
            List<BranchResponse> subBranchResponses = branch.getSubBranches().stream()
                    .filter(subBranch -> !subBranch.getIsDeleted())
                    .map(this::convertToResponseWithHierarchy)
                    .collect(Collectors.toList());
            response.setSubBranches(subBranchResponses);
        }
        
        return response;
    }
    
    
    @Override
    public Map<String, Object> getAllBranchesStatistics() {
        log.info("전체 지점 통계 조회");
        
        try {
            Map<String, Object> stats = new HashMap<>();
            
            String tenantId = TenantContextHolder.getTenantId();
            if (tenantId == null) {
                log.error("❌ tenantId가 설정되지 않았습니다");
                return new HashMap<>();
            }
            
            long totalBranches = branchRepository.count();
            // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. CommonCodeService 사용
            long activeBranches = branchRepository.countByBranchStatusAndIsDeletedFalse(Branch.BranchStatus.ACTIVE);
            long totalUsers = userRepository.count();
            long activeUsers = userRepository.countByIsActiveTrueAndIsDeletedFalse(tenantId);
            
            long totalConsultants = userRepository.countByRoleAndIsDeletedFalse(tenantId, UserRole.CONSULTANT);
            long activeConsultants = userRepository.countByRoleAndIsActiveTrueAndIsDeletedFalse(tenantId, UserRole.CONSULTANT);
            long totalClients = userRepository.countByRoleAndIsDeletedFalse(tenantId, UserRole.CLIENT);
            long activeClients = userRepository.countByRoleAndIsActiveTrueAndIsDeletedFalse(tenantId, UserRole.CLIENT);
            
            stats.put("totalBranches", totalBranches);
            stats.put("activeBranches", activeBranches);
            stats.put("totalUsers", totalUsers);
            stats.put("activeUsers", activeUsers);
            stats.put("totalConsultants", totalConsultants);
            stats.put("activeConsultants", activeConsultants);
            stats.put("totalClients", totalClients);
            stats.put("activeClients", activeClients);
            stats.put("period", "month");
            stats.put("lastUpdated", java.time.LocalDateTime.now());
            
            log.info("전체 지점 통계 조회 완료: {} 지점, {} 사용자", totalBranches, totalUsers);
            return stats;
            
        } catch (Exception e) {
            log.error("전체 지점 통계 조회 실패: {}", e.getMessage(), e);
            throw new RuntimeException("통계 조회에 실패했습니다.", e);
        }
    }
    
    @Override
    public List<Map<String, Object>> getBranchComparisonStatistics(String period, String metric) {
        log.info("지점 비교 통계 조회 - 기간: {}, 지표: {}", period, metric);
        
        try {
            List<Branch> branches = branchRepository.findByIsDeletedFalseOrderByBranchName();
            List<Map<String, Object>> comparison = branches.stream()
                .map(branch -> {
                    Map<String, Object> branchStats = new HashMap<>();
                    branchStats.put("branchId", branch.getId());
                    branchStats.put("branchName", branch.getBranchName());
                    branchStats.put("branchCode", branch.getBranchCode());
                    branchStats.put("branchStatus", branch.getBranchStatus());
                    
                    String tenantId = TenantContextHolder.getTenantId();
                    long userCount = tenantId != null ? userRepository.countByBranchIdAndIsDeletedFalse(tenantId, branch.getId()) : 0;
                    long activeUserCount = tenantId != null ? userRepository.countByBranchIdAndIsActiveTrueAndIsDeletedFalse(tenantId, branch.getId()) : 0;
                    long consultantCount = tenantId != null ? userRepository.countByBranchIdAndRoleAndIsDeletedFalse(tenantId, branch.getId(), UserRole.CONSULTANT) : 0;
                    long clientCount = tenantId != null ? userRepository.countByBranchIdAndRoleAndIsDeletedFalse(tenantId, branch.getId(), UserRole.CLIENT) : 0;
                    
                    branchStats.put("totalUsers", userCount);
                    branchStats.put("activeUsers", activeUserCount);
                    branchStats.put("consultants", consultantCount);
                    branchStats.put("clients", clientCount);
                    
                    return branchStats;
                })
                .collect(Collectors.toList());
            
            log.info("지점 비교 통계 조회 완료: {} 지점", comparison.size());
            return comparison;
            
        } catch (Exception e) {
            log.error("지점 비교 통계 조회 실패: {}", e.getMessage(), e);
            throw new RuntimeException("비교 통계 조회에 실패했습니다.", e);
        }
    }
    
    @Override
    public List<Map<String, Object>> getBranchTrendStatistics(String period, String metric, Long branchId) {
        log.info("지점 추이 분석 통계 조회 - 기간: {}, 지표: {}, 지점ID: {}", period, metric, branchId);
        
        try {
            LocalDate endDate = LocalDate.now();
            LocalDate startDate;
            
            switch (period.toLowerCase()) {
                case "week":
                    startDate = endDate.minusWeeks(1);
                    break;
                case "month":
                    startDate = endDate.minusMonths(1);
                    break;
                case "quarter":
                    startDate = endDate.minusMonths(3);
                    break;
                case "year":
                    startDate = endDate.minusYears(1);
                    break;
                default:
                    startDate = endDate.minusMonths(1);
            }
            
            List<Map<String, Object>> trendData = new java.util.ArrayList<>();
            
            if ("DAILY_USERS".equals(metric)) {
                for (LocalDate date = startDate; !date.isAfter(endDate); date = date.plusDays(1)) {
                    Map<String, Object> dailyData = new HashMap<>();
                    dailyData.put("date", date);
                    dailyData.put("newUsers", 0); // 임시 데이터
                    dailyData.put("newConsultants", 0);
                    dailyData.put("newClients", 0);
                    trendData.add(dailyData);
                }
            } else {
                Map<String, Object> defaultData = new HashMap<>();
                defaultData.put("period", period);
                defaultData.put("metric", metric);
                defaultData.put("branchId", branchId);
                defaultData.put("data", new java.util.ArrayList<>());
                trendData.add(defaultData);
            }
            
            log.info("지점 추이 분석 통계 조회 완료: {} 데이터 포인트", trendData.size());
            return trendData;
            
        } catch (Exception e) {
            log.error("지점 추이 분석 통계 조회 실패: {}", e.getMessage(), e);
            throw new RuntimeException("추이 분석 조회에 실패했습니다.", e);
        }
    }
    
    
    @Override
    public Branch save(Branch branch) {
        String tenantId = TenantContextHolder.getTenantId();
        if (branch.getId() == null) {
            if (tenantId != null) {
                return create(tenantId, branch);
            }
        } else {
            if (tenantId != null && branch.getTenantId() != null) {
                return update(tenantId, branch);
            }
        }
        return branchRepository.save(branch);
    }
    
    @Override
    public List<Branch> saveAll(List<Branch> branches) {
        return branches.stream().map(this::save).collect(java.util.stream.Collectors.toList());
    }
    
    @Override
    public Branch update(Branch branch) {
        String tenantId = TenantContextHolder.getTenantId();
        if (tenantId != null && branch.getTenantId() != null) {
            return update(tenantId, branch);
        }
        return branchRepository.save(branch);
    }
    
    @Override
    public Branch partialUpdate(Long id, Branch updateData) {
        String tenantId = TenantContextHolder.getTenantId();
        if (tenantId != null) {
            return partialUpdate(tenantId, id, updateData);
        }
        Branch existing = branchRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("지점을 찾을 수 없습니다: " + id));
        return branchRepository.save(existing);
    }
    
    @Override
    public void softDeleteById(Long id) {
        String tenantId = TenantContextHolder.getTenantId();
        if (tenantId != null) {
            delete(tenantId, id);
        } else {
            Branch branch = branchRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("지점을 찾을 수 없습니다: " + id));
            branch.setIsDeleted(true);
            branchRepository.save(branch);
        }
    }
    
    @Override
    public void hardDeleteById(Long id) {
        branchRepository.deleteById(id);
    }
    
    @Override
    public void restoreById(Long id) {
        Branch branch = branchRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("지점을 찾을 수 없습니다: " + id));
        branch.setIsDeleted(false);
        branch.setDeletedAt(null);
        branchRepository.save(branch);
    }
    
    @Override
    public List<Branch> findAllActive() {
        String tenantId = TenantContextHolder.getTenantId();
        if (tenantId != null) {
            return findAllByTenant(tenantId, null);
        }
        return branchRepository.findAllActiveByCurrentTenant();
    }
    
    @Override
    public Page<Branch> findAllActive(Pageable pageable) {
        String tenantId = TenantContextHolder.getTenantId();
        if (tenantId != null) {
            return branchRepository.findAllByTenantId(tenantId, pageable);
        }
        return branchRepository.findAllActive(pageable);
    }
    
    @Override
    public Optional<Branch> findActiveById(Long id) {
        String tenantId = TenantContextHolder.getTenantId();
        if (tenantId != null) {
            return findByIdAndTenant(tenantId, id).filter(b -> !b.getIsDeleted());
        }
        return branchRepository.findActiveById(id);
    }
    
    @Override
    public Branch findActiveByIdOrThrow(Long id) {
        return findActiveById(id)
                .orElseThrow(() -> new RuntimeException("활성 지점을 찾을 수 없습니다: " + id));
    }
    
    @Override
    public boolean existsActiveById(Long id) {
        return branchRepository.existsActiveById(id);
    }
    
    @Override
    public long countActive() {
        return branchRepository.countActive();
    }
    
    @Override
    public List<Branch> findAllDeleted() {
        return branchRepository.findAllDeleted();
    }
    
    @Override
    public long countDeleted() {
        return branchRepository.countDeleted();
    }
    
    @Override
    public List<Branch> findByCreatedAtBetween(LocalDateTime startDate, LocalDateTime endDate) {
        return branchRepository.findByCreatedAtBetween(startDate, endDate);
    }
    
    @Override
    public List<Branch> findByUpdatedAtBetween(LocalDateTime startDate, LocalDateTime endDate) {
        return branchRepository.findByUpdatedAtBetween(startDate, endDate);
    }
    
    @Override
    public List<Branch> findRecentActive(int limit) {
        return branchRepository.findRecentActive(limit);
    }
    
    @Override
    public List<Branch> findRecentlyUpdatedActive(int limit) {
        return branchRepository.findRecentlyUpdatedActive(limit);
    }
    
    @Override
    public Object[] getEntityStatistics() {
        return branchRepository.getEntityStatistics();
    }
    
    @Override
    public void cleanupOldDeleted(LocalDateTime cutoffDate) {
        branchRepository.cleanupOldDeleted(cutoffDate);
    }
    
    @Override
    public boolean isDuplicateExcludingIdAll(Long excludeId, String fieldName, Object fieldValue, boolean includeDeleted) {
        return branchRepository.isDuplicateExcludingIdAll(excludeId, fieldName, fieldValue, includeDeleted);
    }
    
    @Override
    public Optional<Branch> findByIdAndVersion(Long id, Long version) {
        return branchRepository.findByIdAndVersion(id, version);
    }
}
