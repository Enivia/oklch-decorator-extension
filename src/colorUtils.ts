import { oklch, formatRgb } from "culori";

export interface OKLCHColor {
  l: number;
  c: number;
  h: number;
  alpha?: number;
}

// 更新正则表达式以支持百分比形式的 alpha 值
const oklchRegex = /oklch\(\s*([0-9.]+%?)\s+([0-9.]+)\s+([0-9.]+)\s*(?:\/\s*([0-9.]+%?)\s*)?\)/i;

export function parseOKLCH(colorStr: string): OKLCHColor | null {
  // 重置正则表达式的 lastIndex
  oklchRegex.lastIndex = 0;

  const match = oklchRegex.exec(colorStr);
  if (!match) {
    console.log("No match for color string:", colorStr);
    return null;
  }

  const [_, l, c, h, a] = match;

  // 处理百分比和小数形式的亮度值
  const lightness = parseFloat(l);
  const chroma = parseFloat(c);
  const hue = parseFloat(h);

  return {
    l: l.endsWith("%") ? lightness / 100 : Math.max(0, Math.min(1, lightness)),
    c: chroma,
    h: hue,
    alpha: a ? (a.endsWith("%") ? parseFloat(a) / 100 : parseFloat(a)) : 1,
  };
}

export function oklchToRGB(color: OKLCHColor): string {
  try {
    const rgb = oklch({
      mode: "oklch",
      l: color.l,
      c: color.c,
      h: color.h,
      alpha: color.alpha,
    });

    const result = formatRgb(rgb);
    console.log("RGB result:", result);
    return result;
  } catch (error) {
    console.error("Error converting to RGB:", error);
    return "rgba(0, 0, 0, 0)"; // 转换失败时返回透明黑色
  }
}
