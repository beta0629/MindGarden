import Button from '../../ui/Button/Button';
import Avatar from '../../common/Avatar';
import { SmallCardGrid, ListTableView, StatusBadge } from '../../common';
import { User, Edit, Trash2, Eye, Key, Mail, Phone } from 'lucide-react';
import { getUserStatusKoreanNameSync, getUserGradeKoreanNameSync, getUserGradeIconSync, maskEncryptedDisplay } from '../../../utils/codeHelper';
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
    consultations,
    viewMode = 'smallCard'
}) => {
    // 내담자 카드 렌더링
    const renderClientCard = (client) => {
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
                    <Avatar
                        profileImageUrl={client.profileImageUrl}
                        displayName={client.name}
                        className="mg-v2-profile-card__avatar"
                        size={48}
                    />
                    <div className="mg-v2-profile-card__info">
                        <h3 className="mg-v2-profile-card__name">{maskEncryptedDisplay(client.name, '이름')}</h3>
                        <div className="mg-v2-profile-card__contact">
                            <span className="mg-v2-profile-card__email">
                                <Mail size={12} /> {maskEncryptedDisplay(client.email, '이메일')}
                            </span>
                            <span className="mg-v2-profile-card__phone">
                                <Phone size={12} /> {maskEncryptedDisplay(client.phone, '전화번호')}
                            </span>
                        </div>
                    </div>
                    <div className="mg-v2-profile-card__badges">
                        <StatusBadge status={client?.status}>{statusKorean}</StatusBadge>
                        <span className="mg-v2-grade-badge">
                            {gradeIcon} {gradeKorean}
                        </span>
                    </div>
                </div>
                
                <div className="mg-v2-profile-card__body">
                    <div className="mg-v2-profile-card__stats-grid">
                        <div className="mg-v2-profile-card__stat-item">
                            <span className="mg-v2-profile-card__stat-label">성별</span>
                            <span className="mg-v2-profile-card__stat-value">
                                {client.gender === 'MALE' ? '남성' : client.gender === 'FEMALE' ? '여성' : client.gender || '-'}
                            </span>
                        </div>
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
                    
                    {client.notes && !String(client.notes).startsWith('legacy::') && (
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

    const renderCompactClientCard = (client) => {
        const statusKorean = getUserStatusKoreanNameSync(client?.status);
        const gradeIcon = getUserGradeIconSync(client.grade);
        const gradeKorean = getUserGradeKoreanNameSync(client.grade);
        return (
            <div
                key={client.id}
                className="mg-v2-profile-card mg-v2-profile-card--compact"
                onClick={() => onClientSelect(client)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClientSelect(client); } }}
            >
                <div className="mg-v2-profile-card__header">
                    <Avatar
                        profileImageUrl={client.profileImageUrl}
                        displayName={client.name}
                        className="mg-v2-profile-card__avatar"
                        size={36}
                    />
                    <div className="mg-v2-profile-card__info">
                        <h3 className="mg-v2-profile-card__name">{maskEncryptedDisplay(client.name, '이름')}</h3>
                        <div className="mg-v2-profile-card__contact">
                            <span className="mg-v2-profile-card__email"><Mail size={12} /> {maskEncryptedDisplay(client.email, '이메일')}</span>
                            <span className="mg-v2-profile-card__phone"><Phone size={12} /> {maskEncryptedDisplay(client.phone, '전화번호')}</span>
                        </div>
                    </div>
                    <div className="mg-v2-profile-card__badges">
                        <StatusBadge status={client?.status}>{statusKorean}</StatusBadge>
                        <span className="mg-v2-grade-badge">{gradeIcon} {gradeKorean}</span>
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
            ) : viewMode === 'largeCard' ? (
                <div className="mg-v2-mapping-list-block__grid">
                    {clients.map(renderClientCard)}
                </div>
            ) : viewMode === 'smallCard' ? (
                <SmallCardGrid>
                    {clients.map(renderCompactClientCard)}
                </SmallCardGrid>
            ) : (
                <ListTableView
                    columns={[
                        { key: 'name', label: '이름' },
                        { key: 'email', label: '이메일' },
                        { key: 'status', label: '상태' },
                        { key: 'grade', label: '등급', hideOnMobile: true },
                        { key: 'createdAt', label: '등록일', hideOnMobile: true }
                    ]}
                    data={clients}
                    renderCell={(key, item) => {
                        if (key === 'name') return maskEncryptedDisplay(item.name, '이름');
                        if (key === 'email') return maskEncryptedDisplay(item.email, '이메일');
                        if (key === 'status') return getUserStatusKoreanNameSync(item?.status);
                        if (key === 'grade') return getUserGradeKoreanNameSync(item.grade);
                        if (key === 'createdAt') return item.createdAt ? new Date(item.createdAt).toLocaleDateString('ko-KR') : '-';
                        const v = item[key];
                        return v != null ? String(v) : '-';
                    }}
                    onRowClick={onClientSelect}
                />
            )}
        </div>
    );
};

export default ClientOverviewTab;
