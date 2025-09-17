export type UnitSystem = 'kg' | 'lbs';

const KG_TO_LBS = 2.2046226218;

export function convertKgToUnit(kg: number, unit: UnitSystem): number {
  if (!kg) return 0;
  return unit === 'lbs' ? kg * KG_TO_LBS : kg;
}

export function convertUnitToKg(value: number, unit: UnitSystem): number {
  if (!value) return 0;
  return unit === 'lbs' ? value / KG_TO_LBS : value;
}

interface FormatOptions {
  decimals?: number;
  trimZero?: boolean;
}

export function formatWeight(kg: number, unit: UnitSystem, opts: FormatOptions = {}): string {
  const { decimals = unit === 'lbs' ? 0 : 0, trimZero = true } = opts;
  const converted = convertKgToUnit(kg, unit);
  const fixed = converted.toFixed(decimals);
  const value = trimZero && decimals > 0 ? fixed.replace(/\.0+$/, '') : fixed;
  return `${value} ${unit}`;
}

export function formatWeightList(kgListCSV: string | null | undefined, unit: UnitSystem, opts: FormatOptions = {}): string {
  if (!kgListCSV) return '';
  return kgListCSV
    .split(',')
    .map(w => parseFloat(w.trim()))
    .filter(n => !isNaN(n))
    .map(n => formatWeight(n, unit, opts).replace(` ${unit}`, '')) // remove suffix for inline list
    .join(', ');
}

export function convertTotalVolume(kg: number, unit: UnitSystem): number {
  return Math.round(convertKgToUnit(kg, unit));
}
