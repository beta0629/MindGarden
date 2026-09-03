/**
 * consultantMoodJournalInboxClient — normalize · fail-closed share filter
 *
 * @author MindGarden
 * @since 2026-09-03
 */

import {
  normalizeMoodJournalInboxItem,
  fetchConsultantMoodJournalInbox
} from '../consultantMoodJournalInboxClient';
import StandardizedApi from '../../utils/standardizedApi';
import { MOOD_JOURNAL_API } from '../../constants/api';

jest.mock('../../utils/standardizedApi', () => ({
  __esModule: true,
  default: {
    get: jest.fn()
  }
}));

describe('consultantMoodJournalInboxClient', () => {
  beforeEach(() => {
    StandardizedApi.get.mockReset();
  });

  test('normalize keeps shared items', () => {
    const row = normalizeMoodJournalInboxItem({
      id: 1,
      clientId: 9,
      clientName: '홍길동',
      date: '2026-09-01',
      moodValue: 3,
      memo: '메모',
      tags: ['불안'],
      sharedWithConsultant: true
    }, 0);
    expect(row).not.toBeNull();
    expect(row.id).toBe('1');
    expect(row.clientId).toBe(9);
    expect(row.sharedWithConsultant).toBe(true);
  });

  test('normalize fail-closed drops unshared when field present', () => {
    const row = normalizeMoodJournalInboxItem({
      id: 2,
      date: '2026-09-01',
      sharedWithConsultant: false
    }, 0);
    expect(row).toBeNull();
  });

  test('fetchConsultantMoodJournalInbox uses StandardizedApi inbox path', async() => {
    StandardizedApi.get.mockResolvedValue([
      {
        id: 3,
        date: '2026-09-02',
        sharedWithConsultant: true,
        memo: 'ok'
      },
      {
        id: 4,
        date: '2026-09-02',
        sharedWithConsultant: false,
        memo: 'hidden'
      }
    ]);
    const items = await fetchConsultantMoodJournalInbox();
    expect(StandardizedApi.get).toHaveBeenCalledWith(MOOD_JOURNAL_API.INBOX, {});
    expect(items).toHaveLength(1);
    expect(items[0].id).toBe('3');
  });
});
