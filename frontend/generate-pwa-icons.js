import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Contenido SVG del icono
const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#1e40af;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#3b82f6;stop-opacity:1" />
    </linearGradient>
    <linearGradient id="iconGradient" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" style="stop-color:#ffffff;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#e0e7ff;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="110" fill="url(#bgGradient)"/>
  <g transform="translate(128, 100)">
    <rect x="30" y="40" width="200" height="280" fill="url(#iconGradient)" rx="10"/>
    <rect x="55" y="70" width="40" height="40" fill="#1e40af" rx="5" opacity="0.6"/>
    <rect x="110" y="70" width="40" height="40" fill="#1e40af" rx="5" opacity="0.6"/>
    <rect x="165" y="70" width="40" height="40" fill="#1e40af" rx="5" opacity="0.6"/>
    <rect x="55" y="130" width="40" height="40" fill="#1e40af" rx="5" opacity="0.6"/>
    <rect x="110" y="130" width="40" height="40" fill="#1e40af" rx="5" opacity="0.6"/>
    <rect x="165" y="130" width="40" height="40" fill="#1e40af" rx="5" opacity="0.6"/>
    <rect x="55" y="190" width="40" height="40" fill="#1e40af" rx="5" opacity="0.6"/>
    <rect x="110" y="190" width="40" height="40" fill="#1e40af" rx="5" opacity="0.6"/>
    <rect x="165" y="190" width="40" height="40" fill="#1e40af" rx="5" opacity="0.6"/>
    <rect x="55" y="250" width="40" height="40" fill="#1e40af" rx="5" opacity="0.6"/>
    <rect x="110" y="250" width="40" height="40" fill="#1e40af" rx="5" opacity="0.6"/>
    <rect x="165" y="250" width="40" height="40" fill="#1e40af" rx="5" opacity="0.6"/>
    <rect x="100" y="270" width="60" height="50" fill="#1e40af" rx="5"/>
    <circle cx="220" cy="50" r="35" fill="#10b981"/>
    <path d="M 205 50 L 215 60 L 235 40" stroke="white" stroke-width="6" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
  </g>
</svg>`;

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const publicDir = path.join(__dirname, 'public');

async function generateIcons() {
  console.log('📱 Generando iconos PWA...\n');

  // Asegurar carpeta public
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  // Guardar el SVG base
  const svgPath = path.join(publicDir, 'icon.svg');
  fs.writeFileSync(svgPath, svgContent);
  console.log('✅ icon.svg creado');

  // Generar PNGs
  for (const size of sizes) {
    const output = path.join(publicDir, `icon-${size}x${size}.png`);
    await sharp(Buffer.from(svgContent))
      .resize(size, size)
      .png({ compressionLevel: 9 })
      .toFile(output);
    console.log(`✅ icon-${size}x${size}.png`);
  }

  console.log('\n🎉 Iconos listos en /public.');
  console.log('Ya puedes probar la instalación en móvil (HTTPS o localhost).');
}

generateIcons().catch((err) => {
  console.error('❌ Error generando iconos:', err);
  process.exit(1);
});
