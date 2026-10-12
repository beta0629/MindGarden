/**
 * Jest stub for @portone/browser-sdk/v2 when the package is not installed.
 */
'use strict';

module.exports = {
  requestPayment: function requestPayment() {
    return Promise.resolve(undefined);
  }
};
