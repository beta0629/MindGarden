package com.coresolution.core.repository.academy;

import com.coresolution.core.domain.academy.AcademySettlementItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * 학원 정산 항목 Repository
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-11-24
 */
@Repository
public interface AcademySettlementItemRepository extends JpaRepository<AcademySettlementItem, Long> {
    
    /**
     * settlement_item_id로 조회
     */
    Optional<AcademySettlementItem> findBySettlementItemIdAndIsDeletedFalse(String settlementItemId);
    
    /**
     * settlement_id로 조회
     */
    List<AcademySettlementItem> findBySettlementIdAndIsDeletedFalse(String settlementId);
    
    /**
     * tenant_id로 조회 (삭제되지 않은 것만)
     */
    List<AcademySettlementItem> findByTenantIdAndIsDeletedFalse(String tenantId);
    
    /**
     * tenant_id와 branch_id로 조회
     */
    List<AcademySettlementItem> findByTenantIdAndBranchIdAndIsDeletedFalse(String tenantId, Long branchId);
    
    /**
     * item_type과 item_id로 조회
     */
    List<AcademySettlementItem> findBySettlementIdAndItemTypeAndItemIdAndIsDeletedFalse(
        String settlementId, AcademySettlementItem.ItemType itemType, String itemId);
    
    /**
     * settlement_item_id 존재 여부 확인
     */
    boolean existsBySettlementItemIdAndIsDeletedFalse(String settlementItemId);
}

