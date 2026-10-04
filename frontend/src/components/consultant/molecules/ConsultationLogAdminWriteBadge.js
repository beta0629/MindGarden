import React from 'react';
import PropTypes from 'prop-types';
import { toDisplayString } from '../../../utils/safeDisplay';
import { resolveConsultationLogAdminWriteMeta } from '../../../utils/consultationLogAdminWriteMeta';
import { CONSULTATION_LOG_ADMIN_WRITE_STRINGS } from '../../../constants/consultationLogAdminWriteStrings';
import './ConsultationLogAdminWriteBadge.css';

/**
 * 관리자 화면 전용 — 「관리자 작성」/「관리자 수정」 배지 + 마지막 수정자 역할·시각.
 *
 * <p>관리자 작성·수정 이력이 없으면 아무것도 렌더하지 않는다. 상담사 화면에는 붙이지 않는다.</p>
 *
 * @param {{ record?: object|null, compact?: boolean }} props
 */
const ConsultationLogAdminWriteBadge = ({ record, compact = false }) => {
  const meta = resolveConsultationLogAdminWriteMeta(record);
  if (!meta) {
    return null;
  }
  const { META_SEPARATOR, META_ARIA_PREFIX } = CONSULTATION_LOG_ADMIN_WRITE_STRINGS;
  const metaText = meta.editedAtLabel
    ? `${meta.editorRoleLabel}${META_SEPARATOR}${meta.editedAtLabel}`
    : meta.editorRoleLabel;
  const rootClass = compact
    ? 'mg-v2-consultation-log-admin-badge mg-v2-consultation-log-admin-badge--compact'
    : 'mg-v2-consultation-log-admin-badge';

  return (
    <span
      className={rootClass}
      data-testid="consultation-log-admin-write-badge"
      data-kind={meta.kind}
    >
      <span className="mg-v2-badge mg-v2-badge--primary">
        {toDisplayString(meta.label, '')}
      </span>
      {!compact && (
        <span
          className="mg-v2-consultation-log-admin-badge__meta"
          aria-label={`${META_ARIA_PREFIX} ${toDisplayString(metaText, '')}`}
        >
          {toDisplayString(metaText, '')}
        </span>
      )}
    </span>
  );
};

ConsultationLogAdminWriteBadge.propTypes = {
  record: PropTypes.shape({
    writtenByAdmin: PropTypes.bool,
    editedByAdmin: PropTypes.bool,
    lastEditedByRole: PropTypes.string,
    lastEditedAt: PropTypes.string
  }),
  compact: PropTypes.bool
};

export default ConsultationLogAdminWriteBadge;
