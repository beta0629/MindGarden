package com.mindgarden.consultation.repository;

import com.mindgarden.consultation.entity.SalaryProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SalaryProfileRepository extends JpaRepository<SalaryProfile, Long> {
    
    List<SalaryProfile> findByIsActiveTrue();
    
    List<SalaryProfile> findByBranchCodeAndIsActiveTrue(String branchCode);
    
    Optional<SalaryProfile> findByProfileNameAndBranchCode(String profileName, String branchCode);
    
    @Query("SELECT sp FROM SalaryProfile sp WHERE sp.isActive = true AND (sp.branchCode = :branchCode OR sp.branchCode IS NULL)")
    List<SalaryProfile> findActiveProfilesForBranch(@Param("branchCode") String branchCode);
}
