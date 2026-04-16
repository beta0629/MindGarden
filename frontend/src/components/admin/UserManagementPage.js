/**
 * 통합 사용자 관리 페이지 (상담사 / 내담자 / 스태프 단일 진입점)
 * - URL 쿼리 type=consultant | type=client | type=staff 로 타입 전환
 * - 기본값: client (?type 없으면 내담자)
 * - 내담자 관리는 ADMIN, STAFF만 접근 가능
 *
 * @author Core Solution
 * @since 2026-02-24
 */

import React from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import MGButton from '../common/MGButton';
import { buildErpMgButtonClassName, ERP_MG_BUTTON_LOADING_TEXT } from '../erp/common/erpMgButtonProps';
import { useSession } from '../../contexts/SessionContext';
import AdminCommonLayout from '../layout/AdminCommonLayout';
import ContentArea from '../dashboard-v2/content/ContentArea';
import ContentHeader from '../dashboard-v2/content/ContentHeader';
import ContentSection from '../dashboard-v2/content/ContentSection';
import ConsultantComprehensiveManagement from './ConsultantComprehensiveManagement';
import ClientComprehensiveManagement from './ClientComprehensiveManagement';
import StaffManagement from './StaffManagement';
import '../../styles/unified-design-tokens.css';
import './AdminDashboard/AdminDashboardB0KlA.css';

const TYPE_CONSULTANT = 'consultant';
const TYPE_CLIENT = 'client';
const TYPE_STAFF = 'staff';

const getTypeFromParams = (searchParams) => {
  const t = searchParams.get('type');
  if (t === TYPE_CONSULTANT) return TYPE_CONSULTANT;
  if (t === TYPE_STAFF) return TYPE_STAFF;
  return TYPE_CLIENT;
};

const UserManagementPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { hasRole } = useSession();
  const type = getTypeFromParams(searchParams);

  const canManageClients = hasRole('ADMIN') || hasRole('STAFF');

  const handleTypeChange = (newType) => {
    if (newType === TYPE_CLIENT && !canManageClients) {
      return;
    }
    navigate(`/admin/user-management?type=${newType}`, { replace: true });
  };

  React.useEffect(() => {
    if (type === TYPE_CLIENT && !canManageClients) {
      navigate('/admin/user-management?type=consultant', { replace: true });
    }
  }, [type, canManageClients, navigate]);

  return (
    <AdminCommonLayout>
      <ContentHeader
        title="통합 사용자 관리"
        subtitle="상담사·내담자·스태프 계정을 유형별로 조회·관리합니다."
        titleId="user-management-page-title"
      />
      <ContentArea ariaLabel="통합 사용자 관리 콘텐츠">
        <ContentSection noCard>
          <div className="mg-v2-ad-b0kla__pill-toggle">
            <MGButton
              type="button"
              variant="outline"
              size="medium"
              className={buildErpMgButtonClassName({
                variant: 'outline',
                size: 'md',
                loading: false,
                className: `mg-v2-ad-b0kla__pill ${type === TYPE_CONSULTANT ? 'mg-v2-ad-b0kla__pill--active' : ''}`
              })}
              loadingText={ERP_MG_BUTTON_LOADING_TEXT}
              onClick={() => handleTypeChange(TYPE_CONSULTANT)}
              preventDoubleClick={false}
            >
              상담사
            </MGButton>
            {canManageClients && (
              <MGButton
                type="button"
                variant="outline"
                size="medium"
                className={buildErpMgButtonClassName({
                  variant: 'outline',
                  size: 'md',
                  loading: false,
                  className: `mg-v2-ad-b0kla__pill ${type === TYPE_CLIENT ? 'mg-v2-ad-b0kla__pill--active' : ''}`
                })}
                loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                onClick={() => handleTypeChange(TYPE_CLIENT)}
                preventDoubleClick={false}
              >
                내담자
              </MGButton>
            )}
            <MGButton
              type="button"
              variant="outline"
              size="medium"
              className={buildErpMgButtonClassName({
                variant: 'outline',
                size: 'md',
                loading: false,
                className: `mg-v2-ad-b0kla__pill ${type === TYPE_STAFF ? 'mg-v2-ad-b0kla__pill--active' : ''}`
              })}
              loadingText={ERP_MG_BUTTON_LOADING_TEXT}
              onClick={() => handleTypeChange(TYPE_STAFF)}
              preventDoubleClick={false}
            >
              스태프
            </MGButton>
          </div>
        </ContentSection>

        {type === TYPE_CONSULTANT && <ConsultantComprehensiveManagement embedded />}
        {type === TYPE_CLIENT && canManageClients && <ClientComprehensiveManagement embedded />}
        {type === TYPE_STAFF && <StaffManagement embedded />}
      </ContentArea>
    </AdminCommonLayout>
  );
};

export default UserManagementPage;
