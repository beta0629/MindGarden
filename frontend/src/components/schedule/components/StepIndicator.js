import React from 'react';
import './StepIndicator.css';

/**
 * 단계별 진행 표시기 컴포넌트
/**
 * - 현재 단계 표시
/**
 * - 진행률 시각화
/**
 * - 단계별 제목 표시
/**
 * 
/**
 * @author MindGarden
/**
 * @version 2.0.0
/**
 * @since 2025-01-05
 */
const StepIndicator = ({ 
    currentStep, 
    totalSteps, 
    steps = [
        { id: 1, title: '상담사 선택', icon: '👨‍⚕️' },
        { id: 2, title: '내담자 선택', icon: '👤' },
        { id: 3, title: '시간 선택', icon: '⏰' },
        { id: 4, title: '세부사항', icon: '📝' }
    ]
}) => {
    const progressPercentage = ((currentStep - 1) / (totalSteps - 1)) * 100;
    
    console.log('StepIndicator 렌더링:', { currentStep, totalSteps, steps });

    return (
        <div className="mg-step-indicator">
            <div className="mg-step-indicator__steps">
                {steps.map((step, index) => {
                    const isActive = currentStep >= step.id;
                    const isCompleted = currentStep > step.id;
                    return (
                        <div key={step.id} className="mg-step-indicator__step">
                            <div className={`mg-step-indicator__step-icon ${isActive ? 'mg-step-indicator__step-icon--active' : 'mg-step-indicator__step-icon--inactive'}`}>
                                {isCompleted ? '✓' : step.icon}
                            </div>
                            <div className={`mg-step-indicator__title ${isActive ? 'mg-step-indicator__title--active' : 'mg-step-indicator__title--inactive'}`}>
                                {step.title}
                            </div>
                            {index < steps.length - 1 && (
                                <div className={`mg-step-indicator__line ${isActive ? 'mg-step-indicator__line--active' : 'mg-step-indicator__line--inactive'}`} />
                            )}
                        </div>
                    );
                })}
            </div>
            <div className="mg-step-indicator__progress">
                <div
                    className="mg-step-indicator__progress-fill"
                    style={{ width: `${progressPercentage}%` }}
                    data-width={progressPercentage}
                />
            </div>
        </div>
    );
};

export default StepIndicator;