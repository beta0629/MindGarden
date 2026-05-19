package com.coresolution.core.repository;

import com.coresolution.core.domain.ComponentCatalog;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

/**
 * ComponentCatalog Repository.
 *
 * @author CoreSolution
 * @since 2026-05-19
 */
@Repository
public interface ComponentCatalogRepository extends JpaRepository<ComponentCatalog, Long> {

    /**
     * 컴포넌트 코드로 카탈로그 조회 (삭제 제외).
     *
     * @param componentCode component_code
     * @return 카탈로그
     */
    Optional<ComponentCatalog> findByComponentCodeAndIsDeletedFalse(String componentCode);
}
