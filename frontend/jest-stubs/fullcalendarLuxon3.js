/**
 * Jest resolver for @fullcalendar/luxon3.
 * 패키지가 있으면 실제 플러그인을 쓰고, 없을 때는 FullCalendar addDefs 가
 * 순회 가능한 빈 플러그인을 써서 스위트가 로드되게 한다.
 *
 * @author CoreSolution
 * @since 2026-10-29
 */
const fs = require('fs');
const path = require('path');

const realPackageJson = path.join(
  __dirname,
  '..',
  'node_modules',
  '@fullcalendar',
  'luxon3',
  'package.json'
);

function createLoadOnlyPlugin() {
  const plugin = [];
  plugin.id = 'luxon3';
  plugin.name = '@fullcalendar/luxon3';
  return plugin;
}

if (fs.existsSync(realPackageJson)) {
  module.exports = require(path.join(
    __dirname,
    '..',
    'node_modules',
    '@fullcalendar',
    'luxon3'
  ));
} else {
  const plugin = createLoadOnlyPlugin();
  module.exports = plugin;
  module.exports.__esModule = true;
  module.exports.default = plugin;
}
