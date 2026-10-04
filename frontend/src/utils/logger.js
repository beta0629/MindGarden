/**
 * 공통 로거. 운영 빌드에서는 log·debug 를 내보내지 않고 warn·error 만 콘솔에 남긴다.
 *
 * 비밀번호·토큰·주민등록번호·카드번호 같은 입력값은 어떤 레벨로도 넘기지 않는다.
 *
 * @author CoreSolution
 * @since 2026-10-04
 */

const isProductionBuild = () => process.env.NODE_ENV === 'production';

const logger = {
  log: (...args) => {
    if (isProductionBuild()) {
      return;
    }
    console.log(...args);
  },
  debug: (...args) => {
    if (isProductionBuild()) {
      return;
    }
    console.debug(...args);
  },
  warn: (...args) => console.warn(...args),
  error: (...args) => console.error(...args)
};

export { isProductionBuild };
export default logger;
