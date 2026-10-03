/**
 * ScheduleClientNoteCard 사용처 — 일정 상세(편집)·알림 모달(읽기 전용)·삭제 확인 유지
 *
 * @author CoreSolution
 * @since 2026-10-03
 */

import fs from 'fs';
import path from 'path';
import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import ScheduleClientNotesSection from '../../ScheduleClientNotesSection';
import ScheduleClientNotesReadOnlyList from
  '../../../admin/mapping-management/integrated-schedule/molecules/ScheduleClientNotesReadOnlyList';
import StandardizedApi from '../../../../utils/standardizedApi';
import { CLIENT_SCHEDULE_NOTE_API } from '../../../../constants/clientScheduleNoteConstants';
import { RoleUtils } from '../../../../constants/roles';

const mockConfirm = jest.fn();

jest.mock('../../../../utils/standardizedApi', () => ({
  get: jest.fn(),
  put: jest.fn(),
  post: jest.fn(),
  delete: jest.fn()
}));

jest.mock('../../../../utils/commonCodeApi', () => ({
  getCommonCodes: jest.fn().mockResolvedValue([])
}));

jest.mock('../../../../utils/commonCodeUtils', () => ({
  getCommonCodes: jest.fn().mockResolvedValue([])
}));

jest.mock('../../../../utils/notification', () => ({
  success: jest.fn(),
  error: jest.fn(),
  warning: jest.fn()
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (k) => ({ 'common.actions.edit': '수정', 'common.actions.delete': '삭제' }[k] || k)
  })
}));

jest.mock('../../../../hooks/useConfirm', () => ({
  useConfirm: () => [mockConfirm, () => null]
}));

jest.mock('../../../../constants/roles', () => ({
  RoleUtils: {
    isAdmin: jest.fn(),
    isStaff: jest.fn()
  }
}));

const SRC_ROOT = path.join(__dirname, '..', '..', '..', '..');
const readSrc = (relative) => fs.readFileSync(path.join(SRC_ROOT, relative), 'utf8');

const note = {
  id: '11',
  title: '입금 약속',
  body: '다음 회기 전',
  noteType: 'PAYMENT_PROMISE',
  promiseDate: '2099-01-01',
  scheduleDate: '2026-10-03',
  scheduleId: '42',
  resolvedAt: null,
  createdBy: '1'
};

describe('ScheduleClientNoteCard wiring', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    RoleUtils.isAdmin.mockReturnValue(true);
    RoleUtils.isStaff.mockReturnValue(false);
    StandardizedApi.get.mockResolvedValue({ notes: [note] });
    StandardizedApi.delete.mockResolvedValue({});
  });

  const renderSection = () => render(
    <ScheduleClientNotesSection scheduleData={{ id: 42, clientId: 10 }} user={{ id: 1 }} />
  );

  it('schedule detail section renders notes with the shared card and Korean label', async() => {
    renderSection();
    const cards = await screen.findAllByTestId('schedule-client-note-card');
    expect(cards.length).toBeGreaterThan(0);
    expect(screen.getByText('입금·비용 약속 · 약속일 2099-01-01 · 일정 2026-10-03')).toBeInTheDocument();
    expect(screen.queryByText(/PAYMENT_PROMISE/)).not.toBeInTheDocument();
  });

  it('delete opens the confirmation first and does not call the API when cancelled', async() => {
    mockConfirm.mockResolvedValue(false);
    renderSection();
    fireEvent.click(await screen.findByTestId('schedule-client-note-delete'));
    await waitFor(() => expect(mockConfirm).toHaveBeenCalledTimes(1));
    expect(mockConfirm).toHaveBeenCalledWith(expect.objectContaining({ variant: 'danger' }));
    expect(StandardizedApi.delete).not.toHaveBeenCalled();
  });

  it('delete calls the API only after the confirmation is accepted', async() => {
    mockConfirm.mockResolvedValue(true);
    renderSection();
    fireEvent.click(await screen.findByTestId('schedule-client-note-delete'));
    await waitFor(() => {
      expect(StandardizedApi.delete).toHaveBeenCalledWith(`${CLIENT_SCHEDULE_NOTE_API}/11`);
    });
    expect(mockConfirm.mock.invocationCallOrder[0])
      .toBeLessThan(StandardizedApi.delete.mock.invocationCallOrder[0]);
  });

  it('reminder modal read-only list renders the same card without action buttons', async() => {
    render(<ScheduleClientNotesReadOnlyList notes={[{ ...note, noteType: 'NOT_IN_TABLE' }]} />);
    const card = screen.getByTestId('schedule-client-note-card');
    expect(card).toHaveClass('mg-v2-card-container');
    expect(screen.queryByTestId('schedule-client-note-card-actions')).not.toBeInTheDocument();
    await waitFor(() => expect(screen.getByText('기타 · 약속일 2099-01-01')).toBeInTheDocument());
    expect(screen.queryByText(/NOT_IN_TABLE/)).not.toBeInTheDocument();
  });

  it('schedule detail modal min-width is capped by the viewport so the notes tab does not overflow at 390px', () => {
    expect(readSrc('components/schedule/ScheduleDetailModal.js'))
      .toMatch(/className="mg-v2-ad-b0kla schedule-detail-modal"/);
    expect(readSrc('components/schedule/ScheduleB0KlA.css')).toMatch(
      /\.mg-modal\.mg-modal--large\.schedule-detail-modal\s*\{[^}]*min-width:\s*min\(var\(--mg-v2-grid-container-md\),\s*92vw\)/
    );
  });

  it('the viewport cap stays scoped: the global large modal rule keeps its original min-width', () => {
    const css = readSrc('styles/06-components/_unified-modals.css');
    expect(css).toMatch(/\.mg-modal\.mg-modal--large\s*\{\s*min-width:\s*720px;/);
    expect(css).not.toMatch(/min-width:\s*min\(720px,\s*92vw\)/);
  });

  it('every note renderer imports the shared card and the screens mount those renderers', () => {
    expect(readSrc('components/schedule/ScheduleClientNotesSection.js'))
      .toMatch(/from '\.\/molecules\/ScheduleClientNoteCard'/);
    expect(readSrc('components/admin/mapping-management/integrated-schedule/molecules/ScheduleClientNotesReadOnlyList.js'))
      .toMatch(/schedule\/molecules\/ScheduleClientNoteCard'/);
    expect(readSrc('components/schedule/ScheduleDetailModal.js')).toMatch(/<ScheduleClientNotesSection/);
    expect(readSrc('components/admin/mapping-management/integrated-schedule/molecules/ScheduleNotesReminderModal.js'))
      .toMatch(/<ScheduleClientNotesReadOnlyList/);
  });
});
