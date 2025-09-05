import React from 'react';
import './StepIndicator.css';

/**
 * 단계별 진행 표시기 컴포넌트
 * - 현재 단계 표시
 * - 진행률 시각화
 * - 단계별 제목 표시
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2024-12-19
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
    const progressPercentage = currentStep === 1 ? 0 : ((currentStep - 1) / (totalSteps - 1)) * 100;

    return (
        <div className="step-indicator">
            <div className="progress-bar">
                <div 
                    className="progress-fill" 
                    style={{ width: `${progressPercentage}%` }}
                />
            </div>
            
            <div className="steps-container">
                {steps.map((step, index) => (
                    <div 
                        key={step.id}
                        className={`step-item ${currentStep > step.id ? 'active' : ''} ${currentStep === step.id ? 'current' : ''}`}
                    >
                        <div className="step-icon">
                            {currentStep > step.id ? '✓' : step.icon}
                        </div>
                        <div className="step-content">
                            <div className="step-number">{step.id}</div>
                            <div className="step-title">{step.title}</div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default StepIndicator;
