package com.coresolution.consultation.service.impl;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import com.coresolution.consultation.entity.Client;
import com.coresolution.consultation.repository.ClientRepository;
import com.coresolution.consultation.service.ClientService;
import com.coresolution.core.context.TenantContextHolder;
import com.coresolution.core.security.TenantAccessControlService;
import com.coresolution.core.service.impl.BaseTenantEntityServiceImpl;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 클라이언트 관리 서비스 구현체
 * BaseTenantEntityServiceImpl을 상속하여 테넌트 필터링 및 접근 제어 지원
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-11-18
 */
@Slf4j
@Service
@Transactional
public class ClientServiceImpl extends BaseTenantEntityServiceImpl<Client, Long> 
        implements ClientService {
    
    private final ClientRepository clientRepository;
    
    public ClientServiceImpl(
            ClientRepository clientRepository,
            TenantAccessControlService accessControlService) {
        super(clientRepository, accessControlService);
        this.clientRepository = clientRepository;
    }
    
    // ==================== BaseTenantEntityServiceImpl 추상 메서드 구현 ====================
    
    @Override
    protected Optional<Client> findEntityById(Long id) {
        String tenantId = TenantContextHolder.getTenantId();
        if (tenantId == null || tenantId.isEmpty()) {
            log.warn("findEntityById: 테넌트 컨텍스트 없음, 클라이언트 id={} 조회 생략", id);
            return Optional.empty();
        }
        // 활성 행만: 단건/목록 조회·findActiveById와 동일 정책(삭제된 내담자는 노출하지 않음)
        return clientRepository.findByTenantIdAndId(tenantId, id);
    }
    
    @Override
    protected List<Client> findEntitiesByTenantAndBranch(String tenantId, Long branchId) {
        // 표준화 2025-12-06: deprecated 메서드 대체 - branchId는 더 이상 사용하지 않음
        return clientRepository.findAllByTenantId(tenantId);
    }
    
    // ==================== BaseService 구현 메서드들 (BaseTenantEntityService 위임) ====================
    
    @Override
    public com.coresolution.consultation.repository.BaseRepository<Client, Long> getRepository() {
        return clientRepository;
    }
    
    @Override
    public Client update(String tenantId, Client entity) {
        if (restoreSoftDeletedClientRowIfNeeded(tenantId, entity.getId())
                && Boolean.TRUE.equals(entity.getIsDeleted())) {
            entity.setIsDeleted(false);
        }
        return super.update(tenantId, entity);
    }

    @Override
    public Client partialUpdate(String tenantId, Long id, Client updateData) {
        if (restoreSoftDeletedClientRowIfNeeded(tenantId, id)
                && Boolean.TRUE.equals(updateData.getIsDeleted())) {
            updateData.setIsDeleted(false);
        }
        return super.partialUpdate(tenantId, id, updateData);
    }

    @Override
    public Client create(String tenantId, Client entity) {
        if (entity.getId() == null) {
            throw new IllegalArgumentException(
                "Client의 id는 users.id와 동일해야 합니다. AdminService.registerClient를 사용하거나, User 저장 후 setId(user.getId())를 설정하세요.");
        }
        return super.create(tenantId, entity);
    }

    @Override
    public Client save(Client client) {
        if (client.getId() == null) {
            String tenantId = TenantContextHolder.getTenantId();
            if (tenantId != null) {
                return create(tenantId, client);
            }
            throw new IllegalArgumentException(
                "Client 저장 시 id(users.id와 일치)가 필요합니다. 테넌트 컨텍스트가 없으면 저장할 수 없습니다.");
        } else {
            // 기존 클라이언트 수정 시
            String tenantId = TenantContextHolder.getTenantId();
            if (tenantId != null && client.getTenantId() != null) {
                return update(tenantId, client);
            } else {
                String tenantForLoad = client.getTenantId() != null && !client.getTenantId().isEmpty()
                    ? client.getTenantId()
                    : TenantContextHolder.getRequiredTenantId();
                Client existingClient = clientRepository.findByTenantIdAndIdIncludingDeleted(tenantForLoad, client.getId())
                    .orElseThrow(() -> new RuntimeException("클라이언트를 찾을 수 없습니다: " + client.getId()));
                if (Boolean.TRUE.equals(existingClient.getIsDeleted())) {
                    existingClient.restore();
                    existingClient.setUpdatedAt(LocalDateTime.now());
                    clientRepository.save(existingClient);
                }
                if (Boolean.TRUE.equals(client.getIsDeleted())) {
                    client.setIsDeleted(false);
                }
                if (existingClient.getTenantId() != null) {
                    accessControlService.validateTenantAccess(existingClient.getTenantId());
                }
                return clientRepository.save(client);
            }
        }
    }
    
    @Override
    public List<Client> saveAll(List<Client> clients) {
        clients.forEach(client -> {
            if (client.getId() == null) {
                throw new IllegalArgumentException(
                    "Client 일괄 저장 시 각 행의 id(users.id와 일치)가 필요합니다.");
            }
            String tenantId = TenantContextHolder.getTenantId();
            if (tenantId != null && client.getTenantId() == null) {
                client.setTenantId(tenantId);
            }
        });
        return clientRepository.saveAll(clients);
    }
    
    @Override
    public Client update(Client client) {
        String tenantId = TenantContextHolder.getTenantId();
        if (tenantId != null && client.getTenantId() != null) {
            return update(tenantId, client);
        } else {
            String tenantForLoad = client.getTenantId() != null && !client.getTenantId().isEmpty()
                ? client.getTenantId()
                : TenantContextHolder.getRequiredTenantId();
            Client existingClient = clientRepository.findByTenantIdAndIdIncludingDeleted(tenantForLoad, client.getId())
                    .orElseThrow(() -> new RuntimeException("클라이언트를 찾을 수 없습니다: " + client.getId()));
            if (Boolean.TRUE.equals(existingClient.getIsDeleted())) {
                existingClient.restore();
                existingClient.setUpdatedAt(LocalDateTime.now());
                clientRepository.save(existingClient);
            }
            if (Boolean.TRUE.equals(client.getIsDeleted())) {
                client.setIsDeleted(false);
            }
            if (existingClient.getTenantId() != null) {
                accessControlService.validateTenantAccess(existingClient.getTenantId());
            }
            return clientRepository.save(client);
        }
    }
    
    @Override
    public Client partialUpdate(Long id, Client updateData) {
        String tenantId = TenantContextHolder.getRequiredTenantId();
        return partialUpdate(tenantId, id, updateData);
    }
    
    @Override
    public void softDeleteById(Long id) {
        String tenantId = TenantContextHolder.getRequiredTenantId();
        delete(tenantId, id);
    }
    
    @Override
    public void restoreById(Long id) {
        String tenantId = TenantContextHolder.getRequiredTenantId();
        clientRepository.findByTenantIdAndIdIncludingDeleted(tenantId, id)
                .orElseThrow(() -> new RuntimeException("클라이언트를 찾을 수 없습니다: " + id));
        accessControlService.validateTenantAccess(tenantId);
        clientRepository.restoreByIdAndTenantId(id, tenantId);
    }
    
    @Override
    public void hardDeleteById(Long id) {
        clientRepository.deleteById(id);
    }
    
    @Override
    public List<Client> findAllActive() {
        String tenantId = TenantContextHolder.getRequiredTenantId();
        return findAllByTenant(tenantId, null);
    }

    @Override
    public Optional<Client> findActiveById(Long id) {
        String tenantId = TenantContextHolder.getRequiredTenantId();
        return findByIdAndTenant(tenantId, id)
                .filter(c -> !c.getIsDeleted());
    }
    
    @Override
    public Client findActiveByIdOrThrow(Long id) {
        return findActiveById(id)
                .orElseThrow(() -> new RuntimeException("활성 클라이언트를 찾을 수 없습니다: " + id));
    }
    
    @Override
    public long countActive() {
        return clientRepository.countActive();
    }
    
    @Override
    public List<Client> findAllDeleted() {
        return clientRepository.findAllDeleted();
    }
    
    @Override
    public long countDeleted() {
        return clientRepository.countDeleted();
    }
    
    @Override
    public boolean existsActiveById(Long id) {
        return clientRepository.existsActiveById(id);
    }
    
    @Override
    public java.util.List<Client> findByCreatedAtBetween(java.time.LocalDateTime startDate, java.time.LocalDateTime endDate) {
        String tenantId = TenantContextHolder.getRequiredTenantId();
        return clientRepository.findByTenantIdAndCreatedAtBetween(tenantId, startDate, endDate);
    }
    
    @Override
    public java.util.List<Client> findByUpdatedAtBetween(java.time.LocalDateTime startDate, java.time.LocalDateTime endDate) {
        String tenantId = TenantContextHolder.getRequiredTenantId();
        return clientRepository.findByTenantIdAndUpdatedAtBetween(tenantId, startDate, endDate);
    }
    
    @Override
    public java.util.List<Client> findRecentActive(int limit) {
        String tenantId = TenantContextHolder.getRequiredTenantId();
        return clientRepository.findRecentActiveByTenantId(tenantId, org.springframework.data.domain.Pageable.ofSize(limit));
    }
    
    @Override
    public java.util.List<Client> findRecentlyUpdatedActive(int limit) {
        String tenantId = TenantContextHolder.getRequiredTenantId();
        return clientRepository.findRecentlyUpdatedActiveByTenantId(tenantId, org.springframework.data.domain.Pageable.ofSize(limit));
    }
    
    @Override
    public Object[] getEntityStatistics() {
        return clientRepository.getEntityStatistics();
    }
    
    @Override
    public void cleanupOldDeleted(java.time.LocalDateTime cutoffDate) {
        clientRepository.cleanupOldDeleted(cutoffDate);
    }
    
    @Override
    public boolean isDuplicateExcludingIdAll(Long excludeId, String fieldName, Object fieldValue, boolean includeDeleted) {
        return clientRepository.isDuplicateExcludingIdAll(excludeId, fieldName, fieldValue, includeDeleted);
    }
    
    @Override
    public java.util.Optional<Client> findByIdAndVersion(Long id, Long version) {
        String tenantId = TenantContextHolder.getRequiredTenantId();
        return clientRepository.findByTenantIdAndIdAndVersion(tenantId, id, version);
    }
    
    @Override
    public org.springframework.data.domain.Page<Client> findAllActive(org.springframework.data.domain.Pageable pageable) {
        String tenantId = TenantContextHolder.getRequiredTenantId();
        return clientRepository.findAllByTenantId(tenantId, pageable);
    }
    
    // ==================== ClientService 특화 메서드들 ====================
    
    @Override
    public Optional<Client> findByEmail(String email) {
        String tenantId = TenantContextHolder.getRequiredTenantId();
        return clientRepository.findByTenantIdAndEmailAndIsDeletedFalse(tenantId, email);
    }
    
    @Override
    public List<Client> findByNameContaining(String name) {
        String tenantId = TenantContextHolder.getRequiredTenantId();
        return clientRepository.findByTenantIdAndNameContaining(tenantId, name);
    }
    
    @Override
    public List<Client> findByPhoneContaining(String phone) {
        String tenantId = TenantContextHolder.getRequiredTenantId();
        return clientRepository.findByTenantIdAndPhoneContaining(tenantId, phone);
    }
    
    @Override
    public List<Client> findByGender(String gender) {
        String tenantId = TenantContextHolder.getRequiredTenantId();
        return clientRepository.findByTenantIdAndGender(tenantId, gender);
    }
    
    @Override
    public List<Client> findByPreferredLanguage(String language) {
        String tenantId = TenantContextHolder.getRequiredTenantId();
        return clientRepository.findByTenantIdAndPreferredLanguage(tenantId, language);
    }
    
    @Override
    public List<Client> findByIsEmergencyContact(Boolean isEmergencyContact) {
        String tenantId = TenantContextHolder.getRequiredTenantId();
        return clientRepository.findByTenantIdAndIsEmergencyContactAndIsDeletedFalse(tenantId, isEmergencyContact);
    }
    
    // ==================== 보조 메서드 ====================

    /**
     * 소프트 삭제된 clients 행이면 복구 후 저장. 이후 {@link #findEntityById}·상위 {@code update}가 활성 행을 볼 수 있게 함.
     *
     * @param tenantId 테넌트 ID
     * @param clientId 클라이언트 ID
     * @return 이번 호출에서 복구(save)를 수행했으면 true
     */
    private boolean restoreSoftDeletedClientRowIfNeeded(String tenantId, Long clientId) {
        if (tenantId == null || tenantId.isEmpty() || clientId == null) {
            return false;
        }
        Optional<Client> opt = clientRepository.findByTenantIdAndIdIncludingDeleted(tenantId, clientId);
        if (opt.isEmpty()) {
            return false;
        }
        Client row = opt.get();
        if (!Boolean.TRUE.equals(row.getIsDeleted())) {
            return false;
        }
        row.restore();
        row.setUpdatedAt(LocalDateTime.now());
        clientRepository.save(row);
        return true;
    }
    
    /**
     * Client 필드 복사 (부분 업데이트용)
     */
    private void copyClientFields(Client source, Client target) {
        if (source.getName() != null) {
            target.setName(source.getName());
        }
        if (source.getEmail() != null) {
            target.setEmail(source.getEmail());
        }
        if (source.getPhone() != null) {
            target.setPhone(source.getPhone());
        }
        if (source.getBirthDate() != null) {
            target.setBirthDate(source.getBirthDate());
        }
        if (source.getGender() != null) {
            target.setGender(source.getGender());
        }
        if (source.getAddress() != null) {
            target.setAddress(source.getAddress());
        }
        if (source.getEmergencyContact() != null) {
            target.setEmergencyContact(source.getEmergencyContact());
        }
        if (source.getEmergencyPhone() != null) {
            target.setEmergencyPhone(source.getEmergencyPhone());
        }
        if (source.getMedicalHistory() != null) {
            target.setMedicalHistory(source.getMedicalHistory());
        }
        if (source.getAllergies() != null) {
            target.setAllergies(source.getAllergies());
        }
        if (source.getMedications() != null) {
            target.setMedications(source.getMedications());
        }
        if (source.getPreferredLanguage() != null) {
            target.setPreferredLanguage(source.getPreferredLanguage());
        }
        if (source.getIsEmergencyContact() != null) {
            target.setIsEmergencyContact(source.getIsEmergencyContact());
        }
        if (source.getBranchCode() != null) {
            target.setBranchCode(source.getBranchCode());
        }
    }
    
    @Override
    protected void copyNonNullFields(Client source, Client target) {
        copyClientFields(source, target);
    }
}

