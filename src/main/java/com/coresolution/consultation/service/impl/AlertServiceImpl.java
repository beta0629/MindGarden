package com.coresolution.consultation.service.impl;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import com.coresolution.consultation.entity.Alert;
import com.coresolution.consultation.repository.AlertRepository;
import com.coresolution.consultation.service.AlertService;
import com.coresolution.core.context.TenantContextHolder;
import com.coresolution.core.security.TenantAccessControlService;
import com.coresolution.core.service.impl.BaseTenantEntityServiceImpl;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import lombok.extern.slf4j.Slf4j;

/**
 * AlertService 구현체
 * BaseTenantEntityServiceImpl을 상속하여 테넌트 필터링 및 접근 제어 지원
 * 
 * @author CoreSolution
 * @version 2.0.0
 * @since 2024-12-19
 */
@Slf4j
@Service
@Transactional
public class AlertServiceImpl extends BaseTenantEntityServiceImpl<Alert, Long> 
        implements AlertService {
    
    private final AlertRepository alertRepository;
    
    public AlertServiceImpl(
            AlertRepository alertRepository,
            TenantAccessControlService accessControlService) {
        super(alertRepository, accessControlService);
        this.alertRepository = alertRepository;
    }
    
    // ==================== BaseTenantEntityServiceImpl 추상 메서드 구현 ====================
    
    @Override
    protected Optional<Alert> findEntityById(Long id) {
        return alertRepository.findById(id);
    }
    
    @Override
    protected List<Alert> findEntitiesByTenantAndBranch(String tenantId, Long branchId) {
        if (branchId != null) {
            return alertRepository.findAllByTenantIdAndBranchId(tenantId, branchId);
        } else {
            return alertRepository.findAllByTenantId(tenantId);
        }
    }
    
    // ==================== BaseService 구현 메서드 (BaseTenantEntityService 위임) ====================
    
    @Override
    public com.coresolution.consultation.repository.BaseRepository<Alert, Long> getRepository() {
        return alertRepository;
    }
    
    // ==================== BaseService 구현 (BaseTenantEntityService 위임) ====================
    
    @Override
    public Alert save(Alert alert) {
        // BaseTenantEntityService의 create 또는 update 메서드 사용
        String tenantId = TenantContextHolder.getTenantId();
        if (alert.getId() == null) {
            // 새 알림 생성
            if (alert.getStatus() == null) {
                alert.setStatus("UNREAD");
            }
            if (alert.getPriority() == null) {
                alert.setPriority("NORMAL");
            }
            if (tenantId != null) {
                return create(tenantId, alert);
            }
        } else {
            // 기존 알림 업데이트
            if (tenantId != null && alert.getTenantId() != null) {
                return update(tenantId, alert);
            }
        }
        // 테넌트 컨텍스트가 없으면 기존 방식 사용 (하위 호환성)
        if (alert.getId() == null) {
            alert.setCreatedAt(LocalDateTime.now());
            alert.setVersion(1L);
        }
        alert.setUpdatedAt(LocalDateTime.now());
        if (alert.getVersion() != null) {
            alert.setVersion(alert.getVersion() + 1);
        }
        return alertRepository.save(alert);
    }
    
    @Override
    public List<Alert> saveAll(List<Alert> alerts) {
        // BaseTenantEntityService는 saveAll을 제공하지 않으므로 개별 처리
        return alerts.stream()
                .map(this::save)
                .collect(java.util.stream.Collectors.toList());
    }
    
    @Override
    public Alert update(Alert alert) {
        // BaseTenantEntityService의 update 메서드 사용
        String tenantId = TenantContextHolder.getTenantId();
        if (tenantId != null && alert.getTenantId() != null) {
            return update(tenantId, alert);
        }
        // 테넌트 컨텍스트가 없으면 기존 방식 사용 (하위 호환성)
        Alert existingAlert = alertRepository.findById(alert.getId())
                .orElseThrow(() -> new RuntimeException("알림을 찾을 수 없습니다: " + alert.getId()));
        alert.setUpdatedAt(LocalDateTime.now());
        alert.setVersion(existingAlert.getVersion() + 1);
        return alertRepository.save(alert);
    }
    
    @Override
    public Alert partialUpdate(Long id, Alert updateData) {
        // BaseTenantEntityService의 partialUpdate 메서드 사용
        String tenantId = TenantContextHolder.getTenantId();
        if (tenantId != null) {
            return partialUpdate(tenantId, id, updateData);
        }
        // 테넌트 컨텍스트가 없으면 기존 방식 사용 (하위 호환성)
        Alert existingAlert = alertRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("알림을 찾을 수 없습니다: " + id));
        
        if (updateData.getTitle() != null) {
            existingAlert.setTitle(updateData.getTitle());
        }
        if (updateData.getContent() != null) {
            existingAlert.setContent(updateData.getContent());
        }
        if (updateData.getStatus() != null) {
            existingAlert.setStatus(updateData.getStatus());
        }
        if (updateData.getPriority() != null) {
            existingAlert.setPriority(updateData.getPriority());
        }
        if (updateData.getType() != null) {
            existingAlert.setType(updateData.getType());
        }
        
        existingAlert.setUpdatedAt(LocalDateTime.now());
        existingAlert.setVersion(existingAlert.getVersion() + 1);
        
        return alertRepository.save(existingAlert);
    }
    
    @Override
    public void softDeleteById(Long id) {
        // BaseTenantEntityService의 delete 메서드 사용
        String tenantId = TenantContextHolder.getTenantId();
        if (tenantId != null) {
            delete(tenantId, id);
            return;
        }
        // 테넌트 컨텍스트가 없으면 기존 방식 사용 (하위 호환성)
        Alert alert = alertRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("알림을 찾을 수 없습니다: " + id));
        
        alert.setIsDeleted(true);
        alert.setDeletedAt(LocalDateTime.now());
        alert.setUpdatedAt(LocalDateTime.now());
        alert.setVersion(alert.getVersion() + 1);
        
        alertRepository.save(alert);
    }
    
    @Override
    public void restoreById(Long id) {
        Alert alert = alertRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("알림을 찾을 수 없습니다: " + id));
        
        alert.setIsDeleted(false);
        alert.setDeletedAt(null);
        alert.setUpdatedAt(LocalDateTime.now());
        alert.setVersion(alert.getVersion() + 1);
        
        alertRepository.save(alert);
    }
    
    @Override
    public void hardDeleteById(Long id) {
        alertRepository.deleteById(id);
    }
    
    @Override
    public List<Alert> findAllActive() {
        String tenantId = TenantContextHolder.getTenantId();
        if (tenantId != null) {
            return findAllByTenant(tenantId, null);
        }
        return alertRepository.findAllActiveByCurrentTenant();
    }
    
    @Override
    public Optional<Alert> findActiveById(Long id) {
        String tenantId = TenantContextHolder.getTenantId();
        if (tenantId != null) {
            return findByIdAndTenant(tenantId, id).filter(a -> !a.getIsDeleted());
        }
        return alertRepository.findActiveById(id);
    }
    
    @Override
    public Alert findActiveByIdOrThrow(Long id) {
        return findActiveById(id)
                .orElseThrow(() -> new RuntimeException("활성 알림을 찾을 수 없습니다: " + id));
    }
    
    @Override
    public long countActive() {
        return alertRepository.countActive();
    }
    
    @Override
    public List<Alert> findAllDeleted() {
        return alertRepository.findAllDeleted();
    }
    
    @Override
    public long countDeleted() {
        return alertRepository.countDeleted();
    }
    
    @Override
    public boolean existsActiveById(Long id) {
        return alertRepository.existsActiveById(id);
    }
    
    @Override
    public Optional<Alert> findByIdAndVersion(Long id, Long version) {
        return alertRepository.findByIdAndVersion(id, version);
    }
    
    @Override
    public Object[] getEntityStatistics() {
        return alertRepository.getEntityStatistics();
    }
    
    @Override
    public void cleanupOldDeleted(LocalDateTime cutoffDate) {
        alertRepository.cleanupOldDeleted(cutoffDate);
    }
    
    @Override
    public org.springframework.data.domain.Page<Alert> findAllActive(org.springframework.data.domain.Pageable pageable) {
        String tenantId = TenantContextHolder.getTenantId();
        if (tenantId != null) {
            return alertRepository.findAllByTenantId(tenantId, pageable);
        }
        return alertRepository.findAllActive(pageable);
    }
    
    @Override
    public List<Alert> findRecentActive(int limit) {
        return alertRepository.findRecentActive(limit);
    }
    
    @Override
    public List<Alert> findRecentlyUpdatedActive(int limit) {
        return alertRepository.findRecentlyUpdatedActive(limit);
    }
    
    @Override
    public List<Alert> findByCreatedAtBetween(java.time.LocalDateTime startDate, java.time.LocalDateTime endDate) {
        return alertRepository.findByCreatedAtBetween(startDate, endDate);
    }
    
    @Override
    public List<Alert> findByUpdatedAtBetween(java.time.LocalDateTime startDate, java.time.LocalDateTime endDate) {
        return alertRepository.findByUpdatedAtBetween(startDate, endDate);
    }
    
    @Override
    public boolean isDuplicateExcludingIdAll(Long excludeId, String fieldName, Object fieldValue, boolean includeDeleted) {
        return alertRepository.isDuplicateExcludingIdAll(excludeId, fieldName, fieldValue, includeDeleted);
    }
    
    // ==================== AlertService 특화 메서드 ====================
    
    @Override
    public List<Alert> findByUserId(Long userId) {
        return alertRepository.findByUserId(userId);
    }
    
    @Override
    public List<Alert> findUnreadByUserId(Long userId) {
        return alertRepository.findUnreadByUserId(userId);
    }
    
    @Override
    public List<Alert> findReadByUserId(Long userId) {
        return alertRepository.findReadByUserId(userId);
    }
    
    @Override
    public List<Alert> findByType(String type) {
        return alertRepository.findByType(type);
    }
    
    @Override
    public List<Alert> findByPriority(String priority) {
        return alertRepository.findByPriority(priority);
    }
    
    @Override
    public List<Alert> findByStatus(String status) {
        return alertRepository.findByStatus(status);
    }
    
    @Override
    public void markAsRead(Long alertId) {
        Alert alert = findActiveByIdOrThrow(alertId);
        alert.setStatus("READ");
        alert.setReadAt(LocalDateTime.now());
        
        save(alert);
    }
    
    @Override
    public void markAllAsRead(Long userId) {
        List<Alert> unreadAlerts = findUnreadByUserId(userId);
        unreadAlerts.forEach(alert -> {
            alert.setStatus("READ");
            alert.setReadAt(LocalDateTime.now());
        });
        alertRepository.saveAll(unreadAlerts);
    }
    
    @Override
    public void archiveAlert(Long alertId) {
        Alert alert = findActiveByIdOrThrow(alertId);
        alert.setStatus("ARCHIVED");
        alert.setArchivedAt(LocalDateTime.now());
        
        save(alert);
    }
    
    @Override
    public void dismissAlert(Long alertId) {
        Alert alert = findActiveByIdOrThrow(alertId);
        alert.setStatus("DISMISSED");
        
        save(alert);
    }
    
    @Override
    public void setSticky(Long alertId) {
        Alert alert = findActiveByIdOrThrow(alertId);
        alert.setIsSticky(true);
        
        save(alert);
    }
    
    @Override
    public void changePriority(Long alertId, String newPriority) {
        Alert alert = findActiveByIdOrThrow(alertId);
        alert.setPriority(newPriority);
        
        save(alert);
    }
    
    @Override
    public void changeStatus(Long alertId, String newStatus) {
        Alert alert = findActiveByIdOrThrow(alertId);
        alert.setStatus(newStatus);
        
        switch (newStatus) {
            case "READ":
                alert.setReadAt(LocalDateTime.now());
                break;
            case "ARCHIVED":
                alert.setArchivedAt(LocalDateTime.now());
                break;
        }
        
        save(alert);
    }
    
    @Override
    public Alert updateAlertContent(Long alertId, String title, String content) {
        Alert alert = findActiveByIdOrThrow(alertId);
        alert.setTitle(title);
        alert.setContent(content);
        
        return save(alert);
    }
}
