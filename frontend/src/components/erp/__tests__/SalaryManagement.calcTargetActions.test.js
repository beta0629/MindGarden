/**
 * 급여 계산 모달 「계산 대상 선택」— 새로고침(secondary)과 계산하기(primary)가
 * 입력 행에 있고, 기존 핸들러를 유지한다.
 */
const fs = require('fs');
const path = require('path');

const FRONTEND_ROOT = path.resolve(__dirname, '..', '..', '..', '..');
const read = (rel) => fs.readFileSync(path.join(FRONTEND_ROOT, rel), 'utf8');

describe('Salary calculation target actions', () => {
  const salaryJs = read('src/components/erp/SalaryManagement.js');
  const salaryCss = read('src/components/erp/SalaryManagement.css');

  const calcBlock = salaryJs.slice(
    salaryJs.indexOf('ariaLabel="급여 계산 대상 선택"'),
    salaryJs.indexOf('salary-calc-block__preview')
  );

  test('새로고침 is secondary and 계산하기 is primary on the input row', () => {
    expect(calcBlock).toMatch(/salary-filter-block__group/);
    expect(calcBlock).toMatch(/salary-filter-block__fields/);
    expect(calcBlock).toMatch(/salary-filter-block__run-calc/);
    expect(calcBlock).not.toMatch(/secondaryRow/);

    const refreshAt = calcBlock.indexOf("variant=\"secondary\"");
    const calcAt = calcBlock.indexOf("variant=\"primary\"");
    const refreshLabel = calcBlock.indexOf('t_8edcbb09');
    const calcLabel = calcBlock.indexOf('t_dd64b2ef');
    expect(refreshAt).toBeGreaterThan(-1);
    expect(calcAt).toBeGreaterThan(refreshAt);
    expect(refreshLabel).toBeGreaterThan(refreshAt);
    expect(calcLabel).toBeGreaterThan(calcAt);
    expect(calcBlock).toMatch(/onClick=\{handleDataRefresh\}/);
    expect(calcBlock).toMatch(/onClick=\{executeSalaryCalculation\}/);
  });

  test('buttons share the input height token and wrap right-aligned', () => {
    expect(salaryCss).toMatch(
      /\.salary-management__calc-stage \.salary-filter-block__group\s*\{[^}]*flex-direction:\s*row/s
    );
    expect(salaryCss).toMatch(
      /\.salary-management__calc-stage \.salary-filter-block__group\s*\{[^}]*flex-wrap:\s*wrap/s
    );
    expect(salaryCss).toMatch(
      /\.salary-management__calc-stage \.salary-filter-block__group\s*\{[^}]*align-items:\s*flex-end/s
    );
    expect(salaryCss).toMatch(
      /\.salary-management__calc-stage \.salary-filter-block__run-calc\s*\{[^}]*margin-inline-start:\s*auto/s
    );
    expect(salaryCss).toMatch(
      /\.salary-management__calc-stage \.salary-filter-block__run-calc\s*\{[^}]*justify-content:\s*flex-end/s
    );
    expect(salaryCss).toMatch(
      /salary-filter-block__run-calc \.mg-button[\s\S]*?height:\s*var\(--mg-v2-component-height-sm\)/
    );
    expect(salaryCss).toMatch(
      /salary-filter-block__field \.mg-v2-select[\s\S]*?height:\s*var\(--mg-v2-component-height-sm\)/
    );
  });

  test('approve and pay handlers are unchanged function names', () => {
    expect(salaryJs).toMatch(/const handleApproveSalary = async/);
    expect(salaryJs).toMatch(/const handlePaySalary = async/);
    expect(salaryJs).toMatch(/const executeSalaryCalculation = async/);
    expect(salaryJs).toMatch(/onApprove=\{handleApproveSalary\}/);
    expect(salaryJs).toMatch(/onPay=\{handlePaySalary\}/);
    expect(salaryJs).not.toMatch(/SALARY_API_ENDPOINTS\.PAY[\s\S]{0,80}amount/);
  });
});
