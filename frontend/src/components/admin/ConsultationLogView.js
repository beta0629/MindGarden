/**
 * 상담일지 조회 페이지 - AdminCommonLayout 래퍼
 * 매칭관리와 동일 레이아웃 사용. Clinic-OS chrome (B0KlA 셸 제거).
 * G-14 P0: ACL title 생략, ContentHeader SSOT는 ConsultationLogViewPage.
 * surface=consultant 는 /consultant/consultation-logs 전용(상담사 스위트 셸).
 *
 * @author Core Solution
 * @since 2025-03-02
 * @updated 2026-10-07 — 상담사 표면 분기(surface prop)
 */

import React, { useState } from 'react';
import PropTypes from 'prop-types';
import ConsultationLogViewPage, {
  CONSULTATION_LOG_VIEW_SURFACE
} from './consultation-log-view/ConsultationLogViewPage';
import AdminCommonLayout from '../layout/AdminCommonLayout';
import '../../styles/main.css';
import '../../styles/unified-design-tokens.css';
import '../../styles/responsive-layout-tokens.css';
import '../../styles/themes/admin-theme.css';

const CONSULTANT_LAYOUT_CLASS = 'mg-v2-dashboard-layout';

const ConsultationLogView = ({ surface }) => {
  const [searchValue, setSearchValue] = useState('');
  const isConsultantSurface = surface === CONSULTATION_LOG_VIEW_SURFACE.CONSULTANT;

  return (
    <AdminCommonLayout
      className={isConsultantSurface ? CONSULTANT_LAYOUT_CLASS : undefined}
      searchValue={searchValue}
      onSearchChange={setSearchValue}
    >
      <ConsultationLogViewPage surface={surface} />
    </AdminCommonLayout>
  );
};

ConsultationLogView.propTypes = {
  surface: PropTypes.oneOf(Object.values(CONSULTATION_LOG_VIEW_SURFACE))
};

ConsultationLogView.defaultProps = {
  surface: CONSULTATION_LOG_VIEW_SURFACE.ADMIN
};

export default ConsultationLogView;
