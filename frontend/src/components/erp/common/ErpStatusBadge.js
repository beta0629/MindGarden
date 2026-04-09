/**
 * ERP 화면 노출 상태 코드 → 한글 StatusBadge (매핑 단일 소스)
 *
 * @author CoreSolution
 * @since 2026-04-09
 */

import PropTypes from 'prop-types';
import StatusBadge from '../../common/StatusBadge';
import { toDisplayString } from '../../../utils/safeDisplay';

const ERP_STATUS_MAP = {
  SENT: { text: '전송완료', variant: 'success' },
  PENDING: { text: '전송대기', variant: 'warning' },
  FAILED: { text: '전송실패', variant: 'danger' },
  CONFIRMED: { text: '확인완료', variant: 'neutral' }
};

const UNKNOWN_FALLBACK = { text: '알수없음', variant: 'neutral' };

const ErpStatusBadge = ({ status }) => {
  const config = ERP_STATUS_MAP[status] || UNKNOWN_FALLBACK;
  return (
    <StatusBadge variant={config.variant}>
      {toDisplayString(config.text, '—')}
    </StatusBadge>
  );
};

ErpStatusBadge.propTypes = {
  status: PropTypes.string
};

export default ErpStatusBadge;
