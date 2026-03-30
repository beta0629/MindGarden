"use client";

import { COMPONENT_CSS } from "../../constants/css-variables";
import "../../styles/components/onboarding-welcome.css";

interface OnboardingWelcomeProps {
  onStart: () => void;
}

/**
 * 온보딩 환영 화면
 * iOS/Android 설정 화면 스타일의 첫 인사 화면
 * 
 * @author Trinity Team
 * @version 1.0.0
 * @since 2025-12-09
 */
export default function OnboardingWelcome({ onStart }: OnboardingWelcomeProps) {
  return (
    <div className="trinity-onboarding-welcome">
      <div className="trinity-onboarding-welcome__content">
        <div className="trinity-onboarding-welcome__icon">
          <div className="trinity-onboarding-welcome__icon-circle">
            ✨
          </div>
        </div>
        
        <h1 className="trinity-onboarding-welcome__title">
          환영합니다
        </h1>
        
        <p className="trinity-onboarding-welcome__subtitle">
          CoreSolution 서비스 신청을 시작합니다
        </p>
        
        <div className="trinity-onboarding-welcome__description">
          <p>
            간단한 정보만 입력하시면<br />
            빠르게 서비스 신청을 완료하실 수 있습니다.
          </p>
        </div>

        <div className="trinity-onboarding-welcome__features">
          <div className="trinity-onboarding-welcome__feature">
            <span className="trinity-onboarding-welcome__feature-icon">✓</span>
            <span>간편한 단계별 입력</span>
          </div>
          <div className="trinity-onboarding-welcome__feature">
            <span className="trinity-onboarding-welcome__feature-icon">✓</span>
            <span>빠른 신청 처리</span>
          </div>
          <div className="trinity-onboarding-welcome__feature">
            <span className="trinity-onboarding-welcome__feature-icon">✓</span>
            <span>안전한 정보 관리</span>
          </div>
        </div>

        <button
          type="button"
          onClick={onStart}
          className={`${COMPONENT_CSS.ONBOARDING.BUTTON} trinity-onboarding-welcome__start-button`}
        >
          시작하기
        </button>
      </div>
    </div>
  );
}

