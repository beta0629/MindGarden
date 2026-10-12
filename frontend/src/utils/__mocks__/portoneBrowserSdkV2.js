/**
 * Jest stub for @portone/browser-sdk/v2.
 * CRACO maps the SDK subpath here so suites load when dist/v2.cjs is absent.
 */
module.exports = {
  __esModule: true,
  requestPayment: () => Promise.resolve({}),
  loadIssueBillingKeyUI: () => Promise.resolve({})
};
