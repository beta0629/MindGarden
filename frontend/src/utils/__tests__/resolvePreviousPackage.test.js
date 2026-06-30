import {
  PREVIOUS_PACKAGE_SOURCE,
  PREVIOUS_PACKAGE_STATUS,
  filterSettledMappingsForClient,
  findMostRecentMapping,
  getMappingRecencyTimestamp,
  matchPackageOption,
  normalizeMappingIds,
  resolvePreviousPackage
} from '../resolvePreviousPackage';

const packageOptions = [
  { value: 'STANDARD', label: '표준 패키지', sessions: 10, price: 500000 },
  { value: 'BASIC', label: '기본 패키지', sessions: 5, price: 300000 }
];

const baseMapping = {
  id: 100,
  clientId: 22,
  consultantId: 11,
  packageName: '표준 패키지',
  totalSessions: 10,
  packagePrice: 500000,
  paymentStatus: 'PAY',
  createdAt: '2026-01-01T10:00:00.000Z'
};

describe('resolvePreviousPackage', () => {
  describe('normalizeMappingIds', () => {
    it('nested client/consultant 객체에서 id 를 추출한다', () => {
      expect(normalizeMappingIds({
        client: { id: 22 },
        consultant: { id: 11 }
      })).toEqual({ clientId: '22', consultantId: '11' });
    });
  });

  describe('getMappingRecencyTimestamp', () => {
    it('createdAt / paymentDate / startDate 중 최대값을 사용한다', () => {
      expect(getMappingRecencyTimestamp({
        createdAt: '2026-01-01T00:00:00.000Z',
        paymentDate: '2026-02-01T00:00:00.000Z',
        startDate: '2026-01-15T00:00:00.000Z'
      })).toBe(Date.parse('2026-02-01T00:00:00.000Z'));
    });
  });

  describe('matchPackageOption', () => {
    it('label 로 packageOptions 를 매칭한다', () => {
      expect(matchPackageOption(baseMapping, packageOptions)).toEqual(packageOptions[0]);
    });

    it('label 불일치 시 codeValue 로 매칭한다', () => {
      expect(matchPackageOption({ ...baseMapping, packageName: 'BASIC' }, packageOptions))
        .toEqual(packageOptions[1]);
    });

    it('label/codeValue 불일치 시 sessions+price 로 매칭한다', () => {
      expect(matchPackageOption({
        ...baseMapping,
        packageName: '구 패키지명',
        totalSessions: 5,
        packagePrice: 300000
      }, packageOptions)).toEqual(packageOptions[1]);
    });

    it('매칭 실패 시 null', () => {
      expect(matchPackageOption({
        ...baseMapping,
        packageName: '단종 패키지',
        totalSessions: 99,
        packagePrice: 999999
      }, packageOptions)).toBeNull();
    });
  });

  describe('filterSettledMappingsForClient', () => {
    it('settled 가 아닌 매칭은 제외한다', () => {
      const mappings = [
        baseMapping,
        { ...baseMapping, id: 101, paymentStatus: 'PENDING' }
      ];
      expect(filterSettledMappingsForClient(mappings, 22, 11)).toHaveLength(1);
    });
  });

  describe('findMostRecentMapping', () => {
    it('가장 최근 createdAt 매핑을 반환한다', () => {
      const mappings = [
        { ...baseMapping, id: 1, createdAt: '2026-01-01T00:00:00.000Z' },
        { ...baseMapping, id: 2, createdAt: '2026-06-01T00:00:00.000Z' }
      ];
      expect(findMostRecentMapping(mappings).id).toBe(2);
    });
  });

  describe('resolvePreviousPackage', () => {
    it('동일 상담사+내담자 settled 최근 패키지를 우선 반환한다', () => {
      const mappings = [
        {
          ...baseMapping,
          id: 1,
          consultantId: 99,
          packageName: '기본 패키지',
          totalSessions: 5,
          packagePrice: 300000,
          createdAt: '2026-06-01T00:00:00.000Z'
        },
        {
          ...baseMapping,
          id: 2,
          consultantId: 11,
          packageName: '표준 패키지',
          createdAt: '2026-01-01T00:00:00.000Z'
        }
      ];

      const result = resolvePreviousPackage({
        clientId: 22,
        consultantId: 11,
        mappings,
        packageOptions
      });

      expect(result).toMatchObject({
        status: PREVIOUS_PACKAGE_STATUS.MATCHED,
        source: PREVIOUS_PACKAGE_SOURCE.SAME_PAIR,
        packageOption: packageOptions[0],
        historicalPackageName: '표준 패키지',
        mappingId: 2
      });
    });

    it('동일 쌍 이력 없으면 내담자 전체 settled 최근으로 fallback 한다', () => {
      const mappings = [
        {
          ...baseMapping,
          id: 3,
          consultantId: 99,
          packageName: '기본 패키지',
          totalSessions: 5,
          packagePrice: 300000,
          createdAt: '2026-05-01T00:00:00.000Z'
        }
      ];

      const result = resolvePreviousPackage({
        clientId: 22,
        consultantId: 11,
        mappings,
        packageOptions
      });

      expect(result).toMatchObject({
        status: PREVIOUS_PACKAGE_STATUS.MATCHED,
        source: PREVIOUS_PACKAGE_SOURCE.CLIENT_ONLY,
        packageOption: packageOptions[1],
        mappingId: 3
      });
    });

    it('settled 이력 없으면 none', () => {
      const result = resolvePreviousPackage({
        clientId: 22,
        consultantId: 11,
        mappings: [{ ...baseMapping, paymentStatus: 'PENDING' }],
        packageOptions
      });

      expect(result.status).toBe(PREVIOUS_PACKAGE_STATUS.NONE);
      expect(result.packageOption).toBeNull();
    });

    it('단종 패키지는 discontinued 로 반환하고 packageOption 은 null', () => {
      const result = resolvePreviousPackage({
        clientId: 22,
        consultantId: 11,
        mappings: [{
          ...baseMapping,
          packageName: '단종 패키지',
          totalSessions: 99,
          packagePrice: 999999
        }],
        packageOptions
      });

      expect(result).toMatchObject({
        status: PREVIOUS_PACKAGE_STATUS.DISCONTINUED,
        packageOption: null,
        historicalPackageName: '단종 패키지'
      });
    });
  });
});
