package com.mindgarden.consultation.service.impl;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;
import com.mindgarden.consultation.constant.UserRole;
import com.mindgarden.consultation.dto.BranchCreateRequest;
import com.mindgarden.consultation.dto.BranchResponse;
import com.mindgarden.consultation.dto.BranchUpdateRequest;
import com.mindgarden.consultation.entity.Branch;
import com.mindgarden.consultation.entity.User;
import com.mindgarden.consultation.exception.EntityNotFoundException;
import com.mindgarden.consultation.exception.ValidationException;
import com.mindgarden.consultation.repository.BaseRepository;
import com.mindgarden.consultation.repository.BranchRepository;
import com.mindgarden.consultation.repository.UserRepository;
import com.mindgarden.consultation.service.BranchService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * 지점 서비스 구현체
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-09-12
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class BranchServiceImpl extends BaseServiceImpl<Branch, Long> implements BranchService {
    
    private final BranchRepository branchRepository;
    private final UserRepository userRepository;
    
    @Override
    public BaseRepository<Branch, Long> getRepository() {
        return (BaseRepository<Branch, Long>) branchRepository;
    }
    
    // === 기본 CRUD 메서드 ===
    
    @Override
    public BranchResponse createBranch(BranchCreateRequest request) {
        log.info("지점 생성 요청: {}", request.getBranchName());
        
        // 유효성 검사
        validateBranchCreation(request);
        
        // 상위 지점 조회 (있는 경우)
        Branch parentBranch = null;
        if (request.getParentBranchId() != null) {
            parentBranch = findActiveByIdOrThrow(request.getParentBranchId());
        }
        
        // 지점장 조회 (있는 경우)
        User manager = null;
        if (request.getManagerId() != null) {
            manager = userRepository.findById(request.getManagerId())
                    .orElseThrow(() -> new EntityNotFoundException("지점장을 찾을 수 없습니다."));
        }
        
        // 지점 엔티티 생성
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
        
        // 지점 저장
        branch = save(branch);
        log.info("지점 생성 완료: ID={}, 코드={}", branch.getId(), branch.getBranchCode());
        
        return convertToResponse(branch);
    }
    
    @Override
    public BranchResponse updateBranch(Long branchId, BranchUpdateRequest request) {
        log.info("지점 수정 요청: ID={}", branchId);
        
        Branch branch = findActiveByIdOrThrow(branchId);
        
        // 유효성 검사
        validateBranchUpdate(branch, request);
        
        // 필드 업데이트
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
        
        // 지점장 변경
        if (request.getManagerId() != null) {
            User manager = userRepository.findById(request.getManagerId())
                    .orElseThrow(() -> new EntityNotFoundException("지점장을 찾을 수 없습니다."));
            branch.setManager(manager);
        }
        
        branch = save(branch);
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
    @Transactional(readOnly = true)
    public Branch getBranchByCode(String branchCode) {
        return branchRepository.findByBranchCodeAndIsDeletedFalse(branchCode)
                .orElseThrow(() -> new EntityNotFoundException("지점을 찾을 수 없습니다: " + branchCode));
    }
    
    // === 조회 메서드 ===
    
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
    
    // === 지점 관리 메서드 ===
    
    @Override
    public void assignManager(Long branchId, Long managerId) {
        log.info("지점장 지정: 지점 ID={}, 지점장 ID={}", branchId, managerId);
        
        Branch branch = findActiveByIdOrThrow(branchId);
        User manager = userRepository.findById(managerId)
                .orElseThrow(() -> new EntityNotFoundException("지점장을 찾을 수 없습니다."));
        
        // 기존 지점장이 관리하는 다른 지점이 있는지 확인
        List<Branch> existingManagedBranches = branchRepository.findByManagerAndIsDeletedFalse(manager);
        if (!existingManagedBranches.isEmpty()) {
            log.warn("이미 다른 지점을 관리하는 지점장입니다: {}", manager.getUsername());
        }
        
        branch.setManager(manager);
        save(branch);
        
        log.info("지점장 지정 완료: 지점={}, 지점장={}", branch.getBranchName(), manager.getUsername());
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
        
        // 상태별 추가 처리
        if (newStatus == Branch.BranchStatus.ACTIVE && branch.getOpeningDate() == null) {
            branch.setOpeningDate(LocalDate.now());
        } else if (newStatus == Branch.BranchStatus.CLOSED) {
            branch.setClosingDate(LocalDate.now());
        }
        
        save(branch);
        
        log.info("지점 상태 변경 완료: 지점={}, {} -> {}", 
                branch.getBranchName(), oldStatus, newStatus);
    }
    
    @Override
    public void activateBranch(Long branchId) {
        changeBranchStatus(branchId, Branch.BranchStatus.ACTIVE);
    }
    
    @Override
    public void deactivateBranch(Long branchId) {
        changeBranchStatus(branchId, Branch.BranchStatus.SUSPENDED);
    }
    
    @Override
    public void closeBranch(Long branchId) {
        changeBranchStatus(branchId, Branch.BranchStatus.CLOSED);
    }
    
    // === 사용자 관리 메서드 ===
    
    @Override
    public void assignConsultantToBranch(Long branchId, Long consultantId) {
        log.info("상담사 지점 할당: 지점 ID={}, 상담사 ID={}", branchId, consultantId);
        
        Branch branch = findActiveByIdOrThrow(branchId);
        User consultant = userRepository.findById(consultantId)
                .orElseThrow(() -> new EntityNotFoundException("상담사를 찾을 수 없습니다."));
        
        // 수용 인원 확인
        if (!isConsultantCapacityAvailable(branchId)) {
            throw new ValidationException("지점의 상담사 수용 인원을 초과했습니다.");
        }
        
        consultant.setBranch(branch);
        userRepository.save(consultant);
        
        log.info("상담사 지점 할당 완료: 지점={}, 상담사={}", 
                branch.getBranchName(), consultant.getUsername());
    }
    
    @Override
    public void assignClientToBranch(Long branchId, Long clientId) {
        log.info("내담자 지점 할당: 지점 ID={}, 내담자 ID={}", branchId, clientId);
        
        Branch branch = findActiveByIdOrThrow(branchId);
        User client = userRepository.findById(clientId)
                .orElseThrow(() -> new EntityNotFoundException("내담자를 찾을 수 없습니다."));
        
        // 수용 인원 확인
        if (!isClientCapacityAvailable(branchId)) {
            throw new ValidationException("지점의 내담자 수용 인원을 초과했습니다.");
        }
        
        client.setBranch(branch);
        userRepository.save(client);
        
        log.info("내담자 지점 할당 완료: 지점={}, 내담자={}", 
                branch.getBranchName(), client.getUsername());
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
                user.getUsername(), branchName);
    }
    
    @Override
    public void transferUserBetweenBranches(Long userId, Long fromBranchId, Long toBranchId) {
        log.info("사용자 지점 이동: 사용자 ID={}, {} -> {}", userId, fromBranchId, toBranchId);
        
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("사용자를 찾을 수 없습니다."));
        
        Branch fromBranch = findActiveByIdOrThrow(fromBranchId);
        Branch toBranch = findActiveByIdOrThrow(toBranchId);
        
        // 현재 지점 확인
        if (user.getBranch() == null || !user.getBranch().getId().equals(fromBranchId)) {
            throw new ValidationException("사용자가 해당 지점에 소속되어 있지 않습니다.");
        }
        
        // 목표 지점 수용 인원 확인
        if (user.getRole() == com.mindgarden.consultation.constant.UserRole.CONSULTANT && !isConsultantCapacityAvailable(toBranchId)) {
            throw new ValidationException("목표 지점의 상담사 수용 인원을 초과했습니다.");
        } else if (user.getRole() == com.mindgarden.consultation.constant.UserRole.CLIENT && !isClientCapacityAvailable(toBranchId)) {
            throw new ValidationException("목표 지점의 내담자 수용 인원을 초과했습니다.");
        }
        
        user.setBranch(toBranch);
        userRepository.save(user);
        
        log.info("사용자 지점 이동 완료: 사용자={}, {} -> {}", 
                user.getUsername(), fromBranch.getBranchName(), toBranch.getBranchName());
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<User> getBranchConsultants(Long branchId) {
        Branch branch = findActiveByIdOrThrow(branchId);
        List<User> consultants = userRepository.findByBranchAndRoleAndIsDeletedFalseOrderByUsername(
                branch, UserRole.CONSULTANT);
        
        // branchId가 null인 상담사들도 branchCode로 매칭하여 추가
        List<User> additionalConsultants = userRepository.findByBranchCodeAndRoleAndIsDeletedFalseOrderByUsername(
                branch.getBranchCode(), UserRole.CONSULTANT);
        
        // 중복 제거를 위해 ID 기준으로 합치기
        Map<Long, User> consultantMap = new HashMap<>();
        consultants.forEach(consultant -> consultantMap.put(consultant.getId(), consultant));
        additionalConsultants.forEach(consultant -> consultantMap.put(consultant.getId(), consultant));
        
        return new ArrayList<>(consultantMap.values());
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<User> getBranchClients(Long branchId) {
        Branch branch = findActiveByIdOrThrow(branchId);
        return userRepository.findByBranchAndRoleAndIsDeletedFalseOrderByUsername(
                branch, UserRole.CLIENT);
    }
    
    // === 통계 및 분석 메서드 ===
    
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
        
        // 사용자 통계
        List<User> consultants = getBranchConsultants(branchId);
        List<User> clients = getBranchClients(branchId);
        
        statistics.put("consultantCount", consultants.size());
        statistics.put("clientCount", clients.size());
        statistics.put("maxConsultants", branch.getMaxConsultants());
        statistics.put("maxClients", branch.getMaxClients());
        
        // 수용률 계산
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
    
    // === 유효성 검사 메서드 ===
    
    @Override
    @Transactional(readOnly = true)
    public boolean isBranchCodeDuplicate(String branchCode) {
        return branchRepository.existsByBranchCodeAndIsDeletedFalse(branchCode);
    }
    
    @Override
    @Transactional(readOnly = true)
    public boolean isBranchCodeDuplicate(String branchCode, Long excludeBranchId) {
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
    
    // === 관계 관리 메서드 ===
    
    @Override
    public void setParentBranch(Long branchId, Long parentBranchId) {
        log.info("상위 지점 설정: 지점 ID={}, 상위 지점 ID={}", branchId, parentBranchId);
        
        Branch branch = findActiveByIdOrThrow(branchId);
        Branch parentBranch = findActiveByIdOrThrow(parentBranchId);
        
        // 순환 참조 방지
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
    
    // === 설정 관리 메서드 ===
    
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
    
    // === Private 메서드 ===
    
    private void validateBranchCreation(BranchCreateRequest request) {
        // 지점 코드 중복 확인
        if (isBranchCodeDuplicate(request.getBranchCode())) {
            throw new ValidationException("이미 존재하는 지점 코드입니다: " + request.getBranchCode());
        }
        
        // 지점명 중복 확인
        if (isBranchNameDuplicate(request.getBranchName(), request.getParentBranchId())) {
            throw new ValidationException("동일한 상위 지점에 같은 이름의 지점이 존재합니다: " + request.getBranchName());
        }
    }
    
    private void validateBranchUpdate(Branch branch, BranchUpdateRequest request) {
        // 지점명 중복 확인
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
                .managerName(branch.getManager() != null ? branch.getManager().getUsername() : null)
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
        
        // 하위 지점들 추가
        if (branch.getSubBranches() != null && !branch.getSubBranches().isEmpty()) {
            List<BranchResponse> subBranchResponses = branch.getSubBranches().stream()
                    .filter(subBranch -> !subBranch.getIsDeleted())
                    .map(this::convertToResponseWithHierarchy)
                    .collect(Collectors.toList());
            response.setSubBranches(subBranchResponses);
        }
        
        return response;
    }
    
    // === 통계 메서드 구현 ===
    
    @Override
    public Map<String, Object> getAllBranchesStatistics() {
        log.info("전체 지점 통계 조회");
        
        try {
            // PL/SQL 프로시저 호출을 위한 임시 구현
            // 실제로는 @Query 또는 @Procedure를 사용하여 PL/SQL 호출
            Map<String, Object> stats = new HashMap<>();
            
            // 기본 통계 데이터
            long totalBranches = branchRepository.count();
            long activeBranches = branchRepository.countByBranchStatusAndIsDeletedFalse(Branch.BranchStatus.ACTIVE);
            long totalUsers = userRepository.count();
            long activeUsers = userRepository.countByIsActiveTrueAndIsDeletedFalse();
            
            // 역할별 사용자 수
            long totalConsultants = userRepository.countByRoleAndIsDeletedFalse(UserRole.CONSULTANT);
            long activeConsultants = userRepository.countByRoleAndIsActiveTrueAndIsDeletedFalse(UserRole.CONSULTANT);
            long totalClients = userRepository.countByRoleAndIsDeletedFalse(UserRole.CLIENT);
            long activeClients = userRepository.countByRoleAndIsActiveTrueAndIsDeletedFalse(UserRole.CLIENT);
            
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
            // 지점별 기본 통계 조회
            List<Branch> branches = branchRepository.findByIsDeletedFalseOrderByBranchName();
            List<Map<String, Object>> comparison = branches.stream()
                .map(branch -> {
                    Map<String, Object> branchStats = new HashMap<>();
                    branchStats.put("branchId", branch.getId());
                    branchStats.put("branchName", branch.getBranchName());
                    branchStats.put("branchCode", branch.getBranchCode());
                    branchStats.put("branchStatus", branch.getBranchStatus());
                    
                    // 지점별 사용자 수
                    long userCount = userRepository.countByBranchIdAndIsDeletedFalse(branch.getId());
                    long activeUserCount = userRepository.countByBranchIdAndIsActiveTrueAndIsDeletedFalse(branch.getId());
                    long consultantCount = userRepository.countByBranchIdAndRoleAndIsDeletedFalse(branch.getId(), UserRole.CONSULTANT);
                    long clientCount = userRepository.countByBranchIdAndRoleAndIsDeletedFalse(branch.getId(), UserRole.CLIENT);
                    
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
            // 기간 계산
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
            
            // 일별 사용자 생성 추이
            if ("DAILY_USERS".equals(metric)) {
                // 실제로는 복잡한 쿼리로 일별 데이터를 조회
                for (LocalDate date = startDate; !date.isAfter(endDate); date = date.plusDays(1)) {
                    Map<String, Object> dailyData = new HashMap<>();
                    dailyData.put("date", date);
                    dailyData.put("newUsers", 0); // 임시 데이터
                    dailyData.put("newConsultants", 0);
                    dailyData.put("newClients", 0);
                    trendData.add(dailyData);
                }
            } else {
                // 기본 추이 데이터
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
}
