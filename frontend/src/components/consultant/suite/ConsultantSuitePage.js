/**
 * ConsultantSuitePage — 상담사 스위트 페이지 템플릿 (PageHeader + 본문)
 * 대시보드(/consultant/dashboard)와 동일한 ContentArea·ContentHeader·전폭 컨테이너를 공유한다.
 * 중앙 max-width 스택 금지 — 본문 패딩은 셸(main) + ContentArea 그대로.
 *
 * @author CoreSolution
 * @since 2026-10-07
 */

import React from 'react';
import PropTypes from 'prop-types';
import ContentArea from '../../dashboard-v2/content/ContentArea';
import ContentHeader from '../../dashboard-v2/content/ContentHeader';
import { CONSULTANT_SUITE_CLASS } from '../../../constants/consultantSuite';
import './ConsultantSuite.css';

const ConsultantSuitePage = ({
  title,
  subtitle,
  titleId,
  actions,
  ariaLabel,
  className,
  testId,
  children
}) => {
  const rootClass = [CONSULTANT_SUITE_CLASS.ROOT, 'mg-v2-clinic-os', className]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={rootClass} data-surface="consultant" data-testid={testId}>
      <div className={CONSULTANT_SUITE_CLASS.CONTAINER}>
        <ContentArea ariaLabel={ariaLabel}>
          <ContentHeader title={title} subtitle={subtitle} titleId={titleId} actions={actions} />
          <section className={CONSULTANT_SUITE_CLASS.BODY} aria-labelledby={titleId}>
            {children}
          </section>
        </ContentArea>
      </div>
    </div>
  );
};

ConsultantSuitePage.propTypes = {
  title: PropTypes.node.isRequired,
  subtitle: PropTypes.node,
  titleId: PropTypes.string.isRequired,
  actions: PropTypes.node,
  ariaLabel: PropTypes.string,
  className: PropTypes.string,
  testId: PropTypes.string,
  children: PropTypes.node
};

ConsultantSuitePage.defaultProps = {
  subtitle: null,
  actions: null,
  ariaLabel: undefined,
  className: '',
  testId: undefined,
  children: null
};

export default ConsultantSuitePage;
