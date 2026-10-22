/**
 * Jest resolver for @fullcalendar/luxon3.
 * 패키지가 있으면 실제 플러그인을 쓰고, 없을 때만 스위트 로드용 id 를 준다.
 *
 * @author CoreSolution
 * @since 2026-10-22
 */
const fs = require('fs');
const path = require('path');

const realDir = path.join(__dirname, '..', 'node_modules', '@fullcalendar', 'luxon3');
const realPackageJson = path.join(realDir, 'package.json');

if (fs.existsSync(realPackageJson)) {
  module.exports = require(realDir);
} else {
  const plugin = {
    id: 'luxon3',
    name: '@fullcalendar/luxon3'
  };
  module.exports = plugin;
  module.exports.__esModule = true;
  module.exports.default = plugin;
}
