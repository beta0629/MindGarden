/**
 * Jest resolver for qrcode.react.
 * 패키지가 있으면 실제 모듈을 쓰고, 없으면 QRCodeSVG 스텁으로 스위트를 돌린다.
 *
 * @author MindGarden
 * @since 2026-11-27
 */
const fs = require('fs');
const path = require('path');
const React = require('react');

const realEntry = path.join(__dirname, '..', 'node_modules', 'qrcode.react');

if (fs.existsSync(realEntry)) {
  module.exports = require(realEntry);
} else {
  module.exports = {
    QRCodeSVG: function QRCodeSVG({ value }) {
      return React.createElement('svg', {
        'data-testid': 'mock-qr',
        'data-value': value
      });
    }
  };
}
