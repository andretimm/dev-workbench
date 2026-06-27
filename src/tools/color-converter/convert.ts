export type ColorResult = { ok: true; hex: string; rgb: string; hsl: string } | { ok: false; error: string };

function rgbToHex(r: number, g: number, b: number): string {
  return "#" + [r, g, b].map((c) => Math.round(c).toString(16).padStart(2, "0")).join("");
}

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  const rn = r / 255, gn = g / 255, bn = b / 255;
  const max = Math.max(rn, gn, bn), min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, Math.round(l * 100)];

  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h: number;
  if (max === rn) h = ((gn - bn) / d + (gn < bn ? 6 : 0)) * 60;
  else if (max === gn) h = ((bn - rn) / d + 2) * 60;
  else h = ((rn - gn) / d + 4) * 60;

  return [Math.round(h), Math.round(s * 100), Math.round(l * 100)];
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  const sn = s / 100, ln = l / 100;
  const c = (1 - Math.abs(2 * ln - 1)) * sn;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = ln - c / 2;
  let r: number, g: number, b: number;

  if (h < 60) [r, g, b] = [c, x, 0];
  else if (h < 120) [r, g, b] = [x, c, 0];
  else if (h < 180) [r, g, b] = [0, c, x];
  else if (h < 240) [r, g, b] = [0, x, c];
  else if (h < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];

  return [(r + m) * 255, (g + m) * 255, (b + m) * 255];
}

function buildResult(r: number, g: number, b: number): ColorResult {
  const [h, s, l] = rgbToHsl(r, g, b);
  return {
    ok: true,
    hex: rgbToHex(r, g, b),
    rgb: `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`,
    hsl: `hsl(${h}, ${s}%, ${l}%)`,
  };
}

export function parseColor(input: string): ColorResult {
  const trimmed = input.trim();

  const hexMatch = trimmed.match(/^#?([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (hexMatch) {
    let hex = hexMatch[1];
    if (hex.length === 3) hex = hex.split("").map((c) => c + c).join("");
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    return buildResult(r, g, b);
  }

  const rgbMatch = trimmed.match(/^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*[\d.]+\s*)?\)$/i);
  if (rgbMatch) {
    const [r, g, b] = rgbMatch.slice(1, 4).map(Number);
    if ([r, g, b].some((c) => c > 255)) {
      return { ok: false, error: "RGB components must be between 0 and 255" };
    }
    return buildResult(r, g, b);
  }

  const hslMatch = trimmed.match(/^hsla?\(\s*(\d+)\s*,\s*(\d+)%\s*,\s*(\d+)%\s*(?:,\s*[\d.]+\s*)?\)$/i);
  if (hslMatch) {
    const [h, s, l] = hslMatch.slice(1, 4).map(Number);
    if (h > 360 || s > 100 || l > 100) {
      return { ok: false, error: "Hue must be 0-360 and saturation/lightness must be 0-100%" };
    }
    const [r, g, b] = hslToRgb(h, s, l);
    return buildResult(r, g, b);
  }

  return { ok: false, error: "Unrecognized color format — use HEX (#rrggbb), rgb(r, g, b), or hsl(h, s%, l%)" };
}
