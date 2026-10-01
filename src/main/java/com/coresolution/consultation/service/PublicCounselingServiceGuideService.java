package com.coresolution.consultation.service;

import com.coresolution.consultation.constant.PublicCounselingServiceGuideKeys;
import com.coresolution.consultation.dto.publicguide.PublicCounselingServiceGuideView;
import com.coresolution.consultation.dto.publicguide.PublicCounselingServiceGuideView.CounselorRow;
import com.coresolution.consultation.dto.publicguide.PublicCounselingServiceGuideView.ProductRow;
import com.coresolution.consultation.dto.publicguide.PublicCounselingServiceGuideView.TypeCard;
import com.coresolution.consultation.entity.SystemConfig;
import com.coresolution.consultation.repository.SystemConfigRepository;
import com.coresolution.core.domain.Tenant;
import com.coresolution.core.service.PlatformLegalCopyService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 공개 상담 서비스 안내. 콘텐츠는 기존 system_config 키에서만 읽는다.
 *
 * @author CoreSolution
 * @since 2026-10-01
 */
@Service
@RequiredArgsConstructor
public class PublicCounselingServiceGuideService {

    /** 플랫폼 공통 정의. {name} 은 센터명. */
    public static final String ONE_LINER_FALLBACK_WITH_NAME =
            "%s는 상담사와 1:1로 만나 마음의 어려움을 함께 살펴보는 심리상담센터예요.";

    /** 센터명이 없을 때의 플랫폼 공통 정의. */
    public static final String ONE_LINER_FALLBACK_WITHOUT_NAME =
            "상담사와 1:1로 만나 마음의 어려움을 함께 살펴보는 심리상담센터예요.";

    public static final String REFUND_EMPTY_WITH_PHONE = "환불 규정은 센터에 문의해 주세요 (%s).";

    public static final String REFUND_EMPTY_WITHOUT_PHONE = "환불 규정은 센터에 문의해 주세요.";

    public static final int CENTER_INTRO_MAX_CHARS = 600;

    public static final int REFUND_SENTENCE_LIMIT = 2;

    private final SystemConfigRepository systemConfigRepository;
    private final PublicConsultationPackageService publicConsultationPackageService;
    private final ObjectMapper objectMapper;

    /**
     * 테넌트 공개 안내 모델을 만든다. tenant 가 null 이면 빈 센터·빈 상품.
     *
     * @param tenant 호스트로 찾은 테넌트. 없으면 null
     * @param canonicalUrl 요청 호스트 기준 canonical. 없으면 빈 문자열
     * @return 렌더 모델
     */
    @Transactional(readOnly = true)
    public PublicCounselingServiceGuideView load(Tenant tenant, String canonicalUrl) {
        PublicCounselingServiceGuideView view = new PublicCounselingServiceGuideView();
        String centerName = tenant == null ? "" : blankToEmpty(tenant.getName());
        view.setCenterName(centerName);
        if (tenant != null) {
            view.setRepresentativeName(blankToEmpty(tenant.getRepresentativeName()));
            view.setBusinessRegistrationNumber(blankToEmpty(tenant.getBusinessRegistrationNumber()));
            view.setMailOrderReportNumber(blankToEmpty(tenant.getMailOrderReportNumber()));
            view.setBusinessAddress(blankToEmpty(tenant.getBusinessAddress()));
            view.setBusinessLandline(blankToEmpty(tenant.getBusinessLandline()));
        }
        String oneLinerRaw = readConfig(tenant, PublicCounselingServiceGuideKeys.ONE_LINER);
        view.setOneLiner(resolveOneLiner(oneLinerRaw, centerName));
        view.setCenterIntro(truncate(
                readConfig(tenant, PublicCounselingServiceGuideKeys.CENTER_INTRO),
                CENTER_INTRO_MAX_CHARS));
        view.getTypes().addAll(readTypes(tenant));
        view.getCounselors().addAll(readCounselors(tenant));
        if (tenant != null && tenant.getTenantId() != null) {
            view.getProducts().addAll(toProductRows(
                    publicConsultationPackageService.buildPublicConsultationPackages(tenant.getTenantId())));
        }
        view.setRefundBody(resolveRefund(tenant));
        view.setPaymentNote(PlatformLegalCopyService.CONSULTATION_PACKAGE_PAYMENT_TYPE_NOTE);
        view.setCanonicalUrl(canonicalUrl == null ? "" : canonicalUrl);
        view.setPageTitle(buildTitle(centerName));
        view.setPageDescription(buildDescription(centerName));
        return view;
    }

