import React from 'react';
import MGButton from '../../common/MGButton';
import { FaUser, FaHandshake, FaCalendarAlt } from 'react-icons/fa';
import { getMappingStatusKoreanNameSync } from '../../../utils/codeHelper';

/**
 * 내담자 매칭 관리 탭 컴포넌트
 */
const ClientMappingTab = ({
    clients,
    consultants,
    mappings,
    selectedClient,
    onClientSelect
}) => {
    // 내담자별 매칭 정보 그룹화
    const mappingsByClient = mappings.reduce((acc, mapping) => {
        if (!acc[mapping.clientId]) {
            acc[mapping.clientId] = [];
        }
        acc[mapping.clientId].push(mapping);
        return acc;
    }, {});

    // 매칭 카드 렌더링
    const renderMappingCard = (mapping) => {
        const consultant = consultants.find(c => c.id === mapping.consultantId);
        
        return (
            <div key={mapping.id} className="mg-v2-card mg-v2-mapping-card">
                <div className="mg-v2-card-header">
                    <div className="mg-v2-mapping-info">
                        <h4>매칭 #{mapping.id}</h4>
                        <p className="mg-v2-mapping-date">
                            <FaCalendarAlt /> {new Date(mapping.createdAt).toLocaleDateString()}
                        </p>
                    </div>
                    <div className="mg-v2-mapping-status">
                        <span className={`mg-v2-status-badge mg-v2-status-${mapping.status?.toLowerCase()}`}>
                            {getMappingStatusKoreanNameSync(mapping.status)}
                        </span>
                    </div>
                </div>
                
                <div className="mg-v2-card-content">
                    <div className="mg-v2-mapping-details">
                        <p><strong>상담사:</strong> {consultant?.name || '알 수 없음'}</p>
                        {mapping.packageName && (
                            <p><strong>패키지:</strong> {mapping.packageName}</p>
                        )}
                        {(mapping.totalSessions || mapping.remainingSessions !== undefined) && (
                            <p><strong>회기:</strong> {mapping.usedSessions || 0}/{mapping.totalSessions || 0} (남은: {mapping.remainingSessions || 0})</p>
                        )}
                        <p><strong>시작일:</strong> {new Date(mapping.startDate).toLocaleDateString()}</p>
                        {mapping.endDate && (
                            <p><strong>종료일:</strong> {new Date(mapping.endDate).toLocaleDateString()}</p>
                        )}
                        {mapping.notes && (
                            <p><strong>메모:</strong> {mapping.notes}</p>
                        )}
                    </div>
                </div>
                
                <div className="mg-v2-card-footer">
                    <MGButton variant="outline" size="small">
                        상세보기
                    </MGButton>
                    <MGButton variant="outline" size="small">
                        수정
                    </MGButton>
                </div>
            </div>
        );
    };

    // 내담자별 매칭 정보 렌더링
    const renderClientMappings = (client) => {
        const clientMappings = mappingsByClient[client.id] || [];
        
        return (
            <div key={client.id} className="mg-v2-client-mapping-section">
                <div className="mg-v2-section-header">
                    <h3>{client.name}</h3>
                    <p>총 {clientMappings.length}건의 매칭</p>
                </div>
                
                {clientMappings.length === 0 ? (
                    <div className="mg-v2-empty-state">
                        <FaHandshake size={32} />
                        <p>매칭 정보가 없습니다.</p>
                    </div>
                ) : (
                    <div className="mg-mobile-card-stack">
                        {clientMappings.map(renderMappingCard)}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="mg-v2-client-mapping">
            <div className="mg-v2-section-header">
                <h2>매칭 관리</h2>
                <p>내담자와 상담사의 매칭 정보를 확인하고 관리할 수 있습니다.</p>
            </div>
            
            <div className="mg-v2-client-list">
                {clients.map(client => (
                    <div key={client.id} className="mg-v2-client-item">
                        <div className="mg-v2-client-header">
                            <div className="mg-v2-client-info">
                                <FaUser />
                                <span>{client.name}</span>
                                <span className="mg-v2-client-email">({client.email})</span>
                            </div>
                            <MGButton
                                variant="outline"
                                size="small"
                                onClick={() => onClientSelect(client)}
                            >
                                상세보기
                            </MGButton>
                        </div>
                        {renderClientMappings(client)}
                    </div>
                ))}
            </div>
            
            {clients.length === 0 && (
                <div className="mg-v2-empty-state">
                    <FaUser size={48} />
                    <h3>등록된 내담자가 없습니다</h3>
                    <p>내담자를 등록한 후 매칭 정보를 확인할 수 있습니다.</p>
                </div>
            )}
        </div>
    );
};

export default ClientMappingTab;
