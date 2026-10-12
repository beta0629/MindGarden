/**
 * Jest CJS stub for @portone/browser-sdk/v2.
 * The published package is not always present in node_modules in this environment.
 */
'use strict';

module.exports = {
  requestPayment: async function requestPayment() {
    return {};
  }
};
