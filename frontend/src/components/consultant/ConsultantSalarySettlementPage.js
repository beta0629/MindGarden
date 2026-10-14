/**
 * ConsultantSalarySettlementPage — /consultant/salary-settlement 셸 (대시보드와 동일 PageHeader·패딩)
 * 헤더 CTA 없음(읽기 전용).
 *
 * @author CoreSolution
 * @since 2026-10-07
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import ConsultantSuitePage from './suite/ConsultantSuitePage';
import ConsultantSalarySettlement from './ConsultantSalarySettlement';
import { CONSULTANT_SUITE_NS, CONSULTANT_SUITE_TEST_ID } from '../../constants/consultantSuite';

const SALARY_TITLE_ID = 'consultant-salary-page-title';

const ConsultantSalarySettlementPage = () => {
  const { t } = useTranslation(CONSULTANT_SUITE_NS);
  return (
    <ConsultantSuitePage
      title={t('salary.title')}
      subtitle={t('salary.subtitle')}
      titleId={SALARY_TITLE_ID}
      ariaLabel={t('salary.ariaLabel')}
      testId={CONSULTANT_SUITE_TEST_ID.SALARY_PAGE}
    >
      <ConsultantSalarySettlement />
    </ConsultantSuitePage>
  );
};

export default ConsultantSalarySettlementPage;
