import { CONSULTATION_LOG_SERVER_DRAFT_API_PATH } from '../../constants/consultationLogAutosaveConstants';
import {
  fetchConsultationLogDraftFromServer,
  pushConsultationLogDraftToServer
} from '../consultationLogDraftServerAdapter';
import * as ajax from '../ajax';

jest.mock('../ajax', () => ({
  apiGet: jest.fn(),
  apiPut: jest.fn()
}));

describe('consultationLogDraftServerAdapter', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('fetchConsultationLogDraftFromServer', () => {
    test('성공 시 hasDraft·version·payloadJson 반환', async() => {
      ajax.apiGet.mockResolvedValueOnce({
        hasDraft: true,
        version: 3,
        payloadJson: '{"a":1}'
      });
      const res = await fetchConsultationLogDraftFromServer({
        consultationId: 'schedule-42',
        consultantId: 7
      });
      expect(ajax.apiGet).toHaveBeenCalledWith(CONSULTATION_LOG_SERVER_DRAFT_API_PATH, {
        consultationId: 'schedule-42',
        consultantId: '7'
      });
      expect(res).toEqual({
        ok: true,
        hasDraft: true,
        version: 3,
        payloadJson: '{"a":1}'
      });
    });

    test('apiGet이 null(401 등)이면 notAuthenticated 플래그', async() => {
      ajax.apiGet.mockResolvedValueOnce(null);
      const res = await fetchConsultationLogDraftFromServer({
        consultationId: '10',
        consultantId: 1
      });
      expect(res.ok).toBe(false);
      expect(res.notAuthenticated).toBe(true);
    });

    test('apiGet 예외 시 ok false', async() => {
      ajax.apiGet.mockRejectedValueOnce(new Error('network'));
      const res = await fetchConsultationLogDraftFromServer({
        consultationId: '10',
        consultantId: 1
      });
      expect(res.ok).toBe(false);
      expect(res.skipped).toBe(false);
    });
  });

  describe('pushConsultationLogDraftToServer', () => {
    test('성공 시 version 반환·expectedVersion 포함', async() => {
      ajax.apiPut.mockResolvedValueOnce({ version: 4 });
      const res = await pushConsultationLogDraftToServer({
        consultationId: 'schedule-5',
        consultantId: 9,
        formData: { x: 1 },
        memoDraft: 'm',
        expectedVersion: 3
      });
      expect(ajax.apiPut).toHaveBeenCalledTimes(1);
      const [url, body] = ajax.apiPut.mock.calls[0];
      expect(url).toBe(
        `${CONSULTATION_LOG_SERVER_DRAFT_API_PATH}?consultationId=schedule-5&consultantId=9`
      );
      expect(body).toEqual({
        payloadJson: JSON.stringify({ formData: { x: 1 }, memoDraft: 'm' }),
        expectedVersion: 3
      });
      expect(res).toEqual({ ok: true, version: 4 });
    });

    test('apiPut null이면 ok false', async() => {
      ajax.apiPut.mockResolvedValueOnce(null);
      const res = await pushConsultationLogDraftToServer({
        consultationId: '1',
        consultantId: 2,
        formData: {},
        memoDraft: ''
      });
      expect(res.ok).toBe(false);
      expect(res.skipped).toBe(false);
    });

    test('consultantId 누락 시 skipped', async() => {
      const res = await pushConsultationLogDraftToServer({
        consultationId: '1',
        consultantId: null,
        formData: {},
        memoDraft: ''
      });
      expect(res.skipped).toBe(true);
      expect(ajax.apiPut).not.toHaveBeenCalled();
    });
  });
});
