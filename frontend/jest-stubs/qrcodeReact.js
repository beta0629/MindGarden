/**
 * Jest stub for qrcode.react (v4 is ESM-only; CRA Jest cannot resolve it).
 *
 * @author CoreSolution
 * @since 2026-11-27
 */
const React = require('react');

function QRCodeSVG({ value, size, ...rest }) {
  return React.createElement('svg', {
    'data-testid': 'mock-qr',
    'data-value': value == null ? '' : String(value),
    width: size,
    height: size,
    ...rest
  });
}

function QRCodeCanvas({ value, ...rest }) {
  return React.createElement('canvas', {
    'data-testid': 'mock-qr-canvas',
    'data-value': value == null ? '' : String(value),
    ...rest
  });
}

module.exports = {
  QRCodeSVG,
  QRCodeCanvas,
  __esModule: true
};
