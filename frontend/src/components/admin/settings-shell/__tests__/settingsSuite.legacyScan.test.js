/**
 * 설정 화면 16종 레거시 크롬 스캔 — 아래 패턴이 다시 들어오면 실패한다.
 * (구 ContentHeader/ContentSection, mg-action-btn, b0kla 카드, alert alert-danger,
 *  Bootstrap form-control/form-select, Tailwind gray 입력, 구 teal-700 원색·primary-solid,
 *  raw 표 태그·role 표 div 그리드, 쇼핑 스위트 BEM, SettingsButton 우회 MGButton 직사용)
 */

const LEGACY_TEAL_700_HEX = ['0f', '76', '6e'].join('');
const fs = require('fs');
const path = require('path');

const SRC = path.resolve(__dirname, '../../../..');

/** 설정 화면 16종의 진입 파일과 하위 폴더 */
const SETTINGS_SCAN_TARGETS = [
  'components/admin/settings-shell',
  'components/tenant/TenantProfile.js',
  'components/tenant/TenantProfile.css',
  'pages/BrandingManagementPage.js',
  'components/admin/BrandingManagement.js',
  'components/admin/BrandingManagement.css',
  'components/admin/SystemConfigManagement.js',
  'components/admin/SystemConfigManagement.css',
  'components/admin/TenantCommonCodeManager.js',
  'components/tenant/MerchantLegalSettings.js',
  'components/tenant/MerchantLegalSettings.css',
  'components/tenant/PgConfigurationList.js',
  'components/tenant/PgConfigurationList.css',
  'components/tenant/PgConfigurationDetail.js',
  'components/tenant/PgConfigurationDetail.css',
  'components/admin/aiProvider',
  'components/admin/manual-notification',
  'components/admin/sms-templates',
  'components/admin/PushMonitoring',
  'components/compliance',
  'components/admin/AdminKakaoAlimtalkSettingsPage.js',
  'components/admin/AdminKakaoAlimtalkSettingsPage.css',
  'components/admin/AdminTenantSmsSettingsPage.js',
  'components/admin/AdminTenantSmsSettingsPage.css',
  'components/admin/AdminShopProductsPage.js',
  'components/admin/AdminShopProductsPage.css'
];

/** 패턴별 예외 파일 — 공통 래퍼 자신만 허용한다 */
const SETTINGS_BUTTON_WRAPPER = 'components/admin/settings-shell/SettingsButton.js';

