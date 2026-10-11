'use strict';

function requestPayment() {
  return Promise.resolve({ paymentId: 'test-payment' });
}

module.exports = {
  requestPayment,
  default: {
    requestPayment
  }
};
