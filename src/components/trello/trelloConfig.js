// Shared constants and utilities for the Trello 2.0 components

export const BACKGROUND_PRESETS = [
  { label: 'Ocean Blue', value: '#0079BF' },
  { label: 'Grape', value: '#9E2FD0' },
  { label: 'Midnight', value: '#1a1a2e' },
  { label: 'Forest', value: '#26D9A1' },
  { label: 'Sunset', value: '#F6B82E' },
  { label: 'Rose', value: '#E91E8C' },
  { label: 'Purple Rain', value: 'linear-gradient(135deg,#667eea 0%,#764ba2 100%)' },
  { label: 'Peach', value: 'linear-gradient(135deg,#f6d365 0%,#fda085 100%)' },
  { label: 'Ocean Wave', value: 'linear-gradient(135deg,#4facfe 0%,#00f2fe 100%)' },
  { label: 'Emerald', value: 'linear-gradient(135deg,#43e97b 0%,#38f9d7 100%)' },
  { label: 'Dusk', value: 'linear-gradient(135deg,#fa709a 0%,#fee140 100%)' },
  { label: 'Amethyst', value: 'linear-gradient(135deg,#a18cd1 0%,#fbc2eb 100%)' },
  { label: 'Crimson', value: 'linear-gradient(135deg,#ff9a9e 0%,#fad0c4 100%)' },
  { label: 'Deep Space', value: 'linear-gradient(135deg,#0c3483 0%,#a2b6df 100%)' },
  { label: 'Firestorm', value: 'linear-gradient(135deg,#f093fb 0%,#f5576c 100%)' },
  { label: 'Twilight', value: 'linear-gradient(135deg,#89f7fe 0%,#66a6ff 100%)' },
  { label: 'Midnight City', value: 'linear-gradient(135deg,#232526 0%,#414345 100%)' },
  { label: 'Aurora', value: 'linear-gradient(135deg,#00b4db 0%,#0083b0 100%)' },
];

export const FONT_OPTIONS = [
  { label: 'Inter (Default)', value: 'Inter, sans-serif' },
  { label: 'Roboto', value: 'Roboto, sans-serif' },
  { label: 'Poppins', value: 'Poppins, sans-serif' },
  { label: 'Playfair Display', value: "'Playfair Display', serif" },
  { label: 'Merriweather', value: 'Merriweather, serif' },
  { label: 'Source Code Pro', value: "'Source Code Pro', monospace" },
  { label: 'Lato', value: 'Lato, sans-serif' },
  { label: 'Raleway', value: 'Raleway, sans-serif' },
  { label: 'Montserrat', value: 'Montserrat, sans-serif' },
  { label: 'Georgia', value: 'Georgia, serif' },
];

// Convert stored background string to CSS background property
export const getBgStyle = (bg) => {
  if (!bg) return { background: '#0079BF' };
  if (bg.startsWith('http') || bg.startsWith('/')) {
    return { background: `url(${bg}) center/cover no-repeat` };
  }
  return { background: bg };
};
