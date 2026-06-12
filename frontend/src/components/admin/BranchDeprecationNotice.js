/**
 * Branch(지점) 시스템 사용 중단 안내 페이지
 *
 * 역할 SSOT 정리 PR-5/9 (2026-06-12): 사용자 결정에 따라 Branch(지점) 시스템 사용을
 * 중단한다. 옵션 A(점진적): 라우팅·페이지 자체는 남기되, 진입 시 사용 중단 안내 배너만
 * 노출하여 운영자가 더 이상 새 데이터를 등록·관리하지 않도록 유도한다.
 *
 * 관련 PR:
 *   - PR-3 (#280): BE 클래스 @Deprecated + @ConditionalOnProperty 완료
 *   - PR-4 (#281): FE RoleUtils SSOT 완료
 *   - PR-5 (본 페이지): FE Branch UI 가시성 차단 + LNB Branch 메뉴 시드 제거 (FE 측)
 *   - PR-6/7 (예정): BE LNB seed(Flyway) Branch 메뉴 제거
 *
 * @author Core Solution
 * @since 2026-06-12
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import AdminCommonLayout from '../layout/AdminCommonLayout';
import MGButton from '../common/MGButton';
import { buildErpMgButtonClassName, ERP_MG_BUTTON_LOADING_TEXT } from '../erp/common/erpMgButtonProps';
import '../common/ComingSoon.css';

const BRANCH_DEPRECATION_TITLE = '지점(Branch) 시스템 사용 중단';
const BRANCH_DEPRECATION_DESCRIPTION = '지점 기능은 단계적으로 종료됩니다. 멀티테넌트 기반 운영으로 전환하세요.';

const BranchDeprecationNotice = () => {
  const navigate = useNavigate();

  return (
    <AdminCommonLayout title={BRANCH_DEPRECATION_TITLE}>
      <div className="coming-soon-container">
        <div className="coming-soon-content">
          <div className="coming-soon-icon">
            <i className="bi bi-exclamation-triangle" aria-hidden="true" />
          </div>
          <h1 className="coming-soon-title">{BRANCH_DEPRECATION_TITLE}</h1>
          <p className="coming-soon-description">{BRANCH_DEPRECATION_DESCRIPTION}</p>
          <div className="coming-soon-features">
            <div className="feature-item">
              <i className="bi bi-info-circle" aria-hidden="true" />
              <span>신규 지점·지점장 등록을 중단합니다.</span>
            </div>
            <div className="feature-item">
              <i className="bi bi-people" aria-hidden="true" />
              <span>지점장(BRANCH_SUPER_ADMIN) 역할은 테넌트 관리자(ADMIN)로 단계적으로 이전됩니다.</span>
            </div>
            <div className="feature-item">
              <i className="bi bi-arrow-right" aria-hidden="true" />
              <span>기존 지점 데이터는 보존되며, 테넌트 기반 단일 운영으로 마이그레이션됩니다.</span>
            </div>
          </div>
          <MGButton
            className={buildErpMgButtonClassName({
              variant: 'primary',
              size: 'md',
              loading: false,
              className: 'coming-soon-button'
            })}
            loadingText={ERP_MG_BUTTON_LOADING_TEXT}
            onClick={() => navigate('/admin/dashboard')}
            variant="primary"
          >
            <i className="bi bi-arrow-left" aria-hidden="true" />
            관리자 대시보드로 이동
          </MGButton>
        </div>
      </div>
    </AdminCommonLayout>
  );
};

export default BranchDeprecationNotice;