    /**
     * by-subdomain 공개 응답에 넣을 맵.
     *
     * @param tenant 테넌트
     * @return JSON 직렬화 가능한 맵
     */
    @Transactional(readOnly = true)
    public Map<String, Object> toPublicMap(Tenant tenant) {
        PublicCounselingServiceGuideView view = load(tenant, "");
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("centerName", view.getCenterName());
        map.put("representativeName", view.getRepresentativeName());
        map.put("businessRegistrationNumber", view.getBusinessRegistrationNumber());
        map.put("mailOrderReportNumber", view.getMailOrderReportNumber());
        map.put("businessAddress", view.getBusinessAddress());
        map.put("businessLandline", view.getBusinessLandline());
        map.put("oneLiner", view.getOneLiner());
        map.put("centerIntro", view.getCenterIntro());
        map.put("refundBody", view.getRefundBody());
        map.put("paymentNote", view.getPaymentNote());
        map.put("pageTitle", view.getPageTitle());
        map.put("pageDescription", view.getPageDescription());
        map.put("types", view.getTypes());
        map.put("counselors", view.getCounselors());
        map.put("products", view.getProducts());
        map.put("showCenter", showCenter(view));
        return map;
    }

    /**
     * 상호·주소·연락처가 모두 비면 센터 섹션을 숨긴다.
     *
     * @param view 모델
     * @return 섹션을 보이면 true
     */
    public static boolean showCenter(PublicCounselingServiceGuideView view) {
        return !blankToEmpty(view.getCenterName()).isBlank()
                || !blankToEmpty(view.getBusinessAddress()).isBlank()
                || !blankToEmpty(view.getBusinessLandline()).isBlank();
    }

    /**
     * 상담 종류에 공통으로 쓸 1회 분. 값이 다르면 null.
     *
     * @param types 상담 종류
     * @return 분 또는 null
     */
    public static Integer sharedMinutes(List<TypeCard> types) {
        Integer found = null;
        if (types == null) {
            return null;
        }
        for (TypeCard type : types) {
            if (type.getMinutes() == null) {
                continue;
            }
            if (found == null) {
                found = type.getMinutes();
            } else if (!found.equals(type.getMinutes())) {
                return null;
            }
        }
        return found;
    }

    private String resolveOneLiner(String raw, String centerName) {
        if (raw != null && !raw.isBlank()) {
            return raw.trim();
        }
        if (centerName != null && !centerName.isBlank()) {
            return String.format(ONE_LINER_FALLBACK_WITH_NAME, centerName.trim());
        }
        return ONE_LINER_FALLBACK_WITHOUT_NAME;
    }

    private String resolveRefund(Tenant tenant) {
        String text = tenant == null ? "" : blankToEmpty(tenant.getRefundPolicyText());
        String summary = firstSentences(text, REFUND_SENTENCE_LIMIT);
        if (!summary.isBlank()) {
            return summary;
        }
        String phone = tenant == null ? "" : blankToEmpty(tenant.getBusinessLandline());
        if (!phone.isBlank()) {
            return String.format(REFUND_EMPTY_WITH_PHONE, phone);
        }
        return REFUND_EMPTY_WITHOUT_PHONE;
    }

    static String firstSentences(String text, int limit) {
        if (text == null || text.isBlank() || limit < 1) {
            return "";
        }
        String normalized = text.trim().replace("\r\n", "\n");
        String[] parts = normalized.split("(?<=다\\.)|(?<=요\\.)");
        StringBuilder sb = new StringBuilder();
        int count = 0;
        for (String part : parts) {
            String sentence = part.trim();
            if (sentence.isEmpty()) {
                continue;
            }
            if (count > 0) {
                sb.append(' ');
            }
            sb.append(sentence);
            count += 1;
            if (count >= limit) {
                break;
            }
        }
        if (count == 0) {
            return normalized;
        }
        return sb.toString().trim();
    }

    private static String buildTitle(String centerName) {
        if (centerName == null || centerName.isBlank()) {
            return "상담 서비스 안내";
        }
        return "상담 서비스 안내 · " + centerName.trim();
    }

    private static String buildDescription(String centerName) {
        String name = (centerName == null || centerName.isBlank()) ? "센터" : centerName.trim();
        return name + "의 심리상담 서비스 안내 — 상담 종류, 진행 절차, 상담사 자격, 상품·가격, 환불 규정을 확인할 수 있어요.";
    }

