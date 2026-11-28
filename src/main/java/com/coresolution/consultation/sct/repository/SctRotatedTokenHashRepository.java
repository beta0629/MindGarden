package com.coresolution.consultation.sct.repository;

import java.util.Optional;
import com.coresolution.consultation.sct.entity.SctRotatedTokenHash;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

/**
 * SCT 회전 토큰 해시 Repository.
 *
 * @author MindGarden
 * @since 2026-11-24
 */
@Repository
public interface SctRotatedTokenHashRepository extends JpaRepository<SctRotatedTokenHash, Long> {

    /**
     * 회전 이력에 동일 해시가 있는지.
     *
     * @param tokenHash SHA-256 hex
     * @return 존재 여부
     */
    boolean existsByTokenHash(String tokenHash);

    /**
     * 회전 해시로 이력 조회(재발급 랜딩 메타용).
     *
     * @param tokenHash SHA-256 hex
     * @return 회전 이력
     */
    Optional<SctRotatedTokenHash> findByTokenHash(String tokenHash);
}
