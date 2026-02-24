import Button from '../../ui/Button/Button';
import { User, Edit, Trash2, Eye, Key, Mail, Phone } from 'lucide-react';
import { getUserStatusKoreanNameSync, getUserGradeKoreanNameSync, getUserGradeIconSync, getStatusColorSync } from '../../../utils/codeHelper';
import '../ProfileCard.css';

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
            <div key={client.id} className="mg-v2-profile-card">
                <div className="mg-v2-profile-card__header">
                    <div className="mg-v2-profile-card__avatar">
                        <User size={24} />
                    </div>
                    <div className="mg-v2-profile-card__info">
                        <h3 className="mg-v2-profile-card__name">{client.name}</h3>
                        <div className="mg-v2-profile-card__contact">
                            <span className="mg-v2-profile-card__email">
                                <Mail size={12} /> {client.email}
                            </span>
                            <span className="mg-v2-profile-card__phone">
                                <Phone size={12} /> {client.phone}
                            </span>
                        </div>
                    </div>
                    <div className="mg-v2-profile-card__badges">
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
                
                <div className="mg-v2-profile-card__body">
                    <div className="mg-v2-profile-card__stats-grid">
                        <div className="mg-v2-profile-card__stat-item">
                            <span className="mg-v2-profile-card__stat-label">등록일</span>
                            <span className="mg-v2-profile-card__stat-value">
                                {client.createdAt ? new Date(client.createdAt).toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' }) : '-'}
                            </span>
                        </div>
                        <div className="mg-v2-profile-card__stat-item">
                            <span className="mg-v2-profile-card__stat-label">매칭 수</span>
                            <span className="mg-v2-profile-card__stat-value">{clientMappings.length}</span>
                        </div>
                        <div className="mg-v2-profile-card__stat-item">
                            <span className="mg-v2-profile-card__stat-label">상담 수</span>
                            <span className="mg-v2-profile-card__stat-value">{clientConsultations.length}</span>
                        </div>
                    </div>
                    
                    {client.notes && (
                        <div className="mg-v2-profile-card__extra-info">
                            <span className="mg-v2-profile-card__extra-label">특이사항:</span>
                            <span className="mg-v2-profile-card__extra-value">{client.notes}</span>
                        </div>
                    )}
                </div>
                
                <div className="mg-v2-profile-card__footer">
                    <div className="mg-v2-profile-card__actions">
                        <Button variant="secondary" size="small" onClick={() => onClientSelect(client)} preventDoubleClick={true}>
                            <Eye size={14} /> 상세보기
                        </Button>
                        <Button variant="primary" size="small" onClick={() => onEditClient(client)} preventDoubleClick={true}>
                            <Edit size={14} /> 수정
                        </Button>
                        {onResetPassword && (
                            <Button variant="secondary" size="small" onClick={() => onResetPassword(client)} title="비밀번호 초기화" preventDoubleClick={true}>
                                <Key size={14} /> 비밀번호 초기화
                            </Button>
                        )}
                        <Button variant="danger" size="small" onClick={() => onDeleteClient(client)} preventDoubleClick={true}>
                            <Trash2 size={14} /> 삭제
                        </Button>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="mg-v2-client-list-block">
            {clients.length === 0 ? (
                <div className="mg-v2-mapping-list-block__empty">
                    <div className="mg-v2-mapping-list-block__empty-icon">
                        <User size={48} />
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
