import Button from '../../ui/Button/Button';
import { User, Handshake, Calendar, Eye } from 'lucide-react';
import { getMappingStatusKoreanNameSync } from '../../../utils/codeHelper';
import './ClientMappingTab.css';

/** 매칭 상태별 배지 배경색(디자인 토큰만 사용) */
const MAPPING_STATUS_COLOR_MAP = {
  ACTIVE: 'var(--mg-success-500)',
  PAYMENT_CONFIRMED: 'var(--mg-success-500)',
  COMPLETED: 'var(--mg-success-500)',
  PENDING_PAYMENT: 'var(--mg-warning-500)',
  PENDING: 'var(--mg-warning-500)',
  DEPOSIT_PENDING: 'var(--mg-warning-500)',
  SUSPENDED: 'var(--mg-warning-500)',
  INACTIVE: 'var(--mg-gray-500)',
  TERMINATED: 'var(--mg-gray-500)',
  SESSIONS_EXHAUSTED: 'var(--mg-gray-500)'
};

const getMappingStatusColorToken = (status) =>
  (status && MAPPING_STATUS_COLOR_MAP[status]) || 'var(--mg-gray-500)';

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
    return (
      <div key={mapping.id} className="mg-v2-card mg-v2-mapping-card">
        <div className="mg-v2-card-header">
          <div className="mg-v2-mapping-info">
            <h4 className="mg-v2-h4">매칭 #{mapping.id}</h4>
            <p className="mg-v2-mapping-date">
              <Calendar size={14} /> {mapping.createdAt ? new Date(mapping.createdAt).toLocaleDateString('ko-KR') : '날짜 없음'}
            </p>
          </div>
          <div className="mg-v2-mapping-status">
            <span
              className="mg-v2-status-badge"
              style={{ '--status-bg-color': getMappingStatusColorToken(mapping.status) }}
            >
              {getMappingStatusKoreanNameSync(mapping.status)}
            </span>
          </div>
        </div>
        <div className="mg-v2-card-content">
          <div className="mg-v2-mapping-details">
            <p><span className="mg-v2-form-label">상담사</span> {consultant?.name || '알 수 없음'}</p>
            {mapping.packageName && (
              <p><span className="mg-v2-form-label">패키지</span> {mapping.packageName}</p>
            )}
            {(mapping.totalSessions != null || mapping.remainingSessions !== undefined) && (
              <p>
                <span className="mg-v2-form-label">회기</span> {mapping.usedSessions ?? 0}/{mapping.totalSessions ?? 0}
                (남은: {mapping.remainingSessions ?? 0})
              </p>
            )}
            <p><span className="mg-v2-form-label">시작일</span> {mapping.startDate ? new Date(mapping.startDate).toLocaleDateString('ko-KR') : 'N/A'}</p>
            {mapping.endDate && (
              <p><span className="mg-v2-form-label">종료일</span> {new Date(mapping.endDate).toLocaleDateString('ko-KR')}</p>
            )}
            {mapping.notes && (
              <p><span className="mg-v2-form-label">메모</span> {mapping.notes}</p>
            )}
          </div>
        </div>
        <div className="mg-v2-card-footer">
          <Button variant="secondary" size="small" preventDoubleClick={true}>
            <Eye size={14} /> 상세보기
          </Button>
          <Button variant="secondary" size="small" preventDoubleClick={true}>
            수정
          </Button>
        </div>
      </div>
    );
  };

  const renderClientBlock = (client) => {
    const clientMappings = mappingsByClient[client.id] || [];
    return (
      <div key={client.id} className="mg-v2-mapping-client-block">
        <div className="mg-v2-mapping-client-block__header">
          <div className="mg-v2-mapping-client-block__info">
            <h3 className="mg-v2-mapping-client-block__name">{client.name}</h3>
            <p className="mg-v2-mapping-client-block__email">
              <span className="mg-v2-client-email">{client.email}</span>
            </p>
          </div>
          <div className="mg-v2-mapping-client-block__actions">
            <Button
              variant="secondary"
              size="small"
              onClick={() => onClientSelect(client)}
              preventDoubleClick={true}
            >
              <Eye size={14} /> 상세보기
            </Button>
          </div>
        </div>
        <p className="mg-v2-mapping-client-block__count">총 {clientMappings.length}건의 매칭</p>
        {clientMappings.length === 0 ? (
          <div className="mg-v2-mapping-list-block__empty">
            <div className="mg-v2-mapping-list-block__empty-icon">
              <Handshake size={32} />
            </div>
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
          <div className="mg-v2-mapping-list-block__empty-icon">
            <User size={48} />
          </div>
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
