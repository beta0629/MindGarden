import MGButton from '../../common/MGButton';
import { buildErpMgButtonClassName, ERP_MG_BUTTON_LOADING_TEXT } from '../../erp/common/erpMgButtonProps';
import SafeText from '../../common/SafeText';
import { MappingCard } from '../../ui/Card/index';
import './ClientMappingTab.css';
import { useTranslation } from 'react-i18next';

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
  const { t } = useTranslation();
  const mappingsByClient = mappings.reduce((acc, mapping) => {
    if (!acc[mapping.clientId]) {
      acc[mapping.clientId] = [];
    }
    acc[mapping.clientId].push(mapping);
    return acc;
  }, {});

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
            {clientMappings.map((mapping) => {
              const consultant = consultants.find((c) => c.id === mapping.consultantId);
              return (
                <MappingCard
                  key={mapping.id}
                  variant="compact"
                  consultantName={consultant?.name}
                  {...mapping}
                />
              );
            })}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="mg-v2-client-mapping mg-v2-client-list-block">
      <header className="mg-v2-mapping-page-header">
        <h2 className="mg-v2-mapping-page-header__title mg-v2-h2">{t('admin.labels.matchingManagement')}</h2>
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
