import Button from '../../ui/Button/Button';
import { FaUser, FaEdit, FaTrash, FaEye, FaKey } from 'react-icons/fa';
import { getUserStatusKoreanNameSync, getUserGradeKoreanNameSync, getUserGradeIconSync, getStatusColorSync } from '../../../utils/codeHelper';

/**
 * 내담자 개요 탭 컴포넌트
 */
const ClientOverviewTab = ({
    clients,
    onClientSelect,
    onEditClient,
    onDeleteClient,
    onResetPassword,
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
            <div key={client.id} className="mg-v2-client-card mg-v2-card">
                <div className="mg-v2-card-header mg-v2-client-card__header">
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
                            style={{ '--status-bg-color': statusColor }}
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
                            <span className="mg-v2-stat-value mg-v2-stat-value-date">
                                {client.createdAt ? new Date(client.createdAt).toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' }) : 'N/A'}
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
                    <Button variant="secondary" size="small" onClick={() => onClientSelect(client)} preventDoubleClick>
                        <FaEye /> 상세보기
                    </Button>
                    <Button variant="primary" size="small" onClick={() => onEditClient(client)} preventDoubleClick>
                        <FaEdit /> 수정
                    </Button>
                    {onResetPassword && (
                        <Button variant="secondary" size="small" onClick={() => onResetPassword(client)} title="비밀번호 초기화" preventDoubleClick>
                            <FaKey /> 비밀번호 초기화
                        </Button>
                    )}
                    <Button variant="secondary" size="small" onClick={() => onDeleteClient(client)} preventDoubleClick>
                        <FaTrash /> 삭제
                    </Button>
                </div>
            </div>
        );
    };

    return (
        <div className="mg-v2-client-list-block">
            {clients.length === 0 ? (
                <div className="mg-v2-mapping-list-block__empty">
                    <div className="mg-v2-mapping-list-block__empty-icon">
                        <FaUser size={48} />
                    </div>
                    <h3 className="mg-v2-mapping-list-block__empty-title">등록된 내담자가 없습니다</h3>
                    <p className="mg-v2-mapping-list-block__empty-desc">새로운 내담자를 등록해보세요.</p>
                </div>
            ) : (
                <div className="mg-v2-mapping-list-block__grid">
                    {clients.map(renderClientCard)}
                </div>
            )}
        </div>
    );
};

export default ClientOverviewTab;
