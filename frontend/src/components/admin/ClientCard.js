import React from 'react';
import './ClientCard.css';

/**
 * 내담자 카드 컴포넌트
 * - 아이폰 스타일과 글래스모피즘 효과 적용
 * - 아이콘과 함께 직관적인 정보 표시
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2024-12-19
 */
const ClientCard = ({ 
    client, 
    clientMappings = [], 
    activeMappings = [], 
    isSelected = false, 
    onClick 
}) => {
    const handleClick = () => {
        if (onClick) {
            onClick(client);
        }
    };

    return (
        <div 
            className={`client-card ${isSelected ? 'selected' : ''}`}
            onClick={handleClick}
        >
            <div className="client-card-header">
                <div className="client-profile">
                    <div className="client-avatar">
                        {client.name?.charAt(0) || '?'}
                    </div>
                    <div className="client-info">
                        <h4 className="client-name">
                            <i className="bi bi-person-circle"></i>
                            {client.name}
                        </h4>
                        <p className="client-email">
                            <i className="bi bi-envelope"></i>
                            {client.email}
                        </p>
                    </div>
                </div>
                
                {isSelected && (
                    <div className="selected-indicator">
                        <i className="bi bi-check-circle-fill"></i>
                    </div>
                )}
            </div>

            <div className="client-card-body">
                <div className="mapping-info">
                    <div className="mapping-count">
                        <i className="bi bi-diagram-3"></i>
                        매핑 {clientMappings.length}개
                    </div>
                    {activeMappings.length > 0 && (
                        <div className="active-mapping">
                            <i className="bi bi-check-circle-fill"></i>
                            활성 {activeMappings.length}개
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ClientCard;
