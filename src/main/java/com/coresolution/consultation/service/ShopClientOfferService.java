package com.coresolution.consultation.service;

import com.coresolution.consultation.constant.ShopCatalogCategory;
import com.coresolution.consultation.constant.ShopClientOfferConstants;
import com.coresolution.consultation.constant.ShopClientOrderStatus;
import com.coresolution.consultation.dto.shop.ShopCatalogOffer;
import com.coresolution.consultation.dto.shop.offer.ShopClientOfferCreateRequest;
import com.coresolution.consultation.dto.shop.offer.ShopClientOfferResponse;
import com.coresolution.consultation.dto.shop.offer.ShopClientOfferSourceOption;
import com.coresolution.consultation.entity.ConsultantClientMapping;
import com.coresolution.consultation.entity.ShopCatalogSku;
import com.coresolution.consultation.entity.ShopClientOffer;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.repository.ShopCatalogSkuRepository;
import com.coresolution.consultation.repository.ShopClientOfferPaidLookupRepository;
import com.coresolution.consultation.repository.ShopClientOfferRepository;
import com.coresolution.consultation.repository.UserRepository;
import com.coresolution.consultation.util.ShopClientOfferPricing;
import com.coresolution.consultation.util.ShopClientOfferSkuPolicy;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

/**
 * 내담자별 지정 상품·할인가. 금액은 서버가 원가에서 계산해 확정하고, 결제는 기존 바로 구매 체크아웃이
 * 내담자 전용 숨김 SKU 로 처리한다 (체크아웃·카탈로그 코드는 변경하지 않는다).
 *
 * @author MindGarden
 * @since 2026-10-12
 */
@Service
@RequiredArgsConstructor
public class ShopClientOfferService {

    private final ShopClientOfferRepository offerRepository;
    private final ShopClientOfferPaidLookupRepository paidLookupRepository;
    private final ShopCatalogSkuRepository skuRepository;
    private final ShopCatalogPackageOfferResolver packageOfferResolver;
    private final ClientShopCatalogService clientShopCatalogService;
    private final ClientShopConsultantMappingService consultantMappingService;
    private final UserRepository userRepository;

    /**
     * 지정 화면의 몰 상품 선택지 (몰에 노출 중인 상품, 내담자 전용 SKU 제외).
     *
     * @param tenantId 테넌트 ID
     * @return 선택지
     */
    @Transactional(readOnly = true)
    public List<ShopClientOfferSourceOption> listSourceOptions(String tenantId) {
        List<ShopClientOfferSourceOption> out = new ArrayList<>();
        for (ShopCatalogSku sku : skuRepository.findCatalogForTenant(tenantId)) {
            if (ShopClientOfferSkuPolicy.isClientOfferSku(sku)) {
                continue;
            }
            ShopCatalogOffer offer = resolveOffer(tenantId, sku);
            if (!offer.sellable()) {
                continue;
            }
            out.add(new ShopClientOfferSourceOption(
                    sku.getSkuCode(), offerTitle(sku, offer), offer.unitPriceMinor(), offer.sessionCount()));
        }
        return out;
    }

    /**
     * 지정 생성: 서버가 원가·최종가를 확정하고 전용 숨김 SKU 를 만든다.
     *
     * @param tenantId    테넌트 ID
     * @param adminUserId 지정한 관리자
     * @param request     요청
     * @return 생성된 지정
     * @throws IllegalArgumentException 검증 실패
     */
    @Transactional
    public ShopClientOfferResponse create(String tenantId, Long adminUserId, ShopClientOfferCreateRequest request) {
        // 같은 내담자 동시 지정 직렬화 — 트랜잭션의 첫 조회여야 이후 검사가 먼저 커밋된 지정을 본다
        offerRepository.lockClientRow(tenantId, request.clientId());
        User client = userRepository.findByTenantIdAndId(tenantId, request.clientId())
                .filter(u -> u.getRole() != null && u.getRole().isClient())
                .orElseThrow(() -> new IllegalArgumentException(ShopClientOfferConstants.MSG_CLIENT_NOT_FOUND));
        ShopCatalogSku source = skuRepository.findActiveByTenantAndSkuCode(tenantId, request.sourceSkuCode().trim())
                .filter(s -> !ShopClientOfferSkuPolicy.isClientOfferSku(s))
                .orElseThrow(() -> new IllegalArgumentException(ShopClientOfferConstants.MSG_SOURCE_NOT_FOUND));
        requireNoPendingOffer(tenantId, client.getId(), source.getSkuCode());
        ShopCatalogOffer offer = resolveOffer(tenantId, source);
        if (!offer.sellable() || offer.unitPriceMinor() <= 0L) {
            throw new IllegalArgumentException(ShopClientOfferConstants.MSG_SOURCE_NOT_SELLABLE);
        }
        long original = offer.unitPriceMinor();
        long finalPrice = ShopClientOfferPricing.finalPrice(
                original, request.discountType(), request.discountValue());

        ShopCatalogSku clone = buildOfferSku(tenantId, source, offer, finalPrice);
        requireEligible(tenantId, client.getId(), clone);
        skuRepository.save(clone);

        ShopClientOffer row = new ShopClientOffer();
        row.setTenantId(tenantId);
        row.setClientId(client.getId());
        row.setSourceSkuCode(source.getSkuCode());
        row.setOfferSkuCode(clone.getSkuCode());
        row.setDiscountType(request.discountType());
        row.setDiscountValue(request.discountValue());
        row.setOriginalPriceMinor(original);
        row.setFinalPriceMinor(finalPrice);
        row.setStatus(ShopClientOfferConstants.STATUS_ACTIVE);
        row.setCreatedByUserId(adminUserId);
        return toResponse(offerRepository.save(row), clone, false);
    }

