/**
 * Subscription / Payment 임베드 Wrapper 단위 테스트 (2026-05-27).
 *
 * 검증 범위 (디자이너 핸드오프 §I):
 *  - SubscriptionManagementWrapper 는 SubscriptionManagement 컴포넌트를 임베드 컨테이너 클래스로 감싼다.
 *  - PaymentMethodRegistrationWrapper 는 PaymentMethodRegistration 컴포넌트를 임베드 컨테이너 클래스로 감싼다.
 *  - 두 wrapper 모두 `data-testid` 가 부여되어 부모 페이지에서 식별 가능.
 *  - SimpleLayout / UnifiedHeader 가 임베드되지 않음 (어드민 SSOT 정합).
 *
 * @author MindGarden
 * @since 2026-05-27
 */

import React from 'react';
import { render } from '@testing-library/react';

jest.mock('../../../billing/SubscriptionManagement', () => ({
  __esModule: true,
  default: ({ tenantId }) => <div data-testid="subscription-management-mock" data-tenant={tenantId} />
}));

jest.mock('../../../billing/PaymentMethodRegistration', () => ({
  __esModule: true,
  default: ({ tenantId, onSuccess, onCancel }) => (
    <div
      data-testid="payment-method-registration-mock"
      data-tenant={tenantId}
      data-has-success={Boolean(onSuccess)}
      data-has-cancel={Boolean(onCancel)}
    />
  )
}));

import SubscriptionManagementWrapper from '../wrappers/SubscriptionManagementWrapper';
import PaymentMethodRegistrationWrapper from '../wrappers/PaymentMethodRegistrationWrapper';

describe('SubscriptionManagementWrapper', () => {
  it('임베드 컨테이너 클래스(mg-admin-billing-subscription-management-wrapper)와 testid 를 렌더한다', () => {
    const { container, getByTestId } = render(
      <SubscriptionManagementWrapper tenantId="tenant-x" onCompleted={jest.fn()} />
    );
    const wrapper = container.querySelector('.mg-admin-billing-subscription-management-wrapper');
    expect(wrapper).not.toBeNull();
    expect(getByTestId('admin-billing-subscription-management-wrapper')).toBeInTheDocument();
  });

  it('SubscriptionManagement 컴포넌트에 tenantId 를 전달한다', () => {
    const { getByTestId } = render(
      <SubscriptionManagementWrapper tenantId="tenant-y" onCompleted={jest.fn()} />
    );
    const inner = getByTestId('subscription-management-mock');
    expect(inner.getAttribute('data-tenant')).toBe('tenant-y');
  });

  it('SimpleLayout / UnifiedHeader 가 임베드되지 않는다 (어드민 SSOT 정합)', () => {
    const { container } = render(
      <SubscriptionManagementWrapper tenantId="tenant-z" onCompleted={jest.fn()} />
    );
    expect(container.querySelector('.simple-layout')).toBeNull();
    expect(container.querySelector('.mg-unified-header')).toBeNull();
  });
});

describe('PaymentMethodRegistrationWrapper', () => {
  it('임베드 컨테이너 클래스(mg-admin-billing-payment-method-registration-wrapper)와 testid 를 렌더한다', () => {
    const { container, getByTestId } = render(
      <PaymentMethodRegistrationWrapper
        tenantId="tenant-a"
        onCompleted={jest.fn()}
        onCancel={jest.fn()}
      />
    );
    const wrapper = container.querySelector('.mg-admin-billing-payment-method-registration-wrapper');
    expect(wrapper).not.toBeNull();
    expect(getByTestId('admin-billing-payment-method-registration-wrapper')).toBeInTheDocument();
  });

  it('PaymentMethodRegistration 컴포넌트에 tenantId 와 onSuccess/onCancel 콜백을 전달한다', () => {
    const { getByTestId } = render(
      <PaymentMethodRegistrationWrapper
        tenantId="tenant-b"
        onCompleted={jest.fn()}
        onCancel={jest.fn()}
      />
    );
    const inner = getByTestId('payment-method-registration-mock');
    expect(inner.getAttribute('data-tenant')).toBe('tenant-b');
    expect(inner.getAttribute('data-has-success')).toBe('true');
    expect(inner.getAttribute('data-has-cancel')).toBe('true');
  });

  it('SimpleLayout / UnifiedHeader 가 임베드되지 않는다 (어드민 SSOT 정합)', () => {
    const { container } = render(
      <PaymentMethodRegistrationWrapper
        tenantId="tenant-c"
        onCompleted={jest.fn()}
      />
    );
    expect(container.querySelector('.simple-layout')).toBeNull();
    expect(container.querySelector('.mg-unified-header')).toBeNull();
  });
});
