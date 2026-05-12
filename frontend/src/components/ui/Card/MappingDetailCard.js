import PropTypes from 'prop-types';
import { StatusBadge, CardContainer } from '../../common';
import SafeText from '../../common/SafeText';
import { toDisplayString } from '../../../utils/safeDisplay';
import MGButton from '../../common/MGButton';
import { buildErpMgButtonClassName, ERP_MG_BUTTON_LOADING_TEXT } from '../../erp/common/erpMgButtonProps';

/**
 * 매칭 상세 카드 컴포넌트 (mg-v2-mapping-card__compact 패턴)
 * ClientMappingTab 등에서 개별 매칭 정보를 표시
 *
 * @author CoreSolution
 * @since 2026-05-12
 */
const MappingDetailCard = ({
  id,
  consultantName,
  packageName,
  status,
  usedSessions,
  totalSessions,
  remainingSessions,
  startDate,
  endDate,
  createdAt,
  notes,
  onViewDetail,
  onEdit
}) => {
  const startDateStr = startDate ? new Date(startDate).toLocaleDateString('ko-KR') : 'N/A';
  const endDateStr = endDate ? new Date(endDate).toLocaleDateString('ko-KR') : null;
  const createdStr = createdAt ? new Date(createdAt).toLocaleDateString('ko-KR') : '날짜 없음';

  return (
    <CardContainer className="mg-v2-mapping-card__compact">
      <div className="mg-v2-card-header">
        <div className="mg-v2-mapping-info">
          <h4 className="mg-v2-mapping-card__title mg-v2-h4">매칭 #{id}</h4>
          <p className="mg-v2-mapping-date">
            {createdStr}
          </p>
        </div>
        <div className="mg-v2-mapping-status">
          <StatusBadge status={status} />
        </div>
      </div>
      <div className="mg-v2-card-content">
        <div className="mg-v2-mapping-details">
          <div className="mg-v2-mapping-card__row">
            <span className="mg-v2-mapping-card__label">상담사</span>
            <span className="mg-v2-mapping-card__value">
              <SafeText fallback="알 수 없음">{consultantName}</SafeText>
            </span>
          </div>
          {packageName && (
            <div className="mg-v2-mapping-card__row">
              <span className="mg-v2-mapping-card__label">패키지</span>
              <span className="mg-v2-mapping-card__value"><SafeText>{packageName}</SafeText></span>
            </div>
          )}
          {(totalSessions != null || remainingSessions !== undefined) && (
            <div className="mg-v2-mapping-card__row">
              <span className="mg-v2-mapping-card__label">회기</span>
              <span className="mg-v2-mapping-card__value mg-v2-mapping-card__value--emphasis">
                {usedSessions ?? 0}/{totalSessions ?? 0} (남은: {remainingSessions ?? 0})
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
          {notes && (
            <div className="mg-v2-mapping-card__row">
              <span className="mg-v2-mapping-card__label">메모</span>
              <span className="mg-v2-mapping-card__value mg-v2-mapping-card__memo" title={toDisplayString(notes)}>
                <SafeText>{notes}</SafeText>
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
          onClick={onViewDetail}
        >
          상세보기
        </MGButton>
        <MGButton
          variant="secondary"
          size="small"
          className={buildErpMgButtonClassName({ variant: 'secondary', size: 'sm', loading: false })}
          loadingText={ERP_MG_BUTTON_LOADING_TEXT}
          preventDoubleClick={true}
          onClick={onEdit}
        >
          수정
        </MGButton>
      </div>
    </CardContainer>
  );
};

MappingDetailCard.propTypes = {
  id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  consultantName: PropTypes.string,
  packageName: PropTypes.string,
  status: PropTypes.string,
  usedSessions: PropTypes.number,
  totalSessions: PropTypes.number,
  remainingSessions: PropTypes.number,
  startDate: PropTypes.string,
  endDate: PropTypes.string,
  createdAt: PropTypes.string,
  notes: PropTypes.string,
  onViewDetail: PropTypes.func,
  onEdit: PropTypes.func
};

MappingDetailCard.defaultProps = {
  consultantName: null,
  packageName: null,
  status: null,
  usedSessions: 0,
  totalSessions: 0,
  remainingSessions: 0,
  startDate: null,
  endDate: null,
  createdAt: null,
  notes: null,
  onViewDetail: undefined,
  onEdit: undefined
};

export default MappingDetailCard;
