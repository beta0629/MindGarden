/**
 * MypageSummaryStrip — 역할/이름 · 센터 · 세션 상태 3셀 요약 스트립
 *
 * @author CoreSolution
 * @since 2026-09-02
 */

import PropTypes from 'prop-types';
import SafeText from '../../common/SafeText';

/**
 * @param {object} props
 * @param {string} props.roleLabel
 * @param {string} props.displayName
 * @param {string} props.centerName
 * @param {string} props.sessionLabel
 */
const MypageSummaryStrip = ({
  roleLabel,
  displayName,
  centerName,
  sessionLabel
}) => {
  const cells = [
    {
      id: 'role',
      label: '역할 · 이름',
      value: displayName ? `${roleLabel} · ${displayName}` : roleLabel
    },
    {
      id: 'center',
      label: '센터',
      value: centerName || '—'
    },
    {
      id: 'session',
      label: '세션',
      value: sessionLabel || '—'
    }
  ];

  return (
    <section
      className="mg-mypage-clinic-os__summary"
      data-testid="mypage-summary-strip"
      aria-label="계정 요약"
    >
      {cells.map((cell) => (
        <article key={cell.id} className="mg-mypage-clinic-os__summary-cell">
          <p className="mg-mypage-clinic-os__summary-label">{cell.label}</p>
          <p className="mg-mypage-clinic-os__summary-value" data-testid={`mypage-summary-${cell.id}`}>
            <SafeText>{cell.value}</SafeText>
          </p>
        </article>
      ))}
    </section>
  );
};

MypageSummaryStrip.propTypes = {
  roleLabel: PropTypes.string.isRequired,
  displayName: PropTypes.string,
  centerName: PropTypes.string,
  sessionLabel: PropTypes.string
};

MypageSummaryStrip.defaultProps = {
  displayName: '',
  centerName: '',
  sessionLabel: ''
};

export default MypageSummaryStrip;
