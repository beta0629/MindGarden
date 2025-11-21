package com.coresolution.consultation.controller;

import java.time.LocalDateTime;
import java.util.List;
import com.coresolution.consultation.entity.BaseEntity;
import com.coresolution.consultation.service.BaseService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;

/**
 * 모든 Controller의 기본 인터페이스
 * 공통 HTTP 처리 메서드 정의
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2024-12-19
 */
public interface BaseController<T extends BaseEntity, ID> {
    
    BaseService<T, ID> getService();
    
    @GetMapping
    default ResponseEntity<List<T>> getAllActive() {
        return ResponseEntity.ok(getService().findAllActive());
    }
    
    @GetMapping("/page")
    default ResponseEntity<Page<T>> getAllActivePaged(Pageable pageable) {
        return ResponseEntity.ok(getService().findAllActive(pageable));
    }
    
    @GetMapping("/{id}")
    default ResponseEntity<T> getActiveById(@PathVariable ID id) {
        return ResponseEntity.ok(getService().findActiveByIdOrThrow(id));
    }
    
    @GetMapping("/count")
    default ResponseEntity<Long> getActiveCount() {
        return ResponseEntity.ok(getService().countActive());
    }
    
    @PostMapping
    default ResponseEntity<T> create(@RequestBody T entity) {
        return ResponseEntity.status(HttpStatus.CREATED).body(getService().save(entity));
    }
    
    @PostMapping("/batch")
    default ResponseEntity<List<T>> createBatch(@RequestBody List<T> entities) {
        return ResponseEntity.status(HttpStatus.CREATED).body(getService().saveAll(entities));
    }
    
    @PutMapping("/{id}")
    default ResponseEntity<T> update(@PathVariable ID id, @RequestBody T entity) {
        entity.setId((Long) id);
        return ResponseEntity.ok(getService().update(entity));
    }
    
    @PatchMapping("/{id}")
    default ResponseEntity<T> partialUpdate(@PathVariable ID id, @RequestBody T updateData) {
        updateData.setId((Long) id);
        return ResponseEntity.ok(getService().partialUpdate(id, updateData));
    }
    
    @DeleteMapping("/{id}")
    default ResponseEntity<Void> softDelete(@PathVariable ID id) {
        getService().softDeleteById(id);
        return ResponseEntity.noContent().build();
    }
    
    @PostMapping("/{id}/restore")
    default ResponseEntity<Void> restore(@PathVariable ID id) {
        getService().restoreById(id);
        return ResponseEntity.ok().build();
    }
    
    @DeleteMapping("/{id}/hard")
    default ResponseEntity<Void> hardDelete(@PathVariable ID id) {
        getService().hardDeleteById(id);
        return ResponseEntity.noContent().build();
    }
    
    @GetMapping("/deleted")
    default ResponseEntity<List<T>> getAllDeleted() {
        return ResponseEntity.ok(getService().findAllDeleted());
    }
    
    @GetMapping("/deleted/count")
    default ResponseEntity<Long> getDeletedCount() {
        return ResponseEntity.ok(getService().countDeleted());
    }
    
    @GetMapping("/created-between")
    default ResponseEntity<List<T>> getByCreatedAtBetween(
            @RequestParam LocalDateTime startDate, 
            @RequestParam LocalDateTime endDate) {
        return ResponseEntity.ok(getService().findByCreatedAtBetween(startDate, endDate));
    }
    
    @GetMapping("/updated-between")
    default ResponseEntity<List<T>> getByUpdatedAtBetween(
            @RequestParam LocalDateTime startDate, 
            @RequestParam LocalDateTime endDate) {
        return ResponseEntity.ok(getService().findByUpdatedAtBetween(startDate, endDate));
    }
    
    @GetMapping("/recent")
    default ResponseEntity<List<T>> getRecentActive(@RequestParam(defaultValue = "10") int limit) {
        return ResponseEntity.ok(getService().findRecentActive(limit));
    }
    
    @GetMapping("/recent-updated")
    default ResponseEntity<List<T>> getRecentlyUpdatedActive(@RequestParam(defaultValue = "10") int limit) {
        return ResponseEntity.ok(getService().findRecentlyUpdatedActive(limit));
    }
    

    

    
    @GetMapping("/statistics")
    default ResponseEntity<Object[]> getStatistics() {
        return ResponseEntity.ok(getService().getEntityStatistics());
    }
    
    @DeleteMapping("/cleanup")
    default ResponseEntity<Void> cleanupOldDeleted(@RequestParam LocalDateTime cutoffDate) {
        getService().cleanupOldDeleted(cutoffDate);
        return ResponseEntity.noContent().build();
    }
    
    @GetMapping("/duplicate-check")
    default ResponseEntity<Boolean> checkDuplicate(
            @RequestParam(required = false) ID excludeId,
            @RequestParam String fieldName,
            @RequestParam Object fieldValue,
            @RequestParam(defaultValue = "false") boolean includeDeleted) {
        boolean isDuplicate = getService().isDuplicateExcludingIdAll(excludeId, fieldName, fieldValue, includeDeleted);
        return ResponseEntity.ok(isDuplicate);
    }
    
    @GetMapping("/{id}/exists")
    default ResponseEntity<Boolean> exists(@PathVariable ID id) {
        boolean exists = getService().existsActiveById(id);
        return ResponseEntity.ok(exists);
    }
    
    @GetMapping("/{id}/version/{version}")
    default ResponseEntity<T> getByIdAndVersion(@PathVariable ID id, @PathVariable Long version) {
        return getService().findByIdAndVersion(id, version)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
}
