import fs from 'fs/promises';
import path from 'path';
import sharp from 'sharp';

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const publicDir = path.join(process.cwd(), 'public');
const svgPath = path.join(publicDir, 'icon.svg');

async function main() {
  try {
    const svg = await fs.readFile(svgPath);

    await Promise.all(
      sizes.map(async (size) => {
        const outPath = path.join(publicDir, `icon-${size}x${size}.png`);
        await sharp(svg, { density: size * 2 })
          .resize(size, size)
          .png({ compressionLevel: 9, adaptiveFiltering: true })
          .toFile(outPath);
        console.log(`✅ icon-${size}x${size}.png`);
      })
    );

    // Favicon 32x32
    const faviconPath = path.join(publicDir, 'favicon.ico');
    await sharp(svg, { density: 128 })
      .resize(32, 32)
      .toFile(faviconPath);
    console.log('✅ favicon.ico');

    console.log('\n✨ Iconos generados en /public');
  } catch (err) {
    console.error('❌ Error generando iconos:', err);
    process.exit(1);
  }
}

main();
