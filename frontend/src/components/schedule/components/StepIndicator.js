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
        <div className="step-indicator-container">
            {/* 간단한 진행 표시기 */}
            <div className="step-indicator-steps">
                {steps.map((step, index) => {
                    const isActive = currentStep >= step.id;
                    const isCompleted = currentStep > step.id;
                    
                    return (
                        <div key={step.id} className="step-indicator-step">
                            {/* 단계 아이콘 */}
                            <div className={`step-indicator-icon ${isActive ? 'active' : 'inactive'}`}>
                                {isCompleted ? '✓' : step.icon}
                            </div>
                            
                            {/* 단계 제목 */}
                            <div className={`step-indicator-title ${isActive ? 'active' : 'inactive'}`}>
                                {step.title}
                            </div>
                            
                            {/* 연결선 */}
                            {index < steps.length - 1 && (
                                <div className={`step-indicator-line ${isActive ? 'active' : 'inactive'}`} />
                            )}
                        </div>
                    );
                })}
            </div>
            
            {/* 진행률 바 */}
            <div className="step-indicator-progress-bar">
                <div 
                    className="step-indicator-progress-fill"
                    data-width={progressPercentage}
                />
            </div>
        </div>
    );
};

export default StepIndicator;