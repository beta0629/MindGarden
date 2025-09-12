package com.mindgarden.consultation.repository;

import java.util.List;
import java.util.Optional;
import com.mindgarden.consultation.entity.ConsultantClientMapping;
import com.mindgarden.consultation.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface ConsultantClientMappingRepository extends JpaRepository<ConsultantClientMapping, Long> {

    // 상담사별 매핑 조회
    List<ConsultantClientMapping> findByConsultant(User consultant);
    
    // 내담자별 매핑 조회
    List<ConsultantClientMapping> findByClient(User client);
    
    // 활성 상태의 매핑만 조회
    List<ConsultantClientMapping> findByStatus(ConsultantClientMapping.MappingStatus status);
    
    // 상담사와 내담자로 특정 매핑 조회
    Optional<ConsultantClientMapping> findByConsultantAndClient(User consultant, User client);
    
    // 상담사와 내담자로 활성 상태의 매핑 존재 여부 확인
    boolean existsByConsultantAndClientAndStatus(User consultant, User client, ConsultantClientMapping.MappingStatus status);
    
    // 상담사별 활성 매핑 수 조회
    @Query("SELECT COUNT(m) FROM ConsultantClientMapping m WHERE m.consultant = :consultant AND m.status = 'ACTIVE'")
    long countActiveMappingsByConsultant(@Param("consultant") User consultant);
    
    // 내담자별 활성 매핑 수 조회
    @Query("SELECT COUNT(m) FROM ConsultantClientMapping m WHERE m.client = :client AND m.status = 'ACTIVE'")
    long countActiveMappingsByClient(@Param("client") User client);
    
    // 날짜 범위로 매핑 조회
    @Query("SELECT m FROM ConsultantClientMapping m WHERE m.startDate >= :startDate AND m.endDate <= :endDate")
    List<ConsultantClientMapping> findByDateRange(@Param("startDate") java.time.LocalDate startDate, 
                                                 @Param("endDate") java.time.LocalDate endDate);
    
    // 모든 매핑을 관련 엔티티와 함께 조회 (최신순 정렬)
    @Query("SELECT m FROM ConsultantClientMapping m LEFT JOIN FETCH m.consultant LEFT JOIN FETCH m.client ORDER BY m.createdAt DESC")
    List<ConsultantClientMapping> findAllWithDetails();
    
    // 활성 매핑을 관련 엔티티와 함께 조회
    @Query("SELECT m FROM ConsultantClientMapping m LEFT JOIN FETCH m.consultant LEFT JOIN FETCH m.client WHERE m.status = 'ACTIVE'")
    List<ConsultantClientMapping> findActiveMappingsWithDetails();
    
    // 상담사 ID로 매핑 조회 (특정 상태 제외)
    @Query("SELECT m FROM ConsultantClientMapping m LEFT JOIN FETCH m.consultant LEFT JOIN FETCH m.client WHERE m.consultant.id = :consultantId AND m.status != :status")
    List<ConsultantClientMapping> findByConsultantIdAndStatusNot(@Param("consultantId") Long consultantId, @Param("status") ConsultantClientMapping.MappingStatus status);
    
    // 상담사 ID와 브랜치 코드로 매핑 조회 (특정 상태 제외)
    @Query("SELECT m FROM ConsultantClientMapping m LEFT JOIN FETCH m.consultant LEFT JOIN FETCH m.client WHERE m.consultant.id = :consultantId AND m.branchCode = :branchCode AND m.status != :status")
    List<ConsultantClientMapping> findByConsultantIdAndBranchCodeAndStatusNot(@Param("consultantId") Long consultantId, @Param("branchCode") String branchCode, @Param("status") ConsultantClientMapping.MappingStatus status);
    
    // 내담자 ID로 매핑 조회 (특정 상태 제외)
    @Query("SELECT m FROM ConsultantClientMapping m LEFT JOIN FETCH m.consultant LEFT JOIN FETCH m.client WHERE m.client.id = :clientId AND m.status != :status")
    List<ConsultantClientMapping> findByClientIdAndStatusNot(@Param("clientId") Long clientId, @Param("status") ConsultantClientMapping.MappingStatus status);
}
