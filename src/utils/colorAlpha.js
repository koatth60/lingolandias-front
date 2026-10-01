// Applies a 2-digit hex alpha (the "18" in `${color}18`) to any CSS colour,
// including theme tokens like rgb(var(--ll-violet)) that can't take a hex suffix.
export const alpha = (color, hex) =>
  `color-mix(in srgb, ${color} ${Math.round((parseInt(hex, 16) / 255) * 100)}%, transparent)`;
