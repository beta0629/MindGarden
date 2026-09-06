/**
 * 통합 사용자 관리 페이지 (상담사 / 내담자 / 스태프 단일 진입점)
 * - URL 쿼리 type=consultant | type=client | type=staff 로 타입 전환
 * - 기본값: client (?type 없으면 내담자)
 * - deep link `?id=` → 목록 로드 후 해당 사용자 Side Peek 오픈
 * - 내담자 관리는 ADMIN, STAFF만 접근 가능
 * - Clinic-OS 셸: ContentHeader + TabChipRow (B0KlA pill chrome 제거)
 *
 * @author Core Solution
 * @since 2026-02-24
 * @updated 2026-09-06 — Clinic-OS shell (TabChipRow + --clinic-os)
 */

import React from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useSession } from '../../contexts/SessionContext';
import AdminCommonLayout from '../layout/AdminCommonLayout';
import ContentArea from '../dashboard-v2/content/ContentArea';
import ContentHeader from '../dashboard-v2/content/ContentHeader';
import ContentSection from '../dashboard-v2/content/ContentSection';
import TabChipRow from '../common/TabChipRow';
import ConsultantComprehensiveManagement from './ConsultantComprehensiveManagement';
import ClientComprehensiveManagement from './ClientComprehensiveManagement';
import StaffManagement from './StaffManagement';
import PendingDeletionList from './PendingDeletionList';
import '../../styles/unified-design-tokens.css';
import './UserManagementPage.css';
import { USER_ROLES } from '../../constants/roles';
import { useTranslation } from 'react-i18next';
import {
  USER_MANAGEMENT_TYPE_CONSULTANT,
  USER_MANAGEMENT_TYPE_CLIENT,
  USER_MANAGEMENT_TYPE_STAFF,
  USER_MANAGEMENT_TYPE_PENDING_DELETION,
  getUserManagementTypeFromParams,
  getUserManagementIdFromParams
} from '../../utils/userManagementInitialPeek';

const TYPE_CONSULTANT = USER_MANAGEMENT_TYPE_CONSULTANT;
const TYPE_CLIENT = USER_MANAGEMENT_TYPE_CLIENT;
const TYPE_STAFF = USER_MANAGEMENT_TYPE_STAFF;
const TYPE_PENDING_DELETION = USER_MANAGEMENT_TYPE_PENDING_DELETION;

const UserManagementPage = () => {
  const { t } = useTranslation('admin');
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { hasRole } = useSession();
  const type = getUserManagementTypeFromParams(searchParams);
  const initialOpenUserId = getUserManagementIdFromParams(searchParams);

  const canManageClients = hasRole(USER_ROLES.ADMIN) || hasRole(USER_ROLES.STAFF);

  const handleTypeChange = (newType) => {
    if ((newType === TYPE_CLIENT || newType === TYPE_PENDING_DELETION) && !canManageClients) {
      return;
    }
    navigate(`/admin/user-management?type=${newType}`, { replace: true });
  };

  React.useEffect(() => {
    if ((type === TYPE_CLIENT || type === TYPE_PENDING_DELETION) && !canManageClients) {
      navigate('/admin/user-management?type=consultant', { replace: true });
    }
  }, [type, canManageClients, navigate]);

  const typeTabItems = [
    { key: TYPE_CONSULTANT, label: t('labels.consultant') }
  ];
  if (canManageClients) {
    typeTabItems.push({ key: TYPE_CLIENT, label: t('labels.client') });
  }
  typeTabItems.push({ key: TYPE_STAFF, label: '스태프' });
  if (canManageClients) {
    typeTabItems.push({
      key: TYPE_PENDING_DELETION,
      label: t('userManagement.pendingDeletion.tabTitle')
    });
  }

  return (
    <AdminCommonLayout>
      <ContentArea
        className="mg-v2-user-management user-management--clinic-os"
        ariaLabel="통합 사용자 관리 콘텐츠"
      >
        <ContentHeader
          title="통합 사용자 관리"
          subtitle="상담사·내담자·스태프 계정을 유형별로 조회·관리합니다."
          titleId="user-management-page-title"
        />
        <main
          className="mg-v2-user-management-stack"
          aria-labelledby="user-management-page-title"
        >
          <ContentSection noCard>
            <TabChipRow
              ariaLabel="사용자 유형 선택"
              items={typeTabItems}
              activeKey={type}
              onChange={handleTypeChange}
              size="sm"
            />
          </ContentSection>

          {type === TYPE_CONSULTANT && (
            <ConsultantComprehensiveManagement
              embedded
              initialOpenUserId={initialOpenUserId}
            />
          )}
          {type === TYPE_CLIENT && canManageClients && (
            <ClientComprehensiveManagement
              embedded
              initialOpenUserId={initialOpenUserId}
            />
          )}
          {type === TYPE_STAFF && <StaffManagement embedded />}
          {type === TYPE_PENDING_DELETION && canManageClients && <PendingDeletionList embedded />}
        </main>
      </ContentArea>
    </AdminCommonLayout>
  );
};

export default UserManagementPage;
