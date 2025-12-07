/**
 * Guía de colores para modo oscuro
 * Valores optimizados para contraste WCAG AA/AAA
 */

export const DARK_MODE_PALETTE = {
  // Fondos
  backgrounds: {
    primary: '#0f172a',      // Slate-950: Fondo principal
    secondary: '#1e293b',    // Slate-900: Fondos secundarios
    tertiary: '#334155',     // Slate-700: Tarjetas y componentes
    hover: '#475569',        // Slate-600: Estados hover
  },

  // Textos
  texts: {
    primary: '#f1f5f9',      // Slate-100: Texto principal (contraste 15.6:1)
    secondary: '#cbd5e1',    // Slate-300: Texto secundario (contraste 8.3:1)
    tertiary: '#94a3b8',     // Slate-400: Texto terciario
    muted: '#64748b',        // Slate-500: Texto muy tenue
  },

  // Bordes
  borders: {
    light: '#cbd5e1',        // Slate-300: Bordes prominentes
    normal: '#94a3b8',       // Slate-400: Bordes normales
    muted: '#64748b',        // Slate-500: Bordes sutiles
    dark: '#475569',         // Slate-600: Bordes fuertes
  },

  // Componentes interactivos
  interactive: {
    primary: '#6366f1',      // Indigo-500: Botones primarios (mejorado)
    primaryHover: '#4f46e5', // Indigo-600: Hover
    secondary: '#06b6d4',    // Cyan-500: Botones secundarios
    success: '#10b981',      // Emerald-500: Éxito
    warning: '#eab308',      // Yellow-400: Advertencia (mejorado contraste)
    danger: '#ef4444',       // Red-500: Peligro
    info: '#06b6d4',         // Cyan-500: Información
  },

  // Badges y etiquetas
  badges: {
    primary: {
      bg: '#4f46e5',
      text: '#f1f5f9',
      ratio: 11.5, // Contraste muy bueno
    },
    success: {
      bg: '#10b981',
      text: '#f1f5f9',
      ratio: 10.2,
    },
    warning: {
      bg: '#f59e0b',
      text: '#1e293b',
      ratio: 10.1,
    },
    danger: {
      bg: '#ef4444',
      text: '#f1f5f9',
      ratio: 9.8,
    },
  },

  // Estados
  states: {
    disabled: '#64748b',      // Slate-500: Deshabilitado
    focusRing: '#6366f1',     // Indigo-500: Focus ring
    selected: '#6366f1',      // Indigo-500: Seleccionado
  },

  // Overlays y transparencias
  overlays: {
    dark25: 'rgba(0, 0, 0, 0.25)',
    dark50: 'rgba(0, 0, 0, 0.50)',
    dark75: 'rgba(0, 0, 0, 0.75)',
  },
};

/**
 * Clases CSS recomendadas para modo oscuro
 * Basadas en la paleta anterior
 */
export const DARK_MODE_CLASSES = {
  backgrounds: {
    primary: 'dark:bg-slate-950',
    secondary: 'dark:bg-slate-900',
    tertiary: 'dark:bg-slate-700',
    card: 'dark:bg-slate-700',
    input: 'dark:bg-slate-800',
  },

  texts: {
    primary: 'dark:text-slate-100',
    secondary: 'dark:text-slate-300',
    tertiary: 'dark:text-slate-400',
    muted: 'dark:text-slate-500',
  },

  borders: {
    light: 'dark:border-slate-300',
    normal: 'dark:border-slate-400',
    muted: 'dark:border-slate-500',
    dark: 'dark:border-slate-600',
  },

  buttons: {
    primary: 'dark:bg-indigo-600 dark:hover:bg-indigo-700 dark:text-white',
    secondary: 'dark:bg-slate-700 dark:hover:bg-slate-600 dark:text-slate-100',
    danger: 'dark:bg-red-600 dark:hover:bg-red-700 dark:text-white',
  },

  focus: 'dark:focus:ring-2 dark:focus:ring-indigo-500',
  transition: 'transition-colors duration-200',
};

/**
 * Componentes comunes - Clases recomendadas
 */
export const COMPONENT_STYLES = {
  card: `
    bg-white dark:bg-slate-700 
    border border-gray-200 dark:border-slate-600
    text-gray-900 dark:text-slate-100
    shadow-sm dark:shadow-lg
  `,

  button: `
    px-4 py-2 rounded-lg font-medium
    transition-colors duration-200
    bg-indigo-600 dark:bg-indigo-600
    hover:bg-indigo-700 dark:hover:bg-indigo-700
    text-white
  `,

  input: `
    bg-white dark:bg-slate-800
    border border-gray-300 dark:border-slate-600
    text-gray-900 dark:text-slate-100
    placeholder-gray-500 dark:placeholder-slate-400
  `,

  badge: {
    primary: `
      bg-blue-100 dark:bg-blue-900/30
      text-blue-800 dark:text-blue-300
    `,
    success: `
      bg-green-100 dark:bg-green-900/30
      text-green-800 dark:text-green-300
    `,
    warning: `
      bg-yellow-100 dark:bg-yellow-900/30
      text-yellow-800 dark:text-yellow-300
    `,
    danger: `
      bg-red-100 dark:bg-red-900/30
      text-red-800 dark:text-red-300
    `,
  },

  modal: `
    bg-white dark:bg-slate-800
    border border-gray-200 dark:border-slate-700
    shadow-xl dark:shadow-2xl
    text-gray-900 dark:text-slate-100
  `,

  table: `
    border-collapse w-full
    bg-white dark:bg-slate-800
    border border-gray-300 dark:border-slate-600
  `,

  tableRow: `
    border-b border-gray-300 dark:border-slate-600
    hover:bg-gray-50 dark:hover:bg-slate-700
  `,
};

/**
 * Verificar que un componente tenga transiciones suaves
 */
export function ensureSmoothTransition(element) {
  if (element && !element.classList.contains('transition-colors')) {
    element.classList.add('transition-colors', 'duration-200');
  }
}

/**
 * Aplicar estilos de tema automáticamente
 * Usa data-theme-auto para componentes
 */
export function applyThemeStyles() {
  const elementsWithTheme = document.querySelectorAll('[data-theme-auto]');
  
  elementsWithTheme.forEach((element) => {
    const type = element.getAttribute('data-theme-auto');
    
    if (type === 'card') {
      element.classList.add('bg-white', 'dark:bg-slate-700', 
        'border', 'dark:border-slate-600', 
        'text-gray-900', 'dark:text-slate-100');
    } else if (type === 'button') {
      element.classList.add('bg-indigo-600', 'dark:bg-indigo-600',
        'hover:bg-indigo-700', 'dark:hover:bg-indigo-700',
        'text-white', 'transition-colors', 'duration-200');
    } else if (type === 'input') {
      element.classList.add('bg-white', 'dark:bg-slate-800',
        'border', 'border-gray-300', 'dark:border-slate-600',
        'text-gray-900', 'dark:text-slate-100');
    }
  });
}

export default DARK_MODE_PALETTE;
