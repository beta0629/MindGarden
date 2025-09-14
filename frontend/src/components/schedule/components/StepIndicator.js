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
        <div style={{
            marginBottom: '2rem',
            padding: '20px',
            backgroundColor: 'white',
            borderRadius: '12px',
            border: '1px solid #e9ecef',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)'
        }}>
            {/* 간단한 진행 표시기 */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                position: 'relative',
                marginBottom: '16px'
            }}>
                {steps.map((step, index) => {
                    const isActive = currentStep >= step.id;
                    const isCompleted = currentStep > step.id;
                    
                    return (
                        <div key={step.id} style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            flex: 1,
                            position: 'relative'
                        }}>
                            {/* 단계 아이콘 */}
                            <div style={{
                                width: '40px',
                                height: '40px',
                                borderRadius: '50%',
                                backgroundColor: isActive ? '#28a745' : '#e9ecef',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                marginBottom: '8px',
                                fontSize: '16px',
                                color: isActive ? 'white' : '#6c757d',
                                border: `2px solid ${isActive ? '#28a745' : '#dee2e6'}`,
                                transition: 'all 0.3s ease'
                            }}>
                                {isCompleted ? '✓' : step.icon}
                            </div>
                            
                            {/* 단계 제목 */}
                            <div style={{
                                fontSize: '12px',
                                fontWeight: isActive ? '600' : '500',
                                color: isActive ? '#28a745' : '#6c757d',
                                textAlign: 'center',
                                lineHeight: '1.3'
                            }}>
                                {step.title}
                            </div>
                            
                            {/* 연결선 */}
                            {index < steps.length - 1 && (
                                <div style={{
                                    position: 'absolute',
                                    top: '20px',
                                    left: 'calc(50% + 20px)',
                                    right: 'calc(-50% + 20px)',
                                    height: '2px',
                                    backgroundColor: isActive ? '#28a745' : '#dee2e6',
                                    zIndex: 1
                                }} />
                            )}
                        </div>
                    );
                })}
            </div>
            
            {/* 진행률 바 */}
            <div style={{
                height: '4px',
                backgroundColor: '#e9ecef',
                borderRadius: '2px',
                overflow: 'hidden'
            }}>
                <div style={{
                    width: `${progressPercentage}%`,
                    height: '100%',
                    backgroundColor: '#28a745',
                    transition: 'width 0.5s ease'
                }} />
            </div>
        </div>
    );
};

export default StepIndicator;