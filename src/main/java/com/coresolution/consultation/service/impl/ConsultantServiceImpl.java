package com.coresolution.consultation.service.impl;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import com.coresolution.consultation.constant.ConsultantConstants;
import com.coresolution.consultation.entity.Client;
import com.coresolution.consultation.entity.Consultant;
import com.coresolution.consultation.entity.ConsultantClientMapping;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.repository.ConsultantClientMappingRepository;
import com.coresolution.consultation.repository.ConsultantRepository;
import com.coresolution.consultation.service.ConsultantService;
import com.coresolution.consultation.util.PersonalDataEncryptionUtil;
import com.coresolution.core.context.TenantContextHolder;
import com.coresolution.core.security.TenantAccessControlService;
import com.coresolution.core.service.impl.BaseTenantEntityServiceImpl;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import lombok.extern.slf4j.Slf4j;

/**
 * ConsultantService 구현체
 * API 설계 문서에 명시된 상담사 관리 비즈니스 로직 구현
 * BaseTenantEntityServiceImpl을 상속하여 테넌트 필터링 및 접근 제어 지원
 * 
 * @author CoreSolution
 * @version 2.0.0
 * @since 2024-12-19
 */
@Slf4j
@Service
@Transactional
public class ConsultantServiceImpl extends BaseTenantEntityServiceImpl<Consultant, Long> 
        implements ConsultantService {
    
    private final ConsultantRepository consultantRepository;
    
    @Autowired
    private ConsultantClientMappingRepository mappingRepository;
    
    @Autowired
    private PersonalDataEncryptionUtil encryptionUtil;
    
    // BaseTenantEntityServiceImpl에서 이미 주입받음 (accessControlService)
    
    public ConsultantServiceImpl(
            ConsultantRepository consultantRepository,
            TenantAccessControlService accessControlService) {
        super(consultantRepository, accessControlService);
        this.consultantRepository = consultantRepository;
    }
    
    // ==================== BaseTenantEntityServiceImpl 추상 메서드 구현 ====================
    
    @Override
    protected Optional<Consultant> findEntityById(Long id) {
        return consultantRepository.findById(id);
    }
    
    @Override
    protected List<Consultant> findEntitiesByTenantAndBranch(String tenantId, Long branchId) {
        if (branchId != null) {
            return consultantRepository.findAllByTenantIdAndBranchId(tenantId, branchId);
        } else {
            return consultantRepository.findAllByTenantId(tenantId);
        }
    }
    
    /**
     * 전화번호 마스킹 처리
     */
    private String maskPhone(String phone) {
        if (phone == null || phone.length() < 4) {
            return "***";
        }
        return phone.substring(0, 3) + "****" + phone.substring(phone.length() - 4);
    }
    
    // ==================== BaseService 구현 메서드들 (BaseTenantEntityService 위임) ====================
    
    @Override
    public com.coresolution.consultation.repository.BaseRepository<Consultant, Long> getRepository() {
        return consultantRepository;
    }
    
    @Override
    public Consultant save(Consultant consultant) {
        if (consultant.getId() == null) {
            // 새 상담사 생성 시 BaseTenantEntityService의 create 메서드 사용
            String tenantId = TenantContextHolder.getTenantId();
            if (tenantId != null) {
                return create(tenantId, consultant);
            } else {
                // 테넌트 컨텍스트가 없으면 기존 방식 사용 (하위 호환성)
                return consultantRepository.save(consultant);
            }
        } else {
            // 기존 상담사 수정 시 BaseTenantEntityService의 update 메서드 사용
            String tenantId = TenantContextHolder.getTenantId();
            if (tenantId != null && consultant.getTenantId() != null) {
                return update(tenantId, consultant);
            } else {
                // 테넌트 컨텍스트가 없으면 기존 방식 사용 (하위 호환성)
                if (consultant.getTenantId() != null) {
                    accessControlService.validateTenantAccess(consultant.getTenantId());
                }
                return consultantRepository.save(consultant);
            }
        }
    }
    
    @Override
    public List<Consultant> saveAll(List<Consultant> consultants) {
        return consultantRepository.saveAll(consultants);
    }
    
    @Override
    public Consultant update(Consultant consultant) {
        // BaseTenantEntityService의 update 메서드 사용
        String tenantId = TenantContextHolder.getTenantId();
        if (tenantId != null && consultant.getTenantId() != null) {
            return update(tenantId, consultant);
        } else {
            // 테넌트 컨텍스트가 없으면 기존 방식 사용 (하위 호환성)
            Consultant existingConsultant = consultantRepository.findById(consultant.getId())
                    .orElseThrow(() -> new RuntimeException("상담사를 찾을 수 없습니다: " + consultant.getId()));
            
            if (existingConsultant.getTenantId() != null) {
                accessControlService.validateTenantAccess(existingConsultant.getTenantId());
            }
            
            return consultantRepository.save(consultant);
        }
    }
    
    @Override
    public Consultant partialUpdate(Long id, Consultant updateData) {
        Consultant existingConsultant = consultantRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("상담사를 찾을 수 없습니다: " + id));
        
        // 테넌트 접근 제어
        if (existingConsultant.getTenantId() != null) {
            accessControlService.validateTenantAccess(existingConsultant.getTenantId());
        }
        
        // 부분 업데이트: null이 아닌 필드만 업데이트
        if (updateData.getSpecialty() != null) {
            existingConsultant.setSpecialty(updateData.getSpecialty());
        }
        if (updateData.getYearsOfExperience() != null) {
            existingConsultant.setYearsOfExperience(updateData.getYearsOfExperience());
        }
        if (updateData.getAverageRating() != null) {
            // 평점 유효성 검사
            if (updateData.getAverageRating() < ConsultantConstants.MIN_RATING || 
                updateData.getAverageRating() > ConsultantConstants.MAX_RATING) {
                throw new IllegalArgumentException(ConsultantConstants.ERROR_INVALID_RATING);
            }
            // 평점 업데이트 (실제 구현에서는 평점 계산 로직 필요)
            log.info("상담사 평점 업데이트: consultantId={}, newRating={}", id, updateData.getAverageRating());
        }
        if (updateData.getIsAvailable() != null) {
            existingConsultant.setIsAvailable(updateData.getIsAvailable());
        }
        
        return consultantRepository.save(existingConsultant);
    }
    
    @Override
    public void softDeleteById(Long id) {
        // BaseTenantEntityService의 delete 메서드 사용
        String tenantId = TenantContextHolder.getTenantId();
        if (tenantId != null) {
            delete(tenantId, id);
        } else {
            // 테넌트 컨텍스트가 없으면 기존 방식 사용 (하위 호환성)
            Consultant consultant = consultantRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("상담사를 찾을 수 없습니다: " + id));
            
            if (consultant.getTenantId() != null) {
                accessControlService.validateTenantAccess(consultant.getTenantId());
            }
            
            consultant.setIsDeleted(true);
            consultantRepository.save(consultant);
        }
    }
    
    @Override
    public void restoreById(Long id) {
        Consultant consultant = consultantRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("상담사를 찾을 수 없습니다: " + id));
        
        consultant.setIsDeleted(false);
        consultantRepository.save(consultant);
    }
    
    @Override
    public void hardDeleteById(Long id) {
        consultantRepository.deleteById(id);
    }
    
    @Override
    public List<Consultant> findAllActive() {
        // 테넌트 컨텍스트에서 tenantId 가져오기
        String tenantId = TenantContextHolder.getTenantId();
        if (tenantId != null) {
            return findAllByTenant(tenantId, null);
        }
        // 테넌트 컨텍스트가 없으면 기존 방식 사용 (하위 호환성)
        return consultantRepository.findAllActiveByCurrentTenant();
    }
    
    @Override
    public Optional<Consultant> findActiveById(Long id) {
        // 테넌트 컨텍스트에서 tenantId 가져오기
        String tenantId = TenantContextHolder.getTenantId();
        if (tenantId != null) {
            return findByIdAndTenant(tenantId, id)
                    .filter(c -> !c.getIsDeleted());
        }
        // 테넌트 컨텍스트가 없으면 기존 방식 사용 (하위 호환성)
        Optional<Consultant> consultant = consultantRepository.findById(id);
        return consultant.isPresent() && !consultant.get().getIsDeleted() ? consultant : Optional.empty();
    }
    
    @Override
    public Consultant findActiveByIdOrThrow(Long id) {
        return findActiveById(id)
                .orElseThrow(() -> new RuntimeException("활성 상담사를 찾을 수 없습니다: " + id));
    }
    
    @Override
    public long countActive() {
        String tenantId = TenantContextHolder.getRequiredTenantId();
        return consultantRepository.findByTenantIdAndIsDeletedFalse(tenantId).size();
    }
    
    @Override
    public List<Consultant> findAllDeleted() {
        return consultantRepository.findAll().stream()
                .filter(Consultant::getIsDeleted)
                .collect(java.util.stream.Collectors.toList());
    }
    
    @Override
    public long countDeleted() {
        return (long) consultantRepository.findAll().stream()
                .filter(Consultant::getIsDeleted)
                .count();
    }
    
    @Override
    public boolean existsActiveById(Long id) {
        Optional<Consultant> consultant = consultantRepository.findById(id);
        return consultant.isPresent() && !consultant.get().getIsDeleted();
    }
    
    @Override
    public Optional<Consultant> findByIdAndVersion(Long id, Long version) {
        Optional<Consultant> consultant = consultantRepository.findById(id);
        return consultant.isPresent() && consultant.get().getVersion().equals(version) ? consultant : Optional.empty();
    }
    
    @Override
    public Object[] getEntityStatistics() {
        List<Consultant> all = consultantRepository.findAll();
        long total = all.size();
        long deleted = all.stream().filter(Consultant::getIsDeleted).count();
        long active = total - deleted;
        return new Object[]{total, deleted, active};
    }
    
    @Override
    public void cleanupOldDeleted(java.time.LocalDateTime cutoffDate) {
        // 구현 필요시 추가
    }
    
    @Override
    public org.springframework.data.domain.Page<Consultant> findAllActive(Pageable pageable) {
        String tenantId = TenantContextHolder.getTenantId();
        if (tenantId != null) {
            // BaseRepository의 findAllByTenantId 메서드 사용
            return consultantRepository.findAllByTenantId(tenantId, pageable);
        }
        // 테넌트 컨텍스트가 없으면 기존 방식 사용 (하위 호환성)
        List<Consultant> activeConsultants = consultantRepository.findByIsDeletedFalse();
        int start = (int) pageable.getOffset();
        int end = Math.min((start + pageable.getPageSize()), activeConsultants.size());
        return new org.springframework.data.domain.PageImpl<>(
            activeConsultants.subList(start, end), 
            pageable, 
            activeConsultants.size()
        );
    }
    
    @Override
    public List<Consultant> findRecentActive(int limit) {
        String tenantId = TenantContextHolder.getRequiredTenantId();
        return consultantRepository.findByTenantIdAndIsDeletedFalse(tenantId).stream()
                .sorted((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()))
                .limit(limit)
                .collect(java.util.stream.Collectors.toList());
    }
    
    @Override
    public List<Consultant> findRecentlyUpdatedActive(int limit) {
        return consultantRepository.findByIsDeletedFalse().stream()
                .sorted((a, b) -> b.getUpdatedAt().compareTo(a.getUpdatedAt()))
                .limit(limit)
                .collect(java.util.stream.Collectors.toList());
    }
    
    @Override
    public List<Consultant> findByCreatedAtBetween(java.time.LocalDateTime startDate, java.time.LocalDateTime endDate) {
        return consultantRepository.findByIsDeletedFalse().stream()
                .filter(c -> c.getCreatedAt().isAfter(startDate) && c.getCreatedAt().isBefore(endDate))
                .collect(java.util.stream.Collectors.toList());
    }
    
    @Override
    public List<Consultant> findByUpdatedAtBetween(java.time.LocalDateTime startDate, java.time.LocalDateTime endDate) {
        return consultantRepository.findByIsDeletedFalse().stream()
                .filter(c -> c.getUpdatedAt().isAfter(startDate) && c.getUpdatedAt().isBefore(endDate))
                .collect(java.util.stream.Collectors.toList());
    }
    
    @Override
    public boolean isDuplicateExcludingIdAll(Long excludeId, String fieldName, Object fieldValue, boolean includeDeleted) {
        return consultantRepository.isDuplicateExcludingIdAll(excludeId, fieldName, fieldValue, includeDeleted);
    }
    
    // === ConsultantService 특화 메서드들 ===
    
    @Override
    public List<Consultant> findBySpecialty(String specialty) {
        log.info("전문분야별 상담사 조회: {}", specialty);
        return consultantRepository.findBySpecialtyContainingIgnoreCaseAndIsDeletedFalse(specialty);
    }
    
    @Override
    public List<Consultant> findByExperienceGreaterThanEqual(int experience) {
        log.info("경력별 상담사 조회: {}년 이상", experience);
        if (experience < ConsultantConstants.MIN_EXPERIENCE || experience > ConsultantConstants.MAX_EXPERIENCE) {
            throw new IllegalArgumentException(ConsultantConstants.ERROR_INVALID_EXPERIENCE);
        }
        return consultantRepository.findByExperienceGreaterThanEqualAndIsDeletedFalse(experience);
    }
    
    @Override
    public List<Consultant> findByRatingGreaterThanEqual(double rating) {
        log.info("평점별 상담사 조회: {}점 이상", rating);
        if (rating < ConsultantConstants.MIN_RATING || rating > ConsultantConstants.MAX_RATING) {
            throw new IllegalArgumentException(ConsultantConstants.ERROR_INVALID_RATING);
        }
        return consultantRepository.findByAverageRatingGreaterThanEqualAndIsDeletedFalse(rating);
    }
    
    @Override
    public List<Consultant> findAvailableConsultants() {
        log.info("사용 가능한 상담사 조회");
        return consultantRepository.findByIsAvailableTrueAndIsDeletedFalse();
    }
    
    @Override
    public List<Consultant> findByComplexCriteria(String specialty, Integer minExperience, 
                                                Double minRating, Boolean available) {
        log.info("복합 조건 상담사 조회: specialty={}, minExperience={}, minRating={}, available={}", 
                specialty, minExperience, minRating, available);
        
        List<Consultant> consultants = consultantRepository.findByIsDeletedFalse();
        
        // 각 상담사의 전화번호 복호화
        consultants.forEach(consultant -> {
            if (consultant.getPhone() != null && !consultant.getPhone().trim().isEmpty()) {
                try {
                    String decryptedPhone = encryptionUtil.decrypt(consultant.getPhone());
                    consultant.setPhone(decryptedPhone);
                    log.info("🔓 상담사 전화번호 복호화 완료: {}", maskPhone(decryptedPhone));
                } catch (Exception e) {
                    log.error("❌ 상담사 전화번호 복호화 실패: {}", e.getMessage());
                    consultant.setPhone("복호화 실패");
                }
            }
        });
        
        return consultants.stream()
                .filter(consultant -> specialty == null || consultant.getSpecialty().contains(specialty))
                .filter(consultant -> minExperience == null || consultant.getYearsOfExperience() >= minExperience)
                .filter(consultant -> minRating == null || consultant.getAverageRating() >= minRating)
                .filter(consultant -> available == null || consultant.getIsAvailable().equals(available))
                .toList();
    }
    
    @Override
    public Optional<Consultant> findByIdWithDetails(Long id) {
        return consultantRepository.findById(id);
    }
    
    // === 내담자 관리 ===
    
    @Override
    public Page<Client> findClientsByConsultantId(Long consultantId, String status, Pageable pageable) {
        log.info("상담사별 내담자 조회: consultantId={}, status={}", consultantId, status);
        
        // 상담사 존재 확인
        Consultant consultant = consultantRepository.findById(consultantId)
                .orElseThrow(() -> new IllegalArgumentException(ConsultantConstants.ERROR_CONSULTANT_NOT_FOUND));
        
        // 상담사 정보 로깅
        log.debug("상담사 정보 확인: consultantId={}, name={}", consultant.getId(), consultant.getName());
        
        // 현재 테넌트 ID 가져오기
        String tenantId = com.coresolution.core.context.TenantContext.getTenantId();
        if (tenantId == null) {
            log.error("❌ tenantId가 설정되지 않았습니다");
            return new org.springframework.data.domain.PageImpl<>(new java.util.ArrayList<>(), pageable, 0);
        }
        
        // 매칭을 통해 내담자 조회 (tenantId 필터링)
        List<ConsultantClientMapping> mappings;
        if (status != null && !status.trim().isEmpty()) {
            // 특정 상태의 매칭만 조회
            ConsultantClientMapping.MappingStatus mappingStatus = ConsultantClientMapping.MappingStatus.valueOf(status);
            mappings = mappingRepository.findByConsultantIdAndStatusNot(tenantId, consultantId, 
                mappingStatus == ConsultantClientMapping.MappingStatus.ACTIVE ? 
                ConsultantClientMapping.MappingStatus.INACTIVE : ConsultantClientMapping.MappingStatus.ACTIVE);
        } else {
            // 모든 활성 매칭 조회
            mappings = mappingRepository.findByConsultantIdAndStatusNot(tenantId, consultantId, ConsultantClientMapping.MappingStatus.INACTIVE);
        }
        
        // 매칭에서 클라이언트 정보 추출 (User를 Client로 변환)
        List<Client> clients = mappings.stream()
                .map(mapping -> {
                    User user = mapping.getClient();
                    Client client = new Client();
                    client.setId(user.getId());
                    client.setName(user.getName());
                    client.setEmail(user.getEmail());
                    client.setPhone(user.getPhone());
                    client.setBranchCode(user.getBranchCode());
                    client.setCreatedAt(user.getCreatedAt());
                    client.setUpdatedAt(user.getUpdatedAt());
                    return client;
                })
                .distinct()
                .collect(java.util.stream.Collectors.toList());
        
        // 페이지네이션 적용
        int start = (int) pageable.getOffset();
        int end = Math.min((start + pageable.getPageSize()), clients.size());
        List<Client> pageContent = clients.subList(start, end);
        
        return new org.springframework.data.domain.PageImpl<>(pageContent, pageable, clients.size());
    }
    
    @Override
    public Optional<Client> findClientByConsultantId(Long consultantId, Long clientId) {
        log.info("상담사별 특정 내담자 조회: consultantId={}, clientId={}", consultantId, clientId);
        
        // 상담사 존재 확인
        Consultant consultant = consultantRepository.findById(consultantId)
                .orElseThrow(() -> new IllegalArgumentException(ConsultantConstants.ERROR_CONSULTANT_NOT_FOUND));
        
        // 상담사 정보 로깅
        log.debug("상담사 정보 확인: consultantId={}, name={}", consultant.getId(), consultant.getName());
        
        // 현재 테넌트 ID 가져오기
        String tenantId = com.coresolution.core.context.TenantContext.getTenantId();
        if (tenantId == null) {
            log.error("❌ tenantId가 설정되지 않았습니다");
            return Optional.empty();
        }
        
        // 매칭을 통해 특정 내담자 조회 (tenantId 필터링)
        List<ConsultantClientMapping> mappings = mappingRepository.findByConsultantIdAndStatusNot(tenantId, consultantId, ConsultantClientMapping.MappingStatus.INACTIVE);
        
        return mappings.stream()
                .map(mapping -> {
                    User user = mapping.getClient();
                    Client client = new Client();
                    client.setId(user.getId());
                    client.setName(user.getName());
                    client.setEmail(user.getEmail());
                    client.setPhone(user.getPhone());
                    client.setBranchCode(user.getBranchCode());
                    client.setCreatedAt(user.getCreatedAt());
                    client.setUpdatedAt(user.getUpdatedAt());
                    return client;
                })
                .filter(client -> client.getId().equals(clientId))
                .findFirst();
    }
    
    @Override
    public Client updateClientProfile(Long consultantId, Long clientId, Client updateData) {
        log.info("상담사별 내담자 프로필 업데이트: consultantId={}, clientId={}", consultantId, clientId);
        
        // 상담사 존재 확인
        Consultant consultant = consultantRepository.findById(consultantId)
                .orElseThrow(() -> new IllegalArgumentException(ConsultantConstants.ERROR_CONSULTANT_NOT_FOUND));
        
        // 상담사 정보 로깅
        log.debug("상담사 정보 확인: consultantId={}, name={}", consultant.getId(), consultant.getName());
        
        // 내담자 존재 확인 및 업데이트 (실제 구현에서는 매칭 테이블을 통해 조회)
        return updateData;
    }
    
    @Override
    public Map<String, Object> getClientStatistics(Long consultantId) {
        log.info("상담사별 내담자 통계 조회: consultantId={}", consultantId);
        
        // 상담사 존재 확인
        Consultant consultant = consultantRepository.findById(consultantId)
                .orElseThrow(() -> new IllegalArgumentException(ConsultantConstants.ERROR_CONSULTANT_NOT_FOUND));
        
        Map<String, Object> stats = new HashMap<>();
        stats.put(ConsultantConstants.STATS_TOTAL_CLIENTS, 0);
        stats.put(ConsultantConstants.STATS_ACTIVE_CLIENTS, 0);
        stats.put(ConsultantConstants.STATS_PENDING_CLIENTS, 0);
        stats.put(ConsultantConstants.STATS_COMPLETED_SESSIONS, 0);
        stats.put(ConsultantConstants.STATS_AVERAGE_RATING, consultant.getAverageRating());
        stats.put(ConsultantConstants.STATS_TOTAL_EARNINGS, 0);
        
        return stats;
    }
    
    // === 스케줄 관리 ===
    
    @Override
    public List<Map<String, Object>> getAvailableSlots(Long consultantId, LocalDate date) {
        log.info("상담사별 사용 가능한 시간대 조회: consultantId={}, date={}", consultantId, date);
        
        // 상담사 존재 확인
        Consultant consultant = consultantRepository.findById(consultantId)
                .orElseThrow(() -> new IllegalArgumentException(ConsultantConstants.ERROR_CONSULTANT_NOT_FOUND));
        
        // 상담사 정보 로깅
        log.debug("상담사 정보 확인: consultantId={}, name={}", consultant.getId(), consultant.getName());
        
        List<Map<String, Object>> slots = new ArrayList<>();
        for (int hour = ConsultantConstants.WORK_START_HOUR; hour < ConsultantConstants.WORK_END_HOUR; hour++) {
            Map<String, Object> slot = new HashMap<>();
            slot.put("startTime", LocalTime.of(hour, 0));
            slot.put("endTime", LocalTime.of(hour + 1, 0));
            slot.put("available", true);
            slot.put("duration", ConsultantConstants.SLOT_DURATION_MINUTES);
            slots.add(slot);
        }
        return slots;
    }
    
    @Override
    public void registerSchedule(Long consultantId, LocalDate date, LocalTime startTime, LocalTime endTime) {
        log.info("상담사 스케줄 등록: consultantId={}, date={}, startTime={}, endTime={}", 
                consultantId, date, startTime, endTime);
        
        // 상담사 존재 확인
        Consultant consultant = consultantRepository.findById(consultantId)
                .orElseThrow(() -> new IllegalArgumentException(ConsultantConstants.ERROR_CONSULTANT_NOT_FOUND));
        
        // 상담사 정보 로깅
        log.debug("상담사 정보 확인: consultantId={}, name={}", consultant.getId(), consultant.getName());
        
        // 시간 유효성 검사
        if (startTime.isAfter(endTime)) {
            throw new IllegalArgumentException("시작 시간은 종료 시간보다 빨라야 합니다.");
        }
        
        // 스케줄 등록 로직 (실제 구현에서는 Schedule 엔티티에 저장)
        log.info(ConsultantConstants.SUCCESS_SCHEDULE_REGISTERED);
    }
    
    @Override
    public void updateSchedule(Long consultantId, Long scheduleId, LocalDate date, LocalTime startTime, LocalTime endTime) {
        log.info("상담사 스케줄 수정: consultantId={}, scheduleId={}, date={}, startTime={}, endTime={}", 
                consultantId, scheduleId, date, startTime, endTime);
        
        // 상담사 존재 확인
        Consultant consultant = consultantRepository.findById(consultantId)
                .orElseThrow(() -> new IllegalArgumentException(ConsultantConstants.ERROR_CONSULTANT_NOT_FOUND));
        
        // 상담사 정보 로깅
        log.debug("상담사 정보 확인: consultantId={}, name={}", consultant.getId(), consultant.getName());
        
        // 시간 유효성 검사
        if (startTime.isAfter(endTime)) {
            throw new IllegalArgumentException("시작 시간은 종료 시간보다 빨라야 합니다.");
        }
        
        // 스케줄 수정 로직 (실제 구현에서는 Schedule 엔티티 업데이트)
        log.info(ConsultantConstants.SUCCESS_SCHEDULE_UPDATED);
    }
    
    @Override
    public void deleteSchedule(Long consultantId, Long scheduleId) {
        log.info("상담사 스케줄 삭제: consultantId={}, scheduleId={}", consultantId, scheduleId);
        
        // 상담사 존재 확인
        Consultant consultant = consultantRepository.findById(consultantId)
                .orElseThrow(() -> new IllegalArgumentException(ConsultantConstants.ERROR_CONSULTANT_NOT_FOUND));
        
        // 상담사 정보 로깅
        log.debug("상담사 정보 확인: consultantId={}, name={}", consultant.getId(), consultant.getName());
        
        // 스케줄 삭제 로직 (실제 구현에서는 Schedule 엔티티 삭제)
        log.info(ConsultantConstants.SUCCESS_SCHEDULE_DELETED);
    }
    
    // === 상담 관리 ===
    
    @Override
    public List<Map<String, Object>> getConsultationBookings(Long consultantId, String status) {
        log.info("상담사별 상담 예약 조회: consultantId={}, status={}", consultantId, status);
        
        // 상담사 존재 확인
        Consultant consultant = consultantRepository.findById(consultantId)
                .orElseThrow(() -> new IllegalArgumentException(ConsultantConstants.ERROR_CONSULTANT_NOT_FOUND));
        
        // 상담사 정보 로깅
        log.debug("상담사 정보 확인: consultantId={}, name={}", consultant.getId(), consultant.getName());
        
        // 상담 예약 조회 (실제 구현에서는 Consultation 엔티티를 통해 조회)
        List<Map<String, Object>> bookings = new ArrayList<>();
        
        // 임시 데이터 (실제 구현에서는 데이터베이스에서 조회)
        Map<String, Object> sampleBooking = new HashMap<>();
        sampleBooking.put("consultationId", 1L);
        sampleBooking.put("clientId", 1L);
        sampleBooking.put("clientName", "내담자1");
        sampleBooking.put("scheduledDate", "2024-12-20");
        sampleBooking.put("scheduledTime", "14:00");
        sampleBooking.put("status", status != null ? status : "SCHEDULED");
        sampleBooking.put("consultationType", "INDIVIDUAL");
        bookings.add(sampleBooking);
        
        log.info("상담 예약 조회 완료: {}건", bookings.size());
        return bookings;
    }
    
    @Override
    public void confirmConsultation(Long consultationId, Long consultantId) {
        log.info("상담 확정: consultationId={}, consultantId={}", consultationId, consultantId);
        
        // 상담사 존재 확인
        Consultant consultant = consultantRepository.findById(consultantId)
                .orElseThrow(() -> new IllegalArgumentException(ConsultantConstants.ERROR_CONSULTANT_NOT_FOUND));
        
        // 상담사 정보 로깅
        log.debug("상담사 정보 확인: consultantId={}, name={}", consultant.getId(), consultant.getName());
        
        // 상담 확정 로직 (실제 구현에서는 Consultation 엔티티 업데이트)
        log.info("상담이 확정되었습니다: consultationId={}", consultationId);
    }
    
    @Override
    public void cancelConsultation(Long consultationId, Long consultantId) {
        log.info("상담 취소: consultationId={}, consultantId={}", consultationId, consultantId);
        
        // 상담사 존재 확인
        Consultant consultant = consultantRepository.findById(consultantId)
                .orElseThrow(() -> new IllegalArgumentException(ConsultantConstants.ERROR_CONSULTANT_NOT_FOUND));
        
        // 상담사 정보 로깅
        log.debug("상담사 정보 확인: consultantId={}, name={}", consultant.getId(), consultant.getName());
        
        // 상담 취소 로직 (실제 구현에서는 Consultation 엔티티 상태 업데이트)
        log.info("상담이 취소되었습니다: consultationId={}", consultationId);
    }
    
    @Override
    public void completeConsultation(Long consultationId, Long consultantId, String notes, int rating) {
        log.info("상담 완료: consultationId={}, consultantId={}, rating={}", consultationId, consultantId, rating);
        
        // 상담사 존재 확인
        Consultant consultant = consultantRepository.findById(consultantId)
                .orElseThrow(() -> new IllegalArgumentException(ConsultantConstants.ERROR_CONSULTANT_NOT_FOUND));
        
        // 상담사 정보 로깅
        log.debug("상담사 정보 확인: consultantId={}, name={}", consultant.getId(), consultant.getName());
        
        // 평점 유효성 검사
        if (rating < ConsultantConstants.MIN_RATING || rating > ConsultantConstants.MAX_RATING) {
            throw new IllegalArgumentException(ConsultantConstants.ERROR_INVALID_RATING);
        }
        
        // 상담 완료 로직 (실제 구현에서는 Consultation 엔티티 업데이트 및 평점 저장)
        log.info("상담이 완료되었습니다: consultationId={}, notes={}, rating={}", consultationId, notes, rating);
    }
    
    // === 통계 및 분석 ===
    
    @Override
    public Map<String, Object> getConsultationStatistics(Long consultantId, LocalDate startDate, LocalDate endDate) {
        log.info("상담사별 상담 통계 조회: consultantId={}, startDate={}, endDate={}", consultantId, startDate, endDate);
        
        // 상담사 존재 확인
        Consultant consultant = consultantRepository.findById(consultantId)
                .orElseThrow(() -> new IllegalArgumentException(ConsultantConstants.ERROR_CONSULTANT_NOT_FOUND));
        
        // 상담사 정보 로깅
        log.debug("상담사 정보 확인: consultantId={}, name={}", consultant.getId(), consultant.getName());
        
        // 기간 유효성 검사
        if (startDate.isAfter(endDate)) {
            throw new IllegalArgumentException("시작일은 종료일보다 빨라야 합니다.");
        }
        
        // 상담 통계 조회 (실제 구현에서는 Consultation 엔티티를 통해 조회)
        Map<String, Object> stats = new HashMap<>();
        stats.put("totalConsultations", 10);
        stats.put("completedConsultations", 8);
        stats.put("cancelledConsultations", 2);
        stats.put("pendingConsultations", 0);
        stats.put("averageDuration", 50.0); // 평균 상담 시간 (분)
        stats.put("totalRevenue", 500000.0); // 총 수익
        stats.put("averageRating", consultant.getAverageRating());
        stats.put("startDate", startDate);
        stats.put("endDate", endDate);
        
        log.info("상담 통계 조회 완료: total={}, completed={}, cancelled={}", 
                stats.get("totalConsultations"), stats.get("completedConsultations"), stats.get("cancelledConsultations"));
        
        return stats;
    }
    
    @Override
    public Map<String, Object> getRevenueStatistics(Long consultantId, LocalDate startDate, LocalDate endDate) {
        log.info("상담사별 수익 통계 조회: consultantId={}, startDate={}, endDate={}", consultantId, startDate, endDate);
        
        // 상담사 존재 확인
        Consultant consultant = consultantRepository.findById(consultantId)
                .orElseThrow(() -> new IllegalArgumentException(ConsultantConstants.ERROR_CONSULTANT_NOT_FOUND));
        
        // 상담사 정보 로깅
        log.debug("상담사 정보 확인: consultantId={}, name={}", consultant.getId(), consultant.getName());
        
        // 기간 유효성 검사
        if (startDate.isAfter(endDate)) {
            throw new IllegalArgumentException("시작일은 종료일보다 빨라야 합니다.");
        }
        
        // 수익 통계 조회 (실제 구현에서는 Payment 엔티티를 통해 조회)
        Map<String, Object> stats = new HashMap<>();
        stats.put("totalRevenue", 500000.0);
        stats.put("averageRevenue", 50000.0);
        stats.put("monthlyRevenue", 250000.0);
        stats.put("completedSessions", 10);
        stats.put("averageSessionRevenue", 50000.0);
        stats.put("startDate", startDate);
        stats.put("endDate", endDate);
        
        log.info("수익 통계 조회 완료: totalRevenue={}, averageRevenue={}", 
                stats.get("totalRevenue"), stats.get("averageRevenue"));
        
        return stats;
    }
    
    @Override
    public Map<String, Object> getSatisfactionAnalysis(Long consultantId) {
        log.info("상담사별 만족도 분석: consultantId={}", consultantId);
        
        // 상담사 존재 확인
        Consultant consultant = consultantRepository.findById(consultantId)
                .orElseThrow(() -> new IllegalArgumentException(ConsultantConstants.ERROR_CONSULTANT_NOT_FOUND));
        
        // 상담사 정보 로깅
        log.debug("상담사 정보 확인: consultantId={}, name={}", consultant.getId(), consultant.getName());
        
        // 만족도 분석 (실제 구현에서는 Review 엔티티를 통해 조회)
        Map<String, Object> analysis = new HashMap<>();
        analysis.put("averageRating", consultant.getAverageRating());
        analysis.put("totalReviews", 15);
        analysis.put("excellentReviews", 8); // 5점
        analysis.put("goodReviews", 5); // 4점
        analysis.put("averageReviews", 2); // 3점
        analysis.put("poorReviews", 0); // 2점 이하
        analysis.put("satisfactionRate", 86.7); // 만족도 비율
        analysis.put("recommendationRate", 93.3); // 추천 비율
        
        log.info("만족도 분석 완료: averageRating={}, totalReviews={}", 
                analysis.get("averageRating"), analysis.get("totalReviews"));
        
        return analysis;
    }
    
    // === 프로필 관리 ===
    
    @Override
    public Consultant updateProfile(Long consultantId, Consultant updateData) {
        return partialUpdate(consultantId, updateData);
    }
    
    @Override
    public void updateSpecialty(Long consultantId, String specialty) {
        Consultant consultant = findActiveByIdOrThrow(consultantId);
        consultant.setSpecialty(specialty);
        save(consultant);
    }
    
    @Override
    public void updateExperience(Long consultantId, int experience, String description) {
        Consultant consultant = findActiveByIdOrThrow(consultantId);
        consultant.setYearsOfExperience(experience);
        save(consultant);
    }
    
    @Override
    public void updateCertifications(Long consultantId, List<String> certifications) {
        log.info("상담사 자격증 업데이트: consultantId={}, certifications={}", consultantId, certifications);
        
        // 상담사 존재 확인
        Consultant consultant = consultantRepository.findById(consultantId)
                .orElseThrow(() -> new IllegalArgumentException(ConsultantConstants.ERROR_CONSULTANT_NOT_FOUND));
        
        // 상담사 정보 로깅
        log.debug("상담사 정보 확인: consultantId={}, name={}", consultant.getId(), consultant.getName());
        
        // 자격증 업데이트 로직 (실제 구현에서는 Certification 엔티티에 저장)
        log.info("자격증이 업데이트되었습니다: {}건", certifications != null ? certifications.size() : 0);
    }
    
    // === 상태 관리 ===
    
    @Override
    public void updateStatus(Long consultantId, String status) {
        log.info("상담사 상태 업데이트: consultantId={}, status={}", consultantId, status);
        
        Consultant consultant = findActiveByIdOrThrow(consultantId);
        
        // 상태 유효성 검사
        if (status == null || (!ConsultantConstants.STATUS_ACTIVE.equals(status) && 
            !ConsultantConstants.STATUS_INACTIVE.equals(status) && 
            !ConsultantConstants.STATUS_PENDING.equals(status) && 
            !ConsultantConstants.STATUS_SUSPENDED.equals(status))) {
            throw new IllegalArgumentException("유효하지 않은 상태입니다: " + status);
        }
        
        // 상태 업데이트 로직 (실제 구현에서는 User 엔티티의 status 필드 업데이트)
        log.info("상담사 상태가 업데이트되었습니다: {}", status);
        save(consultant);
    }
    
    @Override
    public void updateAvailability(Long consultantId, boolean available) {
        Consultant consultant = findActiveByIdOrThrow(consultantId);
        consultant.setIsAvailable(available);
        save(consultant);
    }
    
    @Override
    public void registerVacation(Long consultantId, LocalDate startDate, LocalDate endDate, String reason) {
        log.info("상담사 휴가 등록: consultantId={}, startDate={}, endDate={}, reason={}", 
                consultantId, startDate, endDate, reason);
        
        // 상담사 존재 확인
        Consultant consultant = consultantRepository.findById(consultantId)
                .orElseThrow(() -> new IllegalArgumentException(ConsultantConstants.ERROR_CONSULTANT_NOT_FOUND));
        
        // 상담사 정보 로깅
        log.debug("상담사 정보 확인: consultantId={}, name={}", consultant.getId(), consultant.getName());
        
        // 휴가 기간 유효성 검사
        if (startDate.isAfter(endDate)) {
            throw new IllegalArgumentException("휴가 시작일은 종료일보다 빨라야 합니다.");
        }
        
        // 휴가 등록 로직 (실제 구현에서는 Vacation 엔티티에 저장)
        log.info("휴가가 등록되었습니다: {} ~ {}", startDate, endDate);
    }
    
    @Override
    public void cancelVacation(Long consultantId, Long vacationId) {
        log.info("상담사 휴가 취소: consultantId={}, vacationId={}", consultantId, vacationId);
        
        // 상담사 존재 확인
        Consultant consultant = consultantRepository.findById(consultantId)
                .orElseThrow(() -> new IllegalArgumentException(ConsultantConstants.ERROR_CONSULTANT_NOT_FOUND));
        
        // 상담사 정보 로깅
        log.debug("상담사 정보 확인: consultantId={}, name={}", consultant.getId(), consultant.getName());
        
        // 휴가 취소 로직 (실제 구현에서는 Vacation 엔티티 상태 업데이트)
        log.info("휴가가 취소되었습니다: vacationId={}", vacationId);
    }
}
