package com.coresolution.consultation.service.impl;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import com.coresolution.consultation.constant.ShopCheckoutConstants;
import com.coresolution.consultation.dto.shop.ShopCartLineRequest;
import com.coresolution.consultation.dto.shop.ShopCartLineResponse;
import com.coresolution.consultation.dto.shop.ShopCartReplaceRequest;
import com.coresolution.consultation.dto.shop.ShopCartResponse;
import com.coresolution.consultation.entity.ShopCart;
import com.coresolution.consultation.entity.ShopCartLine;
import com.coresolution.consultation.entity.ShopCatalogSku;
import com.coresolution.consultation.repository.ShopCartLineRepository;
import com.coresolution.consultation.repository.ShopCartRepository;
import com.coresolution.consultation.repository.ShopCatalogSkuRepository;
import com.coresolution.consultation.service.ClientShopCartService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import lombok.RequiredArgsConstructor;

/**
 * 장바구니 구현.
 *
 * @author MindGarden
 * @since 2026-05-14
 */
@Service
@RequiredArgsConstructor
public class ClientShopCartServiceImpl implements ClientShopCartService {

    private final ShopCartRepository shopCartRepository;
    private final ShopCartLineRepository shopCartLineRepository;
    private final ShopCatalogSkuRepository shopCatalogSkuRepository;

    @Override
    @Transactional(readOnly = true)
    public ShopCartResponse getCart(String tenantId, Long clientId) {
        Optional<ShopCart> cartOpt = shopCartRepository.findByTenantIdAndClientId(tenantId, clientId);
        if (cartOpt.isEmpty()) {
            return ShopCartResponse.builder().lines(List.of()).subtotalMinor(0L).build();
        }
        List<ShopCartLine> lines = shopCartLineRepository.findByCart_IdAndIsDeletedFalse(cartOpt.get().getId());
        List<ShopCartLineResponse> dtos = new ArrayList<>();
        long subtotal = 0L;
        for (ShopCartLine line : lines) {
            ShopCatalogSku sku = line.getSku();
            long unit = sku.getUnitPriceMinor();
            long lineTotal = unit * line.getQuantity();
            subtotal += lineTotal;
            dtos.add(ShopCartLineResponse.builder()
                    .skuCode(sku.getSkuCode())
                    .title(sku.getTitle())
                    .quantity(line.getQuantity())
                    .unitPriceMinor(unit)
                    .lineTotalMinor(lineTotal)
                    .build());
        }
        return ShopCartResponse.builder().lines(dtos).subtotalMinor(subtotal).build();
    }

    @Override
    @Transactional
    public void replaceCart(String tenantId, Long clientId, ShopCartReplaceRequest request) {
        Map<String, Integer> merged = new LinkedHashMap<>();
        for (ShopCartLineRequest line : request.getLines()) {
            String code = line.getSkuCode().trim();
            if (code.isEmpty()) {
                throw new IllegalArgumentException("skuCode가 비어 있습니다.");
            }
            merged.merge(code, line.getQuantity(), Integer::sum);
        }
        if (merged.size() > ShopCheckoutConstants.MAX_CART_LINES) {
            throw new IllegalArgumentException("장바구니 라인 수가 상한을 초과했습니다.");
        }
        for (Map.Entry<String, Integer> e : merged.entrySet()) {
            if (e.getValue() == null || e.getValue() < 1 || e.getValue() > ShopCheckoutConstants.MAX_LINE_QUANTITY) {
                throw new IllegalArgumentException("수량이 유효하지 않습니다.");
            }
        }

        ShopCart cart = shopCartRepository.findByTenantIdAndClientId(tenantId, clientId).orElseGet(() -> {
            ShopCart c = ShopCart.builder().clientId(clientId).build();
            c.setTenantId(tenantId);
            return shopCartRepository.save(c);
        });

        shopCartLineRepository.hardDeleteByCartId(cart.getId());
        shopCartLineRepository.flush();

        for (Map.Entry<String, Integer> e : merged.entrySet()) {
            ShopCatalogSku sku = shopCatalogSkuRepository
                    .findActiveByTenantAndSkuCode(tenantId, e.getKey())
                    .orElseThrow(() -> new IllegalArgumentException("유효하지 않은 상품 코드입니다: " + e.getKey()));
            ShopCartLine cl = ShopCartLine.builder()
                    .cart(cart)
                    .sku(sku)
                    .quantity(e.getValue())
                    .build();
            cl.setTenantId(tenantId);
            shopCartLineRepository.save(cl);
        }
    }
}
