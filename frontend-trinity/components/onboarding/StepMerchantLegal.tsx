/**
 * Step 7: 사업자·약관 (Clinic-OS merchant legal)
 */

import { useState } from "react";
import { COMPONENT_CSS } from "../../constants/css-variables";
import { KR_PUBLIC_DATA_COPY } from "../../content/krPublicData";
import { TRINITY_CONSTANTS } from "../../constants/trinity";
import type { OnboardingFormData } from "../../hooks/useOnboarding";
import type {
  AddressItem,
  BusinessVerificationResult,
} from "../../utils/krPublicDataApi";
import {
  BUSINESS_REGISTRATION_INVALID_MESSAGE,
  formatBusinessRegistrationNumber,
  isValidBusinessRegistrationNumberOrEmpty,
} from "../../utils/businessRegistrationNumber";
import "../../styles/components/step-merchant-legal.css";

interface StepMerchantLegalProps {
  formData: OnboardingFormData;
  setFormData: (
    data: OnboardingFormData | ((prev: OnboardingFormData) => OnboardingFormData)
  ) => void;
  bizNumberError: string | null;
  setBizNumberError: (error: string | null) => void;
  addressSearchEnabled?: boolean;
  onSearchAddress?: (keyword: string) => Promise<AddressItem[]>;
  businessLookupEnabled?: boolean;
  onLookupBusiness?: (payload: {
    businessRegistrationNumber: string;
    openingDate: string;
    representativeName: string;
  }) => Promise<BusinessVerificationResult>;
}

const ML = TRINITY_CONSTANTS.MERCHANT_LEGAL;

