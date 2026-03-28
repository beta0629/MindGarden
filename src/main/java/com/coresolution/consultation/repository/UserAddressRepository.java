package com.coresolution.consultation.repository;

import java.util.List;
import java.util.Optional;
import com.coresolution.consultation.entity.UserAddress;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

/**
 * 사용자 주소 Repository
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2024-12-19
 */
@Repository
public interface UserAddressRepository extends BaseRepository<UserAddress, Long> {
    
    // ==================== tenantId 필터링 메서드 ====================
    
    /**
     * 사용자 ID로 모든 주소 조회 (삭제되지 않은 것만) (tenantId 필터링)
     */
    @Query("SELECT ua FROM UserAddress ua WHERE ua.tenantId = :tenantId AND ua.userId = :userId AND ua.isDeleted = false ORDER BY ua.isPrimary DESC, ua.createdAt ASC")
    List<UserAddress> findByTenantIdAndUserIdAndIsDeletedFalseOrderByIsPrimaryDescCreatedAtAsc(@Param("tenantId") String tenantId, @Param("userId") Long userId);
    
    /**
     * 사용자 ID와 주소 타입으로 주소 조회 (tenantId 필터링)
     */
    @Query("SELECT ua FROM UserAddress ua WHERE ua.tenantId = :tenantId AND ua.userId = :userId AND ua.addressType = :addressType AND ua.isDeleted = false")
    List<UserAddress> findByTenantIdAndUserIdAndAddressTypeAndIsDeletedFalse(@Param("tenantId") String tenantId, @Param("userId") Long userId, @Param("addressType") String addressType);
    
    /**
     * 사용자 ID로 기본 주소 조회 (tenantId 필터링)
     */
    @Query("SELECT ua FROM UserAddress ua WHERE ua.tenantId = :tenantId AND ua.userId = :userId AND ua.isPrimary = true AND ua.isDeleted = false")
    Optional<UserAddress> findByTenantIdAndUserIdAndIsPrimaryTrueAndIsDeletedFalse(@Param("tenantId") String tenantId, @Param("userId") Long userId);
    
    /**
     * 사용자 ID로 주소 개수 조회 (tenantId 필터링)
     */
    @Query("SELECT COUNT(ua) FROM UserAddress ua WHERE ua.tenantId = :tenantId AND ua.userId = :userId AND ua.isDeleted = false")
    long countByTenantIdAndUserIdAndIsDeletedFalse(@Param("tenantId") String tenantId, @Param("userId") Long userId);
    
    /**
     * 사용자 ID와 주소 타입으로 주소 개수 조회 (tenantId 필터링)
     */
    @Query("SELECT COUNT(ua) FROM UserAddress ua WHERE ua.tenantId = :tenantId AND ua.userId = :userId AND ua.addressType = :addressType AND ua.isDeleted = false")
    long countByTenantIdAndUserIdAndAddressTypeAndIsDeletedFalse(@Param("tenantId") String tenantId, @Param("userId") Long userId, @Param("addressType") String addressType);
    
    // ==================== @Deprecated 메서드 (하위 호환성) ====================
    
    /**
     * @Deprecated - 🚨 위험: tenantId 필터링 없음! findByTenantIdAndUserIdAndIsDeletedFalseOrderByIsPrimaryDescCreatedAtAsc 사용하세요.
     */
    @Deprecated
    List<UserAddress> findByUserIdAndIsDeletedFalseOrderByIsPrimaryDescCreatedAtAsc(Long userId);
    
    /**
     * @Deprecated - 🚨 위험: tenantId 필터링 없음! findByTenantIdAndUserIdAndAddressTypeAndIsDeletedFalse 사용하세요.
     */
    @Deprecated
    List<UserAddress> findByUserIdAndAddressTypeAndIsDeletedFalse(Long userId, String addressType);
    
    /**
     * @Deprecated - 🚨 위험: tenantId 필터링 없음! findByTenantIdAndUserIdAndIsPrimaryTrueAndIsDeletedFalse 사용하세요.
     */
    @Deprecated
    Optional<UserAddress> findByUserIdAndIsPrimaryTrueAndIsDeletedFalse(Long userId);
    
    /**
     * @Deprecated - 🚨 위험: tenantId 필터링 없음! countByTenantIdAndUserIdAndIsDeletedFalse 사용하세요.
     */
    @Deprecated
    long countByUserIdAndIsDeletedFalse(Long userId);
    
    /**
     * @Deprecated - 🚨 위험: tenantId 필터링 없음! countByTenantIdAndUserIdAndAddressTypeAndIsDeletedFalse 사용하세요.
     */
    @Deprecated
    long countByUserIdAndAddressTypeAndIsDeletedFalse(Long userId, String addressType);
}