    /**
     * 관리자: 내담자의 지정 목록.
     *
     * @param tenantId 테넌트 ID
     * @param clientId 내담자 users.id
     * @return 지정 목록 (최신순)
     */
    @Transactional(readOnly = true)
    public List<ShopClientOfferResponse> listForClient(String tenantId, Long clientId, boolean activeOnly) {
        List<ShopClientOffer> rows = activeOnly
                ? offerRepository.findByTenantIdAndClientIdAndStatusAndIsDeletedFalseOrderByIdDesc(
                        tenantId, clientId, ShopClientOfferConstants.STATUS_ACTIVE)
                : offerRepository.findByTenantIdAndClientIdAndIsDeletedFalseOrderByIdDesc(tenantId, clientId);
        if (rows.isEmpty()) {
            return List.of();
        }
        Set<String> codes = new HashSet<>();
        rows.forEach(r -> codes.add(r.getOfferSkuCode()));
        Set<String> paid = new HashSet<>(paidLookupRepository.findSkuCodesByClientAndStatus(
                tenantId, clientId, ShopClientOrderStatus.PAID, codes));
        Map<String, ShopCatalogSku> skus = new HashMap<>();
        for (String code : codes) {
            skuRepository.findActiveByTenantAndSkuCode(tenantId, code).ifPresent(s -> skus.put(code, s));
        }
        List<ShopClientOfferResponse> out = new ArrayList<>();
        for (ShopClientOffer row : rows) {
            out.add(toResponse(row, skus.get(row.getOfferSkuCode()), paid.contains(row.getOfferSkuCode())));
        }
        return out;
    }

    /**
     * 지정 취소: 전용 SKU 를 비활성화해 더 이상 결제할 수 없게 한다. 이미 만든 주문은 건드리지 않는다.
     *
     * @param tenantId 테넌트 ID
     * @param offerId  지정 id
     * @return 취소된 지정
     */
    @Transactional
    public ShopClientOfferResponse cancel(String tenantId, Long offerId) {
        ShopClientOffer row = offerRepository.findByTenantIdAndIdAndIsDeletedFalse(tenantId, offerId)
                .orElseThrow(() -> new IllegalArgumentException(ShopClientOfferConstants.MSG_OFFER_NOT_FOUND));
        row.setStatus(ShopClientOfferConstants.STATUS_CANCELED);
        ShopCatalogSku sku = skuRepository.findActiveByTenantAndSkuCode(tenantId, row.getOfferSkuCode()).orElse(null);
        if (sku != null) {
            sku.setActive(false);
            skuRepository.save(sku);
        }
        offerRepository.save(row);
        return toResponse(row, sku, false);
    }

    /**
     * 내담자 전용 SKU 가 해당 내담자에게 활성 지정되어 있고 아직 결제 완료되지 않았는지.
     *
     * @param tenantId 테넌트 ID
     * @param clientId 내담자 users.id
     * @param offerSkuCode 전용 SKU 코드
     * @return 활성 지정이며 미결제이면 true
     */
    @Transactional(readOnly = true)
    public boolean isActiveOfferForClient(String tenantId, Long clientId, String offerSkuCode) {
        if (clientId == null || !StringUtils.hasText(offerSkuCode)
                || !offerRepository.existsByTenantIdAndClientIdAndOfferSkuCodeAndStatusAndIsDeletedFalse(
                        tenantId, clientId, offerSkuCode, ShopClientOfferConstants.STATUS_ACTIVE)) {
            return false;
        }
        return paidLookupRepository.findSkuCodesByClientAndStatus(
                tenantId, clientId, ShopClientOrderStatus.PAID, Set.of(offerSkuCode)).isEmpty();
    }

