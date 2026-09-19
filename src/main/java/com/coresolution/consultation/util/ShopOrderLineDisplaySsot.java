package com.coresolution.consultation.util;

import java.util.List;
import com.coresolution.consultation.dto.shop.ShopOrderIncomeClaim;
import com.coresolution.consultation.entity.ShopClientOrderLine;
import org.springframework.util.StringUtils;

/**
 * Path B 쇼핑 주문 라인 표시 SSOT — {@code titleSnapshot} 우선, stale {@code packageName} 금지.
 *
 * @author MindGarden
 * @since 2026-09-19
 */
public final class ShopOrderLineDisplaySsot {

    private ShopOrderLineDisplaySsot() {
        throw new UnsupportedOperationException("utility");
    }

    /**
     * 주문 라인 상품명 스냅샷.
     *
     * @param line 주문 라인
     * @return trim 된 titleSnapshot, 없으면 null
     */
    public static String resolveTitleSnapshot(ShopClientOrderLine line) {
        if (line == null || !StringUtils.hasText(line.getTitleSnapshot())) {
            return null;
        }
        return line.getTitleSnapshot().trim();
    }

    /**
     * 표시용 패키지/상품명 — titleSnapshot → mappingPackageName → fallback.
     *
     * @param titleSnapshot      주문 라인 스냅샷
     * @param mappingPackageName 매핑 레거시 스냅샷
     * @param fallback           둘 다 없을 때
     * @return 표시명
     */
    public static String resolvePackageDisplayName(
            String titleSnapshot, String mappingPackageName, String fallback) {
        if (StringUtils.hasText(titleSnapshot)) {
            return titleSnapshot.trim();
        }
        if (StringUtils.hasText(mappingPackageName)) {
            return mappingPackageName.trim();
        }
        return fallback != null ? fallback : "";
    }

    /**
     * claim 또는 라인 목록에서 claim.orderPublicId 와 일치하는 라인을 고른다.
     * 일치 라인이 없으면 null (최신 id DESC 가로채기 금지 — 호출측 fail-closed).
     *
     * @param lines 매핑 연결 라인 (id DESC 가능)
     * @param claim Path B claim (nullable)
     * @return 매칭 라인 또는 null
     */
    public static ShopClientOrderLine resolveLineForClaim(
            List<ShopClientOrderLine> lines, ShopOrderIncomeClaim claim) {
        if (lines == null || lines.isEmpty()) {
            return null;
        }
        if (claim == null || !StringUtils.hasText(claim.getOrderPublicId())) {
            return null;
        }
        String target = claim.getOrderPublicId().trim();
        for (ShopClientOrderLine line : lines) {
            if (line == null || line.getClientOrder() == null) {
                continue;
            }
            String publicId = line.getClientOrder().getPublicId();
            if (StringUtils.hasText(publicId) && target.equals(publicId.trim())) {
                return line;
            }
        }
        return null;
    }
}
