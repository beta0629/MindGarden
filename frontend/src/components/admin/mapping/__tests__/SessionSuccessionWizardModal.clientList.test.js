/**
 * 회기 승계 기존 내담자 목록 — 첫 페이지(size 20)가 아니라 전체 drain 결과를 쓴다.
 *
 * @author CoreSolution
 * @since 2026-10-09
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SessionSuccessionWizardModal from '../SessionSuccessionWizardModal';
import { SESSION_SUCCESSION_UI } from '../../../../constants/sessionSuccession';
import StandardizedApi from '../../../../utils/standardizedApi';
import {
  adminClientsWithMappingGet,
  adminClientsWithMappingGetAll
} from '../../../../api/adminListFetch';

jest.mock('../../../../utils/standardizedApi', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn()
  }
}));

jest.mock('../../../../api/adminListFetch', () => ({
  adminClientsWithMappingGet: jest.fn(),
  adminClientsWithMappingGetAll: jest.fn()
}));

jest.mock('../../../common/modals/UnifiedModal', () => {
  const ReactLib = require('react');
  function UnifiedModal({ isOpen, children }) {
    if (!isOpen) {
      return null;
    }
    return ReactLib.createElement('div', null, children);
  }
  return UnifiedModal;
});

const SOURCE_CLIENT_ID = 1;
const PAGE_SIZE = 20;
const BEYOND_FIRST_PAGE_NAME = '페이지밖내담자';

const buildClients = () => {
  const clients = [
    {
      id: SOURCE_CLIENT_ID,
      name: '소스당사자',
      remainingSessions: 3,
      status: 'ACTIVE'
    }
  ];
  for (let id = 2; id <= PAGE_SIZE; id += 1) {
    clients.push({
      id,
      name: `첫페이지내담자${id}`,
      remainingSessions: 0,
      status: 'SESSIONS_EXHAUSTED'
    });
  }
  clients.push({
    id: PAGE_SIZE + 1,
    name: BEYOND_FIRST_PAGE_NAME,
    remainingSessions: 0,
    status: 'PENDING_PAYMENT'
  });
  return clients;
};

describe('SessionSuccessionWizardModal 기존 내담자 목록', () => {
  beforeEach(() => {
    StandardizedApi.get.mockResolvedValue({
      transferableSessions: 2,
      remainingSessions: 2,
      consultantId: 9,
      clientId: SOURCE_CLIENT_ID
    });
    adminClientsWithMappingGet.mockResolvedValue({
      clients: buildClients().slice(0, PAGE_SIZE),
      count: PAGE_SIZE + 1
    });
    adminClientsWithMappingGetAll.mockResolvedValue({
      clients: buildClients(),
      count: PAGE_SIZE + 1
    });
  });

  it('첫 페이지를 넘긴 내담자까지 선택 목록에 넣는다', async() => {
    render(
      <SessionSuccessionWizardModal
        isOpen
        onClose={jest.fn()}
        mapping={{
          id: 77,
          clientId: SOURCE_CLIENT_ID,
          clientName: '소스당사자',
          consultantId: 9,
          consultantName: '상담사',
          remainingSessions: 2
        }}
        onSucceeded={jest.fn()}
      />
    );

    await waitFor(() => {
      expect(adminClientsWithMappingGetAll).toHaveBeenCalledTimes(1);
      expect(screen.getByText(SESSION_SUCCESSION_UI.CLIENT_LIST_PLACEHOLDER)).toBeInTheDocument();
    });
    expect(adminClientsWithMappingGet).not.toHaveBeenCalled();

    await userEvent.click(screen.getByText(SESSION_SUCCESSION_UI.CLIENT_LIST_PLACEHOLDER));

    expect(screen.getByText(BEYOND_FIRST_PAGE_NAME)).toBeInTheDocument();
    expect(screen.getByText('첫페이지내담자2')).toBeInTheDocument();
    expect(screen.queryByText('소스당사자')).not.toBeInTheDocument();
  });
});
