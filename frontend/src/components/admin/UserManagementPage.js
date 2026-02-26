/**
 * 통합 사용자 관리 페이지 (상담사 / 내담자 단일 진입점)
 * - URL 쿼리 type=consultant | type=client 로 타입 전환
 * - 기본값: client (?type 없으면 내담자)
 *
 * @author Core Solution
 * @since 2026-02-24
 */

import React from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import AdminCommonLayout from '../layout/AdminCommonLayout';
import ContentArea from '../dashboard-v2/content/ContentArea';
import ConsultantComprehensiveManagement from './ConsultantComprehensiveManagement';
import ClientComprehensiveManagement from './ClientComprehensiveManagement';
import '../../styles/unified-design-tokens.css';
import './AdminDashboard/AdminDashboardB0KlA.css';

const TYPE_CONSULTANT = 'consultant';
const TYPE_CLIENT = 'client';

const UserManagementPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const type = searchParams.get('type') === TYPE_CONSULTANT ? TYPE_CONSULTANT : TYPE_CLIENT;

  const handleTypeChange = (newType) => {
    navigate(`/admin/user-management?type=${newType}`, { replace: true });
  };

  return (
    <AdminCommonLayout>
      <div className="mg-v2-ad-b0kla mg-v2-user-management-page">
        <div className="mg-v2-ad-b0kla__container">
          <ContentArea>
            <div className="mg-v2-ad-b0kla__pill-toggle">
              <button
                type="button"
                className={`mg-v2-ad-b0kla__pill ${type === TYPE_CONSULTANT ? 'mg-v2-ad-b0kla__pill--active' : ''}`}
                onClick={() => handleTypeChange(TYPE_CONSULTANT)}
              >
                상담사
              </button>
              <button
                type="button"
                className={`mg-v2-ad-b0kla__pill ${type === TYPE_CLIENT ? 'mg-v2-ad-b0kla__pill--active' : ''}`}
                onClick={() => handleTypeChange(TYPE_CLIENT)}
              >
                내담자
              </button>
            </div>

            {type === TYPE_CONSULTANT && <ConsultantComprehensiveManagement embedded />}
            {type === TYPE_CLIENT && <ClientComprehensiveManagement embedded />}
          </ContentArea>
        </div>
      </div>
    </AdminCommonLayout>
  );
};

export default UserManagementPage;
