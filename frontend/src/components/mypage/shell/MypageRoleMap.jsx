/**
 * MypageRoleMap — dual-role orientation (landing + two links). Not a toggle.
 * Spec cite: clinic-os-mypage-dual.md (TO-BE v2). v1 comparison cards discarded.
 *
 * @author CoreSolution
 * @since 2026-09-08
 */

import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import MGButton from '../../common/MGButton';
import {
  MYPAGE_DUAL_ROLE_MAP,
  MYPAGE_DUAL_ROLE_MAP_LINKS
} from '../../../constants/mypageDualRoleUi';
import {
  buildErpMgButtonClassName,
  ERP_MG_BUTTON_LOADING_TEXT
} from '../../erp/common/erpMgButtonProps';

/**
 * @param {object} [props]
 * @param {string} [props.ownSalaryPath]
 * @param {string} [props.opsFinancePath]
 */
const MypageRoleMap = ({
  ownSalaryPath = MYPAGE_DUAL_ROLE_MAP_LINKS.OWN_SALARY_VIEW,
  opsFinancePath = MYPAGE_DUAL_ROLE_MAP_LINKS.OPS_FINANCE_APPROVE
}) => {
  const navigate = useNavigate();

  return (
    <section
      className="mg-mypage-clinic-os__role-map"
      data-testid="mypage-role-map"
      aria-label={MYPAGE_DUAL_ROLE_MAP.SECTION_ARIA}
    >
      <h2 className="mg-mypage-clinic-os__role-map-title">
        {MYPAGE_DUAL_ROLE_MAP.TITLE}
      </h2>
      <p
        className="mg-mypage-clinic-os__role-map-landing"
        data-testid="mypage-role-map-landing"
      >
        {MYPAGE_DUAL_ROLE_MAP.LANDING}
      </p>
      <ul className="mg-mypage-clinic-os__role-map-list">
        <li
          className="mg-mypage-clinic-os__role-map-row"
          data-testid="mypage-role-map-own-salary"
        >
          <div className="mg-mypage-clinic-os__role-map-row-main">
            <MGButton
              type="button"
              variant="primary"
              size="small"
              className={buildErpMgButtonClassName({
                variant: 'primary',
                size: 'sm',
                loading: false,
                className: 'mg-mypage-clinic-os__role-map-cta'
              })}
              loadingText={ERP_MG_BUTTON_LOADING_TEXT}
              onClick={() => navigate(ownSalaryPath)}
              preventDoubleClick={false}
              data-testid="mypage-role-map-own-salary-cta"
            >
              {MYPAGE_DUAL_ROLE_MAP.OWN_SALARY_VIEW_LABEL}
            </MGButton>
            <span
              className="mg-mypage-clinic-os__role-map-note"
              data-testid="mypage-role-map-consultant-note"
            >
              {MYPAGE_DUAL_ROLE_MAP.CONSULTANT_SCHEDULE_NOTE}
            </span>
          </div>
        </li>
        <li
          className="mg-mypage-clinic-os__role-map-row"
          data-testid="mypage-role-map-ops-finance"
        >
          <MGButton
            type="button"
            variant="primary"
            size="small"
            className={buildErpMgButtonClassName({
              variant: 'primary',
              size: 'sm',
              loading: false,
              className: 'mg-mypage-clinic-os__role-map-cta'
            })}
            loadingText={ERP_MG_BUTTON_LOADING_TEXT}
            onClick={() => navigate(opsFinancePath)}
            preventDoubleClick={false}
            data-testid="mypage-role-map-ops-finance-cta"
          >
            {MYPAGE_DUAL_ROLE_MAP.OPS_FINANCE_APPROVE_LABEL}
          </MGButton>
        </li>
      </ul>
    </section>
  );
};

MypageRoleMap.propTypes = {
  ownSalaryPath: PropTypes.string,
  opsFinancePath: PropTypes.string
};

export default MypageRoleMap;
