'use strict';

const requestPayment =
  typeof jest !== 'undefined' ? jest.fn() : function requestPayment() {};

module.exports = {
  __esModule: true,
  requestPayment
};