export default function StepMerchantLegal({
  formData,
  setFormData,
  bizNumberError,
  setBizNumberError,
  addressSearchEnabled = false,
  onSearchAddress,
  businessLookupEnabled = false,
  onLookupBusiness,
}: StepMerchantLegalProps) {
  const [addressHits, setAddressHits] = useState<AddressItem[]>([]);
  const [addressMessage, setAddressMessage] = useState<string | null>(null);
  const [addressSearching, setAddressSearching] = useState(false);
  const [verification, setVerification] = useState<BusinessVerificationResult | null>(
    null
  );
  const [verificationMessage, setVerificationMessage] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);
  const updateField = (key: keyof OnboardingFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
    setVerification(null);
    setVerificationMessage(null);
  };

  const handleBizNumberChange = (value: string) => {
    updateField("businessRegistrationNumber", value);
    if (!isValidBusinessRegistrationNumberOrEmpty(value)) {
      setBizNumberError(BUSINESS_REGISTRATION_INVALID_MESSAGE);
    } else {
      setBizNumberError(null);
    }
  };

  const handleBizNumberBlur = () => {
    const raw = formData.businessRegistrationNumber;
    if (!raw?.trim()) return;
    if (!isValidBusinessRegistrationNumberOrEmpty(raw)) {
      setBizNumberError(BUSINESS_REGISTRATION_INVALID_MESSAGE);
      return;
    }
    const formatted = formatBusinessRegistrationNumber(raw);
    if (formatted !== raw) {
      updateField("businessRegistrationNumber", formatted);
    }
    setBizNumberError(null);
  };

  const searchAddress = async () => {
    if (!onSearchAddress) {
      return;
    }
    setAddressSearching(true);
    setAddressMessage(null);
    try {
      const items = await onSearchAddress(formData.businessAddress || "");
      setAddressHits(items);
      if (items.length === 0) {
        setAddressMessage(KR_PUBLIC_DATA_COPY.ADDRESS_EMPTY);
      }
    } catch {
      setAddressHits([]);
      setAddressMessage(KR_PUBLIC_DATA_COPY.ADDRESS_FAILED);
    } finally {
      setAddressSearching(false);
    }
  };

  const lookupBusiness = async () => {
    if (!onLookupBusiness) {
      return;
    }
    const biz = formData.businessRegistrationNumber?.trim() || "";
    const opening = formData.openingDate?.trim() || "";
    const rep = formData.representativeName?.trim() || "";
    if (!biz || !opening || !rep) {
      return;
    }
    setVerifying(true);
    setVerificationMessage(null);
    try {
      const formatted = formatBusinessRegistrationNumber(biz);
      const result = await onLookupBusiness({
        businessRegistrationNumber: formatted,
        openingDate: opening,
        representativeName: rep,
      });
      setVerification(result || null);
      if (result?.suspendedWarning) {
        setVerificationMessage(KR_PUBLIC_DATA_COPY.WARNING_SUSPENDED);
      }
    } catch {
      setVerification(null);
      setVerificationMessage(KR_PUBLIC_DATA_COPY.VERIFY_FAILED);
    } finally {
      setVerifying(false);
    }
  };

  const centerName =
    (formData.tenantName && formData.tenantName.trim()) ||
    (formData.brandName && formData.brandName.trim()) ||
    "{센터명}";

  const previewBiz =
    formData.businessRegistrationNumber?.trim() || ML.FOOTER_PLACEHOLDER_BIZ;
  const previewRep =
    formData.representativeName?.trim() || ML.FOOTER_PLACEHOLDER_REP;
  const previewPhone =
    formData.businessLandline?.trim() || ML.FOOTER_PLACEHOLDER_PHONE;
  const previewAddress =
    formData.businessAddress?.trim() || ML.FOOTER_PLACEHOLDER_ADDRESS;
  const previewMailOrder =
    formData.mailOrderReportNumber?.trim() || ML.FOOTER_PLACEHOLDER_MAIL_ORDER;

  return (
    <div className={`${COMPONENT_CSS.ONBOARDING.STEP} trinity-merchant-legal`}>
      <h3 className="trinity-onboarding__step-title">{ML.STEP_TITLE}</h3>
      <p className="trinity-onboarding__step-description">{ML.STEP_DESCRIPTION}</p>
      <p className={`${COMPONENT_CSS.ONBOARDING.TEXT_SECONDARY} trinity-merchant-legal__note`}>
        {ML.MAIL_ORDER_NOTE}
      </p>
      <p className="trinity-merchant-legal__notice">{KR_PUBLIC_DATA_COPY.PRIVACY_NOTICE}</p>

      <section className="trinity-merchant-legal__section" aria-labelledby="ml-biz">
        <h4 id="ml-biz" className={COMPONENT_CSS.ONBOARDING.LABEL}>
          {ML.SECTION_BUSINESS}
        </h4>

        <div className={COMPONENT_CSS.ONBOARDING.FIELD}>
          <label className={COMPONENT_CSS.ONBOARDING.LABEL} htmlFor="ml-biz-number">
            {ML.LABEL_BIZ_NUMBER}{" "}
            <span className="trinity-progressive-field__required" aria-hidden="true">
              *
            </span>
          </label>
          <input
            id="ml-biz-number"
            type="text"
            className={COMPONENT_CSS.ONBOARDING.INPUT}
            value={formData.businessRegistrationNumber}
            onChange={(e) => handleBizNumberChange(e.target.value)}
            onBlur={handleBizNumberBlur}
            placeholder={ML.PLACEHOLDER_BIZ_NUMBER}
            aria-invalid={Boolean(bizNumberError)}
            aria-describedby={bizNumberError ? "ml-biz-error" : undefined}
            autoComplete="off"
            data-testid="onboarding-merchant-legal-biz-number"
          />
          {bizNumberError && (
            <p
              id="ml-biz-error"
              className={COMPONENT_CSS.ONBOARDING.ERROR_TEXT}
              role="alert"
            >
              {bizNumberError}
            </p>
          )}
        </div>

        <div className={COMPONENT_CSS.ONBOARDING.FIELD}>
          <label className={COMPONENT_CSS.ONBOARDING.LABEL} htmlFor="ml-rep">
            {ML.LABEL_REPRESENTATIVE}{" "}
            <span className="trinity-progressive-field__required" aria-hidden="true">
              *
            </span>
          </label>
          <input
            id="ml-rep"
            type="text"
            className={COMPONENT_CSS.ONBOARDING.INPUT}
            value={formData.representativeName}
            onChange={(e) => updateField("representativeName", e.target.value)}
            placeholder={ML.PLACEHOLDER_REPRESENTATIVE}
            autoComplete="name"
          />
        </div>

        <div className={COMPONENT_CSS.ONBOARDING.FIELD}>
          <label className={COMPONENT_CSS.ONBOARDING.LABEL} htmlFor="ml-opening">
            {KR_PUBLIC_DATA_COPY.LABEL_OPENING_DATE}{" "}
            <span className="trinity-progressive-field__required" aria-hidden="true">
              *
            </span>
          </label>
          <input
            id="ml-opening"
            type="date"
            className={COMPONENT_CSS.ONBOARDING.INPUT}
            value={formData.openingDate || ""}
            onChange={(e) => updateField("openingDate", e.target.value)}
            data-testid="onboarding-merchant-legal-opening-date"
          />
        </div>

        {businessLookupEnabled && onLookupBusiness && (
          <div
            className="trinity-merchant-legal__verification"
            data-testid="onboarding-merchant-legal-verification"
          >
            <span className={COMPONENT_CSS.ONBOARDING.LABEL}>
              {KR_PUBLIC_DATA_COPY.LABEL_VERIFICATION}
            </span>
            <button
              type="button"
              className="trinity-merchant-legal__verify"
              onClick={lookupBusiness}
              disabled={verifying}
              data-testid="onboarding-merchant-legal-verify"
            >
              {verifying
                ? KR_PUBLIC_DATA_COPY.VERIFYING
                : KR_PUBLIC_DATA_COPY.VERIFY}
            </button>
            {verification && (
              <div className="trinity-merchant-legal__verification-result">
                <p>
                  {KR_PUBLIC_DATA_COPY.LABEL_MATCH}{" "}
                  {verification.overallStatus || KR_PUBLIC_DATA_COPY.OVERALL_UNCONFIRMED}
                </p>
                <p>
                  {KR_PUBLIC_DATA_COPY.LABEL_STATUS}{" "}
                  {verification.businessStatus || KR_PUBLIC_DATA_COPY.OVERALL_UNCONFIRMED}
                </p>
                <p>
                  {KR_PUBLIC_DATA_COPY.LABEL_CHECKED_AT}{" "}
                  {verification.checkedAt || KR_PUBLIC_DATA_COPY.OVERALL_UNCONFIRMED}
                </p>
              </div>
            )}
            {verificationMessage && (
              <p
                className={
                  verification?.suspendedWarning
                    ? "trinity-merchant-legal__warning"
                    : COMPONENT_CSS.ONBOARDING.TEXT_SECONDARY
                }
                role={verification?.suspendedWarning ? "status" : undefined}
              >
                {verificationMessage}
              </p>
            )}
          </div>
        )}

        <div className={COMPONENT_CSS.ONBOARDING.FIELD}>
          <label className={COMPONENT_CSS.ONBOARDING.LABEL} htmlFor="ml-landline">
            {ML.LABEL_LANDLINE}{" "}
            <span className="trinity-progressive-field__required" aria-hidden="true">
              *
            </span>
          </label>
          <input
            id="ml-landline"
            type="text"
            className={COMPONENT_CSS.ONBOARDING.INPUT}
            value={formData.businessLandline}
            onChange={(e) => updateField("businessLandline", e.target.value)}
            placeholder={ML.PLACEHOLDER_LANDLINE}
            autoComplete="tel"
          />
        </div>

        <div className={COMPONENT_CSS.ONBOARDING.FIELD}>
          <label className={COMPONENT_CSS.ONBOARDING.LABEL} htmlFor="ml-address">
            {ML.LABEL_ADDRESS}{" "}
            <span className="trinity-progressive-field__required" aria-hidden="true">
              *
            </span>
          </label>
          <input
            id="ml-address"
            type="text"
            className={COMPONENT_CSS.ONBOARDING.INPUT}
            value={formData.businessAddress}
            onChange={(e) => updateField("businessAddress", e.target.value)}
            placeholder={ML.PLACEHOLDER_ADDRESS}
            autoComplete="street-address"
          />
          {addressSearchEnabled && onSearchAddress && (
            <button
              type="button"
              className="trinity-merchant-legal__address-search"
              onClick={searchAddress}
              disabled={addressSearching}
            >
              {addressSearching
                ? KR_PUBLIC_DATA_COPY.ADDRESS_SEARCHING
                : KR_PUBLIC_DATA_COPY.ADDRESS_SEARCH}
            </button>
          )}
          {addressMessage && (
            <p className={COMPONENT_CSS.ONBOARDING.TEXT_SECONDARY}>{addressMessage}</p>
          )}
          {addressHits.length > 0 && (
            <ul className="trinity-merchant-legal__address-hits">
              {addressHits.map((item) => (
                <li key={`${item.zipCode}-${item.roadAddress}`}>
                  <button
                    type="button"
                    className="trinity-merchant-legal__address-hit"
                    onClick={() => {
                      updateField("businessAddress", item.roadAddress);
                      setAddressHits([]);
                      setAddressMessage(null);
                    }}
                  >
                    {item.zipCode} {item.roadAddress}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <section className="trinity-merchant-legal__section" aria-labelledby="ml-mail">
        <h4 id="ml-mail" className={COMPONENT_CSS.ONBOARDING.LABEL}>
          {ML.SECTION_MAIL_ORDER}
        </h4>
        <div className={COMPONENT_CSS.ONBOARDING.FIELD}>
          <label className={COMPONENT_CSS.ONBOARDING.LABEL} htmlFor="ml-mail-order">
            {ML.LABEL_MAIL_ORDER}{" "}
            <span className={COMPONENT_CSS.ONBOARDING.TEXT_SECONDARY}>
              {ML.OPTIONAL_SUFFIX}
            </span>
          </label>
          <input
            id="ml-mail-order"
            type="text"
            className={COMPONENT_CSS.ONBOARDING.INPUT}
            value={formData.mailOrderReportNumber}
            onChange={(e) => updateField("mailOrderReportNumber", e.target.value)}
            placeholder={ML.PLACEHOLDER_MAIL_ORDER}
          />
        </div>
      </section>

      <section className="trinity-merchant-legal__section" aria-labelledby="ml-refund">
        <h4 id="ml-refund" className={COMPONENT_CSS.ONBOARDING.LABEL}>
          {ML.SECTION_REFUND}
        </h4>
        <div className={COMPONENT_CSS.ONBOARDING.FIELD}>
          <label className={COMPONENT_CSS.ONBOARDING.LABEL} htmlFor="ml-refund-text">
            {ML.LABEL_REFUND}{" "}
            <span className={COMPONENT_CSS.ONBOARDING.TEXT_SECONDARY}>
              {ML.OPTIONAL_SUFFIX}
            </span>
          </label>
          <textarea
            id="ml-refund-text"
            className={`${COMPONENT_CSS.ONBOARDING.INPUT} trinity-merchant-legal__textarea`}
            rows={3}
            value={formData.refundPolicyText}
            onChange={(e) => updateField("refundPolicyText", e.target.value)}
            placeholder={ML.PLACEHOLDER_REFUND}
          />
        </div>
      </section>

      <section className="trinity-merchant-legal__section" aria-labelledby="ml-price">
        <h4 id="ml-price" className={COMPONENT_CSS.ONBOARDING.LABEL}>
          {ML.SECTION_PRICE}
        </h4>
        <div className={COMPONENT_CSS.ONBOARDING.FIELD}>
          <label className={COMPONENT_CSS.ONBOARDING.LABEL} htmlFor="ml-price-text">
            {ML.LABEL_PRICE}{" "}
            <span className={COMPONENT_CSS.ONBOARDING.TEXT_SECONDARY}>
              {ML.OPTIONAL_SUFFIX}
            </span>
          </label>
          <textarea
            id="ml-price-text"
            className={`${COMPONENT_CSS.ONBOARDING.INPUT} trinity-merchant-legal__textarea`}
            rows={3}
            value={formData.productPriceGuideText}
            onChange={(e) => updateField("productPriceGuideText", e.target.value)}
            placeholder={ML.PLACEHOLDER_PRICE}
          />
        </div>
      </section>

      <aside
        className="trinity-merchant-legal__preview"
        aria-label={ML.PREVIEW_TITLE}
        data-testid="onboarding-merchant-legal-preview"
      >
        <h4 className={COMPONENT_CSS.ONBOARDING.LABEL}>{ML.PREVIEW_TITLE}</h4>
        <footer className="trinity-merchant-legal-footer" role="contentinfo">
          <div className="trinity-merchant-legal-footer__col">
            <strong className="trinity-merchant-legal-footer__title">{centerName}</strong>
            <p className="trinity-merchant-legal-footer__line">
              {previewBiz}
              {" · "}
              {previewRep}
              {" · "}
              {previewPhone}
            </p>
            <p className="trinity-merchant-legal-footer__line">{previewAddress}</p>
            <p className="trinity-merchant-legal-footer__line">{previewMailOrder}</p>
          </div>
          <div className="trinity-merchant-legal-footer__col">
            <strong className="trinity-merchant-legal-footer__title">{ML.FOOTER_GUIDE}</strong>
            <span className="trinity-merchant-legal-footer__link">{ML.FOOTER_REFUND_LINK}</span>
            <span className="trinity-merchant-legal-footer__link">{ML.FOOTER_PRICE_LINK}</span>
          </div>
        </footer>
        <p className={`${COMPONENT_CSS.ONBOARDING.TEXT_SECONDARY} trinity-merchant-legal__preview-note`}>
          {ML.PREVIEW_NOTE}
        </p>
      </aside>
    </div>
  );
}
