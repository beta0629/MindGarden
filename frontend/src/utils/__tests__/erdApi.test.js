import * as erdApi from '../erdApi';
import { apiGet } from '../ajax';

jest.mock('../ajax', () => ({
  apiGet: jest.fn()
}));

const TENANT_ID = 'tenant-erd-a';
const DIAGRAM_ID = 'erd-a';

describe('erdApi — 테넌트 ERD 전용', () => {
  beforeEach(() => {
    apiGet.mockReset();
    apiGet.mockResolvedValue([]);
  });

  it('목록·상세·이력은 테넌트 경로만 호출한다', async() => {
    await erdApi.getTenantErds(TENANT_ID);
    await erdApi.getErdDetail(TENANT_ID, DIAGRAM_ID);
    await erdApi.getErdHistory(TENANT_ID, DIAGRAM_ID);

    expect(apiGet.mock.calls.map(([url]) => url)).toEqual([
      `/api/v1/tenants/${TENANT_ID}/erd`,
      `/api/v1/tenants/${TENANT_ID}/erd/${DIAGRAM_ID}`,
      `/api/v1/tenants/${TENANT_ID}/erd/${DIAGRAM_ID}/history`
    ]);
  });

  it('Ops 운영자 전용 ERD API 호출 함수를 내보내지 않는다', () => {
    expect(Object.keys(erdApi).filter((name) => name.endsWith('ForOps'))).toEqual([]);
    expect(Object.keys(erdApi).sort()).toEqual(['getErdDetail', 'getErdHistory', 'getTenantErds']);
  });
});