    private List<TypeCard> readTypes(Tenant tenant) {
        JsonNode node = readJson(tenant, PublicCounselingServiceGuideKeys.TYPES);
        List<TypeCard> types = new ArrayList<>();
        if (node == null || !node.isArray()) {
            return types;
        }
        for (JsonNode item : node) {
            String name = text(item, "name");
            if (name.isBlank()) {
                continue;
            }
            TypeCard card = new TypeCard();
            card.setName(name);
            card.setDescription(text(item, "description"));
            card.setAudience(text(item, "audience"));
            card.setModality(text(item, "modality"));
            card.setMinutes(intOrNull(item.get("minutes")));
            types.add(card);
        }
        return types;
    }

    private List<CounselorRow> readCounselors(Tenant tenant) {
        JsonNode node = readJson(tenant, PublicCounselingServiceGuideKeys.QUALIFICATIONS);
        List<CounselorRow> rows = new ArrayList<>();
        if (node == null || !node.isArray()) {
            return rows;
        }
        for (JsonNode item : node) {
            String name = text(item, "name");
            List<String> lines = new ArrayList<>();
            JsonNode lineNode = item.get("lines");
            if (lineNode != null && lineNode.isArray()) {
                for (JsonNode line : lineNode) {
                    if (line != null && line.isTextual() && !line.asText().isBlank()) {
                        lines.add(line.asText().trim());
                    }
                }
            }
            if (name.isBlank() && lines.isEmpty()) {
                continue;
            }
            CounselorRow row = new CounselorRow();
            row.setName(name);
            row.getLines().addAll(lines);
            rows.add(row);
        }
        return rows;
    }

    private List<ProductRow> toProductRows(List<Map<String, Object>> packages) {
        List<ProductRow> rows = new ArrayList<>();
        if (packages == null) {
            return rows;
        }
        for (Map<String, Object> pkg : packages) {
            ProductRow row = new ProductRow();
            row.setName(stringVal(pkg.get("name")));
            row.setDescription(stringVal(pkg.get("description")));
            row.setSessions(intObj(pkg.get("sessions")));
            row.setMinutes(intObj(pkg.get("durationMinutes")));
            row.setValidityMonths(intObj(pkg.get("validityMonths")));
            row.setPrice(longObj(pkg.get("price")));
            if (!row.getName().isBlank()) {
                rows.add(row);
            }
        }
        return rows;
    }

    private String readConfig(Tenant tenant, String key) {
        if (tenant == null || tenant.getTenantId() == null || tenant.getTenantId().isBlank()) {
            return "";
        }
        return systemConfigRepository
                .findByTenantIdAndConfigKeyAndIsActiveTrue(tenant.getTenantId(), key)
                .filter(row -> !Boolean.TRUE.equals(row.getIsEncrypted()))
                .map(SystemConfig::getConfigValue)
                .map(String::trim)
                .orElse("");
    }

    private JsonNode readJson(Tenant tenant, String key) {
        String raw = readConfig(tenant, key);
        if (raw.isBlank()) {
            return null;
        }
        try {
            return objectMapper.readTree(raw);
        } catch (Exception ex) {
            return null;
        }
    }

    private static String text(JsonNode node, String field) {
        if (node == null) {
            return "";
        }
        JsonNode value = node.get(field);
        if (value == null || value.isNull()) {
            return "";
        }
        return value.asText("").trim();
    }

    private static Integer intOrNull(JsonNode node) {
        if (node == null || node.isNull()) {
            return null;
        }
        if (node.isNumber()) {
            return node.intValue();
        }
        if (node.isTextual()) {
            try {
                return Integer.valueOf(node.asText().trim());
            } catch (NumberFormatException ex) {
                return null;
            }
        }
        return null;
    }

    private static Integer intObj(Object value) {
        if (value instanceof Number number) {
            return number.intValue();
        }
        return null;
    }

    private static Long longObj(Object value) {
        if (value instanceof Number number) {
            return number.longValue();
        }
        return null;
    }

    private static String stringVal(Object value) {
        return value == null ? "" : String.valueOf(value).trim();
    }

    private static String blankToEmpty(String value) {
        return value == null ? "" : value.trim();
    }

    private static String truncate(String value, int max) {
        if (value == null || value.isBlank()) {
            return "";
        }
        String trimmed = value.trim();
        if (trimmed.length() <= max) {
            return trimmed;
        }
        return trimmed.substring(0, max);
    }
}
