package com.coresolution.consultation.service.impl;

import java.util.List;
import java.util.Optional;
import com.coresolution.consultation.entity.Client;
import com.coresolution.consultation.repository.ClientRepository;
import com.coresolution.consultation.service.ClientService;
import com.coresolution.core.context.TenantContextHolder;
import com.coresolution.core.security.TenantAccessControlService;
import com.coresolution.core.service.impl.BaseTenantEntityServiceImpl;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
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
        return clientRepository.findById(id);
    }
    
    @Override
    protected List<Client> findEntitiesByTenantAndBranch(String tenantId, Long branchId) {
        if (branchId != null) {
            return clientRepository.findAllByTenantIdAndBranchId(tenantId, branchId);
        } else {
            return clientRepository.findAllByTenantId(tenantId);
        }
    }
    
    // ==================== BaseService 구현 메서드들 (BaseTenantEntityService 위임) ====================
    
    @Override
    public com.coresolution.consultation.repository.BaseRepository<Client, Long> getRepository() {
        return clientRepository;
    }
    
    @Override
    public Client save(Client client) {
        if (client.getId() == null) {
            // 새 클라이언트 생성 시
            String tenantId = TenantContextHolder.getTenantId();
            if (tenantId != null) {
                return create(tenantId, client);
            } else {
                // 테넌트 컨텍스트가 없으면 기존 방식 사용 (하위 호환성)
                return clientRepository.save(client);
            }
        } else {
            // 기존 클라이언트 수정 시
            String tenantId = TenantContextHolder.getTenantId();
            if (tenantId != null && client.getTenantId() != null) {
                return update(tenantId, client);
            } else {
                // 테넌트 컨텍스트가 없으면 기존 방식 사용 (하위 호환성)
                if (client.getTenantId() != null) {
                    accessControlService.validateTenantAccess(client.getTenantId());
                }
                return clientRepository.save(client);
            }
        }
    }
    
    @Override
    public List<Client> saveAll(List<Client> clients) {
        clients.forEach(client -> {
            if (client.getId() == null) {
                String tenantId = TenantContextHolder.getTenantId();
                if (tenantId != null && client.getTenantId() == null) {
                    client.setTenantId(tenantId);
                }
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
            // 테넌트 컨텍스트가 없으면 기존 방식 사용 (하위 호환성)
            Client existingClient = clientRepository.findById(client.getId())
                    .orElseThrow(() -> new RuntimeException("클라이언트를 찾을 수 없습니다: " + client.getId()));
            
            if (existingClient.getTenantId() != null) {
                accessControlService.validateTenantAccess(existingClient.getTenantId());
            }
            
            return clientRepository.save(client);
        }
    }
    
    @Override
    public Client partialUpdate(Long id, Client updateData) {
        String tenantId = TenantContextHolder.getTenantId();
        if (tenantId != null) {
            return partialUpdate(tenantId, id, updateData);
        } else {
            // 테넌트 컨텍스트가 없으면 기존 방식 사용 (하위 호환성)
            Client existingClient = clientRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("클라이언트를 찾을 수 없습니다: " + id));
            
            if (existingClient.getTenantId() != null) {
                accessControlService.validateTenantAccess(existingClient.getTenantId());
            }
            
            // 부분 업데이트
            copyClientFields(updateData, existingClient);
            return clientRepository.save(existingClient);
        }
    }
    
    @Override
    public void softDeleteById(Long id) {
        String tenantId = TenantContextHolder.getTenantId();
        if (tenantId != null) {
            delete(tenantId, id);
        } else {
            // 테넌트 컨텍스트가 없으면 기존 방식 사용 (하위 호환성)
            Client client = clientRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("클라이언트를 찾을 수 없습니다: " + id));
            
            if (client.getTenantId() != null) {
                accessControlService.validateTenantAccess(client.getTenantId());
            }
            
            client.setIsDeleted(true);
            clientRepository.save(client);
        }
    }
    
    @Override
    public void restoreById(Long id) {
        Client client = clientRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("클라이언트를 찾을 수 없습니다: " + id));
        
        client.setIsDeleted(false);
        client.setDeletedAt(null);
        clientRepository.save(client);
    }
    
    @Override
    public void hardDeleteById(Long id) {
        clientRepository.deleteById(id);
    }
    
    @Override
    public List<Client> findAllActive() {
        String tenantId = TenantContextHolder.getTenantId();
        if (tenantId != null) {
            return findAllByTenant(tenantId, null);
        }
        return clientRepository.findAllActiveByCurrentTenant();
    }
    
    @Override
    public Optional<Client> findActiveById(Long id) {
        String tenantId = TenantContextHolder.getTenantId();
        if (tenantId != null) {
            return findByIdAndTenant(tenantId, id)
                    .filter(c -> !c.getIsDeleted());
        }
        return clientRepository.findActiveById(id);
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
        return clientRepository.findByCreatedAtBetween(startDate, endDate);
    }
    
    @Override
    public java.util.List<Client> findByUpdatedAtBetween(java.time.LocalDateTime startDate, java.time.LocalDateTime endDate) {
        return clientRepository.findByUpdatedAtBetween(startDate, endDate);
    }
    
    @Override
    public java.util.List<Client> findRecentActive(int limit) {
        return clientRepository.findRecentActive(limit);
    }
    
    @Override
    public java.util.List<Client> findRecentlyUpdatedActive(int limit) {
        return clientRepository.findRecentlyUpdatedActive(limit);
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
        return clientRepository.findByIdAndVersion(id, version);
    }
    
    @Override
    public org.springframework.data.domain.Page<Client> findAllActive(org.springframework.data.domain.Pageable pageable) {
        String tenantId = TenantContextHolder.getTenantId();
        if (tenantId != null) {
            // BaseRepository의 findAllByTenantId 메서드 사용
            return clientRepository.findAllByTenantId(tenantId, pageable);
        }
        return clientRepository.findAllActive(pageable);
    }
    
    // ==================== ClientService 특화 메서드들 ====================
    
    @Override
    public Optional<Client> findByEmail(String email) {
        return clientRepository.findByEmailAndIsDeletedFalse(email);
    }
    
    @Override
    public List<Client> findByNameContaining(String name) {
        return clientRepository.findByNameContaining(name);
    }
    
    @Override
    public List<Client> findByPhoneContaining(String phone) {
        return clientRepository.findByPhoneContaining(phone);
    }
    
    @Override
    public List<Client> findByGender(String gender) {
        return clientRepository.findByGender(gender);
    }
    
    @Override
    public List<Client> findByPreferredLanguage(String language) {
        return clientRepository.findByPreferredLanguage(language);
    }
    
    @Override
    public List<Client> findByIsEmergencyContact(Boolean isEmergencyContact) {
        return clientRepository.findByIsEmergencyContactAndIsDeletedFalse(isEmergencyContact);
    }
    
    // ==================== 보조 메서드 ====================
    
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

