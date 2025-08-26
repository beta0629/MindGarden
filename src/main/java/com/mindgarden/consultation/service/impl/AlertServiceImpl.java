package com.mindgarden.consultation.service.impl;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import com.mindgarden.consultation.entity.Alert;
import com.mindgarden.consultation.repository.AlertRepository;
import com.mindgarden.consultation.service.AlertService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * AlertService 구현체 (간소화됨)
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2024-12-19
 */
@Service
@Transactional
public class AlertServiceImpl implements AlertService {
    
    @Autowired
    private AlertRepository alertRepository;
    
    // ==================== BaseService 구현 ====================
    
    @Override
    public Alert save(Alert alert) {
        if (alert.getId() == null) {
            alert.setCreatedAt(LocalDateTime.now());
            alert.setVersion(1L);
            if (alert.getStatus() == null) {
                alert.setStatus("UNREAD");
            }
            if (alert.getPriority() == null) {
                alert.setPriority("NORMAL");
            }
        }
        alert.setUpdatedAt(LocalDateTime.now());
        alert.setVersion(alert.getVersion() + 1);
        
        return alertRepository.save(alert);
    }
    
    @Override
    public List<Alert> saveAll(List<Alert> alerts) {
        alerts.forEach(alert -> {
            if (alert.getId() == null) {
                alert.setCreatedAt(LocalDateTime.now());
                alert.setVersion(1L);
                if (alert.getStatus() == null) {
                    alert.setStatus("UNREAD");
                }
                if (alert.getPriority() == null) {
                    alert.setPriority("NORMAL");
                }
            }
            alert.setUpdatedAt(LocalDateTime.now());
            alert.setVersion(alert.getVersion() + 1);
        });
        
        return alertRepository.saveAll(alerts);
    }
    
    @Override
    public Alert update(Alert alert) {
        Alert existingAlert = alertRepository.findById(alert.getId())
                .orElseThrow(() -> new RuntimeException("알림을 찾을 수 없습니다: " + alert.getId()));
        
        alert.setUpdatedAt(LocalDateTime.now());
        alert.setVersion(existingAlert.getVersion() + 1);
        
        return alertRepository.save(alert);
    }
    
    @Override
    public Alert partialUpdate(Long id, Alert updateData) {
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
        return alertRepository.findAllActive();
    }
    
    @Override
    public Optional<Alert> findActiveById(Long id) {
        return alertRepository.findActiveById(id);
    }
    
    @Override
    public Alert findActiveByIdOrThrow(Long id) {
        return alertRepository.findActiveById(id)
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
    public com.mindgarden.consultation.repository.BaseRepository<Alert, Long> getRepository() {
        return alertRepository;
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
