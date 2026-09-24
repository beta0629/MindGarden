package com.coresolution.consultation.service;

import com.coresolution.consultation.constant.ConsultationPackageCodeConstants;
import com.coresolution.consultation.constant.ShopCatalogSkuConstants;
import com.coresolution.consultation.constant.ShopSessionCountConstants;
import com.coresolution.consultation.dto.shop.ShopCatalogOffer;
import com.coresolution.consultation.dto.shop.ShopCatalogPackageIdentity;
import com.coresolution.consultation.entity.CommonCode;
import com.coresolution.consultation.entity.ShopCatalogSku;
import com.coresolution.consultation.repository.CommonCodeRepository;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.regex.Pattern;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

/**
 * 패키지 요금(CONSULTATION_PACKAGE)을 온라인 판매 조건으로 읽는다.
 *
 * @author MindGarden
 * @since 2026-09-24
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ShopCatalogPackageOfferResolver {

    private static final Pattern PACKAGE_CODE =
            Pattern.compile(ShopCatalogSkuConstants.PACKAGE_CODE_PATTERN);
    private static final String EXTRA_SESSIONS = "sessions";
    private static final String EXTRA_PRICE = "price";
    private static final TypeReference<Map<String, Object>> EXTRA_TYPE = new TypeReference<>() {
    };

    private final CommonCodeRepository commonCodeRepository;
    private final ObjectMapper objectMapper;

    /**
     * 테넌트의 사용 중 패키지 요금 목록.
     *
     * @param tenantId 테넌트 ID
     * @return 요금 행 (없으면 빈 목록)
     * @throws IllegalArgumentException tenantId 가 없을 때
     */
    @Transactional(readOnly = true)
    public List<ShopCatalogPackageIdentity> listActivePackages(String tenantId) {
        String tid = requireTenant(tenantId);
        List<CommonCode> rows = commonCodeRepository.findTenantCodesByGroup(
                tid, ConsultationPackageCodeConstants.CODE_GROUP);
        List<ShopCatalogPackageIdentity> out = new ArrayList<>();
        if (rows == null) {
            return out;
        }
        for (CommonCode row : rows) {
            if (row == null || Boolean.TRUE.equals(row.getIsDeleted()) || !StringUtils.hasText(row.getCodeValue())) {
                continue;
            }
            out.add(toIdentity(row));
        }
        return out;
    }

    /**
     * 패키지 코드 한 건. 없거나 삭제됐으면 예외.
     *
     * @param tenantId 테넌트 ID
     * @param packageCode 패키지 코드
     * @return 요금 식별 값 (가격 미준비 포함)
     * @throws IllegalArgumentException 코드가 없거나 tenantId 가 없을 때
     */
    @Transactional(readOnly = true)
    public ShopCatalogPackageIdentity requireIdentity(String tenantId, String packageCode) {
        String tid = requireTenant(tenantId);
        String code = requirePackageCode(packageCode);
        CommonCode row = commonCodeRepository
                .findByTenantIdAndCodeGroupAndCodeValue(
                        tid, ConsultationPackageCodeConstants.CODE_GROUP, code)
                .filter(item -> !Boolean.TRUE.equals(item.getIsDeleted()))
                .orElseThrow(() -> new IllegalArgumentException(ShopCatalogSkuConstants.PACKAGE_NOT_FOUND_MESSAGE));
        return toIdentity(row);
    }

    /**
     * 요금에 연결된 SKU의 판매 조건. 연결 코드가 없으면 호출하지 않는다.
     *
     * @param tenantId 테넌트 ID
     * @param sku 카탈로그 SKU
     * @return 패키지 단가·회기. 판매 불가면 sellable=false
     * @throws IllegalArgumentException tenantId 가 없을 때
     */
    @Transactional(readOnly = true)
    public ShopCatalogOffer resolveLinked(String tenantId, ShopCatalogSku sku) {
        String tid = requireTenant(tenantId);
        if (sku == null || !StringUtils.hasText(sku.getSourcePackageCode())) {
            return ShopCatalogOffer.unlinked(sku);
        }
        String code = sku.getSourcePackageCode().trim();
        CommonCode row = commonCodeRepository
                .findByTenantIdAndCodeGroupAndCodeValue(
                        tid, ConsultationPackageCodeConstants.CODE_GROUP, code)
                .filter(item -> !Boolean.TRUE.equals(item.getIsDeleted()))
                .orElse(null);
        if (row == null) {
            return unsellable(sku);
        }
        ShopCatalogPackageIdentity identity = toIdentity(row);
        if (!identity.active() || !identity.priceReady()
                || identity.unitPriceMinor() == null
                || identity.sessionCount() == null) {
            return unsellable(sku);
        }
        return new ShopCatalogOffer(
                true,
                true,
                identity.packageName(),
                identity.unitPriceMinor(),
                identity.sessionCount());
    }

    /**
     * 패키지 코드 형식 검증.
     *
     * @param packageCode 원본 코드
     * @return trim 된 코드
     * @throws IllegalArgumentException 형식이 아닐 때
     */
    public String requirePackageCode(String packageCode) {
        if (!StringUtils.hasText(packageCode)) {
            throw new IllegalArgumentException(ShopCatalogSkuConstants.PACKAGE_CODE_INVALID_MESSAGE);
        }
        String code = packageCode.trim();
        if (!PACKAGE_CODE.matcher(code).matches()) {
            throw new IllegalArgumentException(ShopCatalogSkuConstants.PACKAGE_CODE_INVALID_MESSAGE);
        }
        return code;
    }

    private static ShopCatalogOffer unsellable(ShopCatalogSku sku) {
        ShopCatalogOffer base = ShopCatalogOffer.unlinked(sku);
        return new ShopCatalogOffer(true, false, base.title(), base.unitPriceMinor(), base.sessionCount());
    }

    private ShopCatalogPackageIdentity toIdentity(CommonCode row) {
        String code = row.getCodeValue() != null ? row.getCodeValue().trim() : "";
        String name = firstNonBlank(row.getKoreanName(), row.getCodeLabel(), code);
        Map<String, Object> extra = parseExtra(row.getExtraData());
        Long price = toWonOrNull(extra.get(EXTRA_PRICE));
        Integer sessions = toSessionsOrNull(extra.get(EXTRA_SESSIONS));
        boolean active = Boolean.TRUE.equals(row.getIsActive());
        boolean priceReady = active && price != null && sessions != null && StringUtils.hasText(name);
        return new ShopCatalogPackageIdentity(code, name, price, sessions, active, priceReady);
    }

    private Map<String, Object> parseExtra(String extraData) {
        if (!StringUtils.hasText(extraData)) {
            return Map.of();
        }
        try {
            Map<String, Object> parsed = objectMapper.readValue(extraData, EXTRA_TYPE);
            return parsed != null ? parsed : Map.of();
        } catch (Exception ex) {
            log.warn("패키지 요금 extraData 파싱 실패: {}", ex.getMessage());
            return Map.of();
        }
    }

    private static Long toWonOrNull(Object value) {
        Double number = toFiniteDouble(value);
        if (number == null || number <= 0D || number > Long.MAX_VALUE || number != Math.rint(number)) {
            return null;
        }
        long won = number.longValue();
        if (won <= 0L) {
            return null;
        }
        return won;
    }

    private static Integer toSessionsOrNull(Object value) {
        Double number = toFiniteDouble(value);
        if (number == null
                || number < ShopSessionCountConstants.MIN_SESSION_COUNT
                || number > Integer.MAX_VALUE
                || number != Math.rint(number)) {
            return null;
        }
        int sessions = number.intValue();
        if (sessions < ShopSessionCountConstants.MIN_SESSION_COUNT) {
            return null;
        }
        return sessions;
    }

    private static Double toFiniteDouble(Object value) {
        if (value == null) {
            return null;
        }
        if (value instanceof Number number) {
            double parsed = number.doubleValue();
            return Double.isFinite(parsed) ? parsed : null;
        }
        String text = String.valueOf(value).trim();
        if (text.isEmpty()) {
            return null;
        }
        try {
            double parsed = Double.parseDouble(text);
            return Double.isFinite(parsed) ? parsed : null;
        } catch (NumberFormatException ex) {
            return null;
        }
    }

    private static String firstNonBlank(String... values) {
        if (values == null) {
            return "";
        }
        for (String value : values) {
            if (StringUtils.hasText(value)) {
                String trimmed = value.trim();
                if (trimmed.length() > ShopCatalogSkuConstants.TITLE_MAX_LENGTH) {
                    return trimmed.substring(0, ShopCatalogSkuConstants.TITLE_MAX_LENGTH);
                }
                return trimmed;
            }
        }
        return "";
    }

    private static String requireTenant(String tenantId) {
        if (!StringUtils.hasText(tenantId)) {
            throw new IllegalArgumentException("tenantId가 필요합니다.");
        }
        return tenantId.trim();
    }
}
