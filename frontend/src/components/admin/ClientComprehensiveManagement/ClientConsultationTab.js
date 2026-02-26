import Button from '../../ui/Button/Button';
import { User, Calendar, Clock, Eye } from 'lucide-react';

/**
 * 내담자 상담 이력 탭 컴포넌트 (아토믹 디자인: mg-v2-client-list-block / mg-v2-mapping-list-block / mg-v2-card)
 */
const ClientConsultationTab = ({
    clients,
    consultations,
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

    // 상담 이력 카드 (mg-v2-card 패턴)
    const renderConsultationCard = (consultation) => (
        <div key={consultation.id} className="mg-v2-card mg-v2-consultation-card">
            <div className="mg-v2-card-header">
                <div className="mg-v2-consultation-info">
                    <h4 className="mg-v2-h4">상담 #{consultation.id}</h4>
                    <p className="mg-v2-consultation-date">
                        <Calendar size={14} /> {consultation.sessionDate ? new Date(consultation.sessionDate).toLocaleDateString('ko-KR') : '날짜 없음'}
                    </p>
                </div>
                <div className="mg-v2-consultation-status">
                    <span className="mg-v2-status-badge" style={{ '--status-bg-color': consultation.isSessionCompleted ? 'var(--mg-success-500, #22c55e)' : 'var(--mg-warning-500, #eab308)' }}>
                        {consultation.isSessionCompleted ? '완료' : '진행중'}
                    </span>
                </div>
            </div>
            <div className="mg-v2-card-content">
                <div className="mg-v2-consultation-details">
                    <p><span className="mg-v2-form-label">세션 번호</span> {consultation.sessionNumber ?? 'N/A'}</p>
                    <p><span className="mg-v2-form-label">상담 시간</span> <Clock size={12} /> {consultation.sessionDurationMinutes ?? 0}분</p>
                    {consultation.progressScore != null && (
                        <p><span className="mg-v2-form-label">진행 점수</span> {consultation.progressScore}</p>
                    )}
                    {consultation.consultantObservations && (
                        <p><span className="mg-v2-form-label">상담 내용</span> {consultation.consultantObservations}</p>
                    )}
                </div>
            </div>
        </div>
    );

    // 내담자별 블록 (mg-v2-mapping-list-block 패턴)
    const renderClientBlock = (client) => {
        const clientConsultations = consultationsByClient[client.id] || [];
        return (
            <div key={client.id} className="mg-v2-mapping-list-block">
                <div className="mg-v2-section-header mg-v2-mapping-list-block__header">
                    <div className="mg-v2-profile-card__info">
                        <h3 className="mg-v2-profile-card__name">{client.name}</h3>
                        <p className="mg-v2-profile-card__email"><span className="mg-v2-client-email">{client.email}</span></p>
                    </div>
                    <div className="mg-v2-profile-card__actions">
                        <Button variant="secondary" size="small" onClick={() => onClientSelect(client)} preventDoubleClick={true}>
                            <Eye size={14} /> 상세보기
                        </Button>
                    </div>
                    <p className="mg-v2-mapping-list-block__count">총 {clientConsultations.length}건의 상담 이력</p>
                </div>
                {clientConsultations.length === 0 ? (
                    <div className="mg-v2-mapping-list-block__empty">
                        <div className="mg-v2-mapping-list-block__empty-icon">
                            <Calendar size={32} />
                        </div>
                        <p className="mg-v2-mapping-list-block__empty-desc">상담 이력이 없습니다.</p>
                    </div>
                ) : (
                    <div className="mg-v2-mapping-list-block__grid">
                        {clientConsultations.map(renderConsultationCard)}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="mg-v2-client-consultation mg-v2-client-list-block">
            <div className="mg-v2-section-header">
                <h2 className="mg-v2-h2">상담 이력 관리</h2>
                <p className="mg-v2-section-desc">내담자별 상담 이력을 확인하고 관리할 수 있습니다.</p>
            </div>
            {clients.length === 0 ? (
                <div className="mg-v2-mapping-list-block__empty">
                    <div className="mg-v2-mapping-list-block__empty-icon">
                        <User size={48} />
                    </div>
                    <h3 className="mg-v2-mapping-list-block__empty-title">등록된 내담자가 없습니다</h3>
                    <p className="mg-v2-mapping-list-block__empty-desc">내담자를 등록한 후 상담 이력을 확인할 수 있습니다.</p>
                </div>
            ) : (
                <div className="mg-v2-client-list mg-v2-content-area">
                    {clients.map(renderClientBlock)}
                </div>
            )}
        </div>
    );
};

export default ClientConsultationTab;
