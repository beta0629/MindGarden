import React from 'react';
// import './StepIndicator.css'; // 인라인 스타일로 변경

/**
 * 단계별 진행 표시기 컴포넌트
 * - 현재 단계 표시
 * - 진행률 시각화
 * - 단계별 제목 표시
 * 
 * @author MindGarden
 * @version 2.0.0
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
        <div className="step-indicator" style={{
            marginBottom: '2rem',
            padding: '24px',
            backgroundColor: '#f8f9fa',
            borderRadius: '16px',
            border: '1px solid #e9ecef'
        }}>
            <div className="steps-container" style={{
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                position: 'relative',
                padding: '0 20px'
            }}>
                {steps.map((step, index) => {
                    const isActive = currentStep >= step.id;
                    const isCurrent = currentStep === step.id;
                    const isCompleted = currentStep > step.id;
                    
                    return (
                        <div 
                            key={step.id}
                            className={`step-item ${isActive ? 'active' : ''} ${isCurrent ? 'current' : ''}`}
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                flex: 1,
                                position: 'relative',
                                zIndex: 2
                            }}
                        >
                            {/* 단계 번호와 아이콘 */}
                            <div style={{
                                width: '48px',
                                height: '48px',
                                borderRadius: '50%',
                                backgroundColor: isActive ? '#007bff' : '#ffffff',
                                border: `3px solid ${isActive ? '#007bff' : '#dee2e6'}`,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                marginBottom: '12px',
                                transition: 'all 0.3s ease',
                                boxShadow: isActive ? '0 4px 12px rgba(0, 123, 255, 0.3)' : '0 2px 4px rgba(0, 0, 0, 0.1)',
                                position: 'relative'
                            }}>
                                {isCompleted ? (
                                    <span style={{
                                        color: 'white',
                                        fontSize: '18px',
                                        fontWeight: 'bold'
                                    }}>✓</span>
                                ) : (
                                    <span style={{
                                        color: isActive ? 'white' : '#6c757d',
                                        fontSize: '16px'
                                    }}>
                                        {step.icon}
                                    </span>
                                )}
                                
                                {/* 현재 단계 강조 효과 */}
                                {isCurrent && (
                                    <div style={{
                                        position: 'absolute',
                                        top: '-4px',
                                        left: '-4px',
                                        right: '-4px',
                                        bottom: '-4px',
                                        borderRadius: '50%',
                                        border: '2px solid #007bff',
                                        opacity: 0.6,
                                        animation: 'pulse 2s infinite'
                                    }} />
                                )}
                            </div>
                            
                            {/* 단계 제목 */}
                            <div style={{
                                fontSize: '13px',
                                fontWeight: isCurrent ? '600' : '500',
                                color: isActive ? '#007bff' : '#6c757d',
                                textAlign: 'center',
                                lineHeight: '1.4',
                                transition: 'all 0.3s ease'
                            }}>
                                {step.title}
                            </div>
                            
                            {/* 단계 간 연결선 */}
                            {index < steps.length - 1 && (
                                <div style={{
                                    position: 'absolute',
                                    top: '24px',
                                    left: 'calc(50% + 20px)',
                                    right: 'calc(-50% + 20px)',
                                    height: '3px',
                                    backgroundColor: isActive ? '#007bff' : '#dee2e6',
                                    borderRadius: '2px',
                                    zIndex: 1,
                                    transition: 'all 0.3s ease'
                                }} />
                            )}
                        </div>
                    );
                })}
            </div>
            
            {/* 진행률 표시 */}
            <div style={{
                marginTop: '16px',
                height: '6px',
                backgroundColor: '#e9ecef',
                borderRadius: '3px',
                overflow: 'hidden'
            }}>
                <div style={{
                    width: `${progressPercentage}%`,
                    height: '100%',
                    background: 'linear-gradient(90deg, #007bff, #0056b3)',
                    borderRadius: '3px',
                    transition: 'width 0.5s ease'
                }} />
            </div>
        </div>
    );
};

export default StepIndicator;