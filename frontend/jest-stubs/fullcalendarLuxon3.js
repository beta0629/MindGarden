/**
 * Jest resolver for @fullcalendar/luxon3.
 * 패키지가 있으면 실제 플러그인을 쓴다. 없으면 FullCalendar createPlugin 과
 * 같은 필드(deps 등 순회 가능 배열)를 가진 스텁을 내보낸다.
 * 배열만 내보내면 addDefs(def.deps) 가 TypeError: defs is not iterable 로 깨진다.
 *
 * @author CoreSolution
 * @since 2026-10-29
 */
const fs = require('fs');
const path = require('path');
const { createPlugin } = require('@fullcalendar/core');

const realPackageJson = path.join(
  __dirname,
  '..',
  'node_modules',
  '@fullcalendar',
  'luxon3',
  'package.json'
);

if (fs.existsSync(realPackageJson)) {
  module.exports = require(path.join(
    __dirname,
    '..',
    'node_modules',
    '@fullcalendar',
    'luxon3'
  ));
} else {
  const plugin = createPlugin({
    name: '@fullcalendar/luxon3'
  });
  plugin.id = 'luxon3';
  module.exports = plugin;
  module.exports.__esModule = true;
  module.exports.default = plugin;
}
