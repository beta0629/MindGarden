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
            padding: '20px',
            backgroundColor: 'white',
            borderRadius: '12px',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
            border: '1px solid #e9ecef'
        }}>
            <div className="progress-bar" style={{
                height: '4px',
                backgroundColor: '#e9ecef',
                borderRadius: '2px',
                marginBottom: '20px',
                overflow: 'hidden'
            }}>
                <div 
                    className="progress-fill" 
                    style={{ 
                        width: `${progressPercentage}%`,
                        height: '100%',
                        backgroundColor: '#28a745',
                        borderRadius: '2px',
                        transition: 'width 0.3s ease'
                    }}
                />
            </div>
            
            <div className="steps-container" style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                gap: '10px'
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
                                position: 'relative'
                            }}
                        >
                            <div className="step-icon" style={{
                                width: '50px',
                                height: '50px',
                                borderRadius: '50%',
                                backgroundColor: isActive ? '#28a745' : '#e9ecef',
                                border: `2px solid ${isActive ? '#28a745' : '#dee2e6'}`,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '20px',
                                color: isActive ? 'white' : '#6c757d',
                                marginBottom: '10px',
                                transition: 'all 0.3s ease',
                                position: 'relative',
                                zIndex: 2
                            }}>
                                {isCompleted ? '✓' : step.icon}
                            </div>
                            <div className="step-content" style={{
                                textAlign: 'center'
                            }}>
                                <div className="step-number" style={{
                                    width: '24px',
                                    height: '24px',
                                    borderRadius: '50%',
                                    backgroundColor: isActive ? '#28a745' : '#e9ecef',
                                    color: isActive ? 'white' : '#6c757d',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '12px',
                                    fontWeight: '600',
                                    margin: '0 auto 8px auto',
                                    transition: 'all 0.3s ease'
                                }}>
                                    {step.id}
                                </div>
                                <div className="step-title" style={{
                                    fontSize: '14px',
                                    fontWeight: '500',
                                    color: isActive ? '#28a745' : '#6c757d',
                                    transition: 'all 0.3s ease'
                                }}>
                                    {step.title}
                                </div>
                            </div>
                            
                            {/* 단계 간 연결선 */}
                            {index < steps.length - 1 && (
                                <div style={{
                                    position: 'absolute',
                                    top: '25px',
                                    left: '75px',
                                    right: '-25px',
                                    height: '2px',
                                    backgroundColor: isActive ? '#28a745' : '#dee2e6',
                                    zIndex: 1,
                                    transition: 'all 0.3s ease'
                                }} />
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default StepIndicator;