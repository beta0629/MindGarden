import React from 'react';
import MGButton from '../../common/MGButton';
import { FaUser, FaCalendarAlt, FaClock } from 'react-icons/fa';

/**
 * 내담자 상담 이력 탭 컴포넌트
 */
const ClientConsultationTab = ({
    clients,
    consultations,
    selectedClient,
    onClientSelect
}) => {
    // 내담자별 상담 이력 그룹화
    const consultationsByClient = consultations.reduce((acc, consultation) => {
        if (!acc[consultation.clientId]) {
            acc[consultation.clientId] = [];
        }
        acc[consultation.clientId].push(consultation);
        return acc;
    }, {});

    // 상담 이력 카드 렌더링
    const renderConsultationCard = (consultation) => (
        <div key={consultation.id} className="mg-v2-card mg-v2-consultation-card">
            <div className="mg-v2-card-header">
                <div className="mg-v2-consultation-info">
                    <h4>상담 #{consultation.id}</h4>
                    <p className="mg-v2-consultation-date">
                        <FaCalendarAlt /> {new Date(consultation.date).toLocaleDateString()}
                    </p>
                </div>
                <div className="mg-v2-consultation-status">
                    <span className={`mg-v2-status-badge mg-v2-status-${consultation.status?.toLowerCase()}`}>
                        {consultation.status}
                    </span>
                </div>
            </div>
            
            <div className="mg-v2-card-content">
                <div className="mg-v2-consultation-details">
                    <p><strong>상담사:</strong> {consultation.consultantName}</p>
                    <p><strong>상담 시간:</strong> 
                        <FaClock /> {consultation.duration}분
                    </p>
                    <p><strong>상담 유형:</strong> {consultation.type}</p>
                    {consultation.notes && (
                        <p><strong>상담 내용:</strong> {consultation.notes}</p>
                    )}
                </div>
            </div>
        </div>
    );

    // 내담자별 상담 이력 렌더링
    const renderClientConsultations = (client) => {
        const clientConsultations = consultationsByClient[client.id] || [];
        
        return (
            <div key={client.id} className="mg-v2-client-consultation-section">
                <div className="mg-v2-section-header">
                    <h3>{client.name}</h3>
                    <p>총 {clientConsultations.length}건의 상담 이력</p>
                </div>
                
                {clientConsultations.length === 0 ? (
                    <div className="mg-v2-empty-state">
                        <FaCalendarAlt size={32} />
                        <p>상담 이력이 없습니다.</p>
                    </div>
                ) : (
                    <div className="mg-mobile-card-stack">
                        {clientConsultations.map(renderConsultationCard)}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="mg-v2-client-consultation">
            <div className="mg-v2-section-header">
                <h2>상담 이력 관리</h2>
                <p>내담자별 상담 이력을 확인하고 관리할 수 있습니다.</p>
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
                        {renderClientConsultations(client)}
                    </div>
                ))}
            </div>
            
            {clients.length === 0 && (
                <div className="mg-v2-empty-state">
                    <FaUser size={48} />
                    <h3>등록된 내담자가 없습니다</h3>
                    <p>내담자를 등록한 후 상담 이력을 확인할 수 있습니다.</p>
                </div>
            )}
        </div>
    );
};

export default ClientConsultationTab;
