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
  loadBusinessCategories?: () => Promise<void>;
}

export default function Step2BusinessType({
  formData,
  setFormData,
  businessCategories,
  businessCategoryItems,
  selectedCategoryId,
  setSelectedCategoryId,
  loading,
  loadBusinessCategories,
}: Step2BusinessTypeProps) {
  const handleCategorySelect = (categoryId: string, categoryCode?: string) => {
    setSelectedCategoryId(categoryId);
    // 세부 업종이 없을 수 있으므로, 카테고리 코드를 businessType으로 자동 설정
    // 세부 업종이 있으면 나중에 덮어씌워짐
    if (categoryCode) {
      setFormData({ ...formData, businessType: categoryCode });
    } else {
      setFormData({ ...formData, businessType: "" }); // 카테고리 코드가 없으면 초기화
    }
  };

  const handleBusinessTypeSelect = (businessType: string) => {
    setFormData({ ...formData, businessType: businessType });
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
          <p>{TRINITY_CONSTANTS.MESSAGES.ERROR_CATEGORIES}</p>
          {loadBusinessCategories && (
            <button
              type="button"
              onClick={() => {
                loadBusinessCategories();
              }}
              className={COMPONENT_CSS.ONBOARDING.RETRY_BUTTON}
            >
              다시 시도
            </button>
          )}
        </div>
      ) : (
        <div className={COMPONENT_CSS.ONBOARDING.CATEGORY_SECTION}>
          <h4 className="trinity-onboarding__label">업종 카테고리</h4>
          <div className={COMPONENT_CSS.ONBOARDING.GRID}>
            {businessCategories.map((category) => (
              <button
                key={category.categoryId}
                type="button"
                onClick={() => handleCategorySelect(category.categoryId, category.categoryCode)}
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
                <div className={COMPONENT_CSS.ONBOARDING.MESSAGE}>
                  <p>선택한 카테고리에 세부 업종이 없습니다.</p>
                  <p className={COMPONENT_CSS.ONBOARDING.TEXT_SECONDARY}>
                    카테고리만 선택하여 진행할 수 있습니다.
                  </p>
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
                    // 세부 업종이 있으면 세부 업종 이름, 없으면 카테고리 이름 표시
                    businessCategoryItems.find(
                      (item) => item.itemCode === formData.businessType
                    )?.nameKo ||
                    businessCategories.find(
                      (category) => category.categoryCode === formData.businessType
                    )?.nameKo ||
                    formData.businessType
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

