/**
 * Step 2: 업종 선택 컴포넌트
 */

import { COMPONENT_CSS } from "../../constants/css-variables";
import { TRINITY_CONSTANTS } from "../../constants/trinity";
import type { BusinessCategory, BusinessCategoryItem } from "../../utils/api";
import type { OnboardingFormData } from "../../hooks/useOnboarding";

interface Step2BusinessTypeProps {
  formData: OnboardingFormData;
  setFormData: (data: OnboardingFormData | ((prev: OnboardingFormData) => OnboardingFormData)) => void;
  businessCategories: BusinessCategory[];
  businessCategoryItems: BusinessCategoryItem[];
  selectedCategoryId: string | null;
  setSelectedCategoryId: (categoryId: string | null) => void;
  loading: boolean;
}

export default function Step2BusinessType({
  formData,
  setFormData,
  businessCategories,
  businessCategoryItems,
  selectedCategoryId,
  setSelectedCategoryId,
  loading,
}: Step2BusinessTypeProps) {
  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategoryId(categoryId);
    setFormData({ ...formData, businessType: "" }); // 카테고리 변경 시 선택 초기화
  };

  const handleBusinessTypeSelect = (itemCode: string) => {
    setFormData({ ...formData, businessType: itemCode });
  };

  return (
    <div className={COMPONENT_CSS.ONBOARDING.STEP}>
      <h3 className="trinity-onboarding__step-title">업종 선택</h3>
      <p className="trinity-onboarding__step-description">
        서비스를 제공할 업종을 선택해주세요.
      </p>

      {loading && businessCategories.length === 0 ? (
        <div className={COMPONENT_CSS.ONBOARDING.MESSAGE}>
          {TRINITY_CONSTANTS.MESSAGES.LOADING_CATEGORIES}
        </div>
      ) : businessCategories.length === 0 ? (
        <div className={COMPONENT_CSS.ONBOARDING.MESSAGE_ERROR}>
          {TRINITY_CONSTANTS.MESSAGES.ERROR_CATEGORIES}
        </div>
      ) : (
        <div className={COMPONENT_CSS.ONBOARDING.CATEGORY_SECTION}>
          <h4 className="trinity-onboarding__label">업종 카테고리</h4>
          <div className={COMPONENT_CSS.ONBOARDING.GRID}>
            {businessCategories.map((category) => (
              <button
                key={category.categoryId}
                type="button"
                onClick={() => handleCategorySelect(category.categoryId)}
                className={`trinity-onboarding__grid-button ${
                  selectedCategoryId === category.categoryId
                    ? "trinity-onboarding__grid-button--active"
                    : ""
                }`}
              >
                <div className="trinity-onboarding__grid-button-content">
                  <div className="trinity-onboarding__grid-button-title">
                    {category.nameKo || category.categoryNameKo}
                  </div>
                </div>
              </button>
            ))}
          </div>

          {selectedCategoryId && (
            <div className={COMPONENT_CSS.ONBOARDING.CATEGORY_SECTION}>
              <h4 className="trinity-onboarding__label">세부 업종</h4>
              {loading ? (
                <div className={COMPONENT_CSS.ONBOARDING.MESSAGE}>
                  {TRINITY_CONSTANTS.MESSAGES.LOADING}
                </div>
              ) : businessCategoryItems.length === 0 ? (
                <div className={COMPONENT_CSS.ONBOARDING.MESSAGE_WARNING}>
                  {TRINITY_CONSTANTS.MESSAGES.NO_CATEGORY_ITEMS}
                </div>
              ) : (
                <div className={COMPONENT_CSS.ONBOARDING.GRID}>
                  {businessCategoryItems.map((item) => (
                    <button
                      key={item.itemId}
                      type="button"
                      onClick={() => handleBusinessTypeSelect(item.itemCode)}
                      className={`trinity-onboarding__grid-button ${
                        formData.businessType === item.itemCode
                          ? "trinity-onboarding__grid-button--active"
                          : ""
                      }`}
                    >
                      <div className="trinity-onboarding__grid-button-content">
                        <div className="trinity-onboarding__grid-button-title">
                          {item.nameKo || item.itemNameKo}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {formData.businessType && (
            <div className={COMPONENT_CSS.ONBOARDING.FIELD}>
              <p className={COMPONENT_CSS.ONBOARDING.TEXT_SECONDARY}>
                선택한 업종:{" "}
                <strong>
                  {
                    businessCategoryItems.find(
                      (item) => item.itemCode === formData.businessType
                    )?.nameKo
                  }
                </strong>
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

