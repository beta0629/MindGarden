package com.coresolution.consultation.repository;

import java.util.List;
import java.util.Optional;
import com.coresolution.consultation.entity.UserAddress;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

/**
 * 사용자 주소 Repository
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2024-12-19
 */
@Repository
public interface UserAddressRepository extends JpaRepository<UserAddress, Long> {
    
    /**
     * 사용자 ID로 모든 주소 조회 (삭제되지 않은 것만)
     */
    List<UserAddress> findByUserIdAndIsDeletedFalseOrderByIsPrimaryDescCreatedAtAsc(Long userId);
    
    /**
     * 사용자 ID와 주소 타입으로 주소 조회
     */
    List<UserAddress> findByUserIdAndAddressTypeAndIsDeletedFalse(Long userId, String addressType);
    
    /**
     * 사용자 ID로 기본 주소 조회
     */
    Optional<UserAddress> findByUserIdAndIsPrimaryTrueAndIsDeletedFalse(Long userId);
    
    /**
     * 사용자 ID로 주소 개수 조회
     */
    long countByUserIdAndIsDeletedFalse(Long userId);
    
    /**
     * 사용자 ID와 주소 타입으로 주소 개수 조회
     */
    long countByUserIdAndAddressTypeAndIsDeletedFalse(Long userId, String addressType);
}
