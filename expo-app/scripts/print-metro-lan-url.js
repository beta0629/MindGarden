#!/usr/bin/env node
/**
 * 같은 Wi-Fi의 기기에서 Metro에 붙을 때 쓸 LAN URL을 출력한다.
 * `npm run start:lan` 실행 후, 휴대폰 개발자 메뉴에서 이 주소를 입력한다.
 */
const os = require('os');

const port = process.env.RCT_METRO_PORT || process.env.EXPO_METRO_PORT || '8081';

function pickLanIPv4() {
  const nets = os.networkInterfaces();
  const candidates = [];
  for (const name of Object.keys(nets)) {
    for (const net of nets[name] || []) {
      if (net.family !== 'IPv4' || net.internal) continue;
      candidates.push({ name, address: net.address });
    }
  }
  // en0(맥 이더넷/Wi-Fi) 우선, 그다음 첫 비루프백
  const en0 = candidates.find((c) => c.name === 'en0');
  return en0?.address ?? candidates[0]?.address ?? null;
}

const ip = pickLanIPv4();
if (!ip) {
  console.error('LAN IPv4를 찾지 못했습니다. Wi-Fi/이더넷 연결을 확인하세요.');
  process.exit(1);
}

const url = `http://${ip}:${port}`;
console.log('');
console.log('Metro(Expo) LAN URL:', url);
console.log('');
console.log('다음 순서:');
console.log('  1) PC와 휴대폰이 같은 Wi-Fi에 연결');
console.log('  2) 터미널에서 아래만 입력 (뒤에 # 설명 붙이거나 package.json에 # 넣지 마세요):');
console.log('       npm run start:lan');
console.log('  3) 앱에서 개발자 메뉴 → "Change bundle location" / "Debug server host" 등에 위 URL 입력');
console.log('  4) 안 되면 방화벽에서 Node(8081) 허용');
console.log('');