const LEGACY_PATTERNS = [
  { name: '구 ContentHeader', re: /\bContentHeader\b/ },
  { name: '구 ContentSection 카드', re: /\bContentSection\b/ },
  { name: 'mg-action-btn', re: /mg-action-btn/ },
  { name: 'ActionBarButton(mg-action-btn 렌더)', re: /\bActionBarButton\b/ },
  { name: 'b0kla 카드', re: /mg-v2-ad-b0kla/ },
  { name: 'alert alert-danger', re: /\balert-danger\b/ },
  { name: 'Bootstrap form-control', re: /(?<![\w-])form-control(?![\w-])/ },
  { name: 'Bootstrap form-select', re: /(?<![\w-])form-select(?![\w-])/ },
  { name: 'Tailwind gray', re: /(?<![\w-])(?:bg|text|border|ring|placeholder)-gray-\d{2,3}\b/ },
  { name: '구 teal-700 원색', re: new RegExp(`#${LEGACY_TEAL_700_HEX}`, 'i') },
  { name: '구 teal-700 토큰(primary-solid·cs-teal-700)', re: /primary-solid|cs-teal-700/ },
  { name: 'raw <table> (ListTableView 사용)', re: /<table\b/ },
  { name: 'role="table" div 그리드 (ListTableView 사용)', re: /role=["']table["']/ },
  { name: '쇼핑 스위트 BEM(admin-shop-suite__)', re: /admin-shop-suite__/ },
  {
    name: 'MGButton 직사용 (SettingsButton 사용)',
    re: /<MGButton\b/,
    allow: [SETTINGS_BUTTON_WRAPPER]
  }
];

const NON_TEXT_INPUT_TYPE = /type=["'{](?:checkbox|radio|hidden|file|color|range)["'}]/;

const INPUT_CONTRACT_CLASS = {
  input: /mg-v2-form-input/,
  select: /mg-v2-select/,
  textarea: /mg-v2-form-textarea/
};

const SCANNED_EXT = /\.(js|jsx|ts|tsx|css)$/;

function collectFiles(rel) {
  const abs = path.join(SRC, rel);
  if (!fs.existsSync(abs)) {
    throw new Error(`스캔 대상이 없습니다: ${rel}`);
  }
  const stat = fs.statSync(abs);
  if (stat.isFile()) {
    return [abs];
  }
  return fs.readdirSync(abs).flatMap((name) => {
    if (name === '__tests__') {
      return [];
    }
    const childRel = path.join(rel, name);
    const childAbs = path.join(SRC, childRel);
    if (fs.statSync(childAbs).isDirectory()) {
      return collectFiles(childRel);
    }
    return SCANNED_EXT.test(name) ? [childAbs] : [];
  });
}

describe('설정 화면 레거시 크롬 스캔', () => {
  const files = SETTINGS_SCAN_TARGETS.flatMap(collectFiles);

  it('스캔 대상 파일을 찾는다', () => {
    expect(files.length).toBeGreaterThan(SETTINGS_SCAN_TARGETS.length);
  });

  it.each(LEGACY_PATTERNS.map((p) => [p.name, p.re, p.allow || []]))('%s 패턴이 없다', (name, re, allow) => {
    const hits = [];
    const allowed = new Set(allow.map((rel) => path.join(SRC, rel)));
    files.filter((file) => !allowed.has(file)).forEach((file) => {
      fs.readFileSync(file, 'utf8')
        .split('\n')
        .forEach((line, idx) => {
          if (re.test(line)) {
            hits.push(`${path.relative(SRC, file)}:${idx + 1}: ${line.trim()}`);
          }
        });
    });
    expect(hits).toEqual([]);
  });

  it('텍스트형 input·select·textarea는 mg-v2 입력 계약 클래스를 쓴다', () => {
    const misses = [];
    files.filter((file) => /\.(js|jsx|tsx)$/.test(file)).forEach((file) => {
      const src = fs.readFileSync(file, 'utf8');
      const tagRe = /<(input|select|textarea)\b((?:=>|[^>])*)>/g;
      let match = tagRe.exec(src);
      while (match) {
        const [, tag, attrs] = match;
        if (!NON_TEXT_INPUT_TYPE.test(attrs) && !INPUT_CONTRACT_CLASS[tag].test(attrs)) {
          const line = src.slice(0, match.index).split('\n').length;
          misses.push(`${path.relative(SRC, file)}:${line}: <${tag}>`);
        }
        match = tagRe.exec(src);
      }
    });
    expect(misses).toEqual([]);
  });

  it('스캐너가 금지 패턴을 실제로 잡는다', () => {
    const sample = [
      '<ContentHeader title="x" />',
      '<ContentSection>',
      'className="mg-action-btn"',
      '<ActionBarButton label="x" />',
      'className="mg-v2-ad-b0kla__card"',
      'className="alert alert-danger"',
      'className="form-control"',
      'className="form-select"',
      'className="border-gray-300"',
      `color: #${LEGACY_TEAL_700_HEX};`,
      'background: var(--mg-v2-color-primary-solid);',
      '<table className="x">',
      '<div role="table" aria-label="x">',
      'className="admin-shop-suite__toolbar"',
      '<MGButton variant="primary">'
    ];
    expect(sample).toHaveLength(LEGACY_PATTERNS.length);
    LEGACY_PATTERNS.forEach((p, i) => {
      expect(p.re.test(sample[i])).toBe(true);
    });
    expect(LEGACY_PATTERNS.some((p) => p.re.test('className="mg-v2-form-input"'))).toBe(false);
    ['<ListTableView columns={c} />', '<SettingsButton variant="primary">', "import './AdminShopSuite.css';"]
      .forEach((ok) => {
        expect(LEGACY_PATTERNS.some((p) => p.re.test(ok))).toBe(false);
      });
  });

  it('MGButton 예외는 SettingsButton 래퍼 한 파일뿐이다', () => {
    const mgButton = LEGACY_PATTERNS.find((p) => p.allow);
    expect(mgButton.allow).toEqual([SETTINGS_BUTTON_WRAPPER]);
    expect(fs.existsSync(path.join(SRC, SETTINGS_BUTTON_WRAPPER))).toBe(true);
    expect(fs.readFileSync(path.join(SRC, SETTINGS_BUTTON_WRAPPER), 'utf8')).toMatch(mgButton.re);
  });
});
