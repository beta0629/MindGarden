package com.mindgarden.consultation.repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import com.mindgarden.consultation.entity.PurchaseRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

/**
 * ERP 구매 요청 Repository
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2024-12-19
 */
@Repository
public interface PurchaseRequestRepository extends JpaRepository<PurchaseRequest, Long> {
    
    /**
     * 요청자별 구매 요청 목록 조회
     */
    @Query("SELECT pr FROM PurchaseRequest pr WHERE pr.requester.id = :requesterId ORDER BY pr.createdAt DESC")
    List<PurchaseRequest> findByRequesterId(@Param("requesterId") Long requesterId);
    
    /**
     * 상태별 구매 요청 목록 조회
     */
    @Query("SELECT pr FROM PurchaseRequest pr WHERE pr.status = :status ORDER BY pr.createdAt DESC")
    List<PurchaseRequest> findByStatus(@Param("status") PurchaseRequest.PurchaseRequestStatus status);
    
    /**
     * 관리자 승인 대기 목록 조회
     */
    @Query("SELECT pr FROM PurchaseRequest pr WHERE pr.status = 'PENDING' ORDER BY pr.createdAt ASC")
    List<PurchaseRequest> findPendingAdminApproval();
    
    /**
     * 수퍼 관리자 승인 대기 목록 조회
     */
    @Query("SELECT pr FROM PurchaseRequest pr WHERE pr.status = 'ADMIN_APPROVED' ORDER BY pr.adminApprovedAt ASC")
    List<PurchaseRequest> findPendingSuperAdminApproval();
    
    /**
     * 관리자별 승인한 구매 요청 목록 조회
     */
    @Query("SELECT pr FROM PurchaseRequest pr WHERE pr.adminApprover.id = :adminId ORDER BY pr.adminApprovedAt DESC")
    List<PurchaseRequest> findByAdminApproverId(@Param("adminId") Long adminId);
    
    /**
     * 수퍼 관리자별 승인한 구매 요청 목록 조회
     */
    @Query("SELECT pr FROM PurchaseRequest pr WHERE pr.superAdminApprover.id = :superAdminId ORDER BY pr.superAdminApprovedAt DESC")
    List<PurchaseRequest> findBySuperAdminApproverId(@Param("superAdminId") Long superAdminId);
    
    /**
     * 기간별 구매 요청 목록 조회
     */
    @Query("SELECT pr FROM PurchaseRequest pr WHERE pr.createdAt BETWEEN :startDate AND :endDate ORDER BY pr.createdAt DESC")
    List<PurchaseRequest> findByCreatedAtBetween(@Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate);
    
    /**
     * 월별 구매 요청 통계
     */
    @Query("SELECT COUNT(pr), SUM(pr.totalAmount) FROM PurchaseRequest pr WHERE YEAR(pr.createdAt) = :year AND MONTH(pr.createdAt) = :month")
    Object[] getMonthlyStats(@Param("year") int year, @Param("month") int month);
    
    /**
     * 상태별 구매 요청 통계
     */
    @Query("SELECT pr.status, COUNT(pr), SUM(pr.totalAmount) FROM PurchaseRequest pr GROUP BY pr.status")
    List<Object[]> getStatsByStatus();
    
    /**
     * 요청자별 구매 요청 통계
     */
    @Query("SELECT pr.requester.id, pr.requester.name, COUNT(pr), SUM(pr.totalAmount) FROM PurchaseRequest pr GROUP BY pr.requester.id, pr.requester.name ORDER BY SUM(pr.totalAmount) DESC")
    List<Object[]> getStatsByRequester();
    
    /**
     * ID로 구매 요청 조회 (연관 엔티티 포함)
     */
    @Query("SELECT pr FROM PurchaseRequest pr LEFT JOIN FETCH pr.requester LEFT JOIN FETCH pr.item LEFT JOIN FETCH pr.adminApprover LEFT JOIN FETCH pr.superAdminApprover WHERE pr.id = :id")
    Optional<PurchaseRequest> findByIdWithDetails(@Param("id") Long id);
    
    /**
     * 모든 활성화된 구매 요청 조회
     */
    @Query("SELECT pr FROM PurchaseRequest pr WHERE pr.isActive = true ORDER BY pr.createdAt DESC")
    List<PurchaseRequest> findAllActive();
}
