/**
 * Utilidades para auditoría de contraste en modo oscuro
 * WCAG AA: ratio mínimo 4.5:1 para texto, 3:1 para componentes grandes
 */

/**
 * Calcular luminosidad relativa de un color hex
 * @param {string} hex - Color en formato hex (#RRGGBB)
 * @returns {number} Luminosidad relativa (0-1)
 */
function getLuminance(hex) {
  const rgb = parseInt(hex.slice(1), 16);
  const r = (rgb >> 16) & 0xff;
  const g = (rgb >> 8) & 0xff;
  const b = (rgb >> 0) & 0xff;

  const rs = r / 255;
  const gs = g / 255;
  const bs = b / 255;

  const R = rs <= 0.03928 ? rs / 12.92 : Math.pow((rs + 0.055) / 1.055, 2.4);
  const G = gs <= 0.03928 ? gs / 12.92 : Math.pow((gs + 0.055) / 1.055, 2.4);
  const B = bs <= 0.03928 ? bs / 12.92 : Math.pow((bs + 0.055) / 1.055, 2.4);

  return 0.2126 * R + 0.7152 * G + 0.0722 * B;
}

/**
 * Calcular contraste entre dos colores
 * @param {string} hex1 - Primer color en hex
 * @param {string} hex2 - Segundo color en hex
 * @returns {number} Ratio de contraste (1-21)
 */
export function getContrastRatio(hex1, hex2) {
  const lum1 = getLuminance(hex1);
  const lum2 = getLuminance(hex2);
  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Verificar si el contraste cumple con WCAG AA
 * @param {string} foreground - Color del texto (hex)
 * @param {string} background - Color del fondo (hex)
 * @param {string} level - 'AA' (4.5:1) o 'AAA' (7:1)
 * @returns {boolean} true si cumple
 */
export function meetsWCAGAA(foreground, background, level = 'AA') {
  const ratio = getContrastRatio(foreground, background);
  const minimum = level === 'AAA' ? 7 : 4.5;
  return ratio >= minimum;
}

/**
 * Colores del tema para auditaría
 */
export const THEME_COLORS = {
  light: {
    background: '#FAFAFA',
    text: '#1e293b',
    textSecondary: '#64748b',
  },
  dark: {
    background: '#1e293b',
    text: '#f1f5f9',
    textSecondary: '#cbd5e1',
    cardBg: '#334155',
  },
  components: {
    primary: '#4F46E5',
    success: '#10B981',
    warning: '#F59E0B',
    danger: '#EF4444',
    info: '#06B6D4',
  }
};

/**
 * Auditar contraste de componentes principales
 */
export function auditDarkModeContrast() {
  const audits = [];

  // Texto principal en oscuro
  const mainTextContrast = getContrastRatio(
    THEME_COLORS.dark.text,
    THEME_COLORS.dark.background
  );
  audits.push({
    component: 'Texto Principal',
    foreground: THEME_COLORS.dark.text,
    background: THEME_COLORS.dark.background,
    ratio: mainTextContrast.toFixed(2),
    meetsAA: mainTextContrast >= 4.5,
    meetsAAA: mainTextContrast >= 7,
    status: mainTextContrast >= 7 ? '✅ AAA' : (mainTextContrast >= 4.5 ? '✅ AA' : '❌ Falla'),
  });

  // Texto secundario
  const secondaryTextContrast = getContrastRatio(
    THEME_COLORS.dark.textSecondary,
    THEME_COLORS.dark.background
  );
  audits.push({
    component: 'Texto Secundario',
    foreground: THEME_COLORS.dark.textSecondary,
    background: THEME_COLORS.dark.background,
    ratio: secondaryTextContrast.toFixed(2),
    meetsAA: secondaryTextContrast >= 4.5,
    meetsAAA: secondaryTextContrast >= 7,
    status: secondaryTextContrast >= 4.5 ? '✅ AA' : '❌ Falla',
  });

  // Tarjetas
  const cardTextContrast = getContrastRatio(
    THEME_COLORS.dark.text,
    THEME_COLORS.dark.cardBg
  );
  audits.push({
    component: 'Tarjetas (Texto)',
    foreground: THEME_COLORS.dark.text,
    background: THEME_COLORS.dark.cardBg,
    ratio: cardTextContrast.toFixed(2),
    meetsAA: cardTextContrast >= 4.5,
    meetsAAA: cardTextContrast >= 7,
    status: cardTextContrast >= 4.5 ? '✅ AA' : '❌ Falla',
  });

  // Botón primario
  const primaryButtonContrast = getContrastRatio(
    '#FFFFFF',
    THEME_COLORS.components.primary
  );
  audits.push({
    component: 'Botón Primario',
    foreground: '#FFFFFF',
    background: THEME_COLORS.components.primary,
    ratio: primaryButtonContrast.toFixed(2),
    meetsAA: primaryButtonContrast >= 4.5,
    meetsAAA: primaryButtonContrast >= 7,
    status: primaryButtonContrast >= 4.5 ? '✅ AA' : '❌ Falla',
  });

  return audits;
}

/**
 * Registrar auditoría en consola
 */
export function logContrastAudit() {
  const audits = auditDarkModeContrast();
  
  console.group('🎨 Auditoría de Contraste - Modo Oscuro');
  console.table(audits);
  
  const failures = audits.filter(a => !a.meetsAA);
  if (failures.length > 0) {
    console.warn(`⚠️ ${failures.length} componente(s) no cumple con WCAG AA`);
    failures.forEach(f => {
      console.warn(`  • ${f.component}: ${f.ratio}:1 (mínimo requerido: 4.5:1)`);
    });
  } else {
    console.log('✅ Todos los componentes cumplen con WCAG AA');
  }
  
  console.groupEnd();
}

// Ejecutar auditoría automáticamente en desarrollo
if (process.env.NODE_ENV === 'development') {
  // Esperar a que el DOM esté listo
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', logContrastAudit);
  } else {
    logContrastAudit();
  }
}
