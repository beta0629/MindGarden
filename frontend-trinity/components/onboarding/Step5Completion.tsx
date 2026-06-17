/**
 * Step 5: 신청 완료 컴포넌트
 */

import { COMPONENT_CSS } from "../../constants/css-variables";
import { TRINITY_CONSTANTS } from "../../constants/trinity";
import CoreSolutionLogo from "../CoreSolutionLogo";
import { V2Button } from "../ui/V2Button";
import type { OnboardingFormData } from "../../hooks/useOnboarding";

interface Step5CompletionProps {
  formData: OnboardingFormData;
}

export default function Step5Completion({ formData }: Step5CompletionProps) {
  return (
    <div className={COMPONENT_CSS.ONBOARDING.STEP}>
      <CoreSolutionLogo variant="primary" className="trinity-core-solution-logo--step" />
      <div className={COMPONENT_CSS.ONBOARDING.SUCCESS}>
        <h3 className="trinity-onboarding__step-title">
          {TRINITY_CONSTANTS.MESSAGES.ONBOARDING_SUCCESS}
        </h3>
        <p className={COMPONENT_CSS.ONBOARDING.SUCCESS_DETAIL}>
          신청하신 내용을 검토한 후 연락드리겠습니다.
        </p>
        
        <div className={`${COMPONENT_CSS.ONBOARDING.FIELD} trinity-onboarding__completion-info`}>
          <h4 className="trinity-onboarding__label">신청 정보</h4>
          <div className={COMPONENT_CSS.ONBOARDING.FLEX_COL}>
            <div className="trinity-onboarding__info-item">
              <strong>회사명:</strong> {formData.tenantName}
            </div>
            <div className="trinity-onboarding__info-item">
              <strong>휴대폰:</strong> {formData.contactPhone}
            </div>
            {formData.contactEmail && (
              <div className="trinity-onboarding__info-item">
                <strong>이메일:</strong> {formData.contactEmail}
              </div>
            )}
            {formData.businessType && (
              <div className="trinity-onboarding__info-item">
                <strong>업종:</strong> {formData.businessType}
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 w-full trinity-onboarding__completion-buttons">
          <V2Button
            href="/onboarding/status"
            variant="primary"
            size="lg"
            fullWidth
            className="rounded-xl shadow-lg hover:shadow-xl transition-all"
          >
            신청 상태 확인
          </V2Button>
          <V2Button
            href="/"
            variant="outline"
            size="lg"
            fullWidth
            className="rounded-xl"
          >
            {TRINITY_CONSTANTS.MESSAGES.GO_HOME}
          </V2Button>
        </div>
      </div>
    </div>
  );
}

