package com.mindgarden.consultation.repository;

import com.mindgarden.consultation.entity.Client;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * 클라이언트 리포지토리
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-01-05
 */
@Repository
public interface ClientRepository extends JpaRepository<Client, Long> {
    
    Optional<Client> findByEmailAndIsDeletedFalse(String email);
    
    List<Client> findByIsDeletedFalse();
    
    List<Client> findByIsEmergencyContactAndIsDeletedFalse(Boolean isEmergencyContact);
    
    @Query("SELECT c FROM Client c WHERE c.name LIKE %:name% AND c.isDeleted = false")
    List<Client> findByNameContaining(@Param("name") String name);
    
    @Query("SELECT c FROM Client c WHERE c.phone LIKE %:phone% AND c.isDeleted = false")
    List<Client> findByPhoneContaining(@Param("phone") String phone);
    
    @Query("SELECT c FROM Client c WHERE c.gender = :gender AND c.isDeleted = false")
    List<Client> findByGender(@Param("gender") String gender);
    
    @Query("SELECT c FROM Client c WHERE c.preferredLanguage = :language AND c.isDeleted = false")
    List<Client> findByPreferredLanguage(@Param("language") String language);
}