package com.mindgarden.consultation.repository;

import java.util.List;
import com.mindgarden.consultation.entity.WarmWords;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

/**
 * 따뜻한 말 데이터 레포지토리
 */
@Repository
public interface WarmWordsRepository extends JpaRepository<WarmWords, Long> {
    
    /**
     * 대상 역할별 랜덤 따뜻한 말 조회
     * @param consultantRole 대상 역할
     * @return 랜덤 따뜻한 말
     */
    @Query(value = "SELECT * FROM warm_words WHERE consultant_role = ?1 AND is_active = true ORDER BY RAND() LIMIT 1", nativeQuery = true)
    WarmWords findRandomByTargetRole(String consultantRole);
    
    /**
     * 랜덤 따뜻한 말 조회 (역할 무관)
     * @return 랜덤 따뜻한 말
     */
    @Query(value = "SELECT * FROM warm_words WHERE is_active = true ORDER BY RAND() LIMIT 1", nativeQuery = true)
    WarmWords findRandom();
    
    /**
     * 대상 역할별 따뜻한 말 목록 조회
     * @param consultantRole 대상 역할
     * @param isActive 활성 상태
     * @return 따뜻한 말 목록
     */
    List<WarmWords> findByConsultantRoleAndIsActive(String consultantRole, Boolean isActive);
}
