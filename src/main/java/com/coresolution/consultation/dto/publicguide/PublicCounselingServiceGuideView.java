package com.coresolution.consultation.dto.publicguide;

import java.util.ArrayList;
import java.util.List;

/**
 * 공개 상담 서비스 안내 렌더 모델. DB 엔티티가 아니다.
 *
 * @author CoreSolution
 * @since 2026-10-01
 */
public class PublicCounselingServiceGuideView {

    private String centerName = "";
    private String representativeName = "";
    private String businessRegistrationNumber = "";
    private String mailOrderReportNumber = "";
    private String businessAddress = "";
    private String businessLandline = "";
    private String oneLiner = "";
    private String centerIntro = "";
    private String refundBody = "";
    private String paymentNote = "";
    private String canonicalUrl = "";
    private String pageTitle = "";
    private String pageDescription = "";
    /** 호스트에서 고른 서브도메인 라벨. 콘텐츠 키이며 숫자 테넌트 id 가 아니다. */
    private String tenantKey = "";
    private final List<TypeCard> types = new ArrayList<>();
    private final List<CounselorRow> counselors = new ArrayList<>();
    private final List<ProductRow> products = new ArrayList<>();

    public String getCenterName() {
        return centerName;
    }

    public void setCenterName(String centerName) {
        this.centerName = centerName;
    }

    public String getRepresentativeName() {
        return representativeName;
    }

    public void setRepresentativeName(String representativeName) {
        this.representativeName = representativeName;
    }

    public String getBusinessRegistrationNumber() {
        return businessRegistrationNumber;
    }

    public void setBusinessRegistrationNumber(String businessRegistrationNumber) {
        this.businessRegistrationNumber = businessRegistrationNumber;
    }

    public String getMailOrderReportNumber() {
        return mailOrderReportNumber;
    }

    public void setMailOrderReportNumber(String mailOrderReportNumber) {
        this.mailOrderReportNumber = mailOrderReportNumber;
    }

    public String getBusinessAddress() {
        return businessAddress;
    }

    public void setBusinessAddress(String businessAddress) {
        this.businessAddress = businessAddress;
    }

    public String getBusinessLandline() {
        return businessLandline;
    }

    public void setBusinessLandline(String businessLandline) {
        this.businessLandline = businessLandline;
    }

    public String getOneLiner() {
        return oneLiner;
    }

    public void setOneLiner(String oneLiner) {
        this.oneLiner = oneLiner;
    }

    public String getCenterIntro() {
        return centerIntro;
    }

    public void setCenterIntro(String centerIntro) {
        this.centerIntro = centerIntro;
    }

    public String getRefundBody() {
        return refundBody;
    }

    public void setRefundBody(String refundBody) {
        this.refundBody = refundBody;
    }

    public String getPaymentNote() {
        return paymentNote;
    }

    public void setPaymentNote(String paymentNote) {
        this.paymentNote = paymentNote;
    }

    public String getCanonicalUrl() {
        return canonicalUrl;
    }

    public void setCanonicalUrl(String canonicalUrl) {
        this.canonicalUrl = canonicalUrl;
    }

    public String getPageTitle() {
        return pageTitle;
    }

    public void setPageTitle(String pageTitle) {
        this.pageTitle = pageTitle;
    }

    public String getPageDescription() {
        return pageDescription;
    }

    public void setPageDescription(String pageDescription) {
        this.pageDescription = pageDescription;
    }

    public String getTenantKey() {
        return tenantKey;
    }

    public void setTenantKey(String tenantKey) {
        this.tenantKey = tenantKey == null ? "" : tenantKey;
    }

    public List<TypeCard> getTypes() {
        return types;
    }

    public List<CounselorRow> getCounselors() {
        return counselors;
    }

    public List<ProductRow> getProducts() {
        return products;
    }

    /**
     * 상담 종류 카드.
     */
    public static final class TypeCard {
        private String name = "";
        private String description = "";
        private String audience = "";
        private String modality = "";
        private Integer minutes;

        public String getName() {
            return name;
        }

        public void setName(String name) {
            this.name = name;
        }

        public String getDescription() {
            return description;
        }

        public void setDescription(String description) {
            this.description = description;
        }

        public String getAudience() {
            return audience;
        }

        public void setAudience(String audience) {
            this.audience = audience;
        }

        public String getModality() {
            return modality;
        }

        public void setModality(String modality) {
            this.modality = modality;
        }

        public Integer getMinutes() {
            return minutes;
        }

        public void setMinutes(Integer minutes) {
            this.minutes = minutes;
        }
    }

    /**
     * 공개 상담사 자격 행.
     */
    public static final class CounselorRow {
        private String name = "";
        private final List<String> lines = new ArrayList<>();

        public String getName() {
            return name;
        }

        public void setName(String name) {
            this.name = name;
        }

        public List<String> getLines() {
            return lines;
        }
    }

    /**
     * 공개 상품 행.
     */
    public static final class ProductRow {
        private String name = "";
        private String description = "";
        private Integer sessions;
        private Integer minutes;
        private Integer validityMonths;
        private Long price;

        public String getName() {
            return name;
        }

        public void setName(String name) {
            this.name = name;
        }

        public String getDescription() {
            return description;
        }

        public void setDescription(String description) {
            this.description = description;
        }

        public Integer getSessions() {
            return sessions;
        }

        public void setSessions(Integer sessions) {
            this.sessions = sessions;
        }

        public Integer getMinutes() {
            return minutes;
        }

        public void setMinutes(Integer minutes) {
            this.minutes = minutes;
        }

        public Integer getValidityMonths() {
            return validityMonths;
        }

        public void setValidityMonths(Integer validityMonths) {
            this.validityMonths = validityMonths;
        }

        public Long getPrice() {
            return price;
        }

        public void setPrice(Long price) {
            this.price = price;
        }
    }
}
