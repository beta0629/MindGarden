/**
 * ScheduleClientNotesSection — client-wide SSOT·배너·해소 플로우
 *
 * @author CoreSolution
 * @since 2026-09-04
 */

import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import ScheduleClientNotesSection from '../ScheduleClientNotesSection';
import StandardizedApi from '../../../utils/standardizedApi';
import { CLIENT_SCHEDULE_NOTE_API } from '../../../constants/clientScheduleNoteConstants';
import { RoleUtils } from '../../../constants/roles';

jest.mock('../../../utils/standardizedApi', () => ({
  get: jest.fn(),
  put: jest.fn(),
  post: jest.fn(),
  delete: jest.fn()
}));

jest.mock('../../../utils/commonCodeApi', () => ({
  getCommonCodes: jest.fn().mockResolvedValue([])
}));

jest.mock('../../../utils/notification', () => ({
  success: jest.fn(),
  error: jest.fn(),
  warning: jest.fn()
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (k) => k })
}));

jest.mock('../../../hooks/useConfirm', () => ({
  useConfirm: () => [jest.fn(), () => null]
}));

jest.mock('../../../constants/roles', () => ({
  RoleUtils: {
    isAdmin: jest.fn(),
    isStaff: jest.fn()
  }
}));

describe('ScheduleClientNotesSection', () => {
  const adminUser = { id: 1, role: 'ADMIN' };

  beforeEach(() => {
    jest.clearAllMocks();
    RoleUtils.isAdmin.mockReturnValue(true);
    RoleUtils.isStaff.mockReturnValue(false);
  });

  it('loads notes client-wide without mappingId and shows matching banner/list counts', async() => {
    StandardizedApi.get.mockResolvedValue({
      notes: [
        {
          id: '1',
          title: '타매칭 노트',
          body: '본문A',
          noteType: 'OTHER',
          promiseDate: '2026-09-10',
          scheduleDate: '2026-09-01',
          scheduleId: '99',
          mappingId: '200',
          resolvedAt: null,
          createdBy: '1'
        },
        {
          id: '2',
          title: '현재일정 노트',
          body: '본문B',
          noteType: 'OTHER',
          promiseDate: null,
          scheduleDate: '2026-09-04',
          scheduleId: '42',
          mappingId: '5',
          resolvedAt: null,
          createdBy: '1'
        }
      ],
      unresolvedCount: 2,
      totalCount: 2
    });

    render(
      <ScheduleClientNotesSection
        scheduleData={{
          id: 42,
          clientId: 10,
          mappingId: 5,
          clientScheduleNotesClientWideUnresolvedCount: 99,
          clientScheduleNotesUnresolvedCount: 99
        }}
        user={adminUser}
      />
    );

    await waitFor(() => {
      expect(StandardizedApi.get).toHaveBeenCalledWith(
        CLIENT_SCHEDULE_NOTE_API,
        { clientId: 10, scheduleId: 42 }
      );
    });

    expect(screen.getByText(/내담자 전체 미해소 2건/)).toBeInTheDocument();
    expect(screen.getByText('미해소 (2)')).toBeInTheDocument();
    expect(screen.getByText('타매칭 노트')).toBeInTheDocument();
    expect(screen.getByText('현재일정 노트')).toBeInTheDocument();
    expect(screen.getByText(/일정 2026-09-01/)).toBeInTheDocument();
  });

  it('expands banner and resolves a note via PUT, then refreshes counts', async() => {
    StandardizedApi.get
      .mockResolvedValueOnce({
        notes: [
          {
            id: '7',
            title: '해소대상',
            body: '내용',
            noteType: 'OTHER',
            promiseDate: '2026-09-11',
            scheduleDate: '2026-09-05',
            scheduleId: '42',
            resolvedAt: null,
            createdBy: '1'
          }
        ],
        unresolvedCount: 1,
        totalCount: 1
      })
      .mockResolvedValueOnce({
        notes: [
          {
            id: '7',
            title: '해소대상',
            body: '내용',
            noteType: 'OTHER',
            promiseDate: '2026-09-11',
            scheduleDate: '2026-09-05',
            scheduleId: '42',
            resolvedAt: '2026-09-04T12:00:00',
            createdBy: '1'
          }
        ],
        unresolvedCount: 0,
        totalCount: 1
      });
    StandardizedApi.put.mockResolvedValue({});

    render(
      <ScheduleClientNotesSection
        scheduleData={{ id: 42, clientId: 10, mappingId: 5 }}
        user={adminUser}
      />
    );

    await waitFor(() => {
      expect(screen.getByText(/내담자 전체 미해소 1건/)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /내담자 전체 미해소 1건/ }));
    const resolveButtons = await screen.findAllByRole('button', { name: '해소' });
    fireEvent.click(resolveButtons[0]);

    await waitFor(() => {
      expect(StandardizedApi.put).toHaveBeenCalledWith(
        `${CLIENT_SCHEDULE_NOTE_API}/7`,
        { resolved: true }
      );
    });

    await waitFor(() => {
      expect(screen.getByText('미해소 (0)')).toBeInTheDocument();
    });
    expect(screen.queryByText(/내담자 전체 미해소/)).not.toBeInTheDocument();
  });
});
