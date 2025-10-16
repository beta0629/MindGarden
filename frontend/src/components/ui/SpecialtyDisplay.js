import React from 'react';
import { getSpecialtyKoreanName, getSpecialtyKoreanNames } from '../../utils/codeHelper';

/**
 * 전문분야 표시 공통 컴포넌트
 * - 다양한 형태로 전문분야 표시
 * - 일관된 스타일과 로직 적용
 * - 공통 함수 사용으로 백엔드와 동일한 로직 적용
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
    maxItems = 10, // 기본값을 10으로 변경
    className = '',
    debug = false
}) => {
    /**
     * 전문분야 텍스트 추출 (공통 함수 사용)
     */
    const getSpecialties = () => {
        if (debug) {
            console.log('🔍 SpecialtyDisplay 전문분야 디버깅:', {
                name: consultant?.name,
                specialties: consultant?.specialties,
                specialty: consultant?.specialty,
                specialization: consultant?.specialization,
                specializationDetails: consultant?.specializationDetails,
                allProps: consultant
            });
            
            // 실제 데이터베이스 값 확인
            if (consultant?.specialization) {
                console.log('📊 specialization 원본 데이터:', consultant.specialization);
                console.log('📊 specialization split 결과:', consultant.specialization.split(','));
            }
            
            if (consultant?.specializationDetails) {
                console.log('📊 specializationDetails 원본 데이터:', consultant.specializationDetails);
                console.log('📊 specializationDetails 배열 길이:', consultant.specializationDetails.length);
                consultant.specializationDetails.forEach((detail, index) => {
                    console.log(`📊 specializationDetails[${index}]:`, detail);
                });
            }
        }
        
        const rawSpecialties = [];
        
        // specializationDetails가 우선순위가 높음 (백엔드에서 처리된 데이터)
        if (consultant?.specializationDetails && Array.isArray(consultant.specializationDetails)) {
            const details = consultant.specializationDetails
                .map(detail => detail.name || detail.code)
                .filter(name => name && name.trim());
            rawSpecialties.push(...details);
        }
        
        // specialization 필드 (백엔드에서 보내는 필드) - 쉼표로 구분된 문자열
        if (consultant?.specialization && consultant.specialization.trim()) {
            const specializations = consultant.specialization.split(',')
                .map(s => s.trim())
                .filter(s => s && !rawSpecialties.includes(s));
            rawSpecialties.push(...specializations);
        }
        
        // specialties 배열이 있는 경우
        if (consultant?.specialties && Array.isArray(consultant.specialties)) {
            consultant.specialties.forEach(s => {
                if (s && s.trim() && !rawSpecialties.includes(s.trim())) {
                    rawSpecialties.push(s.trim());
                }
            });
        }
        
        // specialty 단일 값이 있는 경우 (중복 방지)
        if (consultant?.specialty && consultant.specialty.trim()) {
            const specialty = consultant.specialty.trim();
            if (!rawSpecialties.includes(specialty)) {
                rawSpecialties.push(specialty);
            }
        }
        
        // 공통 함수를 사용하여 한글명으로 변환
        const koreanSpecialties = getSpecialtyKoreanNames(rawSpecialties);
        const result = koreanSpecialties.slice(0, maxItems);
        
        if (debug) {
            console.log('📊 원본 specialties 배열:', rawSpecialties);
            console.log('📊 한글 변환된 specialties 배열:', koreanSpecialties);
            console.log('📊 최종 specialties 배열 (maxItems 적용):', result);
            console.log('📊 최종 specialties 길이:', result.length);
        }
        
        return result;
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
            // 인라인에서도 기본값 표시
            return (
                <span className={`specialty-display specialty-display--inline ${className}`}>
                    &nbsp;(일반 상담)
                </span>
            );
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
                    &nbsp;({specialties.join(', ')})
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
