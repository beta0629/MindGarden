import React from 'react';
import MGButton from '../../common/MGButton';
import { FaUser, FaEdit, FaTrash, FaEye } from 'react-icons/fa';
import { getUserStatusKoreanNameSync, getUserGradeKoreanNameSync, getUserGradeIconSync, getStatusColorSync } from '../../../utils/codeHelper';

/**
 * 내담자 개요 탭 컴포넌트
 */
const ClientOverviewTab = ({
    clients,
    onClientSelect,
    onEditClient,
    onDeleteClient,
    consultants,
    mappings,
    consultations
}) => {
    // 내담자 카드 렌더링
    const renderClientCard = (client) => {
        // statusColor를 동기 함수로 처리 (undefined 방지)
        const statusColor = getStatusColorSync(client?.status);
        const statusKorean = getUserStatusKoreanNameSync(client?.status);
        
        // 공통 유틸리티 함수 사용 (동기 버전)
        const gradeIcon = getUserGradeIconSync(client.grade);
        const gradeKorean = getUserGradeKoreanNameSync(client.grade);
        
        // 해당 내담자의 매칭 정보
        const clientMappings = mappings.filter(mapping => mapping.clientId === client.id);
        const clientConsultations = consultations.filter(consultation => consultation.clientId === client.id);
        
        return (
            <div key={client.id} className="mg-v2-card mg-v2-client-card">
                <div className="mg-v2-card-header">
                    <div className="mg-v2-client-info">
                        <div className="mg-v2-client-avatar">
                            <FaUser />
                        </div>
                        <div className="mg-v2-client-details">
                            <h3 className="mg-v2-client-name">{client.name}</h3>
                            <p className="mg-v2-client-email">{client.email}</p>
                            <p className="mg-v2-client-phone">{client.phone}</p>
                        </div>
                    </div>
                    <div className="mg-v2-client-status">
                        <span 
                            className="mg-v2-status-badge"
                            style={{ backgroundColor: statusColor }}
                        >
                            {statusKorean}
                        </span>
                        <span className="mg-v2-grade-badge">
                            {gradeIcon} {gradeKorean}
                        </span>
                    </div>
                </div>
                
                <div className="mg-v2-card-content">
                    <div className="mg-v2-client-stats">
                        <div className="mg-v2-stat-item">
                            <span className="mg-v2-stat-label">매칭 수</span>
                            <span className="mg-v2-stat-value">{clientMappings.length}</span>
                        </div>
                        <div className="mg-v2-stat-item">
                            <span className="mg-v2-stat-label">상담 수</span>
                            <span className="mg-v2-stat-value">{clientConsultations.length}</span>
                        </div>
                        <div className="mg-v2-stat-item">
                            <span className="mg-v2-stat-label">등록일</span>
                            <span className="mg-v2-stat-value">
                                {new Date(client.createdAt).toLocaleDateString()}
                            </span>
                        </div>
                    </div>
                    
                    {client.notes && (
                        <div className="mg-v2-client-notes">
                            <p>{client.notes}</p>
                        </div>
                    )}
                </div>
                
                <div className="mg-v2-card-footer">
                    <MGButton
                        variant="secondary"
                        size="small"
                        onClick={() => onClientSelect(client)}
                    >
                        <FaEye /> 상세보기
                    </MGButton>
                    <MGButton
                        variant="primary"
                        size="small"
                        onClick={() => onEditClient(client)}
                    >
                        <FaEdit /> 수정
                    </MGButton>
                    <MGButton
                        variant="secondary"
                        size="small"
                        onClick={() => onDeleteClient(client)}
                    >
                        <FaTrash /> 삭제
                    </MGButton>
                </div>
            </div>
        );
    };

    return (
        <div className="mg-v2-client-overview">
            <div className="mg-v2-section-header">
                <h2>내담자 목록</h2>
                <p>총 {clients.length}명의 내담자가 등록되어 있습니다.</p>
            </div>
            
            {clients.length === 0 ? (
                <div className="mg-v2-empty-state">
                    <FaUser size={48} />
                    <h3>등록된 내담자가 없습니다</h3>
                    <p>새로운 내담자를 등록해보세요.</p>
                </div>
            ) : (
                <div className="mg-v2-client-grid">
                    {clients.map(renderClientCard)}
                </div>
            )}
        </div>
    );
};

export default ClientOverviewTab;
