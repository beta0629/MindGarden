/**
 * Jest stand-in for @portone/browser-sdk/v2.
 * Guardrail/offline installs may omit the package from node_modules; App tests
 * still import shop checkout which loads this subpath.
 *
 * @author CoreSolution
 * @since 2026-10-11
 */

const requestPayment = jest.fn(() => Promise.resolve({}));

module.exports = {
  __esModule: true,
  requestPayment,
  default: {
    requestPayment
  }
};
