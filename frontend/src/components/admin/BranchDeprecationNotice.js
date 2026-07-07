/**
 * Branch(지점) 시스템 사용 중단 안내 페이지
 *
 * 역할 SSOT 정리 PR-5/9 (2026-06-12): 사용자 결정에 따라 Branch(지점) 시스템 사용을
 * 중단한다. 옵션 A(점진적): 라우팅·페이지 자체는 남기되, 진입 시 사용 중단 안내 배너만
 * 노출하여 운영자가 더 이상 새 데이터를 등록·관리하지 않도록 유도한다.
 *
 * @author Core Solution
 * @since 2026-06-12
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import AdminCommonLayout from '../layout/AdminCommonLayout';
import ContentArea from '../dashboard-v2/content/ContentArea';
import MGButton from '../common/MGButton';
import NoticeCard, { NOTICE_CARD_VARIANT_WARNING } from '../common/organisms/NoticeCard';
import { buildErpMgButtonClassName, ERP_MG_BUTTON_LOADING_TEXT } from '../erp/common/erpMgButtonProps';
import '../../styles/unified-design-tokens.css';
import './AdminDashboard/AdminDashboardB0KlA.css';

const BRANCH_DEPRECATION_TITLE = '지점(Branch) 시스템 사용 중단';
const BRANCH_DEPRECATION_DESCRIPTION =
  '지점 기능은 단계적으로 종료됩니다. 멀티테넌트 기반 운영으로 전환하세요.';
const BRANCH_DEPRECATION_REGION_LABEL = '지점 시스템 사용 중단 안내';

const BRANCH_DEPRECATION_FEATURES = [
  { iconClass: 'bi bi-info-circle', text: '신규 지점·지점장 등록을 중단합니다.' },
  {
    iconClass: 'bi bi-people',
    text: '지점장(BRANCH_SUPER_ADMIN) 역할은 테넌트 관리자(ADMIN)로 단계적으로 이전됩니다.'
  },
  {
    iconClass: 'bi bi-arrow-right',
    text: '기존 지점 데이터는 보존되며, 테넌트 기반 단일 운영으로 마이그레이션됩니다.'
  }
];

const BranchDeprecationNotice = () => {
  const navigate = useNavigate();

  return (
    <AdminCommonLayout title={BRANCH_DEPRECATION_TITLE} loading={false}>
      <div className="mg-v2-ad-b0kla">
        <div className="mg-v2-ad-b0kla__container">
          <ContentArea ariaLabel={BRANCH_DEPRECATION_REGION_LABEL}>
            <NoticeCard
              iconClass="bi bi-exclamation-triangle"
              title={BRANCH_DEPRECATION_TITLE}
              description={BRANCH_DEPRECATION_DESCRIPTION}
              features={BRANCH_DEPRECATION_FEATURES}
              variant={NOTICE_CARD_VARIANT_WARNING}
              actions={(
                <MGButton
                  className={buildErpMgButtonClassName({
                    variant: 'primary',
                    size: 'md',
                    loading: false
                  })}
                  loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                  onClick={() => navigate('/admin/dashboard')}
                  variant="primary"
                >
                  <i className="bi bi-arrow-left" aria-hidden="true" />
                  관리자 대시보드로 이동
                </MGButton>
              )}
            />
          </ContentArea>
        </div>
      </div>
    </AdminCommonLayout>
  );
};

export default BranchDeprecationNotice;
