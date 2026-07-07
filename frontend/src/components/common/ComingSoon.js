import React from 'react';
import AdminCommonLayout from '../layout/AdminCommonLayout';
import ContentArea from '../dashboard-v2/content/ContentArea';
import { buildErpMgButtonClassName, ERP_MG_BUTTON_LOADING_TEXT } from '../erp/common/erpMgButtonProps';
import MGButton from './MGButton';
import NoticeCard from './organisms/NoticeCard';
import '../../styles/unified-design-tokens.css';
import '../admin/AdminDashboard/AdminDashboardB0KlA.css';

const COMING_SOON_DEFAULT_TITLE = '준비 중';
const COMING_SOON_DEFAULT_DESCRIPTION = '해당 기능은 현재 개발 중입니다.';
const COMING_SOON_REGION_LABEL = '준비 중 안내';

const COMING_SOON_DEFAULT_FEATURES = [
  { iconClass: 'bi bi-clock', text: '곧 출시될 예정입니다' },
  { iconClass: 'bi bi-heart', text: '더 나은 서비스를 위해 준비 중입니다' },
  { iconClass: 'bi bi-arrow-left', text: '이전 페이지로 돌아가세요' }
];

/**
 * 준비중 페이지 컴포넌트
 * - 아직 구현되지 않은 기능에 대한 안내 페이지 (B0KlA NoticeCard)
 *
 * @author Core Solution
 * @version 2.0.0
 * @since 2025-09-05
 */
const ComingSoon = ({
  title = COMING_SOON_DEFAULT_TITLE,
  description = COMING_SOON_DEFAULT_DESCRIPTION,
  features = COMING_SOON_DEFAULT_FEATURES
}) => {
  const layoutTitle = title || COMING_SOON_DEFAULT_TITLE;

  return (
    <AdminCommonLayout title={layoutTitle} loading={false}>
      <div className="mg-v2-ad-b0kla">
        <div className="mg-v2-ad-b0kla__container">
          <ContentArea ariaLabel={COMING_SOON_REGION_LABEL}>
            <NoticeCard
              iconClass="bi bi-tools"
              title={layoutTitle}
              description={description}
              features={features}
              actions={(
                <MGButton
                  className={buildErpMgButtonClassName({
                    variant: 'primary',
                    size: 'md',
                    loading: false
                  })}
                  loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                  onClick={() => window.history.back()}
                  variant="primary"
                >
                  <i className="bi bi-arrow-left" aria-hidden="true" />
                  이전 페이지로
                </MGButton>
              )}
            />
          </ContentArea>
        </div>
      </div>
    </AdminCommonLayout>
  );
};

export default ComingSoon;
