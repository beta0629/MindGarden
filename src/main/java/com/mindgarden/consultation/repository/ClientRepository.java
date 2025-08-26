package com.mindgarden.consultation.repository;

import com.mindgarden.consultation.entity.Client;
import org.springframework.stereotype.Repository;

/**
 * 내담자 Repository
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2024-12-19
 */
@Repository
public interface ClientRepository extends BaseRepository<Client, Long> {
    
    /**
     * 이메일로 내담자 조회
     * 
     * @param email 이메일
     * @return 내담자 엔티티
     */
    Client findByEmail(String email);
    
    /**
     * 이메일로 내담자 존재 여부 확인
     * 
     * @param email 이메일
     * @return 존재 여부
     */
    boolean existsByEmail(String email);
}
