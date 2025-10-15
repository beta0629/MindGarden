import React from 'react';

/**
 * 전문분야 표시 공통 컴포넌트
 * - 다양한 형태로 전문분야 표시
 * - 일관된 스타일과 로직 적용
 * - 디버깅 지원
 * 
 * @author MindGarden
 * @version 2.0.0
 * @since 2025-01-15
 */
const SpecialtyDisplay = ({ 
    consultant, 
    variant = 'tag', // 'tag', 'text', 'inline', 'list'
    showTitle = false,
    maxItems = 1,
    className = '',
    debug = false
}) => {
    /**
     * 전문분야 텍스트 추출
     */
    const getSpecialties = () => {
        if (debug) {
            console.log('🔍 SpecialtyDisplay 전문분야 디버깅:', {
                name: consultant?.name,
                specialties: consultant?.specialties,
                specialty: consultant?.specialty,
                allProps: consultant
            });
        }
        
        const specialties = [];
        
        // specialties 배열이 있는 경우
        if (consultant?.specialties && Array.isArray(consultant.specialties)) {
            specialties.push(...consultant.specialties.filter(s => s && s.trim()));
        }
        
        // specialty 단일 값이 있는 경우 (중복 방지)
        if (consultant?.specialty && consultant.specialty.trim()) {
            const specialty = consultant.specialty.trim();
            if (!specialties.includes(specialty)) {
                specialties.push(specialty);
            }
        }
        
        return specialties.slice(0, maxItems);
    };

    /**
     * 전문분야가 없는 경우 기본값 반환
     */
    const getDefaultSpecialty = () => {
        return '일반 상담';
    };

    const specialties = getSpecialties();
    const hasSpecialties = specialties.length > 0;

    // 전문분야가 없는 경우
    if (!hasSpecialties) {
        if (variant === 'inline') {
            return null; // 인라인에서는 표시하지 않음
        }
        return (
            <div className={`specialty-display ${className}`}>
                {showTitle && <span className="specialty-display__title">전문 분야:</span>}
                <span className="specialty-display__default">{getDefaultSpecialty()}</span>
            </div>
        );
    }

    // variant별 렌더링
    switch (variant) {
        case 'tag':
            return (
                <div className={`specialty-display specialty-display--tag ${className}`}>
                    {showTitle && <div className="specialty-display__title">전문 분야</div>}
                    <div className="specialty-display__tags">
                        {specialties.map((specialty, index) => (
                            <div key={index} className="specialty-display__tag">
                                {specialty}
                            </div>
                        ))}
                    </div>
                </div>
            );

        case 'text':
            return (
                <div className={`specialty-display specialty-display--text ${className}`}>
                    {showTitle && <span className="specialty-display__title">전문 분야: </span>}
                    <span className="specialty-display__text">{specialties.join(', ')}</span>
                </div>
            );

        case 'inline':
            return (
                <span className={`specialty-display specialty-display--inline ${className}`}>
                    ({specialties[0]})
                </span>
            );

        case 'list':
            return (
                <div className={`specialty-display specialty-display--list ${className}`}>
                    {showTitle && <div className="specialty-display__title">전문 분야</div>}
                    <ul className="specialty-display__list">
                        {specialties.map((specialty, index) => (
                            <li key={index} className="specialty-display__list-item">
                                {specialty}
                            </li>
                        ))}
                    </ul>
                </div>
            );

        default:
            return null;
    }
};

export default SpecialtyDisplay;
