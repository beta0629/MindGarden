package com.coresolution.consultation.service.impl;

import com.coresolution.consultation.constant.BankTransferConstants;
import com.coresolution.consultation.dto.shop.admin.ShopCatalogSkuAdminDetail;
import com.coresolution.consultation.dto.shop.admin.ShopCatalogSkuAdminItem;
import com.coresolution.consultation.dto.shop.admin.ShopCatalogSkuUpsertRequest;
import com.coresolution.consultation.entity.ShopCatalogSku;
import com.coresolution.consultation.exception.EntityNotFoundException;
import com.coresolution.consultation.repository.ShopCatalogSkuRepository;
import com.coresolution.consultation.service.AdminShopCatalogSkuService;
import java.util.ArrayList;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

/**
 * 어드민 카탈로그 SKU 서비스.
 *
 * @author MindGarden
 * @since 2026-05-19
 */
@Service
@RequiredArgsConstructor
public class AdminShopCatalogSkuServiceImpl implements AdminShopCatalogSkuService {

    private static final String ENTITY_NAME = "ShopCatalogSku";

    private final ShopCatalogSkuRepository shopCatalogSkuRepository;

    @Override
    @Transactional(readOnly = true)
    public List<ShopCatalogSkuAdminItem> listAllForTenant(String tenantId) {
        String tid = requireTenant(tenantId);
        List<ShopCatalogSku> rows =
                shopCatalogSkuRepository.findByTenantIdAndIsDeletedFalseOrderBySortOrderAscIdAsc(tid);
        List<ShopCatalogSkuAdminItem> out = new ArrayList<>(rows.size());
        for (ShopCatalogSku row : rows) {
            out.add(toItem(row));
        }
        return out;
    }

    @Override
    @Transactional(readOnly = true)
    public ShopCatalogSkuAdminDetail getForAdmin(String tenantId, Long id) {
        String tid = requireTenant(tenantId);
        ShopCatalogSku row = shopCatalogSkuRepository.findByIdAndTenantIdAndIsDeletedFalse(id, tid)
                .orElseThrow(() -> new EntityNotFoundException(ENTITY_NAME, id));
        return toDetail(row);
    }

    @Override
    @Transactional
    public ShopCatalogSkuAdminDetail create(String tenantId, ShopCatalogSkuUpsertRequest request) {
        String tid = requireTenant(tenantId);
        String skuCode = normalizeSkuCode(request.skuCode());
        if (shopCatalogSkuRepository.existsByTenantIdAndSkuCodeAndIsDeletedFalse(tid, skuCode)) {
            throw new IllegalArgumentException("이미 사용 중인 skuCode 입니다: " + skuCode);
        }
        ShopCatalogSku row = new ShopCatalogSku();
        row.setTenantId(tid);
        row.setSkuCode(skuCode);
        applyUpsert(row, request);
        return toDetail(shopCatalogSkuRepository.save(row));
    }

    @Override
    @Transactional
    public ShopCatalogSkuAdminDetail update(String tenantId, Long id, ShopCatalogSkuUpsertRequest request) {
        String tid = requireTenant(tenantId);
        ShopCatalogSku row = shopCatalogSkuRepository.findByIdAndTenantIdAndIsDeletedFalse(id, tid)
                .orElseThrow(() -> new EntityNotFoundException(ENTITY_NAME, id));
        String skuCode = normalizeSkuCode(request.skuCode());
        if (shopCatalogSkuRepository.existsByTenantIdAndSkuCodeAndIsDeletedFalseAndIdNot(tid, skuCode, id)) {
            throw new IllegalArgumentException("이미 사용 중인 skuCode 입니다: " + skuCode);
        }
        row.setSkuCode(skuCode);
        applyUpsert(row, request);
        return toDetail(shopCatalogSkuRepository.save(row));
    }

    @Override
    @Transactional
    public void patchCatalogVisible(String tenantId, Long id, boolean catalogVisible) {
        String tid = requireTenant(tenantId);
        ShopCatalogSku row = shopCatalogSkuRepository.findByIdAndTenantIdAndIsDeletedFalse(id, tid)
                .orElseThrow(() -> new EntityNotFoundException(ENTITY_NAME, id));
        row.setCatalogVisible(catalogVisible);
        shopCatalogSkuRepository.save(row);
    }

    private static String requireTenant(String tenantId) {
        if (!StringUtils.hasText(tenantId)) {
            throw new IllegalArgumentException("tenantId가 필요합니다.");
        }
        return tenantId.trim();
    }

    private static String normalizeSkuCode(String skuCode) {
        if (!StringUtils.hasText(skuCode)) {
            throw new IllegalArgumentException("skuCode는 비울 수 없습니다.");
        }
        return skuCode.trim();
    }

    private static void applyUpsert(ShopCatalogSku row, ShopCatalogSkuUpsertRequest request) {
        row.setTitle(request.title().trim());
        row.setDescriptionText(
                StringUtils.hasText(request.descriptionText()) ? request.descriptionText().trim() : null);
        row.setUnitPriceMinor(request.unitPriceMinor());
        String currency = StringUtils.hasText(request.currency())
                ? request.currency().trim().toUpperCase()
                : BankTransferConstants.CURRENCY_KRW;
        row.setCurrency(currency);
        row.setCatalogVisible(request.catalogVisible());
        row.setActive(request.active());
        row.setSortOrder(request.sortOrder());
    }

    private static ShopCatalogSkuAdminItem toItem(ShopCatalogSku row) {
        return new ShopCatalogSkuAdminItem(
                row.getId(),
                row.getSkuCode(),
                row.getTitle(),
                row.getUnitPriceMinor(),
                row.getCurrency(),
                Boolean.TRUE.equals(row.getCatalogVisible()),
                Boolean.TRUE.equals(row.getActive()),
                row.getSortOrder() != null ? row.getSortOrder() : 0,
                row.getUpdatedAt());
    }

    private static ShopCatalogSkuAdminDetail toDetail(ShopCatalogSku row) {
        return new ShopCatalogSkuAdminDetail(
                row.getId(),
                row.getSkuCode(),
                row.getTitle(),
                row.getDescriptionText(),
                row.getUnitPriceMinor(),
                row.getCurrency(),
                Boolean.TRUE.equals(row.getCatalogVisible()),
                Boolean.TRUE.equals(row.getActive()),
                row.getSortOrder() != null ? row.getSortOrder() : 0);
    }
}
