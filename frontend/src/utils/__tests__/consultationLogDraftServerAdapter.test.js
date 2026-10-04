import { CONSULTATION_LOG_SERVER_DRAFT_API_PATH } from '../../constants/consultationLogAutosaveConstants';
import {
  deleteConsultationLogDraftOnServer,
  fetchConsultationLogDraftFromServer,
  pushConsultationLogDraftToServer
} from '../consultationLogDraftServerAdapter';
import * as ajax from '../ajax';

jest.mock('../ajax', () => ({
  apiGet: jest.fn(),
  apiPut: jest.fn(),
  apiDelete: jest.fn()
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
        payloadJson: '{"a":1}',
        updatedAt: null
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
        payloadJson: JSON.stringify({ formData: { x: 1 }, memoDraft: 'm' }),
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
      expect(res).toEqual({ ok: true, version: 4, updatedAt: null });
    });

    test('apiPut null이면 ok false', async() => {
      ajax.apiPut.mockResolvedValueOnce(null);
      const res = await pushConsultationLogDraftToServer({
        consultationId: '1',
        consultantId: 2,
        payloadJson: '{}'
      });
      expect(res.ok).toBe(false);
      expect(res.skipped).toBe(false);
    });

    test('consultantId 누락 시 skipped', async() => {
      const res = await pushConsultationLogDraftToServer({
        consultationId: '1',
        consultantId: null,
        payloadJson: '{}'
      });
      expect(res.skipped).toBe(true);
      expect(ajax.apiPut).not.toHaveBeenCalled();
    });

    test('expectedVersion 400 시 재조회 후 1회 재시도', async() => {
      const conflict = new Error('초안 버전이 일치하지 않습니다. 새로고침 후 다시 시도해 주세요.');
      conflict.status = 400;
      conflict.response = { data: { field: 'expectedVersion', message: conflict.message } };
      ajax.apiPut
        .mockRejectedValueOnce(conflict)
        .mockResolvedValueOnce({ version: 6 });
      ajax.apiGet.mockResolvedValueOnce({
        hasDraft: true,
        version: 5,
        payloadJson: '{}'
      });

      const res = await pushConsultationLogDraftToServer({
        consultationId: 'schedule-386',
        consultantId: 22,
        payloadJson: JSON.stringify({ formData: { a: 1 }, memoDraft: '' }),
        expectedVersion: 3
      });

      expect(ajax.apiPut).toHaveBeenCalledTimes(2);
      expect(ajax.apiGet).toHaveBeenCalledTimes(1);
      expect(ajax.apiPut.mock.calls[1][1].expectedVersion).toBe(5);
      expect(res).toEqual({ ok: true, version: 6, updatedAt: null });
    });

    test('401 이면 notAuthenticated 를 돌려주고 재시도하지 않는다 (입력 보존은 호출부 책임)', async() => {
      const unauthorized = new Error('unauthorized');
      unauthorized.status = 401;
      ajax.apiPut.mockRejectedValueOnce(unauthorized);

      const res = await pushConsultationLogDraftToServer({
        consultationId: 'schedule-7',
        consultantId: 3,
        payloadJson: '{}'
      });

      expect(res).toEqual({ ok: false, skipped: false, notAuthenticated: true });
      expect(ajax.apiPut).toHaveBeenCalledTimes(1);
    });
  });

  describe('deleteConsultationLogDraftOnServer', () => {
    test('DELETE 쿼리에 consultationId·consultantId 를 넣어 호출한다', async() => {
      ajax.apiDelete.mockResolvedValueOnce({});

      const res = await deleteConsultationLogDraftOnServer({
        consultationId: 'schedule-5',
        consultantId: 9
      });

      expect(res.ok).toBe(true);
      expect(ajax.apiDelete).toHaveBeenCalledWith(
        `${CONSULTATION_LOG_SERVER_DRAFT_API_PATH}?consultationId=schedule-5&consultantId=9`
      );
    });

    test('consultantId 누락 시 skipped 이며 호출하지 않는다', async() => {
      const res = await deleteConsultationLogDraftOnServer({
        consultationId: 'schedule-5',
        consultantId: null
      });

      expect(res.skipped).toBe(true);
      expect(ajax.apiDelete).not.toHaveBeenCalled();
    });
  });
});
