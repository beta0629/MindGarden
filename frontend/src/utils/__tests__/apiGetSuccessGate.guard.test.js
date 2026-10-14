/**
 * 소스 가드 — 우선 경로에서 apiGet unwrap 후 `response.success` 단독 게이트가 남지 않았는지.
 * unwrapApiEnvelope:false 의도 호출은 제외(해당 파일 미포함).
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..', '..');

const TARGET_FILES = [
  'components/schedule/ConsultantStatus.js',
  'components/schedule/ClientSelector.js',
  'components/admin/mapping/MappingDetailModal.js',
  'components/admin/ConsultationCompletionStats.js',
  'components/admin/mapping/ConsultantTransferModal.js',
  'components/admin/mapping/ConsultantTransferHistory.js',
  'utils/apiResponseNormalize.js'
];

describe('apiGet unwrap success-gate source guard', () => {
  it('우선 파일에 `if (response.success)` / `if (response && response.success)` 단독 게이트가 없다', () => {
    const offenders = [];
    const pattern = /if\s*\(\s*response(?:\s*&&\s*response)?\.success\s*\)/;

    TARGET_FILES.forEach((rel) => {
      const full = path.join(ROOT, rel);
      const src = fs.readFileSync(full, 'utf8');
      if (pattern.test(src)) {
        offenders.push(rel);
      }
    });

    expect(offenders).toEqual([]);
  });

  it('ConsultantTransfer* 는 with-vacation / transfer-history 를 /api/v1/admin 으로 호출한다', () => {
    const modal = fs.readFileSync(
      path.join(ROOT, 'components/admin/mapping/ConsultantTransferModal.js'),
      'utf8'
    );
    const history = fs.readFileSync(
      path.join(ROOT, 'components/admin/mapping/ConsultantTransferHistory.js'),
      'utf8'
    );
    expect(modal).toContain('/api/v1/admin/consultants/with-vacation');
    expect(modal).not.toMatch(/\/api\/admin\/consultants\/with-vacation/);
    expect(history).toContain('/api/v1/admin/clients/');
    expect(history).toContain('transfer-history');
    expect(history).not.toMatch(/\/api\/admin\/clients\//);
  });
});
