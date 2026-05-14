package com.coresolution.consultation.repository;

import java.util.List;
import com.coresolution.consultation.entity.ShopCartLine;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

/**
 * 장바구니 라인 저장소.
 *
 * @author MindGarden
 * @since 2026-05-14
 */
@Repository
public interface ShopCartLineRepository extends BaseRepository<ShopCartLine, Long> {

    List<ShopCartLine> findByCart_IdAndIsDeletedFalse(Long cartId);

    @Modifying
    @Query("DELETE FROM ShopCartLine l WHERE l.cart.id = :cartId")
    void hardDeleteByCartId(@Param("cartId") Long cartId);
}
