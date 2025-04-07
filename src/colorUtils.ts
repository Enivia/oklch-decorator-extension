export interface OKLCHColor {
  l: number; // 亮度，0-1 范围
  c: number; // 彩度
  h: number; // 色相，角度
  alpha?: number; // 透明度，0-1 范围
}

// 更新正则表达式以支持百分比形式的 alpha 值
const oklchRegex = /oklch\(\s*([0-9.]+%?)\s+([0-9.]+)\s+([0-9.]+)\s*(?:\/\s*([0-9.]+%?)\s*)?\)/i;

// 解析 OKLCH 颜色字符串
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

// OKLCH 转换为 Oklab
function oklchToOklab(oklch: OKLCHColor): { l: number; a: number; b: number; alpha?: number } {
  const { l, c, h, alpha } = oklch;

  // 将 h 角度转换为弧度
  const hRad = (h * Math.PI) / 180;

  // 使用三角函数计算 a 和 b 分量
  const a = c * Math.cos(hRad);
  const b = c * Math.sin(hRad);

  return { l, a, b, alpha };
}

// Oklab 转换为线性 RGB
function oklabToLinearRGB(lab: { l: number; a: number; b: number; alpha?: number }): {
  r: number;
  g: number;
  b: number;
  alpha?: number;
} {
  const { l, a, b, alpha } = lab;

  // Oklab 到 LMS 的转换矩阵
  const l_ = l + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = l - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = l - 0.0894841775 * a - 1.291485548 * b;

  // LMS 到 线性RGB 的转换
  const l_3 = l_ * l_ * l_;
  const m_3 = m_ * m_ * m_;
  const s_3 = s_ * s_ * s_;

  // LMS^3 到线性 RGB 的转换矩阵
  const r = +4.0767416621 * l_3 - 3.3077115913 * m_3 + 0.2309699292 * s_3;
  const g = -1.2684380046 * l_3 + 2.6097574011 * m_3 - 0.3413193965 * s_3;
  const b_value = -0.0041960863 * l_3 - 0.7034186147 * m_3 + 1.707614701 * s_3;

  // 确保结果在合理范围内
  return {
    r: Math.max(0, Math.min(1, r)),
    g: Math.max(0, Math.min(1, g)),
    b: Math.max(0, Math.min(1, b_value)),
    alpha,
  };
}

// 线性 RGB 转换为 sRGB
function linearRGBToSRGB(rgb: { r: number; g: number; b: number; alpha?: number }): {
  r: number;
  g: number;
  b: number;
  alpha?: number;
} {
  const { r, g, b, alpha } = rgb;

  // 线性RGB到sRGB的转换（伽玛校正）
  const gammaCorrect = (x: number): number => {
    return x <= 0.0031308 ? 12.92 * x : 1.055 * Math.pow(x, 1 / 2.4) - 0.055;
  };

  return {
    r: Math.round(gammaCorrect(r) * 255),
    g: Math.round(gammaCorrect(g) * 255),
    b: Math.round(gammaCorrect(b) * 255),
    alpha,
  };
}

// OKLCH 转 RGB
export function oklchToRGB(color: OKLCHColor): string {
  try {
    // OKLCH -> Oklab -> Linear RGB -> sRGB 转换链
    const oklab = oklchToOklab(color);
    const linearRgb = oklabToLinearRGB(oklab);
    const srgb = linearRGBToSRGB(linearRgb);

    // 格式化为 RGB 字符串
    if (srgb.alpha !== undefined && srgb.alpha < 1) {
      return `rgba(${srgb.r}, ${srgb.g}, ${srgb.b}, ${srgb.alpha.toFixed(2)})`;
    } else {
      return `rgb(${srgb.r}, ${srgb.g}, ${srgb.b})`;
    }
  } catch (error) {
    console.error("Error converting to RGB:", error);
    return "rgba(0, 0, 0, 0)"; // 转换失败时返回透明黑色
  }
}

// RGB 转 HEX
function rgbToHex(r: number, g: number, b: number, a?: number): string {
  // 将 RGB 值转为 16 进制字符串
  const toHex = (value: number) => {
    const hex = Math.max(0, Math.min(255, Math.round(value))).toString(16);
    return hex.length === 1 ? "0" + hex : hex;
  };

  const hex = `#${toHex(r)}${toHex(g)}${toHex(b)}`;

  // 如果有透明度并且不是 1，添加 alpha 值
  if (a !== undefined && a < 1) {
    const alphaHex = toHex(Math.round(a * 255));
    return `${hex}${alphaHex}`;
  }

  return hex;
}

