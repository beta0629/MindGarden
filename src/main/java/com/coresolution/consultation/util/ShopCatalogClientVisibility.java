package com.coresolution.consultation.util;

import java.util.ArrayList;
import java.util.List;
import com.coresolution.consultation.entity.ConsultantClientMapping;
import com.coresolution.consultation.entity.User;
import org.springframework.util.StringUtils;

/**
 * 로그인 내담자에게 상담 상품을 보여줄지 판단한다.
 * <p>상담사 id 가 있으면 활성 배정의 상담사와 같을 때만 보인다.
 * 배정이 여러 명이면 그 합집합이다.
 * id 가 없으면 분야 코드 또는 패키지명 매칭을 유지한다. 매칭 실패는 숨김.</p>
 *
 * @author MindGarden
 * @since 2026-09-26
 */
public final class ShopCatalogClientVisibility {

    private ShopCatalogClientVisibility() {
    }

    /**
     * CONSULTATION SKU 가 이 내담자의 활성 매핑과 맞는지.
     *
     * @param fieldCode 분야 공통코드. null 이면 패키지명만 비교
     * @param packageCandidates 제목·sourcePackageCode·패키지명
     * @param fieldCodeAliases 분야 코드의 표시명. 코드가 없을 때는 무시
     * @param mappings 내담자 활성 매핑
     * @return 하나라도 맞으면 true
     */
    public static boolean isConsultationVisible(
            String fieldCode,
            List<String> packageCandidates,
            List<String> fieldCodeAliases,
            List<ConsultantClientMapping> mappings) {
        return isConsultationVisible(fieldCode, packageCandidates, fieldCodeAliases, mappings, null);
    }

    /**
     * CONSULTATION SKU 가 이 내담자의 활성 매핑과 맞는지.
     *
     * @param fieldCode 분야 공통코드. 상담사 id 가 있으면 무시
     * @param packageCandidates 제목·sourcePackageCode·패키지명. 상담사 id 가 있으면 무시
     * @param fieldCodeAliases 분야 코드의 표시명. 상담사 id 가 있으면 무시
     * @param mappings 내담자 활성 매핑
     * @param boundConsultantId 상품에 묶인 상담사 users.id. null 이면 분야·패키지 매칭
     * @return 하나라도 맞으면 true
     */
    public static boolean isConsultationVisible(
            String fieldCode,
            List<String> packageCandidates,
            List<String> fieldCodeAliases,
            List<ConsultantClientMapping> mappings,
            Long boundConsultantId) {
        if (mappings == null || mappings.isEmpty()) {
            return false;
        }
        if (boundConsultantId != null) {
            for (ConsultantClientMapping mapping : mappings) {
                if (mapping == null || mapping.getConsultant() == null) {
                    continue;
                }
                if (boundConsultantId.equals(mapping.getConsultant().getId())) {
                    return true;
                }
            }
            return false;
        }
        boolean hasFieldCode = StringUtils.hasText(fieldCode);
        List<String> candidates = new ArrayList<>();
        if (packageCandidates != null) {
            for (String candidate : packageCandidates) {
                addText(candidates, candidate);
            }
        }
        if (hasFieldCode) {
            addText(candidates, fieldCode);
            if (fieldCodeAliases != null) {
                for (String alias : fieldCodeAliases) {
                    addText(candidates, alias);
                }
            }
        }
        for (ConsultantClientMapping mapping : mappings) {
            if (hasFieldCode && specialtyMatches(mapping, fieldCode, fieldCodeAliases)) {
                return true;
            }
            if (ShopConsultantMappingBindUtil.matchesAnyPackageCandidate(mapping, candidates)) {
                return true;
            }
        }
        return false;
    }

    private static boolean specialtyMatches(
            ConsultantClientMapping mapping, String fieldCode, List<String> aliases) {
        if (mapping == null || mapping.getConsultant() == null) {
            return false;
        }
        User consultant = mapping.getConsultant();
        return valueMatches(consultant.getSpecialty(), fieldCode, aliases)
                || valueMatches(consultant.getSpecialization(), fieldCode, aliases);
    }

    private static boolean valueMatches(String stored, String fieldCode, List<String> aliases) {
        if (!StringUtils.hasText(stored) || !StringUtils.hasText(fieldCode)) {
            return false;
        }
        String code = fieldCode.trim();
        for (String token : stored.split("[,;|]")) {
            if (!StringUtils.hasText(token)) {
                continue;
            }
            String piece = token.trim();
            if (piece.equalsIgnoreCase(code)) {
                return true;
            }
            if (aliases == null) {
                continue;
            }
            for (String alias : aliases) {
                if (StringUtils.hasText(alias) && piece.equalsIgnoreCase(alias.trim())) {
                    return true;
                }
            }
        }
        return false;
    }

    private static void addText(List<String> target, String value) {
        if (!StringUtils.hasText(value)) {
            return;
        }
        String trimmed = value.trim();
        for (String existing : target) {
            if (existing.equalsIgnoreCase(trimmed)) {
                return;
            }
        }
        target.add(trimmed);
    }
}
