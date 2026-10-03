/**
 * 개발·운영 FE 빌드 워크플로가 저장소 Variables 로 개인정보 문의처를 주입하고,
 * 코드 폴백은 안내 문구 상수 하나뿐이다.
 */
const fs = require('fs');
const path = require('path');

const REPO_ROOT = path.resolve(__dirname, '..', '..', '..', '..');
const readRepo = (rel) => fs.readFileSync(path.join(REPO_ROOT, rel), 'utf8');

const FE_BUILD_WORKFLOWS = [
  '.github/workflows/deploy-frontend-dev.yml',
  '.github/workflows/deploy-frontend-prod.yml'
];

describe('개인정보 문의처 빌드 주입', () => {
  test.each(FE_BUILD_WORKFLOWS)('%s 빌드 env 가 vars.PRIVACY_CONTACT_* 를 주입', (rel) => {
    const yml = readRepo(rel);
    expect(yml).toMatch(/REACT_APP_PRIVACY_CONTACT_EMAIL: \$\{\{ vars\.PRIVACY_CONTACT_EMAIL \}\}/);
    expect(yml).toMatch(/REACT_APP_PRIVACY_CONTACT_PHONE: \$\{\{ vars\.PRIVACY_CONTACT_PHONE \}\}/);
    expect(yml).not.toMatch(/REACT_APP_PRIVACY_CONTACT_(EMAIL|PHONE): [^$\n]/);
  });

  test('코드 폴백에 실제 이메일·전화번호가 없다', () => {
    const src = readRepo('frontend/src/constants/platformPrivacyContact.js');
    expect(src).not.toMatch(/[\w.+-]+@[\w-]+\.[\w.]+/);
    expect(src).not.toMatch(/\d{2,4}-\d{3,4}-\d{4}/);
  });
});