// OKLCH 转 HEX
export function oklchToHex(color: OKLCHColor): string {
  try {
    // OKLCH -> Oklab -> Linear RGB -> sRGB 转换链
    const oklab = oklchToOklab(color);
    const linearRgb = oklabToLinearRGB(oklab);
    const srgb = linearRGBToSRGB(linearRgb);

    // RGB 转 HEX
    return rgbToHex(srgb.r, srgb.g, srgb.b, srgb.alpha);
  } catch (error) {
    console.error("Error converting to HEX:", error);
    return "#00000000"; // 转换失败时返回透明黑色
  }
}

// RGB 转 HSL
function rgbToHsl(
  r: number,
  g: number,
  b: number,
  alpha?: number
): { h: number; s: number; l: number; alpha?: number } {
  // 归一化 RGB 值到 [0, 1] 范围
  const rNorm = r / 255;
  const gNorm = g / 255;
  const bNorm = b / 255;

  const max = Math.max(rNorm, gNorm, bNorm);
  const min = Math.min(rNorm, gNorm, bNorm);
  const delta = max - min;

  // 初始化 HSL 值
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  // 计算饱和度和色相
  if (delta > 0) {
    s = l > 0.5 ? delta / (2 - max - min) : delta / (max + min);

    // 根据哪个颜色是最大值来计算色相
    if (max === rNorm) {
      h = ((gNorm - bNorm) / delta) % 6;
    } else if (max === gNorm) {
      h = (bNorm - rNorm) / delta + 2;
    } else {
      h = (rNorm - gNorm) / delta + 4;
    }

    h = Math.round(h * 60); // 转为角度
    if (h < 0) h += 360;
  }

  return { h, s, l, alpha };
}

// OKLCH 转 HSL
export function oklchToHsl(color: OKLCHColor): string {
  try {
    // OKLCH -> Oklab -> Linear RGB -> sRGB -> HSL 转换链
    const oklab = oklchToOklab(color);
    const linearRgb = oklabToLinearRGB(oklab);
    const srgb = linearRGBToSRGB(linearRgb);
    const hsl = rgbToHsl(srgb.r, srgb.g, srgb.b, srgb.alpha);

    // 格式化为 HSL 字符串
    const sPercent = Math.round(hsl.s * 100);
    const lPercent = Math.round(hsl.l * 100);

    if (hsl.alpha !== undefined && hsl.alpha < 1) {
      return `hsla(${hsl.h}deg, ${sPercent}%, ${lPercent}%, ${hsl.alpha.toFixed(2)})`;
    } else {
      return `hsl(${hsl.h}deg, ${sPercent}%, ${lPercent}%)`;
    }
  } catch (error) {
    console.error("Error converting to HSL:", error);
    return "hsla(0deg, 0%, 0%, 0)"; // 转换失败时返回透明黑色
  }
}

// HSL 转 HWB
function hslToHwb(
  h: number,
  s: number,
  l: number,
  alpha?: number
): { h: number; w: number; b: number; alpha?: number } {
  // HSL -> HSV 转换
  let v, sv;
  if (l <= 0.5) {
    sv = s * (1 + (2 * l - 1));
    v = l * (1 + sv);
  } else {
    sv = s * (1 - (2 * l - 1));
    v = l + sv - l * sv;
  }

  if (v === 0) {
    return { h, w: 0, b: 1, alpha };
  }

  // HSV -> HWB 转换
  const w = (1 - sv) * v;
  const b = 1 - v;

  return { h, w, b, alpha };
}

// OKLCH 转 HWB
export function oklchToHwb(color: OKLCHColor): string {
  try {
    // OKLCH -> Oklab -> Linear RGB -> sRGB -> HSL -> HWB 转换链
    const oklab = oklchToOklab(color);
    const linearRgb = oklabToLinearRGB(oklab);
    const srgb = linearRGBToSRGB(linearRgb);
    const hsl = rgbToHsl(srgb.r, srgb.g, srgb.b, srgb.alpha);
    const hwb = hslToHwb(hsl.h, hsl.s, hsl.l, hsl.alpha);

    // 格式化为 HWB 字符串
    const wPercent = Math.round(hwb.w * 100);
    const bPercent = Math.round(hwb.b * 100);

    if (hwb.alpha !== undefined && hwb.alpha < 1) {
      return `hwb(${hwb.h}deg ${wPercent}% ${bPercent}% / ${hwb.alpha.toFixed(2)})`;
    } else {
      return `hwb(${hwb.h}deg ${wPercent}% ${bPercent}%)`;
    }
  } catch (error) {
    console.error("Error converting to HWB:", error);
    return "hwb(0deg 0% 100% / 0)"; // 转换失败时返回透明黑色
  }
}
