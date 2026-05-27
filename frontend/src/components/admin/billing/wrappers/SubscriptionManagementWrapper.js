/**
 * 어드민 — 구독 등록·변경 모달 내부에서 사용할 SubscriptionManagement 임베드 래퍼.
 *
 * 디자이너 핸드오프(2026-05-27 §I) 결정:
 *   - 기존 `SubscriptionManagement.js` 의 비즈니스 로직(요금제 조회 / 구독 생성 / 활성화 / 취소 / 결제 수단 임베드)
 *     을 *보존* 하면서, standalone `SimpleLayout` 헤더·자체 white card 는 제거하고 UnifiedModal 내부에 임베드한다.
 *   - 본 wrapper 는 임베드 컨테이너 클래스(`mg-admin-billing-subscription-management-wrapper`)만 제공하고,
 *     실제 비즈니스는 `SubscriptionManagement` 컴포넌트가 담당한다.
 *   - 완료 콜백(`onCompleted`)을 받아 부모(Subscriptions 페이지 모달)에서 목록 새로고침을 수행한다.
 *
 * @author MindGarden
 * @since 2026-05-27
 */

import React from 'react';
import PropTypes from 'prop-types';
import SubscriptionManagement from '../../../billing/SubscriptionManagement';
import './SubscriptionManagementWrapper.css';

const SubscriptionManagementWrapper = ({ tenantId, onCompleted }) => {
  return (
    <div
      className="mg-admin-billing-subscription-management-wrapper"
      data-testid="admin-billing-subscription-management-wrapper"
    >
      <SubscriptionManagement tenantId={tenantId} onCompleted={onCompleted} />
    </div>
  );
};

SubscriptionManagementWrapper.propTypes = {
  tenantId: PropTypes.string,
  onCompleted: PropTypes.func
};

SubscriptionManagementWrapper.defaultProps = {
  tenantId: undefined,
  onCompleted: undefined
};

export default SubscriptionManagementWrapper;
