package com.coresolution.consultation.service;

import com.coresolution.consultation.entity.CommonCode;
import com.coresolution.consultation.repository.CommonCodeRepository;
import com.coresolution.core.constant.OnboardingConstants;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 공개 홈·/legal/products용 CONSULTATION_PACKAGE 목록 조회.
 * 활성·미삭제 코드만. extraData.publicVisible === false 는 제외(누락·null → 포함).
 * 빈 목록 허용(가짜 플랫폼 상품 금지).
 *
 * @author CoreSolution
 * @since 2026-09-10
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class PublicConsultationPackageService {

    private final CommonCodeRepository commonCodeRepository;
    private final ObjectMapper objectMapper;

    /**
     * 테넌트 공개 상담 패키지 목록.
     *
     * @param tenantId 테넌트 ID
     * @return [{ name, description, price }, ...]
     */
    @Transactional(readOnly = true)
    public List<Map<String, Object>> buildPublicConsultationPackages(String tenantId) {
        if (tenantId == null || tenantId.isBlank()) {
            return List.of();
        }
        List<CommonCode> codes = commonCodeRepository
                .findByTenantIdAndCodeGroupAndIsActiveTrueOrderBySortOrderAsc(
                        tenantId,
                        OnboardingConstants.TENANT_COMMON_CODE_GROUP_CONSULTATION_PACKAGE);
        if (codes == null || codes.isEmpty()) {
            return List.of();
        }

        List<Map<String, Object>> packages = new ArrayList<>();
        for (CommonCode code : codes) {
            String name = firstNonBlank(code.getKoreanName(), code.getCodeLabel(), code.getCodeValue());
            if (name == null || name.isBlank()) {
                continue;
            }
            Map<String, Object> extra = parseExtraDataMap(code.getExtraData());
            if (isPublicVisibleFalse(extra)) {
                continue;
            }
            String description = firstNonBlank(
                    code.getCodeDescription(),
                    extra.get("remark") != null ? String.valueOf(extra.get("remark")) : null);
            Object priceObj = extra.get("price");
            Number price = toNumberOrNull(priceObj);

            Map<String, Object> item = new HashMap<>();
            item.put("name", name);
            item.put("description", description != null ? description : "");
            item.put("price", price);
            packages.add(item);
        }
        return packages;
    }

    /**
     * extraData.publicVisible === false 이면 공개 목록에서 제외.
     * 누락·null·true 는 포함(하위 호환).
     *
     * @param extra 파싱된 extraData 맵
     * @return true 이면 제외
     */
    private static boolean isPublicVisibleFalse(Map<String, Object> extra) {
        if (extra == null || extra.isEmpty()) {
            return false;
        }
        Object value = extra.get("publicVisible");
        if (value == null) {
            return false;
        }
        if (value instanceof Boolean bool) {
            return Boolean.FALSE.equals(bool);
        }
        if (value instanceof String str) {
            return "false".equalsIgnoreCase(str.trim());
        }
        return false;
    }

    private Map<String, Object> parseExtraDataMap(String extraDataJson) {
        if (extraDataJson == null || extraDataJson.isBlank()) {
            return Map.of();
        }
        try {
            return objectMapper.readValue(extraDataJson, new TypeReference<Map<String, Object>>() {});
        } catch (Exception e) {
            log.warn("공개 consultationPackages extraData 파싱 실패: {}", e.getMessage());
            return Map.of();
        }
    }

    private static Number toNumberOrNull(Object value) {
        if (value == null) {
            return null;
        }
        if (value instanceof Number number) {
            return number;
        }
        try {
            String s = String.valueOf(value).trim();
            if (s.isEmpty()) {
                return null;
            }
            if (s.contains(".")) {
                return Double.parseDouble(s);
            }
            return Long.parseLong(s);
        } catch (NumberFormatException e) {
            return null;
        }
    }

    private static String firstNonBlank(String... values) {
        if (values == null) {
            return null;
        }
        for (String v : values) {
            if (v != null && !v.isBlank()) {
                return v.trim();
            }
        }
        return null;
    }
}
