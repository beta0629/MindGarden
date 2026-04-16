import MGButton from '../../common/MGButton';
import { buildErpMgButtonClassName, ERP_MG_BUTTON_LOADING_TEXT } from '../../erp/common/erpMgButtonProps';
import StatusBadge from '../../common/StatusBadge';
import SafeText from '../../common/SafeText';
import './ClientConsultationTab.css';

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
{consultation.sessionDate ? new Date(consultation.sessionDate).toLocaleDateString('ko-KR') : '날짜 없음'}
                    </p>
                </div>
                <div className="mg-v2-consultation-status">
                    <StatusBadge variant={consultation.isSessionCompleted ? 'success' : 'warning'}>
                        {consultation.isSessionCompleted ? '완료' : '진행중'}
                    </StatusBadge>
                </div>
            </div>
            <div className="mg-v2-card-content">
                <div className="mg-v2-consultation-details">
                    <p><span className="mg-v2-form-label">세션 번호</span> <SafeText fallback="N/A">{consultation.sessionNumber}</SafeText></p>
                    <p><span className="mg-v2-form-label">상담 시간</span>{consultation.sessionDurationMinutes ?? 0}분</p>
                    {consultation.progressScore != null && (
                        <p><span className="mg-v2-form-label">진행 점수</span> <SafeText>{consultation.progressScore}</SafeText></p>
                    )}
                    {consultation.consultantObservations && (
                        <p><span className="mg-v2-form-label">상담 내용</span> <SafeText>{consultation.consultantObservations}</SafeText></p>
                    )}
                </div>
            </div>
        </div>
    );

    // 내담자별 블록 (스펙: mg-v2-consultation-client-block, __header / __count 별도 행)
    const renderClientBlock = (client) => {
        const clientConsultations = consultationsByClient[client.id] || [];
        return (
            <div key={client.id} className="mg-v2-consultation-client-block">
                <div className="mg-v2-consultation-client-block__header">
                    <div className="mg-v2-consultation-client-block__info">
                        <h3 className="mg-v2-consultation-client-block__name"><SafeText>{client.name}</SafeText></h3>
                        <p className="mg-v2-consultation-client-block__email">
                            <span className="mg-v2-client-email"><SafeText>{client.email}</SafeText></span>
                        </p>
                    </div>
                    <div className="mg-v2-consultation-client-block__actions">
                        <MGButton
                            variant="secondary"
                            size="small"
                            className={buildErpMgButtonClassName({ variant: 'secondary', size: 'sm', loading: false })}
                            loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                            onClick={() => onClientSelect(client)}
                            preventDoubleClick={true}
                        >
                            상세보기
                        </MGButton>
                    </div>
                </div>
                <p className="mg-v2-consultation-client-block__count">총 {clientConsultations.length}건의 상담 이력</p>
                {clientConsultations.length === 0 ? (
                    <div className="mg-v2-mapping-list-block__empty">
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
            <header className="mg-v2-consultation-page-header">
                <h2 className="mg-v2-consultation-page-header__title mg-v2-h2">상담 이력 관리</h2>
                <p className="mg-v2-consultation-page-header__desc">내담자별 상담 이력을 확인하고 관리할 수 있습니다.</p>
            </header>
            {clients.length === 0 ? (
                <div className="mg-v2-mapping-list-block__empty">
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
