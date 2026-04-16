import MGButton from '../../common/MGButton';
import { buildErpMgButtonClassName, ERP_MG_BUTTON_LOADING_TEXT } from '../../erp/common/erpMgButtonProps';
import { StatusBadge, CardContainer } from '../../common';
import SafeText from '../../common/SafeText';
import { toDisplayString } from '../../../utils/safeDisplay';
import './ClientMappingTab.css';

/**
 * 내담자 매칭 관리 탭 컴포넌트 (아토믹 디자인: mg-v2-client-mapping / mg-v2-mapping-client-block / mg-v2-card)
 * CLIENT_MAPPING_TAB_LAYOUT_SPEC 5절 DOM 구조 준수
 */
const ClientMappingTab = ({
  clients,
  consultants,
  mappings,
  onClientSelect
}) => {
  const mappingsByClient = mappings.reduce((acc, mapping) => {
    if (!acc[mapping.clientId]) {
      acc[mapping.clientId] = [];
    }
    acc[mapping.clientId].push(mapping);
    return acc;
  }, {});

  const renderMappingCard = (mapping) => {
    const consultant = consultants.find((c) => c.id === mapping.consultantId);
    const startDateStr = mapping.startDate ? new Date(mapping.startDate).toLocaleDateString('ko-KR') : 'N/A';
    const endDateStr = mapping.endDate ? new Date(mapping.endDate).toLocaleDateString('ko-KR') : null;
    const createdStr = mapping.createdAt ? new Date(mapping.createdAt).toLocaleDateString('ko-KR') : '날짜 없음';
    return (
      <CardContainer key={mapping.id} className="mg-v2-mapping-card__compact">
        <div className="mg-v2-card-header">
          <div className="mg-v2-mapping-info">
            <h4 className="mg-v2-mapping-card__title mg-v2-h4">매칭 #{mapping.id}</h4>
            <p className="mg-v2-mapping-date">
              {createdStr}
            </p>
          </div>
          <div className="mg-v2-mapping-status">
            <StatusBadge status={mapping.status} />
          </div>
        </div>
        <div className="mg-v2-card-content">
          <div className="mg-v2-mapping-details">
            <div className="mg-v2-mapping-card__row">
              <span className="mg-v2-mapping-card__label">상담사</span>
              <span className="mg-v2-mapping-card__value">
                <SafeText fallback="알 수 없음">{consultant?.name}</SafeText>
              </span>
            </div>
            {mapping.packageName && (
              <div className="mg-v2-mapping-card__row">
                <span className="mg-v2-mapping-card__label">패키지</span>
                <span className="mg-v2-mapping-card__value"><SafeText>{mapping.packageName}</SafeText></span>
              </div>
            )}
            {(mapping.totalSessions != null || mapping.remainingSessions !== undefined) && (
              <div className="mg-v2-mapping-card__row">
                <span className="mg-v2-mapping-card__label">회기</span>
                <span className="mg-v2-mapping-card__value mg-v2-mapping-card__value--emphasis">
                  {mapping.usedSessions ?? 0}/{mapping.totalSessions ?? 0} (남은: {mapping.remainingSessions ?? 0})
                </span>
              </div>
            )}
            <div className="mg-v2-mapping-card__row">
              <span className="mg-v2-mapping-card__label">시작일</span>
              <span className="mg-v2-mapping-card__value mg-v2-mapping-card__value--emphasis">{startDateStr}</span>
            </div>
            {endDateStr && (
              <div className="mg-v2-mapping-card__row">
                <span className="mg-v2-mapping-card__label">종료일</span>
                <span className="mg-v2-mapping-card__value mg-v2-mapping-card__value--emphasis">{endDateStr}</span>
              </div>
            )}
            {mapping.notes && (
              <div className="mg-v2-mapping-card__row">
                <span className="mg-v2-mapping-card__label">메모</span>
                <span className="mg-v2-mapping-card__value mg-v2-mapping-card__memo" title={toDisplayString(mapping.notes)}>
                  <SafeText>{mapping.notes}</SafeText>
                </span>
              </div>
            )}
          </div>
        </div>
        <div className="mg-v2-card-footer">
          <MGButton
            variant="secondary"
            size="small"
            className={buildErpMgButtonClassName({ variant: 'secondary', size: 'sm', loading: false })}
            loadingText={ERP_MG_BUTTON_LOADING_TEXT}
            preventDoubleClick={true}
          >
            상세보기
          </MGButton>
          <MGButton
            variant="secondary"
            size="small"
            className={buildErpMgButtonClassName({ variant: 'secondary', size: 'sm', loading: false })}
            loadingText={ERP_MG_BUTTON_LOADING_TEXT}
            preventDoubleClick={true}
          >
            수정
          </MGButton>
        </div>
      </CardContainer>
    );
  };

  const renderClientBlock = (client) => {
    const clientMappings = mappingsByClient[client.id] || [];
    return (
      <div key={client.id} className="mg-v2-mapping-client-block">
        <div className="mg-v2-mapping-client-block__header">
          <div className="mg-v2-mapping-client-block__info">
            <h3 className="mg-v2-mapping-client-block__name"><SafeText>{client.name}</SafeText></h3>
            <p className="mg-v2-mapping-client-block__email">
              <span className="mg-v2-client-email"><SafeText>{client.email}</SafeText></span>
            </p>
          </div>
          <div className="mg-v2-mapping-client-block__actions">
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
        <p className="mg-v2-mapping-client-block__count">총 {clientMappings.length}건의 매칭</p>
        {clientMappings.length === 0 ? (
          <div className="mg-v2-mapping-list-block__empty">
            <p className="mg-v2-mapping-list-block__empty-desc">매칭 정보가 없습니다.</p>
          </div>
        ) : (
          <div className="mg-v2-mapping-list-block__grid">
            {clientMappings.map(renderMappingCard)}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="mg-v2-client-mapping mg-v2-client-list-block">
      <header className="mg-v2-mapping-page-header">
        <h2 className="mg-v2-mapping-page-header__title mg-v2-h2">매칭 관리</h2>
        <p className="mg-v2-mapping-page-header__desc">내담자와 상담사의 매칭 정보를 확인하고 관리할 수 있습니다.</p>
      </header>
      {clients.length === 0 ? (
        <div className="mg-v2-mapping-list-block__empty">
          <h3 className="mg-v2-mapping-list-block__empty-title">등록된 내담자가 없습니다</h3>
          <p className="mg-v2-mapping-list-block__empty-desc">내담자를 등록한 후 매칭 정보를 확인할 수 있습니다.</p>
        </div>
      ) : (
        <div className="mg-v2-client-list mg-v2-content-area">
          {clients.map(renderClientBlock)}
        </div>
      )}
    </div>
  );
};

export default ClientMappingTab;
