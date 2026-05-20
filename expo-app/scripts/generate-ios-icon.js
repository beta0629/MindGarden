/**
 * Android adaptive icon foreground safe zone(~66%)에 맞춰 iOS 홈 화면 나비 크기를 정렬한다.
 * @see app.config.ts ios.icon
 */
const path = require('path');
const sharp = require('sharp');

const SIZE = 1024;
/** Android adaptive icon mask에서 보이는 중앙 영역 비율 */
const SAFE_ZONE_RATIO = 0.66;

const src = path.join(__dirname, '../assets/images/adaptive-icon.png');
const dest = path.join(__dirname, '../assets/images/icon-ios.png');

async function main() {
  const cropSize = Math.round(SIZE * SAFE_ZONE_RATIO);
  const offset = Math.round((SIZE - cropSize) / 2);

  await sharp(src)
    .extract({ left: offset, top: offset, width: cropSize, height: cropSize })
    .resize(SIZE, SIZE)
    .flatten({ background: '#000000' })
    .png()
    .toFile(dest);

  console.log(`Wrote ${dest} (${SIZE}x${SIZE}, safe zone ${SAFE_ZONE_RATIO})`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
