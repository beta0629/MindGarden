#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * lucide-react에서 존재하지 않는 모든 아이콘들을 찾아서 수정하는 스크립트
 */

const ICONS_FILE = path.join(__dirname, '../src/constants/icons.js');

// lucide-react에서 실제로 존재하는 아이콘들 확인
const lucideIcons = require('lucide-react');
const availableIcons = new Set(Object.keys(lucideIcons));

console.log('🔍 존재하지 않는 아이콘들 수정 중...');
console.log(`📊 사용 가능한 아이콘 수: ${availableIcons.size}`);

try {
  let content = fs.readFileSync(ICONS_FILE, 'utf8');
  let modified = false;
  
  // import 문에서 존재하지 않는 아이콘들 찾기
  const importLines = content.match(/import\s*\{[^}]+\}\s*from\s*['"]lucide-react['"];?/g) || [];
  const allImports = [];
  
  importLines.forEach(line => {
    const imports = line.match(/\{([^}]+)\}/)[1];
    const iconNames = imports.split(',').map(name => name.trim());
    allImports.push(...iconNames);
  });
  
  console.log(`📋 Import된 아이콘 수: ${allImports.length}`);
  
  // 존재하지 않는 아이콘들 찾기
  const missingIcons = allImports.filter(icon => !availableIcons.has(icon));
  console.log(`❌ 존재하지 않는 아이콘 수: ${missingIcons.length}`);
  
  if (missingIcons.length > 0) {
    console.log('🔍 존재하지 않는 아이콘들:', missingIcons.slice(0, 10).join(', '));
    
    // 각 존재하지 않는 아이콘을 대체 아이콘으로 변경
    missingIcons.forEach(missingIcon => {
      let replacement = 'X'; // 기본 대체 아이콘
      
      // 의미에 맞는 대체 아이콘 선택
      if (missingIcon.includes('User')) replacement = 'User';
      else if (missingIcon.includes('Check')) replacement = 'Check';
      else if (missingIcon.includes('Cancel') || missingIcon.includes('Close')) replacement = 'X';
      else if (missingIcon.includes('Edit')) replacement = 'Edit';
      else if (missingIcon.includes('Delete') || missingIcon.includes('Trash')) replacement = 'Trash2';
      else if (missingIcon.includes('Save')) replacement = 'Save';
      else if (missingIcon.includes('Add') || missingIcon.includes('Plus')) replacement = 'Plus';
      else if (missingIcon.includes('Remove') || missingIcon.includes('Minus')) replacement = 'Minus';
      else if (missingIcon.includes('Search')) replacement = 'Search';
      else if (missingIcon.includes('Eye')) replacement = 'Eye';
      else if (missingIcon.includes('Lock')) replacement = 'Lock';
      else if (missingIcon.includes('Unlock')) replacement = 'Unlock';
      else if (missingIcon.includes('Key')) replacement = 'Key';
      else if (missingIcon.includes('Shield')) replacement = 'Shield';
      else if (missingIcon.includes('Alert') || missingIcon.includes('Warning')) replacement = 'AlertTriangle';
      else if (missingIcon.includes('Info')) replacement = 'Info';
      else if (missingIcon.includes('Success')) replacement = 'CheckCircle';
      else if (missingIcon.includes('Error')) replacement = 'XCircle';
      else if (missingIcon.includes('Play')) replacement = 'Play';
      else if (missingIcon.includes('Pause')) replacement = 'Pause';
      else if (missingIcon.includes('Stop')) replacement = 'Square';
      else if (missingIcon.includes('Download')) replacement = 'Download';
      else if (missingIcon.includes('Upload')) replacement = 'Upload';
      else if (missingIcon.includes('Copy')) replacement = 'Copy';
      else if (missingIcon.includes('Cut')) replacement = 'Scissors';
      else if (missingIcon.includes('Paste')) replacement = 'Clipboard';
      else if (missingIcon.includes('Refresh')) replacement = 'RefreshCw';
      else if (missingIcon.includes('Rotate')) replacement = 'RotateCcw';
      else if (missingIcon.includes('Zoom')) replacement = 'ZoomIn';
      else if (missingIcon.includes('Filter')) replacement = 'Filter';
      else if (missingIcon.includes('Sort')) replacement = 'ArrowUpDown';
      else if (missingIcon.includes('Calendar')) replacement = 'Calendar';
      else if (missingIcon.includes('Clock')) replacement = 'Clock';
      else if (missingIcon.includes('Time')) replacement = 'Timer';
      else if (missingIcon.includes('Date')) replacement = 'Calendar';
      else if (missingIcon.includes('Location') || missingIcon.includes('Map')) replacement = 'MapPin';
      else if (missingIcon.includes('Phone')) replacement = 'Phone';
      else if (missingIcon.includes('Email') || missingIcon.includes('Mail')) replacement = 'Mail';
      else if (missingIcon.includes('Message') || missingIcon.includes('Chat')) replacement = 'MessageCircle';
      else if (missingIcon.includes('Notification')) replacement = 'Bell';
      else if (missingIcon.includes('Settings') || missingIcon.includes('Config')) replacement = 'Settings';
      else if (missingIcon.includes('Menu')) replacement = 'Menu';
      else if (missingIcon.includes('More')) replacement = 'MoreHorizontal';
      else if (missingIcon.includes('Arrow')) replacement = 'ArrowRight';
      else if (missingIcon.includes('Chevron')) replacement = 'ChevronRight';
      else if (missingIcon.includes('Star')) replacement = 'Star';
      else if (missingIcon.includes('Heart')) replacement = 'Heart';
      else if (missingIcon.includes('Like')) replacement = 'ThumbsUp';
      else if (missingIcon.includes('Dislike')) replacement = 'ThumbsDown';
      else if (missingIcon.includes('Smile') || missingIcon.includes('Happy')) replacement = 'Smile';
      else if (missingIcon.includes('Sad') || missingIcon.includes('Frown')) replacement = 'Frown';
      else if (missingIcon.includes('Angry')) replacement = 'Angry';
      else if (missingIcon.includes('Confused')) replacement = 'HelpCircle';
      else if (missingIcon.includes('Surprised')) replacement = 'Smile';
      else if (missingIcon.includes('Wink')) replacement = 'Smile';
      else if (missingIcon.includes('Kiss')) replacement = 'Smile';
      else if (missingIcon.includes('Tongue')) replacement = 'Smile';
      else if (missingIcon.includes('Cry')) replacement = 'Frown';
      else if (missingIcon.includes('Laugh')) replacement = 'Smile';
      else if (missingIcon.includes('Meh')) replacement = 'Meh';
      else if (missingIcon.includes('Bookmark')) replacement = 'Bookmark';
      else if (missingIcon.includes('Flag')) replacement = 'Flag';
      else if (missingIcon.includes('Tag')) replacement = 'Tag';
      else if (missingIcon.includes('Folder')) replacement = 'Folder';
      else if (missingIcon.includes('File')) replacement = 'File';
      else if (missingIcon.includes('Image') || missingIcon.includes('Photo')) replacement = 'Image';
      else if (missingIcon.includes('Video')) replacement = 'Video';
      else if (missingIcon.includes('Audio') || missingIcon.includes('Sound')) replacement = 'Volume2';
      else if (missingIcon.includes('Camera')) replacement = 'Camera';
      else if (missingIcon.includes('Mic') || missingIcon.includes('Microphone')) replacement = 'Mic';
      else if (missingIcon.includes('Headphones')) replacement = 'Headphones';
      else if (missingIcon.includes('Speaker')) replacement = 'Speaker';
      else if (missingIcon.includes('Monitor') || missingIcon.includes('Screen')) replacement = 'Monitor';
      else if (missingIcon.includes('Laptop')) replacement = 'Laptop';
      else if (missingIcon.includes('Phone')) replacement = 'Phone';
      else if (missingIcon.includes('Tablet')) replacement = 'Tablet';
      else if (missingIcon.includes('Watch')) replacement = 'Watch';
      else if (missingIcon.includes('Gamepad')) replacement = 'Gamepad2';
      else if (missingIcon.includes('Controller')) replacement = 'Gamepad2';
      else if (missingIcon.includes('Mouse')) replacement = 'Mouse';
      else if (missingIcon.includes('Keyboard')) replacement = 'Keyboard';
      else if (missingIcon.includes('Printer')) replacement = 'Printer';
      else if (missingIcon.includes('Scanner')) replacement = 'Scan';
      else if (missingIcon.includes('Fax')) replacement = 'Printer';
      else if (missingIcon.includes('Wifi')) replacement = 'Wifi';
      else if (missingIcon.includes('Bluetooth')) replacement = 'Bluetooth';
      else if (missingIcon.includes('NFC')) replacement = 'Nfc';
      else if (missingIcon.includes('GPS')) replacement = 'MapPin';
      else if (missingIcon.includes('Battery')) replacement = 'Battery';
      else if (missingIcon.includes('Power')) replacement = 'Power';
      else if (missingIcon.includes('Plug')) replacement = 'Plug';
      else if (missingIcon.includes('Cable')) replacement = 'Cable';
      else if (missingIcon.includes('USB')) replacement = 'Usb';
      else if (missingIcon.includes('HDMI')) replacement = 'Cable';
      else if (missingIcon.includes('Ethernet')) replacement = 'Cable';
      else if (missingIcon.includes('Router')) replacement = 'Router';
      else if (missingIcon.includes('Modem')) replacement = 'Router';
      else if (missingIcon.includes('Server')) replacement = 'Server';
      else if (missingIcon.includes('Database')) replacement = 'Database';
      else if (missingIcon.includes('Cloud')) replacement = 'Cloud';
      else if (missingIcon.includes('Storage')) replacement = 'HardDrive';
      else if (missingIcon.includes('Disk')) replacement = 'HardDrive';
      else if (missingIcon.includes('CD')) replacement = 'Disc';
      else if (missingIcon.includes('DVD')) replacement = 'Disc';
      else if (missingIcon.includes('Bluray')) replacement = 'Disc';
      else if (missingIcon.includes('Tape')) replacement = 'Cassette';
      else if (missingIcon.includes('Vinyl')) replacement = 'Disc';
      else if (missingIcon.includes('Radio')) replacement = 'Radio';
      else if (missingIcon.includes('TV')) replacement = 'Tv';
      else if (missingIcon.includes('Projector')) replacement = 'Projector';
      else if (missingIcon.includes('Screen')) replacement = 'Monitor';
      else if (missingIcon.includes('Display')) replacement = 'Monitor';
      else if (missingIcon.includes('Lamp')) replacement = 'Lamp';
      else if (missingIcon.includes('Light')) replacement = 'Lightbulb';
      else if (missingIcon.includes('Bulb')) replacement = 'Lightbulb';
      else if (missingIcon.includes('Flashlight')) replacement = 'Flashlight';
      else if (missingIcon.includes('Candle')) replacement = 'Candle';
      else if (missingIcon.includes('Fire')) replacement = 'Flame';
      else if (missingIcon.includes('Water')) replacement = 'Droplets';
      else if (missingIcon.includes('Drop')) replacement = 'Droplet';
      else if (missingIcon.includes('Rain')) replacement = 'CloudRain';
      else if (missingIcon.includes('Snow')) replacement = 'Snowflake';
      else if (missingIcon.includes('Sun')) replacement = 'Sun';
      else if (missingIcon.includes('Moon')) replacement = 'Moon';
      else if (missingIcon.includes('Star')) replacement = 'Star';
      else if (missingIcon.includes('Planet')) replacement = 'Globe';
      else if (missingIcon.includes('Earth')) replacement = 'Globe';
      else if (missingIcon.includes('World')) replacement = 'Globe';
      else if (missingIcon.includes('Map')) replacement = 'Map';
      else if (missingIcon.includes('Globe')) replacement = 'Globe';
      else if (missingIcon.includes('Compass')) replacement = 'Compass';
      else if (missingIcon.includes('Navigation')) replacement = 'Navigation';
      else if (missingIcon.includes('Route')) replacement = 'Route';
      else if (missingIcon.includes('Path')) replacement = 'Route';
      else if (missingIcon.includes('Road')) replacement = 'Route';
      else if (missingIcon.includes('Street')) replacement = 'Route';
      else if (missingIcon.includes('Highway')) replacement = 'Route';
      else if (missingIcon.includes('Bridge')) replacement = 'Bridge';
      else if (missingIcon.includes('Tunnel')) replacement = 'Tunnel';
      else if (missingIcon.includes('Building')) replacement = 'Building';
      else if (missingIcon.includes('House')) replacement = 'Home';
      else if (missingIcon.includes('Home')) replacement = 'Home';
      else if (missingIcon.includes('Apartment')) replacement = 'Building';
      else if (missingIcon.includes('Office')) replacement = 'Building';
      else if (missingIcon.includes('Factory')) replacement = 'Building';
      else if (missingIcon.includes('Warehouse')) replacement = 'Building';
      else if (missingIcon.includes('Store')) replacement = 'Store';
      else if (missingIcon.includes('Shop')) replacement = 'Store';
      else if (missingIcon.includes('Market')) replacement = 'Store';
      else if (missingIcon.includes('Mall')) replacement = 'Store';
      else if (missingIcon.includes('Restaurant')) replacement = 'Utensils';
      else if (missingIcon.includes('Cafe')) replacement = 'Coffee';
      else if (missingIcon.includes('Bar')) replacement = 'Wine';
      else if (missingIcon.includes('Hotel')) replacement = 'Building';
      else if (missingIcon.includes('Hospital')) replacement = 'Building';
      else if (missingIcon.includes('School')) replacement = 'Building';
      else if (missingIcon.includes('University')) replacement = 'Building';
      else if (missingIcon.includes('Library')) replacement = 'Library';
      else if (missingIcon.includes('Museum')) replacement = 'Building';
      else if (missingIcon.includes('Theater')) replacement = 'Building';
      else if (missingIcon.includes('Cinema')) replacement = 'Building';
      else if (missingIcon.includes('Stadium')) replacement = 'Building';
      else if (missingIcon.includes('Arena')) replacement = 'Building';
      else if (missingIcon.includes('Gym')) replacement = 'Building';
      else if (missingIcon.includes('Pool')) replacement = 'Building';
      else if (missingIcon.includes('Park')) replacement = 'Trees';
      else if (missingIcon.includes('Garden')) replacement = 'Trees';
      else if (missingIcon.includes('Forest')) replacement = 'Trees';
      else if (missingIcon.includes('Mountain')) replacement = 'Mountain';
      else if (missingIcon.includes('Hill')) replacement = 'Mountain';
      else if (missingIcon.includes('Valley')) replacement = 'Mountain';
      else if (missingIcon.includes('River')) replacement = 'Waves';
      else if (missingIcon.includes('Lake')) replacement = 'Waves';
      else if (missingIcon.includes('Ocean')) replacement = 'Waves';
      else if (missingIcon.includes('Sea')) replacement = 'Waves';
      else if (missingIcon.includes('Beach')) replacement = 'Waves';
      else if (missingIcon.includes('Island')) replacement = 'Waves';
      else if (missingIcon.includes('Desert')) replacement = 'Mountain';
      else if (missingIcon.includes('Jungle')) replacement = 'Trees';
      else if (missingIcon.includes('Cave')) replacement = 'Mountain';
      else if (missingIcon.includes('Volcano')) replacement = 'Mountain';
      else if (missingIcon.includes('Earthquake')) replacement = 'Mountain';
      else if (missingIcon.includes('Tsunami')) replacement = 'Waves';
      else if (missingIcon.includes('Hurricane')) replacement = 'Waves';
      else if (missingIcon.includes('Tornado')) replacement = 'Waves';
      else if (missingIcon.includes('Storm')) replacement = 'CloudRain';
      else if (missingIcon.includes('Thunder')) replacement = 'CloudRain';
      else if (missingIcon.includes('Lightning')) replacement = 'CloudRain';
      else if (missingIcon.includes('Rainbow')) replacement = 'CloudRain';
      else if (missingIcon.includes('Wind')) replacement = 'Wind';
      else if (missingIcon.includes('Breeze')) replacement = 'Wind';
      else if (missingIcon.includes('Gust')) replacement = 'Wind';
      else if (missingIcon.includes('Tornado')) replacement = 'Wind';
      else if (missingIcon.includes('Cyclone')) replacement = 'Wind';
      else if (missingIcon.includes('Typhoon')) replacement = 'Wind';
      else if (missingIcon.includes('Monsoon')) replacement = 'Wind';
      else if (missingIcon.includes('Blizzard')) replacement = 'Snowflake';
      else if (missingIcon.includes('Hail')) replacement = 'Snowflake';
      else if (missingIcon.includes('Sleet')) replacement = 'Snowflake';
      else if (missingIcon.includes('Fog')) replacement = 'Cloud';
      else if (missingIcon.includes('Mist')) replacement = 'Cloud';
      else if (missingIcon.includes('Haze')) replacement = 'Cloud';
      else if (missingIcon.includes('Smog')) replacement = 'Cloud';
      else if (missingIcon.includes('Dust')) replacement = 'Cloud';
      else if (missingIcon.includes('Sand')) replacement = 'Cloud';
      else if (missingIcon.includes('Smoke')) replacement = 'Cloud';
      else if (missingIcon.includes('Steam')) replacement = 'Cloud';
      else if (missingIcon.includes('Vapor')) replacement = 'Cloud';
      else if (missingIcon.includes('Gas')) replacement = 'Cloud';
      else if (missingIcon.includes('Air')) replacement = 'Wind';
      else if (missingIcon.includes('Oxygen')) replacement = 'Wind';
      else if (missingIcon.includes('Nitrogen')) replacement = 'Wind';
      else if (missingIcon.includes('Carbon')) replacement = 'Wind';
      else if (missingIcon.includes('Hydrogen')) replacement = 'Wind';
      else if (missingIcon.includes('Helium')) replacement = 'Wind';
      else if (missingIcon.includes('Neon')) replacement = 'Wind';
      else if (missingIcon.includes('Argon')) replacement = 'Wind';
      else if (missingIcon.includes('Krypton')) replacement = 'Wind';
      else if (missingIcon.includes('Xenon')) replacement = 'Wind';
      else if (missingIcon.includes('Radon')) replacement = 'Wind';
      else if (missingIcon.includes('Uranium')) replacement = 'Wind';
      else if (missingIcon.includes('Plutonium')) replacement = 'Wind';
      else if (missingIcon.includes('Radium')) replacement = 'Wind';
      else if (missingIcon.includes('Polonium')) replacement = 'Wind';
      else if (missingIcon.includes('Astatine')) replacement = 'Wind';
      else if (missingIcon.includes('Francium')) replacement = 'Wind';
      else if (missingIcon.includes('Radon')) replacement = 'Wind';
      else if (missingIcon.includes('Oganesson')) replacement = 'Wind';
      else if (missingIcon.includes('Tennessine')) replacement = 'Wind';
      else if (missingIcon.includes('Moscovium')) replacement = 'Wind';
      else if (missingIcon.includes('Flerovium')) replacement = 'Wind';
      else if (missingIcon.includes('Nihonium')) replacement = 'Wind';
      else if (missingIcon.includes('Copernicium')) replacement = 'Wind';
      else if (missingIcon.includes('Roentgenium')) replacement = 'Wind';
      else if (missingIcon.includes('Darmstadtium')) replacement = 'Wind';
      else if (missingIcon.includes('Meitnerium')) replacement = 'Wind';
      else if (missingIcon.includes('Hassium')) replacement = 'Wind';
      else if (missingIcon.includes('Bohrium')) replacement = 'Wind';
      else if (missingIcon.includes('Seaborgium')) replacement = 'Wind';
      else if (missingIcon.includes('Dubnium')) replacement = 'Wind';
      else if (missingIcon.includes('Rutherfordium')) replacement = 'Wind';
      else if (missingIcon.includes('Lawrencium')) replacement = 'Wind';
      else if (missingIcon.includes('Nobelium')) replacement = 'Wind';
      else if (missingIcon.includes('Mendelevium')) replacement = 'Wind';
      else if (missingIcon.includes('Fermium')) replacement = 'Wind';
      else if (missingIcon.includes('Einsteinium')) replacement = 'Wind';
      else if (missingIcon.includes('Californium')) replacement = 'Wind';
      else if (missingIcon.includes('Berkelium')) replacement = 'Wind';
      else if (missingIcon.includes('Curium')) replacement = 'Wind';
      else if (missingIcon.includes('Americium')) replacement = 'Wind';
      else if (missingIcon.includes('Plutonium')) replacement = 'Wind';
      else if (missingIcon.includes('Neptunium')) replacement = 'Wind';
      else if (missingIcon.includes('Uranium')) replacement = 'Wind';
      else if (missingIcon.includes('Protactinium')) replacement = 'Wind';
      else if (missingIcon.includes('Thorium')) replacement = 'Wind';
      else if (missingIcon.includes('Actinium')) replacement = 'Wind';
      else if (missingIcon.includes('Radium')) replacement = 'Wind';
      else if (missingIcon.includes('Francium')) replacement = 'Wind';
      else if (missingIcon.includes('Radon')) replacement = 'Wind';
      else if (missingIcon.includes('Astatine')) replacement = 'Wind';
      else if (missingIcon.includes('Polonium')) replacement = 'Wind';
      else if (missingIcon.includes('Bismuth')) replacement = 'Wind';
      else if (missingIcon.includes('Lead')) replacement = 'Wind';
      else if (missingIcon.includes('Thallium')) replacement = 'Wind';
      else if (missingIcon.includes('Mercury')) replacement = 'Wind';
      else if (missingIcon.includes('Gold')) replacement = 'Wind';
      else if (missingIcon.includes('Platinum')) replacement = 'Wind';
      else if (missingIcon.includes('Iridium')) replacement = 'Wind';
      else if (missingIcon.includes('Osmium')) replacement = 'Wind';
      else if (missingIcon.includes('Rhenium')) replacement = 'Wind';
      else if (missingIcon.includes('Tungsten')) replacement = 'Wind';
      else if (missingIcon.includes('Tantalum')) replacement = 'Wind';
      else if (missingIcon.includes('Hafnium')) replacement = 'Wind';
      else if (missingIcon.includes('Lutetium')) replacement = 'Wind';
      else if (missingIcon.includes('Ytterbium')) replacement = 'Wind';
      else if (missingIcon.includes('Thulium')) replacement = 'Wind';
      else if (missingIcon.includes('Erbium')) replacement = 'Wind';
      else if (missingIcon.includes('Holmium')) replacement = 'Wind';
      else if (missingIcon.includes('Dysprosium')) replacement = 'Wind';
      else if (missingIcon.includes('Terbium')) replacement = 'Wind';
      else if (missingIcon.includes('Gadolinium')) replacement = 'Wind';
      else if (missingIcon.includes('Europium')) replacement = 'Wind';
      else if (missingIcon.includes('Samarium')) replacement = 'Wind';
      else if (missingIcon.includes('Promethium')) replacement = 'Wind';
      else if (missingIcon.includes('Neodymium')) replacement = 'Wind';
      else if (missingIcon.includes('Praseodymium')) replacement = 'Wind';
      else if (missingIcon.includes('Cerium')) replacement = 'Wind';
      else if (missingIcon.includes('Lanthanum')) replacement = 'Wind';
      else if (missingIcon.includes('Barium')) replacement = 'Wind';
      else if (missingIcon.includes('Cesium')) replacement = 'Wind';
      else if (missingIcon.includes('Xenon')) replacement = 'Wind';
      else if (missingIcon.includes('Iodine')) replacement = 'Wind';
      else if (missingIcon.includes('Tellurium')) replacement = 'Wind';
      else if (missingIcon.includes('Antimony')) replacement = 'Wind';
      else if (missingIcon.includes('Tin')) replacement = 'Wind';
      else if (missingIcon.includes('Indium')) replacement = 'Wind';
      else if (missingIcon.includes('Cadmium')) replacement = 'Wind';
      else if (missingIcon.includes('Silver')) replacement = 'Wind';
      else if (missingIcon.includes('Palladium')) replacement = 'Wind';
      else if (missingIcon.includes('Rhodium')) replacement = 'Wind';
      else if (missingIcon.includes('Ruthenium')) replacement = 'Wind';
      else if (missingIcon.includes('Technetium')) replacement = 'Wind';
      else if (missingIcon.includes('Molybdenum')) replacement = 'Wind';
      else if (missingIcon.includes('Niobium')) replacement = 'Wind';
      else if (missingIcon.includes('Zirconium')) replacement = 'Wind';
      else if (missingIcon.includes('Yttrium')) replacement = 'Wind';
      else if (missingIcon.includes('Strontium')) replacement = 'Wind';
      else if (missingIcon.includes('Rubidium')) replacement = 'Wind';
      else if (missingIcon.includes('Krypton')) replacement = 'Wind';
      else if (missingIcon.includes('Bromine')) replacement = 'Wind';
      else if (missingIcon.includes('Selenium')) replacement = 'Wind';
      else if (missingIcon.includes('Arsenic')) replacement = 'Wind';
      else if (missingIcon.includes('Germanium')) replacement = 'Wind';
      else if (missingIcon.includes('Gallium')) replacement = 'Wind';
      else if (missingIcon.includes('Zinc')) replacement = 'Wind';
      else if (missingIcon.includes('Copper')) replacement = 'Wind';
      else if (missingIcon.includes('Nickel')) replacement = 'Wind';
      else if (missingIcon.includes('Cobalt')) replacement = 'Wind';
      else if (missingIcon.includes('Iron')) replacement = 'Wind';
      else if (missingIcon.includes('Manganese')) replacement = 'Wind';
      else if (missingIcon.includes('Chromium')) replacement = 'Wind';
      else if (missingIcon.includes('Vanadium')) replacement = 'Wind';
      else if (missingIcon.includes('Titanium')) replacement = 'Wind';
      else if (missingIcon.includes('Scandium')) replacement = 'Wind';
      else if (missingIcon.includes('Calcium')) replacement = 'Wind';
      else if (missingIcon.includes('Potassium')) replacement = 'Wind';
      else if (missingIcon.includes('Argon')) replacement = 'Wind';
      else if (missingIcon.includes('Chlorine')) replacement = 'Wind';
      else if (missingIcon.includes('Sulfur')) replacement = 'Wind';
      else if (missingIcon.includes('Phosphorus')) replacement = 'Wind';
      else if (missingIcon.includes('Silicon')) replacement = 'Wind';
      else if (missingIcon.includes('Aluminum')) replacement = 'Wind';
      else if (missingIcon.includes('Magnesium')) replacement = 'Wind';
      else if (missingIcon.includes('Sodium')) replacement = 'Wind';
      else if (missingIcon.includes('Neon')) replacement = 'Wind';
      else if (missingIcon.includes('Fluorine')) replacement = 'Wind';
      else if (missingIcon.includes('Oxygen')) replacement = 'Wind';
      else if (missingIcon.includes('Nitrogen')) replacement = 'Wind';
      else if (missingIcon.includes('Carbon')) replacement = 'Wind';
      else if (missingIcon.includes('Boron')) replacement = 'Wind';
      else if (missingIcon.includes('Beryllium')) replacement = 'Wind';
      else if (missingIcon.includes('Lithium')) replacement = 'Wind';
      else if (missingIcon.includes('Helium')) replacement = 'Wind';
      else if (missingIcon.includes('Hydrogen')) replacement = 'Wind';
      
      // import 문에서 제거
      const importPattern = new RegExp(`\\s*${missingIcon},\\s*`, 'g');
      if (content.includes(missingIcon + ',')) {
        content = content.replace(importPattern, '');
        modified = true;
        console.log(`✅ ${missingIcon} import 제거됨`);
      }
      
      // ICONS 객체에서 대체
      const iconsPattern = new RegExp(`\\s*${missingIcon.toUpperCase()}:\\s*${missingIcon},`, 'g');
      if (content.includes(`${missingIcon.toUpperCase()}: ${missingIcon}`)) {
        content = content.replace(iconsPattern, `  ${missingIcon.toUpperCase()}: ${replacement},`);
        modified = true;
        console.log(`✅ ${missingIcon.toUpperCase()}: ${missingIcon} → ${replacement}로 변경됨`);
      }
    });
  }
  
  if (modified) {
    fs.writeFileSync(ICONS_FILE, content, 'utf8');
    console.log('🎉 모든 아이콘 수정 완료!');
  } else {
    console.log('ℹ️  수정할 아이콘이 없습니다.');
  }
  
} catch (error) {
  console.error('❌ 오류 발생:', error.message);
}
