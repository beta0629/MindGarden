import StandardizedApi from '../../utils/standardizedApi';
import {
  createAccount,
  deleteAccount,
  listAccountBanks,
  listActiveAccounts,
  setPrimaryAccount,
  toggleAccountStatus,
  updateAccount
} from '../accountManagementService';
import {
  ACCOUNT_API,
  buildAccountItemPath,
  buildAccountSetPrimaryPath,
  buildAccountToggleStatusPath
} from '../../constants/account';

jest.mock('../../utils/standardizedApi', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn()
  }
}));

describe('accountManagementService (G2-07 Phase 1-C)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('listActiveAccounts', () => {
    test('배열을 직접 반환하면 그대로 파싱한다', async() => {
      StandardizedApi.get.mockResolvedValueOnce([{ id: 1, bankName: '신한은행' }]);

      const list = await listActiveAccounts();

      expect(StandardizedApi.get).toHaveBeenCalledWith(ACCOUNT_API.ACTIVE);
      expect(list).toHaveLength(1);
      expect(list[0].bankName).toBe('신한은행');
    });

    test('ApiResponse 래퍼를 반환하면 data 배열을 파싱한다', async() => {
      StandardizedApi.get.mockResolvedValueOnce({
        success: true,
        data: [{ id: 2, bankName: '우리은행' }]
      });

      const list = await listActiveAccounts();

      expect(list).toHaveLength(1);
      expect(list[0].bankName).toBe('우리은행');
    });
  });

  describe('listAccountBanks', () => {
    test('은행 목록을 조회한다', async() => {
      StandardizedApi.get.mockResolvedValueOnce([{ code: 'SHINHAN', name: '신한은행' }]);

      const list = await listAccountBanks();

      expect(StandardizedApi.get).toHaveBeenCalledWith(ACCOUNT_API.BANKS);
      expect(list[0].code).toBe('SHINHAN');
    });
  });

  describe('mutations', () => {
    test('createAccount는 POST /api/v1/accounts를 호출한다', async() => {
      const payload = { bankCode: 'SHINHAN', accountNumber: '110-123' };
      StandardizedApi.post.mockResolvedValueOnce({ success: true, data: { id: 9 } });

      await createAccount(payload);

      expect(StandardizedApi.post).toHaveBeenCalledWith(ACCOUNT_API.BASE, payload);
    });

    test('updateAccount는 PUT item path를 호출한다', async() => {
      StandardizedApi.put.mockResolvedValueOnce({ id: 3 });

      await updateAccount(3, { bankName: 'KB' });

      expect(StandardizedApi.put).toHaveBeenCalledWith(buildAccountItemPath(3), { bankName: 'KB' });
    });

    test('deleteAccount는 DELETE item path를 호출한다', async() => {
      StandardizedApi.delete.mockResolvedValueOnce(null);

      await deleteAccount(5);

      expect(StandardizedApi.delete).toHaveBeenCalledWith(buildAccountItemPath(5));
    });

    test('toggleAccountStatus는 PATCH toggle-status를 호출한다', async() => {
      StandardizedApi.patch.mockResolvedValueOnce({ id: 7, isActive: false });

      await toggleAccountStatus(7);

      expect(StandardizedApi.patch).toHaveBeenCalledWith(buildAccountToggleStatusPath(7));
    });

    test('setPrimaryAccount는 PATCH set-primary를 호출한다', async() => {
      StandardizedApi.patch.mockResolvedValueOnce({ id: 8, isPrimary: true });

      await setPrimaryAccount(8);

      expect(StandardizedApi.patch).toHaveBeenCalledWith(buildAccountSetPrimaryPath(8));
    });
  });
});