    private void requireEligible(String tenantId, Long clientId, ShopCatalogSku clone) {
        if (!ShopCatalogCategory.CONSULTATION.equals(clone.getCatalogCategory())) {
            return;
        }
        List<ConsultantClientMapping> mappings = consultantMappingService.listActiveMappings(tenantId, clientId);
        if (!clientShopCatalogService.isVisibleForClientMappings(tenantId, clone, mappings)) {
            throw new IllegalArgumentException(ShopClientOfferConstants.MSG_CLIENT_NOT_ELIGIBLE);
        }
    }

    private ShopCatalogSku buildOfferSku(
            String tenantId, ShopCatalogSku source, ShopCatalogOffer offer, long finalPrice) {
        ShopCatalogSku clone = new ShopCatalogSku();
        clone.setTenantId(tenantId);
        clone.setSkuCode(ShopClientOfferConstants.SKU_CODE_PREFIX + UUID.randomUUID().toString()
                .replace("-", "").substring(0, ShopClientOfferConstants.SKU_CODE_RANDOM_LENGTH).toUpperCase());
        clone.setTitle(offerTitle(source, offer));
        clone.setDescriptionText(source.getDescriptionText());
        clone.setUnitPriceMinor(finalPrice);
        clone.setCurrency(source.getCurrency());
        clone.setCatalogVisible(false);
        clone.setActive(true);
        clone.setSortOrder(0);
        clone.setCatalogCategory(source.getCatalogCategory() != null && !source.getCatalogCategory().isBlank()
                ? source.getCatalogCategory()
                : ShopCatalogCategory.CONSULTATION);
        clone.setThumbnailUrl(source.getThumbnailUrl());
        clone.setSessionCount(offer.sessionCount());
        clone.setValidityMonths(source.getValidityMonths());
        clone.setSourcePackageCode(null);
        clone.setFieldCode(source.getFieldCode());
        clone.setConsultantId(source.getConsultantId());
        return clone;
    }

    /**
     * 같은 내담자·같은 원본 상품에 결제 대기(ACTIVE 이며 미결제) 지정이 있으면 막는다.
     * 결제 완료·취소된 지정은 재지정을 막지 않는다.
     */
    private void requireNoPendingOffer(String tenantId, Long clientId, String sourceSkuCode) {
        List<ShopClientOffer> active = offerRepository
                .findByTenantIdAndClientIdAndSourceSkuCodeAndStatusAndIsDeletedFalse(
                        tenantId, clientId, sourceSkuCode, ShopClientOfferConstants.STATUS_ACTIVE);
        if (active.isEmpty()) {
            return;
        }
        Set<String> codes = new HashSet<>();
        active.forEach(r -> codes.add(r.getOfferSkuCode()));
        Set<String> paid = new HashSet<>(paidLookupRepository.findSkuCodesByClientAndStatus(
                tenantId, clientId, ShopClientOrderStatus.PAID, codes));
        if (!paid.containsAll(codes)) {
            throw new IllegalArgumentException(ShopClientOfferConstants.MSG_OFFER_ALREADY_PENDING);
        }
    }

    private ShopCatalogOffer resolveOffer(String tenantId, ShopCatalogSku sku) {
        if (!StringUtils.hasText(sku.getSourcePackageCode())) {
            return ShopCatalogOffer.unlinked(sku);
        }
        return packageOfferResolver.resolveLinked(tenantId, sku);
    }

    private static String offerTitle(ShopCatalogSku sku, ShopCatalogOffer offer) {
        return StringUtils.hasText(offer.title()) ? offer.title() : sku.getTitle();
    }

    private static ShopClientOfferResponse toResponse(ShopClientOffer row, ShopCatalogSku sku, boolean paid) {
        return new ShopClientOfferResponse(
                row.getId(),
                row.getClientId(),
                row.getSourceSkuCode(),
                row.getOfferSkuCode(),
                sku != null ? sku.getTitle() : row.getOfferSkuCode(),
                row.getDiscountType(),
                row.getDiscountValue(),
                row.getOriginalPriceMinor(),
                row.getFinalPriceMinor(),
                row.getStatus(),
                sku != null ? sku.getSessionCount() : null,
                sku != null ? sku.getValidityMonths() : null,
                paid,
                row.getCreatedAt());
    }
}
