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

export const PHOTO_PRESETS = [
  { label: 'Mountains',       id: '1506905925346-21bda4d32df4' },
  { label: 'Aurora',          id: '1531366936337-7c912a4589a7' },
  { label: 'Forest Path',     id: '1448375240586-882707db888b' },
  { label: 'Night Sky',       id: '1519681393784-d120267933ba' },
  { label: 'Ocean Wave',      id: '1505118380757-91f5f5632de0' },
  { label: 'Desert Dunes',    id: '1509316785289-025f5b846b35' },
  { label: 'City Lights',     id: '1477959858617-67f85cf4f1df' },
  { label: 'Misty Lake',      id: '1477346611705-65d1883cee1e' },
  { label: 'Abstract Purple', id: '1557682250-33bd709cbe85' },
  { label: 'Abstract Blue',   id: '1557682224-5b8590cd9ec5' },
  { label: 'Colorful Smoke',  id: '1541701494587-cb58502866ab' },
  { label: 'Neon Lights',     id: '1533134242443-d4fd215305ad' },
  { label: 'Flower Field',    id: '1490750967868-88df5691cc59' },
  { label: 'Snowy Peaks',     id: '1464822759023-fed622ff2c3b' },
  { label: 'Tropical Beach',  id: '1507525428034-b723cf961d3e' },
  { label: 'Autumn Forest',   id: '1507003211169-0a1dd7228f2d' },
];

// Convert stored background string to CSS background property
export const getBgStyle = (bg) => {
  if (!bg) return { background: '#0079BF' };
  if (bg.startsWith('http') || bg.startsWith('/')) {
    return { background: `url(${bg}) center/cover no-repeat` };
  }
  return { background: bg };
};
