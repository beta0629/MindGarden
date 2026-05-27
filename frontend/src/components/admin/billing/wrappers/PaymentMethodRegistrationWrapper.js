/**
 * 어드민 — 결제 수단 등록 모달 내부에서 사용할 PaymentMethodRegistration 임베드 래퍼.
 *
 * 디자이너 핸드오프(2026-05-27 §I) 결정:
 *   - 기존 `PaymentMethodRegistration.js` 의 PG SDK 연동 로직(toss billingAuth 등)
 *     을 *보존* 하면서, 임베드 컨테이너 클래스만 추가한다.
 *   - standalone 시 사용하던 외부 헤더/카드 스타일은 wrapper CSS 에서 reset 한다.
 *   - `onCompleted` 콜백을 받아 부모(PaymentMethods 페이지 모달)에서 목록 새로고침을 수행한다.
 *
 * @author MindGarden
 * @since 2026-05-27
 */

import React from 'react';
import PropTypes from 'prop-types';
import PaymentMethodRegistration from '../../../billing/PaymentMethodRegistration';
import './PaymentMethodRegistrationWrapper.css';

const PaymentMethodRegistrationWrapper = ({ tenantId, onCompleted, onCancel }) => {
  return (
    <div
      className="mg-admin-billing-payment-method-registration-wrapper"
      data-testid="admin-billing-payment-method-registration-wrapper"
    >
      <PaymentMethodRegistration
        tenantId={tenantId}
        onSuccess={onCompleted}
        onCancel={onCancel}
      />
    </div>
  );
};

PaymentMethodRegistrationWrapper.propTypes = {
  tenantId: PropTypes.string,
  onCompleted: PropTypes.func,
  onCancel: PropTypes.func
};

PaymentMethodRegistrationWrapper.defaultProps = {
  tenantId: undefined,
  onCompleted: undefined,
  onCancel: undefined
};

export default PaymentMethodRegistrationWrapper;
